const express = require("express");
const { db } = require("../db");
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const axios = require("axios");
const moment = require("moment-timezone");
const crypto = require("crypto");
const { sendEmail } = require("../utils/emailService");
const dotenv = require("dotenv");
dotenv.config();

const createCompanyProfile = (req, res) => {
  try {
    // Only SuperAdmin can create company profiles
    if (!req.user || req.user.staff_role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden - Only SuperAdmin can create company profiles",
      });
    }

    const {
      company_name,
      industry,
      moblie_no,
      email_id,
      company_address,
    } = req.body;
    const dateTime = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

    const checkQuery = `SELECT * FROM company_profile WHERE email_id = ?`;
    db.query(checkQuery, [email_id], (checkErr, checkResult) => {
      if (checkErr) {
        return res
          .status(400)
          .json({ success: false, message: checkErr.message });
      }

      if (checkResult.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Email already exists, please use another one",
        });
      }

      // cp_subscription_id defaults to 1 until column is removed in Phase 5 DB migration
      const defaultSubscriptionId = 1;
      const insertQuery = `INSERT INTO company_profile 
        (company_name, industry, moblie_no, email_id, company_address, cp_subscription_id, company_created_at) 
        VALUES (?,?,?,?,?, ?,?)`;
      const insertParams = [
        company_name,
        industry,
        moblie_no,
        email_id,
        company_address,
        defaultSubscriptionId,
        dateTime,
      ];

      db.query(insertQuery, insertParams, (err, result) => {
        if (err) {
          return res.status(400).json({ success: false, message: err.message });
        }

        const orgId = result.insertId;

        const getQuery = `SELECT * FROM company_profile WHERE org_id = ?`;
        db.query(getQuery, [orgId], (fetchErr, fetchResult) => {
          if (fetchErr) {
            return res
              .status(400)
              .json({ success: false, message: fetchErr.message });
          }

          res.status(200).json({
            success: true,
            message: "Company/Organization added successfully",
            companyId: result.insertId,
          });
        });
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


const addNewCompanyStaff = (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Authentication required",
      });
    }

    const currentUser = req.user;
    const currentRole = (currentUser.staff_role || "").toLowerCase();

    const {
      staff_org_id,
      staff_role,
      staff_name,
      staff_email,
      staff_phone,
      staff_password,
      // HIDDEN (IT/DM CRM): Referred By
      // referred_by,
      alternative_number,
      // HIDDEN (IT/DM CRM): Date of Birth
      // dob,
      // HIDDEN (IT/DM CRM): Anniversary Date
      // anniversary_date,
      office_business_name,
      office_address,
      // HIDDEN (IT/DM CRM): Nature Of Job
      // nature_of_job,
      // HIDDEN (IT/DM CRM): Department
      // department,
      // HIDDEN (IT/DM CRM): Designation
      // designation,
      // HIDDEN (IT/DM CRM): Badge
      // badge,
      // HIDDEN (IT/DM CRM): Salary
      // salary,
      // HIDDEN (IT/DM CRM): Campaign
      // campaign,
      // HIDDEN (IT/DM CRM): Secondary Project Interest
      // interest_in_project_secondary,
      // HIDDEN (IT/DM CRM): Sub Source
      // lead_sub_source,
      // HIDDEN (IT/DM CRM): Budget Range
      // budget,
      // HIDDEN (IT/DM CRM): Primary Status
      // primary_status,
      // HIDDEN (IT/DM CRM): Secondary Status
      // secondary_status,
      lead_review,
    } = req.body;

    let targetRole;
    let finalStatus;
    let finalOrgId;

    if (currentRole === "superadmin") {
      // SuperAdmin can add Admin and Employee, status = "active"
      const requestedRole = (staff_role || "").toLowerCase();
      if (requestedRole === "admin" || requestedRole === "employee") {
        targetRole = requestedRole;
      } else {
        targetRole = "employee";
      }
      finalStatus = "active";
      finalOrgId = staff_org_id || currentUser.staff_org_id;
    } else if (currentRole === "admin") {
      // Admin: sirf Employee add kar sakta hai, status = "inactive"
      // Role server-side enforce karo (req.user.staff_role se). Client ke body me aaye role par bharosa mat karo.
      // Admin agar role=admin ya superadmin bhej de to reject karo (403).
      const requestedRole = (staff_role || "").toLowerCase();
      if (requestedRole === "admin" || requestedRole === "superadmin") {
        return res.status(403).json({
          success: false,
          message: "Forbidden - Admin cannot create admin or superadmin users",
        });
      }
      targetRole = "employee";
      finalStatus = "inactive";
      // Admin sirf apni org (req.user.staff_org_id) me employee bana sakta hai, body ke org_id par bharosa mat karo.
      finalOrgId = currentUser.staff_org_id;
    } else {
      return res.status(403).json({
        success: false,
        message: "Forbidden - Only SuperAdmin or Admin can create staff",
      });
    }

    if (!staff_name || !staff_email || !staff_password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    const dateTime = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

    const checkQuery = `SELECT * FROM company_staff WHERE staff_email = ?`;
    db.query(checkQuery, [staff_email], async (checkErr, checkResult) => {
      if (checkErr) {
        return res
          .status(400)
          .json({ success: false, message: checkErr.message });
      }

      if (checkResult.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Email already exists, please use another one",
        });
      }

      try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(staff_password, saltRounds);

        // HIDDEN (IT/DM CRM): Omit unused columns (referred_by, dob, anniversary_date, nature_of_job, department, designation, badge, salary, campaign, interest_in_project_secondary, lead_sub_source, budget, primary_status, secondary_status)
        const insertQuery = `INSERT INTO company_staff 
          (staff_org_id, staff_role, staff_name, staff_email, staff_phone, staff_password, staff_status, staff_created_at,
           alternative_number, office_business_name, office_address, lead_review) 
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`;

        const insertParams = [
          finalOrgId,
          targetRole,
          staff_name,
          staff_email,
          staff_phone || null,
          hashedPassword,
          finalStatus,
          dateTime,
          alternative_number || null,
          office_business_name || null,
          office_address || null,
          lead_review || null,
        ];

        db.query(insertQuery, insertParams, (err, result) => {
          if (err) {
            return res
              .status(400)
              .json({ success: false, message: err.message });
          }
          return res.status(201).json({
            success: true,
            message: "Staff member added successfully",
            staff_id: result.insertId,
            staff_role: targetRole,
            staff_status: finalStatus,
          });
        });
      } catch (hashError) {
        return res
          .status(500)
          .json({ success: false, message: "Error hashing password" });
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


const OneOnlylogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send({
        success: false,
        message: "Invalid email or password",
      });
    }

    const checkUserQuery = "SELECT * FROM company_staff WHERE staff_email = ?";
    db.query(checkUserQuery, [email], async (err, results) => {
      if (err) {
        return res
          .status(500)
          .send({ success: false, message: "DB error", error: err.message });
      }

      if (results.length === 0) {
        return res.status(404).send({
          success: false,
          message: "Email is not registered",
        });
      }

      const user = results[0];

      // Prevent inactive or suspended users from logging in
      if (user.staff_status && user.staff_status.toLowerCase() === "inactive") {
        return res.status(403).send({
          success: false,
          message: "Your account is inactive. Please contact administrator.",
        });
      }
      if (user.staff_status && user.staff_status.toLowerCase() === "suspended") {
        return res.status(403).send({
          success: false,
          message: "Your account has been suspended. Please contact administrator.",
        });
      }

      // compare passwords
      const match = await bcrypt.compare(password, user.staff_password);
      if (!match) {
        return res.status(401).send({
          success: false,
          message: "Invalid password",
        });
      }

      const token = JWT.sign({ id: user.staff_id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      res.status(200).send({
        success: true,
        message: "Login successfully",
        user: {
          ...user,
          token,
        },
      });
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in login",
      error: error.message,
    });
  }
};

const sendOtpOnlyOne = (req, res) => {
  const { email, subject } = req.body;

  const selectQuery = "SELECT * FROM company_staff WHERE staff_email = ?";

  db.query(selectQuery, email, async (err, result) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    if (!result || result.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Email not found" });
    }

    // Generate a 6-digit numeric OTP
    const OTP = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      await sendEmail(email, subject, `Your OTP is: ${OTP}`);

      const updateQuery =
        "INSERT INTO otpcollections (email, code) VALUES (?, ?) ON DUPLICATE KEY UPDATE code = VALUES(code)";
      db.query(updateQuery, [email, OTP], (upErr) => {
        if (upErr) {
          return res
            .status(400)
            .json({ success: false, message: upErr.message });
        }
        return res
          .status(200)
          .json({ success: true, message: "OTP sent successfully" });
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  });
};

const resetPasswordOnlyOne = (req, res) => {
  try {
    const { email, password } = req.body;

    const selectQuery = "SELECT * FROM company_staff WHERE staff_email = ?";
    db.query(selectQuery, email, (err, result) => {
      if (err) {
        res.status(400).json({ success: false, message: err.message });
      }
      if (result && result.length) {
        const saltRounds = 10;
        const hashedPassword = bcrypt.hashSync(password, saltRounds);
        const updateQuery = `UPDATE company_staff SET staff_password = ? WHERE staff_email = ?`;
        db.query(updateQuery, [hashedPassword, email], (err, result) => {
          if (err) {
            return res
              .status(400)
              .json({ success: false, message: err.message });
          } else {
            return res.status(200).json({
              success: true,
              message: "Details updated successfully",
            });
          }
        });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "email not found" });
      }
    });
  } catch (error) {
    res.status(500).send({ success: false, message: "Internal server error" });
  }
};

const getEmployeeDetails = (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized - Authentication required" });
    }

    const staffId = req.params.staffId;
    const currentRole = (req.user.staff_role || "").toLowerCase();
    const currentStaffId = req.user.staff_id;
    const currentOrgId = req.user.staff_org_id;

    const selectQuery = `select * from company_staff where staff_id = ?`;
    db.query(selectQuery, [staffId], (err, result) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      if (!result || result.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Employee not found" });
      }

      const target = result[0];
      const targetRole = (target.staff_role || "").toLowerCase();
      const isSelf = Number(target.staff_id) === Number(currentStaffId);
      const isSameOrg = Number(target.staff_org_id) === Number(currentOrgId);

      // SuperAdmin: sab dekh sakta hai
      if (currentRole === "superadmin") {
        return res.status(200).send(result);
      }

      // Employee: sirf apni details dekh sakta hai
      if (currentRole === "employee") {
        if (!isSelf) {
          return res.status(403).json({
            success: false,
            message: "Forbidden - Employees can only view their own details",
          });
        }
        return res.status(200).send(result);
      }

      // Admin:
      // - apni details dekh sakta hai
      // - apni org ke employee dekh sakta hai
      // - doosre Admin (same org ya doosri org) aur SuperAdmin: 403
      // - doosri org ka employee: 403
      if (currentRole === "admin") {
        if (isSelf) {
          return res.status(200).send(result);
        }

        if (targetRole === "superadmin") {
          return res.status(403).json({
            success: false,
            message: "Forbidden - Admins cannot view SuperAdmin details",
          });
        }

        if (targetRole === "admin") {
          return res.status(403).json({
            success: false,
            message: "Forbidden - Admins cannot view other admins",
          });
        }

        if (!isSameOrg) {
          return res.status(403).json({
            success: false,
            message: "Forbidden - Admins can only view employees within their organization",
          });
        }

        // Same org employee
        return res.status(200).send(result);
      }

      return res.status(403).json({
        success: false,
        message: "Forbidden - Access denied",
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateEmployeeDetails = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized - Authentication required" });
    }

    const staffId = req.params.staffId;
    const currentRole = (req.user.staff_role || "").toLowerCase();
    const currentStaffId = req.user.staff_id;
    const currentOrgId = req.user.staff_org_id;

    // Fetch target employee first
    const selectQuery = `SELECT * FROM company_staff WHERE staff_id = ?`;
    db.query(selectQuery, [staffId], async (fetchErr, fetchResults) => {
      if (fetchErr) {
        return res
          .status(500)
          .json({ success: false, message: "Database error", error: fetchErr.message });
      }

      if (!fetchResults || fetchResults.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Employee not found" });
      }

      const target = fetchResults[0];
      const targetRole = (target.staff_role || "").toLowerCase();
      const targetOrgId = target.staff_org_id;
      const targetStaffId = target.staff_id;

      // Employee check: sirf apni details edit kar sake, status/role/org nahi
      if (currentRole === "employee") {
        if (Number(targetStaffId) !== Number(currentStaffId)) {
          return res.status(403).json({
            success: false,
            message: "Forbidden - Employees can only edit their own details",
          });
        }
        if (
          req.body.staff_status !== undefined ||
          req.body.staff_role !== undefined ||
          req.body.staff_org_id !== undefined
        ) {
          return res.status(403).json({
            success: false,
            message: "Forbidden - Employees cannot change role, status, or organization",
          });
        }
      }

      // Admin check:
      // - Admin kisi DOOSRE Admin ki koi bhi details edit nahi kar sakta (naam, phone, password, kuch bhi): 403 (same org ya doosri org)
      // - Admin SuperAdmin ko bhi edit nahi kar sakta: 403
      // - Admin kisi ka staff_role ya staff_org_id nahi badal sakta: 403
      // - Admin doosri org ke kisi staff ko edit nahi kar sakta: 403
      // - Admin apni org ke employee ka status sirf "active" ya "inactive" kar sakta hai (suspended nahi)
      // - Admin apna khud ka status nahi badal sakta: 403
      if (currentRole === "admin") {
        // Admin cannot change anyone's staff_role or staff_org_id
        if (
          req.body.staff_role !== undefined ||
          req.body.staff_org_id !== undefined
        ) {
          return res.status(403).json({
            success: false,
            message: "Forbidden - Admins cannot change staff role or organization",
          });
        }

        // Admin cannot edit SuperAdmin accounts
        if (targetRole === "superadmin") {
          return res.status(403).json({
            success: false,
            message: "Forbidden - Admins cannot edit SuperAdmin accounts",
          });
        }

        // Admin cannot edit any other Admin (same org or other org)
        if (
          targetRole === "admin" &&
          Number(targetStaffId) !== Number(currentStaffId)
        ) {
          return res.status(403).json({
            success: false,
            message: "Forbidden - Admins cannot edit other admins",
          });
        }

        // Admin cannot edit staff outside their organization
        if (
          targetOrgId == null ||
          currentOrgId == null ||
          Number(targetOrgId) !== Number(currentOrgId)
        ) {
          return res.status(403).json({
            success: false,
            message: "Forbidden - Admins can only edit staff within their organization",
          });
        }

        if (req.body.staff_status !== undefined) {
          // Admin cannot change their own status
          if (Number(targetStaffId) === Number(currentStaffId)) {
            return res.status(403).json({
              success: false,
              message: "Forbidden - Admins cannot change their own status",
            });
          }

          // Admin can ONLY change status for users whose staff_role is "employee"
          if (targetRole !== "employee") {
            return res.status(403).json({
              success: false,
              message: "Forbidden - Admins can only change status for employees",
            });
          }

          // Status must be "active" or "inactive" (suspended not allowed for Admin)
          const normalizedStatus = String(req.body.staff_status).toLowerCase();
          if (normalizedStatus !== "active" && normalizedStatus !== "inactive") {
            return res.status(403).json({
              success: false,
              message: "Forbidden - Admins can only set status to active or inactive",
            });
          }
        }
      }

      // SuperAdmin check:
      // Can change Admin and Employee staff_status (active / inactive / suspended) and staff_role
      if (currentRole === "superadmin") {
        if (req.body.staff_status !== undefined) {
          const normalizedStatus = String(req.body.staff_status).toLowerCase();
          if (!["active", "inactive", "suspended"].includes(normalizedStatus)) {
            return res.status(400).json({
              success: false,
              message: "Invalid staff_status. Allowed values: active, inactive, suspended",
            });
          }
        }
      }

      // If user has another role
      if (
        currentRole !== "superadmin" &&
        currentRole !== "admin" &&
        currentRole !== "employee"
      ) {
        return res.status(403).json({
          success: false,
          message: "Forbidden - Unauthorized role",
        });
      }

      const {
        staff_role,
        staff_name,
        staff_email,
        staff_phone,
        staff_password,
        staff_status,
        // HIDDEN (IT/DM CRM): Referred By
        // referred_by,
        alternative_number,
        // HIDDEN (IT/DM CRM): Date of Birth
        // dob,
        // HIDDEN (IT/DM CRM): Anniversary Date
        // anniversary_date,
        office_business_name,
        office_address,
        // HIDDEN (IT/DM CRM): Nature Of Job
        // nature_of_job,
        // HIDDEN (IT/DM CRM): Department
        // department,
        // HIDDEN (IT/DM CRM): Designation
        // designation,
        // HIDDEN (IT/DM CRM): Badge
        // badge,
        // HIDDEN (IT/DM CRM): Salary
        // salary,
        // HIDDEN (IT/DM CRM): Campaign
        // campaign,
        // HIDDEN (IT/DM CRM): Secondary Project Interest
        // interest_in_project_secondary,
        // HIDDEN (IT/DM CRM): Sub Source
        // lead_sub_source,
        // HIDDEN (IT/DM CRM): Budget Range
        // budget,
        // HIDDEN (IT/DM CRM): Primary Status
        // primary_status,
        // HIDDEN (IT/DM CRM): Secondary Status
        // secondary_status,
        lead_review,
      } = req.body;

      const dateTime = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

      let fields = [];
      let values = [];

      // SuperAdmin can change staff_role
      if (currentRole === "superadmin" && staff_role !== undefined) {
        fields.push("staff_role = ?");
        values.push(staff_role);
      }

      // SuperAdmin and authorized Admin can change staff_status
      if (staff_status !== undefined) {
        fields.push("staff_status = ?");
        values.push(String(staff_status).toLowerCase());
      }

      if (staff_name) {
        fields.push("staff_name = ?");
        values.push(staff_name);
      }
      if (staff_email) {
        fields.push("staff_email = ?");
        values.push(staff_email);
      }
      if (staff_phone) {
        fields.push("staff_phone = ?");
        values.push(staff_phone);
      }
      if (staff_password) {
        const hashedPassword = await bcrypt.hash(staff_password, 10);
        fields.push("staff_password = ?");
        values.push(hashedPassword);
      }
      // HIDDEN (IT/DM CRM): Referred By
      // if (referred_by !== undefined) {
      //   fields.push("referred_by = ?");
      //   values.push(referred_by);
      // }
      if (alternative_number !== undefined) {
        fields.push("alternative_number = ?");
        values.push(alternative_number);
      }
      // HIDDEN (IT/DM CRM): Date of Birth
      // if (dob !== undefined) {
      //   fields.push("dob = ?");
      //   values.push(dob);
      // }
      // HIDDEN (IT/DM CRM): Anniversary Date
      // if (anniversary_date !== undefined) {
      //   fields.push("anniversary_date = ?");
      //   values.push(anniversary_date);
      // }
      if (office_business_name !== undefined) {
        fields.push("office_business_name = ?");
        values.push(office_business_name);
      }
      if (office_address !== undefined) {
        fields.push("office_address = ?");
        values.push(office_address);
      }
      // HIDDEN (IT/DM CRM): Nature Of Job
      // if (nature_of_job !== undefined) {
      //   fields.push("nature_of_job = ?");
      //   values.push(nature_of_job);
      // }
      // HIDDEN (IT/DM CRM): Department
      // if (department !== undefined) {
      //   fields.push("department = ?");
      //   values.push(department);
      // }
      // HIDDEN (IT/DM CRM): Designation
      // if (designation !== undefined) {
      //   fields.push("designation = ?");
      //   values.push(designation);
      // }
      // HIDDEN (IT/DM CRM): Badge
      // if (badge !== undefined) {
      //   fields.push("badge = ?");
      //   values.push(badge);
      // }
      // HIDDEN (IT/DM CRM): Salary
      // if (salary !== undefined) {
      //   fields.push("salary = ?");
      //   values.push(salary);
      // }
      // HIDDEN (IT/DM CRM): Campaign
      // if (campaign !== undefined) {
      //   fields.push("campaign = ?");
      //   values.push(campaign);
      // }
      // HIDDEN (IT/DM CRM): Secondary Project Interest
      // if (interest_in_project_secondary !== undefined) {
      //   fields.push("interest_in_project_secondary = ?");
      //   values.push(interest_in_project_secondary);
      // }
      // HIDDEN (IT/DM CRM): Sub Source
      // if (lead_sub_source !== undefined) {
      //   fields.push("lead_sub_source = ?");
      //   values.push(lead_sub_source);
      // }
      // HIDDEN (IT/DM CRM): Budget Range
      // if (budget !== undefined) {
      //   fields.push("budget = ?");
      //   values.push(budget);
      // }
      // HIDDEN (IT/DM CRM): Primary Status
      // if (primary_status !== undefined) {
      //   fields.push("primary_status = ?");
      //   values.push(primary_status);
      // }
      // HIDDEN (IT/DM CRM): Secondary Status
      // if (secondary_status !== undefined) {
      //   fields.push("secondary_status = ?");
      //   values.push(secondary_status);
      // }
      if (lead_review !== undefined) {
        fields.push("lead_review = ?");
        values.push(lead_review);
      }

      fields.push("staff_updated_at = ?");
      values.push(dateTime);

      if (fields.length <= 1) {
        return res
          .status(400)
          .json({ success: false, message: "No fields provided for update" });
      }

      const updateQuery = `UPDATE company_staff SET ${fields.join(
        ", ",
      )} WHERE staff_id = ?`;
      values.push(staffId);

      db.query(updateQuery, values, (err, result) => {
        if (err) {
          return res.status(400).json({ success: false, message: err.message });
        }

        res.status(200).json({
          success: true,
          message: "Employee details updated successfully",
        });
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getEmployeeByOrg = (req, res) => {
  try {
    const orgId = req.params.orgId;
    const selectQuery = `select * from company_staff where staff_org_id = ?`;
    db.query(selectQuery, orgId, (err, result) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      res.status(200).send(result);
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllEmployeeData = (req, res) => {
  const { orgId } = req.params;
  const sql = `SELECT * FROM company_staff WHERE staff_org_id = ?`;

  db.query(sql, [orgId], (err, results) => {
    if (err) {
      res.status(500).json({ success: false, message: err.message });
    } else {
      res.status(200).send(results);
    }
  });
};

const updateOnlyLeadStatusEmployeeEnd = (req, res) => {
  const { id } = req.params;
  const { lead_status } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Lead ID is required" });
  }

  if (!lead_status) {
    return res.status(400).json({ message: "Lead status is required" });
  }

  const dateTime = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  const sql = `UPDATE leads 
               SET lead_status = ?, lead_updated_at = ? 
               WHERE lead_id = ?`;

  db.query(sql, [lead_status, dateTime, id], (err, result) => {
    if (err) {
      console.error("Error updating lead status:", err);
      return res
        .status(500)
        .json({ message: "Internal Server Error", error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Lead not found" });
    }

    return res.status(200).json({ message: "Lead updated successfully" });
  });
};

const getAllUnitSoldByOrg = async (req, res) => {
  try {
    const orgId = req.params.orgId;
    const sql =
      "SELECT employee_sold_units.*, leads.*, company_staff.staff_name, projects.project_name, units.unit_status FROM employee_sold_units join projects on projects.project_id = employee_sold_units.esu_project_id join leads on leads.lead_id = employee_sold_units.esu_lead_id join units on units.unit_id = employee_sold_units.esu_unit_id join company_staff on company_staff.staff_id = employee_sold_units.esu_staff_id WHERE projects.project_org_id = ?";

    db.query(sql, orgId, (err, result) => {
      if (err) {
        res.status(400).json({ success: false, message: err.message });
      }
      res.status(200).send(result);
    });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Erro, error: errr" });
  }
};

const getLeadsByOrg = (req, res) => {
  const { orgId } = req.params;
  const { search, filterDate, leadSource, unitStatus, visitStatus, activeTab } =
    req.query;

  let sql = `SELECT leads.*, company_staff.staff_name, company_staff.staff_email, company_staff.staff_phone, projects.project_name, units.unit_status FROM leads left join company_staff on company_staff.staff_id = leads.assignedTo left join projects on projects.project_id = leads.main_project_id left join units on units.unit_id = leads.unit_id WHERE leads.lead_org_id = ?`;
  const params = [orgId];

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

  db.query(sql, params, (err, results) => {
    if (err) {
      res.status(500).json({ success: false, message: err.message });
    } else {
      res.status(200).send(results);
    }
  });
};

const getOrgDetailsById = (req, res) => {
  try {
    const orgId = req.params.orgId;
    const selectQuery = `select * from company_profile where org_id = ?`;
    db.query(selectQuery, orgId, (err, result) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      return res.status(200).send(result);
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "internal server error" });
  }
};

const updateOrgDetails = async (req, res) => {
  try {
    const orgId = req.params.orgId;
    const {
      company_name,
      company_name_account_name,
      company_name_account_ifsc,
      company_name_account_number,
      bank,
      company_address,
      moblie_no,
      gst_no,
      pan_no,
      email_id,
      website_url,
      org_page_id,
      org_page_access_token,
    } = req.body;

    const dateTime = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

    let fields = [];
    let values = [];

    if (company_name) {
      fields.push("company_name = ?");
      values.push(company_name);
    }
    if (company_name_account_name) {
      fields.push("company_name_account_name = ?");
      values.push(company_name_account_name);
    }
    if (company_name_account_ifsc) {
      fields.push("company_name_account_ifsc = ?");
      values.push(company_name_account_ifsc);
    }
    if (company_name_account_number) {
      fields.push("company_name_account_number = ?");
      values.push(company_name_account_number);
    }
    if (bank) {
      fields.push("bank = ?");
      values.push(bank);
    }
    if (company_address) {
      fields.push("company_address = ?");
      values.push(company_address);
    }
    if (moblie_no) {
      fields.push("moblie_no = ?");
      values.push(moblie_no);
    }
    if (gst_no) {
      fields.push("gst_no = ?");
      values.push(gst_no);
    }
    if (pan_no) {
      fields.push("pan_no = ?");
      values.push(pan_no);
    }
    if (email_id) {
      fields.push("email_id = ?");
      values.push(email_id);
    }
    if (website_url) {
      fields.push("website_url = ?");
      values.push(website_url);
    }
    if (org_page_id) {
      fields.push("org_page_id = ?");
      values.push(org_page_id);
    }
    if (org_page_access_token) {
      fields.push("org_page_access_token = ?");
      values.push(org_page_access_token);
    }

    // Update timestamp
    fields.push("company_updated_at = ?");
    values.push(dateTime);

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields provided for update",
      });
    }

    const updateQuery = `UPDATE company_profile SET ${fields.join(
      ", ",
    )} WHERE org_id = ?`;
    values.push(orgId);

    db.query(updateQuery, values, (err, result) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Organization not found" });
      }

      res.status(200).json({
        success: true,
        message: "Organization details updated successfully",
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDashboardAnalytics = async (req, res) => {
  try {
    const { orgId } = req.params;

    // 1. Untouched Leads Count: leads in the organization with no followups, visits, or remarks
    const untouchedSql = `
      SELECT COUNT(*) as untouched_count FROM leads 
      WHERE lead_org_id = ? 
        AND lead_id NOT IN (SELECT DISTINCT fu_lead_id FROM follow_up_leads WHERE fu_lead_id IS NOT NULL)
        AND lead_id NOT IN (SELECT DISTINCT vis_lead_id FROM visit WHERE vis_lead_id IS NOT NULL)
        AND lead_id NOT IN (SELECT DISTINCT remark_lead_id FROM remark WHERE remark_lead_id IS NOT NULL)
    `;

    // 2. Total Follow-ups for leads in this organization
    const totalFollowUpsSql = `
      SELECT COUNT(*) as total_follow_ups FROM follow_up_leads 
      JOIN leads ON leads.lead_id = follow_up_leads.fu_lead_id 
      WHERE leads.lead_org_id = ?
    `;

    // 3. Total Leads in this organization
    const totalLeadsSql = `
      SELECT COUNT(*) as total_leads FROM leads 
      WHERE leads.lead_org_id = ?
    `;

    db.query(untouchedSql, [orgId], (err, untouchedRes) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      db.query(totalFollowUpsSql, [orgId], (err2, followUpsRes) => {
        if (err2) {
          return res
            .status(400)
            .json({ success: false, message: err2.message });
        }

        db.query(totalLeadsSql, [orgId], (err3, leadsRes) => {
          if (err3) {
            return res
              .status(400)
              .json({ success: false, message: err3.message });
          }

          const untouchedLeads = untouchedRes[0]?.untouched_count || 0;
          const totalFollowUps = followUpsRes[0]?.total_follow_ups || 0;
          const totalLeads = leadsRes[0]?.total_leads || 0;
          const averageFollowUps =
            totalLeads > 0
              ? parseFloat((totalFollowUps / totalLeads).toFixed(2))
              : 0;

          res.status(200).json({
            success: true,
            untouchedLeads,
            totalFollowUps,
            totalLeads,
            averageFollowUps,
          });
        });
      });
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createCompanyProfile,
  addNewCompanyStaff,
  OneOnlylogin,
  sendOtpOnlyOne,
  resetPasswordOnlyOne,
  getEmployeeDetails,
  updateEmployeeDetails,
  getEmployeeByOrg,
  getAllEmployeeData,
  updateOnlyLeadStatusEmployeeEnd,
  getAllUnitSoldByOrg,
  getLeadsByOrg,
  getOrgDetailsById,
  updateOrgDetails,
  getDashboardAnalytics,
};
