const { db } = require("../db");

/**
 * Normalizes phone numbers by removing spaces, dashes, +91, leading 0.
 * Returns clean digits string.
 */
const normalizePhone = (phone) => {
  if (!phone) return "";
  let clean = String(phone).replace(/\D/g, "");
  if (clean.length > 10 && clean.startsWith("91")) {
    clean = clean.slice(2);
  }
  if (clean.length > 10 && clean.startsWith("0")) {
    clean = clean.slice(1);
  }
  return clean;
};

/**
 * Builds reusable SQL WHERE fragments, JOIN clauses, and parameter arrays
 * based on user role and organization.
 * 
 * @param {Object} user - Authenticated user from req.user (staff_id, staff_role, staff_org_id)
 * @param {Object} [options] - Additional query flags (e.g., targetOrgId, alias)
 * @returns {Object} { whereClause: string, params: Array, joinClause: string }
 */
const buildVisibilityWhere = (user, options = {}) => {
  const role = (user?.staff_role || "").toLowerCase();
  const staffId = user?.staff_id;
  const orgId = user?.staff_org_id;
  const leadAlias = options.leadAlias || "leads";
  const laAlias = options.laAlias || "la";

  // Default fallback if user is missing
  if (!user || !role) {
    return {
      whereClause: "1 = 0",
      params: [],
      joinClause: "",
    };
  }

  // SuperAdmin
  // TODO: SuperAdmin scope decision pending (org-wide vs system-wide).
  // Currently defaults to org-scoped if options.orgId provided, else user's org.
  if (role === "superadmin") {
    const effectiveOrgId = options.orgId || orgId;
    if (effectiveOrgId) {
      return {
        whereClause: `${leadAlias}.lead_org_id = ?`,
        params: [effectiveOrgId],
        joinClause: "",
      };
    }
    return {
      whereClause: "1 = 1",
      params: [],
      joinClause: "",
    };
  }

  // Admin: Can view all leads within their own organization
  if (role === "admin") {
    return {
      whereClause: `${leadAlias}.lead_org_id = ?`,
      params: [orgId],
      joinClause: "",
    };
  }

  // Employee:
  // Visible if:
  // 1. Created by this employee (created_by = staff_id)
  // OR
  // 2. Assigned / shared with this employee in lead_assignees
  // Note: NULL created_by rows are NOT visible to employees unless explicitly assigned.
  if (role === "employee") {
    return {
      whereClause: `${leadAlias}.lead_org_id = ? AND (${leadAlias}.created_by = ? OR ${laAlias}.staff_id = ?)`,
      params: [orgId, staffId, staffId],
      joinClause: `LEFT JOIN lead_assignees ${laAlias} ON ${laAlias}.lead_id = ${leadAlias}.lead_id AND ${laAlias}.staff_id = ?`,
      joinParams: [staffId],
    };
  }

  return {
    whereClause: "1 = 0",
    params: [],
    joinClause: "",
  };
};

/**
 * Helper to fetch a lead by ID
 */
const fetchLeadById = (leadId) => {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM leads WHERE lead_id = ?", [leadId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows && rows.length > 0 ? rows[0] : null);
    });
  });
};

/**
 * Check if user has permission to access / view a specific lead
 * @param {Object} user - req.user
 * @param {number|Object} leadOrId - lead_id or lead row object
 */
const canAccessLead = async (user, leadOrId) => {
  if (!user) return { allowed: false, reason: "Unauthenticated" };
  const role = (user.staff_role || "").toLowerCase();
  const staffId = user.staff_id;
  const orgId = user.staff_org_id;

  const lead = typeof leadOrId === "object" && leadOrId !== null
    ? leadOrId
    : await fetchLeadById(leadOrId);

  if (!lead) return { allowed: false, reason: "Lead not found" };

  // SuperAdmin
  // TODO: SuperAdmin scope check
  if (role === "superadmin") {
    return { allowed: true, lead };
  }

  // Must match organization
  if (lead.lead_org_id !== orgId) {
    return { allowed: false, reason: "Organization mismatch", lead };
  }

  // Admin has access to all leads in own org
  if (role === "admin") {
    return { allowed: true, lead };
  }

  // Employee check: creator OR assigned in lead_assignees
  if (role === "employee") {
    if (lead.created_by && Number(lead.created_by) === Number(staffId)) {
      return { allowed: true, lead };
    }

    // Check junction table
    const assigneeRow = await new Promise((resolve, reject) => {
      db.query(
        "SELECT id, access_type FROM lead_assignees WHERE lead_id = ? AND staff_id = ?",
        [lead.lead_id, staffId],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows && rows.length > 0 ? rows[0] : null);
        }
      );
    });

    if (assigneeRow) {
      return { allowed: true, lead, access_type: assigneeRow.access_type };
    }

    return { allowed: false, reason: "Not assigned or shared with this employee", lead };
  }

  return { allowed: false, reason: "Access denied", lead };
};

/**
 * Check if user can delete a lead.
 * Rules: Creator employee, Admin, or SuperAdmin.
 */
const canDeleteLead = async (user, leadOrId) => {
  if (!user) return { allowed: false, reason: "Unauthenticated" };
  const role = (user.staff_role || "").toLowerCase();
  const staffId = user.staff_id;
  const orgId = user.staff_org_id;

  const lead = typeof leadOrId === "object" && leadOrId !== null
    ? leadOrId
    : await fetchLeadById(leadOrId);

  if (!lead) return { allowed: false, reason: "Lead not found" };

  if (role === "superadmin") {
    return { allowed: true, lead };
  }

  if (lead.lead_org_id !== orgId) {
    return { allowed: false, reason: "Organization mismatch", lead };
  }

  if (role === "admin") {
    return { allowed: true, lead };
  }

  // Employee can ONLY delete if they are the creator of the lead
  if (role === "employee") {
    if (lead.created_by && Number(lead.created_by) === Number(staffId)) {
      return { allowed: true, lead };
    }
    return { allowed: false, reason: "Only the lead creator can delete this lead", lead };
  }

  return { allowed: false, reason: "Access denied", lead };
};

/**
 * Check if user can share a lead.
 * Rules: employee AND created_by = self AND org match.
 * (Admin-assigned employee cannot share; only lead creator employee can share).
 */
const canShare = async (user, leadOrId) => {
  if (!user) return { allowed: false, reason: "Unauthenticated" };
  const role = (user.staff_role || "").toLowerCase();
  const staffId = user.staff_id;
  const orgId = user.staff_org_id;

  const lead = typeof leadOrId === "object" && leadOrId !== null
    ? leadOrId
    : await fetchLeadById(leadOrId);

  if (!lead) return { allowed: false, reason: "Lead not found" };

  if (role !== "employee") {
    return { allowed: false, reason: "Only employees can share leads (Admin uses assign)", lead };
  }

  if (lead.lead_org_id !== orgId) {
    return { allowed: false, reason: "Organization mismatch", lead };
  }

  if (!lead.created_by || Number(lead.created_by) !== Number(staffId)) {
    return { allowed: false, reason: "Only the lead creator can share this lead", lead };
  }

  return { allowed: true, lead };
};

module.exports = {
  normalizePhone,
  buildVisibilityWhere,
  canAccessLead,
  canDeleteLead,
  canShare,
  fetchLeadById,
};

