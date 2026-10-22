const express = require("express");
const multer = require("multer");
const router = express.Router();
const upload = require("../controllers/fileUploadController");
const {
  generalUpload,
  uploadRegistryDoc,
} = require("../config/multerConfig");

const {
  getEmployeeInvoice,
  employeeProfile,
  getEmployeeLeads,
  updateLeadStatus,
  getEmployeeQuotation,
  updateOnlyLeadStatus,
  updateOnlyPrimaryStatus,
  updateOnlyQuotationStatus,
  getAllEmployeeTotalLeads,
  getLeadQuotation,
  getEmployeeVisit,
  createVisit,
  updateVisit,
  deleteVisit,
  getEmployeebyidvisit,
  AllgetEmployeebyvisit,
  updateOnlyVisitStatus,
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
  createEmployeeUnitSold,
  updateEmployeeUnitSold,
  deleteEmployeeUnitSold,
  getEmployeeUnitSold,
  getEmployeeUnitSoldById,
  getUnitDataByUnitId,
  updateOnlyUnitDataStatusById,
  updateOnlyUnitStatus,
  getEmployeeUnitSoldByLeadId,
  getEmployeeUnitSoldByLeadIdMeta,
} = require("../controllers/employeController");
const {
  Quotation,
  GetQuotation,
  Quotationviaid,
  GetServices,
  deleteQuotation,
  updateServices,
  Notes,
  getNotes,
  deleteNote,
  addServices,
  deleteService,
  getnotes_text,
  UpdateQuotationName,
  CopyQuotationData,
  GetQuotationName,
  updateNote,
  leads_data,
  createLead,
  getLeads,
  updateLead,
  deleteLead,
  editProfile,
  getAllUsers,
  deleteProfile,
  getleadbyid,
  getAllQuotation,
  updateQuotationStatus,
  socialmediaLead,
  getLeadsVisitByOrgId,
  getLeadsByIdVisit,
  quotationInformationForm,
  addProject,
  getAllProjects,
  deleteProject,
  editProject,
  addUnit,
  getUnits,
  getUnitById,
  getUnitsByProject,
  deleteUnit,
  updateUnit,
  updateUnitmanualy,
  getUnitsdistributeById,
  getUnitByProjectId,
  getUnitDetailsById,
  editUnitdetails,
  createLeadTransferRequest,
  getPendingTransferRequests,
  respondToTransferRequest,
} = require("../controllers/UserController");

const {
  fetchcompanyname,
  company_name_header_footer,
  deleteCompanydata,
  CompanyDataUpload,
  updateCompanyData,
  getCompanydata,
  getcompany_name_data,
  getResponses,
  importLeads,
  saveForm,
  getAllForms,
  fetchLeads,
  getLeadsByFormId,
  updateForm,
  deleteForm,
  getByProjectIdForms,
  googleOAuthLogin,
  googleOAuthCallback,
  getGoogleAuthUrl,
  createServiceList,
  getServicelist,
  deleteServicename,
  updateServiceList,
  getServiceById,
} = require("../controllers/Company_Data_Controller");

const {
  register,
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
  createInvoice,
  getInvoice,
  deleteInvoice,
  UpdateInvoiceName,
  GetInvoiceName,
  invoiceserviceid,
  deleteServiceInvoice,
  addServicesInvoice,
  updateServicesInvoice,
  getInvoiceiddata,
  getInvoiceAddress,
  CompanyIncoiceData,
  fetchcompanyinvoicename,
  company_name_invoice_data,
  CopyInvoiceData,
  createNote,
  deleteInvoiceNote,
  getInvoiceNotes,
  createInvoiceNote,
  InvoiceNotes,
  InvoicegetNotes,
  InvoicedeleteNote,
  InvoiceupdateNote,
  UpdateInvoice_No,
  UpdateInvoice_date,
  UpdateInvoice_start_date,
  UpdateInvoice_end_date,
  getInvoiceDate,
  getAllInvoice,
} = require("../controllers/InvoiceController");

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
} = require("../controllers/ControllerNine");

const {
  metaLeadFetchByPageId,
  getMetaLeadsByOrgId,
  updateAndAssignedMetaLeads,
  getAllUnitsByProjectId,
  getMetaLeadsByStaffId,
  getMetaLeadsByLeadId,
  updateOnlyMetaLeadStatusEmployeeEnd,
  createFinanceCompany,
  createOwnerPayments,
  getOwnerPaymentsByMultiIds,
  createOwnerLoan,
  getFinanceCompanyByOrg,
  deleteFinanceCompany,
  updateFinanceCompany,
  getLoanEmiDetailsByLoanID,
  updateInstallments,
  updateEmployeeUnitSoldUpdate,
  bulkUploadLeads,
  updateLeadAssignment,
  addUnitsBulk,
} = require("../controllers/ControllerTen");


const {
  createBooking,
  getBookingBYleadId,
  updateBooking,
  createRegistry,
  getRegistryBYleadId,
  updateRegistry,
  deleteRegistry,
  addUtilityCharges,
  getUtilityBYleadId,
  updateUtilityCharges,
  deleteUtilityCharges,
  updateSoldDetails,
  addPaymentRecord,
  updatePaymentStatus,
  updateRegistryPaymentStatus,
  updateUtilityPaymentStatus,
  getAllTransanctionByESUId,
  updatePaymentRecord,
} = require("../controllers/controllerEleven");

const authenticate = require("../Middleware/authMiddleware");
const httpLogger = require("../httpLogger");

// ========== Router Begins =====================
router.post("/register", httpLogger, register);


// Google OAuth routes for Super Admin
router.post("/google-oauth-login", httpLogger, googleOAuthLogin);
router.post("/google-oauth-callback", httpLogger, googleOAuthCallback);
router.get("/google-auth-url", httpLogger, getGoogleAuthUrl);
// router.post("/verifyOtp-superadmin", httpLogger, verifyOtpSuperAdmin);
router.put("/quotation/:quotationId", authenticate, httpLogger, updateServices);
router.post("/quotation", authenticate, httpLogger, Quotation);
router.delete("/quotation/:id", authenticate, httpLogger, deleteQuotation);
router.post("/services/:id", authenticate, httpLogger, addServices);
router.delete("/services/:serviceId", authenticate, httpLogger, deleteService);
router.get("/quotation/:id", authenticate, httpLogger, Quotationviaid);
router.get("/quotation-data", authenticate, httpLogger, GetQuotation);

//Route to Quotation Information Form
router.post(
  "/quotation-information-form",
  authenticate,
  httpLogger,
  quotationInformationForm,
);

// Route to update quotation status
router.post(
  "/update-quotation-status",
  authenticate,
  httpLogger,
  updateQuotationStatus,
);

router.put(
  "/quotation-data/:quotationId",
  authenticate,
  httpLogger,
  UpdateQuotationName,
);
router.post(
  "/copy-quotation/:quotationId",
  authenticate,
  httpLogger,
  CopyQuotationData,
);
router.get(
  "/quotation-name/:quotationId",
  authenticate,
  httpLogger,
  GetQuotationName,
);

router.get("/services", authenticate, httpLogger, GetServices);

router.post("/notes", authenticate, httpLogger, Notes);
router.get("/notes/:quotationId", authenticate, httpLogger, getNotes);
router.delete("/notes/:noteId", authenticate, httpLogger, deleteNote);
router.get("/notes_data", authenticate, httpLogger, getnotes_text);
router.put("/notes", authenticate, httpLogger, updateNote);

router.post(
  "/upload-company-profile",
  upload.fields([
    { name: "header_img" },
    { name: "footer_img" },
    { name: "logo" },
    { name: "digital_sign" },
  ]),
  authenticate,
  httpLogger,
  CompanyDataUpload,
); //ff
router.get(
  "/header-footer-images/company-names",
  authenticate,
  httpLogger,
  fetchcompanyname,
);
router.get("/company-data", authenticate, httpLogger, getCompanydata); //hh
router.post(
  "/company-header-footer",
  authenticate,
  httpLogger,
  company_name_header_footer,
);
router.post("/companydata", authenticate, httpLogger, deleteCompanydata);
router.put(
  "/companydata/:id",
  upload.fields([
    { name: "header_img" },
    { name: "footer_img" },
    { name: "logo" },
    { name: "digital_sign" },
  ]),
  authenticate,
  httpLogger,
  updateCompanyData,
); //ff
router.post(
  "/company-name-data",
  authenticate,
  httpLogger,
  getcompany_name_data,
); //fcf

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

router.post("/create-invoice", authenticate, httpLogger, createInvoice);
router.get("/invoice-data", authenticate, httpLogger, getInvoice);
router.get("/invoice-data-dash", authenticate, httpLogger, getAllInvoice);
router.delete("/invoice/:id", authenticate, httpLogger, deleteInvoice);
router.put(
  "/invoice-data/:invoiceId",
  authenticate,
  httpLogger,
  UpdateInvoiceName,
);

router.put(
  "/invoice-no/:invoiceId",
  authenticate,
  httpLogger,
  UpdateInvoice_No,
);
router.put(
  "/invoice-date/:invoiceId",
  authenticate,
  httpLogger,
  UpdateInvoice_date,
);
router.put(
  "/invoice-start-date/:invoiceId",
  authenticate,
  httpLogger,
  UpdateInvoice_start_date,
);
router.put(
  "/invoice-end-date/:invoiceId",
  authenticate,
  httpLogger,
  UpdateInvoice_end_date,
);

router.get("/invoice-date/:id", authenticate, httpLogger, getInvoiceDate);

router.get(
  "/invoice-name/:invoiceId",
  authenticate,
  httpLogger,
  GetInvoiceName,
);
router.get("/invoice/:id", authenticate, httpLogger, invoiceserviceid);
router.get("/invoice-address/:id", authenticate, httpLogger, getInvoiceAddress);
router.delete(
  "/invoice-service/:serviceId",
  authenticate,
  httpLogger,
  deleteServiceInvoice,
);
router.post(
  "/add-invoice-services/:id",
  authenticate,
  httpLogger,
  addServicesInvoice,
);
router.put(
  "/invoice/:invoiceId",
  authenticate,
  httpLogger,
  updateServicesInvoice,
);
router.post(
  "/upload-invoice-profile",
  upload.fields([{ name: "logo" }]),
  authenticate,
  httpLogger,
  CompanyIncoiceData,
);
router.get(
  "/company-invoice-names/:UserId",
  authenticate,
  httpLogger,
  fetchcompanyinvoicename,
);
router.post(
  "/company-invoice-data",
  authenticate,
  httpLogger,
  company_name_invoice_data,
);
router.post(
  "/copy-invoice/:invoiceId",
  authenticate,
  httpLogger,
  CopyInvoiceData,
);

router.post("/invoice-notes", authenticate, httpLogger, InvoiceNotes);
router.get(
  "/invoice-get-notes/:invoiceId",
  authenticate,
  httpLogger,
  InvoicegetNotes,
);
router.delete(
  "/delete-notes/:noteId",
  authenticate,
  httpLogger,
  InvoicedeleteNote,
);
router.put(
  "/invoice-update-notes",
  authenticate,
  httpLogger,
  InvoiceupdateNote,
);

router.post("/leads", authenticate, httpLogger, createLead);
router.get("/leads/:id", authenticate, httpLogger, getleadbyid);
router.get("/leads-data-user-id/:userId", authenticate, httpLogger, getLeads);
router.get(
  "/leads-visits/:employeeId",
  authenticate,
  httpLogger,
  getLeadsByIdVisit,
);
router.get(
  "/leads-all-visits/:orgId",
  authenticate,
  httpLogger,
  getLeadsVisitByOrgId,
);
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

router.get("/get-invoice-data", authenticate, httpLogger, getAllInvoice);
router.get("/get-quotation-data", authenticate, httpLogger, getAllQuotation);

// aditya routes

// Fetch all users
router.get("/getUser", authenticate, httpLogger, getAllUsers);
router.post(
  "/editProfile",
  generalUpload.single("profile_picture"),
  authenticate,
  httpLogger,
  editProfile,
);
router.delete("/deleteUser", authenticate, httpLogger, deleteProfile);
router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

router.get("/quotation-data-admin", authenticate, httpLogger, GetQuotation);
router.get("/quotation-admin/:id", authenticate, httpLogger, Quotationviaid);
router.get(
  "/employe-all-visit-admin",
  authenticate,
  httpLogger,
  AllgetEmployeebyvisit,
);
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
router.get(
  "/employe-visit-admin/:id",
  authenticate,
  httpLogger,
  getEmployeeVisit,
);
router.get(
  "/get-quotation-byLead-admin/:id",
  authenticate,
  httpLogger,
  getLeadQuotation,
);
router.get("/leads-super-admin/:userId", authenticate, httpLogger, getLeads);
router.get(
  "/leads-super-admin-byid/:id",
  authenticate,
  httpLogger,
  getleadbyid,
);
router.get(
  "/employe-all-visit-super-admin",
  authenticate,
  httpLogger,
  AllgetEmployeebyvisit,
);
router.get(
  "/quotation-data-super-admin",
  authenticate,
  httpLogger,
  GetQuotation,
);
router.get(
  "/quotation-super-admin/:id",
  authenticate,
  httpLogger,
  Quotationviaid,
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

router.get(
  "/employe-visit-super-admin/:id",
  authenticate,
  httpLogger,
  getEmployeeVisit,
);
router.get(
  "/get-quotation-byLead-super-admin/:id",
  authenticate,
  httpLogger,
  getLeadQuotation,
);

// Project Related routes
router.post("/project-add", authenticate, httpLogger, addProject);
router.get("/all-project/:orgId", authenticate, httpLogger, getAllProjects);
router.delete("/delete-project/:id", authenticate, httpLogger, deleteProject);
router.put("/edit-project/:id", authenticate, httpLogger, editProject);
router.post("/add-unit", authenticate, httpLogger, addUnit);
router.get("/units", authenticate, httpLogger, getUnits);
router.get("/units/:id", authenticate, httpLogger, getUnitById);
router.get(
  "/getUnitsdistributeById/:id",
  authenticate,
  httpLogger,
  getUnitsdistributeById,
);
router.get("/units/project", authenticate, httpLogger, getUnitsByProject);
router.delete("/delete-unit/:id", authenticate, httpLogger, deleteUnit);
router.put("/edit-unit/:id", authenticate, httpLogger, updateUnit);
router.put(
  "/updateUnitmanualy/:unit_id",
  authenticate,
  httpLogger,
  updateUnitmanualy,
);
router.get("/project-unit/:id", authenticate, httpLogger, getUnitByProjectId);
router.get(
  "/getUntitsDetailById/:id",
  authenticate,
  httpLogger,
  getUnitDetailsById,
);
router.put(
  "/editUnitdetailsinner/:id",
  authenticate,
  httpLogger,
  editUnitdetails,
);

router.get(
  "/admin-unit-sold/:userId",
  authenticate,
  httpLogger,
  getEmployeeUnitSold,
);
router.get(
  "/admin-unit-sold/:id",
  authenticate,
  httpLogger,
  getEmployeeUnitSoldById,
);
router.get(
  "/admin-unit-data/:id",
  authenticate,
  httpLogger,
  getUnitDataByUnitId,
);
router.get(
  "/admin-unit-sold-lead-id/:id",
  authenticate,
  httpLogger,
  getEmployeeUnitSoldByLeadId,
);

router.get(
  "/super-admin-all-project/:orgId",
  authenticate,
  httpLogger,
  getAllProjects,
);
router.get("/super-admin-units", authenticate, httpLogger, getUnits);
router.get("/super-admin-units/:id", authenticate, httpLogger, getUnitById);
router.get(
  "/super-admin-getUnitsdistributeById/:id",
  authenticate,
  httpLogger,
  getUnitsdistributeById,
);
router.get(
  "/super-admin-units/project",
  authenticate,
  httpLogger,
  getUnitsByProject,
);
router.get(
  "/super-admin-project-unit/:id",
  authenticate,
  httpLogger,
  getUnitByProjectId,
);
router.get(
  "/super-admin-getUntitsDetailById/:id",
  authenticate,
  httpLogger,
  getUnitDetailsById,
);

router.get(
  "/super-admin-unit-sold/:userId",
  authenticate,
  httpLogger,
  getEmployeeUnitSold,
);
router.get(
  "/super-admin-unit-sold/:id",
  authenticate,
  httpLogger,
  getEmployeeUnitSoldById,
);
router.get(
  "/super-admin-unit-data/:id",
  authenticate,
  httpLogger,
  getUnitDataByUnitId,
);
router.get(
  "/super-admin-unit-sold-lead-id/:id",
  authenticate,
  httpLogger,
  getEmployeeUnitSoldByLeadId,
);

//WebsiteController routes
router.post("/website-api", httpLogger, saveWebsiteAPI);
router.put("/update-website-api", httpLogger, updateWebsiteAPI);
router.delete("/delete-website-api/:id", httpLogger, deleteWebsiteAPI);
router.get("/get-website-api", httpLogger, getwebsite_api);

//responses routes 99acre
router.get("/get-responses-admin", httpLogger, getResponses);
router.get("/get-responses-super-admin", httpLogger, getResponses);

//import lead router
const leadStorage = multer.memoryStorage();
const leadUpload = multer({ leadStorage });

router.post(
  "/import-leads",
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
router.get("/get-employee-invoice/:id", authenticate, getEmployeeInvoice);
router.get("/employeeProfile/:id", authenticate, employeeProfile);
router.get("/employe-leads/:id", getEmployeeLeads);
router.get("/employebyid-visit/:id", authenticate, getEmployeebyidvisit);
router.get("/employe-all-visit", authenticate, AllgetEmployeebyvisit);
router.put("/updateVisitStatus/:id", authenticate, updateOnlyVisitStatus);
router.get("/employe-visit/:type/:id", authenticate, getEmployeeVisit);
router.put("/employe-visit/:visId", authenticate, updateVisit);
router.delete("/employe-visit/:id", authenticate, deleteVisit);
router.post("/employe-visit", authenticate, createVisit);
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
router.put(
  "/updateOnlyQuotationStatus/:id",
  authenticate,
  updateOnlyQuotationStatus,
);
router.get("/get-quotation-byEmploye/:id", authenticate, getEmployeeQuotation);
router.get("/get-quotation-byLead/:id", authenticate, getLeadQuotation);
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
router.post("/unit-sold", authenticate, createEmployeeUnitSold);
router.put("/unit-sold", authenticate, updateEmployeeUnitSold);
router.delete("/unit-sold/:type/:id", authenticate, deleteEmployeeUnitSold);
router.get("/unit-sold", authenticate, getEmployeeUnitSold);
router.get("/unit-sold/:id", authenticate, getEmployeeUnitSoldById);
router.get("/unit-sold-lead-id/:id", getEmployeeUnitSoldByLeadId);
router.get(
  "/getEmployeeUnitSoldByLeadIdMeta/:id",
  authenticate,
  getEmployeeUnitSoldByLeadIdMeta,
);
router.get("/unit-data/:id", authenticate, getUnitDataByUnitId);
router.put("/unit-data/:id", authenticate, updateOnlyUnitDataStatusById);
router.put("/updateOnlyUnitStatus/:id", authenticate, updateOnlyUnitStatus);

//controller nine routes
router.post("/createCompanyProfile", authenticate, createCompanyProfile);
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
router.get("/getAllUnitSoldByOrg/:orgId", authenticate, getAllUnitSoldByOrg);
router.get("/getLeadsByOrg/:orgId", authenticate, getLeadsByOrg);
router.get("/getOrgDetailsById/:orgId", authenticate, getOrgDetailsById);
router.put("/updateOrgDetails/:orgId", authenticate, updateOrgDetails);
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
  "/getAllUnitsByProjectId/:projectId",
  authenticate,
  getAllUnitsByProjectId,
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
router.post("/finance-companies/create", authenticate, createFinanceCompany);
router.post("/createOwnerPayments", authenticate, createOwnerPayments);
router.get(
  "/getOwnerPaymentsByMultiIds/:saleId/:ownerId/:orgId",
  authenticate,
  getOwnerPaymentsByMultiIds,
);
router.post("/createOwnerLoan", authenticate, createOwnerLoan);
router.get(
  "/getFinanceCompanyByOrg/:orgId",
  authenticate,
  getFinanceCompanyByOrg,
);
router.delete(
  "/deleteFinanceCompany/:fcId",
  authenticate,
  deleteFinanceCompany,
);
router.put("/updateFinanceCompany/:fcId", authenticate, updateFinanceCompany);
router.get(
  "/getLoanEmiDetailsByLoanID/:ownId/:orgId/:saleId",
  authenticate,
  getLoanEmiDetailsByLoanID,
);
router.put("/updateInstallments/:instId", authenticate, updateInstallments);
router.put(
  "/updateEmployeeUnitSoldUpdate/:esu_id",
  authenticate,
  updateEmployeeUnitSoldUpdate,
);


const excelUpload = multer({ dest: "uploads/" });
router.post("/bulk-upload-leads", excelUpload.single("file"), bulkUploadLeads);

router.put("/updateLeadAssignment/:leadId", updateLeadAssignment);
router.post("/addUnitsBulk", excelUpload.single("file"), addUnitsBulk);

//controller eleven
router.post("/createBooking", createBooking);
router.get("/getBookingBYleadId/:leadId", getBookingBYleadId);
router.put("/updateBooking/:bookingId", updateBooking);
router.post("/createRegistry", uploadRegistryDoc, createRegistry);
router.get("/getRegistryBYleadId/:leadId", getRegistryBYleadId);
router.put("/updateRegistry/:registry_id", uploadRegistryDoc, updateRegistry);
router.delete("/deleteRegistry/:registry_id", deleteRegistry);
router.post("/addUtilityCharges", addUtilityCharges);
router.get("/getUtilityBYleadId/:leadId", getUtilityBYleadId);
router.put("/updateUtilityCharges/:utility_id", updateUtilityCharges);
router.delete("/deleteUtilityCharges/:utility_id", deleteUtilityCharges);
router.put("/updateSoldDetails/:esu_id/:leadId/:type", updateSoldDetails);
router.post("/addPaymentRecord", addPaymentRecord);
router.put("/updatePaymentStatus/:bookingId", updatePaymentStatus);
router.put(
  "/updateRegistryPaymentStatus/:registryId",
  updateRegistryPaymentStatus,
);
router.put(
  "/updateUtilityPaymentStatus/:utilityId",
  updateUtilityPaymentStatus,
);
router.get(
  "/getAllTransanctionByESUId/:esuId/:orgId",
  getAllTransanctionByESUId,
);

router.put("/updatePaymentRecord/:payId", updatePaymentRecord);

module.exports = router;
