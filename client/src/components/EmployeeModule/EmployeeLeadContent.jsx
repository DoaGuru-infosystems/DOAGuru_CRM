import React, { useState, useEffect } from "react";
import moment from "moment";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import ReactPaginate from "react-paginate";
import { FaDatabase } from "react-icons/fa";
import SuperAdminEditLeadPopup from "../../adiComponent/Super-Admin/SuperAdminEditLeadPopup";

const EmployeeLeadContent = ({ isSidebarOpen }) => {
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [leadSourceFilter, setLeadSourceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [visitFilter, setVisitFilter] = useState("");
  const [dealFilter, setDealFilter] = useState("");
  const [soldunitFilter, setSoldUnitFilter] = useState("");
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
  const [employees, setEmployees] = useState([]);
  const [projectunit, setProjectUnit] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedLead, setSelectedLead] = useState();
  const [transferLead, setTransferLead] = useState(null);
  const [transferReceiverId, setTransferReceiverId] = useState("");
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [columnSearchValues, setColumnSearchValues] = useState({
    project_name: "",
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
    fetchProjectsUnit();
    fetchProjects();
    fetchEmployees();
    fetchPendingRequests();
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [searchTerm, filterDate, leadSourceFilter, soldunitFilter, visitStatusFilter, activeTab]);

  const fetchLeads = async () => {
    try {
      const response = await axios.get(
        `https://crm-generalize.siarasystems.com/api/employe-leads/${EmpId?.staff_id}`,
        {
          params: {
            search: searchTerm || undefined,
            filterDate: filterDate || undefined,
            leadSource: leadSourceFilter || undefined,
            unitStatus: soldunitFilter || undefined,
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

  const fetchProjects = async () => {
    try {
      const { data } = await axios.get(
        `https://crm-generalize.siarasystems.com/api/super-admin-all-project/${EmpId?.staff_org_id}`,
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

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(
        `https://crm-generalize.siarasystems.com/api/getEmployeeByOrg/${EmpId?.staff_org_id}`,
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

  const fetchPendingRequests = async () => {
    try {
      const response = await axios.get(
        "https://crm-generalize.siarasystems.com/api/leads/transfer-requests/pending",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setPendingRequests(response.data);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!transferReceiverId) {
      toast.error("Please select a recipient");
      return;
    }
    try {
      const response = await axios.post(
        "https://crm-generalize.siarasystems.com/api/leads/transfer-request",
        {
          lead_id: transferLead.lead_id,
          receiver_id: Number(transferReceiverId)
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.success) {
        toast.success("Transfer request sent successfully");
        setTransferLead(null);
        setTransferReceiverId("");
      } else {
        toast.error(response.data.message || "Failed to send transfer request");
      }
    } catch (error) {
      console.error("Error sending transfer request:", error);
      toast.error(error.response?.data?.message || "Failed to send transfer request");
    }
  };

  const handleRespondToRequest = async (request_id, action) => {
    try {
      const response = await axios.post(
        "https://crm-generalize.siarasystems.com/api/leads/transfer-request/respond",
        {
          request_id,
          action
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.success) {
        toast.success(`Transfer request ${action} successfully`);
        fetchPendingRequests();
        fetchLeads();
      } else {
        toast.error(response.data.message || "Failed to respond to request");
      }
    } catch (error) {
      console.error("Error responding to request:", error);
      toast.error(error.response?.data?.message || "Failed to respond to request");
    }
  };

  const fetchProjectsUnit = async (main_project_id) => {
    try {
      if (!main_project_id) {
        setProjectUnit([]);
        return;
      }

      const response = await axios.get(
        `https://crm-generalize.siarasystems.com/api/super-admin-project-unit/${main_project_id}`,
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

  const handleUpdate = async (lead) => {
    try {
      const response = await axios.put(
        `https://crm-generalize.siarasystems.com/api/updateOnlyLeadStatus/${lead.lead_id}`,
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
        `https://crm-generalize.siarasystems.com/api/updateOnlyPrimaryStatus/${leadId}`,
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
        `https://crm-generalize.siarasystems.com/api/leads/${leadId}`,
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
        ["project_name", "name", "leadSource", "phone", "staff_name"].some(
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

    if (soldunitFilter) {
      filtered = filtered.filter((lead) => lead.unit_status === soldunitFilter);
    }

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
    soldunitFilter,
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

  // Total Closed Leads
  const totalClosedLeads = applyFilters().filter(
    (lead) => lead.deal_status === "close"
  ).length;

  // Total Visits
  const totalVisits = applyFilters().filter((lead) =>
    ["fresh", "re-visit", "self", "associative"].includes(lead.visit)
  ).length;

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
    setSoldUnitFilter("");
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
                <button
                  className="bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all hover:shadow-md self-start sm:self-auto"
                  onClick={handleCreateClick}
                >
                  <span className="text-base leading-none">+</span> Add Lead
                </button>
              </div>

              {pendingRequests.length > 0 && (
                <div className="mb-6 bg-white border border-gray-200 rounded-xl p-4 shadow-sm max-w-6xl">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    📬 Pending Lead Transfer Requests ({pendingRequests.length})
                  </h3>
                  <div className="space-y-3">
                    {pendingRequests.map((req) => (
                      <div key={req.request_id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm text-gray-700 whitespace-normal break-words">
                            <span className="font-semibold">{req.sender_name}</span> wants to transfer lead <span className="font-semibold text-cyan-600">{req.lead_name}</span> (Phone: {req.lead_phone}) to you.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRespondToRequest(req.request_id, "accepted")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRespondToRequest(req.request_id, "rejected")}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

                {/* Unit Sold */}
                <div className="col-span-12 sm:col-span-2">
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
                </div>

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
                  <span className="bg-orange-50 border border-orange-200 text-orange-700 text-[10px] sm:text-sm px-2.5 py-1 rounded-full font-semibold shadow-sm">
                    Total Site Visit: <span className="font-bold">{totalVisits}</span>
                  </span>
                  <span className="bg-green-50 border border-green-200 text-green-700 text-[10px] sm:text-sm px-2.5 py-1 rounded-full font-semibold shadow-sm">
                    Total Closed Leads: <span className="font-bold">{totalClosedLeads}</span>
                  </span>
                </div>

                {/* Dropdown */}
                <div className="flex items-center gap-2 w-auto">
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
                      <th className="px-1 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-sm border-y-2 border-gray-300 text-left text-gray-700 whitespace-nowrap">
                        S.no
                      </th>
                      <th className="px-1 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-sm border-y-2 border-gray-300 text-left text-gray-700 whitespace-nowrap relative">
                        {activeSearchCol === "name" ? (
                          <div onClick={(e) => e.stopPropagation()} className="absolute inset-0 flex items-center gap-0.5 sm:gap-1 bg-gray-200 z-10 px-1 sm:px-4">
                            <input
                              type="text"
                              placeholder="Search Name..."
                              value={columnSearchValues.name}
                              onChange={(e) => setColumnSearchValues({ ...columnSearchValues, name: e.target.value })}
                              className="w-full p-0.5 sm:p-1 text-[10px] sm:text-xs border border-cyan-500 rounded bg-white text-gray-800 font-normal focus:outline-none focus:ring-1 focus:ring-cyan-500"
                              autoFocus
                              onBlur={() => { if (!columnSearchValues.name) setActiveSearchCol(""); }}
                            />
                            <button
                              onClick={() => {
                                setColumnSearchValues({ ...columnSearchValues, name: "" });
                                setActiveSearchCol("");
                              }}
                              className="text-red-500 hover:text-red-700 font-bold px-0.5 sm:px-1 text-[10px] sm:text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        ) : null}
                        <div
                          onClick={() => setActiveSearchCol("name")}
                          className="flex items-center justify-between gap-1 cursor-pointer select-none group text-[10px] sm:text-sm"
                        >
                          <span>Name</span>
                          <span className="text-gray-400 group-hover:text-cyan-600 text-[10px] sm:text-xs transition-colors ml-0.5 sm:ml-1">
                            {/* 🔍 */}
                          </span>
                          {columnSearchValues.name && (
                            <span className="text-cyan-600 font-bold ml-0.5 sm:ml-1 text-[10px] sm:text-xs">*</span>
                          )}
                        </div>
                      </th>

                      <th className="px-1 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-sm border-y-2 border-gray-300 text-left text-gray-700 whitespace-nowrap relative">
                        {activeSearchCol === "project_name" ? (
                          <div onClick={(e) => e.stopPropagation()} className="absolute inset-0 flex items-center gap-0.5 sm:gap-1 bg-gray-200 z-10 px-1 sm:px-4">
                            <input
                              type="text"
                              placeholder="Search Project..."
                              value={columnSearchValues.project_name}
                              onChange={(e) => setColumnSearchValues({ ...columnSearchValues, project_name: e.target.value })}
                              className="w-full p-0.5 sm:p-1 text-[10px] sm:text-xs border border-cyan-500 rounded bg-white text-gray-800 font-normal focus:outline-none focus:ring-1 focus:ring-cyan-500"
                              autoFocus
                              onBlur={() => { if (!columnSearchValues.project_name) setActiveSearchCol(""); }}
                            />
                            <button
                              onClick={() => {
                                setColumnSearchValues({ ...columnSearchValues, project_name: "" });
                                setActiveSearchCol("");
                              }}
                              className="text-red-500 hover:text-red-700 font-bold px-0.5 sm:px-1 text-[10px] sm:text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        ) : null}
                        <div
                          onClick={() => setActiveSearchCol("project_name")}
                          className="flex items-center justify-between gap-1 cursor-pointer select-none group text-[10px] sm:text-sm"
                        >
                          <span>Project Name</span>
                          <span className="text-gray-400 group-hover:text-cyan-600 text-[10px] sm:text-xs transition-colors ml-0.5 sm:ml-1">
                            {/* 🔍 */}
                          </span>
                          {columnSearchValues.project_name && (
                            <span className="text-cyan-600 font-bold ml-0.5 sm:ml-1 text-[10px] sm:text-xs">*</span>
                          )}
                        </div>
                      </th>
                      <th className="px-1 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-sm border-y-2 border-gray-300 text-left text-gray-700 whitespace-nowrap relative">
                        {activeSearchCol === "phone" ? (
                          <div onClick={(e) => e.stopPropagation()} className="absolute inset-0 flex items-center gap-0.5 sm:gap-1 bg-gray-200 z-10 px-1 sm:px-4">
                            <input
                              type="text"
                              placeholder="Search Phone..."
                              value={columnSearchValues.phone}
                              onChange={(e) => setColumnSearchValues({ ...columnSearchValues, phone: e.target.value })}
                              className="w-full p-0.5 sm:p-1 text-[10px] sm:text-xs border border-cyan-500 rounded bg-white text-gray-800 font-normal focus:outline-none focus:ring-1 focus:ring-cyan-500"
                              autoFocus
                              onBlur={() => { if (!columnSearchValues.phone) setActiveSearchCol(""); }}
                            />
                            <button
                              onClick={() => {
                                setColumnSearchValues({ ...columnSearchValues, phone: "" });
                                setActiveSearchCol("");
                              }}
                              className="text-red-500 hover:text-red-700 font-bold px-0.5 sm:px-1 text-[10px] sm:text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        ) : null}
                        <div
                          onClick={() => setActiveSearchCol("phone")}
                          className="flex items-center justify-between gap-1 cursor-pointer select-none group text-[10px] sm:text-sm"
                        >
                          <span>Phone</span>
                          <span className="text-gray-400 group-hover:text-cyan-600 text-[10px] sm:text-xs transition-colors ml-0.5 sm:ml-1">
                            {/* 🔍 */}
                          </span>
                          {columnSearchValues.phone && (
                            <span className="text-cyan-600 font-bold ml-0.5 sm:ml-1 text-[10px] sm:text-xs">*</span>
                          )}
                        </div>
                      </th>
                      <th className="px-1 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-sm border-y-2 border-gray-300 text-left text-gray-700 whitespace-nowrap relative">
                        {activeSearchCol === "leadSource" ? (
                          <div onClick={(e) => e.stopPropagation()} className="absolute inset-0 flex items-center gap-0.5 sm:gap-1 bg-gray-200 z-10 px-1 sm:px-4">
                            <input
                              type="text"
                              placeholder="Search Source..."
                              value={columnSearchValues.leadSource}
                              onChange={(e) => setColumnSearchValues({ ...columnSearchValues, leadSource: e.target.value })}
                              className="w-full p-0.5 sm:p-1 text-[10px] sm:text-xs border border-cyan-500 rounded bg-white text-gray-800 font-normal focus:outline-none focus:ring-1 focus:ring-cyan-500"
                              autoFocus
                              onBlur={() => { if (!columnSearchValues.leadSource) setActiveSearchCol(""); }}
                            />
                            <button
                              onClick={() => {
                                setColumnSearchValues({ ...columnSearchValues, leadSource: "" });
                                setActiveSearchCol("");
                              }}
                              className="text-red-500 hover:text-red-700 font-bold px-0.5 sm:px-1 text-[10px] sm:text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        ) : null}
                        <div
                          onClick={() => setActiveSearchCol("leadSource")}
                          className="flex items-center justify-between gap-1 cursor-pointer select-none group text-[10px] sm:text-sm"
                        >
                          <span>Lead Source</span>
                          <span className="text-gray-400 group-hover:text-cyan-600 text-[10px] sm:text-xs transition-colors ml-0.5 sm:ml-1">
                            {/* 🔍 */}
                          </span>
                          {columnSearchValues.leadSource && (
                            <span className="text-cyan-600 font-bold ml-0.5 sm:ml-1 text-[10px] sm:text-xs">*</span>
                          )}
                        </div>
                      </th>
                      <th className="px-1 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-sm border-y-2 border-gray-300 text-left text-gray-700 whitespace-nowrap relative">
                        {activeSearchCol === "primary_status" ? (
                          <div onClick={(e) => e.stopPropagation()} className="absolute inset-0 flex items-center gap-0.5 sm:gap-1 bg-gray-200 z-10 px-1 sm:px-4">
                            <input
                              type="text"
                              placeholder="Search Visit..."
                              value={columnSearchValues.primary_status}
                              onChange={(e) => setColumnSearchValues({ ...columnSearchValues, primary_status: e.target.value })}
                              className="w-full p-0.5 sm:p-1 text-[10px] sm:text-xs border border-cyan-500 rounded bg-white text-gray-800 font-normal focus:outline-none focus:ring-1 focus:ring-cyan-500"
                              autoFocus
                              onBlur={() => { if (!columnSearchValues.primary_status) setActiveSearchCol(""); }}
                            />
                            <button
                              onClick={() => {
                                setColumnSearchValues({ ...columnSearchValues, primary_status: "" });
                                setActiveSearchCol("");
                              }}
                              className="text-red-500 hover:text-red-700 font-bold px-0.5 sm:px-1 text-[10px] sm:text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        ) : null}
                        <div
                          onClick={() => setActiveSearchCol("primary_status")}
                          className="flex items-center justify-between gap-1 cursor-pointer select-none group text-[10px] sm:text-sm"
                        >
                          <span>Visit Status</span>
                          <span className="text-gray-400 group-hover:text-cyan-600 text-[10px] sm:text-xs transition-colors ml-0.5 sm:ml-1">
                            {/* 🔍 */}
                          </span>
                          {columnSearchValues.primary_status && (
                            <span className="text-cyan-600 font-bold ml-0.5 sm:ml-1 text-[10px] sm:text-xs">*</span>
                          )}
                        </div>
                      </th>
                      <th className="px-1 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-sm border-y-2 border-gray-300 text-left text-gray-700 whitespace-nowrap relative">
                        {activeSearchCol === "lead_status" ? (
                          <div onClick={(e) => e.stopPropagation()} className="absolute inset-0 flex items-center gap-0.5 sm:gap-1 bg-gray-200 z-10 px-1 sm:px-4">
                            <input
                              type="text"
                              placeholder="Search Status..."
                              value={columnSearchValues.lead_status}
                              onChange={(e) => setColumnSearchValues({ ...columnSearchValues, lead_status: e.target.value })}
                              className="w-full p-0.5 sm:p-1 text-[10px] sm:text-xs border border-cyan-500 rounded bg-white text-gray-800 font-normal focus:outline-none focus:ring-1 focus:ring-cyan-500"
                              autoFocus
                              onBlur={() => { if (!columnSearchValues.lead_status) setActiveSearchCol(""); }}
                            />
                            <button
                              onClick={() => {
                                setColumnSearchValues({ ...columnSearchValues, lead_status: "" });
                                setActiveSearchCol("");
                              }}
                              className="text-red-500 hover:text-red-700 font-bold px-0.5 sm:px-1 text-[10px] sm:text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        ) : null}
                        <div
                          onClick={() => setActiveSearchCol("lead_status")}
                          className="flex items-center justify-between gap-1 cursor-pointer select-none group text-[10px] sm:text-sm"
                        >
                          <span>Lead Status</span>
                          <span className="text-gray-400 group-hover:text-cyan-600 text-[1px] sm:text-xs transition-colors ml-0.5 sm:ml-1">
                            {/* 🔍 */}
                          </span>
                          {columnSearchValues.lead_status && (
                            <span className="text-cyan-600 font-bold ml-0.5 sm:ml-1 text-[10px] sm:text-xs">*</span>
                          )}
                        </div>
                      </th>


                      <th
                        className="px-1 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-sm border-y-2 border-gray-300 text-left text-gray-700 whitespace-nowrap cursor-pointer"
                        onClick={toggleSortOrder}
                      >
                        Assigned Date
                        <span className="text-cyan-900 mx-1 sm:mx-2 text-[10px] sm:text-xs">
                          {sortOrder === "desce" ? "▲" : "▼"}
                        </span>
                      </th>
                      <th className="px-1 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-sm border-y-2 border-gray-300 text-left text-gray-700 whitespace-nowrap">
                        Action
                      </th>
                      <th className="px-1 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-sm border-y-2 border-gray-300 text-left text-gray-700 whitespace-nowrap">
                        Delete
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {currentLeads.length > 0 ? (
                      currentLeads.map((lead, index) => (
                        <tr
                          key={lead.id}
                          className={`${index % 2 === 0 ? "bg-gray-100" : ""} `}
                        >
                          <td className="px-1 sm:px-4 py-1.5 sm:py-3 border-b border-gray-200 text-gray-600 font-semibold whitespace-normal break-words text-[10px] sm:text-xs md:text-sm">
                            {leadsPerPage === Infinity
                              ? index + 1
                              : index + 1 + currentPage * leadsPerPage}
                          </td>
                          <td className="px-1 sm:px-4 py-1.5 sm:py-3 border-b border-gray-200 font-semibold text-cyan-600 text-[10px] sm:text-xs md:text-sm whitespace-normal break-words text-wrap">
                            <Link
                              to={`/employee-lead-single-data/general/${lead.lead_id}`}
                              className="hover:underline"
                            >
                              {lead.name}
                            </Link>
                          </td>
                          <td className="px-1 sm:px-4 py-1.5 sm:py-3 border-b border-gray-200 text-gray-600 font-semibold whitespace-normal break-words text-wrap text-[10px] sm:text-xs md:text-sm">
                            {lead.project_name}
                          </td>
                          <td className="px-1 sm:px-4 py-1.5 sm:py-3 border-b border-gray-200 text-gray-600 font-semibold whitespace-normal break-words text-[10px] sm:text-xs md:text-sm">
                            <a
                              href={`tel:${lead.phone}`}
                              className="text-cyan-600 cursor-pointer"
                            >
                              {lead.phone}
                            </a>
                          </td>
                          <td className="px-1 sm:px-4 py-1.5 sm:py-3 border-b border-gray-200 text-gray-600 font-semibold whitespace-normal break-words text-[10px] sm:text-xs md:text-sm">
                            {lead.leadSource}
                          </td>
                          <td className="px-1 sm:px-4 py-1.5 sm:py-3 border-b border-gray-200 text-gray-600 font-semibold whitespace-normal break-words text-[10px] sm:text-xs md:text-sm">
                            <select
                              value={lead.primary_status || "new leads"}
                              onChange={(e) => handlePrimaryStatusChange(lead.lead_id, e.target.value)}
                              className="border rounded px-1 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs bg-white font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            >
                              <option value="new leads">new leads</option>
                              <option value="Intrested">Intrested</option>
                              <option value="Site visit schedule">Site visit schedule</option>
                              <option value="visit done">visit done</option>
                              <option value="Deal close">Deal close</option>
                              <option value="Deal cancel">Deal cancel</option>
                              <option value="Dead deal">Dead deal</option>
                            </select>
                          </td>
                          <td className="px-1 sm:px-4 py-1.5 sm:py-3 border-b border-gray-200 font-semibold text-gray-600 text-[10px] sm:text-xs md:text-sm">
                            {lead.lead_status}
                          </td>

                          <td className="px-1 sm:px-4 py-1.5 sm:py-3 border-b border-gray-200 text-gray-600 font-semibold whitespace-normal break-words text-[10px] sm:text-xs md:text-sm">
                            {moment(lead.createdTime)
                              .format("DD MMM YYYY")
                              .toUpperCase()}
                          </td>
                          <td className="px-1 sm:px-4 py-1.5 sm:py-3 border-b border-gray-200 font-semibold whitespace-normal break-words text-[10px] sm:text-xs md:text-sm">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                              <Link
                                to={`/employee-lead-single-data/general/${lead.lead_id}`}
                                className="text-cyan-600 hover:text-cyan-800 transition duration-150"
                              >
                                View Details
                              </Link>
                              <span className="hidden sm:inline text-gray-300">|</span>
                              <span
                                onClick={() => {
                                  setTransferLead(lead);
                                  setTransferReceiverId("");
                                }}
                                className="text-emerald-600 hover:text-emerald-800 transition duration-150 cursor-pointer"
                              >
                                Transfer
                              </span>
                            </div>
                          </td>
                          <td className="px-1 sm:px-4 py-1.5 sm:py-3 border-b border-gray-200 font-semibold whitespace-normal break-words text-[10px] sm:text-xs md:text-sm">
                            <span
                              onClick={() => handleDeleteLead(lead.lead_id)}
                              className="text-red-500 hover:text-red-700 transition duration-150 cursor-pointer"
                            >
                              Delete
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="20"
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
        projectunit={projectunit}
        projects={projects}
        fetchProjectsUnit={fetchProjectsUnit}
        fetchLeads={fetchLeads}
        isEditing={isEditing}
        currentLeads={currentLeads}
        selectedLead={selectedLead}
        setIsEditing={setIsEditing}
        saleUser={EmpId}
      />

      {transferLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Transfer Lead</h3>
            <p className="text-sm text-gray-600 mb-4">
              Transfer lead <span className="font-semibold">{transferLead.name}</span> to another employee or admin.
            </p>
            <form onSubmit={handleTransferSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Recipient
                </label>
                <select
                  value={transferReceiverId}
                  onChange={(e) => setTransferReceiverId(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                  required
                >
                  <option value="">-- Select Employee / Admin --</option>
                  {employees
                    .filter((emp) => emp.staff_id !== EmpId?.staff_id)
                    .map((emp) => (
                      <option key={emp.staff_id} value={emp.staff_id}>
                        {emp.staff_name} ({emp.staff_role})
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTransferLead(null)}
                  className="px-4 py-2 border rounded text-sm text-gray-700 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm font-semibold transition"
                >
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* <BulkLeadUploadPopup
              isOpen={showBulkModal}
              onClose={() => setShowBulkModal(false)}
              fetchLeads={fetchLeads}
            /> */}
    </>
  );
};

export default EmployeeLeadContent;
