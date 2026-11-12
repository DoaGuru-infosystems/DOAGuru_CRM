import React from "react";

import { Route, Routes } from "react-router-dom";

import EmployeeDashboard from "../pages/Employees/EmployeeDashboard";
import EmployeeLead from "../pages/Employees/EmployeeLead";
import EmployeeReport from "../pages/Admin/EmployeeReport";
import EmployeeDataExport from "../pages/Employees/EmployeeDataExport";
import TotalEmpLead from "../pages/Employees/TotalEmpLead";
import CloseTable from "../pages/Employees/CloseTable";
import EmployeeSingleLeadProfile from "../pages/Employees/EmployeeSingleLeadProfile";
import ViewAllFollowUp from "../pages/Employees/ViewAllFollowUp";
import ViewAllRemark from "../pages/Employees/ViewAllRemark";
import SuperAdminProfile from "../pages/superAdmin/SuperAdminProfile";

function EmployeeRoutes() {
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

        </Routes>
      </div>
    </>
  );
}

export default EmployeeRoutes;
