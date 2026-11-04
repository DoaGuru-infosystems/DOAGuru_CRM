const { db } = require("../db");
const moment = require("moment-timezone");
const { sendEmail } = require("../utils/emailService");
const { sendWhatsAppSoldAlert } = require("../utils/whatsappUtils");

const getEmployeeLeads = async (req, res) => {
  try {
    const { id } = req.params;
    const { search, filterDate, leadSource, unitStatus, visitStatus, activeTab } = req.query;

    const currentUser = req.user;
    const currentRole = (currentUser?.staff_role || "").toLowerCase();

    let targetStaffId = id;
    if (currentRole === "employee") {
      // Employees are strictly restricted to their own leads
      targetStaffId = currentUser.staff_id;
    } else if (currentRole === "admin") {
      // Admins can only view leads of employees belonging to their own organization
      const staffCheck = await new Promise((resolve, reject) => {
        db.query(
          "SELECT staff_id, staff_org_id FROM company_staff WHERE staff_id = ?",
          [targetStaffId],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          }
        );
      });
      if (!staffCheck.length || staffCheck[0].staff_org_id !== currentUser.staff_org_id) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Target employee does not belong to your organization.",
        });
      }
    }

    const isAdminView = req.originalUrl.includes("employe-leads-admin") ||
      req.originalUrl.includes("employe-leads-super-admin");

    let sql = `SELECT leads.*, company_staff.staff_name, company_staff.staff_email, company_staff.staff_phone, projects.project_name FROM leads join company_staff on company_staff.staff_id = leads.assignedTo left join projects on projects.project_id = leads.main_project_id WHERE leads.assignedTo = ?`;
    const params = [targetStaffId];

    if (!isAdminView) {
      sql += ` AND (leads.hidden_by_employee IS NULL OR leads.hidden_by_employee = 0)`;
    }

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

    db.query(sql, params, (err, result) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      return res.status(200).send(result);
    });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};

const updateOnlyLeadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { lead_status } = req.body;

    const sql = `UPDATE leads SET lead_status = ? WHERE lead_id = ?`;

    await new Promise((resolve, reject) => {
      db.query(sql, [lead_status, id], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    res.status(200).json({ message: "Lead updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: err });
  }
};


const updateLeadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      lead_status,
      deal_status,
      meeting_status,
      booking_amount,
      payment_mode,
      registry,
      reason,
      follow_up_status,
      d_closeDate,
    } = req.body;

    const sql = `UPDATE leads SET lead_status = ?, deal_status = ?, meeting_status=?, booking_amount = ?, payment_mode = ?, registry = ?,  reason = ?, follow_up_status = ?, d_closeDate = ? WHERE lead_id = ?`;

    await new Promise((resolve, reject) => {
      db.query(
        sql,
        [
          lead_status,
          deal_status,
          meeting_status,
          booking_amount,
          payment_mode,
          registry,
          reason,
          follow_up_status,
          d_closeDate,
          id,
        ],
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
    });

    res.status(200).json({ message: "Lead updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

const employeeProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = "SELECT * from company_staff WHERE staff_id = ?";

    db.query(sql, id, (err, result) => {
      if (err) {
        res.status(400).json({ success: false, message: err.message });
      }
      res.status(200).send(result);
    });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", error: err });
  }
};

const getAllEmployeeTotalLeads = async (req, res) => {
  try {
    const query = `
    SELECT 
    e.employeeId,
    e.name,
    e.email,
    e.phone,
    COUNT(l.lead_id) AS total_leads
    FROM employee e
    LEFT JOIN leads l ON e.employeeId = l.employeeId
    GROUP BY e.employeeId;
    `;

    db.query(query, (err, results) => {
      if (err) {
        return res.status(500).json({ error: "Internal server error" });
      }
      return res.status(200).json({
        success: true,
        employees: results,
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in fetching employees",
      error: error.message,
    });
  }
};

const getEmployeeFollow_Up = async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
    SELECT * FROM follow_up_leads
    JOIN projects 
      ON projects.project_id = follow_up_leads.fu_project_id
    JOIN leads 
      ON leads.lead_id = follow_up_leads.fu_lead_id
    JOIN company_staff 
      ON company_staff.staff_id = follow_up_leads.fu_employeeId
    WHERE fu_lead_id = ?
  `;

    db.query(sql, [id], (err, results) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      return res.status(200).send(results);
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getEmployeeFollow_UpMeta = async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
    SELECT * FROM follow_up_leads
    JOIN projects 
      ON projects.project_id = follow_up_leads.fu_project_id
    JOIN meta_leads 
      ON meta_leads.leadgen_id = follow_up_leads.fu_lead_id
    JOIN company_staff 
      ON company_staff.staff_id = follow_up_leads.fu_employeeId
    WHERE fu_lead_id = ?
  `;

    db.query(sql, [id], (err, results) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      return res.status(200).send(results);
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// const createFollow_Up = (req, res) => {
//   try {
//     const {
//       fu_project_id,
//       fu_lead_id,
//       fu_employeeId,
//       follow_up_type,
//       follow_up_date,
//       follow_up_report,
//     } = req.body;

//     const dateTime = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

//     const sql = `INSERT INTO follow_up_leads (
//       fu_project_id,
//       fu_lead_id,
//       fu_employeeId,
//       follow_up_type,
//       follow_up_date,
//       follow_up_report,
//       follow_created_at
//     ) VALUES (?, ?, ?, ?, ?, ?, ?)`;

//     const insertParams = [
//       fu_project_id,
//       fu_lead_id,
//       fu_employeeId,
//       follow_up_type,
//       follow_up_date,
//       follow_up_report,
//       dateTime,
//     ];

//     db.query(sql, insertParams, (err, results) => {
//       if (err) {
//         console.error("Error inserting follow-up data:", err);
//         return res.status(500).json({ error: "Error inserting data" });
//       }
//       res.status(201).json({
//         success: true,
//         message: "Follow Up data successfully submitted",
//       });
//     });
//   } catch (error) {
//     console.error("Unexpected error:", error);
//     res.status(500).json({ error: "Something went wrong" });
//   }
// };

const createFollow_Up = (req, res) => {
  try {
    const {
      fu_project_id,
      fu_lead_id,
      fu_employeeId,
      follow_up_type,
      follow_up_date,
      follow_up_report,
      lead_status,
      leadType,
    } = req.body;


    if (!fu_lead_id || !fu_employeeId || !lead_status || !leadType) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const dateTime = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

    const insertSql = `
      INSERT INTO follow_up_leads (
        fu_project_id,
        fu_lead_id,
        fu_employeeId,
        follow_up_type,
        follow_up_date,
        follow_up_report,
        follow_created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const insertParams = [
      fu_project_id,
      fu_lead_id,
      fu_employeeId,
      follow_up_type,
      follow_up_date,
      follow_up_report,
      dateTime,
    ];

    db.query(insertSql, insertParams, (err, results) => {
      if (err) {
        console.error("Error inserting follow-up data:", err);
        return res.status(500).json({
          success: false,
          message: "Error inserting follow-up data",
          error: err.message,
        });
      }


      let updateSql = "";
      let updateParams = [];

      if (leadType === "meta") {
        updateSql = `
          UPDATE meta_leads
          SET meta_lead_status = ?, meta_updated_at = ?
          WHERE leadgen_id = ?
        `;
        updateParams = [lead_status, dateTime, fu_lead_id];
      } else {
        updateSql = `
          UPDATE leads
          SET lead_status = ?, lead_updated_at = ?
          WHERE lead_id = ?
        `;
        updateParams = [lead_status, dateTime, fu_lead_id];
      }

      db.query(updateSql, updateParams, (updateErr, updateResult) => {
        if (updateErr) {
          console.error("Error updating lead status:", updateErr);
          return res.status(500).json({
            success: false,
            message: "Error updating lead status",
            error: updateErr.message,
          });
        }

        if (updateResult.affectedRows === 0) {
          return res.status(404).json({
            success: false,
            message: "Lead not found for status update",
          });
        }

        return res.status(201).json({
          success: true,
          message: "Follow-up created and lead status updated successfully",
        });
      });
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};



const updateFollow_Up = (req, res) => {
  try {
    const fid = req.params.fid;
    const { follow_up_type, follow_up_date, follow_up_report } = req.body;

    const dateTime = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

    let fields = [];
    let values = [];

    if (follow_up_type !== undefined) {
      fields.push("follow_up_type = ?");
      values.push(follow_up_type);
    }

    if (follow_up_date !== undefined) {
      fields.push("follow_up_date = ?");
      values.push(follow_up_date);
    }

    if (follow_up_report !== undefined) {
      fields.push("follow_up_report = ?");
      values.push(follow_up_report);
    }

    fields.push("follow_updated_at = ?");
    values.push(dateTime);

    if (fields.length === 1) {
      return res.status(400).json({ error: "No fields provided to update" });
    }

    const sql = `UPDATE follow_up_leads SET ${fields.join(", ")} WHERE follow_up_id = ?`;
    values.push(fid);

    db.query(sql, values, (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Error updating Follow Up data" });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: "Follow Up not found" });
      }
      return res.status(200).json({
        success: true,
        message: "Follow Up data updated successfully",
      });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error occurred" });
  }
};

const deleteFollow_Up = (req, res) => {
  const { id } = req.params;

  // Basic validation
  if (!id) {
    return res.status(400).json({ error: "Follow Up ID is required" });
  }

  const sql = `DELETE FROM follow_up_leads WHERE follow_up_id = ?`;

  db.query(sql, [id], (err, results) => {
    if (err) {
      res.status(500).json({ error: "Error deleting visit" });
    } else if (results.affectedRows === 0) {
      res.status(404).json({ error: "Follow Up not found" });
    } else {
      res
        .status(200)
        .json({ success: true, message: "Follow Up deleted successfully" });
    }
  });
};

const updateOnlyFollowUpStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { follow_up_status } = req.body;

    const sql = `UPDATE leads SET follow_up_status = ? WHERE lead_id = ?`;

    await new Promise((resolve, reject) => {
      db.query(sql, [follow_up_status, id], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    res.status(200).json({ message: "Follow Up updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: err });
  }
};


// const createRemark = async (req, res) => {
//   try {
//     const {
//       remark_lead_id,
//       remark_project_id,
//       remark_employeeId,
//       remark_status,
//       answer_remark,
//       remark_date,
//     } = req.body;
//     const dateTime = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

//     // Insert remark
//     const sqlRemark = `
//       INSERT INTO remark (
//       remark_lead_id, remark_project_id, remark_employeeId, remark_status,	answer_remark, remark_date, 	remark_created_at
//       ) VALUES (?, ?, ?, ?, ?, ?, ?)`;

//     const insertParams = [
//       remark_lead_id,
//       remark_project_id,
//       remark_employeeId,
//       remark_status,
//       answer_remark,
//       remark_date,
//       dateTime,
//     ];

//     db.query(sqlRemark, insertParams, (err, result) => {
//       if (err) {
//         res.status(400).json({ success: false, message: err.message });
//       }
//       res
//         .status(200)
//         .json({ success: true, message: "remark created successfully" });
//     });
//   } catch (error) {
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

const createRemark = async (req, res) => {
  try {
    const {
      remark_lead_id,
      remark_project_id,
      remark_employeeId,
      remark_status,
      answer_remark,
      remark_date,
      lead_status,
      leadType,
    } = req.body;


    if (!remark_lead_id || !remark_employeeId || !lead_status || !leadType) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const dateTime = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");


    const sqlRemark = `
      INSERT INTO remark (
        remark_lead_id,
        remark_project_id,
        remark_employeeId,
        remark_status,
        answer_remark,
        remark_date,
        remark_created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const insertParams = [
      remark_lead_id,
      remark_project_id,
      remark_employeeId,
      remark_status,
      answer_remark,
      remark_date,
      dateTime,
    ];

    db.query(sqlRemark, insertParams, (err, result) => {
      if (err) {
        console.error("Error inserting remark:", err);
        return res.status(500).json({
          success: false,
          message: "Error inserting remark",
          error: err.message,
        });
      }


      let updateSql = "";
      let updateParams = [];

      if (leadType === "meta") {
        updateSql = `
          UPDATE meta_leads
          SET meta_lead_status = ?, meta_updated_at = ?
          WHERE leadgen_id = ?
        `;
        updateParams = [lead_status, dateTime, remark_lead_id];
      } else {
        updateSql = `
          UPDATE leads
          SET lead_status = ?, lead_updated_at = ?
          WHERE lead_id = ?
        `;
        updateParams = [lead_status, dateTime, remark_lead_id];
      }

      db.query(updateSql, updateParams, (updateErr, updateResult) => {
        if (updateErr) {
          console.error("Error updating lead status:", updateErr);
          return res.status(500).json({
            success: false,
            message: "Error updating lead status",
            error: updateErr.message,
          });
        }

        if (updateResult.affectedRows === 0) {
          return res.status(404).json({
            success: false,
            message: "Lead not found for status update",
          });
        }


        return res.status(201).json({
          success: true,
          message: "Remark created and lead status updated successfully",
        });
      });
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


const updateRemark = (req, res) => {
  try {
    const rid = req.params.rid;
    const { remark_status, answer_remark, remark_date } = req.body;

    const dateTime = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

    let fields = [];
    let values = [];

    if (remark_status !== undefined) {
      fields.push("remark_status = ?");
      values.push(remark_status);
    }

    if (answer_remark !== undefined) {
      fields.push("answer_remark = ?");
      values.push(answer_remark);
    }

    if (remark_date !== undefined) {
      fields.push("remark_date = ?");
      values.push(remark_date);
    }


    fields.push("remark_updated_at = ?");
    values.push(dateTime);

    if (fields.length === 0) {
      return res.status(400).json({ error: "No fields provided to update" });
    }

    const sql = `UPDATE remark SET ${fields.join(", ")} WHERE remark_id = ?`;
    values.push(rid);

    db.query(sql, values, (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Error updating remark data" });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: "Remark not found" });
      }
      return res
        .status(200)
        .json({ success: true, message: "Remark updated successfully" });
    });
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
};



const deleteRemark = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "Remark ID is required" });
  }

  const sql = `DELETE FROM remark WHERE remark_id = ?`;

  db.query(sql, [id], (err, results) => {
    if (err) {
      res.status(500).json({ error: "Error deleting remark" });
    } else if (results.affectedRows === 0) {
      res.status(404).json({ error: "Remark not found" });
    } else {
      res
        .status(200)
        .json({ success: true, message: "Remark deleted successfully" });
    }
  });
};

const getEmployeeRemark = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = "SELECT * FROM remark join projects on projects.project_id = remark.remark_project_id join leads on leads.lead_id = remark.remark_lead_id join company_staff on company_staff.staff_id = remark.remark_employeeId WHERE remark.remark_lead_id = ?";

    db.query(sql, id, (err, result) => {
      if (err) {
        res.status(400).json({ success: false, message: err.message });
      }
      res.status(200).send(result);
    });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Erro, error: errr" });
  }
};

const getEmployeeRemarkMeta = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = "SELECT * FROM remark join projects on projects.project_id = remark.remark_project_id join meta_leads on meta_leads.leadgen_id = remark.remark_lead_id join company_staff on company_staff.staff_id = remark.remark_employeeId WHERE remark.remark_lead_id = ?";

    db.query(sql, id, (err, result) => {
      if (err) {
        res.status(400).json({ success: false, message: err.message });
      }
      res.status(200).send(result);
    });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Erro, error: errr" });
  }
};


const updateOnlyRemarkStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { remark_status } = req.body;

    const sql = `UPDATE leads SET remark_status = ? WHERE lead_id = ?`;

    await new Promise((resolve, reject) => {
      db.query(sql, [remark_status, id], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    res.status(200).json({ message: "Remarks Status updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: err });
  }
};
const updateOnlyRemarkAnswerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { answer_remark } = req.body;

    const sql = `UPDATE leads SET answer_remark = ? WHERE lead_id = ?`;

    await new Promise((resolve, reject) => {
      db.query(sql, [answer_remark, id], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    res.status(200).json({ message: "Answer Remark updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: err });
  }
};


const updateOnlyRemarkAnswer = async (req, res) => {
  try {
    const { lead_id, answer_remark, remark_id } = req.body;

    const sqlUpdateLeads = `UPDATE leads SET answer_remark = ? WHERE lead_id = ?`;
    const sqlUpdateRemark = `UPDATE remark SET answer_remark = ? WHERE id = ?`;

    await new Promise((resolve, reject) => {
      db.query(sqlUpdateLeads, [answer_remark, lead_id], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    await new Promise((resolve, reject) => {
      db.query(sqlUpdateRemark, [answer_remark, remark_id], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    res.status(200).json({ message: "Answer Remark status updated successfully in both tables" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
}


const updateOnlyPrimaryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { primary_status } = req.body;

    const sql = `UPDATE leads SET primary_status = ? WHERE lead_id = ?`;

    await new Promise((resolve, reject) => {
      db.query(sql, [primary_status, id], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    res.status(200).json({ message: "Primary status updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

module.exports = {
  updateOnlyPrimaryStatus,
  getEmployeeLeads,
  updateLeadStatus,
  employeeProfile,
  updateOnlyLeadStatus,
  getAllEmployeeTotalLeads,
  getEmployeeFollow_Up,
  createFollow_Up,
  deleteFollow_Up,
  updateFollow_Up,
  updateOnlyFollowUpStatus,
  createRemark, updateRemark,
  deleteRemark, getEmployeeRemark,
  updateOnlyRemarkStatus,
  updateOnlyRemarkAnswer,
  updateOnlyRemarkAnswerStatus,
  getEmployeeFollow_UpMeta,
  getEmployeeRemarkMeta,
};
