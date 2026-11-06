import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import { IoCloseSharp } from "react-icons/io5";
import { useSelector } from "react-redux";

const BulkLeadUploadPopup = ({
  isOpen,
  onClose,
  fetchLeads,
  employees = [],
}) => {
  const modalRef = useRef();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const EmpId = useSelector((state) => state.auth.user);
  const token = EmpId?.token;
  const lead_org_id = EmpId?.staff_org_id;
  const isEmployee = EmpId?.staff_role === "employee";

  const [selectedStaffIds, setSelectedStaffIds] = useState([]);

  // Close popup when clicking outside or pressing ESC
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        handleClose();
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") handleClose();
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleClose = () => {
    setFile(null);
    setSelectedStaffIds([]);
    onClose();
  };

  const handleDownloadSample = () => {
    const sampleUrl = "http://localhost:9000/api/download-sample-bulk-lead";
    const link = document.createElement("a");
    link.href = sampleUrl;
    link.download = "sample_leads_upload.xlsx";
    link.click();
  };

  const toggleStaffSelection = (staffId) => {
    const id = Number(staffId);
    setSelectedStaffIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  // Staff options: For employees, exclude self and non-employees. For admins, all staff.
  const eligibleStaff = employees.filter((emp) => {
    if (isEmployee) {
      return (
        Number(emp.staff_id) !== Number(EmpId?.staff_id) &&
        emp.staff_role === "employee"
      );
    }
    return true;
  });

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) return toast.error("Please select an Excel file (.xlsx or .xls)");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("lead_org_id", lead_org_id);

    if (isEmployee) {
      // Employee shares with selected colleagues
      if (selectedStaffIds.length > 0) {
        formData.append("shareWith", JSON.stringify(selectedStaffIds));
      }
    } else {
      // Admin/SuperAdmin assigns to staff
      if (selectedStaffIds.length > 0) {
        formData.append("staffIds", JSON.stringify(selectedStaffIds));
        formData.append("assignedTo", selectedStaffIds[0]);
      }
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:9000/api/bulk-upload-leads",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const inserted = response.data?.inserted ?? 0;
      const skipped = response.data?.skipped ?? 0;
      toast.success(
        response.data?.message ||
          `Upload complete: ${inserted} leads inserted, ${skipped} skipped.`
      );
      if (typeof fetchLeads === "function") fetchLeads();
      handleClose();
    } catch (error) {
      console.error("Bulk upload error:", error);
      toast.error(error.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.95, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Bulk Upload Leads
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Import multiple leads from an Excel file (.xlsx, .xls)
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-red-500 transition p-1 rounded-lg"
              >
                <IoCloseSharp className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUpload} className="space-y-4 flex-1 overflow-y-auto pr-1">
              {/* File Upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Select Excel File *
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  required
                />
              </div>

              {/* Download Sample */}
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="text-xs text-gray-600">
                  Need the template format?
                </span>
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="text-cyan-600 text-xs font-semibold hover:underline"
                >
                  Download Sample Excel
                </button>
              </div>

              {/* Multi-Select Assignees / Share With */}
              {eligibleStaff.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      {isEmployee
                        ? `Share With Colleagues (Optional - ${selectedStaffIds.length} selected)`
                        : `Assign To Staff (Optional - ${selectedStaffIds.length} selected)`}
                    </label>
                    {selectedStaffIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedStaffIds([])}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Chips of selected staff */}
                  {selectedStaffIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2 p-2 bg-gray-50 rounded-lg border border-gray-200 max-h-24 overflow-y-auto">
                      {selectedStaffIds.map((sid) => {
                        const st = eligibleStaff.find(
                          (e) => Number(e.staff_id) === Number(sid)
                        );
                        return (
                          <span
                            key={sid}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800"
                          >
                            👤 {st ? st.staff_name : `Staff #${sid}`}
                            <button
                              type="button"
                              onClick={() => toggleStaffSelection(sid)}
                              className="text-cyan-700 hover:text-red-600 font-bold ml-1 leading-none"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Checkbox list */}
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-40 overflow-y-auto text-xs">
                    {eligibleStaff.map((emp) => {
                      const isChecked = selectedStaffIds.includes(
                        Number(emp.staff_id)
                      );
                      return (
                        <label
                          key={emp.staff_id}
                          className={`flex items-center justify-between p-2.5 cursor-pointer hover:bg-gray-50 transition ${
                            isChecked ? "bg-cyan-50/50" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleStaffSelection(emp.staff_id)}
                              className="w-3.5 h-3.5 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500"
                            />
                            <div>
                              <p className="font-medium text-gray-800">
                                {emp.staff_name}
                              </p>
                              <p className="text-[11px] text-gray-500">
                                {emp.staff_role} {emp.staff_email ? `• ${emp.staff_email}` : ""}
                              </p>
                            </div>
                          </div>
                          {isChecked && (
                            <span className="text-[11px] font-medium text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded">
                              Selected
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Upload Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !file}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                >
                  {loading ? "Uploading..." : "Upload Leads"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BulkLeadUploadPopup;
