import { FaSearch, FaBell } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import logoTwo from "../assets/favicon_one.png";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { GiHamburgerMenu } from "react-icons/gi";
import { toggleSidebar } from "../store/UiSlice";
import axios from "axios";
import moment from "moment";

const Topbar = ({ isSidebarOpen }) => {
  const user = useSelector((state) => state.auth.user);
  console.log(user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [filteredPages, setFilteredPages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dismissedLeads, setDismissedLeads] = useState(() => {
    try {
      const saved = localStorage.getItem("dismissed_leads");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const isLoggedIn = !!user;

  const role = user?.staff_role?.toLowerCase();

  const isAdmin = role === "admin";
  const isEmployee = role === "employee";
  const isSuperAdmin = role === "superadmin";

  const fetchNotifications = async () => {
    if (!user || !user.token) return;
    try {
      let url = "";
      if (isEmployee) {
        url = `http://localhost:9000/api/employe-leads/${user.staff_id}`;
      } else if (isAdmin || isSuperAdmin) {
        url = `http://localhost:9000/api/getLeadsByOrg/${user.staff_org_id || user.org_id}`;
      }
      if (!url) return;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (response.data && Array.isArray(response.data)) {
        const todayStr = moment().format("YYYY-MM-DD");
        // Filter leads created today
        const todayLeads = response.data.filter(
          (lead) => moment(lead.createdTime).format("YYYY-MM-DD") === todayStr,
        );
        setNotifications(todayLeads);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, isLoggedIn]);

  const handleNotificationStatusChange = async (leadId, status) => {
    try {
      const response = await axios.put(
        `http://localhost:9000/api/updateOnlyPrimaryStatus/${leadId}`,
        { primary_status: status },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        },
      );
      if (response.status === 200) {
        // Add to dismissed list so it disappears immediately from dropdown and count
        const newDismissed = [...dismissedLeads, leadId];
        setDismissedLeads(newDismissed);
        localStorage.setItem("dismissed_leads", JSON.stringify(newDismissed));

        // Update local notifications list
        setNotifications((prev) =>
          prev.map((lead) =>
            lead.lead_id === leadId
              ? { ...lead, primary_status: status }
              : lead,
          ),
        );
      }
    } catch (error) {
      console.error("Error updating notification status:", error);
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    try {
      return moment(timeStr, "HH:mm").format("hh:mm A");
    } catch {
      return timeStr;
    }
  };

  // Active notifications: created today, not marked as visit done, and not dismissed
  const activeNotifications = notifications.filter(
    (lead) =>
      !dismissedLeads.includes(lead.lead_id) &&
      lead.primary_status !== "visit done",
  );
  const notificationCount = activeNotifications.length;

  const pages = [
    ...(isLoggedIn
      ? [
          {
            name: "Dashboard",
            path: isAdmin
              ? "/admin-dashboard"
              : isEmployee
                ? "/employees-dashboard"
                : isSuperAdmin
                  ? "/super-admin-dashboard"
                  : "/",
          },
        ]
      : []),

    // -------- ADMIN ROUTES --------
    ...(isAdmin
      ? [
          { name: "Leads", path: "/leads" },
          { name: "Social Media Leads", path: "/main-social-media-leads" },
          { name: "Import Data", path: "/admin-import-data" },
          { name: "Reports", path: "/admin-report" },
          { name: "Data Export", path: "/data-export" },
          { name: "Projects", path: "/admin-project" },
          { name: "Employee Management", path: "/employee-management" },
          { name: "Profile", path: "/admin-profile" },
          { name: "Total Leads", path: "/admin-total-leads" },
          { name: "Total Visits", path: "/admin-total-visit" },
          { name: "Closed Deals", path: "/admin-total-closed" },
          { name: "Sold Units", path: "/employee-sold-units" },
        ]
      : []),

    // -------- EMPLOYEE ROUTES --------
    ...(isEmployee
      ? [
          { name: "Leads", path: "/employee-leads" },
          { name: "Reports", path: "/employee-report" },
          { name: "Data Export", path: "/employee-data-export" },
          { name: "Profile", path: "/employee-profile" },
          { name: "Total Leads", path: "/employees-total-leads" },
          { name: "Visits", path: "/visit-data" },
          { name: "Closed Deals", path: "/close-data" },
          { name: "Sold Units", path: "/employee-sold" },
        ]
      : []),

    // -------- SUPERADMIN ROUTES --------
    ...(isSuperAdmin
      ? [
          { name: "Employee Leads", path: "/super-admin-employee-leads" },
          {
            name: "Social Media Leads",
            path: "/main-social-media-super-admin-leads",
          },
          { name: "Import Data", path: "/super-admin-import-data" },
          { name: "Reports", path: "/super-admin-reporting" },
          { name: "Data Export", path: "/super-admin-data-export" },
          { name: "Projects", path: "/Super-admin-project" },
          {
            name: "Employee Management",
            path: "/super-admin-employee-management",
          },
          { name: "Admin Management", path: "/super-admin-AdminManagement" },
          { name: "Profile", path: "/super-admin-profile" },
          { name: "Total Leads", path: "/super-admin-total-lead" },
          { name: "Total Visits", path: "/super-admin-total-visit" },
          { name: "Closed Deals", path: "/super-admin-close-data" },
          { name: "Sold Units", path: "/super-admin-Sold-Units" },
        ]
      : []),
  ];

  const pageTitle = location.pathname
    ?.split("/")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" / ");

  useEffect(() => {
    const timeout = setTimeout(() => {
      const lowerQuery = query.toLowerCase().trim();
      setFilteredPages(
        lowerQuery
          ? pages.filter((page) => page.name.toLowerCase().includes(lowerQuery))
          : [],
      );
    }, 300); // Debounce input
    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelect = (path) => {
    navigate(path);
    setQuery("");
    setFilteredPages([]);
  };

  const getInitials = (name) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // const navigateToProfile = () => {
  //   if (role === "superadmin") {
  //     navigate("/super-admin-profile");
  //   }

  //   if (role === "admin") {
  //     navigate("/admin-profile");
  //   }

  //   if (role === "employee") {
  //     navigate("/employee-profile");
  //   }
  // };

  const navigateToProfile = () => {
    if (isSuperAdmin) navigate("/super-admin-profile");
    else if (isAdmin) navigate("/admin-profile");
    else if (isEmployee) navigate("/employee-profile");
  };

  return (
    <header
      className={`app-topbar fixed top-0 right-0 z-50 flex justify-between items-center px-6 py-3 bg-white/80 backdrop-blur-md border-bottom border-neutral-200 shadow-none transition-all duration-300 ${
        isSidebarOpen ? "left-60" : "left-12 sm:left-28"
      }`}
    >
      {/* Navigation & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => dispatch(toggleSidebar())}
          title="Toggle Sidebar Menu"
          className="p-2 text-neutral-600 hover:text-neutral-950 rounded-xl hover:bg-neutral-100/80 transition-all focus:outline-none text-xl hidden max-lg:flex items-center justify-center border border-neutral-200/80 shadow-2xs"
        >
          <GiHamburgerMenu />
        </button>
        <div className="flex items-center gap-2">
          <img
            src={logoTwo}
            alt="Logo"
            className="h-8 w-8 object-contain hidden max-lg:block"
          />
          <div className="flex flex-col">
            <h2 className="text-xs sm:text-sm font-bold text-neutral-900 leading-tight tracking-tight flex items-center gap-1.5">
              <span className="hidden sm:inline-block text-neutral-400 font-medium tracking-wide">
                CRMGuru
              </span>
              <span className="hidden sm:inline text-neutral-300">/</span>
              <span className="text-neutral-900 font-semibold">
                {pageTitle || "Dashboard"}
              </span>
            </h2>
          </div>
        </div>
      </div>

      {/* Right Content */}
      <div className="flex items-center gap-4 relative">
        {/* Search */}
        <div className="relative w-64 hidden sm:block">
          <div className="flex items-center bg-neutral-50 border border-neutral-200 px-4 py-2 rounded-xl text-neutral-600 focus-within:ring-2 focus-within:ring-neutral-950 focus-within:border-transparent transition-all">
            <input
              type="text"
              placeholder="Search page..."
              className="flex-1 bg-transparent focus:outline-none text-xs hidden sm:block text-neutral-900 placeholder-neutral-400 font-medium"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <FaSearch className="ml-2 text-neutral-400 text-sm" />
          </div>
          {query && filteredPages.length > 0 && (
            <ul className="absolute mt-1.5 w-full bg-white border border-neutral-200 rounded-xl shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto">
              {filteredPages.map((page, index) => (
                <li
                  key={index}
                  onClick={() => handleSelect(page.path)}
                  className="px-4 py-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 cursor-pointer transition-colors"
                >
                  {page.name}
                </li>
              ))}
            </ul>
          )}

          {query && filteredPages.length === 0 && (
            <div className="absolute mt-1.5 w-full bg-white border border-neutral-200 rounded-xl shadow-lg z-50 p-3 text-neutral-400 text-xs font-medium">
              No results found
            </div>
          )}
        </div>

        {/* Notification Bell */}
        {isLoggedIn && (
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 transition-all flex items-center justify-center"
            >
              <FaBell className="text-xl" />
              {notificationCount > 0 && (
                <span className="absolute top-1.5 right-1.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold leading-none text-white bg-neutral-900 border border-white rounded-full">
                  {notificationCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-[-10px] sm:right-0 mt-3 w-[calc(100vw-2.5rem)] max-w-xs sm:max-w-sm sm:w-80 bg-white border border-neutral-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="bg-neutral-900 px-4 py-3.5 text-white font-semibold flex justify-between items-center">
                  <span className="text-xs tracking-tight">Notifications</span>
                  <span className="bg-white/10 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                    {notificationCount} Pending
                  </span>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100">
                  {activeNotifications.length === 0 ? (
                    <div className="p-8 text-center text-neutral-400 text-xs font-medium">
                      No new notifications today.
                    </div>
                  ) : (
                    activeNotifications.map((lead) => (
                      <div
                        key={lead.lead_id}
                        className="p-4 hover:bg-neutral-50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-neutral-900 text-xs">
                            {lead.name}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
                            {lead.leadSource}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-500 mb-2.5 flex justify-between items-center">
                          <span>Phone: {lead.phone}</span>
                          {lead.visit_time && (
                            <span className="bg-neutral-100 text-neutral-800 border border-neutral-200 px-1.5 py-0.5 rounded font-bold text-[9px]">
                              Time: {formatTime(lead.visit_time)}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 justify-end">
                          <button
                            onClick={() =>
                              handleNotificationStatusChange(
                                lead.lead_id,
                                "visit done",
                              )
                            }
                            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/50 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors"
                          >
                            Visit Done
                          </button>
                          <button
                            onClick={() =>
                              handleNotificationStatusChange(
                                lead.lead_id,
                                "new leads",
                              )
                            }
                            className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/50 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors"
                          >
                            Not Done
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Profile */}
        <div className="flex items-center gap-2.5 pl-1.5 border-l border-neutral-200">
          <button
            onClick={navigateToProfile}
            className="bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-bold w-8 h-8 rounded-xl flex items-center justify-center transition-colors shadow-sm"
          >
            {getInitials(user?.staff_name)}
          </button>
          <div className="flex flex-col items-start hidden sm:flex">
            <span className="text-xs font-bold text-neutral-900 leading-tight capitalize">
              {user?.staff_name}
            </span>
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
              {user?.staff_role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
