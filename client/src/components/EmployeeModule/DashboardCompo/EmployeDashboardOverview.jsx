import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { GiFiles } from "react-icons/gi";
import { Link, useNavigate } from "react-router-dom";
import { logoutUser } from "../../../store/UserSlice";
import toast from "react-hot-toast";
import { FaMeta } from "react-icons/fa6";

const EmployeeOverview = () => {
  const [leads, setLeads] = useState([]);
  const [metaLeads, setMetaLeads] = useState([]);
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

  useEffect(() => {
    fetchLeads();
    fetchMetaLeads();
  }, []);

  const leadCount = leads.length;

  const closedCount = leads.filter(
    (lead) => lead.unit_status === "sold"
  ).length;

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

      </div>
    </>
  );
};

export default EmployeeOverview;
