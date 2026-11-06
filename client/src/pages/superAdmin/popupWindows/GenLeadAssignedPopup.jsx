import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { IoCloseSharp } from "react-icons/io5";

const GenLeadAssignedPopup = ({
  isOpen,
  onClose,
  lead,
  fetchLeads,
  selectedLeads = [],
}) => {
  const modalRef = useRef();
  const user = useSelector((state) => state.auth.user);
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);

  const fetchAllStaff = async () => {
    try {
      const { data } = await axios.get(
        `http://localhost:9000/api/getEmployeeByOrg/${user?.staff_org_id}`,
        {
          headers: { Authorization: `Bearer ${user?.token}` },
        }
      );
      setStaff(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching staff:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAllStaff();
      setSelectedStaffIds([]);
    }
  }, [isOpen]);

  const toggleStaffSelection = (staffId) => {
    const id = Number(staffId);
    setSelectedStaffIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedStaffIds.length === staff.length) {
      setSelectedStaffIds([]);
    } else {
      setSelectedStaffIds(staff.map((s) => Number(s.staff_id)));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaffIds || selectedStaffIds.length === 0) {
      toast.error("Please select at least one staff member to assign");
      return;
    }

    const leadIdsToAssign =
      selectedLeads && selectedLeads.length > 0
        ? selectedLeads
        : lead?.lead_id
        ? [lead.lead_id]
        : [];

    if (leadIdsToAssign.length === 0) {
      toast.error("No leads selected for assignment");
      return;
    }

    setLoading(true);

    try {
      if (leadIdsToAssign.length === 1) {
        // Single lead assignment
        const leadId = leadIdsToAssign[0];
        const res = await axios.put(
          `http://localhost:9000/api/updateLeadAssignment/${leadId}`,
          {
            staffIds: selectedStaffIds,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${user?.token}`,
            },
          }
        );

        if (res.data?.success) {
          toast.success("Lead assigned successfully");
        } else {
          toast.success(res.data?.message || "Lead assignment updated");
        }
      } else {
        // Bulk lead assignment
        const res = await axios.post(
          "http://localhost:9000/api/leads/bulk-assign",
          {
            leadIds: leadIdsToAssign,
            staffIds: selectedStaffIds,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${user?.token}`,
            },
          }
        );

        const { assignedCount, skippedCount, message } = res.data;
        toast.success(
          message ||
            `Assigned: ${assignedCount} new assignments (${skippedCount} already had access)`
        );
      }

      if (typeof fetchLeads === "function") {
        fetchLeads();
      }
      onClose();
    } catch (error) {
      console.error("Assignment error:", error);
      toast.error(
        error.response?.data?.message || "Failed to update lead assignment"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const totalLeadsCount =
    selectedLeads && selectedLeads.length > 0
      ? selectedLeads.length
      : lead?.lead_id
      ? 1
      : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            ref={modalRef}
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            initial={{ scale: 0.95, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {totalLeadsCount > 1
                    ? `Assign ${totalLeadsCount} Selected Leads`
                    : "Assign Lead to Staff"}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Select one or more team members to assign these leads.
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
              >
                <IoCloseSharp size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4">
              {/* Staff Multi-Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Select Assignees ({selectedStaffIds.length} selected)
                  </label>
                  {staff.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-xs font-semibold text-cyan-600 hover:text-cyan-800"
                    >
                      {selectedStaffIds.length === staff.length
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                  )}
                </div>

                {/* Selected staff chips */}
                {selectedStaffIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3 p-2 bg-gray-50 rounded-lg border border-gray-200 max-h-24 overflow-y-auto">
                    {selectedStaffIds.map((id) => {
                      const member = staff.find(
                        (s) => Number(s.staff_id) === Number(id)
                      );
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800"
                        >
                          👤 {member ? member.staff_name : `Staff #${id}`}
                          <button
                            type="button"
                            onClick={() => toggleStaffSelection(id)}
                            className="text-cyan-600 hover:text-cyan-900 ml-0.5"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Staff member checkbox list */}
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-60 overflow-y-auto">
                  {staff.length === 0 ? (
                    <p className="p-4 text-center text-sm text-gray-400">
                      No staff members available.
                    </p>
                  ) : (
                    staff.map((s) => {
                      const isSelected = selectedStaffIds.includes(
                        Number(s.staff_id)
                      );
                      return (
                        <label
                          key={s.staff_id}
                          className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition ${
                            isSelected ? "bg-cyan-50/50" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleStaffSelection(s.staff_id)}
                              className="w-4 h-4 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-800">
                                {s.staff_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {s.staff_role} {s.staff_email ? `• ${s.staff_email}` : ""}
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

              {/* Action buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition shadow-sm disabled:opacity-50"
                  type="submit"
                  disabled={loading || selectedStaffIds.length === 0}
                >
                  {loading
                    ? "Assigning..."
                    : totalLeadsCount > 1
                    ? `Assign ${totalLeadsCount} Leads to ${selectedStaffIds.length} Staff`
                    : `Assign to ${selectedStaffIds.length} Staff`}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GenLeadAssignedPopup;
