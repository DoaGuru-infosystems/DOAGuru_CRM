import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { GiFiles, GiMoneyStack } from "react-icons/gi";
import { FaClipboardList, FaCheckCircle } from "react-icons/fa"; // Import icons for Visit and Closed Data
import { useSelector } from "react-redux";
import EmployeeLeadData from "./EmployeeDataExport/EmployeeLeadData";
import EmployeeQuotationData from "./EmployeeDataExport/EmployeeQuotationData";
import EmployeeInvoiceData from "./EmployeeDataExport/EmployeeInvoiceData";
import EmployeeVisitData from "./EmployeeDataExport/EmployeeVisitData";
import EmployeeCloseData from "./EmployeeDataExport/EmployeeCloseData";
import EmployeeSoldData from "./EmployeeDataExport/EmployeeSoldData";
import EmployeeMetaLeadData from "./EmployeeDataExport/EmployeeMetaLeadData";
import { FaMeta } from "react-icons/fa6";

function EmployeeDataExportContent() {
  const [leads, setLeads] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState("LeadData");
  const [visit, setVisit] = useState([]);
  const [metaLeads, setMetaLeads] = useState([]);
  const EmpId = useSelector((state) => state.auth.user);
  const token = EmpId?.token;

  const fetchLeads = async () => {
    try {
      const response = await axios.get(
        `https://crm-generalize.siarasystems.com/api/employe-leads/${EmpId.staff_id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("setLeads", response.data);
      setLeads(response.data);
    } catch (error) {
      console.error("Error fetching leads:", error);
    }
  };

  const fetchMetaLeads = async () => {
    try {
      const response = await axios.get(
        `https://crm-generalize.siarasystems.com/api/getMetaLeadsByStaffId/${EmpId.staff_id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMetaLeads(response.data);
    } catch (error) {
      console.error("Error fetching leads:", error);
    }
  };

  const fetchVisit = async () => {
    try {
      const response = await axios.get(
        `https://crm-generalize.siarasystems.com/api/leads-visits/${EmpId.staff_id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setVisit(response.data);
    } catch (error) {
      console.error("Error fetching quotations:", error);
    }
  };

  const visitCount = visit?.length;

  const closedCount = leads.filter(
    (lead) => lead.unit_status === "sold"
  ).length;

  const soldUnits = leads.filter((lead) => lead.unit_status === "sold").length;

  useEffect(() => {
    fetchLeads();
    fetchVisit();
    fetchMetaLeads();
  }, []);

  return (
    <>
      <div className="flex sm:mt-20 mt-16">
        <div className="w-full min-h-screen bg-[#F9FAFF] p-2">
          <div className="flex-grow p-4">
            <h2 className="text-2xl text-center mt-0 sm:mt-2 font-medium text-gray-800">
              Employee Data Export
            </h2>
            <div className="mx-auto h-1 w-16 bg-cyan-600 rounded-full my-3"></div>

            <div className="flex flex-wrap justify-center sm:justify-around gap-4 mt-6">
              {/* Card 1: Leads Data */}
              <div className="w-full sm:w-1/2 lg:w-1/4 xl:w-1/5 my-2">
                <div
                  className={`shadow-md rounded-xl overflow-hidden cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 border ${
                    selectedComponent === "LeadData"
                      ? "bg-cyan-600 text-white border-cyan-600 shadow-cyan-600/30"
                      : "bg-white text-gray-800 border-gray-100 hover:border-cyan-200"
                  }`}
                  onClick={() => setSelectedComponent("LeadData")}
                >
                  <div className="p-5 flex flex-col items-center text-center">
                    <div className={`text-4xl mb-2 ${selectedComponent === "LeadData" ? "text-white" : "text-cyan-600"}`}>
                      <GiFiles />
                    </div>
                    <div className="mt-1">
                      <h5 className={`text-lg font-bold ${selectedComponent === "LeadData" ? "text-white" : "text-gray-800"}`}>
                        Leads Data
                      </h5>
                      <p className={`text-2xl font-extrabold mt-1 ${selectedComponent === "LeadData" ? "text-cyan-100" : "text-cyan-600"}`}>
                        {leads?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Meta Leads Data */}
              <div className="w-full sm:w-1/2 lg:w-1/4 xl:w-1/5 my-2">
                <div
                  className={`shadow-md rounded-xl overflow-hidden cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 border ${
                    selectedComponent === "metaLeadData"
                      ? "bg-cyan-600 text-white border-cyan-600 shadow-cyan-600/30"
                      : "bg-white text-gray-800 border-gray-100 hover:border-cyan-200"
                  }`}
                  onClick={() => setSelectedComponent("metaLeadData")}
                >
                  <div className="p-5 flex flex-col items-center text-center">
                    <div className={`text-4xl mb-2 ${selectedComponent === "metaLeadData" ? "text-white" : "text-cyan-600"}`}>
                      <FaMeta />
                    </div>
                    <div className="mt-1">
                      <h5 className={`text-lg font-bold ${selectedComponent === "metaLeadData" ? "text-white" : "text-gray-800"}`}>
                        Meta Leads Data
                      </h5>
                      <p className={`text-2xl font-extrabold mt-1 ${selectedComponent === "metaLeadData" ? "text-cyan-100" : "text-cyan-600"}`}>
                        {metaLeads?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Site Visits Data */}
              <div className="w-full sm:w-1/2 lg:w-1/4 xl:w-1/5 my-2">
                <div
                  className={`shadow-md rounded-xl overflow-hidden cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 border ${
                    selectedComponent === "VisitData"
                      ? "bg-cyan-600 text-white border-cyan-600 shadow-cyan-600/30"
                      : "bg-white text-gray-800 border-gray-100 hover:border-cyan-200"
                  }`}
                  onClick={() => setSelectedComponent("VisitData")}
                >
                  <div className="p-5 flex flex-col items-center text-center">
                    <div className={`text-4xl mb-2 ${selectedComponent === "VisitData" ? "text-white" : "text-cyan-600"}`}>
                      <FaClipboardList />
                    </div>
                    <div className="mt-1">
                      <h5 className={`text-lg font-bold ${selectedComponent === "VisitData" ? "text-white" : "text-gray-800"}`}>
                        Site Visits Data
                      </h5>
                      <p className={`text-2xl font-extrabold mt-1 ${selectedComponent === "VisitData" ? "text-cyan-100" : "text-cyan-600"}`}>
                        {visitCount || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: Unit Sold Data */}
              <div className="w-full sm:w-1/2 lg:w-1/4 xl:w-1/5 my-2">
                <div
                  className={`shadow-md rounded-xl overflow-hidden cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 border ${
                    selectedComponent === "SoldData"
                      ? "bg-cyan-600 text-white border-cyan-600 shadow-cyan-600/30"
                      : "bg-white text-gray-800 border-gray-100 hover:border-cyan-200"
                  }`}
                  onClick={() => setSelectedComponent("SoldData")}
                >
                  <div className="p-5 flex flex-col items-center text-center">
                    <div className={`text-4xl mb-2 ${selectedComponent === "SoldData" ? "text-white" : "text-cyan-600"}`}>
                      <FaCheckCircle />
                    </div>
                    <div className="mt-1">
                      <h5 className={`text-lg font-bold ${selectedComponent === "SoldData" ? "text-white" : "text-gray-800"}`}>
                        Unit Sold Data
                      </h5>
                      <p className={`text-2xl font-extrabold mt-1 ${selectedComponent === "SoldData" ? "text-cyan-100" : "text-cyan-600"}`}>
                        {soldUnits || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Conditionally render the selected component */}
            <div className="w-full mb-20">
              {selectedComponent === "LeadData" && <EmployeeLeadData />}
              {selectedComponent === "metaLeadData" && <EmployeeMetaLeadData />}
              {selectedComponent === "QuotationData" && (
                <EmployeeQuotationData />
              )}
              {selectedComponent === "InvoiceData" && <EmployeeInvoiceData />}
              {selectedComponent === "VisitData" && <EmployeeVisitData />}
              {selectedComponent === "ClosedData" && <EmployeeCloseData />}
              {selectedComponent === "SoldData" && <EmployeeSoldData />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default EmployeeDataExportContent;
