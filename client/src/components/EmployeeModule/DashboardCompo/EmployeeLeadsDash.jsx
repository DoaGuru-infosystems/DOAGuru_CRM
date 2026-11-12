import React from "react";
import EmployeeLeadsReport from "./EmployeeLeadsReport";

const EmployeeLeadsDash = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">
        Leads Dashboard
      </h2>

      <div className="mt-4">
        <EmployeeLeadsReport />
      </div>
    </div>
  );
};

export default EmployeeLeadsDash;
