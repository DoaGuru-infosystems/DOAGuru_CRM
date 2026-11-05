const express = require("express");
const { db } = require("../db");
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");
const moment = require("moment-timezone");
const { sendEmail } = require("../utils/emailService");
const { sendWhatsAppLeadAssignedAlert } = require("../utils/whatsappUtils");
const {
  normalizePhone,
  buildVisibilityWhere,
  canAccessLead,
  canDeleteLead,
  attachAssigneesAndCreator,
} = require("../utils/leadVisibility");

const createLead = async (req, res) => {
  const {
    lead_org_id,
    name: rawName,
    customer_name,
    phone: rawPhone,
    mobile_number,
    lead_email,
    assignedTo,
    assigneeIds,
    staffIds,
    shareWith,
    leadSource: rawLeadSource,
    lead_source,
    lead_status: rawLeadStatus,
    main_project_id,
    unit_type,
    unit_id,
    address,
    createdTime,
    actual_date,
    calling_date: rawCallingDate,
    next_follow_date_time: rawNextFollowDateTime,
    remark: rawRemark,
    interested_follow_up,
    referred_by,
    assignedBy,
    alternative_number,
    dob,
    anniversary_date,
    office_business_name: rawOfficeBusinessName,
    business_name,
    office_address,
    nature_of_job,
    department,
    designation,
    badge,
    salary,
    campaign,
    interest_in_project_secondary,
    lead_sub_source,
    budget,
    primary_status,
    secondary_status,
    lead_review,
    visit_time,
    project_type,
  } = req.body;

  const currentUser = req.user;
  const currentRole = (currentUser?.staff_role || "").toLowerCase();

  let effectiveOrgId = currentUser?.staff_org_id || lead_org_id;
  if (currentRole === "superadmin") {
    effectiveOrgId = lead_org_id || currentUser?.staff_org_id;
  }

  const nowIST = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
  let finalCreatedTime = createdTime ? String(createdTime).trim() : "";
  if (!finalCreatedTime) {
    finalCreatedTime = nowIST;
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(finalCreatedTime)) {
    const timeIST = moment().tz("Asia/Kolkata").format("HH:mm:ss");
    finalCreatedTime = `${finalCreatedTime} ${timeIST}`;
  } else if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}$/.test(finalCreatedTime)) {
    finalCreatedTime = `${finalCreatedTime}:00`;
  } else {
    const m = moment.tz(finalCreatedTime, "Asia/Kolkata");
    if (m.isValid()) {
      finalCreatedTime = m.format("YYYY-MM-DD HH:mm:ss");
    }
  }

  const name = customer_name || rawName || "";
  const phone = mobile_number || rawPhone || "";
  const office_business_name = business_name || rawOfficeBusinessName || "";
  const leadSource = rawLeadSource || lead_source || "others";
  const lead_status = rawLeadStatus || "Pending";
  const calling_date = rawCallingDate || actual_date || finalCreatedTime || "";
  const next_follow_date_time = rawNextFollowDateTime || visit_time || "";
  const remark = rawRemark || lead_review || "";

  if (!effectiveOrgId || !name || !leadSource) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: lead_org_id, name, leadSource",
    });
  }

  const normPhone = normalizePhone(phone);
  if (phone && !/^\d{10}$/.test(normPhone)) {
    return res.status(400).json({
      success: false,
      message: "Mobile Number must be exactly 10 digits",
    });
  }

  if (alternative_number && !/^\d{10}$/.test(normalizePhone(alternative_number))) {
    return res.status(400).json({
      success: false,
      message: "Alternative Number must be exactly 10 digits",
    });
  }

  if (lead_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead_email)) {
    return res.status(400).json({
      success: false,
      message: "Invalid email format",
    });
  }

  // Duplicate check for normalized phone within effectiveOrgId
  if (normPhone) {
    try {
      const existingLead = await new Promise((resolve, reject) => {
        db.query(
          "SELECT lead_id FROM leads WHERE lead_org_id = ? AND phone = ?",
          [effectiveOrgId, normPhone],
          (err, rows) => {
            if (err) return reject(err);
            resolve(rows && rows.length > 0 ? rows[0] : null);
          }
        );
      });
      if (existingLead) {
        return res.status(409).json({
          success: false,
          message: "A lead with this phone number already exists in your organization",
        });
      }
    } catch (checkErr) {
      console.error("Duplicate check error:", checkErr);
    }
  }

  // Process assignees / share-with
  let targetStaffIds = [];
  const rawAssignees = assignedTo || assigneeIds || staffIds || shareWith;
  if (Array.isArray(rawAssignees)) {
    targetStaffIds = rawAssignees.map(Number).filter(Boolean);
  } else if (typeof rawAssignees === "string") {
    try {
      const parsed = JSON.parse(rawAssignees);
      if (Array.isArray(parsed)) {
        targetStaffIds = parsed.map(Number).filter(Boolean);
      } else if (rawAssignees.trim()) {
        targetStaffIds = rawAssignees.split(",").map((id) => Number(id.trim())).filter(Boolean);
      }
    } catch (e) {
      if (rawAssignees.trim()) {
        targetStaffIds = rawAssignees.split(",").map((id) => Number(id.trim())).filter(Boolean);
      }
    }
  } else if (typeof rawAssignees === "number") {
    targetStaffIds = [rawAssignees];
  }

  // Filter valid same-org staff
  let validAssigneeIds = [];
  if (targetStaffIds.length > 0) {
    const staffRows = await new Promise((resolve) => {
      db.query(
        "SELECT staff_id FROM company_staff WHERE staff_org_id = ? AND staff_id IN (?)",
        [effectiveOrgId, targetStaffIds],
        (err, rows) => resolve(rows || [])
      );
    });
    validAssigneeIds = staffRows.map((r) => r.staff_id);
  }

  // If Employee: access_type = 'shared', exclude self (no self entry in lead_assignees)
  // If Admin/SuperAdmin: access_type = 'assigned'
  let accessType = "assigned";
  if (currentRole === "employee") {
    accessType = "shared";
    validAssigneeIds = validAssigneeIds.filter(
      (id) => Number(id) !== Number(currentUser?.staff_id)
    );
  }

  const firstAssignee = validAssigneeIds.length > 0 ? validAssigneeIds[0] : null;

  const sql = `INSERT INTO leads 
    (lead_org_id, created_by, created_by_role, name, phone, lead_email, assignedTo, leadSource, main_project_id, unit_type, unit_id, address, createdTime, actual_date, referred_by, assignedBy, alternative_number, dob, anniversary_date, office_business_name, office_address, nature_of_job, department, designation, badge, salary, campaign, interest_in_project_secondary, lead_sub_source, budget, primary_status, secondary_status, lead_review, visit_time, project_type, calling_date, next_follow_date_time, remark, interested_follow_up, lead_status) 
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

  db.query(
    sql,
    [
      effectiveOrgId,
      currentUser?.staff_id || null,
      currentUser?.staff_role || null,
      name,
      normPhone || phone || "",
      lead_email || null,
      firstAssignee,
      leadSource,
      main_project_id || null,
      unit_type || "",
      unit_id || null,
      address,
      finalCreatedTime,
      actual_date || "",
      referred_by,
      assignedBy,
      alternative_number || null,
      dob || null,
      anniversary_date || null,
      office_business_name || null,
      office_address || null,
      nature_of_job || null,
      department || null,
      designation || null,
      badge || null,
      salary || null,
      campaign || null,
      interest_in_project_secondary || null,
      lead_sub_source || null,
      budget || null,
      primary_status || null,
      secondary_status || null,
      lead_review || remark || null,
      visit_time || null,
      project_type || null,
      calling_date || null,
      next_follow_date_time || null,
      remark || null,
      interested_follow_up || null,
      lead_status || 'Pending',
    ],
    async (err, results) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY" || err.errno === 1062) {
          return res.status(409).json({
            success: false,
            message: "A lead with this phone number or email already exists in your organization",
          });
        }
        return res.status(500).json({ success: false, message: err.message });
      }

      const newLeadId = results.insertId;

      // Insert into lead_assignees if assignees were provided
      if (validAssigneeIds.length > 0 && newLeadId) {
        const laValues = validAssigneeIds.map((sid) => [
          newLeadId,
          sid,
          accessType,
          currentUser?.staff_id || 0,
          finalCreatedTime,
        ]);
        db.query(
          "INSERT IGNORE INTO lead_assignees (lead_id, staff_id, access_type, granted_by, created_at) VALUES ?",
          [laValues]
        );
      }

      // Phase 8: Notify ALL newly inserted assignees (not just first one)
      if (validAssigneeIds.length > 0) {
        const staffQuery =
          "SELECT staff_name, staff_email, staff_phone FROM company_staff WHERE staff_id IN (?)";
        db.query(staffQuery, [validAssigneeIds], async (err, staffResults) => {
          if (err) {
            console.error("Error fetching staff details:", err.message);
            return;
          }
          for (const staff of (staffResults || [])) {
            const subject = "CRMGuru - New General Lead Assigned";
            const text = `Dear ${staff.staff_name},\n\nA new lead has been assigned to you in CRMGuru.\n\nPlease log in to your dashboard to view the lead details.\n\nBest regards,\nCRMGuru Team`;
            const html = `<p>Dear <strong>${staff.staff_name}</strong>,</p><p>A new lead has been <strong>assigned to you</strong> in <b>CRMGuru</b>.</p><p>Please log in to your dashboard to check the details.</p><br/><p>Best regards,<br/>CRMGuru Team</p>`;
            try {
              await sendEmail(staff.staff_email, subject, text, html);
              console.log("Lead assignment email sent to:", staff.staff_email);
            } catch (emailErr) {
              console.error("Email sending failed:", emailErr.message);
            }
            if (staff.staff_phone) {
              try {
                await sendWhatsAppLeadAssignedAlert(staff.staff_phone, staff.staff_name);
                console.log("WhatsApp lead alert sent to:", staff.staff_phone);
              } catch (waErr) {
                console.error("WhatsApp sending failed:", waErr);
              }
            }
          }
        });
      }

      return res
        .status(201)
        .json({ success: true, message: "Lead data successfully submitted", lead_id: results.insertId });
    }
  );
};


const getleadbyid = async (req, res) => {
  try {
    const { id } = req.params;
    const access = await canAccessLead(req.user, id);
    if (!access.allowed) {
      return res.status(403).json({ error: access.reason || "Access denied" });
    }

    const getQuery = `SELECT leads.*, company_staff.staff_name, company_staff.staff_email, company_staff.staff_phone, projects.project_name FROM leads left join company_staff on company_staff.staff_id = leads.assignedTo left join projects on projects.project_id = leads.main_project_id WHERE leads.lead_id = ?`;
    db.query(getQuery, [id], async (error, result) => {
      if (error) {
        return res.status(500).json({ error: "Internal Server Error" });
      }
      if (!result || result.length === 0) {
        return res.status(404).json({ error: "Lead not found" });
      }
      await attachAssigneesAndCreator(result);
      return res.status(200).json(result);
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getvisit = (req, res) => {
  try {
    const { id } = req.params;
    const getQuery = `SELECT * FROM leads WHERE lead_id = ?`;
    db.query(getQuery, [id], (error, result) => {
      if (error) {
        res.status(500).json({ error: "Internal Server Error" });
      } else {
        res.status(200).json(result);
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getLeads = async (req, res) => {
  try {
    const { userId } = req.params;
    const { search, filterDate, leadSource, unitStatus, visitStatus, activeTab } = req.query;

    const currentUser = req.user;
    const currentRole = (currentUser?.staff_role || "").toLowerCase();

    // Enforce visibility using buildVisibilityWhere
    const vis = buildVisibilityWhere(currentUser, {
      orgId: req.query.orgId || req.query.lead_org_id,
      leadAlias: "leads",
    });

    let sql = `SELECT DISTINCT leads.*, company_staff.staff_name, company_staff.staff_email, company_staff.staff_phone, projects.project_name,
               (SELECT GROUP_CONCAT(cs2.staff_name ORDER BY la2.id SEPARATOR ', ')
                FROM lead_assignees la2 JOIN company_staff cs2 ON cs2.staff_id = la2.staff_id
                WHERE la2.lead_id = leads.lead_id AND la2.access_type = 'assigned') AS assignee_names
               FROM leads 
               LEFT JOIN company_staff ON company_staff.staff_id = leads.assignedTo 
               LEFT JOIN projects ON projects.project_id = leads.main_project_id 
               WHERE ${vis.whereClause}`;
    const params = [...vis.params];

    if (search && search.trim() !== "") {
      const s = `%${search.trim()}%`;
      sql += ` AND (leads.name LIKE ? OR leads.phone LIKE ? OR leads.leadSource LIKE ? OR projects.project_name LIKE ? OR company_staff.staff_name LIKE ? OR leads.lead_id LIKE ?)`;
      params.push(s, s, s, s, s, s);
    }

    if (filterDate && filterDate.trim() !== "") {
      sql += ` AND DATE(leads.createdTime) = ?`;
      params.push(filterDate.trim());
    }

    if (leadSource && leadSource.trim() !== "") {
      sql += ` AND leads.leadSource = ?`;
      params.push(leadSource.trim());
    }

    if (unitStatus && unitStatus.trim() !== "") {
      sql += ` AND units.unit_status = ?`;
      params.push(unitStatus.trim());
    }

    if (visitStatus && visitStatus.trim() !== "") {
      sql += ` AND LOWER(TRIM(leads.primary_status)) = LOWER(TRIM(?))`;
      params.push(visitStatus.trim());
    }

    if (activeTab && activeTab.trim() !== "") {
      const tab = activeTab.trim();
      if (tab === "today") {
        sql += ` AND DATE(leads.createdTime) = CURRENT_DATE()`;
      } else if (tab === "past") {
        sql += ` AND DATE(leads.createdTime) < CURRENT_DATE()`;
      } else if (tab === "upcoming") {
        sql += ` AND DATE(leads.createdTime) > CURRENT_DATE()`;
      } else if (tab === "completed") {
        sql += ` AND (leads.deal_status = 'close' OR LOWER(TRIM(leads.primary_status)) IN ('deal close', 'visit done'))`;
      } else if (tab === "visitScheduled") {
        sql += ` AND LOWER(TRIM(leads.primary_status)) = 'site visit schedule'`;
      } else if (tab === "visitDone") {
        sql += ` AND LOWER(TRIM(leads.primary_status)) = 'visit done'`;
      } else if (tab === "visitPending") {
        sql += ` AND (leads.primary_status IS NULL OR LOWER(TRIM(leads.primary_status)) IN ('new leads', 'intrested', 'pending'))`;
      }
    }

    sql += ` ORDER BY leads.lead_id DESC`;

    db.query(sql, params, async (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      await attachAssigneesAndCreator(results);
      return res.status(200).send(results);
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};


const updateLead = async (req, res) => {
  try {
    const { leadId } = req.params;

    const access = await canAccessLead(req.user, leadId);
    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        message: access.reason || "Access denied",
      });
    }

    const {
      name: rawName,
      customer_name,
      phone: rawPhone,
      mobile_number,
      assignedTo,
      leadSource: rawLeadSource,
      lead_source,
      lead_status: rawLeadStatus,
      createdTime,
      actual_date,
      calling_date: rawCallingDate,
      next_follow_date_time: rawNextFollowDateTime,
      remark: rawRemark,
      interested_follow_up,
      main_project_id,
      unit_type,
      unit_id,
      address,
      referred_by,
      alternative_number,
      dob,
      anniversary_date,
      office_business_name: rawOfficeBusinessName,
      business_name,
      office_address,
      nature_of_job,
      department,
      designation,
      badge,
      salary,
      campaign,
      interest_in_project_secondary,
      lead_sub_source,
      budget,
      primary_status,
      secondary_status,
      lead_review,
      visit_time,
      project_type
    } = req.body;

    const name = customer_name || rawName || "";
    const phone = mobile_number || rawPhone || "";
    const office_business_name = business_name || rawOfficeBusinessName || "";
    const leadSource = rawLeadSource || lead_source || "others";
    const lead_status = rawLeadStatus || "Pending";
    const calling_date = rawCallingDate || actual_date || "";
    const next_follow_date_time = rawNextFollowDateTime || visit_time || "";
    const remark = rawRemark || lead_review || "";

    // Employees cannot reassign leads via lead update form
    const isEmployee = req.user && req.user.staff_role === "employee";
    let effectiveAssignedTo = assignedTo;
    if (Array.isArray(req.body.staffIds) && req.body.staffIds.length > 0) {
      effectiveAssignedTo = req.body.staffIds[0];
    }
    const finalAssignedTo = isEmployee ? access.lead.assignedTo : (effectiveAssignedTo || access.lead.assignedTo || null);

    if (!name || !leadSource) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, leadSource",
      });
    }

    if (phone && !/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Mobile Number must be exactly 10 digits",
      });
    }

    if (alternative_number && !/^\d{10}$/.test(alternative_number)) {
      return res.status(400).json({
        success: false,
        message: "Alternative Number must be exactly 10 digits",
      });
    }

    if (req.body.lead_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.lead_email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    const updatedTimeIST = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
    const sql = `UPDATE leads SET name = ?, phone = ?, assignedTo = ?, leadSource = ?, actual_date = ?, main_project_id = ?, unit_type = ?, unit_id = ?, address = ?, referred_by = ?, alternative_number = ?, dob = ?, anniversary_date = ?, office_business_name = ?, office_address = ?, nature_of_job = ?, department = ?, designation = ?, badge = ?, salary = ?, campaign = ?, interest_in_project_secondary = ?, lead_sub_source = ?, budget = ?, primary_status = ?, secondary_status = ?, lead_review = ?, visit_time = ?, project_type = ?, calling_date = ?, next_follow_date_time = ?, remark = ?, interested_follow_up = ?, lead_status = ?, lead_updated_at = ? WHERE lead_id = ?`;

    await new Promise((resolve, reject) => {
      db.query(
        sql,
        [
          name,
          phone || "",
          finalAssignedTo,
          leadSource,
          actual_date || "",
          main_project_id || null,
          unit_type || "",
          unit_id || null,
          address,
          referred_by,
          alternative_number || null,
          dob || null,
          anniversary_date || null,
          office_business_name || null,
          office_address || null,
          nature_of_job || null,
          department || null,
          designation || null,
          badge || null,
          salary || null,
          campaign || null,
          interest_in_project_secondary || null,
          lead_sub_source || null,
          budget || null,
          primary_status || null,
          secondary_status || null,
          lead_review || remark || null,
          visit_time || null,
          project_type || null,
          calling_date || null,
          next_follow_date_time || null,
          remark || null,
          interested_follow_up || null,
          lead_status || 'Pending',
          updatedTimeIST,
          leadId,
        ],
        (err, results) => {
          if (err) {
            reject(err);
          } else {
            resolve(results);
          }
        }
      );
    });

    let targetAssignees = [];
    if (!isEmployee) {
      if (Array.isArray(req.body.staffIds) && req.body.staffIds.length > 0) {
        targetAssignees = req.body.staffIds.map((id) => Number(id)).filter(Boolean);
      } else if (finalAssignedTo && finalAssignedTo !== access.lead.assignedTo) {
        targetAssignees = [Number(finalAssignedTo)];
      }
    }

    if (targetAssignees.length > 0) {
      // Un-hide if previously hidden
      await new Promise((resolve) => {
        db.query(
          "UPDATE leads SET hidden_by_employee = 0 WHERE lead_id = ?",
          [leadId],
          () => resolve()
        );
      });

      const staffRows = await new Promise((resolve) => {
        db.query(
          "SELECT staff_id, staff_name, staff_email FROM company_staff WHERE staff_org_id = ? AND staff_id IN (?)",
          [access.lead.lead_org_id, targetAssignees],
          (err, rows) => resolve(rows || [])
        );
      });

      for (const staff of staffRows) {
        const insertRes = await new Promise((resolve) => {
          db.query(
            "INSERT IGNORE INTO lead_assignees (lead_id, staff_id, access_type, granted_by, created_at) VALUES (?, ?, 'assigned', ?, ?)",
            [leadId, staff.staff_id, req.user.staff_id, updatedTimeIST],
            (err, res) => resolve(res)
          );
        });

        if (insertRes && insertRes.affectedRows > 0) {
          const subject = "CRMGuru - New General Lead Assigned";
          const text = `Dear ${staff.staff_name},

A new lead has been assigned to you in CRMGuru.

Please log in to your dashboard to view the lead details.

Best regards,
CRMGuru Team`;

          const html = `
            <p>Dear <strong>${staff.staff_name}</strong>,</p>
            <p>A new lead has been <strong>assigned to you</strong> in <b>CRMGuru</b>.</p>
            <p>Please log in to your dashboard to check the details.</p>
            <br/>
            <p>Best regards,<br/>CRMGuru Team</p>
          `;

          try {
            await sendEmail(staff.staff_email, subject, text, html);
            console.log("Lead assignment email sent to:", staff.staff_email);
          } catch (emailErr) {
            console.error("Email sending failed:", emailErr.message);
          }
        }
      }
    }

    res.status(200).json({ message: "Lead updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteLead = async (req, res) => {
  try {
    const { leadId } = req.params;

    if (!leadId) {
      return res.status(400).json({ success: false, error: "Lead ID is required" });
    }

    const access = await canDeleteLead(req.user, leadId);
    if (!access.allowed) {
      return res.status(403).json({ success: false, error: access.reason || "Access denied" });
    }

    const isEmployee = req.user && req.user.staff_role === "employee";
    const sqlLeads = isEmployee
      ? `UPDATE leads SET hidden_by_employee = 1 WHERE lead_id = ?`
      : `DELETE FROM leads WHERE lead_id = ?`;

    db.query(sqlLeads, [leadId], (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: err.message
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: "Lead not found" });
      }

      res.status(200).json({
        success: true,
        message: isEmployee ? "Lead successfully hidden for employee" : "Lead successfully deleted"
      });
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const addProject = (req, res) => {
  const { project_org_id, projectName, location, total_units } =
    req.body;
  const dateTime = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  if (!project_org_id || !projectName || !location || !total_units) {
    return res.status(400).json({ error: "Required fields are missing." });
  }

  const query = `
    INSERT INTO projects (
      project_org_id, project_name, location, total_units, project_created_at
    ) VALUES (?, ?, ?,?, ?)
  `;

  const values = [project_org_id, projectName, location, total_units, dateTime];

  db.query(query, values, (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }

    res.status(200).json({ success: true, message: "Project added successfully." });
  });
};

const getAllProjects = (req, res) => {
  const { orgId } = req.params;
  const query = "SELECT * FROM projects WHERE project_org_id = ?";

  db.query(query, [orgId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Failed to fetch projects." });
    }

    res.status(200).send(results);
  });
};

const editProject = (req, res) => {
  const { id } = req.params;
  const { project_name, location, total_units } = req.body;

  const sql = `
    UPDATE projects
    SET project_name = ?, location = ?, total_units = ?
    WHERE project_id = ?
  `;

  db.query(sql, [project_name, location, total_units, id], (err, result) => {
    if (err) {
      console.error("Error updating project:", err);
      return res.status(500).json({ message: "Server error", error: err });
    }

    if (result.affectedRows > 0) {
      res.status(200).json({ message: "Project updated successfully" });
    } else {
      res.status(404).json({ message: "Project not found" });
    }
  });
};

const deleteProject = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Project ID is required" });
  }

  try {
    const deleteResult = await new Promise((resolve, reject) => {
      db.query(
        "DELETE FROM projects WHERE project_id = ?",
        [id],
        (err, result) => {
          if (err) {
            return reject(err);
          }
          resolve(result);
        }
      );
    });

    if (deleteResult.affectedRows > 0) {
      return res.status(200).json({ success: true, message: "Project deleted successfully" });
    } else {
      return res.status(404).json({ success: false, message: "Project not found" });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

const createLeadTransferRequest = async (req, res) => {
  try {
    const { lead_id, receiver_id } = req.body;
    const sender_id = req.user.staff_id;

    if (!lead_id || !receiver_id) {
      return res.status(400).json({ success: false, message: "Missing lead_id or receiver_id" });
    }

    // Check if the lead is currently assigned to the sender
    const checkLeadSql = "SELECT * FROM leads WHERE lead_id = ? AND assignedTo = ?";
    db.query(checkLeadSql, [lead_id, sender_id], (err, results) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      if (results.length === 0) {
        return res.status(403).json({ success: false, message: "You are not authorized to transfer this lead (not assigned to you)" });
      }

      // Insert transfer request
      // First delete any previous pending request for this lead to avoid duplicates
      const deletePendingSql = "DELETE FROM lead_transfer_requests WHERE lead_id = ? AND status = 'pending'";
      db.query(deletePendingSql, [lead_id], (delErr) => {
        if (delErr) return res.status(500).json({ success: false, message: delErr.message });

        const insertSql = "INSERT INTO lead_transfer_requests (lead_id, sender_id, receiver_id) VALUES (?, ?, ?)";
        db.query(insertSql, [lead_id, sender_id, receiver_id], (insErr, result) => {
          if (insErr) return res.status(500).json({ success: false, message: insErr.message });
          return res.status(201).json({ success: true, message: "Transfer request sent successfully", request_id: result.insertId });
        });
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPendingTransferRequests = async (req, res) => {
  try {
    const userId = req.user.staff_id;
    // Get requests where current user is receiver
    const sql = `
      SELECT r.*, l.name AS lead_name, l.phone AS lead_phone, s.staff_name AS sender_name
      FROM lead_transfer_requests r
      JOIN leads l ON r.lead_id = l.lead_id
      JOIN company_staff s ON r.sender_id = s.staff_id
      WHERE r.receiver_id = ? AND r.status = 'pending'
    `;
    db.query(sql, [userId], (err, results) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      return res.status(200).json(results);
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const respondToTransferRequest = async (req, res) => {
  try {
    const { request_id, action } = req.body; // action: 'accepted' or 'rejected'
    const receiver_id = req.user.staff_id;

    if (!request_id || !action || !['accepted', 'rejected'].includes(action)) {
      return res.status(400).json({ success: false, message: "Invalid parameters" });
    }

    // Check if the request exists and is pending for this receiver
    const selectSql = "SELECT * FROM lead_transfer_requests WHERE request_id = ? AND receiver_id = ? AND status = 'pending'";
    db.query(selectSql, [request_id, receiver_id], (err, results) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      if (results.length === 0) {
        return res.status(404).json({ success: false, message: "Pending transfer request not found" });
      }

      const request = results[0];

      if (action === 'accepted') {
        // Update request status to accepted
        const updateReqSql = "UPDATE lead_transfer_requests SET status = 'accepted' WHERE request_id = ?";
        db.query(updateReqSql, [request_id], (upReqErr) => {
          if (upReqErr) return res.status(500).json({ success: false, message: upReqErr.message });

          // Update lead assignedTo to the new assignee
          // Also reset hidden_by_employee so the receiver sees it
          const updateLeadSql = "UPDATE leads SET assignedTo = ?, hidden_by_employee = 0 WHERE lead_id = ?";
          db.query(updateLeadSql, [receiver_id, request.lead_id], (upLeadErr) => {
            if (upLeadErr) return res.status(500).json({ success: false, message: upLeadErr.message });
            return res.status(200).json({ success: true, message: "Lead transfer accepted and reassigned successfully" });
          });
        });
      } else {
        // Update request status to rejected
        const updateReqSql = "UPDATE lead_transfer_requests SET status = 'rejected' WHERE request_id = ?";
        db.query(updateReqSql, [request_id], (upReqErr) => {
          if (upReqErr) return res.status(500).json({ success: false, message: upReqErr.message });
          return res.status(200).json({ success: true, message: "Lead transfer request rejected" });
        });
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


module.exports = {
  createLead,
  getleadbyid,
  getLeads,
  updateLead,
  deleteLead,
  addProject,
  getAllProjects,
  editProject,
  deleteProject,
  createLeadTransferRequest,
  getPendingTransferRequests,
  respondToTransferRequest
};
