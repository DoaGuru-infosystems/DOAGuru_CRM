import React from "react";
import { Link } from "react-router-dom";
import { FaUserShield, FaUsers, FaCrown } from "react-icons/fa";

const Landingpage = () => {
  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col justify-between">
      {/* Top Decoration */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neutral-200 via-neutral-800 to-neutral-200"></div>

      {/* Header Section */}
      <div className="container mx-auto px-6 py-16 md:py-24 max-w-7xl">
        <div className="text-center mb-16 md:mb-20">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-white border border-neutral-200 rounded-full text-neutral-800 mb-6 shadow-sm">
            <span className="w-1.5 h-1.5 bg-neutral-800 rounded-full animate-pulse"></span>
            Enterprise Portal
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-neutral-900 tracking-tight mb-6">
            Welcome to{" "}
            <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neutral-950 via-neutral-800 to-neutral-900">
              CRM Platform
            </span>
          </h1>
          <p className="text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed font-normal">
            Streamline your customer relations, manage teams, and optimize operational pipelines from one unified interface.
          </p>
        </div>

        {/* Cards Section */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Super Admin Card */}
            <Link to="/SuperAdmin-login" className="group block">
              <div className="h-full bg-white border border-neutral-200 rounded-2xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                <div>
                  {/* Icon */}
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-neutral-100 border border-neutral-200 rounded-xl mb-6 group-hover:bg-neutral-900 group-hover:text-white transition-all duration-300">
                    <FaCrown className="text-xl text-neutral-800 group-hover:text-white transition-colors" />
                  </div>
                  
                  {/* Titles */}
                  <h3 className="text-xl font-bold text-neutral-900 mb-1">
                    Super Admin
                  </h3>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">
                    Full System Access
                  </p>
                  
                  {/* Description */}
                  <p className="text-neutral-600 text-sm mb-6 leading-relaxed">
                    Complete administrative oversight. Manage multi-tenant organization settings, subscriptions, and security rules.
                  </p>
                </div>
                
                <div>
                  {/* Features */}
                  <div className="space-y-2 mb-8 pt-4 border-t border-neutral-100">
                    <div className="flex items-center text-xs text-neutral-500">
                      <span className="w-1.5 h-1.5 bg-neutral-900 rounded-full mr-2.5"></span>
                      System Configuration
                    </div>
                    <div className="flex items-center text-xs text-neutral-500">
                      <span className="w-1.5 h-1.5 bg-neutral-900 rounded-full mr-2.5"></span>
                      Multi-Tenant Controls
                    </div>
                    <div className="flex items-center text-xs text-neutral-500">
                      <span className="w-1.5 h-1.5 bg-neutral-900 rounded-full mr-2.5"></span>
                      Global Reports Access
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <div className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-2.5 px-4 text-center group-hover:bg-neutral-900 group-hover:border-neutral-900 transition-all duration-300">
                    <span className="text-xs font-bold text-neutral-800 group-hover:text-white transition-colors">Enter Portal →</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Admin Card */}
            <Link to="/admin-login" className="group block">
              <div className="h-full bg-white border border-neutral-200 rounded-2xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                <div>
                  {/* Icon */}
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-neutral-100 border border-neutral-200 rounded-xl mb-6 group-hover:bg-neutral-900 group-hover:text-white transition-all duration-300">
                    <FaUserShield className="text-xl text-neutral-800 group-hover:text-white transition-colors" />
                  </div>
                  
                  {/* Titles */}
                  <h3 className="text-xl font-bold text-neutral-900 mb-1">
                    Admin
                  </h3>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">
                    Management Access
                  </p>
                  
                  {/* Description */}
                  <p className="text-neutral-600 text-sm mb-6 leading-relaxed">
                    Lead and oversee organization operations. Configure project scopes, manage staff, and analyze team productivity.
                  </p>
                </div>
                
                <div>
                  {/* Features */}
                  <div className="space-y-2 mb-8 pt-4 border-t border-neutral-100">
                    <div className="flex items-center text-xs text-neutral-500">
                      <span className="w-1.5 h-1.5 bg-neutral-900 rounded-full mr-2.5"></span>
                      Employee Assignment
                    </div>
                    <div className="flex items-center text-xs text-neutral-500">
                      <span className="w-1.5 h-1.5 bg-neutral-900 rounded-full mr-2.5"></span>
                      Lead Pipelines & CRM
                    </div>
                    <div className="flex items-center text-xs text-neutral-500">
                      <span className="w-1.5 h-1.5 bg-neutral-900 rounded-full mr-2.5"></span>
                      Export & Import Data
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <div className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-2.5 px-4 text-center group-hover:bg-neutral-900 group-hover:border-neutral-900 transition-all duration-300">
                    <span className="text-xs font-bold text-neutral-800 group-hover:text-white transition-colors">Enter Portal →</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Employee Card */}
            <Link to="/employee-login" className="group block">
              <div className="h-full bg-white border border-neutral-200 rounded-2xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                <div>
                  {/* Icon */}
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-neutral-100 border border-neutral-200 rounded-xl mb-6 group-hover:bg-neutral-900 group-hover:text-white transition-all duration-300">
                    <FaUsers className="text-xl text-neutral-800 group-hover:text-white transition-colors" />
                  </div>
                  
                  {/* Titles */}
                  <h3 className="text-xl font-bold text-neutral-900 mb-1">
                    Employee
                  </h3>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">
                    Workspace Access
                  </p>
                  
                  {/* Description */}
                  <p className="text-neutral-600 text-sm mb-6 leading-relaxed">
                    Access your personalized workspace. Follow up on assigned leads, update transaction reports, and log actions.
                  </p>
                </div>
                
                <div>
                  {/* Features */}
                  <div className="space-y-2 mb-8 pt-4 border-t border-neutral-100">
                    <div className="flex items-center text-xs text-neutral-500">
                      <span className="w-1.5 h-1.5 bg-neutral-900 rounded-full mr-2.5"></span>
                      Interactive Lead Tasks
                    </div>
                    <div className="flex items-center text-xs text-neutral-500">
                      <span className="w-1.5 h-1.5 bg-neutral-900 rounded-full mr-2.5"></span>
                      Personal Performance Stats
                    </div>
                    <div className="flex items-center text-xs text-neutral-500">
                      <span className="w-1.5 h-1.5 bg-neutral-900 rounded-full mr-2.5"></span>
                      Direct Customer Updates
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <div className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-2.5 px-4 text-center group-hover:bg-neutral-900 group-hover:border-neutral-900 transition-all duration-300">
                    <span className="text-xs font-bold text-neutral-800 group-hover:text-white transition-colors">Enter Portal →</span>
                  </div>
                </div>
              </div>
            </Link>

          </div>
        </div>
      </div>

      {/* Footer Section */}
      <footer className="w-full bg-white border-t border-neutral-200 py-8 px-6 mt-16">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-neutral-500">
          <div className="text-xs text-center md:text-left">
            <span>Powered by </span>
            <Link to="https://doaguru.com/" target="_blank" className="font-semibold text-neutral-800 hover:underline">
              Doaguru Infosystems
            </Link>
            <p className="mt-1 text-neutral-400">© 2026 DOAGuru InfoSystems. All rights reserved.</p>
          </div>
          <div className="flex gap-6 text-xs font-medium">
            <Link to="https://crm.doaguru.com" target="_blank" className="hover:text-neutral-800 transition-colors">Privacy Policy</Link>
            <Link to="https://crm.doaguru.com" target="_blank" className="hover:text-neutral-800 transition-colors">Terms of Service</Link>
            <Link to="https://crm.doaguru.com" target="_blank" className="hover:text-neutral-800 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landingpage;
