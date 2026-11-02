import React, { useState, useRef, useEffect } from "react";
import { BsColumnsGap } from "react-icons/bs";
import { FiRotateCcw } from "react-icons/fi";

const ColumnCustomizer = ({
  columns = [],
  visibleColumns = [],
  toggleColumn,
  resetToDefault,
  buttonClassName = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const totalVisible = visibleColumns.length;
  const totalColumns = columns.length;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={
          buttonClassName ||
          "flex items-center gap-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold shadow-xs transition duration-200"
        }
        title="Customize Columns"
        aria-expanded={isOpen}
      >
        <BsColumnsGap className="text-cyan-700 text-sm sm:text-base" />
        <span>Columns</span>
        <span className="bg-cyan-100 text-cyan-800 text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-full">
          {totalVisible}/{totalColumns}
        </span>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[92vw] bg-white rounded-xl shadow-xl border border-gray-200 z-50 p-3 animate-in fade-in zoom-in-95 duration-100"
          style={{ maxHeight: "calc(100vh - 120px)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Customize Columns
            </span>
            <button
              type="button"
              onClick={resetToDefault}
              className="flex items-center gap-1 text-[11px] text-cyan-600 hover:text-cyan-800 font-semibold transition"
              title="Reset columns to default"
            >
              <FiRotateCcw className="text-xs" />
              Reset to default
            </button>
          </div>

          {/* Column Checkboxes List */}
          <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
            {columns.map((col) => {
              const isChecked = visibleColumns.includes(col.key);
              const isLocked = Boolean(col.locked);

              return (
                <label
                  key={col.key}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition select-none ${
                    isLocked
                      ? "bg-gray-50 text-gray-500 cursor-not-allowed"
                      : "hover:bg-cyan-50 text-gray-700 cursor-pointer"
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isLocked}
                      onChange={() => toggleColumn(col.key)}
                      className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <span className="font-medium truncate">{col.label}</span>
                  </span>
                  {isLocked && (
                    <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                      Locked
                    </span>
                  )}
                </label>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="pt-2 mt-2 border-t border-gray-100 text-[10px] text-gray-400 text-center">
            Locked columns are always visible
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnCustomizer;

