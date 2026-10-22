import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { MdOutlineNextWeek } from "react-icons/md";
import { AiOutlineProject } from "react-icons/ai";
import { Link, useNavigate } from "react-router-dom";
import { FaCheckCircle, FaFolderOpen, FaHistory } from "react-icons/fa";
import { logoutUser } from "../store/UserSlice";
import toast from "react-hot-toast";
import { SiGoogleads } from "react-icons/si";
import { FaMeta } from "react-icons/fa6";

const AdminOverviewDash = () => {
  const [leads, setLeads] = useState([]);
  const [employee, setEmployee] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState("LeadData");
  const [project, setProjects] = useState([]);
  const [employeesold, setemployeesold] = useState([]);
  const [metaLeads, setMetaLeads] = useState([]);
  const [untouchedLeads, setUntouchedLeads] = useState(0);
  const [averageFollowUps, setAverageFollowUps] = useState(0);
  const EmpId = useSelector((state) => state.auth.user);
  const adminuser = useSelector((state) => state.auth.user);
  const token = adminuser.token;
  const userId = adminuser.user_id;
  const [visit, setVisit] = useState([]);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const fetchLeads = async () => {
    try {
      const response = await axios.get(
        `https://crm-generalize.siarasystems.com/api/getLeadsByOrg/${adminuser?.staff_org_id}`,
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

  const fetchDashboardAnalytics = async () => {
    try {
      const response = await axios.get(
        `https://crm-generalize.siarasystems.com/api/getDashboardAnalytics/${adminuser?.staff_org_id}`,
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
        `https://crm-generalize.siarasystems.com/api/getMetaLeadsByOrgId/${adminuser.staff_org_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMetaLeads(data);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchVisit = async () => {
    try {
      const response = await axios.get(
        `https://crm-generalize.siarasystems.com/api/leads-all-visits/${adminuser?.staff_org_id}`,
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

  const fetchEmployee = async () => {
    try {
      const response = await axios.get(
        `https://crm-generalize.siarasystems.com/api/employee`,
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

  const fetchProjects = async () => {
    try {
      const response = await axios.get(
        `https://crm-generalize.siarasystems.com/api/super-admin-all-project/${adminuser?.staff_org_id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setProjects(response.data);
    } catch (error) {
      console.error("Error fetching quotations:", error);
    }
  };

  const employeesoldunit = async () => {
    try {
      const response = await axios.get(
        `https://crm-generalize.siarasystems.com/api/getAllUnitSoldByOrg/${adminuser?.staff_org_id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setemployeesold(response.data);
    } catch (error) {
      console.error("Error fetching quotations:", error);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchLeads();
    fetchEmployee();
    fetchVisit();
    employeesoldunit();
    fetchAllMetaLeads();
    fetchDashboardAnalytics();
  }, []);

  const leadCount = leads.length;
  const soldunit = employeesold.length;
  const projectCount = project.length;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 px-4 py-3">
        {/* Card 1: Total Projects */}
        <Link to="/admin-project" className="block w-full">
          <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 flex flex-col items-start cursor-pointer h-full">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 text-xl flex items-center justify-center mb-3">
              <AiOutlineProject />
            </div>
            <div>
              <h5 className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                Total Projects
              </h5>
              <p className="text-gray-900 text-2xl font-extrabold mt-1">
                {projectCount}
              </p>
            </div>
          </div>
        </Link>

        {/* Card 2: Total Leads */}
        <Link to="/leads" className="block w-full">
          <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 flex flex-col items-start cursor-pointer h-full">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 text-xl flex items-center justify-center mb-3">
              <SiGoogleads />
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

        {/* Card 3: Total Site Visit */}
        <Link to="/admin-total-visit" className="block w-full">
          <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 flex flex-col items-start cursor-pointer h-full">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 text-xl flex items-center justify-center mb-3">
              <MdOutlineNextWeek />
            </div>
            <div>
              <h5 className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                Total Site Visit
              </h5>
              <p className="text-gray-900 text-2xl font-extrabold mt-1">
                {visit?.length}
              </p>
            </div>
          </div>
        </Link>

        {/* Card 4: Total Meta Leads */}
        <Link to="/main-social-media-leads" className="block w-full">
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

        {/* Card 5: Employee Sold Units */}
        <Link to="/employee-sold-units" className="block w-full">
          <div
            className={`border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 flex flex-col items-start cursor-pointer h-full ${
              selectedComponent === "solddata"
                ? "bg-amber-600 border-amber-650 text-white"
                : "bg-white border-slate-150 text-gray-800"
            }`}
            onClick={() => setSelectedComponent("solddata")}
          >
            <div
              className={`p-2.5 rounded-xl text-xl flex items-center justify-center mb-3 ${
                selectedComponent === "solddata"
                  ? "bg-amber-500 text-white"
                  : "bg-amber-50 text-amber-600"
              }`}
            >
              <FaCheckCircle />
            </div>
            <div>
              <h5
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  selectedComponent === "solddata" ? "text-amber-100" : "text-gray-500"
                }`}
              >
                Employee Sold Units
              </h5>
              <p
                className={`text-2xl font-extrabold mt-1 ${
                  selectedComponent === "solddata" ? "text-white" : "text-gray-900"
                }`}
              >
                {soldunit}
              </p>
            </div>
          </div>
        </Link>

        {/* Card 6: Untouched Leads */}
        <Link to="/leads" className="block w-full">
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

export default AdminOverviewDash;
