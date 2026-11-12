import React from "react";
import GeneralLeads from "./GeneralLeads";

const LeadsDashboard = () => {
  return (
    <div className="p-2 pt-4 sm:p-6">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">
        Leads Dashboard
      </h2>

      <div className="mt-4">
        <GeneralLeads />
      </div>
    </div>
  );
};

export default LeadsDashboard;
