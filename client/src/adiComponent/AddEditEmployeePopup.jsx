import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { IoCloseSharp, IoEye, IoEyeOff } from "react-icons/io5";

const AddEditEmployeePopup = ({
  isOpen,
  onClose,
  fetchEmployees,
  editingIndex,
  setEditingIndex,
}) => {
  const modalRef = useRef();
  const [showPassword, setShowPassword] = useState(false);
  const EmpId = useSelector((state) => state.auth.user);
  const token = EmpId?.token;
  const userId = EmpId.user_id;
  const [loading, setLoading] = useState(false);

  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    password: "",
    position: "",
    phone: "",
    user_id: userId,
    referred_by: "",
    alternative_number: "",
    dob: "",
    anniversary_date: "",
    office_business_name: "",
    office_address: "",
    nature_of_job: "",
    department: "",
    designation: "",
    badge: "",
    salary: "",
    campaign: "",
    interest_in_project_secondary: "",
    lead_sub_source: "",
    budget: "",
    primary_status: "",
    secondary_status: "",
    lead_review: "",
  });

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

  useEffect(() => {
    if (!isOpen) return;

    if (editingIndex !== null && editingIndex !== undefined) {
      setNewEmployee({
        name: editingIndex?.name || "",
        email: editingIndex?.email || "",
        password: "",
        position: editingIndex?.position || "",
        phone: editingIndex?.phone || "",
        user_id: userId,
        referred_by: editingIndex?.referred_by || "",
        alternative_number: editingIndex?.alternative_number || "",
        dob: editingIndex?.dob || "",
        anniversary_date: editingIndex?.anniversary_date || "",
        office_business_name: editingIndex?.office_business_name || "",
        office_address: editingIndex?.office_address || "",
        nature_of_job: editingIndex?.nature_of_job || "",
        department: editingIndex?.department || "",
        designation: editingIndex?.designation || "",
        badge: editingIndex?.badge || "",
        salary: editingIndex?.salary || "",
        campaign: editingIndex?.campaign || "",
        interest_in_project_secondary: editingIndex?.interest_in_project_secondary || "",
        lead_sub_source: editingIndex?.lead_sub_source || "",
        budget: editingIndex?.budget || "",
        primary_status: editingIndex?.primary_status || "",
        secondary_status: editingIndex?.secondary_status || "",
        lead_review: editingIndex?.lead_review || "",
      });
    } else {
      setNewEmployee({
        name: "",
        email: "",
        password: "",
        position: "",
        phone: "",
        user_id: userId,
        referred_by: "",
        alternative_number: "",
        dob: "",
        anniversary_date: "",
        office_business_name: "",
        office_address: "",
        nature_of_job: "",
        department: "",
        designation: "",
        badge: "",
        salary: "",
        campaign: "",
        interest_in_project_secondary: "",
        lead_sub_source: "",
        budget: "",
        primary_status: "",
        secondary_status: "",
        lead_review: "",
      });
    }
  }, [editingIndex, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone" || name === "alternative_number") {
      const numericValue = value.replace(/[^0-9]/g, "").slice(0, 10);
      setNewEmployee((prev) => ({ ...prev, [name]: numericValue }));
    } else {
      setNewEmployee((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingIndex !== null) {
        await axios.put(
          `http://localhost:9000/api/updateEmployee/${editingIndex?.employeeId}`,
          newEmployee,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        toast.success("Data updated successfully");
      } else {
        await axios.post(
          "http://localhost:9000/api/addEmployee",
          newEmployee,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        toast.success("Data added successfully");
      }
      setNewEmployee({
        name: "",
        email: "",
        password: "",
        position: "",
        phone: "",
        user_id: userId,
        referred_by: "",
        alternative_number: "",
        dob: "",
        anniversary_date: "",
        office_business_name: "",
        office_address: "",
        nature_of_job: "",
        department: "",
        designation: "",
        badge: "",
        salary: "",
        campaign: "",
        interest_in_project_secondary: "",
        lead_sub_source: "",
        budget: "",
        primary_status: "",
        secondary_status: "",
        lead_review: "",
      });

      fetchEmployees();
      setLoading(false);
      onClose();
    } catch (error) {
      console.error(
        "Error saving employee:",
        error.response?.data || error.message
      );
      toast.error(error.response?.data?.message || "Error saving employee");
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEditingIndex(null);
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.9, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.25 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b pb-3">
              <h2 className="text-2xl font-bold text-cyan-700 font-sans">
                {editingIndex !== null ? "Edit Employee" : "Add Employee"}
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-red-500 transition p-1 rounded-full hover:bg-gray-100"
              >
                <IoCloseSharp className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEmployee} className="space-y-6">
              {/* Section 1: Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 pb-1 border-b border-gray-100">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Name */}
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm font-semibold text-gray-700">Name</label>
                    <input
                      required
                      type="text"
                      name="name"
                      value={newEmployee.name}
                      onChange={handleInputChange}
                      placeholder="Enter Full Name"
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                    />
                  </div>

                  {/* Email */}
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm font-semibold text-gray-700">Email</label>
                    <input
                      required
                      type="email"
                      name="email"
                      value={newEmployee.email}
                      onChange={handleInputChange}
                      placeholder="Enter Email Address"
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                    />
                  </div>

                  {/* Password */}
                  <div className="flex flex-col relative">
                    <label className="mb-1 text-sm font-semibold text-gray-700">Password</label>
                    <input
                      required={editingIndex === null}
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={newEmployee.password}
                      onChange={handleInputChange}
                      placeholder={editingIndex !== null ? "Leave blank to keep same" : "Enter Password"}
                      className="p-2 border border-gray-300 rounded-lg pr-10 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-8 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <IoEyeOff size={20} /> : <IoEye size={20} />}
                    </button>
                  </div>

                  {/* Phone */}
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm font-semibold text-gray-700">Phone</label>
                    <input
                      required
                      type="text"
                      name="phone"
                      value={newEmployee.phone}
                      onChange={handleInputChange}
                      placeholder="Enter 10-digit Phone"
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                    />
                  </div>

                  {/* Alternative Phone */}
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm font-semibold text-gray-700">Alternative Phone</label>
                    <input
                      type="text"
                      name="alternative_number"
                      value={newEmployee.alternative_number}
                      onChange={handleInputChange}
                      placeholder="Alternative Phone (optional)"
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                    />
                  </div>

                  {/* Employee Position */}
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm font-semibold text-gray-700">Position</label>
                    <input
                      type="text"
                      name="position"
                      value={newEmployee.position}
                      onChange={handleInputChange}
                      placeholder="Employee Position"
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                    />
                  </div>

                  {/* Date of Birth */}
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm font-semibold text-gray-700">Date of Birth</label>
                    <input
                      type="date"
                      name="dob"
                      value={newEmployee.dob}
                      onChange={handleInputChange}
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none bg-white"
                    />
                  </div>

                  {/* Anniversary Date */}
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm font-semibold text-gray-700">Anniversary Date</label>
                    <input
                      type="date"
                      name="anniversary_date"
                      value={newEmployee.anniversary_date}
                      onChange={handleInputChange}
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Professional Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 pb-1 border-b border-gray-100">
                  Professional & Employment Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Department */}
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm font-semibold text-gray-700">Department</label>
                    <select
                      name="department"
                      value={newEmployee.department}
                      onChange={handleInputChange}
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none bg-white"
                    >
                      <option value="">Select Department</option>
                      {getDepartmentOptions(newEmployee.nature_of_job).map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Designation */}
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm font-semibold text-gray-700">Designation</label>
                    <select
                      name="designation"
                      value={newEmployee.designation}
                      onChange={handleInputChange}
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none bg-white"
                    >
                      <option value="">Select Designation</option>
                      {designationOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Badge */}
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm font-semibold text-gray-700">Badge</label>
                    <select
                      name="badge"
                      value={newEmployee.badge}
                      onChange={handleInputChange}
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none bg-white"
                    >
                      <option value="">Select Badge</option>
                      {badgeOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Salary */}
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm font-semibold text-gray-700">Salary</label>
                    <input
                      type="text"
                      name="salary"
                      value={newEmployee.salary}
                      onChange={handleInputChange}
                      placeholder="e.g. 50000"
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                    />
                  </div>

                  {/* Nature of Job */}
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm font-semibold text-gray-700">Nature Of Job</label>
                    <select
                      name="nature_of_job"
                      value={newEmployee.nature_of_job}
                      onChange={handleInputChange}
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none bg-white"
                    >
                      <option value="">Select Nature Of Job</option>
                      {jobNatureOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Budget */}
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm font-semibold text-gray-700">Budget Range</label>
                    <input
                      type="text"
                      name="budget"
                      value={newEmployee.budget}
                      onChange={handleInputChange}
                      placeholder="e.g. 5-10 Lakhs"
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Office & Location Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 pb-1 border-b border-gray-100">
                  Office & Location Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Office Business Name */}
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm font-semibold text-gray-700">Office Business Name</label>
                    <input
                      type="text"
                      name="office_business_name"
                      value={newEmployee.office_business_name}
                      onChange={handleInputChange}
                      placeholder="Enter business name"
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                    />
                  </div>

                  {/* Office Address */}
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm font-semibold text-gray-700">Office Address</label>
                    <input
                      type="text"
                      name="office_address"
                      value={newEmployee.office_address}
                      onChange={handleInputChange}
                      placeholder="Enter full office address"
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Lead/Marketing Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 pb-1 border-b border-gray-100">
                  Marketing & Referral Info
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Referred By */}
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm font-semibold text-gray-700">Referred By</label>
                    <input
                      type="text"
                      name="referred_by"
                      value={newEmployee.referred_by}
                      onChange={handleInputChange}
                      placeholder="Referred By"
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                    />
                  </div>

                  {/* Campaign */}
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm font-semibold text-gray-700">Campaign</label>
                    <select
                      name="campaign"
                      value={newEmployee.campaign}
                      onChange={handleInputChange}
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none bg-white"
                    >
                      <option value="">Select Campaign</option>
                      {campaignOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Lead Sub Source */}
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm font-semibold text-gray-700">Sub Source</label>
                    <select
                      name="lead_sub_source"
                      value={newEmployee.lead_sub_source}
                      onChange={handleInputChange}
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none bg-white"
                    >
                      <option value="">Select Sub Source</option>
                      {getLeadSubSourceOptions(newEmployee.leadSource).map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Secondary Project Interest */}
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm font-semibold text-gray-700">Secondary Project Interest</label>
                    <input
                      type="text"
                      name="interest_in_project_secondary"
                      value={newEmployee.interest_in_project_secondary}
                      onChange={handleInputChange}
                      placeholder="e.g. Project B"
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: Status Tracking & Review */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 pb-1 border-b border-gray-100">
                  Status Tracking & Reviews
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Primary Status */}
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm font-semibold text-gray-700">Primary Status</label>
                    <select
                      name="primary_status"
                      value={newEmployee.primary_status}
                      onChange={handleInputChange}
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none bg-white"
                    >
                      <option value="">Select Primary Status</option>
                      {primaryStatusOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Secondary Status */}
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm font-semibold text-gray-700">Secondary Status</label>
                    <select
                      name="secondary_status"
                      value={newEmployee.secondary_status}
                      onChange={handleInputChange}
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none bg-white"
                    >
                      <option value="">Select Secondary Status</option>
                      {(() => {
                        const pStatus = (newEmployee.primary_status || "").toLowerCase().trim();
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
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Employee Review / Notes */}
                  <div className="flex flex-col md:col-span-3">
                    <label className="mb-1 text-sm font-semibold text-gray-700">Employee Review & Notes</label>
                    <textarea
                      name="lead_review"
                      value={newEmployee.lead_review}
                      onChange={handleInputChange}
                      placeholder="Add review notes, comments or performance feedback..."
                      rows={3}
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end pt-4 border-t gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2 text-white bg-gray-500 rounded-lg hover:bg-gray-600 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 font-semibold shadow transition"
                >
                  {loading
                    ? "Saving...."
                    : editingIndex !== null
                      ? "Update Employee"
                      : "Add Employee"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddEditEmployeePopup;
