const { db } = require("../db");
const axios = require('axios');
const xlsx = require("xlsx");
const moment = require("moment-timezone");
const dotenv = require('dotenv');
dotenv.config();

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

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
      currentUser?.staff_id || null,
      currentUser?.staff_role || null,
      lead["Name"] || null,
      lead["Phone"] || null,
      assignedTo || null,
      lead["Lead Source"] || null,
      employeeId,
      project_name,
      main_project_id || null,
      unit_type,
      unit_id || null,
      lead["Address"] || null,
      finalAssignedDate,
      convertExcelDate(lead["Actual Date"]),
      assignedBy,
      user_id,
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
        employeeId,
        project_name,
        main_project_id,
        unit_type,
        unit_id,
        address,
        createdTime,
        actual_date,
        assignedBy,
        user_id
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

const saveForm = (req, res) => {
  const { formId, formName, project_id } = req.body;
  db.query(
    'INSERT INTO formtable (form_id, form_name,project_id) VALUES (?, ?,?)',
    [formId, formName, project_id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to save form data' });
      }
      res.status(200).json({ message: 'Form saved successfully!' });
    }
  );
};

const updateForm = (req, res) => {
  const { id, form_id, form_name } = req.body;

  if (!id || !form_id || !form_name) {
    return res.status(400).json({ error: 'ID ,Form ID and Form Name are required' });
  }

  db.query(
    'UPDATE formtable SET  form_id = ?, form_name = ? WHERE id = ?',
    [form_id, form_name, id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to update form data' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Form not found' });
      }
      res.status(200).json({ message: 'Form updated successfully!' });
    }
  );
};

const deleteForm = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Form ID is required' });
  }

  db.query(
    'DELETE FROM formtable WHERE id = ?',
    [id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete form data' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Form not found' });
      }
      res.status(200).json({ message: 'Form deleted successfully!' });
    }
  );
};

const getAllForms = (req, res) => {
  db.query('SELECT * FROM formtable', (err, results) => {
    if (err) {
      console.error('Error fetching forms:', err);
      return res.status(500).json({ error: 'Failed to fetch forms' });
    }
    res.status(200).json(results);
  });
};

const getByProjectIdForms = (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM formtable WHERE project_id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error fetching forms:', err);
      return res.status(500).json({ error: 'Failed to fetch forms' });
    }
    res.status(200).json(results);
  });
};

const fetchLeads = async (req, res) => {
  const { formId } = req.body;

  if (!formId) {
    return res.status(400).json({ error: 'Form ID is required' });
  }

  try {
    const response = await axios.get(`https://graph.facebook.com/v20.0/${formId}?fields=name,leads&access_token=${ACCESS_TOKEN}`);

    const leads = response.data.leads?.data || [];

    for (const lead of leads) {
      const leadId = lead.id;
      const fullName = extractFieldValue(lead.field_data, 'full_name');
      const phoneNumber = extractFieldValue(lead.field_data, 'phone_number');
      const streetAddress = extractFieldValue(lead.field_data, 'street_address');
      const createdTime = new Date(lead.created_time);

      // Check for duplicate entry before inserting
      const checkDuplicateQuery = `
          SELECT COUNT(*) as count FROM leadstable 
          WHERE lead_id = ? OR  phone_number = ?`;

      db.query(checkDuplicateQuery, [leadId, phoneNumber], (err, results) => {
        if (err) {
          console.error('Error checking for duplicate lead:', err);
          return;
        }

        if (results[0].count === 0) {
          const insertQuery = `
              INSERT INTO leadstable (lead_id, full_name, phone_number, street_address, created_time, form_id) 
              VALUES (?, ?, ?, ?, ?, ?)`;

          db.query(insertQuery, [leadId, fullName, phoneNumber, streetAddress, createdTime, formId], (insertErr, result) => {
            if (insertErr) {
              console.error('Error inserting lead:', insertErr);
            }
          });
        } else {
          console.log(`Duplicate lead found: ${fullName}, Phone: ${phoneNumber}, Lead ID: ${leadId}. Skipping...`);
        }
      });
    }

    res.status(200).json({ message: 'Leads fetched and saved successfully', leads });

  } catch (err) {
    console.error('Error fetching leads from Meta API:', err);
    res.status(500).json({ error: 'Failed to fetch leads from Meta API' });
  }

};

const getLeadsByFormId = (req, res) => {
  const formId = req.params.formId;
  db.query('SELECT * FROM leadstable WHERE form_id = ? ORDER BY created_time DESC', [formId], (err, results) => {
    if (err) {
      console.error('Error fetching leads:', err);
      return res.status(500).json({ error: 'Failed to fetch leads' });
    }
    res.status(200).json(results);
  });
};

const extractFieldValue = (fieldData, fieldName) => {
  const field = fieldData.find(item => item.name === fieldName);
  return field ? field.values[0] : '';
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
  saveForm,
  updateForm,
  deleteForm,
  getAllForms,
  fetchLeads,
  getLeadsByFormId,
  getByProjectIdForms,
// Google OAuth functions unexported
  createServiceList,
  getServicelist,
  deleteServicename,
  updateServiceList,
  getServiceById
};
