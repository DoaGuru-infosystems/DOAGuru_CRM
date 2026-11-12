const { db } = require("../db");
const xlsx = require("xlsx");
const moment = require("moment-timezone");
const dotenv = require('dotenv');
dotenv.config();

const importLeads = (req, res) => {
  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (!sheetData.length) {
      return res.status(400).json({ error: 'No data found in the Excel file' });
    }

    // Form data from frontend
    const {
      lead_org_id,
      assignedTo,
      employeeId,
      main_project_id,
      project_name,
      unit_type,
      unit_id,
      assignedBy,
      user_id,
      assigned_date
    } = req.body;

    const convertExcelDate = (excelDate) => {
      return typeof excelDate === "number"
        ? moment(new Date((excelDate - 25569) * 86400 * 1000)).format("YYYY-MM-DD")
        : moment(excelDate, "DD-MM-YYYY").isValid()
          ? moment(excelDate, "DD-MM-YYYY").format("YYYY-MM-DD")
          : null;
    };

    let finalAssignedDate = assigned_date ? String(assigned_date).trim() : "";
    if (!finalAssignedDate) {
      finalAssignedDate = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(finalAssignedDate)) {
      finalAssignedDate = `${finalAssignedDate} ${moment().tz("Asia/Kolkata").format("HH:mm:ss")}`;
    } else {
      const m = moment.tz(finalAssignedDate, "Asia/Kolkata");
      if (m.isValid()) finalAssignedDate = m.format("YYYY-MM-DD HH:mm:ss");
    }

    const currentUser = req.user;
    const currentRole = (currentUser?.staff_role || "").toLowerCase();

    let effectiveOrgId = currentUser?.staff_org_id || lead_org_id;
    if (currentRole === "superadmin") {
      effectiveOrgId = lead_org_id || currentUser?.staff_org_id;
    }

    const values = sheetData.map((lead) => [
      effectiveOrgId,
      currentUser?.staff_id || user_id || null,
      currentUser?.staff_role || null,
      lead["Name"] || null,
      lead["Phone"] || null,
      assignedTo || employeeId || null,
      lead["Lead Source"] || null,
      null, // main_project_id decoupled (NULL)
      unit_type || null,
      unit_id || null,
      lead["Address"] || null,
      finalAssignedDate,
      convertExcelDate(lead["Actual Date"]),
      assignedBy || null,
    ]);

    const sql = `
      INSERT INTO leads (
        lead_org_id,
        created_by,
        created_by_role,
        name,
        phone,
        assignedTo,
        leadSource,
        main_project_id,
        unit_type,
        unit_id,
        address,
        createdTime,
        actual_date,
        assignedBy
      ) VALUES ?
    `;

    db.query(sql, [values], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database insert failed', details: err });
      }
      res.status(200).json({ message: 'Leads imported successfully', inserted: result.affectedRows });
    });

  } catch (error) {
    res.status(500).json({ error: 'File processing failed', details: error.message });
  }
};

// Google OAuth removed

const createServiceList = async (req, res) => {
  try {
    const { services } = req.body;
    const servicesValues = services.map((service) => [service.service_name]);
    const sql = "INSERT INTO services (service_name) VALUES ?";
    await new Promise((resolve, reject) => {
      db.query(sql, [servicesValues], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    res.status(201).json({ success: true, message: 'Services added successfully' });
  } catch (error) {
    console.error('Error adding services:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}


const getServicelist = async (req, res) => {
  const sql = `SELECT * FROM services`;
  db.query(sql, (err, result) => {
    if (err) {
      console.error('Error feching services:', err);
      res.status(500).json({ error: "Internal Server Error" })
    } else {
      res.status(200).json(result);
    }
  })
}

const getServiceById = async (req, res) => {
  const { serviceId } = req.params;
  const sql = `SELECT * FROM services WHERE service_id = ? `
  db.query(sql, [serviceId], (err, result) => {
    if (err) {
      console.error('Error feching services:', err);
      res.status(500).json({ error: "Internal Server Error" })
    } else {
      res.status(200).json(result);
    }
  })
}

const deleteServicename = async (req, res) => {
  const { serviceId } = req.params;
  const sql = `DELETE FROM services WHERE service_id = ? `

  db.query(sql, [serviceId], (error, result) => {
    if (error) {
      console.error("Error of Deleteing Service");
      res.status(500).json({ error: "Internal Server Error " });
    } else {
      console.log("Successful Delete Service");
      res.status(200).json({ success: "Successful Delete Service" })
    }
  })
}

const updateServiceList = async (req, res) => {
  try {
    const { services } = req.body;
    for (const service of services) {
      const { service_name, service_id } = service;
      const sql = `UPDATE services SET service_name = ? WHERE service_id = ?`;
      await new Promise((resolve, reject) => {
        db.query(sql, [service_name, service_id], (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    }
    res.status(200).json({ success: true, message: 'Services updated successfully' });
  } catch (error) {
    console.error('Error updating services:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports = {
  importLeads,
// Google OAuth functions unexported
  createServiceList,
  getServicelist,
  deleteServicename,
  updateServiceList,
  getServiceById
};
