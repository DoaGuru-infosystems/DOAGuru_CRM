import React, { useState, useEffect } from "react";
import moment from "moment-timezone";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import ReactPaginate from "react-paginate";
import { FaDatabase } from "react-icons/fa";
import SuperAdminEditLeadPopup from "../../adiComponent/Super-Admin/SuperAdminEditLeadPopup";
import BulkLeadUploadPopup from "../../pages/superAdmin/popupWindows/BulkLeadUploadPopup";
import ColumnCustomizer from "../common/ColumnCustomizer";
import useColumnPreferences from "../common/useColumnPreferences";
import { formatDate, formatDateTime, formatCreatedDateTime } from "../../utils/dateUtils";
import * as XLSX from "xlsx";
import { BiExport } from "react-icons/bi";

const EMPLOYEE_LEAD_COLUMNS = [
  { key: "s_no", label: "S.no" },
  { key: "lead_id", label: "Lead ID" },
  { key: "access_type", label: "My Role" },
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
  { key: "created_by_name", label: "Created By" },
  { key: "action", label: "Action", locked: true },
  { key: "delete", label: "Delete" },
];

const EmployeeLeadContent = ({ isSidebarOpen }) => {
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [leadSourceFilter, setLeadSourceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [visitFilter, setVisitFilter] = useState("");
  const [dealFilter, setDealFilter] = useState("");
  // HIDDEN (IT/DM CRM): Unit Sold filter state
  // const [soldunitFilter, setSoldUnitFilter] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] = useState("");
  const [leadnotInterestedStatusFilter, setLeadnotInterestedStatusFilter] =
    useState("");
  const [meetingStatusFilter, setMeetingStatusFilter] = useState("");
  const [visitmonthFilter, setVisitMonthFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("desce");
  const [currentPage, setCurrentPage] = useState(0);
  const [leadsPerPage, setLeadsPerPage] = useState(10);
  const [visitStatusFilter, setVisitStatusFilter] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedLead, setSelectedLead] = useState();
  const [shareLead, setShareLead] = useState(null);
  const [selectedShareStaff, setSelectedShareStaff] = useState([]);
  const [sharingLoading, setSharingLoading] = useState(false);
  const [showSharedModal, setShowSharedModal] = useState(false);
  const [sharedByMeList, setSharedByMeList] = useState([]);
  const [loadingSharedByMe, setLoadingSharedByMe] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [columnSearchValues, setColumnSearchValues] = useState({
    lead_id: "",
    name: "",
    phone: "",
    leadSource: "",
    primary_status: "",
    lead_status: ""
  });
  const [activeSearchCol, setActiveSearchCol] = useState("");

  const navigate = useNavigate();
  const EmpId = useSelector((state) => state.auth.user);

  const {
    visibleColumns,
    toggleColumn,
    resetToDefault,
    isColumnVisible,
  } = useColumnPreferences("employee_leads", EMPLOYEE_LEAD_COLUMNS, EmpId);
  console.log(EmpId);

  const token = EmpId?.token;
  const uniqueYears = [
    ...new Set(leads.map((lead) => moment(lead.createdTime).format("YYYY"))),
  ];

  const handleCreateClick = () => {
    setIsEditing(false);
    setShowPopup(true);
  };

  const monthOrder = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const uniqueMonth = [
    ...new Set(
      leads
        .filter(
          (lead) => moment(lead.createdTime).format("YYYY") === yearFilter
        )
        .map((lead) => moment(lead.createdTime).format("MMMM"))
    ),
  ].sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));

  const uniqueVisitMonth = [
    ...new Set(
      leads
        .filter(
          (lead) =>
            lead.visit !== "pending" &&
            lead.visit_date &&
            moment(lead.visit_date, moment.ISO_8601, true).isValid()
        )
        .map((lead) => moment(lead.visit_date).format("MMMM"))
    ),
  ].sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));

  useEffect(() => {
    fetchLeads();
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [searchTerm, filterDate, leadSourceFilter, /* soldunitFilter, */ visitStatusFilter, activeTab]);

  const fetchLeads = async () => {
    try {
      const response = await axios.get(
        `http://localhost:9000/api/employe-leads/${EmpId?.staff_id}`,
        {
          params: {
            search: searchTerm || undefined,
            filterDate: filterDate || undefined,
            leadSource: leadSourceFilter || undefined,
            // HIDDEN (IT/DM CRM): Unit Sold param
            // unitStatus: soldunitFilter || undefined,
            visitStatus: visitStatusFilter || undefined,
            activeTab: activeTab !== "all" ? activeTab : undefined,
          },
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

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(
        `http://localhost:9000/api/getEmployeeByOrg/${EmpId?.staff_org_id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setEmployees(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const handleShareSubmit = async (e) => {
    e.preventDefault();
    if (!selectedShareStaff || selectedShareStaff.length === 0) {
      toast.error("Please select at least one colleague to share with");
      return;
    }
    if (!shareLead) return;

    setSharingLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:9000/api/leads/share",
        {
          leadIds: [shareLead.lead_id],
          staffIds: selectedShareStaff,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.success) {
        toast.success(
          response.data.message ||
          `Shared with ${response.data.sharedCount} colleague(s)`
        );
        setShareLead(null);
        setSelectedShareStaff([]);
        fetchLeads();
      } else {
        toast.error(response.data.message || "Failed to share lead");
      }
    } catch (error) {
      console.error("Error sharing lead:", error);
      toast.error(error.response?.data?.message || "Failed to share lead");
    } finally {
      setSharingLoading(false);
    }
  };

  const fetchSharedByMe = async () => {
    setLoadingSharedByMe(true);
    try {
      const response = await axios.get(
        "http://localhost:9000/api/leads/shared-by-me",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSharedByMeList(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      console.error("Error fetching shared leads:", error);
      toast.error(error.response?.data?.message || "Failed to load shared leads");
    } finally {
      setLoadingSharedByMe(false);
    }
  };

  const handleRevokeShare = async (leadId, staffId) => {
    try {
      const response = await axios.delete(
        `http://localhost:9000/api/leads/share/${leadId}/${staffId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.success) {
        toast.success("Share access revoked successfully");
        fetchSharedByMe();
        fetchLeads();
      } else {
        toast.error(response.data.message || "Failed to revoke share access");
      }
    } catch (error) {
      console.error("Error revoking share:", error);
      toast.error(error.response?.data?.message || "Failed to revoke share access");
    }
  };

  const handleUpdate = async (lead) => {
  try {
    const response = await axios.put(
      `http://localhost:9000/api/updateOnlyLeadStatus/${lead.lead_id}`,
      { lead_status: "active lead" },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 200) {
      toast.success("Lead status updated successfully");
      navigate(`/employee-lead-single-data/general/${lead.lead_id}`);
    } else {
      toast.error("Failed to update the lead status.");
    }
  } catch (error) {
    toast.error("Failed to update the lead status.");
  }
};

const handlePrimaryStatusChange = async (leadId, newStatus) => {
  try {
    const response = await axios.put(
      `http://localhost:9000/api/updateOnlyPrimaryStatus/${leadId}`,
      { primary_status: newStatus },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 200) {
      toast.success("Primary status updated successfully");
      setLeads((prevLeads) =>
        prevLeads.map((lead) =>
          lead.lead_id === leadId ? { ...lead, primary_status: newStatus } : lead
        )
      );
    } else {
      toast.error("Failed to update status.");
    }
  } catch (error) {
    console.error("Error updating primary status:", error);
    toast.error("Error updating status.");
  }
};

const handleDeleteLead = async (leadId) => {
  if (!window.confirm("Are you sure you want to delete this lead?")) {
    return;
  }
  try {
    const response = await axios.delete(
      `http://localhost:9000/api/leads/${leadId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 200) {
      toast.success("Lead successfully deleted");
      setLeads((prevLeads) => prevLeads.filter((lead) => lead.lead_id !== leadId));
    } else {
      toast.error("Failed to delete the lead.");
    }
  } catch (error) {
    console.error("Error deleting lead:", error);
    toast.error("Failed to delete the lead.");
  }
};

const applyFilters = () => {
  let filtered = [...leads];

  // Filter by active tab
  if (activeTab === "today") {
    const todayStr = moment().format("YYYY-MM-DD");
    filtered = filtered.filter(
      (lead) =>
        lead.deal_status !== "close" &&
        moment(lead.createdTime).format("YYYY-MM-DD") === todayStr
    );
  } else if (activeTab === "past") {
    const todayStr = moment().format("YYYY-MM-DD");
    filtered = filtered.filter(
      (lead) =>
        lead.deal_status !== "close" &&
        moment(lead.createdTime).format("YYYY-MM-DD") < todayStr
    );
  } else if (activeTab === "upcoming") {
    const todayStr = moment().format("YYYY-MM-DD");
    filtered = filtered.filter(
      (lead) =>
        lead.deal_status !== "close" &&
        moment(lead.createdTime).format("YYYY-MM-DD") > todayStr
    );
  } else if (activeTab === "completed") {
    filtered = filtered.filter((lead) => lead.deal_status === "close");
  } else if (activeTab === "visitScheduled") {
    filtered = filtered.filter(
      (lead) => lead.primary_status === "Site visit schedule"
    );
  } else if (activeTab === "visitDone") {
    filtered = filtered.filter(
      (lead) => lead.primary_status === "visit done"
    );
  } else if (activeTab === "visitPending") {
    filtered = filtered.filter(
      (lead) =>
        !lead.primary_status ||
        ["new leads", "Intrested", "pending"].includes(lead.primary_status)
    );
  }

  // Sort by date
  filtered = filtered.sort((a, b) => {
    if (sortOrder === "desce") {
      return new Date(b.createdTime) - new Date(a.createdTime);
    } else {
      return new Date(a.createdTime) - new Date(b.createdTime);
    }
  });

  // Filter by search term
  if (searchTerm) {
    const trimmedSearchTerm = searchTerm.toLowerCase().trim();
    filtered = filtered.filter((lead) =>
      ["name", "leadSource", "phone", "staff_name"].some(
        (key) => lead[key]?.toLowerCase().trim().includes(trimmedSearchTerm)
      )
    );
  }

  // Filter by column-specific search terms
  Object.keys(columnSearchValues).forEach((key) => {
    const val = columnSearchValues[key];
    if (val) {
      const trimmedVal = val.toLowerCase().trim();
      filtered = filtered.filter((lead) => {
        if (key === "lead_id") {
          return String(lead.lead_id).includes(trimmedVal);
        }
        if (key === "primary_status") {
          const leadStatusVal = (lead.primary_status || "new leads").toLowerCase().trim();
          return leadStatusVal.includes(trimmedVal);
        }
        const leadVal = (lead[key] || "").toLowerCase().trim();
        return leadVal.includes(trimmedVal);
      });
    }
  });

  // Filter by date range
  if (filterDate) {
    filtered = filtered.filter((lead) => {
      const leadDate = moment(lead.createdTime).format("YYYY-MM-DD");
      return leadDate === filterDate;
    });
  }

  // Filter by lead source
  if (leadSourceFilter) {
    filtered = filtered.filter(
      (lead) => lead.leadSource === leadSourceFilter
    );
  }

  // Filter by Visit Status
  if (visitStatusFilter) {
    const sf = visitStatusFilter.toLowerCase().trim();
    filtered = filtered.filter((lead) => {
      const st = (lead.primary_status || "new leads").toLowerCase().trim();
      if (sf === "new leads" || sf === "newlead") {
        return st === "new leads" || st === "newlead";
      }
      if (sf === "intrested" || sf === "interested") {
        return st === "intrested" || st === "interested";
      }
      if (sf === "site visit schedule" || sf === "site visite schedule") {
        return st === "site visit schedule" || st === "site visite schedule";
      }
      if (sf === "visit done" || sf === "site visit done" || sf === "site visite done") {
        return st === "visit done" || st === "site visit done" || st === "site visite done";
      }
      if (sf === "deal close" || sf === "deal closed") {
        return st === "deal close" || st === "deal closed";
      }
      if (sf === "deal cancel" || sf === "deal cancell" || sf === "deal cancelled") {
        return st === "deal cancel" || st === "deal cancell" || st === "deal cancelled";
      }
      if (sf === "dead deal" || sf === "dead lead") {
        return st === "dead deal" || st === "dead lead";
      }
      return st === sf;
    });
  }

  // Filter by status
  if (statusFilter) {
    filtered = filtered.filter((lead) => lead.status === statusFilter);
  }

  // Filter by deal
  if (dealFilter) {
    filtered = filtered.filter((lead) => lead.deal_status === dealFilter);
  }

  // Filter by lead status
  if (leadStatusFilter) {
    filtered = filtered.filter(
      (lead) => lead.lead_status === leadStatusFilter
    );
  }

  // Filter by not interested reason
  if (leadnotInterestedStatusFilter) {
    if (leadnotInterestedStatusFilter === "other") {
      filtered = filtered.filter(
        (lead) => !["price", "budget", "distance"].includes(lead.reason)
      );
    } else {
      filtered = filtered.filter(
        (lead) => lead.reason === leadnotInterestedStatusFilter
      );
    }
  }

  // Filter by visit
  if (visitFilter) {
    filtered = filtered.filter((lead) => lead.visit === visitFilter);
  }

  // Filter by meeting status
  if (meetingStatusFilter) {
    filtered = filtered.filter(
      (lead) => lead.meeting_status === meetingStatusFilter
    );
  }

  // HIDDEN (IT/DM CRM): Unit Sold filter logic
  // if (soldunitFilter) {
  //   filtered = filtered.filter((lead) => lead.unit_status === soldunitFilter);
  // }

  if (monthFilter) {
    filtered = filtered.filter((lead) => {
      const leadMonth = moment(lead.createdTime).format("MMMM");
      return leadMonth === monthFilter;
    });
  }
  if (yearFilter) {
    filtered = filtered.filter((lead) => {
      const leadYear = moment(lead.createdTime).format("YYYY");
      return leadYear === yearFilter;
    });
  }

  if (visitmonthFilter) {
    filtered = filtered.filter((lead) => {
      const visitleadMonth = moment(lead.visit_date).format("MMMM");
      return visitleadMonth === visitmonthFilter;
    });
  }

  return filtered;
};

useEffect(() => {
  const filtered = applyFilters();
  setFilteredLeads(filtered);
  setCurrentPage(0);
}, [
  searchTerm,
  filterDate,
  leads,
  leadSourceFilter,
  statusFilter,
  visitFilter,
  dealFilter,
  leadStatusFilter,
  leadnotInterestedStatusFilter,
  meetingStatusFilter,
  // HIDDEN (IT/DM CRM): Unit Sold dependency
  // soldunitFilter,
  visitStatusFilter,
  monthFilter,
  yearFilter,
  visitmonthFilter,
  sortOrder,
  activeTab,
  columnSearchValues,
]);

// Total Leads
const totalLeads = applyFilters().length;

// HIDDEN (IT/DM CRM): Total Closed Leads calculation
// const totalClosedLeads = applyFilters().filter(
//   (lead) => lead.deal_status === "close"
// ).length;

// HIDDEN (IT/DM CRM): Total Visits calculation
// const totalVisits = applyFilters().filter((lead) =>
//   ["fresh", "re-visit", "self", "associative"].includes(lead.visit)
// ).length;

const todayStr = moment().format("YYYY-MM-DD");

const todayCount = leads.filter(
  (lead) =>
    lead.deal_status !== "close" &&
    moment(lead.createdTime).format("YYYY-MM-DD") === todayStr
).length;

const pastCount = leads.filter(
  (lead) =>
    lead.deal_status !== "close" &&
    moment(lead.createdTime).format("YYYY-MM-DD") < todayStr
).length;

const upcomingCount = leads.filter(
  (lead) =>
    lead.deal_status !== "close" &&
    moment(lead.createdTime).format("YYYY-MM-DD") > todayStr
).length;

const completedCount = leads.filter(
  (lead) => lead.deal_status === "close"
).length;

const visitScheduledCount = leads.filter(
  (lead) => lead.primary_status === "Site visit schedule"
).length;

const visitDoneCount = leads.filter(
  (lead) => lead.primary_status === "visit done"
).length;

const visitPendingCount = leads.filter(
  (lead) =>
    !lead.primary_status ||
    ["new leads", "Intrested", "pending"].includes(lead.primary_status)
).length;

const allCount = leads.length;

// Use filteredLeads for pagination
const indexOfLastLead = (currentPage + 1) * leadsPerPage;
const indexOfFirstLead = indexOfLastLead - leadsPerPage;
const currentLeads =
  leadsPerPage === Infinity
    ? filteredLeads
    : filteredLeads.slice(indexOfFirstLead, indexOfLastLead);
const pageCount = Math.ceil(filteredLeads.length / leadsPerPage);

const handlePageClick = (data) => {
  setCurrentPage(data.selected);
};
const handleLeadsPerPageChange = (e) => {
  const value = e.target.value;
  setLeadsPerPage(value === "All" ? Infinity : parseInt(value, 10));
  setCurrentPage(0); // Reset to the first page
};
const toggleSortOrder = () => {
  setSortOrder((prevOrder) => (prevOrder === "desce" ? "asce" : "desce"));
};

const handleReset = () => {
  // window.location.reload();
  setSearchTerm("");
  setFilterDate("");
  setLeadSourceFilter("");
  setStatusFilter("");
  setVisitFilter("");
  setDealFilter("");
  setLeadStatusFilter("");
  setLeadnotInterestedStatusFilter("");
  setMeetingStatusFilter("");
  // HIDDEN (IT/DM CRM): Unit Sold filter reset
  // setSoldUnitFilter("");
  setVisitStatusFilter("");
  setMonthFilter("");
  setYearFilter("");
  setVisitMonthFilter("");
  setSortOrder("desce");
  setActiveTab("all");
  fetchLeads();
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
    if (isColumnVisible("access_type")) {
      row["My Role"] =
        Number(lead.created_by) === Number(EmpId?.staff_id)
          ? "Creator"
          : lead.assignees?.some(
            (a) =>
              Number(a.staff_id) === Number(EmpId?.staff_id) &&
              a.access_type === "shared"
          )
            ? "Shared"
            : "Assigned";
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
    if (isColumnVisible("created_by_name")) {
      row["Created By"] = lead.created_by_name
        ? `${lead.created_by_name} (${lead.created_by_role || "staff"})`
        : "-";
    }
    if (isColumnVisible("assignedTo")) {
      row["Assigned To"] = lead.staff_name || "-";
    }
    row["Created Date"] = formatCreatedDateTime(lead.createdTime);

    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

  XLSX.writeFile(
    workbook,
    `Employee_Leads_${moment().format("YYYY-MM-DD_HH-mm")}.xlsx`
  );
};

return (
  <>
    <div className="flex mt-20 w-full max-w-full overflow-x-hidden">
      <div className="w-full min-h-screen bg-[#F9FAFF] p-2 sm:p-4">
        <div className="flex flex-col overflow-x-hidden">
          <div className="flex-grow p-1 sm:p-4 mt-0 lg:mt-2 sm:ml-0">
            {/* Header Title Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                  Assigned Employee Leads
                </h1>
                <p className="text-xs text-neutral-500 font-medium mt-0.5">
                  Manage and track all assigned leads and customer interactions
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={() => setShowBulkModal(true)}
                  className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-3.5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition-all hover:shadow-sm"
                >
                  <span>📥</span> Bulk Upload
                </button>
                <button
                  onClick={() => {
                    setShowSharedModal(true);
                    fetchSharedByMe();
                  }}
                  className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-3.5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition-all hover:shadow-sm"
                >
                  <span>🔗</span> Shared by Me
                </button>
                <button
                  className="bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all hover:shadow-md"
                  onClick={handleCreateClick}
                >
                  <span className="text-base leading-none">+</span> Add Lead
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 gap-y-2 sm:gap-y-3 mb-4">
              {/* Search */}
              <div className="col-span-12 sm:col-span-4">
                <label className="block mb-1 text-xs sm:text-sm font-semibold text-gray-700">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Name, Lead Source, Assigned To, Phone No"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`border rounded p-1.5 sm:p-2 text-xs sm:text-sm w-full focus:outline-none transition-colors duration-200 ${searchTerm ? "bg-cyan-600 text-white" : "bg-white"
                    }`}
                />
              </div>

              {/* Assigned Date */}
              <div className="col-span-12 sm:col-span-2">
                <label className="block mb-1 text-xs sm:text-sm font-semibold text-gray-700">
                  Filtered Assigned Date
                </label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className={`border rounded p-1.5 sm:p-2 text-xs sm:text-sm w-full focus:outline-none transition-colors duration-200 ${filterDate ? "bg-cyan-600 text-white" : "bg-white"
                    }`}
                />
              </div>

              {/* Lead Source */}
              <div className="col-span-12 sm:col-span-2">
                <label className="block mb-1 text-xs sm:text-sm font-semibold text-gray-700">
                  Lead Source Filter
                </label>
                <select
                  value={leadSourceFilter}
                  onChange={(e) => setLeadSourceFilter(e.target.value)}
                  className={`border rounded p-1.5 sm:p-2 text-xs sm:text-sm w-full focus:outline-none transition-colors duration-200 ${leadSourceFilter ? "bg-cyan-600 text-white" : "bg-white"
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
                  <option value="SEO">Search Engine Optimization</option>
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

              {/* HIDDEN (IT/DM CRM): Unit Sold Filter */}
              {/* <div className="col-span-12 sm:col-span-2">
                  <label className="block mb-1 text-xs sm:text-sm font-semibold text-gray-700">
                    Unit Sold Filter
                  </label>
                  <select
                    value={soldunitFilter}
                    onChange={(e) => setSoldUnitFilter(e.target.value)}
                    className={`border rounded p-1.5 sm:p-2 text-xs sm:text-sm w-full focus:outline-none transition-colors duration-200 ${soldunitFilter ? "bg-cyan-600 text-white" : "bg-white"
                      }`}
                  >
                    <option value="">All Deal</option>
                    <option value="sold">Sold</option>
                    <option value="available">Available</option>
                  </select>
                </div> */}

              {/* Visit Status Filter */}
              <div className="col-span-12 sm:col-span-2">
                <label className="block mb-1 text-xs sm:text-sm font-semibold text-gray-700">
                  Visit Status Filter
                </label>
                <select
                  value={visitStatusFilter}
                  onChange={(e) => setVisitStatusFilter(e.target.value)}
                  className={`border rounded p-1.5 sm:p-2 text-xs sm:text-sm w-full focus:outline-none transition-colors duration-200 ${visitStatusFilter ? "bg-cyan-600 text-white" : "bg-white"
                    }`}
                >
                  <option value="">Select Visit Status</option>
                  <option value="new leads">New Lead</option>
                  <option value="Intrested">Interested</option>
                  <option value="Site visit schedule">Site Visit Schedule</option>
                  <option value="visit done">Site Visit Done</option>
                  <option value="Deal close">Deal Close</option>
                  <option value="Deal cancel">Deal Cancel</option>
                  <option value="Dead deal">Dead Lead</option>
                </select>
              </div>

              {/* Reset Button */}
              <div className="col-span-12 sm:col-span-2 flex items-end">
                <button
                  onClick={handleReset}
                  className="bg-cyan-600 text-white py-1.5 sm:py-2 px-3 sm:px-4 text-xs sm:text-sm rounded hover:bg-cyan-700 transition-colors w-full sm:w-auto font-medium"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Custom Lead Categories Tabs */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-4 sm:mt-6 mb-4 border-b border-gray-200 pb-3">
              {[
                { id: "today", label: "New Lead", count: todayCount },
                { id: "past", label: "Past Leads", count: pastCount },
                { id: "upcoming", label: "Upcoming Leads", count: upcomingCount },
                { id: "completed", label: "Completed Leads", count: completedCount },
                { id: "visitScheduled", label: "Visit Scheduled", count: visitScheduledCount },
                { id: "visitDone", label: "Visit Done", count: visitDoneCount },
                { id: "visitPending", label: "Visit Pending", count: visitPendingCount },
                { id: "all", label: "All Leads", count: allCount },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1 sm:py-2 text-[10px] sm:text-sm font-semibold rounded-lg border transition-all duration-200 ${isActive
                      ? "bg-cyan-600 text-white border-cyan-600 shadow-sm scale-105"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                      }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.5 text-[9px] sm:text-xs font-bold rounded-full transition-colors duration-200 ${isActive ? "bg-white text-cyan-700" : "bg-gray-100 text-gray-600"
                        }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6 my-3 mt-5">
              {/* Stats Section */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
                <span className="bg-cyan-50 border border-cyan-200 text-cyan-700 text-[10px] sm:text-sm px-2.5 py-1 rounded-full font-semibold shadow-sm">
                  Total Leads: <span className="font-bold">{totalLeads}</span>
                </span>
                {/* HIDDEN (IT/DM CRM): Total Site Visit badge */}
                {/* <span className="bg-orange-50 border border-orange-200 text-orange-700 text-[10px] sm:text-sm px-2.5 py-1 rounded-full font-semibold shadow-sm">
                    Total Site Visit: <span className="font-bold">{totalVisits}</span>
                  </span> */}
                {/* HIDDEN (IT/DM CRM): Total Closed Leads badge */}
                {/* <span className="bg-green-50 border border-green-200 text-green-700 text-[10px] sm:text-sm px-2.5 py-1 rounded-full font-semibold shadow-sm">
                    Total Closed Leads: <span className="font-bold">{totalClosedLeads}</span>
                  </span> */}
              </div>

              {/* Dropdown & Columns Customizer */}
              <div className="flex items-center gap-2 w-auto">
                <button
                  className="bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 flex gap-2 items-center cursor-pointer text-xs sm:text-sm font-medium"
                  onClick={handleExportToExcel}
                >
                  <BiExport /> Export Leads
                </button>
                <ColumnCustomizer
                  columns={EMPLOYEE_LEAD_COLUMNS}
                  visibleColumns={visibleColumns}
                  toggleColumn={toggleColumn}
                  resetToDefault={resetToDefault}
                />
                <span className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
                  Number of rows:
                </span>
                <select
                  onChange={handleLeadsPerPageChange}
                  className="border border-cyan-600 rounded text-xs sm:text-sm text-gray-600 p-1 sm:p-1.5 w-20 sm:w-28 bg-white"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value="All">All</option>
                </select>
              </div>
            </div>

            <div className={`w-auto overflow-x-auto`}>
              <table
                className={`${isSidebarOpen ? "w-[78rem]" : "w-[86rem]"
                  } overflow-x-auto`}
              >
                <thead className="bg-gray-200">
                  <tr>
                    {isColumnVisible("s_no") && (
                      <th className="px-2 sm:px-4 py-2 text-xs sm:text-sm border-y-2 border-gray-300 text-left text-gray-700 whitespace-nowrap">
                        S.no
                      </th>
                    )}
                    {isColumnVisible("lead_id") && (
                      <th className="px-2 sm:px-4 py-2 text-xs sm:text-sm border-y-2 border-gray-300 text-left text-gray-700 whitespace-nowrap">
                        Lead ID
                      </th>
                    )}
                    {isColumnVisible("access_type") && (
                      <th className="px-2 sm:px-4 py-2 text-xs sm:text-sm border-y-2 border-gray-300 text-left text-gray-700 whitespace-nowrap">
                        My Role
                      </th>
                    )}
                    {isColumnVisible("calling_date") && (
                      <th className="px-2 sm:px-4 py-2 text-xs sm:text-sm border-y-2 border-gray-300 text-left text-gray-700 whitespace-nowrap cursor-pointer" onClick={toggleSortOrder}>
                        Calling Date
                        <span className="text-cyan-900 mx-1 text-xs">{sortOrder === "desce" ? "▲" : "▼"}</span>
                      </th>
                    )}
                    {isColumnVisible("name") && (
                      <th className="px-2 sm:px-4 py-2 text-xs sm:text-sm border-y-2 border-gray-300 text-left text-gray-700 whitespace-nowrap">
                        Customer Name
                      </th>
                    )}
                    {isColumnVisible("office_business_name") && (
                      <th className="px-2 sm:px-4 py-2 text-xs sm:text-sm border-y-2 border-gray-300 text-left text-gray-700 whitespace-nowrap">
                        Business Name
                      </th>
                    )}
                    {isColumnVisible("phone") && (
                      <th className="px-2 sm:px-4 py-2 text-xs sm:text-sm border-y-2 border-gray-300 text-left text-gray-700 whitespace-nowrap">
                        Mobile Number
                      </th>
                    )}
                    {isColumnVisible("address") && (
                      <th className="px-2 sm:px-4 py-2 text-xs sm:text-sm border-y-2 border-gray-300 text-left text-gray-700 whitespace-nowrap">
                        Address
                      </th>
                    )}
                    {isColumnVisible("leadSource") && (
                      <th className="px-2 sm:px-4 py-2 text-xs sm:text-sm border-y-2 border-gray-300 text-left text-gray-700 whitespace-nowrap">
                        Lead Source
                      </th>
                    )}
                    {isColumnVisible("lead_status") && (
                      <th className="px-2 sm:px-4 py-2 text-xs sm:text-sm border-y-2 border-gray-300 text-left text-gray-700 whitespace-nowrap">
                        Lead Status
                      </th>
                    )}
                    {isColumnVisible("next_follow_date_time") && (
                      <th className="px-2 sm:px-4 py-2 text-xs sm:text-sm border-y-2 border-gray-300 text-left text-gray-700 whitespace-nowrap">
                        Next Follow Date Time
                      </th>
                    )}
                    {isColumnVisible("remark") && (
                      <th className="px-2 sm:px-4 py-2 text-xs sm:text-sm border-y-2 border-gray-300 text-left text-gray-700 whitespace-nowrap">
                        Remark
                      </th>
                    )}
                    {isColumnVisible("interested_follow_up") && (
                      <th className="px-2 sm:px-4 py-2 text-xs sm:text-sm border-y-2 border-gray-300 text-left text-gray-700 whitespace-nowrap">
                        Interested Follow-up
                      </th>
                    )}
                    {isColumnVisible("created_by_name") && (
                      <th className="px-2 sm:px-4 py-2 text-xs sm:text-sm border-y-2 border-gray-300 text-left text-gray-700 whitespace-nowrap">
                        Created By
                      </th>
                    )}
                    {isColumnVisible("action") && (
                      <th className="px-2 sm:px-4 py-2 text-xs sm:text-sm border-y-2 border-gray-300 text-left text-gray-700 whitespace-nowrap">
                        Action
                      </th>
                    )}
                    {isColumnVisible("delete") && (
                      <th className="px-2 sm:px-4 py-2 text-xs sm:text-sm border-y-2 border-gray-300 text-left text-gray-700 whitespace-nowrap">
                        Delete
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {currentLeads.length > 0 ? (
                    currentLeads.map((lead, index) => (
                      <tr
                        key={lead.id}
                        className={`${index % 2 === 0 ? "bg-gray-100" : ""} `}
                      >
                        {isColumnVisible("s_no") && (
                          <td className="px-2 sm:px-4 py-2 border-b border-gray-200 text-gray-700 font-medium text-xs sm:text-sm">
                            {leadsPerPage === Infinity
                              ? index + 1
                              : index + 1 + currentPage * leadsPerPage}
                          </td>
                        )}
                        {isColumnVisible("lead_id") && (
                          <td className="px-2 sm:px-4 py-2 border-b border-gray-200 font-semibold text-cyan-600 text-xs sm:text-sm">
                            <Link
                              to={`/employee-lead-single-data/general/${lead.lead_id}`}
                              className="hover:underline"
                            >
                              {lead.lead_id}
                            </Link>
                          </td>
                        )}
                        {isColumnVisible("access_type") && (
                          <td className="px-2 sm:px-4 py-2 border-b border-gray-200 text-xs sm:text-sm font-medium">
                            {Number(lead.created_by) === Number(EmpId?.staff_id) ? (
                              <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium">
                                👤 Creator
                              </span>
                            ) : lead.assignees?.some(
                              (a) =>
                                Number(a.staff_id) === Number(EmpId?.staff_id) &&
                                a.access_type === "shared"
                            ) ? (
                              <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800 border border-purple-200 font-medium">
                                🔗 Shared
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 border border-blue-200 font-medium">
                                👤 Assigned
                              </span>
                            )}
                          </td>
                        )}
                        {isColumnVisible("calling_date") && (
                          <td className="px-2 sm:px-4 py-2 border-b border-gray-200 text-gray-700 text-xs sm:text-sm font-medium">
                            {formatDate(lead.calling_date || lead.actual_date || lead.createdTime)}
                          </td>
                        )}
                        {isColumnVisible("name") && (
                          <td className="px-2 sm:px-4 py-2 border-b border-gray-200 font-semibold text-gray-800 text-xs sm:text-sm whitespace-normal break-words">
                            <Link
                              to={`/employee-lead-single-data/general/${lead.lead_id}`}
                              className="hover:underline text-cyan-600"
                            >
                              {lead.name || lead.customer_name || "-"}
                            </Link>
                          </td>
                        )}
                        {isColumnVisible("office_business_name") && (
                          <td className="px-2 sm:px-4 py-2 border-b border-gray-200 text-gray-700 text-xs sm:text-sm font-medium">
                            {lead.office_business_name || lead.business_name || "-"}
                          </td>
                        )}
                        {isColumnVisible("phone") && (
                          <td className="px-2 sm:px-4 py-2 border-b border-gray-200 text-gray-700 text-xs sm:text-sm font-medium">
                            <a
                              href={`tel:${lead.phone}`}
                              className="text-cyan-600 cursor-pointer hover:underline"
                            >
                              {lead.phone || "-"}
                            </a>
                          </td>
                        )}
                        {isColumnVisible("address") && (
                          <td className="px-2 sm:px-4 py-2 border-b border-gray-200 text-gray-700 text-xs sm:text-sm max-w-[180px] truncate" title={lead.address}>
                            {lead.address || "-"}
                          </td>
                        )}
                        {isColumnVisible("leadSource") && (
                          <td className="px-2 sm:px-4 py-2 border-b border-gray-200 text-gray-700 text-xs sm:text-sm font-medium">
                            <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 border text-gray-700">
                              {lead.leadSource || "-"}
                            </span>
                          </td>
                        )}
                        {isColumnVisible("lead_status") && (
                          <td className="px-2 sm:px-4 py-2 border-b border-gray-200 font-medium text-xs sm:text-sm">
                            <span className="px-2 py-0.5 rounded-full text-xs bg-cyan-50 border border-cyan-200 text-cyan-700 font-semibold">
                              {lead.lead_status || "Pending"}
                            </span>
                          </td>
                        )}
                        {isColumnVisible("next_follow_date_time") && (
                          <td className="px-2 sm:px-4 py-2 border-b border-gray-200 text-gray-700 text-xs sm:text-sm font-medium">
                            {formatDateTime(lead.next_follow_date_time || lead.visit_time)}
                          </td>
                        )}
                        {isColumnVisible("remark") && (
                          <td className="px-2 sm:px-4 py-2 border-b border-gray-200 text-gray-700 text-xs sm:text-sm max-w-[180px] truncate" title={lead.remark || lead.lead_review}>
                            {lead.remark || lead.lead_review || "-"}
                          </td>
                        )}
                        {isColumnVisible("interested_follow_up") && (
                          <td className="px-2 sm:px-4 py-2 border-b border-gray-200 font-medium text-xs sm:text-sm">
                            {lead.interested_follow_up ? (
                              <span className="px-2 py-0.5 rounded-full text-xs bg-amber-50 border border-amber-200 text-amber-800 font-medium">
                                {lead.interested_follow_up}
                              </span>
                            ) : "-"}
                          </td>
                        )}
                        {isColumnVisible("created_by_name") && (
                          <td className="px-2 sm:px-4 py-2 border-b border-gray-200 text-gray-700 text-xs sm:text-sm font-medium">
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
                          <td className="px-1 sm:px-4 py-1.5 sm:py-3 border-b border-gray-200 font-semibold whitespace-normal break-words text-[10px] sm:text-xs md:text-sm">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                              <Link
                                to={`/employee-lead-single-data/general/${lead.lead_id}`}
                                className="text-cyan-600 hover:text-cyan-800 transition duration-150"
                              >
                                View Details
                              </Link>
                              {lead.created_by &&
                                Number(lead.created_by) ===
                                Number(EmpId?.staff_id) && (
                                  <>
                                    <span className="hidden sm:inline text-gray-300">
                                      |
                                    </span>
                                    <span
                                      onClick={() => {
                                        setShareLead(lead);
                                        setSelectedShareStaff([]);
                                      }}
                                      className="text-emerald-600 hover:text-emerald-800 transition duration-150 cursor-pointer"
                                    >
                                      Share
                                    </span>
                                  </>
                                )}
                            </div>
                          </td>
                        )}
                        {isColumnVisible("delete") && (
                          <td className="px-1 sm:px-4 py-1.5 sm:py-3 border-b border-gray-200 font-semibold whitespace-normal break-words text-[10px] sm:text-xs md:text-sm">
                            <span
                              onClick={() => handleDeleteLead(lead.lead_id)}
                              className="text-red-500 hover:text-red-700 transition duration-150 cursor-pointer"
                            >
                              Delete
                            </span>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={visibleColumns.length}
                        className="text-center py-4 text-gray-500"
                      >
                        No Data Available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-center">
              <ReactPaginate
                previousLabel={"Previous"}
                nextLabel={"Next"}
                breakLabel={"..."}
                pageCount={pageCount}
                forcePage={currentPage}
                marginPagesDisplayed={2}
                pageRangeDisplayed={3}
                onPageChange={handlePageClick}
                containerClassName={"pagination flex gap-2"}
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
    </div>
    <SuperAdminEditLeadPopup
      isOpen={showPopup}
      onClose={() => setShowPopup(false)}
      employees={employees}
      combinedLeadSources={combinedLeadSources}
      fetchLeads={fetchLeads}
      isEditing={isEditing}
      currentLeads={currentLeads}
      selectedLead={selectedLead}
      setIsEditing={setIsEditing}
      saleUser={EmpId}
    />

    {/* Share Lead Modal */}
    {shareLead && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Share Lead</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Share <span className="font-semibold text-cyan-600">{shareLead.name}</span> (#{shareLead.lead_id}) with colleagues.
              </p>
            </div>
            <button
              onClick={() => setShareLead(null)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 text-lg"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleShareSubmit} className="flex-1 overflow-y-auto py-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Select Colleagues ({selectedShareStaff.length} selected)
              </label>
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-60 overflow-y-auto">
                {employees
                  .filter(
                    (emp) =>
                      Number(emp.staff_id) !== Number(EmpId?.staff_id) &&
                      emp.staff_role === "employee"
                  ).length === 0 ? (
                  <p className="p-4 text-center text-xs text-gray-400">
                    No other employees in your organization to share with.
                  </p>
                ) : (
                  employees
                    .filter(
                      (emp) =>
                        Number(emp.staff_id) !== Number(EmpId?.staff_id) &&
                        emp.staff_role === "employee"
                    )
                    .map((emp) => {
                      const isSelected = selectedShareStaff.includes(
                        Number(emp.staff_id)
                      );
                      return (
                        <label
                          key={emp.staff_id}
                          className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition ${isSelected ? "bg-cyan-50/50" : ""
                            }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                const id = Number(emp.staff_id);
                                setSelectedShareStaff((prev) =>
                                  prev.includes(id)
                                    ? prev.filter((s) => s !== id)
                                    : [...prev, id]
                                );
                              }}
                              className="w-4 h-4 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-800">
                                {emp.staff_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {emp.staff_email || "Employee"}
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <span className="text-xs font-medium text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded">
                              Selected
                            </span>
                          )}
                        </label>
                      );
                    })
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShareLead(null)}
                disabled={sharingLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sharingLoading || selectedShareStaff.length === 0}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
              >
                {sharingLoading
                  ? "Sharing..."
                  : `Share with ${selectedShareStaff.length} Colleague(s)`}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Shared by Me Modal */}
    {showSharedModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-4xl shadow-2xl border border-gray-100 flex flex-col max-h-[85vh]">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>🔗</span> Leads Shared by Me
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Track leads you have shared and revoke access when no longer needed.
              </p>
            </div>
            <button
              onClick={() => setShowSharedModal(false)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 text-lg"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            {loadingSharedByMe ? (
              <p className="text-center py-8 text-sm text-gray-500">
                Loading shared leads...
              </p>
            ) : sharedByMeList.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-sm font-semibold text-gray-700">
                  No leads shared yet
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  When you share leads you created, they will appear here.
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-xs font-semibold text-gray-600">
                      Lead ID
                    </th>
                    <th className="px-3 py-2 text-xs font-semibold text-gray-600">
                      Customer Name
                    </th>
                    <th className="px-3 py-2 text-xs font-semibold text-gray-600">
                      Mobile Number
                    </th>
                    <th className="px-3 py-2 text-xs font-semibold text-gray-600">
                      Shared With
                    </th>
                    <th className="px-3 py-2 text-xs font-semibold text-gray-600">
                      Shared Date
                    </th>
                    <th className="px-3 py-2 text-xs font-semibold text-gray-600 text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {sharedByMeList.map((item, idx) => (
                    <tr
                      key={`${item.lead_id}-${item.shared_with_staff_id}-${idx}`}
                      className="hover:bg-gray-50/80 transition"
                    >
                      <td className="px-3 py-2.5 font-semibold text-cyan-600">
                        #{item.lead_id}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-gray-800">
                        {item.name || "-"}
                      </td>
                      <td className="px-3 py-2.5 text-gray-600">
                        {item.phone || "-"}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-gray-800">
                        <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
                          👤 {item.shared_with_name}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-gray-500">
                        {item.shared_at
                          ? moment(item.shared_at).format("DD MMM YYYY, hh:mm A")
                          : "-"}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          onClick={() =>
                            handleRevokeShare(
                              item.lead_id,
                              item.shared_with_staff_id
                            )
                          }
                          className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2.5 py-1 rounded text-[11px] font-semibold transition"
                        >
                          Revoke Access
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex justify-end pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowSharedModal(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}

      <BulkLeadUploadPopup
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        fetchLeads={fetchLeads}
        employees={employees}
      />
  </>
);
};

export default EmployeeLeadContent;
