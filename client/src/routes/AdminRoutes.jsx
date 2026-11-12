import React from "react";

import { Route, Routes } from "react-router-dom";
import AdminDashboard from "../pages/Admin/AdminDashboard";
import ImportLeadsAdmin from "../pages/Admin/ImportLeadsAdmin";
import AdminReport from "../pages/Admin/AdminReport";
import DataExport from "../pages/Admin/DataExport";
import EmployeeManagement from "../pages/Admin/EmployeeManagement";
import AdminTotalLead from "../pages/Admin/AdminTotalLead";
import AdminTotalClosedDeal from "../pages/Admin/AdminTotalClosedDeal";
import SingleLeadProfile from "../pages/Admin/SingleLeadProfile";
import EmployeeSingle from "../pages/Admin/EmployeeSingle";
import AdminProfile from "../pages/Admin/AdminProfile";
import AdminFollowUpView from "../pages/Admin/AdminFollowUpView";
import Admin_RemarksView from "../components/Leads/Admin_RemarksView";
import SuperEmployeeLeads from "../pages/superAdmin/SuperEmployeeLeads";
import EmployeeSingleLeadProfile from "../pages/Employees/EmployeeSingleLeadProfile";

function AdminRoutes() {
  return (
    <>
      <Routes>
        {/* Admin routes */}
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/leads" element={<SuperEmployeeLeads />} />
        <Route path="/admin-import-data" element={<ImportLeadsAdmin />} />
        <Route path="/admin-report" element={<AdminReport />} />
        <Route path="/data-export" element={<DataExport />} />
        <Route path="/employee-management" element={<EmployeeManagement />} />
        <Route path="/admin-profile" element={<AdminProfile />} />
        <Route path="/admin-total-leads" element={<AdminTotalLead />} />
        <Route path="/admin-total-closed" element={<AdminTotalClosedDeal />} />
        <Route path="/lead-single-data/:id" element={<SingleLeadProfile />} />
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
          path="/superadmin-lead-single-data/:type/:id"
          element={<EmployeeSingleLeadProfile />}
        />
      </Routes>
    </>
  );
}

export default AdminRoutes;
