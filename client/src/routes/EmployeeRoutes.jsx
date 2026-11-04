import React from "react";

import { Navigate, Route, Routes } from "react-router-dom";
import { useSelector } from "react-redux";

import Dashboard from "../adiComponent/AdminDashboardContent";
import Overview from "../adiComponent/Overview";
import EmployeeManagement from "../adiComponent/EmployManagementContent";
import EmployeeSingle from "../adiComponent/EmployeSingleContent";
import SingleOrganization from "../adiComponent/SingleOrganizaton";
import Reporting from "../adiComponent/Reporting";
import EmployeeLogin from "../components/EmployeeModule/EmployeeLogin";
import TotalEmployee from "../components/AdminDashBoardCards/TotalEmployee";
import Leads from "../pages/AdminLeadsContent";
import EmployeeDashboard from "../pages/Employees/EmployeeDashboard";
import EmployeeLead from "../pages/Employees/EmployeeLead";
import EmployeeReport from "../pages/Admin/EmployeeReport";
import EmployeeDataExport from "../pages/Employees/EmployeeDataExport";
import EmployeeProfile from "../pages/Employees/EmployeeProfile";
import TotalEmpLead from "../pages/Employees/TotalEmpLead";
import CloseTable from "../pages/Employees/CloseTable";
import EmployeeSingleLeadProfile from "../pages/Employees/EmployeeSingleLeadProfile";
import ViewAllFollowUp from "../pages/Employees/ViewAllFollowUp";
import ViewAllRemark from "../pages/Employees/ViewAllRemark";
import SuperAdminProfile from "../pages/superAdmin/SuperAdminProfile";
import MetaLeadEmp from "../pages/Employees/MetaLeadEmp";

function EmployeeRoutes() {
  const user = useSelector((state) => state.auth.user);

  return (
    <>
      <div style={{ overflow: "hidden" }}>
        <Routes>
          <Route path="/" element={<EmployeeDashboard />} />
          <Route path="/dashboard" element={<EmployeeDashboard />} />
          <Route path="/employee-leads" element={<EmployeeLead />} />
          <Route path="/employee-report" element={<EmployeeReport />} />
          <Route
            path="/employee-data-export"
            element={<EmployeeDataExport />}
          />
          {/* <Route path="/employee-profile" element={<EmployeeProfile />} /> */}
          <Route path="/employee-profile" element={<SuperAdminProfile />} />
          <Route path="/employees-total-leads" element={<TotalEmpLead />} />
          <Route path="/close-data" element={<CloseTable />} />
          <Route
            path="/employee-lead-single-data/:type/:id"
            element={<EmployeeSingleLeadProfile />}
          />
          <Route
            path="/view_follow_up/:type/:id"
            element={<ViewAllFollowUp />}
          />
          <Route path="/view_remark/:type/:id" element={<ViewAllRemark />} />
          <Route path="/meta-leads-employee" element={<MetaLeadEmp />} />

        </Routes>
      </div>
    </>
  );
}

export default EmployeeRoutes;
