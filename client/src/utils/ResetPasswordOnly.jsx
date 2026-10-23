import axios from "axios";
import toast from "react-hot-toast";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { MdEmail, MdLock } from "react-icons/md";

const ResetPasswordOnly = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(true);
  const [showVerify, setShowVerify] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendOtp = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      toast.error("OTP service temporarily disabled. Please contact administrator.");
    } catch (error) {
      setLoading(false);
      toast.error(error?.response?.data?.message || "Something went wrong");
    }
  };

  const verifyOtpAdmin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post(
        "http://localhost:9000/api/verifyOtp-superadmin",
        { email, otp }
      );
      setShowOtp(false);
      setShowVerify(false);
      setShowReset(true);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error("Wrong OTP!");
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.put(
        "http://localhost:9000/api/resetPasswordOnlyOne",
        { email, password: newPassword }
      );
      toast.success("Password updated successfully");
      navigate("/");
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error(error?.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col justify-between p-4 relative overflow-hidden">
      {/* Top Banner decoration */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neutral-200 via-neutral-800 to-neutral-200"></div>

      {/* Back button */}
      <div className="max-w-7xl mx-auto w-full pt-4">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors bg-white px-3 py-1.5 rounded-lg border border-neutral-200 shadow-sm"
        >
          <FaArrowLeft />
          Back to Portal
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-[420px] bg-white border border-neutral-200 rounded-2xl shadow-sm p-8 md:p-10 relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight mb-1">Reset Password</h1>
            <p className="text-neutral-500 text-xs font-normal">
              Recover your access to the CRMGuru dashboard
            </p>
          </div>

          {/* Send OTP */}
          {showOtp && (
            <form onSubmit={sendOtp} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-neutral-700 text-xs font-semibold flex items-center gap-1.5">
                  <MdEmail className="text-neutral-400" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:border-transparent transition-all"
                  placeholder="name@company.com"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-xl shadow-sm text-sm transition-all disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </form>
          )}

          {/* Verify OTP */}
          {showVerify && (
            <form onSubmit={verifyOtpAdmin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-neutral-700 text-xs font-semibold flex items-center gap-1.5">
                  <MdEmail className="text-neutral-400" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-400 text-sm cursor-not-allowed"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-neutral-700 text-xs font-semibold">
                  OTP Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:border-transparent transition-all"
                  placeholder="Enter OTP code"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-xl shadow-sm text-sm transition-all disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </form>
          )}

          {/* Reset Password */}
          {showReset && (
            <form onSubmit={changePassword} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-neutral-700 text-xs font-semibold flex items-center gap-1.5">
                  <MdLock className="text-neutral-400" />
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-xl shadow-sm text-sm transition-all disabled:opacity-50"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center max-w-md mx-auto w-full pt-4">
        <p className="text-neutral-400 text-[10px]">
          Powered by{" "}
          <a
            href="https://doaguru.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            Doaguru Infosystems
          </a>
        </p>
      </footer>
    </div>
  );
};

export default ResetPasswordOnly;
