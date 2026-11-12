const express = require("express");
const cors = require("cors");
const { db } = require("../db");
const moment = require("moment-timezone");
const xlsx = require("xlsx");
const fs = require("fs");
const { sendEmail } = require("../utils/emailService");
const { sendWhatsAppLeadAssignedAlert } = require("../utils/whatsappUtils");
const { normalizePhone, canShare, fetchLeadById } = require("../utils/leadVisibility");

const bulkUploadLeads = async (req, res) => {
  let filePath = null;
  try {
    const { lead_org_id, assignedTo, assigneeIds, staffIds, shareWith, main_project_id, unit_id } = req.body;

    const currentUser = req.user;
    const currentRole = (currentUser?.staff_role || "").toLowerCase();

    if (!currentUser || !["superadmin", "admin", "employee"].includes(currentRole)) {
      if (req.file?.path) fs.unlinkSync(req.file.path);
      return res.status(403).json({
        success: false,
        message: "Access denied. Valid user role required.",
      });
    }

    let effectiveOrgId = currentUser.staff_org_id;
    if (currentRole === "superadmin") {
      effectiveOrgId = lead_org_id || currentUser.staff_org_id;
    }

    const dateTime = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    filePath = req.file.path;

    if (!effectiveOrgId) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message: "lead_org_id is required",
      });
    }

    // 1. Process assignees / share-with staff IDs
    let targetStaffIds = [];
    const rawAssignees = assignedTo || assigneeIds || staffIds || shareWith;
    if (Array.isArray(rawAssignees)) {
      targetStaffIds = rawAssignees.map((id) => Number(id)).filter(Boolean);
    } else if (typeof rawAssignees === "string") {
      try {
        const parsed = JSON.parse(rawAssignees);
        if (Array.isArray(parsed)) {
          targetStaffIds = parsed.map((id) => Number(id)).filter(Boolean);
        } else if (rawAssignees.trim()) {
          targetStaffIds = rawAssignees
            .split(",")
            .map((id) => Number(id.trim()))
            .filter(Boolean);
        }
      } catch (e) {
        if (rawAssignees.trim()) {
          targetStaffIds = rawAssignees
            .split(",")
            .map((id) => Number(id.trim()))
            .filter(Boolean);
        }
      }
    } else if (typeof rawAssignees === "number") {
      targetStaffIds = [rawAssignees];
    }

    // Validate that assignee staff belong to effectiveOrgId
    let validAssigneeIds = [];
    if (targetStaffIds.length > 0) {
      const staffRows = await new Promise((resolve, reject) => {
        db.query(
          "SELECT staff_id FROM company_staff WHERE staff_org_id = ? AND staff_id IN (?)",
          [effectiveOrgId, targetStaffIds],
          (err, rows) => {
            if (err) return reject(err);
            resolve(rows || []);
          }
        );
      });
      validAssigneeIds = staffRows.map((r) => r.staff_id);
    }

    // Determine access_type and sanitize assignee list:
    // If employee: access_type = 'shared', exclude self (do NOT create self entry in lead_assignees)
    // If admin/superadmin: access_type = 'assigned'
    let accessType = "assigned";
    if (currentRole === "employee") {
      accessType = "shared";
      validAssigneeIds = validAssigneeIds.filter(
        (id) => Number(id) !== Number(currentUser.staff_id)
      );
    }

    // First assignee for legacy compat (leads.assignedTo)
    const firstAssignee = validAssigneeIds.length > 0 ? validAssigneeIds[0] : null;

    // 2. Read excel file
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (!sheetData.length) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message: "Excel file is empty",
      });
    }

    // 3. Pre-fetch existing normalized phones for effectiveOrgId
    const existingRows = await new Promise((resolve, reject) => {
      db.query(
        "SELECT phone FROM leads WHERE lead_org_id = ?",
        [effectiveOrgId],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        }
      );
    });
    const existingPhoneSet = new Set(
      existingRows.map((r) => normalizePhone(r.phone)).filter(Boolean)
    );
    const batchSeenPhones = new Set();

    let inserted = 0;
    let skipped = 0;
    const skipped_phones = [];

    const insertSql = `
      INSERT INTO leads (
        lead_org_id,
        created_by,
        created_by_role,
        assignedTo,
        name,
        phone,
        lead_email,
        leadSource,
        main_project_id,
        unit_type,
        unit_id,
        address,
        createdTime,
        actual_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (const row of sheetData) {
      const rawPhone =
        row.phone ||
        row.Phone ||
        row.mobile ||
        row["Mobile Number"] ||
        row["Phone Number"] ||
        "";
      const normPhone = normalizePhone(rawPhone);

      // Rule: empty or invalid phone is skipped
      if (!normPhone || normPhone.length < 10) {
        skipped++;
        skipped_phones.push(rawPhone ? String(rawPhone) : "EMPTY");
        continue;
      }

      // Rule: duplicate phone within org or duplicate inside this file is skipped
      if (existingPhoneSet.has(normPhone) || batchSeenPhones.has(normPhone)) {
        skipped++;
        skipped_phones.push(normPhone);
        continue;
      }

      batchSeenPhones.add(normPhone);

      const leadValues = [
        effectiveOrgId,
        currentUser.staff_id,
        currentUser.staff_role,
        firstAssignee,
        row.name || row.Name || row.customer_name || null,
        normPhone,
        row.lead_email || row.email || row.Email || null,
        row.leadSource || row["Lead Source"] || "others",
        null, // main_project_id decoupled (always NULL)
        row.unit_type || row["Unit Type"] || null,
        unit_id || null,
        row.address || row.Address || null,
        dateTime,
        row.actual_date || row["Actual Date"] || null,
      ];

      try {
        const insertRes = await new Promise((resolve, reject) => {
          db.query(insertSql, leadValues, (err, res) => {
            if (err) return reject(err);
            resolve(res);
          });
        });

        const newLeadId = insertRes.insertId;
        inserted++;
        existingPhoneSet.add(normPhone);

        // Insert into lead_assignees if assignees were provided
        if (validAssigneeIds.length > 0 && newLeadId) {
          const laValues = validAssigneeIds.map((sid) => [
            newLeadId,
            sid,
            accessType,
            currentUser.staff_id,
            dateTime,
          ]);
          await new Promise((resolve) => {
            db.query(
              "INSERT IGNORE INTO lead_assignees (lead_id, staff_id, access_type, granted_by, created_at) VALUES ?",
              [laValues],
              () => resolve()
            );
          });
        }
      } catch (rowErr) {
        // Catch duplicate entry (e.g. from unique constraint) or DB error
        if (rowErr.code === "ER_DUP_ENTRY" || rowErr.errno === 1062) {
          skipped++;
          skipped_phones.push(normPhone);
        } else {
          console.error("Bulk upload row error:", rowErr.message);
          skipped++;
          skipped_phones.push(normPhone);
        }
      }
    }

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    return res.status(201).json({
      success: true,
      message: `${inserted} leads added, ${skipped} skipped.`,
      inserted,
      skipped,
      skipped_phones,
    });
  } catch (error) {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    console.error("Error in bulkUploadLeads:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};



const notifyNewlyAssignedStaff = async (staffIds, leadName = "Lead") => {
  if (!staffIds || staffIds.length === 0) return;
  try {
    const staffRows = await new Promise((resolve) => {
      db.query(
        "SELECT staff_id, staff_name, staff_email, staff_phone FROM company_staff WHERE staff_id IN (?)",
        [staffIds],
        (err, rows) => resolve(rows || [])
      );
    });

    for (const staff of staffRows) {
      if (staff.staff_email) {
        const subject = "CRMGuru - New Lead Assigned";
        const text = `Dear ${staff.staff_name},\nA new lead (${leadName}) has been assigned to you in CRMGuru.\nPlease log in to your dashboard to view details.\nBest regards,\nCRMGuru Team`;
        const html = `
          <p>Dear <strong>${staff.staff_name}</strong>,</p>
          <p>A new lead (<strong>${leadName}</strong>) has been <strong>assigned to you</strong> in <b>CRMGuru</b>.</p>
          <p>Please log in to your dashboard to check the details.</p>
          <br/>
          <p>Best regards,<br/>CRMGuru Team</p>
        `;
        sendEmail(staff.staff_email, subject, text, html).catch((err) =>
          console.error("Assignment email error:", err.message)
        );
      }

      if (staff.staff_phone && typeof sendWhatsAppLeadAssignedAlert === "function") {
        sendWhatsAppLeadAssignedAlert(staff.staff_phone, staff.staff_name).catch((err) =>
          console.error("WhatsApp alert error:", err.message)
        );
      }
    }
  } catch (err) {
    console.error("Error notifying assigned staff:", err.message);
  }
};

const updateLeadAssignment = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { assignedTo, staffIds, assigneeIds, main_project_id, unit_id } = req.body;

    const currentUser = req.user;
    const currentRole = (currentUser?.staff_role || "").toLowerCase();

    // 1. Role check: Admin / SuperAdmin only
    if (!currentUser || (currentRole !== "admin" && currentRole !== "superadmin")) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Admin and SuperAdmin can assign leads.",
      });
    }

    if (!leadId) {
      return res.status(400).json({ success: false, message: "leadId is required" });
    }

    // 2. Fetch lead
    const leadRows = await new Promise((resolve, reject) => {
      db.query(
        "SELECT lead_id, lead_org_id, name, assignedTo FROM leads WHERE lead_id = ?",
        [leadId],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        }
      );
    });

    if (!leadRows.length) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }
    const lead = leadRows[0];

    // Admin can only assign leads belonging to their own organization
    if (currentRole === "admin" && lead.lead_org_id !== currentUser.staff_org_id) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only assign leads within your organization.",
      });
    }

    // 3. Process staffIds array (accepts staffIds, assigneeIds, or legacy assignedTo)
    let targetStaffIds = [];
    const rawStaff = staffIds || assigneeIds || assignedTo;
    if (Array.isArray(rawStaff)) {
      targetStaffIds = rawStaff.map(Number).filter(Boolean);
    } else if (typeof rawStaff === "string") {
      try {
        const parsed = JSON.parse(rawStaff);
        if (Array.isArray(parsed)) targetStaffIds = parsed.map(Number).filter(Boolean);
        else if (rawStaff.trim())
          targetStaffIds = rawStaff
            .split(",")
            .map((id) => Number(id.trim()))
            .filter(Boolean);
      } catch (e) {
        if (rawStaff.trim())
          targetStaffIds = rawStaff
            .split(",")
            .map((id) => Number(id.trim()))
            .filter(Boolean);
      }
    } else if (typeof rawStaff === "number") {
      targetStaffIds = [rawStaff];
    }

    if (targetStaffIds.length === 0 && !unit_id) {
      return res.status(400).json({
        success: false,
        message:
          "At least one field (staffIds / assignedTo, unit_id) is required",
      });
    }

    const dateTime = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

    // 4. Validate all target staff belong to the lead's organization
    let newlyAssignedStaffIds = [];
    let firstAssignee = null;

    if (targetStaffIds.length > 0) {
      const staffRows = await new Promise((resolve, reject) => {
        db.query(
          "SELECT staff_id FROM company_staff WHERE staff_org_id = ? AND staff_id IN (?)",
          [lead.lead_org_id, targetStaffIds],
          (err, rows) => {
            if (err) return reject(err);
            resolve(rows || []);
          }
        );
      });
      const validStaffIdSet = new Set(staffRows.map((r) => r.staff_id));

      for (const sid of targetStaffIds) {
        if (!validStaffIdSet.has(sid)) {
          return res.status(403).json({
            success: false,
            message: `Access denied. Staff ID ${sid} does not belong to the lead's organization.`,
          });
        }
      }

      // 5. Check existing assignments for this lead to send notifications ONLY to new ones
      const existingAssigneeRows = await new Promise((resolve, reject) => {
        db.query(
          "SELECT staff_id FROM lead_assignees WHERE lead_id = ?",
          [leadId],
          (err, rows) => {
            if (err) return reject(err);
            resolve(rows || []);
          }
        );
      });
      const existingStaffSet = new Set(existingAssigneeRows.map((r) => r.staff_id));
      newlyAssignedStaffIds = targetStaffIds.filter((id) => !existingStaffSet.has(id));

      // 6. Insert into lead_assignees (access_type='assigned', granted_by=currentUser.staff_id)
      const laValues = targetStaffIds.map((sid) => [
        leadId,
        sid,
        "assigned",
        currentUser.staff_id,
        dateTime,
      ]);

      await new Promise((resolve, reject) => {
        db.query(
          "INSERT IGNORE INTO lead_assignees (lead_id, staff_id, access_type, granted_by, created_at) VALUES ?",
          [laValues],
          (err, result) => {
            if (err) return reject(err);
            resolve(result);
          }
        );
      });

      firstAssignee = targetStaffIds[0];
    }

    // 7. Update leads table (sync assignedTo, assignedBy, lead_updated_at)
    const fields = [];
    const values = [];

    if (firstAssignee !== null) {
      fields.push("assignedTo = ?");
      values.push(firstAssignee);
      fields.push("assignedBy = ?");
      values.push(
        currentUser.staff_name ||
          (currentRole === "superadmin" ? "SuperAdmin" : "Admin")
      );
    }
    if (unit_id !== undefined) {
      fields.push("unit_id = ?");
      values.push(unit_id);
    }

    fields.push("hidden_by_employee = 0");
    fields.push("lead_updated_at = ?");
    values.push(dateTime);

    values.push(leadId);

    const sql = `UPDATE leads SET ${fields.join(", ")} WHERE lead_id = ?`;
    await new Promise((resolve, reject) => {
      db.query(sql, values, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    // 8. Notification: ONLY to newly inserted assignees
    if (newlyAssignedStaffIds.length > 0) {
      notifyNewlyAssignedStaff(newlyAssignedStaffIds, lead.name || "Lead");
    }

    return res.status(200).json({
      success: true,
      message: "Lead assignment updated successfully",
      newlyAssignedCount: newlyAssignedStaffIds.length,
      totalAssignees: targetStaffIds.length,
    });
  } catch (error) {
    console.error("Error updating lead assignment:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const bulkAssignLeads = async (req, res) => {
  try {
    const { leadIds, staffIds } = req.body;

    const currentUser = req.user;
    const currentRole = (currentUser?.staff_role || "").toLowerCase();

    // 1. Role check: Admin / SuperAdmin only
    if (!currentUser || (currentRole !== "admin" && currentRole !== "superadmin")) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Admin and SuperAdmin can bulk assign leads.",
      });
    }

    if (
      !Array.isArray(leadIds) ||
      leadIds.length === 0 ||
      !Array.isArray(staffIds) ||
      staffIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "leadIds and staffIds must be non-empty arrays",
      });
    }

    const cleanLeadIds = leadIds.map(Number).filter(Boolean);
    const cleanStaffIds = staffIds.map(Number).filter(Boolean);

    if (cleanLeadIds.length === 0 || cleanStaffIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Valid leadIds and staffIds are required",
      });
    }

    if (cleanLeadIds.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Maximum 500 leads can be assigned in a single bulk operation.",
      });
    }

    if (cleanStaffIds.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Maximum 50 assignees can be selected at a time.",
      });
    }

    // 2. Org check for Admin
    if (currentRole === "admin") {
      const leadOrgRows = await new Promise((resolve, reject) => {
        db.query(
          "SELECT lead_id FROM leads WHERE lead_id IN (?) AND lead_org_id = ?",
          [cleanLeadIds, currentUser.staff_org_id],
          (err, rows) => {
            if (err) return reject(err);
            resolve(rows || []);
          }
        );
      });
      if (leadOrgRows.length !== cleanLeadIds.length) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. One or more leads do not belong to your organization.",
        });
      }

      const staffOrgRows = await new Promise((resolve, reject) => {
        db.query(
          "SELECT staff_id FROM company_staff WHERE staff_id IN (?) AND staff_org_id = ?",
          [cleanStaffIds, currentUser.staff_org_id],
          (err, rows) => {
            if (err) return reject(err);
            resolve(rows || []);
          }
        );
      });
      if (staffOrgRows.length !== cleanStaffIds.length) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. One or more employees do not belong to your organization.",
        });
      }
    }

    const dateTime = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
    const assignedByName =
      currentUser.staff_name ||
      (currentRole === "superadmin" ? "SuperAdmin" : "Admin");
    const firstStaffId = cleanStaffIds[0];

    // 3. Execute in Transaction
    const connection = await new Promise((resolve, reject) => {
      db.getConnection((err, conn) => {
        if (err) return reject(err);
        resolve(conn);
      });
    });

    const connQuery = (sql, params) => {
      return new Promise((resolve, reject) => {
        connection.query(sql, params, (err, res) => {
          if (err) return reject(err);
          resolve(res);
        });
      });
    };

    let assignedCount = 0;
    let skippedCount = 0;
    const newlyAssignedStaffSet = new Set();

    try {
      await connQuery("START TRANSACTION");

      // Check existing pairs
      const existingPairs = await connQuery(
        "SELECT lead_id, staff_id FROM lead_assignees WHERE lead_id IN (?) AND staff_id IN (?)",
        [cleanLeadIds, cleanStaffIds]
      );
      const pairSet = new Set(
        existingPairs.map((r) => `${r.lead_id}_${r.staff_id}`)
      );

      const toInsert = [];
      for (const lId of cleanLeadIds) {
        for (const sId of cleanStaffIds) {
          const key = `${lId}_${sId}`;
          if (pairSet.has(key)) {
            skippedCount++;
          } else {
            toInsert.push([
              lId,
              sId,
              "assigned",
              currentUser.staff_id,
              dateTime,
            ]);
            pairSet.add(key);
            assignedCount++;
            newlyAssignedStaffSet.add(sId);
          }
        }
      }

      if (toInsert.length > 0) {
        await connQuery(
          "INSERT IGNORE INTO lead_assignees (lead_id, staff_id, access_type, granted_by, created_at) VALUES ?",
          [toInsert]
        );
      }

      // Re-sync leads.assignedTo if NULL, update assignedBy, and reset hidden_by_employee for new assignment
      await connQuery(
        `UPDATE leads 
         SET assignedTo = COALESCE(assignedTo, ?),
             assignedBy = ?,
             hidden_by_employee = 0,
             lead_updated_at = ?
         WHERE lead_id IN (?)`,
        [firstStaffId, assignedByName, dateTime, cleanLeadIds]
      );

      await connQuery("COMMIT");
      connection.release();

      // 4. Notifications to newly assigned staff
      if (newlyAssignedStaffSet.size > 0) {
        notifyNewlyAssignedStaff(
          Array.from(newlyAssignedStaffSet),
          `${cleanLeadIds.length} Leads`
        );
      }

      return res.status(200).json({
        success: true,
        message: `Successfully assigned ${assignedCount} lead-assignee pairs. ${skippedCount} were already assigned.`,
        assignedCount,
        skippedCount,
      });
    } catch (txErr) {
      await connQuery("ROLLBACK");
      connection.release();
      throw txErr;
    }
  } catch (error) {
    console.error("Error in bulkAssignLeads:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const removeLeadAssignee = async (req, res) => {
  try {
    const { leadId, staffId } = req.params;

    const currentUser = req.user;
    const currentRole = (currentUser?.staff_role || "").toLowerCase();

    // 1. Role check: Admin / SuperAdmin only
    if (!currentUser || (currentRole !== "admin" && currentRole !== "superadmin")) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Admin and SuperAdmin can remove assignees.",
      });
    }

    if (!leadId || !staffId) {
      return res
        .status(400)
        .json({ success: false, message: "leadId and staffId are required" });
    }

    // 2. Lead existence and org check
    const leadRows = await new Promise((resolve, reject) => {
      db.query(
        "SELECT lead_id, lead_org_id, assignedTo FROM leads WHERE lead_id = ?",
        [leadId],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        }
      );
    });

    if (!leadRows.length) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }
    const lead = leadRows[0];

    if (currentRole === "admin" && lead.lead_org_id !== currentUser.staff_org_id) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You can only manage leads within your organization.",
      });
    }

    // 3. Delete from lead_assignees (only assigned access type)
    const deleteRes = await new Promise((resolve, reject) => {
      db.query(
        "DELETE FROM lead_assignees WHERE lead_id = ? AND staff_id = ? AND access_type = 'assigned'",
        [leadId, staffId],
        (err, res) => {
          if (err) return reject(err);
          resolve(res);
        }
      );
    });

    if (deleteRes.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Assigned entry not found for this lead and employee",
      });
    }

    const dateTime = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

    // 4. Re-sync leads.assignedTo: pick next remaining assigned assignee or NULL
    const remainingAssignees = await new Promise((resolve, reject) => {
      db.query(
        "SELECT staff_id FROM lead_assignees WHERE lead_id = ? AND access_type = 'assigned' ORDER BY id ASC LIMIT 1",
        [leadId],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        }
      );
    });

    const nextAssignee =
      remainingAssignees.length > 0 ? remainingAssignees[0].staff_id : null;

    await new Promise((resolve, reject) => {
      db.query(
        "UPDATE leads SET assignedTo = ?, lead_updated_at = ? WHERE lead_id = ?",
        [nextAssignee, dateTime, leadId],
        (err, res) => {
          if (err) return reject(err);
          resolve(res);
        }
      );
    });

    return res.status(200).json({
      success: true,
      message: "Assignee removed successfully",
      nextAssignee: nextAssignee,
    });
  } catch (error) {
    console.error("Error removing assignee:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const notifySharedStaff = async (staffIds, leadCount) => {
  try {
    if (!staffIds || staffIds.length === 0) return;
    const staffRows = await new Promise((resolve, reject) => {
      db.query(
        "SELECT staff_id, staff_name, staff_email, staff_phone FROM company_staff WHERE staff_id IN (?)",
        [staffIds],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        }
      );
    });

    for (const staff of staffRows) {
      if (staff.staff_email) {
        const subject = "CRMGuru - Lead(s) Shared With You";
        const text = `Dear ${staff.staff_name},\n\n${leadCount} lead(s) have been shared with you in CRMGuru.\n\nPlease log in to view the lead details.\n\nBest regards,\nCRMGuru Team`;
        const html = `<p>Dear <strong>${staff.staff_name}</strong>,</p><p><strong>${leadCount}</strong> lead(s) have been shared with you in <b>CRMGuru</b>.</p><br/><p>Best regards,<br/>CRMGuru Team</p>`;
        sendEmail(staff.staff_email, subject, text, html).catch((e) =>
          console.warn("Share email error:", e.message)
        );
      }
    }
  } catch (err) {
    console.warn("notifySharedStaff error:", err.message);
  }
};

const shareLeads = async (req, res) => {
  try {
    const { leadIds, staffIds } = req.body;
    const currentUser = req.user;
    const currentRole = (currentUser?.staff_role || "").toLowerCase();

    // 1. Role check: Employee only (Admin uses assign)
    if (!currentUser || currentRole !== "employee") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only employees can share leads (Admin uses assign).",
      });
    }

    // 2. Validate input arrays
    if (
      !Array.isArray(leadIds) ||
      leadIds.length === 0 ||
      !Array.isArray(staffIds) ||
      staffIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "leadIds and staffIds must be non-empty arrays",
      });
    }

    // Max 200 leads
    if (leadIds.length > 200) {
      return res.status(400).json({
        success: false,
        message: "Cannot share more than 200 leads at a time",
      });
    }

    const cleanLeadIds = Array.from(new Set(leadIds.map(Number))).filter(Boolean);
    const cleanStaffIds = Array.from(new Set(staffIds.map(Number))).filter(
      (id) => Boolean(id) && id !== currentUser.staff_id
    );

    if (cleanLeadIds.length === 0 || cleanStaffIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid leadIds or staffIds (cannot share with self)",
      });
    }

    // 3. Check canShare for every lead
    for (const lId of cleanLeadIds) {
      const shareCheck = await canShare(currentUser, lId);
      if (!shareCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: `Cannot share lead ID ${lId}: ${shareCheck.reason}`,
        });
      }
    }

    // 4. Validate all target staff: must be same org AND employee role (not admin/superadmin)
    const staffRows = await new Promise((resolve, reject) => {
      db.query(
        "SELECT staff_id, staff_role, staff_org_id FROM company_staff WHERE staff_id IN (?)",
        [cleanStaffIds],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        }
      );
    });

    if (staffRows.length !== cleanStaffIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more target employees not found",
      });
    }

    for (const staff of staffRows) {
      if (staff.staff_org_id !== currentUser.staff_org_id) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Target employee does not belong to your organization.",
        });
      }
      if ((staff.staff_role || "").toLowerCase() !== "employee") {
        return res.status(403).json({
          success: false,
          message: "Can only share with employees, not admin or superadmin",
        });
      }
    }

    // 5. Transaction: Insert into lead_assignees with access_type='shared'
    const connection = await new Promise((resolve, reject) => {
      db.getConnection((err, conn) => {
        if (err) return reject(err);
        resolve(conn);
      });
    });

    const connQuery = (sql, params = []) => {
      return new Promise((resolve, reject) => {
        connection.query(sql, params, (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      });
    };

    const dateTime = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

    try {
      await connQuery("START TRANSACTION");

      // Check existing pairs
      const existingPairs = await connQuery(
        "SELECT lead_id, staff_id FROM lead_assignees WHERE lead_id IN (?) AND staff_id IN (?)",
        [cleanLeadIds, cleanStaffIds]
      );
      const pairSet = new Set(existingPairs.map((r) => `${r.lead_id}_${r.staff_id}`));

      let sharedCount = 0;
      let skippedCount = 0;
      const toInsert = [];
      const newlySharedStaffSet = new Set();

      for (const lId of cleanLeadIds) {
        for (const sId of cleanStaffIds) {
          const key = `${lId}_${sId}`;
          if (pairSet.has(key)) {
            skippedCount++;
          } else {
            toInsert.push([lId, sId, "shared", currentUser.staff_id, dateTime]);
            pairSet.add(key);
            sharedCount++;
            newlySharedStaffSet.add(sId);
          }
        }
      }

      if (toInsert.length > 0) {
        await connQuery(
          "INSERT IGNORE INTO lead_assignees (lead_id, staff_id, access_type, granted_by, created_at) VALUES ?",
          [toInsert]
        );
      }

      await connQuery("COMMIT");
      connection.release();

      // Notifications (mocked/safe)
      if (newlySharedStaffSet.size > 0 && process.env.NODE_ENV !== "test") {
        notifySharedStaff(Array.from(newlySharedStaffSet), cleanLeadIds.length);
      }

      return res.status(200).json({
        success: true,
        message: `Successfully shared ${sharedCount} lead-employee pairs. ${skippedCount} were already shared.`,
        sharedCount,
        skippedCount,
      });
    } catch (txErr) {
      await connQuery("ROLLBACK");
      connection.release();
      throw txErr;
    }
  } catch (error) {
    console.error("Error in shareLeads:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const revokeLeadShare = async (req, res) => {
  try {
    const { leadId, staffId } = req.params;
    const currentUser = req.user;
    const currentRole = (currentUser?.staff_role || "").toLowerCase();

    if (!currentUser) {
      return res.status(401).json({ success: false, message: "Unauthenticated" });
    }

    if (!leadId || !staffId) {
      return res.status(400).json({ success: false, message: "leadId and staffId are required" });
    }

    // 1. Fetch the shared entry from lead_assignees
    const shareRows = await new Promise((resolve, reject) => {
      db.query(
        "SELECT la.*, l.lead_org_id FROM lead_assignees la JOIN leads l ON l.lead_id = la.lead_id WHERE la.lead_id = ? AND la.staff_id = ? AND la.access_type = 'shared'",
        [leadId, staffId],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        }
      );
    });

    if (shareRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Shared entry not found for this lead and employee",
      });
    }

    const shareEntry = shareRows[0];

    // 2. Permission check:
    // Can be revoked by:
    // - The employee who granted it (granted_by === currentUser.staff_id)
    // - Admin of the same org
    // - SuperAdmin
    const isGranter = Number(shareEntry.granted_by) === Number(currentUser.staff_id);
    const isAdmin = currentRole === "admin" && Number(shareEntry.lead_org_id) === Number(currentUser.staff_org_id);
    const isSuperAdmin = currentRole === "superadmin";

    if (!isGranter && !isAdmin && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only the employee who shared this lead, or an Admin/SuperAdmin, can revoke it.",
      });
    }

    // 3. Delete from lead_assignees (strictly shared rows only)
    await new Promise((resolve, reject) => {
      db.query(
        "DELETE FROM lead_assignees WHERE lead_id = ? AND staff_id = ? AND access_type = 'shared'",
        [leadId, staffId],
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );
    });

    // Do NOT touch leads.assignedTo (shared rows never affect leads.assignedTo)

    return res.status(200).json({
      success: true,
      message: "Share access revoked successfully",
    });
  } catch (error) {
    console.error("Error revoking lead share:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getSharedByMe = async (req, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ success: false, message: "Unauthenticated" });
    }

    const sql = `
      SELECT 
        la.id AS share_id,
        la.lead_id,
        la.staff_id AS shared_with_staff_id,
        la.created_at AS shared_at,
        cs.staff_name AS shared_with_name,
        cs.staff_email AS shared_with_email,
        cs.staff_phone AS shared_with_phone,
        l.name AS lead_name,
        l.phone AS lead_phone,
        l.lead_status,
        l.createdTime
      FROM lead_assignees la
      JOIN leads l ON l.lead_id = la.lead_id
      JOIN company_staff cs ON cs.staff_id = la.staff_id
      WHERE la.granted_by = ? 
        AND la.access_type = 'shared'
      ORDER BY la.id DESC
    `;

    db.query(sql, [currentUser.staff_id], (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      return res.status(200).json({
        success: true,
        sharedLeads: rows || [],
      });
    });
  } catch (error) {
    console.error("Error fetching shared leads:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


module.exports = {
  bulkUploadLeads,
  updateLeadAssignment,
  bulkAssignLeads,
  removeLeadAssignee,
  shareLeads,
  revokeLeadShare,
  getSharedByMe,
};
