import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { MdOutlineNextWeek } from "react-icons/md";
import { GiFiles } from "react-icons/gi";
import { FaFolderOpen, FaHistory } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { logoutUser } from "../store/UserSlice";
import toast from "react-hot-toast";
import { FaMeta } from "react-icons/fa6";

const Overview2 = () => {
  const [leads, setLeads] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState("LeadData");
  const superadminuser = useSelector((state) => state.auth.user);
  const token = superadminuser.token;
  const userId = superadminuser.staff_id;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [metaLeads, setMetaLeads] = useState([]);
  const [untouchedLeads, setUntouchedLeads] = useState(0);
  const [averageFollowUps, setAverageFollowUps] = useState(0);

  const fetchLeads = async () => {
    try {
      const response = await axios.get(
        `http://localhost:9000/api/getLeadsByOrg/${superadminuser?.staff_org_id}`,
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
        navigate("/");
        dispatch(logoutUser());
        toast.error("Token is expired Please Login Again !!");
      }
    }
  };

  const fetchDashboardAnalytics = async () => {
    try {
      const response = await axios.get(
        `http://localhost:9000/api/getDashboardAnalytics/${superadminuser?.staff_org_id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.success) {
        setUntouchedLeads(response.data.untouchedLeads);
        setAverageFollowUps(response.data.averageFollowUps);
      }
    } catch (error) {
      console.error("Error fetching dashboard analytics:", error);
    }
  };

  const fetchAllMetaLeads = async () => {
    try {
      const { data } = await axios.get(
        `http://localhost:9000/api/getMetaLeadsByOrgId/${superadminuser.staff_org_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMetaLeads(data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchAllMetaLeads();
    fetchDashboardAnalytics();
  }, []);

  const leadCount = leads.length;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 px-4 py-3">
        {/* Card 2: Total Leads */}
        <Link to="/super-admin-employee-leads" className="block w-full">
          <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 flex flex-col items-start cursor-pointer h-full">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 text-xl flex items-center justify-center mb-3">
              <GiFiles />
            </div>
            <div>
              <h5 className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                Total Leads
              </h5>
              <p className="text-gray-900 text-2xl font-extrabold mt-1">
                {leadCount}
              </p>
            </div>
          </div>
        </Link>

        {/* Card 3: Total Meta Leads */}
        <Link to="/social-media-superleads" className="block w-full">
          <div
            className={`border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 flex flex-col items-start cursor-pointer h-full ${
              selectedComponent === "ClosedData"
                ? "bg-violet-600 border-violet-650 text-white"
                : "bg-white border-slate-150 text-gray-800"
            }`}
            onClick={() => setSelectedComponent("ClosedData")}
          >
            <div
              className={`p-2.5 rounded-xl text-xl flex items-center justify-center mb-3 ${
                selectedComponent === "ClosedData"
                  ? "bg-violet-500 text-white"
                  : "bg-violet-50 text-violet-600"
              }`}
            >
              <FaMeta />
            </div>
            <div>
              <h5
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  selectedComponent === "ClosedData" ? "text-violet-100" : "text-gray-500"
                }`}
              >
                Total Meta Leads
              </h5>
              <p
                className={`text-2xl font-extrabold mt-1 ${
                  selectedComponent === "ClosedData" ? "text-white" : "text-gray-900"
                }`}
              >
                {metaLeads?.length}
              </p>
            </div>
          </div>
        </Link>

        {/* Card 6: Untouched Leads */}
        <Link to="/super-admin-employee-leads" className="block w-full">
          <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 flex flex-col items-start cursor-pointer h-full">
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 text-xl flex items-center justify-center mb-3">
              <FaFolderOpen />
            </div>
            <div>
              <h5 className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                Untouched Leads
              </h5>
              <p className="text-gray-900 text-2xl font-extrabold mt-1">
                {untouchedLeads}
              </p>
            </div>
          </div>
        </Link>

        {/* Card 7: Average Follow-ups */}
        <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 flex flex-col items-start block w-full h-full">
          <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 text-xl flex items-center justify-center mb-3 w-fit">
            <FaHistory />
          </div>
          <div>
            <h5 className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
              Avg Follow-ups
            </h5>
            <p className="text-gray-900 text-2xl font-extrabold mt-1">
              {averageFollowUps}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Overview2;
