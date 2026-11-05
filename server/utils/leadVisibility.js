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

  // SuperAdmin: Option A: Global visibility across all orgs by default, with optional org filter
  if (role === "superadmin") {
    const filterOrgId = options.orgId || options.lead_org_id;
    if (filterOrgId && filterOrgId !== "all") {
      return {
        whereClause: `${leadAlias}.lead_org_id = ?`,
        params: [filterOrgId],
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
      whereClause: `${leadAlias}.lead_org_id = ? AND (${leadAlias}.created_by = ? OR EXISTS (SELECT 1 FROM lead_assignees ${laAlias} WHERE ${laAlias}.lead_id = ${leadAlias}.lead_id AND ${laAlias}.staff_id = ?))`,
      params: [orgId, staffId, staffId],
      joinClause: "",
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
    if (lead.hidden_by_employee == 1) {
      return { allowed: false, reason: "Lead has been deleted", lead };
    }

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

  if (lead.hidden_by_employee == 1) {
    return { allowed: false, reason: "Cannot share a deleted lead", lead };
  }

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

/**
 * Attaches multi-assignees list and created_by_name to a single lead or array of leads.
 * Preserves backward compatibility fields (assignedTo, staff_name).
 * Performs at most 2 batch queries for the whole set.
 *
 * @param {Object|Array} leads - A single lead object or array of lead objects
 * @returns {Promise<Object|Array>} The enriched lead(s)
 */
const attachAssigneesAndCreator = async (leads) => {
  if (!leads) return leads;
  const isArray = Array.isArray(leads);
  const leadList = isArray ? leads : [leads];
  if (leadList.length === 0) return leads;

  const leadIds = leadList.map((l) => l.lead_id).filter(Boolean);
  if (leadIds.length === 0) return leads;

  // 1. Fetch all assignees for these leads
  const assigneeRows = await new Promise((resolve, reject) => {
    db.query(
      `SELECT la.lead_id, la.staff_id, la.access_type, cs.staff_name, cs.staff_email, cs.staff_phone 
       FROM lead_assignees la 
       JOIN company_staff cs ON cs.staff_id = la.staff_id 
       WHERE la.lead_id IN (?) 
       ORDER BY la.id ASC`,
      [leadIds],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      }
    );
  });

  const assigneesByLeadId = {};
  for (const row of assigneeRows) {
    if (!assigneesByLeadId[row.lead_id]) {
      assigneesByLeadId[row.lead_id] = [];
    }
    assigneesByLeadId[row.lead_id].push({
      staff_id: row.staff_id,
      staff_name: row.staff_name,
      staff_email: row.staff_email,
      staff_phone: row.staff_phone,
      access_type: row.access_type,
    });
  }

  // 2. Fetch creator names
  const creatorIds = Array.from(
    new Set(leadList.map((l) => l.created_by).filter(Boolean))
  );
  let creatorMap = {};
  if (creatorIds.length > 0) {
    const creatorRows = await new Promise((resolve, reject) => {
      db.query(
        "SELECT staff_id, staff_name FROM company_staff WHERE staff_id IN (?)",
        [creatorIds],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        }
      );
    });
    for (const r of creatorRows) {
      creatorMap[r.staff_id] = r.staff_name;
    }
  }

  // 3. Attach properties to lead objects
  for (const lead of leadList) {
    lead.assignees = assigneesByLeadId[lead.lead_id] || [];
    lead.created_by_name = lead.created_by
      ? creatorMap[lead.created_by] || null
      : null;

    // For backwards compatibility:
    // If staff_name is not set, take it from first assignee
    if (!lead.staff_name && lead.assignees.length > 0) {
      lead.staff_name = lead.assignees[0].staff_name;
    }
  }

  return leads;
};

module.exports = {
  normalizePhone,
  buildVisibilityWhere,
  canAccessLead,
  canDeleteLead,
  canShare,
  fetchLeadById,
  attachAssigneesAndCreator,
};

