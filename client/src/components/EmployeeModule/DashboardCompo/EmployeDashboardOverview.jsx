import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { GiFiles, GiMoneyStack } from "react-icons/gi";
import { Link, useNavigate } from "react-router-dom";
import { FaClipboardList, FaCheckCircle } from "react-icons/fa";
import { logoutUser } from "../../../store/UserSlice";
import toast from "react-hot-toast";
import { FaMeta } from "react-icons/fa6";

const EmployeeOverview = () => {
  const [leads, setLeads] = useState([]);
  const [metaLeads, setMetaLeads] = useState([]);
  const [quotation, setQuotation] = useState([]);
  const [invoice, setInvoice] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState("LeadData");
  const [visit, setVisit] = useState([]);
  const [employeesold, setemployeesold] = useState([]);
  const EmpId = useSelector((state) => state.auth.user);

  const token = EmpId?.token;

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const fetchLeads = async () => {
    try {
      const response = await axios.get(
        `http://localhost:9000/api/employe-leads/${EmpId.staff_id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setLeads(response.data);
    } catch (error) {
      if (error?.response?.status === 401) {
        navigate("/main_page_crm");
        dispatch(logoutUser());
        toast.error("Token is expired Please Login Again !!");
      }
    }
  };

  const fetchMetaLeads = async () => {
    try {
      const { data } = await axios.get(
        `http://localhost:9000/api/getMetaLeadsByStaffId/${EmpId.staff_id}`,
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

  const fetchVisit = async () => {
    try {
      const { data } = await axios.get(
        `http://localhost:9000/api/leads-visits/${EmpId.staff_id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setVisit(data);
    } catch (error) {
      console.error("Error fetching quotations:", error);
    }
  };

  const employeesoldunit = async () => {
    try {
      const { data } = await axios.get(
        `http://localhost:9000/api/unit-sold/${EmpId.staff_id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setemployeesold(data);
    } catch (error) {
      console.error("Error fetching quotations:", error);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchVisit();
    fetchMetaLeads();
    employeesoldunit();
  }, []);

  const leadCount = leads.length;
  const soldunit = employeesold.length;

  const closedCount = leads.filter(
    (lead) => lead.unit_status === "sold"
  ).length;

  const visitCount = visit?.length;

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-2 px-2 sm:px-6">
        <div className="w-full">
          <Link to="/employee-leads">
            <div className="bg-white shadow-md rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 border border-gray-100">
              <div className="p-3 sm:p-4 flex flex-col items-center text-center">
                <div className="text-2xl sm:text-3xl text-cyan-600 bg-cyan-50 p-2 sm:p-2.5 rounded-xl">
                  <GiFiles />
                </div>
                <div className="mt-2">
                  <h5 className="text-gray-500 text-xs sm:text-sm font-semibold whitespace-nowrap">
                    Total Assign Leads
                  </h5>
                  <p className="text-gray-800 text-base sm:text-xl font-bold mt-0.5">
                    {leadCount}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="w-full">
          <Link to="/meta-leads-employee">
            <div className="bg-white shadow-md rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 border border-gray-100">
              <div className="p-3 sm:p-4 flex flex-col items-center text-center">
                <div className="text-2xl sm:text-3xl text-cyan-600 bg-cyan-50 p-2 sm:p-2.5 rounded-xl">
                  <FaMeta />
                </div>
                <div className="mt-2">
                  <h5 className="text-gray-500 text-xs sm:text-sm font-semibold whitespace-nowrap">
                    Total Meta Leads
                  </h5>
                  <p className="text-gray-800 text-base sm:text-xl font-bold mt-0.5">
                    {metaLeads?.length}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Card for Visit Data */}
        <div className="w-full">
          <Link to="/visit-data">
            <div
              className={`shadow-md rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 border ${
                selectedComponent === "VisitData"
                  ? "bg-cyan-600 border-cyan-600 text-white"
                  : "bg-white border-gray-100"
              }`}
              onClick={() => setSelectedComponent("VisitData")}
            >
              <div className="p-3 sm:p-4 flex flex-col items-center text-center">
                <div
                  className={`text-2xl sm:text-3xl p-2 sm:p-2.5 rounded-xl ${
                    selectedComponent === "VisitData"
                      ? "text-white bg-cyan-700"
                      : "text-cyan-600 bg-cyan-50"
                  }`}
                >
                  <FaClipboardList />
                </div>
                <div className="mt-2">
                  <h5
                    className={`text-xs sm:text-sm font-semibold whitespace-nowrap ${
                      selectedComponent === "VisitData"
                        ? "text-white"
                        : "text-gray-500"
                    }`}
                  >
                    Total Site Visit
                  </h5>
                  <p
                    className={`text-base sm:text-xl font-bold mt-0.5 ${
                      selectedComponent === "VisitData"
                        ? "text-white"
                        : "text-gray-800"
                    }`}
                  >
                    {visitCount}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Card for sold unit Data */}
        <div className="w-full">
          <Link to="/employee-sold">
            <div
              className={`shadow-md rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 border ${
                selectedComponent === "solddata"
                  ? "bg-cyan-600 border-cyan-600 text-white"
                  : "bg-white border-gray-100"
              }`}
              onClick={() => setSelectedComponent("solddata")}
            >
              <div className="p-3 sm:p-4 flex flex-col items-center text-center">
                <div
                  className={`text-2xl sm:text-3xl p-2 sm:p-2.5 rounded-xl ${
                    selectedComponent === "solddata"
                      ? "text-white bg-cyan-700"
                      : "text-cyan-600 bg-cyan-50"
                  }`}
                >
                  <FaClipboardList />
                </div>
                <div className="mt-2">
                  <h5
                    className={`text-xs sm:text-sm font-semibold whitespace-nowrap ${
                      selectedComponent === "solddata"
                        ? "text-white"
                        : "text-gray-500"
                    }`}
                  >
                    Employee Sold Units
                  </h5>
                  <p
                    className={`text-base sm:text-xl font-bold mt-0.5 ${
                      selectedComponent === "solddata"
                        ? "text-white"
                        : "text-gray-800"
                    }`}
                  >
                    {soldunit}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
};

export default EmployeeOverview;
