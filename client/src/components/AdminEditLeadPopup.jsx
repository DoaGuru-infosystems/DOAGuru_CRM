import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { IoCloseSharp } from "react-icons/io5";

const AdminEditLeadPopup = ({
  isOpen,
  onClose,
  employees,
  combinedLeadSources,
  projects,
  fetchLeads,
  isEditing,
  selectedLead,
  setIsEditing,
  saleUser,
}) => {
  const modalRef = useRef();
  const EmpId = useSelector((state) => state.auth.user);
  const token = EmpId?.token;
  const userId = EmpId?.staff_id;
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [customLeadSource, setCustomLeadSource] = useState("");
  const [customFollowUp, setCustomFollowUp] = useState("");
  const today = new Date().toISOString().split("T")[0];

  const initialLeadState = {
    lead_org_id: EmpId?.staff_org_id,
    lead_id: "",
    calling_date: today,
    createdTime: today,
    name: "",
    office_business_name: "",
    phone: "",
    address: "",
    leadSource: "",
    lead_status: "Pending",
    next_follow_date_time: "",
    remark: "",
    lead_review: "",
    interested_follow_up: "",
    assignedTo: "",
    user_id: userId,
  };

  const [currentLead, setCurrentLead] = useState(initialLeadState);

  useEffect(() => {
    if (!isOpen) return;

    if (isEditing && selectedLead) {
      const followUpVal = selectedLead.interested_follow_up || "";
      const standardFollowUps = [
        "Interested",
        "Not Interested",
        "Call Back",
        "Follow Up Later",
        "High Priority",
        "Low Priority",
      ];
      const isCustomFollowUp =
        followUpVal && !standardFollowUps.includes(followUpVal);

      if (isCustomFollowUp) {
        setCustomFollowUp(followUpVal);
      } else {
        setCustomFollowUp("");
      }

      setCurrentLead({
        lead_org_id: selectedLead.lead_org_id || EmpId?.staff_org_id,
        lead_id: selectedLead.lead_id,
        calling_date:
          selectedLead.calling_date || selectedLead.createdTime || today,
        createdTime: selectedLead.createdTime || today,
        name: selectedLead.name || selectedLead.customer_name || "",
        office_business_name:
          selectedLead.office_business_name ||
          selectedLead.business_name ||
          "",
        phone: selectedLead.phone || selectedLead.mobile_number || "",
        address: selectedLead.address || "",
        leadSource: selectedLead.leadSource || "",
        lead_status: selectedLead.lead_status || "Pending",
        next_follow_date_time:
          selectedLead.next_follow_date_time || selectedLead.visit_time || "",
        remark: selectedLead.remark || selectedLead.lead_review || "",
        lead_review: selectedLead.remark || selectedLead.lead_review || "",
        interested_follow_up: isCustomFollowUp ? "Other" : followUpVal,
        assignedTo: selectedLead.assignedTo || "",
        user_id: userId,
      });
    } else {
      setCurrentLead({
        ...initialLeadState,
        lead_org_id: EmpId?.staff_org_id,
        user_id: userId,
      });
      setCustomLeadSource("");
      setCustomFollowUp("");
      setErrors({});
    }
  }, [selectedLead, isEditing, isOpen, EmpId]);

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

  const handleClose = () => {
    setIsEditing(false);
    setErrors({});
    onClose();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      const onlyNumbers = value.replace(/\D/g, "");
      if (onlyNumbers.length <= 10) {
        setCurrentLead((prev) => ({ ...prev, phone: onlyNumbers }));
      }
      return;
    }

    if (name === "remark") {
      setCurrentLead((prev) => ({
        ...prev,
        remark: value,
        lead_review: value,
      }));
      return;
    }

    setCurrentLead((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    let formErrors = {};
    let isValid = true;

    if (!currentLead.name || !currentLead.name.trim()) {
      formErrors.name = "Customer Name is required";
      isValid = false;
    }

    if (!currentLead.phone) {
      formErrors.phone = "Mobile Number is required";
      isValid = false;
    } else if (!/^\d{10}$/.test(currentLead.phone)) {
      formErrors.phone = "Mobile Number must be exactly 10 digits";
      isValid = false;
    }

    if (!currentLead.leadSource) {
      formErrors.leadSource = "Lead Source is required";
      isValid = false;
    }

    setErrors(formErrors);
    return isValid;
  };

  const saveChanges = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const leadSourceVal =
      currentLead.leadSource === "Other" || currentLead.leadSource === "others"
        ? customLeadSource || currentLead.leadSource
        : currentLead.leadSource;

    const followUpVal =
      currentLead.interested_follow_up === "Other"
        ? customFollowUp
        : currentLead.interested_follow_up;

    const leadData = {
      ...currentLead,
      customer_name: currentLead.name,
      business_name: currentLead.office_business_name,
      mobile_number: currentLead.phone,
      leadSource: leadSourceVal,
      lead_source: leadSourceVal,
      interested_follow_up: followUpVal,
      remark: currentLead.remark || currentLead.lead_review || "",
      lead_review: currentLead.remark || currentLead.lead_review || "",
      calling_date: currentLead.calling_date || today,
      actual_date: currentLead.calling_date || today,
      assignedBy: "SuperAdmin",
    };

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
          }
        );
        toast.success("Lead updated successfully");
      } else {
        await axios.post("http://localhost:9000/api/leads", leadData, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        toast.success("Lead added successfully");
      }
      setIsEditing(false);
      fetchLeads();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save lead");
    } finally {
      setLoading(false);
    }
  };

  const leadSourcesList = [
    "Cold Calling",
    "Referrals",
    "Website",
    "Google",
    "Facebook",
    "Instagram",
    "Paid Advertising",
    "Email Campaigns",
    "Networking Events",
    "Content Marketing",
    "SEO",
    "Trade Shows",
    "Affiliate Marketing",
    "Direct Mail",
    "Online Directories",
    "Walk-In",
    "others",
  ];

  const leadStatusList = [
    "Pending",
    "New",
    "Contacted",
    "In Progress",
    "Qualified",
    "Proposal Sent",
    "Negotiation",
    "Hot Lead",
    "Converted",
    "Sold",
    "Close",
    "Not Interested",
    "Not Reachable",
    "Invalid",
    "On Hold",
  ];

  const interestedFollowUpList = [
    "Interested",
    "Not Interested",
    "Call Back",
    "Follow Up Later",
    "High Priority",
    "Low Priority",
    "Other",
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
        >
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b pb-3">
              <h2 className="text-2xl font-bold text-cyan-700">
                {isEditing ? "Edit Lead" : "Add Lead"}
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-red-500 transition"
              >
                <IoCloseSharp className="w-6 h-6" />
              </button>
            </div>

            <form
              onSubmit={saveChanges}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {/* 1. Calling Date */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Calling Date
                </label>
                <input
                  type="date"
                  name="calling_date"
                  value={currentLead.calling_date || ""}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              {/* 2. Customer Name */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter customer name"
                  required
                  value={currentLead.name || ""}
                  onChange={handleInputChange}
                  className={`mt-1 w-full px-3 py-2 border ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  } rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none`}
                />
                {errors.name && (
                  <span className="text-red-500 text-xs">{errors.name}</span>
                )}
              </div>

              {/* 3. Business Name */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Business Name
                </label>
                <input
                  type="text"
                  name="office_business_name"
                  placeholder="Enter business name"
                  value={currentLead.office_business_name || ""}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              {/* 4. Mobile Number */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Enter mobile number"
                  required
                  maxLength={10}
                  value={currentLead.phone || ""}
                  onChange={handleInputChange}
                  className={`mt-1 w-full px-3 py-2 border ${
                    errors.phone ? "border-red-500" : "border-gray-300"
                  } rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none`}
                />
                {errors.phone && (
                  <span className="text-red-500 text-xs">{errors.phone}</span>
                )}
              </div>

              {/* 5. Address */}
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-700">
                  Address
                </label>
                <textarea
                  name="address"
                  rows={2}
                  placeholder="Enter address"
                  value={currentLead.address || ""}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none"
                />
              </div>

              {/* 6. Lead Source */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Lead Source <span className="text-red-500">*</span>
                </label>
                <select
                  name="leadSource"
                  required
                  value={currentLead.leadSource || ""}
                  onChange={handleInputChange}
                  className={`mt-1 w-full px-3 py-2 border ${
                    errors.leadSource ? "border-red-500" : "border-gray-300"
                  } rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none`}
                >
                  <option value="">Select Lead Source</option>
                  {leadSourcesList.map((src, i) => (
                    <option key={i} value={src}>
                      {src}
                    </option>
                  ))}
                </select>
                {errors.leadSource && (
                  <span className="text-red-500 text-xs">
                    {errors.leadSource}
                  </span>
                )}
                {(currentLead.leadSource === "others" ||
                  currentLead.leadSource === "Other") && (
                  <input
                    type="text"
                    placeholder="Specify other lead source"
                    value={customLeadSource}
                    onChange={(e) => setCustomLeadSource(e.target.value)}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                )}
              </div>

              {/* 7. Lead Status */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Lead Status
                </label>
                <select
                  name="lead_status"
                  value={currentLead.lead_status || "Pending"}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                >
                  {leadStatusList.map((st, i) => (
                    <option key={i} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* 8. Next follow Date time */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Next follow Date time
                </label>
                <input
                  type="datetime-local"
                  name="next_follow_date_time"
                  value={currentLead.next_follow_date_time || ""}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              {/* 9. Interested Follow-up */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Interested Follow-up
                </label>
                <select
                  name="interested_follow_up"
                  value={currentLead.interested_follow_up || ""}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                >
                  <option value="">Select Interested Follow-up</option>
                  {interestedFollowUpList.map((item, i) => (
                    <option key={i} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                {currentLead.interested_follow_up === "Other" && (
                  <input
                    type="text"
                    placeholder="Enter custom follow-up status"
                    value={customFollowUp}
                    onChange={(e) => setCustomFollowUp(e.target.value)}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                )}
              </div>

              {/* Assigned To (Optional dropdown for employee assignment) */}
              {employees && employees.length > 0 && (
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Assigned To
                  </label>
                  <select
                    name="assignedTo"
                    value={currentLead.assignedTo || ""}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.staff_id} value={emp.staff_id}>
                        {emp.staff_name} ({emp.staff_role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 10. Remark */}
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-700">
                  Remark
                </label>
                <textarea
                  name="remark"
                  rows={3}
                  placeholder="Enter remark"
                  value={currentLead.remark || ""}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t mt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-cyan-600 text-white rounded-lg shadow hover:bg-cyan-700 font-medium transition disabled:opacity-50"
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
