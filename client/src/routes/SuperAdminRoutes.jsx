import React from "react";

import { Route, Routes } from "react-router-dom";
import { useSelector } from "react-redux";
import SuperAdminLead from "../adiComponent/Super-Admin/SuperAdminLead";
import Super_Single_Lead_Profile from "../adiComponent/Super-Admin/Super_Single_Lead_Profile";
import SuperEmployeeList from "../adiComponent/Super-Admin/SuperEmployeeList";
import SuperAdminTotalEmployee from "../adiComponent/Super-Admin/SuperAdminTotalEmployee";
import Super_view_followup from "../adiComponent/Super-Admin/Super_view_followup";
import Super_view_remarks from "../adiComponent/Super-Admin/Super_view_remaks";
import SuperEmployeedatabyid from "../adiComponent/Super-Admin/SuperEmployeedatabyid";
import Super_view_follow_by_id from "../adiComponent/Super-Admin/Super_view_follow_by_id";
import Super_view_remark_byid from "./../adiComponent/Super-Admin/Super_view_remark_byid";
import SuperDash from "../pages/superAdmin/SuperDash";
import SuperEmployeeLeads from "../pages/superAdmin/SuperEmployeeLeads";
import SuperMainSocialMediaByProject from "../pages/superAdmin/SuperMainSocialMediaByProject";
import SuperAdminImportData from "../pages/superAdmin/SuperAdminImportData";
import SuperReports from "../pages/superAdmin/SuperReports";
import SuperDataExport from "../pages/superAdmin/SuperDataExport";
import SuperProjectDashBoard from "../pages/superAdmin/SuperProjectDashBoard";
import SuperAdEmployeemanagement from "../pages/superAdmin/SuperAdEmployeemanagement";
import SuperAdminAdminmanagement from "../pages/superAdmin/SuperAdminAdminmanagement";
import SuperAdminProfile from "../pages/superAdmin/SuperAdminProfile";
import SuperDashProject from "../pages/superAdmin/SuperDashProject";
import SuperAdminTotalLead from "../pages/superAdmin/SuperAdminTotalLead";
import SuperAdminTotalClosedDeal from "../pages/superAdmin/SuperAdminTotalClosedDeal";
import SuperSocialMediaLeads from "../pages/superAdmin/SuperSocialMediaLeads";
import AdminProfile from "../pages/superAdmin/AdminProfile";
import EmployeeProfile from "../pages/Employees/EmployeeProfile";
import EmployeeSingleLeadProfile from "../pages/Employees/EmployeeSingleLeadProfile";

function SuperAdminRoutes() {
  const user = useSelector((state) => state.auth.user);

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
          path="/main-social-media-super-admin-leads"
          element={<SuperMainSocialMediaByProject />}
        />
        <Route
          path="/super-admin-import-data"
          element={<SuperAdminImportData />}
        />
        <Route path="/super-admin-reporting" element={<SuperReports />} />
        <Route path="/super-admin-data-export" element={<SuperDataExport />} />
        <Route
          path="/super-admin-project-dash"
          element={<SuperProjectDashBoard />}
        />
        <Route
          path="/super-admin-employee-management"
          element={<SuperAdEmployeemanagement />}
        />
        <Route
          path="/super-admin-AdminManagement"
          element={<SuperAdminAdminmanagement />}
        />
        <Route path="/super-admin-profile" element={<SuperAdminProfile />} />
        <Route path="/Super-admin-project" element={<SuperDashProject />} />
        <Route
          path="/super-admin-total-lead"
          element={<SuperAdminTotalLead />}
        />
        <Route
          path="/super-admin-close-data"
          element={<SuperAdminTotalClosedDeal />}
        />
        <Route
          path="/social-media-superleads"
          element={<SuperSocialMediaLeads />}
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

        {/* ================================================================================= */}
        {/* <Route path="/super-admin-leads" element={<SuperAdminLead />} />
        <Route
          path="/super-admin-total-employee"
          element={<SuperAdminTotalEmployee />}
        />
        <Route
          path="/super-admin-employee-list"
          element={<SuperEmployeeList />}
        />
        <Route
          path="/super-admin-lead-single-data"
          element={<Super_Single_Lead_Profile />}
        />
        <Route
          path="/super-admin-lead-single-data/:id"
          element={<SuperEmployeedatabyid />}
        />
        <Route
          path="/super_view_follow_up/:id"
          element={<Super_view_follow_by_id />}
        />
        <Route path="/super_view_follow_up" element={<Super_view_followup />} />
        <Route
          path="/super_view_remark/:id"
          element={<Super_view_remark_byid />}
        />
        <Route path="/super_view_remarks" element={<Super_view_remarks />} /> */}
      </Routes>
    </>
  );
}

export default SuperAdminRoutes;
