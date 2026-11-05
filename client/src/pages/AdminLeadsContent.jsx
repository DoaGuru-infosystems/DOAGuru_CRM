import React, { useState, useEffect } from "react";
import axios from "axios";
import moment from "moment-timezone";
import { Link, useNavigate } from "react-router-dom";
import { BsPencilSquare, BsTrash } from "react-icons/bs";
import ReactPaginate from "react-paginate";
import { useSelector } from "react-redux";
import AdminEditLeadPopup from "../components/AdminEditLeadPopup";
import toast from "react-hot-toast";
import ColumnCustomizer from "../components/common/ColumnCustomizer";
import useColumnPreferences from "../components/common/useColumnPreferences";
import { formatDate, formatDateTime, formatCreatedDateTime } from "../utils/dateUtils";
import * as XLSX from "xlsx";
import { BiExport } from "react-icons/bi";

const ADMIN_LEAD_COLUMNS = [
  { key: "s_no", label: "S.no" },
  { key: "lead_id", label: "Lead ID" },
  { key: "calling_date", label: "Calling Date" },
  { key: "name", label: "Customer Name", locked: true },
  { key: "office_business_name", label: "Business Name" },
  { key: "phone", label: "Mobile Number" },
  { key: "address", label: "Address" },
  { key: "leadSource", label: "Lead Source" },
  { key: "lead_status", label: "Lead Status" },
  { key: "next_follow_date_time", label: "Next Follow Date Time" },
  { key: "remark", label: "Remark" },
  { key: "interested_follow_up", label: "Interested Follow-up" },
  { key: "assignedTo", label: "Assigned To" },
  { key: "created_by_name", label: "Created By" },
  { key: "action", label: "Action", locked: true },
];

function AdminLeadsContent({ isSidebarOpen }) {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const adminuser = useSelector((state) => state.auth.user);
  const token = adminuser.token;
  const userId = adminuser.user_id;

  const {
    visibleColumns,
    toggleColumn,
    resetToDefault,
    isColumnVisible,
  } = useColumnPreferences("admin_leads", ADMIN_LEAD_COLUMNS, adminuser);
  const [employees, setEmployees] = useState([]);

  const [filterDate, setFilterDate] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [leadsPerPage, setLeadsPerPage] = useState(10);
  const [leadSourceFilter, setLeadSourceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [visitFilter, setVisitFilter] = useState("");
  const [dealFilter, setDealFilter] = useState("");
  // HIDDEN (IT/DM CRM): Unit Sold filter
  // const [soldunitFilter, setSoldUnitFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [visit, setVisit] = useState([]);
  const [loading, setLoading] = useState(false);
  const [leadStatusFilter, setLeadStatusFilter] = useState("");
  const [leadnotInterestedStatusFilter, setLeadnotInterestedStatusFilter] =
    useState("");
  const [meetingStatusFilter, setMeetingStatusFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("desce");
  const [projects, setProjects] = useState([]);
  const [projectunit, setProjectUnit] = useState([]);
  const [selectedLead, setSelectedLead] = useState();
  const [visitmonthFilter, setVisitMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  // Fetch leads from the API
  useEffect(() => {
    fetchEmployees();
    fetchProjects();
    fetchProjectsUnit();
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [token]);

  console.log(projects);

  const fetchLeads = async () => {
    try {
      const response = await axios.get(
        `http://localhost:9000/api/getLeadsByOrg/${adminuser?.staff_org_id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = response.data;
      const sources = data
        .map((lead) => lead.leadSource)
        .filter((source) => source);
      setDynamicLeadSources(Array.from(new Set(sources)));
      setLeads(data);
    } catch (error) {
      console.error("Error fetching leads:", error);
    }
  };

  console.log(leads);

  const fetchEmployees = async () => {
    try {
      const { data } = await axios.get(
        `http://localhost:9000/api/getEmployeeByOrg/${adminuser?.staff_org_id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setEmployees(data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data } = await axios.get(
        `http://localhost:9000/api/super-admin-all-project/${adminuser?.staff_org_id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchProjectsUnit = async (main_project_id) => {
    try {
      if (!main_project_id) {
        setProjectUnit([]);
        return;
      }

      const response = await axios.get(
        `http://localhost:9000/api/super-admin-project-unit/${main_project_id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.length > 0) {
        setProjectUnit(response.data);
      } else {
        setProjectUnit([]);
      }
    } catch (error) {
      console.error("Error fetching units:", error);
      setProjectUnit([]);
    }
  };

  const applyFilters = () => {
    let filtered = [...leads];

    // Filter by search term
    if (searchTerm) {
      const trimmedSearchTerm = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((lead) =>
        ["staff_name", "leadSource", "phone", "name"].some((key) =>
          lead[key]?.toLowerCase().trim().includes(trimmedSearchTerm)
        )
      );
    }

    // Filter by date range
    if (startDate && endDate) {
      filtered = filtered.filter((lead) => {
        const leadDate = moment(lead.createdTime).format("YYYY-MM-DD");
        return leadDate >= startDate && leadDate <= endDate;
      });
    }

    // Filter by lead source
    if (leadSourceFilter) {
      filtered = filtered.filter(
        (lead) => lead.leadSource === leadSourceFilter
      );
    }

    // Filter by employee
    if (employeeFilter) {
      filtered = filtered.filter(
        (lead) => lead.assignedTo === Number(employeeFilter)
      );
    }

    // HIDDEN (IT/DM CRM): Unit Sold filter logic
    // if (soldunitFilter) {
    //   filtered = filtered.filter((lead) => lead.unit_status === soldunitFilter);
    // }

    return filtered;
  };

  useEffect(() => {
    const filtered = applyFilters();
    setFilteredLeads(filtered);
    setCurrentPage(0);
  }, [
    searchTerm,
    startDate,
    endDate,
    leads,
    filterDate,
    leadSourceFilter,
    statusFilter,
    visitFilter,
    dealFilter,
    leadStatusFilter,
    leadnotInterestedStatusFilter,
    meetingStatusFilter,
    employeeFilter,
    monthFilter,
    sortOrder,
    yearFilter,
    visitmonthFilter,
    // HIDDEN (IT/DM CRM): Unit Sold filter dependency
    // soldunitFilter,
  ]);

  // Total Leads
  const totalLeads = applyFilters().length;

  // HIDDEN (IT/DM CRM): Closed Leads badge calculation
  // const totalClosedLeads = applyFilters().filter(
  //   (lead) => lead.deal_status === "close"
  // ).length;

  // HIDDEN (IT/DM CRM): Total Site Visit badge calculation
  // const totalVisits = applyFilters().filter((lead) =>
  //   ["fresh", "re-visit", "self", "associative"].includes(lead.visit)
  // ).length;

  const indexOfLastLead = (currentPage + 1) * leadsPerPage;
  const indexOfFirstLead = indexOfLastLead - leadsPerPage;

  const currentLeads =
    leadsPerPage === Infinity
      ? filteredLeads
      : filteredLeads.slice(indexOfFirstLead, indexOfLastLead);

  const pageCount = Math.ceil(filteredLeads.length / leadsPerPage);

  const handleCreateClick = () => {
    setIsEditing(false);
    setShowPopup(true);
  };

  const handlePageClick = (data) => {
    setCurrentPage(data.selected);
  };

  const handleLeadsPerPageChange = (e) => {
    const value = e.target.value;
    setLeadsPerPage(value === "All" ? Infinity : parseInt(value, 10));
    setCurrentPage(0); // Reset to the first page
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder((prevOrder) => (prevOrder === "desce" ? "asce" : "desce"));
  };

  const handleEditClick = (lead) => {
    setSelectedLead(lead);
    setIsEditing(true);
    setShowPopup(true);
  };

  const handleDeleteClick = async (id) => {
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this data?"
    );
    if (isConfirmed) {
      try {
        await axios.delete(
          `http://localhost:9000/api/leads/${id}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        fetchLeads();
      } catch (error) {
        console.error("Error deleting lead:", error);
      }
    }
  };

  const hardCodedLeadSources = [
    "Referrals",
    "DM",
    "Office Data",
    "OutDoor Media",
    "Walk In",
    "Cold Calling",
    "Email Campaigns",
    "Networking Events",
    "Paid Advertising",
    "Content Marketing",
    "SEO",
    "Trade Shows",
    "Affiliate Marketing",
    "Direct Mail",
    "Online Directories",
    "others",
  ];

  const [dynamicLeadSources, setDynamicLeadSources] = useState([]);

  const combinedLeadSources = [
    ...new Set([...hardCodedLeadSources, ...dynamicLeadSources]),
  ];

  const handleReset = () => {
    // window.location.reload();
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setFilterDate("");
    setLeadSourceFilter("");
    setStatusFilter("");
    setVisitFilter("");
    setDealFilter("");
    setLeadStatusFilter("");
    setLeadnotInterestedStatusFilter("");
    setMeetingStatusFilter("");
    setEmployeeFilter("");
    setMonthFilter("");
    setYearFilter("");
    setVisitMonthFilter("");
    // HIDDEN (IT/DM CRM): Unit Sold filter reset
    // setSoldUnitFilter("");
  };

  // ✅ Export filtered leads to Excel
  const handleExportToExcel = () => {
    const dataToExport =
      filteredLeads && filteredLeads.length > 0 ? filteredLeads : leads;

    if (!dataToExport || dataToExport.length === 0) {
      toast.error("No leads available to export!");
      return;
    }

    const exportData = dataToExport.map((lead, index) => {
      const row = {};

      if (isColumnVisible("s_no")) {
        row["S.no"] = index + 1;
      }
      if (isColumnVisible("lead_id")) {
        row["Lead ID"] = lead.lead_id;
      }
      if (isColumnVisible("calling_date")) {
        row["Calling Date"] = formatDate(lead.calling_date || lead.actual_date || lead.createdTime) || "-";
      }
      if (isColumnVisible("name")) {
        row["Customer Name"] = lead.name || lead.customer_name || "-";
      }
      if (isColumnVisible("office_business_name")) {
        row["Business Name"] = lead.office_business_name || lead.business_name || "-";
      }
      if (isColumnVisible("phone")) {
        row["Mobile Number"] = lead.phone || "-";
      }
      if (isColumnVisible("address")) {
        row["Address"] = lead.address || "-";
      }
      if (isColumnVisible("leadSource")) {
        row["Lead Source"] = lead.leadSource || "-";
      }
      if (isColumnVisible("lead_status")) {
        row["Lead Status"] = lead.lead_status || "Pending";
      }
      if (isColumnVisible("next_follow_date_time")) {
        row["Next Follow Date Time"] = (lead.next_follow_date_time || lead.visit_time)
          ? formatDateTime(lead.next_follow_date_time || lead.visit_time)
          : "-";
      }
      if (isColumnVisible("remark")) {
        row["Remark"] = lead.remark || lead.lead_review || "-";
      }
      if (isColumnVisible("interested_follow_up")) {
        row["Interested Follow-up"] = lead.interested_follow_up || "-";
      }
      if (isColumnVisible("assignedTo")) {
        row["Assigned To"] =
          lead.assignees && lead.assignees.length > 0
            ? lead.assignees
                .map((a) => `${a.staff_name} (${a.access_type})`)
                .join(", ")
            : lead.staff_name || "-";
      }
      if (isColumnVisible("created_by_name")) {
        row["Created By"] = lead.created_by_name
          ? `${lead.created_by_name} (${lead.created_by_role || "staff"})`
          : "-";
      }
      row["Created Date"] = formatCreatedDateTime(lead.createdTime);

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

    XLSX.writeFile(
      workbook,
      `General_Leads_${moment().format("YYYY-MM-DD_HH-mm")}.xlsx`
    );
  };

  return (
    <>
      <div className="flex mt-20 w-full max-w-full overflow-x-hidden">
        <div className="w-full min-h-screen bg-[#F9FAFF] p-2 sm:p-4">
          <div className="container">
            <div className="main">
              <h2 className="text-2xl text-center mt-[2rem] font-medium">
                Leads Management
              </h2>
              <div className="mx-auto h-[3px] w-16 bg-cyan-600 my-3"></div>

              {/* Button to create a new lead */}
              <div className="mb-4">
                <button
                  className="bg-cyan-500 text-white px-4 py-2 rounded hover:bg-cyan-700 font-medium"
                  onClick={handleCreateClick}
                >
                  Add Lead
                </button>
              </div>

              <div className="grid max-sm:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                {/* Search */}
                <div className="flex flex-col col-span-2">
                  <label className="mb-1 text-sm font-semibold text-gray-700">
                    Search
                  </label>
                  <input
                    type="text"
                    placeholder="Search By Name, Lead Source, Assigned To, Phone No..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition ${searchTerm
                      ? "bg-cyan-600 text-white placeholder-white"
                      : "bg-white"
                      }`}
                  />
                </div>

                {/* Filtered Date */}
                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-semibold text-gray-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition ${startDate ? "bg-cyan-600 text-white" : "bg-white"
                      }`}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-semibold text-gray-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition ${endDate ? "bg-cyan-600 text-white" : "bg-white"
                      }`}
                  />
                </div>

                {/* Lead Source */}
                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-semibold text-gray-700">
                    Lead Source
                  </label>
                  <select
                    value={leadSourceFilter}
                    onChange={(e) => setLeadSourceFilter(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition ${leadSourceFilter ? "bg-cyan-600 text-white" : "bg-white"
                      }`}
                  >
                    <option value="">Select Lead Source</option>
                    <option value="Facebook">Facebook</option>
                    <option value="One Realty Website">
                      One Realty Website
                    </option>
                    <option value="99 Acres">99 Acres</option>
                    <option value="Referrals">Referrals</option>
                    <option value="Cold Calling">Cold Calling</option>
                    <option value="Email Campaigns">Email Campaigns</option>
                    <option value="Networking Events">Networking Events</option>
                    <option value="Paid Advertising">Paid Advertising</option>
                    <option value="Content Marketing">Content Marketing</option>
                    <option value="SEO">SEO</option>
                    <option value="Trade Shows">Trade Shows</option>
                    <option value="Affiliate Marketing">
                      Affiliate Marketing
                    </option>
                    <option value="Direct Mail">Direct Mail</option>
                    <option value="Online Directories">
                      Online Directories
                    </option>
                  </select>
                </div>

                {/* Employee Filter */}
                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-semibold text-gray-700">
                    Employee
                  </label>
                  <select
                    value={employeeFilter}
                    onChange={(e) => setEmployeeFilter(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition ${employeeFilter ? "bg-cyan-600 text-white" : "bg-white"
                      }`}
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.staff_id} value={emp.staff_id}>
                        {emp.staff_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* HIDDEN (IT/DM CRM): Unit Sold Filter */}
                {/* <div className="flex flex-col">
                  <label className="mb-1 text-sm font-semibold text-gray-700">
                    Unit Sold
                  </label>
                  <select
                    value={soldunitFilter}
                    onChange={(e) => setSoldUnitFilter(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition ${soldunitFilter ? "bg-cyan-600 text-white" : "bg-white"
                      }`}
                  >
                    <option value="">All Deal</option>
                    <option value="sold">Sold</option>
                  </select>
                </div> */}

                {/* Reset Button */}
                <div className="flex flex-col justify-end">
                  <button
                    onClick={handleReset}
                    className="w-full rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-cyan-700 active:scale-95 transition"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-10 text-base sm:text-xl font-semibold my-3 mt-5">
              {/* Total Lead Count */}
              <div className="w-full sm:w-auto text-gray-700 text-sm sm:text-xl">
                Total Lead: {totalLeads}
              </div>

              {/* HIDDEN (IT/DM CRM): Total Site Visit badge */}
              {/* <div className="w-full sm:w-auto text-gray-700 text-sm sm:text-xl">
                Total Site Visit: {totalVisits}
              </div> */}

              {/* HIDDEN (IT/DM CRM): Total Closed Leads badge */}
              {/* <div className="w-full sm:w-auto text-gray-700 text-sm sm:text-xl">
                Total Closed Lead: {totalClosedLeads}
              </div> */}

              {/* Controls: Columns & Rows */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex gap-2 items-center cursor-pointer text-sm font-medium"
                  onClick={handleExportToExcel}
                >
                  <BiExport /> Export Leads
                </button>
                <ColumnCustomizer
                  columns={ADMIN_LEAD_COLUMNS}
                  visibleColumns={visibleColumns}
                  toggleColumn={toggleColumn}
                  resetToDefault={resetToDefault}
                />
                <select
                  onChange={handleLeadsPerPageChange}
                  className="border rounded-2xl p-2 text-sm"
                >
                  <option value={10}>Number of rows: 10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value="All">All</option>
                </select>
              </div>
            </div>

            <div className="w-full max-w-full overflow-x-auto mt-4">
              <table className={`${isSidebarOpen ? "w-[78rem]" : "w-[86rem]"} bg-white border`}>
                <thead>
                  <tr className="text-nowrap">
                    {isColumnVisible("s_no") && (
                      <th className="px-4 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm border-y-2 border-gray-300 text-left">
                        S.no
                      </th>
                    )}
                    {isColumnVisible("lead_id") && (
                      <th className="px-4 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm border-y-2 border-gray-300 text-left">
                        Lead ID
                      </th>
                    )}
                    {isColumnVisible("calling_date") && (
                      <th className="px-4 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm border-y-2 border-gray-300 text-left cursor-pointer" onClick={toggleSortOrder}>
                        Calling Date
                        <span className="text-cyan-900 mx-1">{sortOrder === "desce" ? "▲" : "▼"}</span>
                      </th>
                    )}
                    {isColumnVisible("name") && (
                      <th className="px-4 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm border-y-2 border-gray-300 text-left">
                        Customer Name
                      </th>
                    )}
                    {isColumnVisible("office_business_name") && (
                      <th className="px-4 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm border-y-2 border-gray-300 text-left">
                        Business Name
                      </th>
                    )}
                    {isColumnVisible("phone") && (
                      <th className="px-4 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm border-y-2 border-gray-300 text-left">
                        Mobile Number
                      </th>
                    )}
                    {isColumnVisible("address") && (
                      <th className="px-4 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm border-y-2 border-gray-300 text-left">
                        Address
                      </th>
                    )}
                    {isColumnVisible("leadSource") && (
                      <th className="px-4 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm border-y-2 border-gray-300 text-left">
                        Lead Source
                      </th>
                    )}
                    {isColumnVisible("lead_status") && (
                      <th className="px-4 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm border-y-2 border-gray-300 text-left">
                        Lead Status
                      </th>
                    )}
                    {isColumnVisible("next_follow_date_time") && (
                      <th className="px-4 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm border-y-2 border-gray-300 text-left">
                        Next Follow Date Time
                      </th>
                    )}
                    {isColumnVisible("remark") && (
                      <th className="px-4 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm border-y-2 border-gray-300 text-left">
                        Remark
                      </th>
                    )}
                    {isColumnVisible("interested_follow_up") && (
                      <th className="px-4 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm border-y-2 border-gray-300 text-left">
                        Interested Follow-up
                      </th>
                    )}
                    {isColumnVisible("assignedTo") && (
                      <th className="px-4 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm border-y-2 border-gray-300 text-left">
                        Assigned To
                      </th>
                    )}
                    {isColumnVisible("created_by_name") && (
                      <th className="px-4 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm border-y-2 border-gray-300 text-left">
                        Created By
                      </th>
                    )}
                    {isColumnVisible("action") && (
                      <th className="px-4 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm border-y-2 border-gray-300 text-left">
                        Action
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {currentLeads.length === 0 ? (
                    <tr>
                      <td
                        colSpan={visibleColumns.length}
                        className="px-6 py-4 border-b border-gray-200 text-center text-gray-500"
                      >
                        No data found
                      </td>
                    </tr>
                  ) : (
                    currentLeads.map((lead, index) => {
                      return (
                        <tr
                          key={index}
                          className={index % 2 === 0 ? "bg-gray-100" : ""}
                        >
                          {isColumnVisible("s_no") && (
                            <td className="px-4 py-3 border-b border-gray-200 text-gray-700">
                              {leadsPerPage === Infinity
                                ? index + 1
                                : index + 1 + currentPage * leadsPerPage}
                            </td>
                          )}
                          {isColumnVisible("lead_id") && (
                            <td className="px-4 py-3 border-b border-gray-200 text-cyan-600 font-semibold">
                              <Link to={`/lead-single-data/${lead.lead_id}`} className="hover:underline">
                                {lead.lead_id}
                              </Link>
                            </td>
                          )}
                          {isColumnVisible("calling_date") && (
                            <td className="px-4 py-3 border-b border-gray-200 text-gray-700 font-medium">
                              {formatDate(lead.calling_date || lead.actual_date || lead.createdTime)}
                            </td>
                          )}
                          {isColumnVisible("name") && (
                            <td className="px-4 py-3 border-b border-gray-200 text-gray-800 font-semibold text-wrap">
                              {lead.name || lead.customer_name || "-"}
                            </td>
                          )}
                          {isColumnVisible("office_business_name") && (
                            <td className="px-4 py-3 border-b border-gray-200 text-gray-700 font-medium">
                              {lead.office_business_name || lead.business_name || "-"}
                            </td>
                          )}
                          {isColumnVisible("phone") && (
                            <td className="px-4 py-3 border-b border-gray-200 text-gray-700 font-semibold">
                              <a href={`tel:${lead.phone}`} className="text-cyan-600 hover:underline">
                                {lead.phone || "-"}
                              </a>
                            </td>
                          )}
                          {isColumnVisible("address") && (
                            <td className="px-4 py-3 border-b border-gray-200 text-gray-700 max-w-[200px] truncate" title={lead.address}>
                              {lead.address || "-"}
                            </td>
                          )}
                          {isColumnVisible("leadSource") && (
                            <td className="px-4 py-3 border-b border-gray-200 font-medium">
                              <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 border text-gray-700">
                                {lead.leadSource || "-"}
                              </span>
                            </td>
                          )}
                          {isColumnVisible("lead_status") && (
                            <td className="px-4 py-3 border-b border-gray-200 font-medium">
                              <span className="px-2 py-0.5 rounded-full text-xs bg-cyan-50 border border-cyan-200 text-cyan-700 font-semibold">
                                {lead.lead_status || "Pending"}
                              </span>
                            </td>
                          )}
                          {isColumnVisible("next_follow_date_time") && (
                            <td className="px-4 py-3 border-b border-gray-200 text-gray-700 font-medium">
                              {formatDateTime(lead.next_follow_date_time || lead.visit_time)}
                            </td>
                          )}
                          {isColumnVisible("remark") && (
                            <td className="px-4 py-3 border-b border-gray-200 text-gray-700 max-w-[200px] truncate" title={lead.remark || lead.lead_review}>
                              {lead.remark || lead.lead_review || "-"}
                            </td>
                          )}
                          {isColumnVisible("interested_follow_up") && (
                            <td className="px-4 py-3 border-b border-gray-200 font-medium">
                              {lead.interested_follow_up ? (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-amber-50 border border-amber-200 text-amber-800 font-medium">
                                  {lead.interested_follow_up}
                                </span>
                              ) : "-"}
                            </td>
                          )}
                          {isColumnVisible("assignedTo") && (
                            <td className="px-4 py-3 border-b border-gray-200 text-gray-700 font-medium">
                              {lead.assignees && lead.assignees.length > 0 ? (
                                <div className="flex flex-wrap gap-1 max-w-xs">
                                  {lead.assignees.map((a) => (
                                    <span
                                      key={a.staff_id}
                                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                                        a.access_type === "shared"
                                          ? "bg-purple-100 text-purple-800 border border-purple-200"
                                          : "bg-cyan-100 text-cyan-800 border border-cyan-200"
                                      }`}
                                      title={`${a.staff_name} (${a.access_type})`}
                                    >
                                      {a.access_type === "shared" ? "🔗" : "👤"}{" "}
                                      {a.staff_name}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                lead.staff_name || "-"
                              )}
                            </td>
                          )}
                          {isColumnVisible("created_by_name") && (
                            <td className="px-4 py-3 border-b border-gray-200 text-gray-700 font-medium">
                              {lead.created_by_name ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                  👤 {lead.created_by_name}
                                  <span className="ml-1 text-[10px] text-gray-500">
                                    ({lead.created_by_role || "staff"})
                                  </span>
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>
                          )}
                          {isColumnVisible("action") && (
                            <td className="px-6 py-4 border-b border-gray-200 text-gray-800 font-semibold text-nowrap">
                              {lead.unit_status === "sold" ||
                                lead.lead_status === "Sold" ? (
                                <>
                                  <button
                                    className="text-gray-500"
                                    disabled
                                  // onClick={() => handleEditClick(lead)}
                                  >
                                    <BsPencilSquare size={20} />
                                  </button>
                                  <button
                                    className="text-gray-500 mx-2"
                                    disabled
                                  // onClick={() =>
                                  //   handleDeleteClick(lead.lead_id)
                                  // }
                                  >
                                    <BsTrash size={20} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    className="text-cyan-500 hover:text-cyan-700"
                                    onClick={() => handleEditClick(lead)}
                                  >
                                    <BsPencilSquare size={20} />
                                  </button>
                                  <button
                                    className="text-red-500 hover:text-red-700 mx-2"
                                    onClick={() =>
                                      handleDeleteClick(lead.lead_id)
                                    }
                                  >
                                    <BsTrash size={20} />
                                  </button>
                                </>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="2xl:w-[89%] mt-4 mb-3 flex justify-center">
              <ReactPaginate
                previousLabel={"Previous"}
                nextLabel={"Next"}
                breakLabel={"..."}
                pageCount={pageCount}
                forcePage={currentPage}
                marginPagesDisplayed={2}
                pageRangeDisplayed={3}
                onPageChange={handlePageClick}
                containerClassName={"pagination"}
                activeClassName={"active"}
                pageClassName={"page-item"}
                pageLinkClassName={"page-link"}
                previousClassName={"page-item"}
                nextClassName={"page-item"}
                previousLinkClassName={"page-link"}
                nextLinkClassName={"page-link"}
                breakClassName={"page-item"}
                breakLinkClassName={"page-link"}
              />
            </div>
          </div>
        </div>
      </div>
      <AdminEditLeadPopup
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        employees={employees}
        errors={errors}
        combinedLeadSources={combinedLeadSources}
        projectunit={projectunit}
        projects={projects}
        fetchProjectsUnit={fetchProjectsUnit}
        fetchLeads={fetchLeads}
        isEditing={isEditing}
        currentLeads={currentLeads}
        selectedLead={selectedLead}
        setIsEditing={setIsEditing}
      />
    </>
  );
}

export default AdminLeadsContent;
