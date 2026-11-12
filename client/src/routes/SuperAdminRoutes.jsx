import React from "react";

import { Route, Routes } from "react-router-dom";
import SuperDash from "../pages/superAdmin/SuperDash";
import SuperEmployeeLeads from "../pages/superAdmin/SuperEmployeeLeads";
import SuperAdminImportData from "../pages/superAdmin/SuperAdminImportData";
import SuperReports from "../pages/superAdmin/SuperReports";
import SuperDataExport from "../pages/superAdmin/SuperDataExport";
import SuperAdEmployeemanagement from "../pages/superAdmin/SuperAdEmployeemanagement";
import SuperAdminAdminmanagement from "../pages/superAdmin/SuperAdminAdminmanagement";
import SuperAdminProfile from "../pages/superAdmin/SuperAdminProfile";
import SuperAdminTotalLead from "../pages/superAdmin/SuperAdminTotalLead";
import SuperAdminTotalClosedDeal from "../pages/superAdmin/SuperAdminTotalClosedDeal";
import AdminProfile from "../pages/superAdmin/AdminProfile";
import EmployeeProfile from "../pages/Employees/EmployeeProfile";
import EmployeeSingleLeadProfile from "../pages/Employees/EmployeeSingleLeadProfile";

function SuperAdminRoutes() {
  return (
    <>
      <Routes>
        <Route path="/" element={<SuperDash />} />
        <Route path="/dashboard" element={<SuperDash />} />
        <Route
          path="/super-admin-employee-leads"
          element={<SuperEmployeeLeads />}
        />
        <Route
          path="/super-admin-import-data"
          element={<SuperAdminImportData />}
        />
        <Route path="/super-admin-reporting" element={<SuperReports />} />
        <Route path="/super-admin-data-export" element={<SuperDataExport />} />
        <Route
          path="/super-admin-employee-management"
          element={<SuperAdEmployeemanagement />}
        />
        <Route
          path="/super-admin-AdminManagement"
          element={<SuperAdminAdminmanagement />}
        />
        <Route path="/super-admin-profile" element={<SuperAdminProfile />} />
        <Route
          path="/super-admin-total-lead"
          element={<SuperAdminTotalLead />}
        />
        <Route
          path="/super-admin-close-data"
          element={<SuperAdminTotalClosedDeal />}
        />
        <Route
          path="/super-admin-employee-single/:employeeId"
          element={<EmployeeProfile />}
        />
        <Route
          path="/super-admin-admin-employe/:adminId"
          element={<AdminProfile />}
        />

        <Route
          path="/superadmin-lead-single-data/:type/:id"
          element={<EmployeeSingleLeadProfile />}
        />
      </Routes>
    </>
  );
}

export default SuperAdminRoutes;
