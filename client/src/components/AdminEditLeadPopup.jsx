import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { FaClock } from "react-icons/fa";
import moment from "moment";

const AdminEditLeadPopup = ({
  isOpen,
  onClose,
  employees,
  combinedLeadSources,
  projectunit,
  projects,
  fetchProjectsUnit,
  fetchLeads,
  isEditing,
  currentLeads,
  selectedLead,
  setIsEditing,
}) => {
  const modalRef = useRef();
  const visitTimeInputRef = useRef();
  const EmpId = useSelector((state) => state.auth.user);
  const token = EmpId?.token;
  const userId = EmpId.user_id;
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [customLeadSource, setCustomLeadSource] = useState("");
  const [customFields, setCustomFields] = useState({});
  const handleCustomFieldChange = (e) => {
    const { name, value } = e.target;
    setCustomFields((prev) => ({ ...prev, [name]: value }));
  };
  const today = new Date().toISOString().split("T")[0];

  const getAmPm = (timeStr) => {
    if (!timeStr) return "AM";
    const [h] = timeStr.split(":");
    const hour = parseInt(h, 10);
    if (isNaN(hour)) return "AM";
    return hour >= 12 ? "PM" : "AM";
  };

  const handleAmPmToggle = (targetPeriod) => {
    const timeStr = currentLead.visit_time || "09:00";
    const parts = timeStr.split(":");
    let hour = parseInt(parts[0], 10);
    const minute = parts[1] || "00";
    if (isNaN(hour)) hour = 9;

    if (targetPeriod === "PM" && hour < 12) {
      hour += 12;
    } else if (targetPeriod === "AM" && hour >= 12) {
      hour -= 12;
    }

    const formattedHour = String(hour).padStart(2, "0");
    const newTime = `${formattedHour}:${minute}`;
    handleInputChange({
      target: {
        name: "visit_time",
        value: newTime,
      },
    });
  };

  const [currentLead, setCurrentLead] = useState({
    lead_org_id: EmpId?.staff_org_id,
    lead_no: "",
    assignedTo: "",
    employeeId: "",
    employeephone: "",
    createdTime: today,
    name: "",
    phone: "",
    lead_email: "",
    leadSource: "",
    project_name: "",
    main_project_id: "",
    unit_type: "",
    unit_id: "",
    address: "",
    actual_date: "",
    referred_by: "",
    user_id: userId,
    alternative_number: "",
    dob: "",
    anniversary_date: "",
    office_business_name: "",
    office_address: "",
    nature_of_job: "",
    department: "",
    designation: "",
    badge: "No Badge",
    salary: "",
    campaign: "",
    interest_in_project_secondary: "",
    lead_sub_source: "",
    budget: "",
    primary_status: "",
    secondary_status: "",
    lead_review: "",
    visit_time: "",
  });

  useEffect(() => {
    if (isEditing && selectedLead) {
      setCurrentLead({
        lead_org_id: selectedLead?.lead_org_id || EmpId?.staff_org_id,
        lead_no: selectedLead?.lead_no || "",
        assignedTo: selectedLead?.assignedTo || "",
        employeeId: selectedLead?.employeeId || "",
        employeephone: "",
        createdTime: selectedLead?.createdTime || today,
        name: selectedLead?.name || "",
        phone: selectedLead?.phone || "",
        lead_email: selectedLead?.lead_email || "",
        leadSource: selectedLead?.leadSource || "",
        project_name: selectedLead?.project_name || "",
        main_project_id: selectedLead?.main_project_id || "",
        unit_type: selectedLead?.unit_type || "",
        unit_id: selectedLead?.unit_id || "",
        address: selectedLead?.address || "",
        actual_date: selectedLead?.actual_date || "",
        referred_by: selectedLead?.referred_by || "",
        user_id: userId,
        alternative_number: selectedLead?.alternative_number || "",
        dob: selectedLead?.dob || "",
        anniversary_date: selectedLead?.anniversary_date || "",
        office_business_name: selectedLead?.office_business_name || "",
        office_address: selectedLead?.office_address || "",
        nature_of_job: selectedLead?.nature_of_job || "",
        department: selectedLead?.department || "",
        designation: selectedLead?.designation || "",
        badge: selectedLead?.badge || "No Badge",
        salary: selectedLead?.salary || "",
        campaign: selectedLead?.campaign || "",
        interest_in_project_secondary:
          selectedLead?.interest_in_project_secondary || "",
        lead_sub_source: selectedLead?.lead_sub_source || "",
        budget: selectedLead?.budget || "",
        primary_status: selectedLead?.primary_status || "",
        secondary_status: selectedLead?.secondary_status || "",
        lead_review: selectedLead?.lead_review || "",
        visit_time: selectedLead?.visit_time || "",
        project_type: selectedLead?.project_type || "",
      });

      if (selectedLead?.main_project_id) {
        fetchProjectsUnit(selectedLead.main_project_id);
      }
    } else {
      setCurrentLead({
        lead_org_id: EmpId?.staff_org_id,
        lead_no: "",
        assignedTo: "",
        employeeId: "",
        employeephone: "",
        createdTime: today,
        name: "",
        phone: "",
        lead_email: "",
        leadSource: "",
        project_name: "",
        main_project_id: "",
        unit_type: "",
        unit_id: "",
        address: "",
        actual_date: "",
        referred_by: "",
        user_id: userId,
        alternative_number: "",
        dob: "",
        anniversary_date: "",
        office_business_name: "",
        office_address: "",
        nature_of_job: "",
        department: "",
        designation: "",
        badge: "No Badge",
        salary: "",
        campaign: "",
        interest_in_project_secondary: "",
        lead_sub_source: "",
        budget: "",
        primary_status: "",
        secondary_status: "",
        lead_review: "",
        visit_time: "",
        project_type: "",
      });
    }
  }, [selectedLead, isEditing, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setCurrentLead((prevLead) => {
      const updatedLead = { ...prevLead, [name]: value };

      if (name === "createdTime") {
        updatedLead.actual_date = value;
      }

      if (name === "phone" || name === "alternative_number") {
        const onlyNumbers = value.replace(/\D/g, "");
        if (onlyNumbers.length <= 10) {
          updatedLead[name] = onlyNumbers;
        }
        return updatedLead;
      }

      if (name === "assignedTo") {
        const selectedEmployee = employees.find(
          (employee) => Number(employee.staff_id) === Number(value),
        );
        if (selectedEmployee) {
          updatedLead.employeeId = selectedEmployee.staff_id;
          updatedLead.employeephone = selectedEmployee.phone;
        } else {
          updatedLead.employeeId = "";
          updatedLead.employeephone = "";
        }
      }

      if (name === "project_name") {
        const selectedProject = projects.find(
          (project) => project.project_name === value,
        );

        if (selectedProject) {
          updatedLead.main_project_id = selectedProject.main_project_id;
          fetchProjectsUnit(selectedProject.main_project_id);
        } else {
          updatedLead.main_project_id = "";
          fetchProjectsUnit("");
        }
      }

      if (name === "unit_type") {
        const selectedUnit = projectunit.find(
          (unit) => unit.unit_type === value,
        );

        if (selectedUnit) {
          updatedLead.unit_id = selectedUnit.unit_id;
        } else {
          updatedLead.unit_id = "";
        }
      }

      return updatedLead;
    });
  };

  const validateForm = () => {
    let formErrors = {};
    let isValid = true;

    if (!currentLead.name || !currentLead.name.trim()) {
      formErrors.name = "Full Name is required";
      isValid = false;
    }

    if (!currentLead.phone) {
      formErrors.phone = "Mobile Number is required";
      isValid = false;
    } else if (!/^\d{10}$/.test(currentLead.phone)) {
      formErrors.phone = "Mobile Number must be exactly 10 digits";
      isValid = false;
    }

    if (
      currentLead.alternative_number &&
      !/^\d{10}$/.test(currentLead.alternative_number)
    ) {
      formErrors.alternative_number =
        "Alternative Number must be exactly 10 digits";
      isValid = false;
    }

    if (
      currentLead.lead_email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentLead.lead_email)
    ) {
      formErrors.lead_email = "Invalid email format";
      isValid = false;
    }

    if (!currentLead.leadSource) {
      formErrors.leadSource = "Lead Source is required";
      isValid = false;
    }

    setErrors(formErrors);
    return isValid;
  };

  const handleCustomLeadSourceChange = (e) => {
    setCustomLeadSource(e.target.value);
  };

  const saveChanges = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      const leadData = { ...currentLead };
      const fieldsToCheck = [
        "campaign",
        "nature_of_job",
        "department",
        "designation",
        "primary_status",
        "secondary_status",
        "interest_in_project_secondary",
        "badge",
        "project_type",
        "lead_sub_source",
      ];

      fieldsToCheck.forEach((field) => {
        if (
          (leadData[field] === "Other" || leadData[field] === "Others") &&
          customFields[field]
        ) {
          leadData[field] = customFields[field];
        }
      });
      
      leadData.leadSource = currentLead.leadSource === "Other"
            ? customLeadSource
            : currentLead.leadSource;
      leadData.assignedBy = "Admin";

      try {
        setLoading(true);
        if (isEditing) {
          await axios.put(
            `http://localhost:9000/api/leads/${selectedLead?.lead_id}`,
            leadData,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            },
          );

          fetchLeads();
          setIsEditing(false);
          onClose();
        } else {
          // Create new lead
          const response = await axios.post(
            "http://localhost:9000/api/leads",
            leadData,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            },
          );

          // Construct WhatsApp message link with encoded parameters
          if (currentLead.employeephone) {
            const assignedEmployee = employees.find(
              (emp) => Number(emp.staff_id) === Number(currentLead.assignedTo),
            );
            const empName = assignedEmployee ? assignedEmployee.staff_name : "";
            const createdLeadId = response.data?.lead_id || "";
            const whatsappLink = `https://wa.me/${currentLead.employeephone}?text=Hi%20${empName},%20you%20have%20been%20assigned%20a%20new%20lead%20with%20the%20following%20details:%0A%0A1)%20Lead%20No.%20${createdLeadId}%0A2)%20Name:%20${currentLead.name}%0A3)%20Phone%20Number:%20${currentLead.phone}%0A4)%20Lead%20Source:%20${currentLead.leadSource}%0A5)%20Address:%20${currentLead.address}%0A6)%20Project Name:%20${currentLead.project_name}%0A%0APlease%20check%20your%20dashboard%20for%20details.`;
            window.open(whatsappLink, "_blank");
          }

          setIsEditing(false);
          fetchLeads();
          onClose();
        }
        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.error("Error saving lead:", error);
        toast.error("Failed to save lead");
      }
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        handleClose();
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") handleClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const jobNatureOptions = [
    "Government Job",
    "Private Sector Job",
    "Business & Self employee",
    "Professional",
    "Salaried",
    "Retired",
    "Student",
    "Housewife",
    "Others",
  ];
  const departmentOptions = [
    "IT / Software",
    "Finance / Accounts",
    "Sales / Marketing",
    "HR",
    "Operations",
    "Production",
    "Others",
  ];

  const getDepartmentOptions = (natureOfJob) => {
    if (!natureOfJob) return departmentOptions;
    const job = natureOfJob.toLowerCase().trim();
    if (job === "government job" || job === "government") {
      return [
        "MPEB",
        "Forest Department",
        "Land Records Department",
        "Nagar Nigam",
        "MP Tourism",
        "Labour Department",
        "Railway",
        "Food Department",
        "Rural Development Department",
        "PWD",
        "Education Department",
        "Health Department",
        "Police Department",
        "Bank",
        "Army",
        "Defance/CDA"
      ];
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
        "Business Development Department",
        "Self-Employment Support Services",
        "Technology and Digital",
        "Construction Work",
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
  const designationOptions = [
    "Executive",
    "Manager",
    "Director",
    "VP",
    "Owner / Founder",
    "Consultant",
    "Others",
  ];

  const getDesignationOptions = (department) => {
    if (!department) return designationOptions;
    const dept = department.toLowerCase().trim();
    if (dept === "it / software" || dept === "it/ software" || dept === "it") {
      return ["Software Developer", "Manager", "Team Leader", "Executive"];
    }
    if (dept === "legal department" || dept === "legal") {
      return ["Legal Counsel", "Compliance Officer", "Other"];
    }
    if (dept === "business development department" || dept === "business development") {
      return [
        "Business Development Department",
        "Self-Employment Support Services",
        "Technology and Digital",
        "Construction Work",
      ];
    }
    if (dept === "technology and digital") {
      return [
        "Business Development Manager",
        "Sales Representative",
        "Marketing Specialist",
        "Market Research Analyst",
        "Account Executive",
        "Other"
      ];
    }
    if (dept === "self-employment support services" || dept === "self employment support service" || dept === "self-employment support service") {
      return [
        "Self-Employment Coordinator",
        "Small Business Advisor",
        "Freelancer Liaison",
        "Independent Contractor Relations",
        "Other"
      ];
    }
    return designationOptions;
  };
  const badgeOptions = ["No Badge", "Hot", "Warm", "Cold", "Other"];
  const campaignOptions = [
    "Google Ads",
    "Facebook Ads",
    "Instagram Ads",
    "LinkedIn Ads",
    "Email Marketing",
    "Direct Traffic",
    "Walk-In",
    "Others",
  ];
  const subSourceOptions = [
    "Search Ads",
    "Social Media Post",
    "Newsletter",
    "Partner Referral",
    "Cold Call",
    "Exhibition",
    "Others",
  ];
  const primaryStatusOptions = [
    "new leads",
    "Intrested",
    "Site visit schedule",
    "visit done",
    "Deal close",
    "Deal cancel",
    "Dead deal",
    "Other",
  ];
  const secondaryStatusOptions = [
    "Not Picking Calls",
    "Phone switch Off",
    "visit Reshedule",
    "N/A",
    "Other",
  ];
  const projectTypeOptions = ["singlex", "duplex", "plot", "flat", "Other"];

  const getLeadSubSourceOptions = (leadSource) => {
    if (!leadSource) return subSourceOptions;
    const src = leadSource.toLowerCase().trim();
    if (
      src === "referrals" ||
      src === "referral" ||
      src === "refreeal" ||
      src === "refeeral"
    ) {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            ref={modalRef}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-3 p-6 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
            initial={{ scale: 0.9, opacity: 0, y: -30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ duration: 0.3 }}
          >
            {/* Title */}
            <div className="flex justify-between items-center mb-6 border-b pb-3">
              <h2 className="text-2xl font-bold text-cyan-700">
                {isEditing ? "Edit Lead" : "Add Lead"}
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-red-500 transition font-bold text-xl"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={saveChanges}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {/* Name */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={currentLead.name}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                  required
                  className={`mt-1 w-full px-3 py-2 border ${errors.name ? "border-red-500" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none`}
                />
                {errors.name && (
                  <span className="text-red-500 text-xs">{errors.name}</span>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="phone"
                  value={currentLead.phone}
                  onChange={handleInputChange}
                  placeholder="Enter mobile number"
                  required
                  className={`mt-1 w-full px-3 py-2 border ${errors.phone ? "border-red-500" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none`}
                />
                {errors.phone && (
                  <span className="text-red-500 text-xs">{errors.phone}</span>
                )}
              </div>

              {/* Alternative Number */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Alternative Number
                </label>
                <input
                  type="text"
                  name="alternative_number"
                  value={currentLead.alternative_number}
                  onChange={handleInputChange}
                  placeholder="Enter alternative number"
                  className={`mt-1 w-full px-3 py-2 border ${errors.alternative_number ? "border-red-500" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none`}
                />
                {errors.alternative_number && (
                  <span className="text-red-500 text-xs">
                    {errors.alternative_number}
                  </span>
                )}
              </div>

              {/* Campaign */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Campaign
                </label>
                <select
                  name="campaign"
                  value={currentLead.campaign}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none bg-white"
                >
                  <option value="">Select Campaign</option>
                  {campaignOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {(currentLead.campaign === "Other" || currentLead.campaign === "Others") && (
                  <input
                    type="text"
                    name="campaign"
                    value={customFields.campaign || ""}
                    onChange={handleCustomFieldChange}
                    placeholder="Enter custom campaign"
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                  />
                )}
              </div>

              {/* Email */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="lead_email"
                  value={currentLead.lead_email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                  className={`mt-1 w-full px-3 py-2 border ${errors.lead_email ? "border-red-500" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none`}
                />
                {errors.lead_email && (
                  <span className="text-red-500 text-xs">
                    {errors.lead_email}
                  </span>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Date Of Birth
                </label>
                <input
                  type="date"
                  name="dob"
                  value={currentLead.dob}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                />
              </div>

              {/* Anniversary Date */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Anniversary Of Date
                </label>
                <input
                  type="date"
                  name="anniversary_date"
                  value={currentLead.anniversary_date}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                />
              </div>

              {/* Office/Business Name */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Office/Business Name
                </label>
                <input
                  type="text"
                  name="office_business_name"
                  value={currentLead.office_business_name}
                  onChange={handleInputChange}
                  placeholder="Enter office or business name"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                />
              </div>

              {/* Office Address */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Office Address
                </label>
                <input
                  type="text"
                  name="office_address"
                  value={currentLead.office_address}
                  onChange={handleInputChange}
                  placeholder="Enter office address"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                />
              </div>

              {/* Nature of Job */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Nature Of Job
                </label>
                <select
                  name="nature_of_job"
                  value={currentLead.nature_of_job}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none bg-white"
                >
                  <option value="">Select Nature Of Job</option>
                  {jobNatureOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {(currentLead.nature_of_job === "Other" || currentLead.nature_of_job === "Others") && (
                  <input
                    type="text"
                    name="nature_of_job"
                    value={customFields.nature_of_job || ""}
                    onChange={handleCustomFieldChange}
                    placeholder="Enter custom nature of job"
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                  />
                )}
              </div>

              {/* Department */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Department
                </label>
                <select
                  name="department"
                  value={currentLead.department}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none bg-white"
                >
                  <option value="">Select Department</option>
                  {getDepartmentOptions(currentLead.nature_of_job).map(
                    (opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ),
                  )}
                </select>
                {(currentLead.department === "Other" || currentLead.department === "Others") && (
                  <input
                    type="text"
                    name="department"
                    value={customFields.department || ""}
                    onChange={handleCustomFieldChange}
                    placeholder="Enter custom department"
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                  />
                )}
              </div>

              {/* Designation */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Designation
                </label>
                <select
                  name="designation"
                  value={currentLead.designation}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none bg-white"
                >
                  <option value="">Select Designation</option>
                  {getDesignationOptions(currentLead.department).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {(currentLead.designation === "Other" || currentLead.designation === "Others") && (
                  <input
                    type="text"
                    name="designation"
                    value={customFields.designation || ""}
                    onChange={handleCustomFieldChange}
                    placeholder="Enter custom designation"
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                  />
                )}
              </div>

              {/* Primary Status */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Primary Status
                </label>
                <select
                  name="primary_status"
                  value={currentLead.primary_status}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none bg-white"
                >
                  <option value="">Select Primary Status</option>
                  {primaryStatusOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {(currentLead.primary_status === "Other" || currentLead.primary_status === "Others") && (
                  <input
                    type="text"
                    name="primary_status"
                    value={customFields.primary_status || ""}
                    onChange={handleCustomFieldChange}
                    placeholder="Enter custom primary status"
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                  />
                )}
              </div>

              {/* Secondary Status */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Secondary Status
                </label>
                <select
                  name="secondary_status"
                  value={currentLead.secondary_status}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none bg-white"
                >
                  <option value="">Select Secondary Status</option>
                  {(() => {
                    const pStatus = (currentLead.primary_status || "")
                      .toLowerCase()
                      .trim();
                    if (
                      pStatus === "intrested" ||
                      pStatus === "interested" ||
                      pStatus === "site visit schedule" ||
                      pStatus === "site visit scheduled"
                    ) {
                      return secondaryStatusOptions.map((opt) =>
                        opt.toLowerCase() === "visit reshedule" ||
                        opt.toLowerCase() === "visit reschedule"
                          ? "Meeting done"
                          : opt,
                      );
                    }
                    if (pStatus === "visit done" || pStatus === "done") {
                      return [
                        ...secondaryStatusOptions,
                        "Meeting",
                        "Meeting Done",
                        "Negotiation",
                        "NA",
                      ];
                    }
                    return secondaryStatusOptions;
                  })().map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {(currentLead.secondary_status === "Other" || currentLead.secondary_status === "Others") && (
                  <input
                    type="text"
                    name="secondary_status"
                    value={customFields.secondary_status || ""}
                    onChange={handleCustomFieldChange}
                    placeholder="Enter custom secondary status"
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                  />
                )}
              </div>

              {/* Badge */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Badge
                </label>
                <select
                  name="badge"
                  value={currentLead.badge}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none bg-white"
                >
                  {badgeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {(currentLead.badge === "Other" || currentLead.badge === "Others") && (
                  <input
                    type="text"
                    name="badge"
                    value={customFields.badge || ""}
                    onChange={handleCustomFieldChange}
                    placeholder="Enter custom badge"
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                  />
                )}
              </div>

              {/* Salary */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Salary
                </label>
                <input
                  type="text"
                  name="salary"
                  value={currentLead.salary}
                  onChange={handleInputChange}
                  placeholder="Enter salary range / amount"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                />
              </div>

              {/* Interest in Project (Primary) */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Interest in Project (Primary)
                </label>
                <select
                  name="project_name"
                  value={currentLead.project_name}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none bg-white"
                >
                  <option value="">Select Primary Project</option>
                  {projects.map((proj) => (
                    <option key={proj.project_id} value={proj.project_name}>
                      {proj.project_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Interest in Project (Secondary) */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Interest in Project (Secondary)
                </label>
                <select
                  name="interest_in_project_secondary"
                  value={currentLead.interest_in_project_secondary}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none bg-white"
                >
                  <option value="">Select Secondary Project</option>
                  {projects.map((proj) => (
                    <option key={proj.project_id} value={proj.project_name}>
                      {proj.project_name}
                    </option>
                  ))}
                  <option value="Other">Other</option>
                </select>
                {(currentLead.interest_in_project_secondary === "Other" || currentLead.interest_in_project_secondary === "Others") && (
                  <input
                    type="text"
                    name="interest_in_project_secondary"
                    value={customFields.interest_in_project_secondary || ""}
                    onChange={handleCustomFieldChange}
                    placeholder="Enter custom secondary project"
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                  />
                )}
              </div>

              {/* Project Type */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Project Type
                </label>
                <select
                  name="project_type"
                  value={currentLead.project_type || ""}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none bg-white"
                >
                  <option value="">Select Project Type</option>
                  {projectTypeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {(currentLead.project_type === "Other" || currentLead.project_type === "Others") && (
                  <input
                    type="text"
                    name="project_type"
                    value={customFields.project_type || ""}
                    onChange={handleCustomFieldChange}
                    placeholder="Enter custom project type"
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                  />
                )}
              </div>

              {/* Lead Source */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Lead Source <span className="text-red-500">*</span>
                </label>
                <select
                  name="leadSource"
                  value={currentLead.leadSource}
                  onChange={handleInputChange}
                  required
                  className={`mt-1 w-full px-3 py-2 border ${errors.leadSource ? "border-red-500" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none bg-white`}
                >
                  <option value="">Select Lead Source</option>
                  {combinedLeadSources.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                  <option value="Other">Other</option>
                </select>
                {currentLead.leadSource === "Other" && (
                  <input
                    type="text"
                    value={customLeadSource}
                    onChange={handleCustomLeadSourceChange}
                    placeholder="Enter custom lead source"
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                  />
                )}
                {errors.leadSource && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.leadSource}
                  </p>
                )}
              </div>

              {/* Lead Sub Source */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Lead Sub Source
                </label>
                <select
                  name="lead_sub_source"
                  value={currentLead.lead_sub_source}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none bg-white"
                >
                  <option value="">Select Sub Source</option>
                  {getLeadSubSourceOptions(currentLead.leadSource).map(
                    (opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ),
                  )}
                </select>
                {(currentLead.lead_sub_source === "Other" || currentLead.lead_sub_source === "Others") && (
                  <input
                    type="text"
                    name="lead_sub_source"
                    value={customFields.lead_sub_source || ""}
                    onChange={handleCustomFieldChange}
                    placeholder="Enter custom lead sub source"
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                  />
                )}
              </div>

              {/* Budget */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Budget
                </label>
                <input
                  type="text"
                  name="budget"
                  value={currentLead.budget}
                  onChange={handleInputChange}
                  placeholder="Enter budget (e.g. 50 Lakhs)"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                />
              </div>

              {/* Assigned To */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Assigned To
                </label>
                <select
                  name="assignedTo"
                  value={currentLead.assignedTo}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none bg-white"
                >
                  <option value="">Select Employee</option>
                  {employees.map((employee) => (
                    <option key={employee.staff_id} value={employee.staff_id}>
                      {employee.staff_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Visit Assign Date and Visit Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    Visit Assign Date
                  </label>
                  <input
                    type="date"
                    name="createdTime"
                    value={currentLead.createdTime}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FaClock className="text-cyan-600" /> Visit Time
                    </span>
                    {currentLead.visit_time && (
                      <span className="text-xs font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                        {moment(currentLead.visit_time, [
                          "HH:mm",
                          "hh:mm A",
                        ]).format("hh:mm A")}
                      </span>
                    )}
                  </label>
                  <input
                    type="time"
                    name="visit_time"
                    value={currentLead.visit_time || ""}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none bg-white text-sm cursor-pointer"
                  />
                </div>
              </div>

              {/* Unit Type */}
              {currentLead.main_project_id && projectunit.length > 0 && (
                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    Unit Type
                  </label>
                  <select
                    name="unit_type"
                    value={currentLead.unit_type}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none bg-white"
                  >
                    <option value="">Select Unit Type</option>
                    {projectunit.map((unit) => (
                      <option key={unit.unit_id} value={unit.unit_type}>
                        {unit.unit_type}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Address */}
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-700">
                  Address
                </label>
                <textarea
                  name="address"
                  value={currentLead.address}
                  onChange={handleInputChange}
                  placeholder="Enter address"
                  rows={2}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                />
              </div>

              {/* Remark */}
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-700">
                  Remark
                </label>
                <textarea
                  name="lead_review"
                  value={currentLead.lead_review}
                  onChange={handleInputChange}
                  placeholder="Enter remark"
                  rows={2}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t mt-2">
                <button
                  type="button"
                  className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition"
                  onClick={handleClose}
                >
                  Cancel
                </button>
                <button
                  className="px-5 py-2 bg-cyan-600 text-white rounded-lg shadow hover:bg-cyan-700 font-medium transition"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AdminEditLeadPopup;
