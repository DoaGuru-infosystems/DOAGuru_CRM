import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import img from "../../images/lead_profile.png";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import VisitCreationPopup from "./VisitCreationPopup";
import FollowUpCreationPopUp from "./FollowUpCreationPopUp";
import RemarkCreationPopup from "./RemarkCreationPopup";
import UnitSoldCreationPopup from "./UnitSoldCreationPopup";
import UpdateLeadStatusPopup from "./UpdateLeadStatusPopup";
import getFieldValue from "../../utils/getFieldValue";
import LeadOverview from "./SingleLeadTabs/LeadOverview";
import BookingDetails from "./SingleLeadTabs/BookingDetails";
import RegistryDetails from "./SingleLeadTabs/RegistryDetails";
import UtilityCharges from "./SingleLeadTabs/UtilityCharges";
import AllReceipts from "./SingleLeadTabs/AllReceipts";
import Transactions from "./SingleLeadTabs/Transactions";
import VisitTab from "./SingleLeadTabs/VisitTab";
import FollowUpTab from "./SingleLeadTabs/FollowUpTab";
import RemarkTab from "./SingleLeadTabs/RemarkTab";
import SoldUnitView from "./SingleLeadTabs/SoldUnitView";
import BookingCreationPopup from "../EmployeePops/BookingCreationPopup";
import RegistryCreatePopup from "../EmployeePops/RegistryCreatePopup";
import UtilityCreatePopup from "../EmployeePops/UtilityCreatePopup";
import FInalSalePopup from "../EmployeePops/FInalSalePopup";
import PaymentCreatePopup from "../EmployeePops/PaymentCreatePopup";

function EmployeeSingleLeadProfileContent({ isSidebarOpen }) {
  const { type, id } = useParams();

  const navigate = useNavigate();
  const [booking, setBooking] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visit, setVisit] = useState([]);
  const [unitdata, setUnitData] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [showPopupVisit, setShowPopupVisit] = useState(false);
  const [showPopupUnitSold, setShowPopupUnitSold] = useState(false);
  const [showPopupFollowUp, setShowPopupFollowUp] = useState(false);
  const [showPopupRemark, setShowPopupRemark] = useState(false);
  const [showBookPopup, setShowBookPopup] = useState(false);
  const [showRegistryPopup, setShowRegistryPopup] = useState(false);
  const [showUtilityPopup, setShowUtilityPopup] = useState(false);
  const [showFinalSoldPopup, setShowFinalSoldPopup] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [render, setRender] = useState(false);
  const [isOtherReason, setIsOtherReason] = useState(false);

  // States for inline lead editing
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedLead, setEditedLead] = useState({});
  const [errors, setErrors] = useState({});
  const [projects, setProjects] = useState([]);
  const [customLeadSource, setCustomLeadSource] = useState("");

  // Options for lead fields
  const jobNatureOptions = ["Government Job", "Private Sector Job", "Business & Self employee", "Professional", "Salaried", "Retired", "Student", "Housewife", "Others"];
  const departmentOptions = ["IT / Software", "Finance / Accounts", "Sales / Marketing", "HR", "Operations", "Production", "Others"];

  const getDepartmentOptions = (natureOfJob) => {
    if (!natureOfJob) return departmentOptions;
    const job = natureOfJob.toLowerCase().trim();
    if (job === "government job" || job === "government") {
      return ["MPEB", "Forest department", "Land Resource Department"];
    }
    if (job === "private sector job" || job === "private sector") {
      return ["IT", "Legal department"];
    }
    if (
      job === "business & self employee" ||
      job === "business & self-employed" ||
      job === "business & self employed" ||
      job === "business" ||
      job === "self employed"
    ) {
      return [
        "Business Development department",
        "Self Employment Support Service",
        "Technology and Digital Construction Work",
      ];
    }
    if (job === "professional") {
      return [
        "Teacher",
        "Education administrator",
        "Health and Medicine",
        "Professional",
      ];
    }
    return departmentOptions;
  };
  const designationOptions = ["Executive", "Manager", "Director", "VP", "Owner / Founder", "Consultant", "Others"];
  const badgeOptions = ["No Badge", "Hot", "Warm", "Cold"];
  const campaignOptions = ["Google Ads", "Facebook Ads", "Instagram Ads", "LinkedIn Ads", "Email Marketing", "Direct Traffic", "Walk-In", "Others"];
  const subSourceOptions = ["Search Ads", "Social Media Post", "Newsletter", "Partner Referral", "Cold Call", "Exhibition", "Others"];
  const primaryStatusOptions = ["new leads", "Intrested", "Site visit schedule", "visit done", "Deal close", "Deal cancel", "Dead deal"];
  const secondaryStatusOptions = ["Not Picking Calls", "Phone switch Off", "visit Reshedule", "N/A"];
  const projectTypeOptions = ["singlex", "duplex", "plot", "flat"];
  const combinedLeadSources = [
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

  const getLeadSubSourceOptions = (leadSource) => {
    if (!leadSource) return subSourceOptions;
    const src = leadSource.toLowerCase().trim();
    if (src === "referrals" || src === "referral" || src === "refreeal" || src === "refeeral") {
      return ["Customer", "Personal"];
    }
    if (src === "dm" || src === "digital marketing") {
      return [
        "Whatsapp",
        "Magic Bricks",
        "Housing.com",
        "99Acres",
        "Google Business",
        "FaceBook",
        "Instagram",
      ];
    }
    if (src === "office data") {
      return ["Office Data"];
    }
    if (src === "outdoor media" || src === "outdoor media ") {
      return ["BillBoard", "Pumplates", "Hording"];
    }
    if (src === "walk in" || src === "walk-in" || src === "walkin") {
      return ["Walk In"];
    }
    return subSourceOptions;
  };

  const EmpId = useSelector((state) => state.auth.user);
  const [activeTab, setActiveTab] = useState("overview");

  const token = EmpId?.token;
  const userId = EmpId.user_id;
  const [currentLead, setCurrentLead] = useState({
    lead_status: "",
    visit_date: "",
    visit: "",
    quotation_status: "",
    deal_status: "",
    meeting_status: "",
    booking_amount: "",
    payment_mode: "",
    registry: "",
    reason: "",
    follow_up_status: "",
  });

  const [visitLead, setVisitLead] = useState({
    project_name: "",
    lead_id: "",
    name: "",
    employeeId: "",
    employee_name: "",
    visit: "",
    visit_date: "",
  });

  const [quotationCreated, setQuotationCreated] = useState(false);
  const [visitCreated, setVisitCreated] = useState(false);
  const [followCreated, setFollowCreated] = useState([]);
  const [employeeunitsoldCreated, setemployeeunitsoldCreated] = useState(false);
  const [remarkCreated, setRemarkCreated] = useState(false);

  useEffect(() => {
    fetchUnitdata();
    fetchUnitSoldEmployee();
  }, [leads[0]]);

  useEffect(() => {
    if (token && EmpId?.staff_org_id) {
      fetchProjects();
    }
  }, [token, EmpId]);

  useEffect(() => {
    fetchVisit();
    fetchFollowUp();
    fetchRemark();
    if (type === "meta") {
      fetchMetaLeads();
    } else {
      fetchLeads();
    }
  }, [type, id]);

  const fetchProjects = async () => {
    try {
      const { data } = await axios.get(
        `http://localhost:9000/api/super-admin-all-project/${EmpId?.staff_org_id}`,
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

  const fetchLeads = async () => {
    try {
      const response = await axios.get(
        `http://localhost:9000/api/leads-employee/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setLeads(response.data);

      response.data.forEach((lead) => {
        console.log("Lead Quotation Status (raw):", lead.quotation);
      });

      const hasCreatedQuotation = response.data.some(
        (lead) =>
          lead.quotation && lead.quotation.trim().toLowerCase() === "created"
      );

      setQuotationCreated(hasCreatedQuotation);
    } catch (error) {
      console.error("Error fetching quotations:", error);
    }
  };

  const fetchMetaLeads = async () => {
    try {
      const { data } = await axios.get(
        `http://localhost:9000/api/getMetaLeadsByLeadId/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setLeads(data);
    } catch (error) {
      console.error("Error fetching quotations:", error);
    }
  };

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setEditedLead((prev) => {
      let updated = { ...prev };
      if (name === "phone" || name === "alternative_number") {
        const onlyNumbers = value.replace(/\D/g, "");
        if (onlyNumbers.length <= 10) {
          updated[name] = onlyNumbers;
        }
        return updated;
      }
      updated[name] = value;

      if (name === "project_name") {
        const selectedProj = projects.find((p) => p.project_name === value);
        if (selectedProj) {
          updated.main_project_id = selectedProj.project_id;
        } else {
          updated.main_project_id = "";
        }
      }
      return updated;
    });
  };

  const handleCustomLeadSourceChange = (e) => {
    setCustomLeadSource(e.target.value);
  };

  const validateProfileForm = () => {
    let formErrors = {};
    let isValid = true;

    if (!editedLead.name || !editedLead.name.trim()) {
      formErrors.name = "Full Name is required";
      isValid = false;
    }

    if (!editedLead.phone) {
      formErrors.phone = "Mobile Number is required";
      isValid = false;
    } else if (!/^\d{10}$/.test(editedLead.phone)) {
      formErrors.phone = "Mobile Number must be exactly 10 digits";
      isValid = false;
    }

    if (editedLead.alternative_number && !/^\d{10}$/.test(editedLead.alternative_number)) {
      formErrors.alternative_number = "Alternative Number must be exactly 10 digits";
      isValid = false;
    }

    if (editedLead.lead_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedLead.lead_email)) {
      formErrors.lead_email = "Invalid email format";
      isValid = false;
    }

    const source = editedLead.leadSource === "Other" ? customLeadSource : editedLead.leadSource;
    if (!source || !source.trim()) {
      formErrors.leadSource = "Lead Source is required";
      isValid = false;
    }

    setErrors(formErrors);
    return isValid;
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!validateProfileForm()) {
      toast.error("Please resolve validation errors.");
      return;
    }

    const source = editedLead.leadSource === "Other" ? customLeadSource : editedLead.leadSource;
    const leadData = {
      ...editedLead,
      leadSource: source,
    };

    setLoading(true);
    try {
      const targetId = type === "meta" ? editedLead?.leadgen_id : editedLead?.lead_id;
      await axios.put(
        `http://localhost:9000/api/leads/${targetId}`,
        leadData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Lead details updated successfully!");
      if (type === "meta") {
        fetchMetaLeads();
      } else {
        fetchLeads();
      }
      setIsEditingProfile(false);
    } catch (error) {
      console.error("Error saving lead details:", error);
      toast.error(error?.response?.data?.message || "Failed to save lead details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchVisit = async () => {
    try {
      const { data } = await axios.get(
        `http://localhost:9000/api/employe-visit/${type}/${id}`,
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

  const fetchFollowUp = async () => {
    try {
      let apiUrl = "";

      if (type === "meta") {
        apiUrl = `http://localhost:9000/api/getEmployeeFollow_UpMeta/${id}`;
      } else {
        apiUrl = `http://localhost:9000/api/employe-follow-up/${id}`;
      }

      const { data } = await axios.get(apiUrl, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      setFollowCreated(data);
    } catch (error) {
      console.error("Error fetching follow up:", error);
    }
  };

  const fetchUnitSoldEmployee = async () => {
    try {
      let apiUrl = "";

      if (type === "meta") {
        apiUrl = `http://localhost:9000/api/getEmployeeUnitSoldByLeadIdMeta/${leads[0]?.leadgen_id}`;
      } else {
        apiUrl = `http://localhost:9000/api/unit-sold-lead-id/${leads[0]?.lead_id}`;
      }

      const response = await axios.get(apiUrl, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      setemployeeunitsoldCreated(response.data[0]);
    } catch (error) {
      console.error("Error fetching quotations:", error);
    }
  };

  const fetchRemark = async () => {
    try {
      let apiUrl = "";

      if (type === "meta") {
        apiUrl = `http://localhost:9000/api/getEmployeeRemarkMeta/${id}`;
      } else {
        apiUrl = `http://localhost:9000/api/remarks/${id}`;
      }

      const response = await axios.get(apiUrl, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      setRemarkCreated(response.data.length > 0);
    } catch (error) {
      console.error("Error fetching remarks:", error);
    }
  };

  const fetchUnitdata = async () => {
    try {
      const response = await axios.get(
        `http://localhost:9000/api/unit-data/${leads[0]?.unit_id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setUnitData(response.data);
    } catch (error) {
      console.error("Error fetching Unit Data:", error);
    }
  };
  const handleBackClick = () => {
    navigate(-1);
  };

  const handleQuotation = async (lead) => {
    const name = lead.name;
    navigate(`/quotation-by-lead/${lead.lead_id}`, { state: { name } });
  };

  const handleViewQuotation = (lead) => {
    console.log("Lead Object:", lead);
    const name = lead.name;
    console.log("Lead Name:", name);
    navigate(`/View_quotations/${lead.lead_id}`);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentLead((prevState) => ({ ...prevState, [name]: value }));

    if (name === "reason") {
      setIsOtherReason(value === "other");
      if (value !== "other") {
        setCurrentLead((prevState) => ({ ...prevState, customReason: "" }));
      }
    }
  };

  const handleUpdate = (lead) => {
    setIsEditing(true);
    setCurrentLead(lead);
    console.log(lead);

    setShowPopup(true);
  };

  const handleViewVisit = () => {
    navigate(`/view_visit/${type}/${leads[0].lead_id || leads[0].leadgen_id}`);
    console.log(leads[0].lead_id);
  };
  const handleViewEmployeeUnitSold = () => {
    navigate(
      `/view_unit_sold/${type}/${leads[0].lead_id || leads[0].leadgen_id}`
    );
  };

  const handleViewFollowUp = () => {
    navigate(
      `/view_follow_up/${type}/${leads[0].lead_id || leads[0].leadgen_id}`
    );
  };

  const saveChanges = async () => {
    console.log(currentLead);

    const leadData = {
      ...currentLead,
      reason: isOtherReason
        ? currentLead.customReason || leads[0]?.reason
        : currentLead.reason,
    };
    try {
      if (currentLead.deal_status == "close") {
        if (currentLead.d_closeDate === "pending") {
          alert("Please update the deal close date as well");
          return;
        }
      }
      if (currentLead.lead_status == "not-interested") {
        if (
          currentLead.reason === "pending" ||
          currentLead.customReason === currentLead.reason
        ) {
          alert("Please update the reason as well");
          return;
        }
      }
      setLoading(true);
      const response = await axios.put(
        `http://localhost:9000/api/updateLeadStatus/${currentLead.lead_id}`,
        leadData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        toast.success("Lead status updated successfully");
        setRender(!render);
        closePopup();
        fetchLeads();
        setLoading(false);
      } else {
        setLoading(false);
        toast.error({ general: "Failed to update the lead status." });
      }
    } catch (error) {
      console.error("Request failed:", error);
      setLoading(false);
      toast.error("Failed to update the lead status.");
    }
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  const totalVisit = visit.length;

  const remainingLeads = leads?.length > 1 ? leads.slice(1) : leads;

  console.log(leads);

  const fetchBookingData = async () => {
    try {
      const { data } = await axios.get(
        `http://localhost:9000/api/getBookingBYleadId/${id}`
      );
      setBooking(data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchBookingData();
  }, []);

  console.log(booking);
  console.log(EmpId?.staff_role);

  return (
    <>
      <div className="flex mt-20">
        <div
          className={`${isSidebarOpen ? "w-[80rem]" : "w-[88rem]"
            } min-h-screen bg-[#F7F7F5] p-6 pb-20`}
        >
          <div className="flex flex-col">
            <div className="container sm:mt-1 px-2 mx-auto">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-neutral-200 pb-5 mb-8 gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Leads Profile</h1>
                  <p className="text-xs text-neutral-500 mt-1">Detailed overview of candidate registration, requirements, and communication history</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate(-1)}
                    className="bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all max-sm:hidden"
                  >
                    Back
                  </button>
                  {leads.length > 0 && (
                    <div className="flex gap-2">
                      {!isEditingProfile ? (
                        <button
                          onClick={() => {
                            const initialLead = {
                              ...leads[0],
                              leadSource: leads[0]?.leadSource || "",
                            };
                            setEditedLead(initialLead);
                            if (leads[0]?.leadSource && !combinedLeadSources.includes(leads[0]?.leadSource)) {
                              setCustomLeadSource(leads[0]?.leadSource);
                              initialLead.leadSource = "Other";
                            } else {
                              setCustomLeadSource("");
                            }
                            setIsEditingProfile(true);
                          }}
                          className="bg-neutral-900 hover:bg-neutral-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all"
                        >
                          Edit Profile
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={handleSaveProfile}
                            disabled={loading}
                            className="bg-neutral-900 hover:bg-neutral-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all"
                          >
                            {loading ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingProfile(false);
                              setErrors({});
                            }}
                            className="bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap mb-4">
                <div className="w-full lg:w-1/3 hidden sm:block pr-6">
                  <img src={img} alt="doctor-profile" className="rounded-2xl border border-neutral-200 shadow-xs object-cover w-full max-h-[300px]" />
                </div>
                {remainingLeads?.map((lead, index) => (
                  <div className="w-full lg:w-2/3 ">
                    {!isEditingProfile ? (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                        <div>
                          <label className="text-cyan-600 font-semibold">
                            Name
                          </label>
                          <div className="p-2 bg-gray-100 rounded">
                            <p className="m-0 break-words">
                              {lead.name ||
                                getFieldValue(
                                  lead.question_fields_data,
                                  "full_name"
                                )}
                            </p>
                          </div>
                        </div>

                        <div>
                          <label className="text-cyan-600 font-semibold">
                            Assigned To
                          </label>
                          <div className="p-2 bg-gray-100 rounded">
                            <p className="m-0">{lead.staff_name}</p>
                          </div>
                        </div>

                        <div>
                          <label className="text-cyan-600 font-semibold">
                            Mobile Number
                          </label>
                          <div className="p-2 bg-gray-100 rounded">
                            <p className="m-0">
                              {lead.phone ||
                                getFieldValue(
                                  lead.question_fields_data,
                                  "phone_number"
                                )}
                            </p>
                          </div>
                        </div>

                        <div>
                          <label className="text-cyan-600 font-semibold">
                            Lead Source
                          </label>
                          <div className="p-2 bg-gray-100 rounded">
                            <p className="m-0">{lead.leadSource || "Meta"}</p>
                          </div>
                        </div>
                        <div>
                          <label className="text-cyan-600 font-semibold">
                            Project Name
                          </label>
                          <div className="p-2 bg-gray-100 rounded">
                            <p className="m-0">{lead.project_name}</p>
                          </div>
                        </div>
                        <div>
                          <label className="text-cyan-600 font-semibold">
                            Lead Status
                          </label>
                          <div className="p-2 bg-gray-100 rounded">
                            <p className="m-0">
                              {lead.lead_status || lead?.meta_lead_status}
                            </p>
                          </div>
                        </div>

                        <div>
                          <label className="text-cyan-600 font-semibold">
                            {" "}
                            Date
                          </label>
                          <div className="p-2 bg-gray-100 rounded">
                            <p className="m-0">
                              {lead.createdTime || lead?.meta_updated_at}
                            </p>
                          </div>
                        </div>

                        {lead.referred_by && (
                          <div>
                            <label className="text-cyan-600 font-semibold">Referred By</label>
                            <div className="p-2 bg-gray-100 rounded">
                              <p className="m-0">{lead.referred_by}</p>
                            </div>
                          </div>
                        )}
                        {lead.alternative_number && (
                          <div>
                            <label className="text-cyan-600 font-semibold">Alt Number</label>
                            <div className="p-2 bg-gray-100 rounded">
                              <p className="m-0">{lead.alternative_number}</p>
                            </div>
                          </div>
                        )}
                        {lead.dob && (
                          <div>
                            <label className="text-cyan-600 font-semibold">DOB</label>
                            <div className="p-2 bg-gray-100 rounded">
                              <p className="m-0">{lead.dob}</p>
                            </div>
                          </div>
                        )}
                        {lead.anniversary_date && (
                          <div>
                            <label className="text-cyan-600 font-semibold">Anniversary Date</label>
                            <div className="p-2 bg-gray-100 rounded">
                              <p className="m-0">{lead.anniversary_date}</p>
                            </div>
                          </div>
                        )}
                        {lead.office_business_name && (
                          <div>
                            <label className="text-cyan-600 font-semibold">Office/Business Name</label>
                            <div className="p-2 bg-gray-100 rounded">
                              <p className="m-0">{lead.office_business_name}</p>
                            </div>
                          </div>
                        )}
                        {lead.office_address && (
                          <div>
                            <label className="text-cyan-600 font-semibold">Office Address</label>
                            <div className="p-2 bg-gray-100 rounded">
                              <p className="m-0">{lead.office_address}</p>
                            </div>
                          </div>
                        )}
                        {lead.nature_of_job && (
                          <div>
                            <label className="text-cyan-600 font-semibold">Nature of Job</label>
                            <div className="p-2 bg-gray-100 rounded">
                              <p className="m-0">{lead.nature_of_job}</p>
                            </div>
                          </div>
                        )}
                        {lead.department && (
                          <div>
                            <label className="text-cyan-600 font-semibold">Department</label>
                            <div className="p-2 bg-gray-100 rounded">
                              <p className="m-0">{lead.department}</p>
                            </div>
                          </div>
                        )}
                        {lead.designation && (
                          <div>
                            <label className="text-cyan-600 font-semibold">Designation</label>
                            <div className="p-2 bg-gray-100 rounded">
                              <p className="m-0">{lead.designation}</p>
                            </div>
                          </div>
                        )}
                        {lead.badge && (
                          <div>
                            <label className="text-cyan-600 font-semibold">Badge</label>
                            <div className="p-2 bg-gray-100 rounded">
                              <p className="m-0">{lead.badge}</p>
                            </div>
                          </div>
                        )}
                        {lead.salary && (
                          <div>
                            <label className="text-cyan-600 font-semibold">Salary</label>
                            <div className="p-2 bg-gray-100 rounded">
                              <p className="m-0">{lead.salary}</p>
                            </div>
                          </div>
                        )}
                        {lead.campaign && (
                          <div>
                            <label className="text-cyan-600 font-semibold">Campaign</label>
                            <div className="p-2 bg-gray-100 rounded">
                              <p className="m-0">{lead.campaign}</p>
                            </div>
                          </div>
                        )}
                        {lead.interest_in_project_secondary && (
                          <div>
                            <label className="text-cyan-600 font-semibold">Sec Project Interest</label>
                            <div className="p-2 bg-gray-100 rounded">
                              <p className="m-0">{lead.interest_in_project_secondary}</p>
                            </div>
                          </div>
                        )}
                        {lead.project_type && (
                          <div>
                            <label className="text-cyan-600 font-semibold">Project Type</label>
                            <div className="p-2 bg-gray-100 rounded">
                              <p className="m-0">{lead.project_type}</p>
                            </div>
                          </div>
                        )}
                        {lead.lead_sub_source && (
                          <div>
                            <label className="text-cyan-600 font-semibold">Sub Source</label>
                            <div className="p-2 bg-gray-100 rounded">
                              <p className="m-0">{lead.lead_sub_source}</p>
                            </div>
                          </div>
                        )}
                        {lead.budget && (
                          <div>
                            <label className="text-cyan-600 font-semibold">Budget</label>
                            <div className="p-2 bg-gray-100 rounded">
                              <p className="m-0">{lead.budget}</p>
                            </div>
                          </div>
                        )}
                        {lead.primary_status && (
                          <div>
                            <label className="text-cyan-600 font-semibold">Primary Status</label>
                            <div className="p-2 bg-gray-100 rounded">
                              <p className="m-0">{lead.primary_status}</p>
                            </div>
                          </div>
                        )}
                        {lead.secondary_status && (
                          <div>
                            <label className="text-cyan-600 font-semibold">Secondary Status</label>
                            <div className="p-2 bg-gray-100 rounded">
                              <p className="m-0">{lead.secondary_status}</p>
                            </div>
                          </div>
                        )}
                        {lead.lead_review && (
                          <div className="col-span-1 lg:col-span-3">
                            <label className="text-cyan-600 font-semibold">Lead Review / Notes</label>
                            <div className="p-2 bg-gray-100 rounded">
                              <p className="m-0 whitespace-pre-wrap">{lead.lead_review}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                        <div>
                          <label className="text-cyan-600 font-semibold">
                            Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={editedLead.name || ""}
                            onChange={handleProfileInputChange}
                            required
                            className={`w-full p-2 border ${errors.name ? "border-red-500" : "border-gray-300"} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white`}
                          />
                          {errors.name && <span className="text-red-500 text-xs block mt-1">{errors.name}</span>}
                        </div>

                        <div>
                          <label className="text-cyan-600 font-semibold">
                            Assigned To
                          </label>
                          <div className="p-2 bg-gray-100 rounded text-gray-500">
                            <p className="m-0">{editedLead.staff_name || "N/A"}</p>
                          </div>
                        </div>

                        <div>
                          <label className="text-cyan-600 font-semibold">
                            Mobile Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="phone"
                            value={editedLead.phone || ""}
                            onChange={handleProfileInputChange}
                            required
                            className={`w-full p-2 border ${errors.phone ? "border-red-500" : "border-gray-300"} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white`}
                          />
                          {errors.phone && <span className="text-red-500 text-xs block mt-1">{errors.phone}</span>}
                        </div>

                        <div>
                          <label className="text-cyan-600 font-semibold">
                            Lead Source <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="leadSource"
                            value={editedLead.leadSource || ""}
                            onChange={handleProfileInputChange}
                            required
                            className={`w-full p-2 border bg-white ${errors.leadSource ? "border-red-500" : "border-gray-300"} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500`}
                          >
                            <option value="">Select Lead Source</option>
                            {combinedLeadSources.map((source) => (
                              <option key={source} value={source}>
                                {source}
                              </option>
                            ))}
                            <option value="Other">Other</option>
                          </select>
                          {editedLead.leadSource === "Other" && (
                            <input
                              type="text"
                              value={customLeadSource}
                              onChange={handleCustomLeadSourceChange}
                              placeholder="Enter custom lead source"
                              className="mt-2 w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white"
                            />
                          )}
                          {errors.leadSource && <span className="text-red-500 text-xs block mt-1">{errors.leadSource}</span>}
                        </div>

                        <div>
                          <label className="text-cyan-600 font-semibold">
                            Project Name
                          </label>
                          <select
                            name="project_name"
                            value={editedLead.project_name || ""}
                            onChange={handleProfileInputChange}
                            className="w-full p-2 border bg-white border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          >
                            <option value="">Select Primary Project</option>
                            {projects.map((proj) => (
                              <option key={proj.project_id} value={proj.project_name}>
                                {proj.project_name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-cyan-600 font-semibold">
                            Lead Status
                          </label>
                          <div className="p-2 bg-gray-100 rounded text-gray-500">
                            <p className="m-0">{editedLead.lead_status || editedLead.meta_lead_status || "N/A"}</p>
                          </div>
                        </div>

                        <div>
                          <label className="text-cyan-600 font-semibold">
                            Date
                          </label>
                          <div className="p-2 bg-gray-100 rounded text-gray-500">
                            <p className="m-0">{editedLead.createdTime || editedLead.meta_updated_at || "N/A"}</p>
                          </div>
                        </div>

                        <div>
                          <label className="text-cyan-600 font-semibold">
                            Referred By
                          </label>
                          <input
                            type="text"
                            name="referred_by"
                            value={editedLead.referred_by || ""}
                            onChange={handleProfileInputChange}
                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-cyan-600 font-semibold">
                            Alt Number
                          </label>
                          <input
                            type="text"
                            name="alternative_number"
                            value={editedLead.alternative_number || ""}
                            onChange={handleProfileInputChange}
                            className={`w-full p-2 border ${errors.alternative_number ? "border-red-500" : "border-gray-300"} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white`}
                          />
                          {errors.alternative_number && <span className="text-red-500 text-xs block mt-1">{errors.alternative_number}</span>}
                        </div>

                        <div>
                          <label className="text-cyan-600 font-semibold">
                            DOB
                          </label>
                          <input
                            type="date"
                            name="dob"
                            value={editedLead.dob ? editedLead.dob.split("T")[0] : ""}
                            onChange={handleProfileInputChange}
                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-cyan-600 font-semibold">
                            Anniversary Date
                          </label>
                          <input
                            type="date"
                            name="anniversary_date"
                            value={editedLead.anniversary_date ? editedLead.anniversary_date.split("T")[0] : ""}
                            onChange={handleProfileInputChange}
                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-cyan-600 font-semibold">
                            Office/Business Name
                          </label>
                          <input
                            type="text"
                            name="office_business_name"
                            value={editedLead.office_business_name || ""}
                            onChange={handleProfileInputChange}
                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-cyan-600 font-semibold">
                            Office Address
                          </label>
                          <input
                            type="text"
                            name="office_address"
                            value={editedLead.office_address || ""}
                            onChange={handleProfileInputChange}
                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-cyan-600 font-semibold">
                            Nature of Job
                          </label>
                          <select
                            name="nature_of_job"
                            value={editedLead.nature_of_job || ""}
                            onChange={handleProfileInputChange}
                            className="w-full p-2 border bg-white border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          >
                            <option value="">Select Nature Of Job</option>
                            {jobNatureOptions.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-cyan-600 font-semibold">
                            Department
                          </label>
                          <select
                            name="department"
                            value={editedLead.department || ""}
                            onChange={handleProfileInputChange}
                            className="w-full p-2 border bg-white border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          >
                            <option value="">Select Department</option>
                            {getDepartmentOptions(editedLead.nature_of_job).map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-cyan-600 font-semibold">
                            Designation
                          </label>
                          <select
                            name="designation"
                            value={editedLead.designation || ""}
                            onChange={handleProfileInputChange}
                            className="w-full p-2 border bg-white border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          >
                            <option value="">Select Designation</option>
                            {designationOptions.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-cyan-600 font-semibold">
                            Badge
                          </label>
                          <select
                            name="badge"
                            value={editedLead.badge || "No Badge"}
                            onChange={handleProfileInputChange}
                            className="w-full p-2 border bg-white border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          >
                            {badgeOptions.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-cyan-600 font-semibold">
                            Salary
                          </label>
                          <input
                            type="text"
                            name="salary"
                            value={editedLead.salary || ""}
                            onChange={handleProfileInputChange}
                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-cyan-600 font-semibold">
                            Campaign
                          </label>
                          <select
                            name="campaign"
                            value={editedLead.campaign || ""}
                            onChange={handleProfileInputChange}
                            className="w-full p-2 border bg-white border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          >
                            <option value="">Select Campaign</option>
                            {campaignOptions.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-cyan-600 font-semibold">
                            Sec Project Interest
                          </label>
                          <select
                            name="interest_in_project_secondary"
                            value={editedLead.interest_in_project_secondary || ""}
                            onChange={handleProfileInputChange}
                            className="w-full p-2 border bg-white border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          >
                            <option value="">Select Secondary Project</option>
                            {projects.map((proj) => (
                              <option key={proj.project_id} value={proj.project_name}>
                                {proj.project_name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-cyan-600 font-semibold">
                            Project Type
                          </label>
                          <select
                            name="project_type"
                            value={editedLead.project_type || ""}
                            onChange={handleProfileInputChange}
                            className="w-full p-2 border bg-white border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          >
                            <option value="">Select Project Type</option>
                            {projectTypeOptions.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-cyan-600 font-semibold">
                            Sub Source
                          </label>
                          <select
                            name="lead_sub_source"
                            value={editedLead.lead_sub_source || ""}
                            onChange={handleProfileInputChange}
                            className="w-full p-2 border bg-white border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          >
                            <option value="">Select Sub Source</option>
                            {getLeadSubSourceOptions(editedLead.leadSource).map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-cyan-600 font-semibold">
                            Budget
                          </label>
                          <input
                            type="text"
                            name="budget"
                            value={editedLead.budget || ""}
                            onChange={handleProfileInputChange}
                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-cyan-600 font-semibold">
                            Primary Status
                          </label>
                          <select
                            name="primary_status"
                            value={editedLead.primary_status || ""}
                            onChange={handleProfileInputChange}
                            className="w-full p-2 border bg-white border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          >
                            <option value="">Select Primary Status</option>
                            {primaryStatusOptions.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-cyan-600 font-semibold">
                            Secondary Status
                          </label>
                          <select
                            name="secondary_status"
                            value={editedLead.secondary_status || ""}
                            onChange={handleProfileInputChange}
                            className="w-full p-2 border bg-white border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          >
                            <option value="">Select Secondary Status</option>
                            {(() => {
                              const pStatus = (editedLead.primary_status || "").toLowerCase().trim();
                              if (
                                pStatus === "intrested" ||
                                pStatus === "interested" ||
                                pStatus === "site visit schedule" ||
                                pStatus === "site visit scheduled"
                              ) {
                                return secondaryStatusOptions.map((opt) =>
                                  opt.toLowerCase() === "visit reshedule" || opt.toLowerCase() === "visit reschedule"
                                    ? "Meeting done"
                                    : opt
                                );
                              }
                              if (pStatus === "visit done" || pStatus === "done") {
                                return [...secondaryStatusOptions, "Meeting", "Meeting Done", "Negotiation", "NA"];
                              }
                              return secondaryStatusOptions;
                            })().map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-1 lg:col-span-3">
                          <label className="text-cyan-600 font-semibold">
                            Lead Review / Notes
                          </label>
                          <textarea
                            name="lead_review"
                            value={editedLead.lead_review || ""}
                            onChange={handleProfileInputChange}
                            rows={3}
                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {EmpId?.staff_role === "employee" && (
                <div className="flex flex-wrap justify-between gap-4 p-4">
                  {/* Left Section for Creation Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="bg-orange-500 text-white px-4 py-2 rounded w-full sm:w-auto"
                      onClick={() => setShowPopupVisit(true)}
                    >
                      + Add Visit
                    </button>
                    <button
                      className="bg-yellow-500 text-white px-4 py-2 rounded w-full sm:w-auto"
                      onClick={() => setShowPopupFollowUp(true)}
                    >
                      + Add Follow-Up
                    </button>
                    <button
                      className="bg-purple-500 text-white px-4 py-2 rounded w-full sm:w-auto"
                      onClick={() => setShowPopupRemark(true)}
                    >
                      + Add Remark
                    </button>

                    <button
                      className="bg-emerald-500 text-white px-4 py-2 rounded w-full sm:w-auto"
                      onClick={() => setShowBookPopup(true)}
                    >
                      + Add Booking
                    </button>
                    {booking?.length > 0 && (
                      <>
                        <button
                          className="bg-red-500 text-white px-4 py-2 rounded w-full sm:w-auto"
                          onClick={() => setShowRegistryPopup(true)}
                        >
                          + Add Registry
                        </button>
                        <button
                          className="bg-cyan-700 text-white px-4 py-2 rounded w-full sm:w-auto"
                          onClick={() => setShowUtilityPopup(true)}
                        >
                          + Add Utility Charges
                        </button>
                        <button
                          className="bg-green-700 text-white px-4 py-2 rounded w-full sm:w-auto"
                          onClick={() => setShowFinalSoldPopup(true)}
                        >
                          + Final Sale
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Modern Tabs */}
              <div className="flex flex-wrap gap-2 mt-8 bg-white p-2.5 rounded-2xl shadow-xs border border-neutral-200">
                {[
                  { key: "overview", label: "Lead Overview" },
                  { key: "booking", label: "Booking Details" },
                  { key: "registry", label: "Registry Details" },
                  { key: "utility", label: "Utility Charges" },
                  // { key: "receipts", label: "All Receipts" },
                  { key: "transactions", label: "Transactions" },
                  { key: "visit", label: "Visit" },
                  { key: "followup", label: "Follow-Up" },
                  { key: "remark", label: "Remark" },
                  { key: "unitsold", label: "View Sold Details" },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    className={`
                      px-3 py-1.5 rounded-xl font-semibold text-xs transition-all
                      ${activeTab === item.key
                        ? "bg-neutral-900 text-white shadow-xs"
                        : "bg-transparent text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
                      }
                    `}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="pb-20">
            {activeTab === "overview" && <LeadOverview leads={leads} />}
            {activeTab === "booking" && <BookingDetails />}
            {activeTab === "registry" && <RegistryDetails />}
            {activeTab === "utility" && <UtilityCharges />}
            {activeTab === "receipts" && <AllReceipts />}
            {activeTab === "transactions" && <Transactions booking={booking} />}
            {activeTab === "visit" && <VisitTab />}
            {activeTab === "followup" && <FollowUpTab />}
            {activeTab === "remark" && <RemarkTab />}
            {activeTab === "unitsold" && <SoldUnitView booking={booking} />}
          </div>
        </div>
      </div>

      <VisitCreationPopup
        isOpen={showPopupVisit}
        onClose={() => setShowPopupVisit(false)}
        leads={leads}
        visitLead={visitLead}
        fetchLeads={fetchLeads}
        fetchMetaLeads={fetchMetaLeads}
        fetchVisit={fetchVisit}
      />
      <FollowUpCreationPopUp
        isOpen={showPopupFollowUp}
        onClose={() => setShowPopupFollowUp(false)}
        leads={leads}
        visitLead={visitLead}
        fetchLeads={fetchLeads}
        fetchMetaLeads={fetchMetaLeads}
        fetchFollowUp={fetchFollowUp}
      />
      <RemarkCreationPopup
        isOpen={showPopupRemark}
        onClose={() => setShowPopupRemark(false)}
        leads={leads}
        visitLead={visitLead}
        fetchLeads={fetchLeads}
        fetchMetaLeads={fetchMetaLeads}
        fetchRemark={fetchRemark}
      />
      <UnitSoldCreationPopup
        isOpen={showPopupUnitSold}
        onClose={() => setShowPopupUnitSold(false)}
        leads={leads}
        fetchLeads={fetchLeads}
        fetchUnitdata={fetchUnitdata}
        fetchUnitSoldEmployee={fetchUnitSoldEmployee}
        fetchMetaLeads={fetchMetaLeads}
        unitdata={unitdata}
      />
      <FInalSalePopup
        isOpen={showFinalSoldPopup}
        onClose={() => setShowFinalSoldPopup(false)}
        leads={leads}
        booking={booking}
      />
      <BookingCreationPopup
        isOpen={showBookPopup}
        onClose={() => setShowBookPopup(false)}
        leads={leads}
        fetchLeads={fetchLeads}
        fetchUnitdata={fetchUnitdata}
        fetchUnitSoldEmployee={fetchUnitSoldEmployee}
        fetchMetaLeads={fetchMetaLeads}
        unitdata={unitdata}
      />
      <UpdateLeadStatusPopup
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        leads={leads}
        fetchLeads={fetchLeads}
        fetchMetaLeads={fetchMetaLeads}
        fetchUnitdata={fetchUnitdata}
        fetchUnitSoldEmployee={fetchUnitSoldEmployee}
        unitdata={unitdata}
      />
      <RegistryCreatePopup
        isOpen={showRegistryPopup}
        onClose={() => setShowRegistryPopup(false)}
        leads={leads}
        booking={booking}
      />
      <UtilityCreatePopup
        isOpen={showUtilityPopup}
        onClose={() => setShowUtilityPopup(false)}
        leads={leads}
        booking={booking}
      />
    </>
  );
}

export default EmployeeSingleLeadProfileContent;
