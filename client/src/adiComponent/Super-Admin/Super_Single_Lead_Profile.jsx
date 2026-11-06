import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import img from "../../images/lead_profile.png";
import Super_view_remarks from "./Super_view_remaks";
import Super_view_followup from "./Super_view_followup";
import { useSelector } from "react-redux";
import getFieldValue from "../../utils/getFieldValue";

function Super_Single_Lead_Profile({ selectedLeadId, closeModalLead, type }) {
  console.log(selectedLeadId);
  let id;



  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [followCreated, setFollowCreated] = useState(false);
  const [remarksCreated, setRemarksCreated] = useState(false);
  const [isModalOpenRemarks, setIsModalOpenRemarks] = useState(false);
  const [isModalOpenFollowUp, setIsModalOpenFollowUp] = useState(false);

  const superadminuser = useSelector((state) => state.auth.user);
  const token = superadminuser.token;

  const fetchLeads = async () => {
    console.log("fetch leads called");

    try {
      const { data } = await axios.get(
        `http://localhost:9000/api/leads-super-admin-byid/${selectedLeadId?.lead_id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(data);
      setLeads(data);
    } catch (error) {
      console.error("Error fetching quotations:", error);
    }
  };

  const fetchMetaLeads = async () => {
    try {
      const { data } = await axios.get(
        `http://localhost:9000/api/getMetaLeadsByLeadId/${selectedLeadId?.leadgen_id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(data);
      setLeads(data);
    } catch (error) {
      console.error("Error fetching quotations:", error);
    }
  };

  const fetchFollowUp = async () => {
    try {
      let apiUrl = "";

      if (type === "meta") {
        apiUrl = `http://localhost:9000/api/getEmployeeFollow_UpMeta/${selectedLeadId?.leadgen_id}`;
      } else {
        apiUrl = `http://localhost:9000/api/employe-follow-up/${selectedLeadId?.lead_id}`;
      }

      const response = await axios.get(apiUrl, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      setFollowCreated(response.data[0]);
    } catch (error) {
      console.error("Error fetching quotations:", error);
    }
  };
  const fetchRemark = async () => {
    try {
      let apiUrl = "";

      if (type === "meta") {
        apiUrl = `http://localhost:9000/api/getEmployeeRemarkMeta/${selectedLeadId?.leadgen_id}`;
      } else {
        apiUrl = `http://localhost:9000/api/remarks/${selectedLeadId?.lead_id}`;
      }

      const response = await axios.get(apiUrl, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response.data);
      setRemarksCreated(response.data[0]);
    } catch (error) {
      console.error("Error fetching remarks:", error);
    }
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleClickRemark = () => {
    setIsModalOpenRemarks(true);
  };
  const handleClickFollowUp = () => {
    setIsModalOpenFollowUp(true);
  };

  // Function to close the modal
  const closeModalRemark = () => {
    setIsModalOpenRemarks(false);
  };
  const closeModalFollowUp = () => {
    setIsModalOpenFollowUp(false);
  };

  useEffect(() => {
    if (type === "meta") {
      fetchMetaLeads();
    } else {
      fetchLeads();
    }
    fetchFollowUp();
    fetchRemark();
  }, [id]);

  console.log(leads);

  return (
    <>
      <div className="relative container px-2 mx-auto p-4">
        <button
          onClick={closeModalLead}
          className="absolute top-2 left-2 text-[black] hover:text-gray-700 text-[3rem]"
          title="Close"
        >
          ×
        </button>
        <h2 className="text-2xl text-center mt-[2rem]">Leads Profile</h2>
        <div className="mx-auto h-[3px] w-16 bg-[#34495E] my-3"></div>
        <div className="flex flex-wrap mb-4  mt-2">
          <div className="w-full lg:w-1/3">
            <img src={img} alt="doctor-profile" className=" rounded-lg" />
          </div>
          {leads?.map((lead, index) => (
            <div className="w-full lg:w-2/3 ">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-info">Name</label>
                  <div className="p-2 bg-gray-100 rounded">
                    <p className="m-0 break-words">
                      {lead.name ||
                        getFieldValue(lead.question_fields_data, "full_name")}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-info">Assigned To</label>
                  <div className="p-2 bg-gray-100 rounded">
                    <p className="m-0">{lead.staff_name}</p>
                  </div>
                </div>

                <div>
                  <label className="text-info">Mobile Number</label>
                  <div className="p-2 bg-gray-100 rounded">
                    <p className="m-0">
                      {lead.phone ||
                        getFieldValue(
                          lead.question_fields_data,
                          "phone_number"
                        )}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-info">Lead Source</label>
                  <div className="p-2 bg-gray-100 rounded">
                    <p className="m-0">{lead.leadSource || "META"}</p>
                  </div>
                </div>
                {/* <div>
                  <label className="text-info">Project</label>
                  <div className="p-2 bg-gray-100 rounded">
                    <p className="m-0">{lead.project_name}</p>
                  </div>
                </div> */}
                <div>
                  <label className="text-info">Lead Status</label>
                  <div className="p-2 bg-gray-100 rounded">
                    <p className="m-0">
                      {lead.lead_status || lead?.meta_lead_status}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-info">Assigned Date</label>
                  <div className="p-2 bg-gray-100 rounded">
                    <p className="m-0">
                      {lead.createdTime || lead?.meta_updated_at}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-info">Project Type</label>
                  <div className="p-2 bg-gray-100 rounded">
                    <p className="m-0">{lead.project_type || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2">
          <div className="">
            <div className="flex flex-wrap gap-2">
              {followCreated ? (
                <button
                  onClick={handleClickFollowUp}
                  className="bg-yellow-500 text-white px-4 py-2 w-full sm:w-auto rounded"
                >
                  View Follow Up
                </button>
              ) : (
                <p className="text-white bg-red-400 text-center px-4 py-2 w-full sm:w-auto rounded">
                  Follow Up not yet created
                </p>
              )}
              {remarksCreated ? (
                <button
                  // onClick={handleViewRemark}
                  onClick={handleClickRemark}
                  className="bg-purple-500 text-white px-4 py-2 rounded w-full sm:w-auto"
                >
                  View Remark
                </button>
              ) : (
                <p className="text-white bg-red-400 text-center px-4 py-2 rounded w-full sm:w-auto">
                  Remark not yet created
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto mt-5">
          <table className="min-w-full whitespace-nowrap bg-white border">
            <thead>
              <tr>
                {/* <th className="px-6 py-3 border-b-2 border-gray-300">
                  Lead Number
                </th> */}
                <th className="px-6 py-3 border-b-2 border-gray-300">
                  Assigned To
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-300">Name</th>
                <th className="px-6 py-3 border-b-2 border-gray-300">Phone</th>
                <th className="px-6 py-3 border-b-2 border-gray-300">
                  Lead Source
                </th>

                <th className="px-6 py-3 border-b-2 border-gray-300">
                  Lead Status
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-300">
                  Address
                </th>

                <th className="px-6 py-3 border-b-2 border-gray-300">
                  Unit Status
                </th>

                <th className="px-6 py-3 border-b-2 border-gray-300">
                  Project Type
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-300">
                  Unit Type
                </th>

                <th className="px-6 py-3 border-b-2 border-gray-300">
                  Unit Number
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-300">
                  Unit Status
                </th>

                <th className="px-6 py-3 border-b-2 border-gray-300">
                  Close Date
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-300">
                  Assigned Date
                </th>
                {/* <th className="px-6 py-3 border-b-2 border-gray-300">
                  Actual Date
                </th> */}
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, index) => (
                <tr
                  key={lead.id}
                  className={index % 2 === 0 ? "bg-gray-100" : ""}
                >
                  {/* <td className="px-6 py-4 border-b border-gray-200 text-gray-800">
                    {lead.lead_no}
                  </td> */}
                  <td className="px-6 py-4 border-b border-gray-200 text-gray-800">
                    {lead.staff_name}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 text-gray-800">
                    {lead.name ||
                      getFieldValue(lead.question_fields_data, "full_name")}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 text-gray-800">
                    {lead.phone ||
                      getFieldValue(lead.question_fields_data, "phone_number")}
                    }
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 text-gray-800">
                    {lead.leadSource || "META"}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 text-gray-800">
                    {lead.lead_status || lead?.meta_lead_status}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 text-gray-800">
                    {lead.address ||
                      getFieldValue(
                        lead.question_fields_data,
                        "street_address"
                      )}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 text-gray-800">
                    {lead.unit_status}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 text-gray-800">
                    {lead.project_type || "N/A"}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 text-gray-800">
                    {lead.unit_type}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 text-gray-800">
                    {lead.unit_number}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 text-gray-800">
                    {lead.unit_status}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 text-gray-800">
                    {lead.unit_updated_at}
                  </td>

                  <td className="px-6 py-4 border-b border-gray-200 text-gray-800">
                    {lead.createdTime || lead?.meta_updated_at}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isModalOpenRemarks && (
          <div className=" fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 mx-2">
            <div className="w-full bg-white p-6 rounded-lg shadow-lg max-h-[80vh] overflow-auto sm:mx-4 my-5">
              <Super_view_remarks
                selectedLeadId={selectedLeadId}
                closeModalRemark={closeModalRemark}
                type={type}
              />
            </div>
          </div>
        )}
        {isModalOpenFollowUp && (
          <div className=" fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 mx-2">
            <div className="w-full bg-white p-6 rounded-lg shadow-lg max-h-[80vh] overflow-auto mx-4 my-5">
              <Super_view_followup
                selectedLeadId={selectedLeadId}
                closeModalFollowUp={closeModalFollowUp}
                type={type}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Super_Single_Lead_Profile;
