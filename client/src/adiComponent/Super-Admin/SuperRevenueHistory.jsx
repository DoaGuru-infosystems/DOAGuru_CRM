import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import {
  FaRupeeSign,
  FaFileInvoiceDollar,
  FaMoneyBillWave,
  FaClock,
  FaSyncAlt,
  FaSearch,
  FaChevronDown,
  FaChevronUp,
  FaReceipt,
  FaUsers,
  FaPercentage,
} from "react-icons/fa";

const formatINR = (val) => {
  const num = Number(val) || 0;
  return "₹" + num.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
};

const SuperRevenueHistory = () => {
  const superadminuser = useSelector((state) => state.auth.user);
  const token = superadminuser?.token;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("ledger"); // "ledger" | "invoices"

  // Filter states
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [billTypeFilter, setBillTypeFilter] = useState("ALL"); // "ALL" | "GST" | "NON_GST"

  const fetchRevenueHistory = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // Primary: backend proxy with superadmin authorization
      const res = await axios.get("http://localhost:9000/api/super-admin-revenue-history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data) {
        setData(res.data);
      } else {
        throw new Error("No data returned");
      }
    } catch (err) {
      console.warn("Backend proxy failed, trying direct external fetch as fallback...", err.message);
      try {
        const directRes = await axios.get(
          "https://dmcalculator.siarasystems.com/auth/api/re_calculator/revenue/history",
          { timeout: 8000 }
        );
        setData(directRes.data);
      } catch (fallbackErr) {
        console.error("Revenue fetch failed completely:", fallbackErr.message);
        setError("Unable to load revenue history. Please try again later.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRevenueHistory();
  }, []);

  const totals = data?.totals || {
    totalInvoiced: 0,
    totalReceived: 0,
    totalServiceRevenue: 0,
    totalAdBudgetCollected: 0,
    totalPending: 0,
    totalTds: 0,
  };

  const clientLedger = useMemo(() => {
    if (!data?.clientLedger) return [];
    if (!ledgerSearch.trim()) return data.clientLedger;
    const q = ledgerSearch.toLowerCase();
    return data.clientLedger.filter(
      (c) =>
        (c.client_name && c.client_name.toLowerCase().includes(q)) ||
        String(c.client_id).includes(q)
    );
  }, [data, ledgerSearch]);

  const invoices = useMemo(() => {
    if (!data?.invoices) return [];
    return data.invoices.filter((inv) => {
      const matchType =
        billTypeFilter === "ALL" ||
        (inv.bill_type && inv.bill_type.toUpperCase() === billTypeFilter);
      if (!matchType) return false;

      if (!invoiceSearch.trim()) return true;
      const q = invoiceSearch.toLowerCase();
      return (
        (inv.client_name && inv.client_name.toLowerCase().includes(q)) ||
        (inv.bill_number && String(inv.bill_number).toLowerCase().includes(q)) ||
        (inv.txn_id && String(inv.txn_id).includes(q))
      );
    });
  }, [data, invoiceSearch, billTypeFilter]);

  const collectionPercent =
    totals.totalInvoiced > 0
      ? Math.min(100, Math.round((totals.totalReceived / totals.totalInvoiced) * 100))
      : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6 transition-all duration-300">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 text-xl flex items-center justify-center">
            <FaMoneyBillWave />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-800">
                Revenue & Financial Overview
              </h3>
              <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                RE Calculator Live
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Real-time billing, collection, and client ledger statistics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchRevenueHistory(true)}
            disabled={loading || refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-xs disabled:opacity-50"
            title="Refresh revenue data"
          >
            <FaSyncAlt className={refreshing ? "animate-spin text-emerald-600" : ""} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            title={isCollapsed ? "Expand section" : "Collapse section"}
          >
            {isCollapsed ? <FaChevronDown /> : <FaChevronUp />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-4 sm:p-6 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => fetchRevenueHistory(true)}
                className="text-xs font-bold underline ml-3"
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-3">
              <FaSyncAlt className="animate-spin text-3xl text-emerald-500" />
              <p className="text-sm font-medium">Loading financial history...</p>
            </div>
          ) : (
            <>
              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* 1. Total Invoiced */}
                <div className="bg-gradient-to-br from-blue-50/50 to-white border border-blue-100 rounded-xl p-3.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                      Total Invoiced
                    </span>
                    <FaFileInvoiceDollar className="text-blue-500 text-sm" />
                  </div>
                  <div className="text-xl font-extrabold text-gray-900 mt-2">
                    {formatINR(totals.totalInvoiced)}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">Gross billed amount</div>
                </div>

                {/* 2. Total Received */}
                <div className="bg-gradient-to-br from-emerald-50/50 to-white border border-emerald-100 rounded-xl p-3.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      Total Received
                    </span>
                    <FaRupeeSign className="text-emerald-500 text-sm" />
                  </div>
                  <div className="text-xl font-extrabold text-emerald-700 mt-2">
                    {formatINR(totals.totalReceived)}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
                    {collectionPercent}% collected
                  </div>
                </div>

                {/* 3. Total Pending */}
                <div className="bg-gradient-to-br from-rose-50/50 to-white border border-rose-100 rounded-xl p-3.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
                      Total Pending
                    </span>
                    <FaClock className="text-rose-500 text-sm" />
                  </div>
                  <div className="text-xl font-extrabold text-rose-600 mt-2">
                    {formatINR(totals.totalPending)}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">Outstanding balance</div>
                </div>

                {/* 4. Service Revenue */}
                <div className="bg-gradient-to-br from-teal-50/50 to-white border border-teal-100 rounded-xl p-3.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                      Service Revenue
                    </span>
                    <FaReceipt className="text-teal-500 text-sm" />
                  </div>
                  <div className="text-xl font-extrabold text-gray-900 mt-2">
                    {formatINR(totals.totalServiceRevenue)}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">Retainer & service fee</div>
                </div>

                {/* 5. Ad Budget */}
                <div className="bg-gradient-to-br from-indigo-50/50 to-white border border-indigo-100 rounded-xl p-3.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                      Ad Budget
                    </span>
                    <FaPercentage className="text-indigo-500 text-sm" />
                  </div>
                  <div className="text-xl font-extrabold text-gray-900 mt-2">
                    {formatINR(totals.totalAdBudgetCollected)}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">Campaign ad budget</div>
                </div>

                {/* 6. Total TDS */}
                <div className="bg-gradient-to-br from-purple-50/50 to-white border border-purple-100 rounded-xl p-3.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
                      Total TDS
                    </span>
                    <FaReceipt className="text-purple-500 text-sm" />
                  </div>
                  <div className="text-xl font-extrabold text-purple-700 mt-2">
                    {formatINR(totals.totalTds)}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">Tax deducted at source</div>
                </div>
              </div>

              {/* Collection Progress Bar */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <div className="flex justify-between items-center text-xs font-semibold text-gray-700 mb-1.5">
                  <span>Overall Collection Efficiency</span>
                  <span className="text-emerald-700 font-bold">
                    {collectionPercent}% ({formatINR(totals.totalReceived)} / {formatINR(totals.totalInvoiced)})
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${collectionPercent}%` }}
                    title={`Received: ${formatINR(totals.totalReceived)}`}
                  ></div>
                  <div
                    className="h-full bg-rose-400 transition-all duration-500"
                    style={{ width: `${100 - collectionPercent}%` }}
                    title={`Pending: ${formatINR(totals.totalPending)}`}
                  ></div>
                </div>
              </div>

              {/* Sub-Tabs: Client Ledger vs Invoices */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab("ledger")}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                        activeTab === "ledger"
                          ? "bg-white text-emerald-700 shadow-xs border border-slate-200"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <FaUsers />
                      <span>Client Ledger ({data?.clientLedger?.length || 0})</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("invoices")}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                        activeTab === "invoices"
                          ? "bg-white text-emerald-700 shadow-xs border border-slate-200"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <FaReceipt />
                      <span>Invoices / Txns ({data?.invoices?.length || 0})</span>
                    </button>
                  </div>

                  {/* Tab-specific Search & Filter */}
                  {activeTab === "ledger" ? (
                    <div className="relative min-w-[200px] sm:min-w-[240px]">
                      <FaSearch className="absolute left-3 top-2.5 text-gray-400 text-xs" />
                      <input
                        type="text"
                        placeholder="Search client by name or ID..."
                        value={ledgerSearch}
                        onChange={(e) => setLedgerSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-500"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={billTypeFilter}
                        onChange={(e) => setBillTypeFilter(e.target.value)}
                        className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-gray-700 focus:outline-hidden"
                      >
                        <option value="ALL">All Types</option>
                        <option value="GST">GST</option>
                        <option value="NON_GST">NON-GST</option>
                      </select>
                      <div className="relative min-w-[180px]">
                        <FaSearch className="absolute left-3 top-2.5 text-gray-400 text-xs" />
                        <input
                          type="text"
                          placeholder="Search bill or client..."
                          value={invoiceSearch}
                          onChange={(e) => setInvoiceSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Content Area */}
                {activeTab === "ledger" ? (
                  <div className="overflow-x-auto max-h-[380px]">
                    <table className="min-w-full text-left text-xs divide-y divide-slate-200">
                      <thead className="bg-slate-100/70 text-gray-600 font-semibold uppercase tracking-wider sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-2.5">Client Name</th>
                          <th className="px-3 py-2.5 text-center">Invoices</th>
                          <th className="px-3 py-2.5 text-center">Proformas</th>
                          <th className="px-3 py-2.5 text-right">Total Amount</th>
                          <th className="px-3 py-2.5 text-right">Received</th>
                          <th className="px-3 py-2.5 text-right">Service Rev</th>
                          <th className="px-3 py-2.5 text-right">Ad Budget</th>
                          <th className="px-4 py-2.5 text-right">Pending</th>
                          <th className="px-3 py-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {clientLedger.length > 0 ? (
                          clientLedger.map((client) => {
                            const isPaid = Number(client.total_pending) <= 0 && Number(client.total_amount) > 0;
                            const isPartial = Number(client.total_received) > 0 && Number(client.total_pending) > 0;
                            return (
                              <tr
                                key={client.client_id}
                                className="hover:bg-slate-50/70 transition"
                              >
                                <td className="px-4 py-2.5 font-semibold text-gray-800">
                                  {client.client_name || `Client #${client.client_id}`}
                                </td>
                                <td className="px-3 py-2.5 text-center text-gray-600">
                                  {client.invoices_count || 0}
                                </td>
                                <td className="px-3 py-2.5 text-center text-gray-600">
                                  {client.proformas_count || 0}
                                </td>
                                <td className="px-3 py-2.5 text-right font-medium text-gray-900">
                                  {formatINR(client.total_amount)}
                                </td>
                                <td className="px-3 py-2.5 text-right font-medium text-emerald-700">
                                  {formatINR(client.total_received)}
                                </td>
                                <td className="px-3 py-2.5 text-right text-gray-600">
                                  {formatINR(client.total_service_revenue)}
                                </td>
                                <td className="px-3 py-2.5 text-right text-gray-600">
                                  {formatINR(client.total_ad_budget_collected)}
                                </td>
                                <td
                                  className={`px-4 py-2.5 text-right font-bold ${
                                    Number(client.total_pending) > 0
                                      ? "text-rose-600"
                                      : "text-emerald-600"
                                  }`}
                                >
                                  {formatINR(client.total_pending)}
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  {isPaid ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                      Paid
                                    </span>
                                  ) : isPartial ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                      Partial
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                      Unpaid
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="9" className="text-center py-6 text-gray-400">
                              No client records found matching criteria
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[380px]">
                    <table className="min-w-full text-left text-xs divide-y divide-slate-200">
                      <thead className="bg-slate-100/70 text-gray-600 font-semibold uppercase tracking-wider sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-2.5">Bill #</th>
                          <th className="px-4 py-2.5">Client Name</th>
                          <th className="px-3 py-2.5 text-center">Type</th>
                          <th className="px-3 py-2.5 text-right">Base Amt</th>
                          <th className="px-3 py-2.5 text-right">GST</th>
                          <th className="px-3 py-2.5 text-right">TDS</th>
                          <th className="px-3 py-2.5 text-right">Received</th>
                          <th className="px-3 py-2.5 text-right">Balance</th>
                          <th className="px-4 py-2.5 text-center">Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {invoices.length > 0 ? (
                          invoices.map((inv, idx) => (
                            <tr
                              key={inv.txn_id || idx}
                              className="hover:bg-slate-50/70 transition"
                            >
                              <td className="px-4 py-2.5 font-mono text-gray-800 font-bold">
                                {inv.bill_number || "-"}
                              </td>
                              <td className="px-4 py-2.5 font-medium text-gray-800">
                                {inv.client_name || `Client #${inv.client_id}`}
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    inv.bill_type === "GST"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {inv.bill_type || "N/A"}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-right font-medium text-gray-700">
                                {formatINR(inv.base_amount)}
                              </td>
                              <td className="px-3 py-2.5 text-right text-gray-600">
                                {formatINR(inv.gst_amount)}
                              </td>
                              <td className="px-3 py-2.5 text-right text-purple-700">
                                {formatINR(inv.tds_amount)}
                              </td>
                              <td className="px-3 py-2.5 text-right font-semibold text-emerald-700">
                                {formatINR(inv.received_amt)}
                              </td>
                              <td
                                className={`px-3 py-2.5 text-right font-bold ${
                                  Number(inv.current_amt) > 0
                                    ? "text-rose-600"
                                    : "text-emerald-600"
                                }`}
                              >
                                {formatINR(inv.current_amt)}
                              </td>
                              <td className="px-4 py-2.5 text-center text-gray-500 text-[11px] whitespace-nowrap">
                                {inv.created_at ? inv.created_at.split(" ")[0] : "-"}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="9" className="text-center py-6 text-gray-400">
                              No invoices or transactions found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SuperRevenueHistory;

