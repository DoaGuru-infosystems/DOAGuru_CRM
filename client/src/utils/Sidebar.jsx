import { NavLink, useLocation, useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { FaMoneyCheck } from "react-icons/fa";
import { AiOutlineLogout, AiOutlineClose } from "react-icons/ai";
import { GiHamburgerMenu } from "react-icons/gi";
import { MdDashboard } from "react-icons/md";
import { SiGoogleclassroom } from "react-icons/si";
import { TbHexagon3D, TbReport } from "react-icons/tb";
import { PiStudentBold } from "react-icons/pi";
import { HiDocumentReport } from "react-icons/hi";
import { TiSocialInstagramCircular } from "react-icons/ti";
import { GrProjects, GrTableAdd } from "react-icons/gr";
import { LuImport } from "react-icons/lu";
import { BiExport } from "react-icons/bi";
import { ImProfile } from "react-icons/im";
// import { clearUser } from "../redux/admin/adminSlice";
import { useDispatch, useSelector } from "react-redux";
import { IoIosPeople } from "react-icons/io";
import { RiAdminFill } from "react-icons/ri";
import { logoutUser } from "../store/UserSlice";
import logoTwo from "../assets/favicon_one.png";
import logoOne from "../assets/CRMGuruLogo.png";
import { IoSettings } from "react-icons/io5";
import { path } from "framer-motion/client";
import { FaMeta, FaMoneyBills } from "react-icons/fa6";

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
  const user = useSelector((state) => state.auth.user);
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();


  const menuItems = [
    ...(user?.staff_role === "superadmin"
      ? [
        {
          name: "Dashboard",
          path: "/dashboard",
          icon: <MdDashboard />,
        },

        {
          name: "Leads",
          path: "/super-admin-employee-leads",
          icon: <GrTableAdd />,
        },
        {
          name: "Digital Marketing Leads",
          path: "/social-media-superleads",
          icon: <FaMeta />,
        },

        {
          name: "Reports",
          path: "/super-admin-reporting",
          icon: <TbReport />,
        },
        {
          name: "Data Export",
          path: "/super-admin-data-export",
          icon: <BiExport />,
        },
        {
          name: "Projects",
          path: "/super-admin-project-dash",
          icon: <GrProjects />,
        },
        {
          name: "Employees Management",
          path: "/super-admin-employee-management",
          icon: <IoIosPeople />,
        },
        {
          name: "Settings",
          path: "/super-admin-settings",
          icon: <IoSettings />,
        },
        {
          name: "Finance Company Settings",
          path: "/finance-company-settings",
          icon: <FaMoneyBills />,
        },
      ]
      : []),

    ...(user?.staff_role === "admin"
      ? [
        {
          name: "Dashboard",
          path: "/dashboard",
          icon: <MdDashboard />,
        },

        {
          name: "Leads",
          path: "/leads",
          icon: <GrTableAdd />,
        },
        {
          name: "Digital Marketing Leads",
          path: "/main-social-media-leads",
          icon: <FaMeta />,
        },
        {
          name: "Reports",
          path: "/admin-report",
          icon: <TbReport />,
        },

        {
          name: "Data Export",
          path: "/data-export",
          icon: <BiExport />,
        },

        {
          name: "Projects",
          path: "/Project-Dash",
          icon: <GrProjects />,
        },
        {
          name: "Employees Management",
          path: "/employee-management",
          icon: <RiAdminFill />,
        },
      ]
      : []),

    ...(user?.staff_role === "employee"
      ? [
        {
          name: "Dashboard",
          path: "/dashboard",
          icon: <MdDashboard />,
        },

        {
          name: "Assigned Leads",
          path: "/employee-leads",
          icon: <GrTableAdd />,
        },
        {
          name: "Assigned Meta Leads",
          path: "/meta-leads-employee",
          icon: <FaMeta />,
        },
        {
          name: "Reports",
          path: "/employee-report",
          icon: <TbReport />,
        },
        {
          name: "Data Export",
          path: "/employee-data-export",
          icon: <BiExport />,
        },
      ]
      : []),
  ];

  const logoutHandler = () => {
    const isConfirmed = window.confirm("Are you sure you want to Logout?");
    if (isConfirmed) {
      dispatch(logoutUser());
      navigate("/");
    }
  };

  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-neutral-900/40 z-[999] lg:hidden backdrop-blur-xs"
          onClick={toggleSidebar}
        />
      )}
      <div
        className={`app-sidebar ${isSidebarOpen ? "sidebar-open" : ""
          } h-screen fixed p-3 flex flex-col bg-[#F3F3F1] border-r border-neutral-200`}
      >
        {/* Top Logo and Sidebar Toggle */}
        <div className="flex items-center justify-between mb-6 px-2">
          <h1 className="text-md font-bold text-neutral-900">
            {isSidebarOpen ? (
              <>
                <img src={logoOne} alt="logo" className="h-9 w-auto max-w-[140px] object-contain" />
              </>
            ) : (
              <>
                <img src={logoTwo} alt="logo" className="h-10 w-10 object-contain" />
              </>
            )}
          </h1>
          <button
            onClick={toggleSidebar}
            title={isSidebarOpen ? "Close / Collapse Sidebar" : "Expand Sidebar"}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/60 transition-all focus:outline-none text-xl flex items-center justify-center"
          >
            <GiHamburgerMenu className="text-xl" />
          </button>
        </div>

        {/* Scrollable Menu */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-4 thin-scrollbar">
          <nav className="flex flex-col gap-1.5">
            {menuItems.map((item, idx) => (
              <NavLink
                to={item.path}
                key={idx}
                className={({ isActive }) =>
                  `flex items-center ${isSidebarOpen
                    ? "justify-start gap-3 px-4"
                    : "justify-center text-xl"
                  } py-2.5 rounded-xl font-medium transition-all duration-200 ${isActive
                    ? "bg-neutral-900 text-white shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50"
                  }`
                }
                title={item.name}
              >
                <div className={`${isSidebarOpen ? "text-lg" : "text-xl"} flex items-center`}>
                  {item.icon}
                </div>
                {isSidebarOpen && <span className="text-sm">{item.name}</span>}
              </NavLink>
            ))}
          </nav>

          {/* Logout Button */}
          <button
            className={`mt-auto bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 py-2.5 rounded-xl flex items-center transition-all duration-200 shadow-xs ${isSidebarOpen ? "justify-start gap-3 px-4" : "justify-center"
              }`}
            onClick={logoutHandler}
          >
            <AiOutlineLogout className="text-lg" />
            {isSidebarOpen && <span className="text-sm font-semibold">Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
