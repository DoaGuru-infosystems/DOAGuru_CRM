import React, { useEffect, useState } from "react";
import axios from "axios";
import { GiFiles, GiMoneyStack } from "react-icons/gi";
import { useSelector } from "react-redux";
import LeadData from "../components/DataExport/LeadData";
import { FaCheckCircle, FaClipboardList } from "react-icons/fa";
import VisitData from "../components/DataExport/VisitData";
import CloseData from "../components/DataExport/CloseDateData";
import EmployeeSoldDataDetails from "../components/DataExport/EmployeeSoldDataDetails";
import MetaLeadData from "../components/DataExport/MetaLeadData";
import { FaMeta } from "react-icons/fa6";
import { SiGoogleads } from "react-icons/si";

const DataExportContent = () => {
  const [leads, setLeads] = useState([]);
  const [metaLeads, setMetaLeads] = useState([]);
  const [visit, setVisit] = useState([]);
  const [employeesold, setemployeesold] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState("LeadData");
  const superadminuser = useSelector((state) => state.auth.user);
  const [employee, setEmployee] = useState([]);
  const token = superadminuser.token;
  const userId = superadminuser.staff_id;

  useEffect(() => {
    fetchLeads();
    fetchEmployee();
    fetchVisit();
    employeesoldunit();
    fetchMetaLeads();
  }, []);

  const fetchMetaLeads = async () => {
    try {
      const { data } = await axios.get(
        `http://localhost:9000/api/getMetaLeadsByOrgId/${superadminuser?.staff_org_id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMetaLeads(data);
    } catch (error) {
      console.error("Error fetching leads:", error);
    }
  };

  const fetchLeads = async () => {
    try {
      const { data } = await axios.get(
        `http://localhost:9000/api/getLeadsByOrg/${superadminuser?.staff_org_id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setLeads(data);
    } catch (error) {
      console.error("Error fetching leads:", error);
    }
  };

  const fetchEmployee = async () => {
    try {
      const response = await axios.get(
        `http://localhost:9000/api/employee-super-admin/${userId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setEmployee(response.data);
    } catch (error) {
      console.error("Error fetching employee data:", error);
    }
  };

  const employeesoldunit = async () => {
    try {
      const { data } = await axios.get(
        `http://localhost:9000/api/getAllUnitSoldByOrg/${superadminuser?.staff_org_id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(data);
      setemployeesold(data);
    } catch (error) {
      console.error("Error fetching quotations:", error);
    }
  };
  const fetchVisit = async () => {
    try {
      const { data } = await axios.get(
        `http://localhost:9000/api/leads-all-visits/${superadminuser?.staff_org_id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(data);
      setVisit(data);
    } catch (error) {
      console.error("Error fetching quotations:", error);
    }
  };

  const closedCount = leads.filter(
    (lead) => lead.unit_status === "sold"
  ).length;

  const soldUnits = employeesold.length;

  return (
    <>
      <div className="flex mt-20">
        <div className="sm:w-full w-[90%] min-h-screen bg-[#F9FAFF] p-2">
          <div className="container">
            <h2 className="text-2xl text-center mt-[2rem] font-medium">
              Data Export
            </h2>
            <div className="mx-auto h-[4px] w-16 bg-cyan-600 rounded-full my-3"></div>

            <div className="flex flex-wrap justify-center sm:justify-around gap-4 mt-6">
              {/* Leads Data */}
              <div className="w-1/2 sm:w-1/3 lg:w-1/4 xl:w-1/5 my-2">
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

              {/* Meta Leads Data */}
              <div className="w-1/2 sm:w-1/3 lg:w-1/4 xl:w-1/5 my-2">
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

              {/* Visit Data */}
              <div className="w-1/2 sm:w-1/3 lg:w-1/4 xl:w-1/5 my-2">
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
                        {visit?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sold Data */}
              <div className="w-1/2 sm:w-1/3 lg:w-1/4 xl:w-1/5 my-2">
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
                        {soldUnits?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Conditionally render the selected component */}
            <div className="w-full h-[calc(100vh-10rem)] overflow-y-auto">
              {selectedComponent === "LeadData" && <LeadData />}
              {selectedComponent === "VisitData" && <VisitData />}
              {selectedComponent === "metaLeadData" && <MetaLeadData />}
              {selectedComponent === "SoldData" && <EmployeeSoldDataDetails />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DataExportContent;
