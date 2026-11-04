const express = require("express");
const multer = require("multer");
const router = express.Router();
const upload = require("../controllers/fileUploadController");
const {
  generalUpload,
} = require("../config/multerConfig");

const {
  employeeProfile,
  getEmployeeLeads,
  updateLeadStatus,
  updateOnlyLeadStatus,
  updateOnlyPrimaryStatus,
  getAllEmployeeTotalLeads,
  updateFollow_Up,
  deleteFollow_Up,
  createFollow_Up,
  getEmployeeFollow_Up,
  getEmployeeFollow_UpMeta,
  updateOnlyFollowUpStatus,
  createRemark,
  updateRemark,
  deleteRemark,
  getEmployeeRemark,
  getEmployeeRemarkMeta,
  updateOnlyRemarkStatus,
  updateOnlyRemarkAnswer,
  updateOnlyRemarkAnswerStatus,
} = require("../controllers/employeController");
const {
  leads_data,
  createLead,
  getLeads,
  updateLead,
  deleteLead,
  getleadbyid,
  socialmediaLead,
  addProject,
  getAllProjects,
  deleteProject,
  editProject,
  createLeadTransferRequest,
  getPendingTransferRequests,
  respondToTransferRequest,
} = require("../controllers/UserController");

const {
  importLeads,
  saveForm,
  getAllForms,
  fetchLeads,
  getLeadsByFormId,
  updateForm,
  deleteForm,
  getByProjectIdForms,
// Google OAuth removed
  createServiceList,
  getServicelist,
  deleteServicename,
  updateServiceList,
  getServiceById,
} = require("../controllers/Company_Data_Controller");

const {
  sendOtp,
  verifyOtp,
  resetPassword,
  //   verifyOtpSuperAdmin,
  saveWebsiteAPI,
  updateWebsiteAPI,
  deleteWebsiteAPI,
  getwebsite_api,
} = require("../controllers/UserRegitrationlLogin");

const {
  addOrganization,
  deleteOrganization,
  updateOrganization,
  getAllOrganizations,
  getAllEmployees,
  deleteEmployee,
  getEmployeeById,
  updateSingleEmployee,
  getOrganizationById,
  addAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
} = require("../controllers/OrgsnizationActions");

const {
  addNewCompanyStaff,
  OneOnlylogin,
  sendOtpOnlyOne,
  resetPasswordOnlyOne,
  getEmployeeDetails,
  updateEmployeeDetails,
  getEmployeeByOrg,
  getAllEmployeeData,
  updateOnlyLeadStatusEmployeeEnd,
  getLeadsByOrg,
  getDashboardAnalytics,
} = require("../controllers/ControllerNine");

const {
  metaLeadFetchByPageId,
  getMetaLeadsByOrgId,
  updateAndAssignedMetaLeads,
  getMetaLeadsByStaffId,
  getMetaLeadsByLeadId,
  updateOnlyMetaLeadStatusEmployeeEnd,
  bulkUploadLeads,
  updateLeadAssignment,
  bulkAssignLeads,
  removeLeadAssignee,
} = require("../controllers/ControllerTen");


const authenticate = require("../Middleware/authMiddleware");
const httpLogger = require("../httpLogger");

// ========== Router Begins =====================
// Public /register route removed


// Google OAuth routes removed
// router.post("/verifyOtp-superadmin", httpLogger, verifyOtpSuperAdmin);

router.post("/create-servicelist", authenticate, httpLogger, createServiceList);
router.get("/servicelist", authenticate, httpLogger, getServicelist);
router.get("/servicelist/:serviceId", authenticate, httpLogger, getServiceById);
router.delete(
  "/servicelist/:serviceId",
  authenticate,
  httpLogger,
  deleteServicename,
);
router.put("/servicelist", authenticate, httpLogger, updateServiceList);

router.post("/leads", authenticate, httpLogger, createLead);
router.get("/leads/:id", authenticate, httpLogger, getleadbyid);
router.get("/leads-data-user-id/:userId", authenticate, httpLogger, getLeads);
router.put("/leads/:leadId", authenticate, httpLogger, updateLead);
router.delete("/leads/:leadId", authenticate, httpLogger, deleteLead);

// Lead transfer requests
router.post(
  "/leads/transfer-request",
  authenticate,
  httpLogger,
  createLeadTransferRequest,
);
router.get(
  "/leads/transfer-requests/pending",
  authenticate,
  httpLogger,
  getPendingTransferRequests,
);
router.post(
  "/leads/transfer-request/respond",
  authenticate,
  httpLogger,
  respondToTransferRequest,
);

router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

router.get(
  "/employe-leads-admin/:id",
  authenticate,
  httpLogger,
  getEmployeeLeads,
);
router.get(
  "/employe-follow-up-admin/:id",
  authenticate,
  httpLogger,
  getEmployeeFollow_Up,
);
router.get("/remarks-admin/:id", authenticate, httpLogger, getEmployeeRemark);
router.get(
  "/getEmployeeRemarkMeta/:id",
  authenticate,
  httpLogger,
  getEmployeeRemarkMeta,
);
router.get("/leads-super-admin/:userId", authenticate, httpLogger, getLeads);
router.get(
  "/leads-super-admin-byid/:id",
  authenticate,
  httpLogger,
  getleadbyid,
);
router.get(
  "/getAllEmployees-super-admin/:id",
  authenticate,
  httpLogger,
  getAllEmployees,
);
router.get(
  "/employe-leads-super-admin/:id",
  authenticate,
  httpLogger,
  getEmployeeLeads,
);
router.get(
  "/employeeProfile-super-admin/:id",
  authenticate,
  httpLogger,
  employeeProfile,
);

router.get(
  "/employe-follow-up-super-admin/:id",
  authenticate,
  httpLogger,
  getEmployeeFollow_Up,
);
router.get(
  "/remarks-super-admin/:id",
  authenticate,
  httpLogger,
  getEmployeeRemark,
);
router.get("/leads-super-admin/:id", authenticate, httpLogger, getleadbyid);

// Project Related routes
router.post("/project-add", authenticate, httpLogger, addProject);
router.get("/all-project/:orgId", authenticate, httpLogger, getAllProjects);
router.delete("/delete-project/:id", authenticate, httpLogger, deleteProject);
router.put("/edit-project/:id", authenticate, httpLogger, editProject);

router.get(
  "/super-admin-all-project/:orgId",
  authenticate,
  httpLogger,
  getAllProjects,
);

//WebsiteController routes
router.post("/website-api", httpLogger, saveWebsiteAPI);
router.put("/update-website-api", httpLogger, updateWebsiteAPI);
router.delete("/delete-website-api/:id", httpLogger, deleteWebsiteAPI);
router.get("/get-website-api", httpLogger, getwebsite_api);

//import lead router
const leadStorage = multer.memoryStorage();
const leadUpload = multer({ leadStorage });

router.post(
  "/import-leads",
  authenticate,
  leadUpload.single("file"),
  httpLogger,
  importLeads,
);

// Routes for form operations
router.put("/updateform", authenticate, httpLogger, updateForm);
router.delete("/deleteform/:id", authenticate, httpLogger, deleteForm);
router.post("/forms", authenticate, httpLogger, saveForm);
router.get("/forms", authenticate, httpLogger, getAllForms);
router.get("/forms/:id", authenticate, httpLogger, getByProjectIdForms);
router.post("/leads/fetch", authenticate, httpLogger, fetchLeads);
router.get(
  "/Leads-data-fetch-admin/:formId",
  authenticate,
  httpLogger,
  getLeadsByFormId,
);
router.get(
  "/Leads-data-fetch-super-admin/:formId",
  httpLogger,
  authenticate,
  getLeadsByFormId,
);

//Orgsnization Routes
router.post(
  "/addOrganization",
  generalUpload.fields([{ name: "signature" }, { name: "logo" }]),
  authenticate,
  addOrganization,
);
router.get("/getOrganization", authenticate, getAllOrganizations);
router.get("/getOrganization/:id", authenticate, getOrganizationById);
router.delete("/deleteOrganization/:id", authenticate, deleteOrganization);
router.put(
  "/updateOrganization/:companyId",
  generalUpload.fields([{ name: "signature" }, { name: "logo" }]),
  authenticate,
  updateOrganization,
);
router.get("/getAllEmployees/:id", authenticate, getAllEmployees);
router.get("/getEmployeeById/:employeeId", authenticate, getEmployeeById);
router.put(
  "/updateSingleEmployee/:id",
  generalUpload.fields([{ name: "signature" }, { name: "photo" }]),
  authenticate,
  updateSingleEmployee,
);
router.delete("/deleteEmployee/:id", authenticate, deleteEmployee);
router.post("/addAdmin", authenticate, addAdmin);
router.get("/getAllAdmins/:id", authenticate, getAllAdmins);
router.get("/getAdminById/:adminId", authenticate, getAdminById);
router.put("/updateAdmin/:admin_id", authenticate, updateAdmin);
router.delete("/deleteAdmin/:admin_id", authenticate, deleteAdmin);
router.get("/getAllAdmins", authenticate, getAllAdmins);
router.put("/updateAdmin/:admin_id", authenticate, updateAdmin);
router.delete("/deleteAdmin/:admin_id", authenticate, deleteAdmin);

//employee router
router.get("/employeeProfile/:id", authenticate, employeeProfile);
router.get("/employe-leads/:id", authenticate, httpLogger, getEmployeeLeads);
router.get("/employe-follow-up/:id", authenticate, getEmployeeFollow_Up);
router.get(
  "/getEmployeeFollow_UpMeta/:id",
  authenticate,
  getEmployeeFollow_UpMeta,
);
router.put("/employe-follow-up/:fid", authenticate, updateFollow_Up);
router.delete("/employe-follow-up/:id", authenticate, deleteFollow_Up);
router.post("/employe-follow-up", authenticate, createFollow_Up);
router.put(
  "/updateOnlyFollowUpStatus/:id",
  authenticate,
  updateOnlyFollowUpStatus,
);
router.put("/updateLeadStatus/:id", authenticate, updateLeadStatus);
router.put("/updateOnlyLeadStatus/:id", authenticate, updateOnlyLeadStatus);
router.put(
  "/updateOnlyPrimaryStatus/:id",
  authenticate,
  updateOnlyPrimaryStatus,
);
router.get("/getAllEmployee-Toal-lead", authenticate, getAllEmployeeTotalLeads);
router.post("/remarks", authenticate, createRemark);
router.put("/remarks/:rid", authenticate, updateRemark);
router.delete("/remarks/:id", authenticate, deleteRemark);
router.get("/remarks/:id", authenticate, getEmployeeRemark);
router.put("/updateOnlyRemarkStatus/:id", authenticate, updateOnlyRemarkStatus);
router.put(
  "/updateOnlyRemarkAnswerStatus/:id",
  authenticate,
  updateOnlyRemarkAnswerStatus,
);
router.put("/updateOnlyAnswerRemark", authenticate, updateOnlyRemarkAnswer);
router.get("/leads-employee/:id", authenticate, getleadbyid);

//controller nine routes
router.post("/addNewCompanyStaff", authenticate, addNewCompanyStaff);
router.post("/OneOnlylogin", OneOnlylogin);
router.post("/sendOtpOnlyOne", sendOtpOnlyOne);
router.put("/resetPasswordOnlyOne", resetPasswordOnlyOne);
router.get("/getEmployeeDetails/:staffId", authenticate, getEmployeeDetails);
router.put("/updateEmployeeDetails/:staffId", authenticate, updateEmployeeDetails);
router.get("/getEmployeeByOrg/:orgId", authenticate, getEmployeeByOrg);
router.get("/getAllEmployeeData/:orgId", authenticate, getAllEmployeeData);
router.put(
  "/updateOnlyLeadStatusEmployeeEnd/:id",
  authenticate,
  updateOnlyLeadStatusEmployeeEnd,
);
router.get("/getLeadsByOrg/:orgId", authenticate, getLeadsByOrg);
router.get(
  "/getDashboardAnalytics/:orgId",
  authenticate,
  getDashboardAnalytics,
);

// ========Controller ten========
router.post("/metaLeadFetchByPageId", authenticate, metaLeadFetchByPageId);
router.get("/getMetaLeadsByOrgId/:orgId", authenticate, getMetaLeadsByOrgId);
router.put(
  "/updateAndAssignedMetaLeads/:mlid",
  authenticate,
  updateAndAssignedMetaLeads,
);
router.get(
  "/getMetaLeadsByStaffId/:staffId",
  authenticate,
  getMetaLeadsByStaffId,
);
router.get("/getMetaLeadsByLeadId/:metaId", authenticate, getMetaLeadsByLeadId);
router.put(
  "/updateOnlyMetaLeadStatusEmployeeEnd/:id",
  authenticate,
  updateOnlyMetaLeadStatusEmployeeEnd,
);
const excelUpload = multer({ dest: "uploads/" });
router.post(
  "/bulk-upload-leads",
  authenticate,
  httpLogger,
  excelUpload.single("file"),
  bulkUploadLeads,
);

router.put(
  "/updateLeadAssignment/:leadId",
  authenticate,
  httpLogger,
  updateLeadAssignment,
);

router.post(
  "/leads/bulk-assign",
  authenticate,
  httpLogger,
  bulkAssignLeads,
);

router.delete(
  "/leads/:leadId/assignee/:staffId",
  authenticate,
  httpLogger,
  removeLeadAssignee,
);

module.exports = router;
