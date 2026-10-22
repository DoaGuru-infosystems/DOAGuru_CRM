import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginUser } from "../store/UserSlice";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { FaCrown, FaArrowLeft } from "react-icons/fa";
import { MdEmail, MdLock } from "react-icons/md";

const OneLoginOnly = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [popupVisible, setPopupVisible] = useState(false);
  const [localhost, setLocalhost] = useState([]);
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        "https://crm-generalize.siarasystems.com/api/OneOnlylogin",
        { email, password },
      );

      if (res.data.success === true) {
        const userData = res.data.user;
        setLocalhost(userData);

        await new Promise((resolve) => setTimeout(resolve, 100));

        dispatch(loginUser(userData));
        toast.success("Login successfully");
        navigate("/dashboard");
      } else {
        toast.error("Login failed");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "failed to login");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const closeUpdatePopup = () => {
    setPopupVisible(false);
  };

  const Popup = ({ email, onClose }) => {
    const [otp, setOtp] = useState("");

    const verifyOtpAdmin = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        await axios.post(
          "https://crm-generalize.siarasystems.com/api/verifyOtp-superadmin",
          { email, otp },
        );
        dispatch(loginUser(localhost));
        setLoading(false);
        navigate("/dashboard");
        toast.success("OTP verified successfully");
        toast.success("Login successfully");
      } catch (error) {
        setLoading(false);
        toast.error("Wrong OTP!");
      }
    };

    return (
      <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xl max-w-sm w-full">
          <form onSubmit={verifyOtpAdmin} className="flex flex-col space-y-4">
            <h3 className="text-lg font-bold text-neutral-900">
              Enter Verification Code
            </h3>
            <p className="text-xs text-neutral-500">
              We sent a security code to {email}.
            </p>
            <input
              type="text"
              placeholder="000 000"
              className="w-full text-center tracking-widest font-mono text-lg bg-neutral-50 border border-neutral-200 rounded-xl py-3 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:border-transparent"
              name="otp"
              value={otp}
              required
              onChange={(e) => setOtp(e.target.value)}
            />
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify"}
              </button>
              <button
                type="button"
                className="flex-1 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
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
            <div className="inline-flex items-center justify-center w-12 h-12 bg-neutral-900 text-white rounded-xl mb-4 shadow-sm">
              <FaCrown className="text-lg" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight mb-1">
              CRMGuru
            </h1>
            <p className="text-neutral-500 text-xs font-normal">
              Enter your credentials to access the CRM console
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-neutral-700 text-xs font-semibold flex items-center gap-1.5"
              >
                <MdEmail className="text-neutral-400" />
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="name@company.com"
                className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:border-transparent transition-all"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-neutral-700 text-xs font-semibold flex items-center gap-1.5"
              >
                <MdLock className="text-neutral-400" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:border-transparent transition-all pr-10"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <AiFillEye className="text-lg" />
                  ) : (
                    <AiFillEyeInvisible className="text-lg" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-xl shadow-sm text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </button>

            {/* Forgot Password */}
            <div className="text-center pt-2">
              <Link
                to="/reset-password"
                className="text-xs font-medium text-neutral-500 hover:text-neutral-900 hover:underline transition-colors"
              >
                Forgot your password?
              </Link>
            </div>
          </form>

          {/* Register link */}
          <div className="mt-6 pt-6 border-t border-neutral-100 text-center">
            <p className="text-xs text-neutral-500">
              Don't have an account?{" "}
              <a
                href="https://crm.doaguru.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-neutral-900 hover:underline"
              >
                Register here
              </a>
            </p>
          </div>
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

      {popupVisible && <Popup email={email} onClose={closeUpdatePopup} />}
    </div>
  );
};

export default OneLoginOnly;
