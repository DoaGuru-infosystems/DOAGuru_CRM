import React, { useState } from "react";
import SuperLeadReport from "./SuperAdminReport/SuperLeadReport";
import SuperClosedDealReport from "./SuperAdminReport/SuperClosedDealReport";
import { SiGoogleads } from "react-icons/si";
import { FaHouseChimney, FaMeta } from "react-icons/fa6";
import SuperMetaLeadReport from "./SuperAdminReport/SuperMetaLeadReport";

const SuperReportsContent = () => {
  const [selectedComponent, setSelectedComponent] = useState("LeadData");

  return (
    <>
      <div className="flex mt-20">
        <div className="w-[90%] sm:w-full min-h-screen bg-[#F9FAFF] p-2">
          <div className="container">
            {/* Title */}
            <h2 className="text-3xl text-center mt-8 font-semibold tracking-wide text-gray-800">
              Report
            </h2>
            <div className="mx-auto h-[3px] w-20 bg-cyan-600 my-4 rounded-full"></div>

            {/* Card Section */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-4">
              {/* Leads */}
              <div
                className={`transition-all duration-300 transform hover:scale-105 shadow-md rounded-2xl cursor-pointer w-full sm:w-[48%] md:w-[30%] lg:w-[22%] max-w-[200px] ${
                  selectedComponent === "LeadData"
                    ? "bg-cyan-600 text-white shadow-lg shadow-cyan-300/50"
                    : "bg-white text-gray-800 hover:bg-gray-100"
                }`}
                onClick={() => setSelectedComponent("LeadData")}
              >
                <div className="p-4 sm:p-6 flex flex-col items-center text-center">
                  <div
                    className={`text-3xl sm:text-4xl mb-2 ${
                      selectedComponent === "LeadData"
                        ? "text-white"
                        : "text-cyan-600"
                    }`}
                  >
                    <SiGoogleads />
                  </div>
                  <p className="text-base sm:text-lg font-semibold">Leads</p>
                </div>
              </div>

              {/* Meta Leads */}
              <div
                className={`transition-all duration-300 transform hover:scale-105 shadow-md rounded-2xl cursor-pointer w-full sm:w-[48%] md:w-[30%] lg:w-[22%] max-w-[200px] ${
                  selectedComponent === "metaLeadData"
                    ? "bg-cyan-600 text-white shadow-lg shadow-cyan-300/50"
                    : "bg-white text-gray-800 hover:bg-gray-100"
                }`}
                onClick={() => setSelectedComponent("metaLeadData")}
              >
                <div className="p-4 sm:p-6 flex flex-col items-center text-center">
                  <div
                    className={`text-3xl sm:text-4xl mb-2 ${
                      selectedComponent === "metaLeadData"
                        ? "text-white"
                        : "text-cyan-600"
                    }`}
                  >
                    <FaMeta />
                  </div>
                  <p className="text-base sm:text-lg font-semibold">Meta Leads</p>
                </div>
              </div>

            </div>

            {/* Render Selected Component */}
            <div className="w-full h-[calc(100vh-12rem)] overflow-y-auto mt-6 bg-white shadow-inner rounded-xl p-2 sm:p-4">
              {selectedComponent === "LeadData" && <SuperLeadReport />}
              {selectedComponent === "metaLeadData" && <SuperMetaLeadReport />}
              {selectedComponent === "ClosedData" && <SuperClosedDealReport />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SuperReportsContent;
