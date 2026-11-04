import React from "react";

import { Navigate, Route, Routes } from "react-router-dom";
import { useSelector } from "react-redux";
import LeadData from "../components/DataExport/LeadData";
import Overview from "../adiComponent/Overview";
import SingleOrganization from "../adiComponent/SingleOrganizaton";
import Reporting from "../adiComponent/Reporting";
import TotalEmployee from "../components/AdminDashBoardCards/TotalEmployee";
import MainSocialLeads from "../components/SocialMediaLeads/MainSocialLeads";
import AdminDashboard from "../pages/Admin/AdminDashboard";
import AdminLeads from "../pages/Admin/AdminLeads";
import MainSocialMediaByProject from "../pages/Admin/MainSocialMediaByProject";
import ImportLeadsAdmin from "../pages/Admin/ImportLeadsAdmin";
import AdminReport from "../pages/Admin/AdminReport";
import DataExport from "../pages/Admin/DataExport";
import ProjectDashBoard from "../pages/Admin/ProjectDashBoard";
import EmployeeManagement from "../pages/Admin/EmployeeManagement";
import DashProject from "../pages/Admin/DashProject";
import AdminTotalLead from "../pages/Admin/AdminTotalLead";
import AdminTotalClosedDeal from "../pages/Admin/AdminTotalClosedDeal";
import SingleLeadProfile from "../pages/Admin/SingleLeadProfile";
import SocialMediaLeads from "../pages/Admin/SocialMediaLeads";
import EmployeeSingle from "../pages/Admin/EmployeeSingle";
import AdminProfile from "../pages/Admin/AdminProfile";
import AdminFollowUpView from "../pages/Admin/AdminFollowUpView";
import Admin_RemarksView from "../components/Leads/Admin_RemarksView";
import SuperSocialMediaLeads from "../pages/superAdmin/SuperSocialMediaLeads";
import SuperEmployeeLeads from "../pages/superAdmin/SuperEmployeeLeads";
import EmployeeSingleLeadProfile from "../pages/Employees/EmployeeSingleLeadProfile";

function AdminRoutes() {
  const user = useSelector((state) => state.auth.user);
  return (
    <>
      <Routes>
        {/* Admin routes */}
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/dashboard" element={<AdminDashboard />} />
        {/* <Route path="/leads" element={<AdminLeads />} /> */}
        <Route path="/leads" element={<SuperEmployeeLeads />} />
        <Route
          path="/main-social-media-leads"
          element={<MainSocialMediaByProject />}
        />
        <Route path="/admin-import-data" element={<ImportLeadsAdmin />} />
        <Route path="/admin-report" element={<AdminReport />} />
        <Route path="/data-export" element={<DataExport />} />
        <Route path="/Project-Dash" element={<ProjectDashBoard />} />
        <Route path="/employee-management" element={<EmployeeManagement />} />
        <Route path="/admin-profile" element={<AdminProfile />} />
        <Route path="/admin-project" element={<DashProject />} />
        <Route path="/admin-total-leads" element={<AdminTotalLead />} />
        <Route path="/admin-total-closed" element={<AdminTotalClosedDeal />} />
        <Route path="/lead-single-data/:id" element={<SingleLeadProfile />} />
        <Route path="/social-media-leads/:id" element={<SocialMediaLeads />} />
        <Route
          path="/employee-single/:employeeId"
          element={<EmployeeSingle />}
        />
        <Route
          path="/admin_view_follow_up/:id"
          element={<AdminFollowUpView />}
        />

        <Route path="/admin_view_remark/:id" element={<Admin_RemarksView />} />

        <Route
          path="/social-media-superleads/:id"
          element={<SuperSocialMediaLeads />}
        />

        <Route
          path="/superadmin-lead-single-data/:type/:id"
          element={<EmployeeSingleLeadProfile />}
        />
      </Routes>
    </>
  );
}

export default AdminRoutes;
