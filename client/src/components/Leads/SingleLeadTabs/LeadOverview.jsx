import React from "react";
import getFieldValue from "../../../utils/getFieldValue";

const LeadOverview = ({ leads }) => {
  console.log(leads);

  return (
    <>
      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
        <table className="min-w-full whitespace-nowrap bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 border-b border-gray-200 text-xs sm:text-sm text-start font-semibold text-gray-700 whitespace-nowrap">
                Assigned To
              </th>
              <th className="px-3 py-2 border-b border-gray-200 text-xs sm:text-sm text-start font-semibold text-gray-700 whitespace-nowrap">Name</th>
              <th className="px-3 py-2 border-b border-gray-200 text-xs sm:text-sm text-start font-semibold text-gray-700 whitespace-nowrap">Phone</th>
              <th className="px-3 py-2 border-b border-gray-200 text-xs sm:text-sm text-start font-semibold text-gray-700 whitespace-nowrap">
                Lead Source
              </th>
              <th className="px-3 py-2 border-b border-gray-200 text-xs sm:text-sm text-start font-semibold text-gray-700 whitespace-nowrap">Address</th>
              <th className="px-3 py-2 border-b border-gray-200 text-xs sm:text-sm text-start font-semibold text-gray-700 whitespace-nowrap">Project</th>
              <th className="px-3 py-2 border-b border-gray-200 text-xs sm:text-sm text-start font-semibold text-gray-700 whitespace-nowrap">
                Project Id
              </th>
              <th className="px-3 py-2 border-b border-gray-200 text-xs sm:text-sm text-start font-semibold text-gray-700 whitespace-nowrap">
                Unit Type
              </th>
              <th className="px-3 py-2 border-b border-gray-200 text-xs sm:text-sm text-start font-semibold text-gray-700 whitespace-nowrap">
                Unit Number
              </th>
              <th className="px-3 py-2 border-b border-gray-200 text-xs sm:text-sm text-start font-semibold text-gray-700 whitespace-nowrap">
                Unit Status
              </th>
              <th className="px-3 py-2 border-b border-gray-200 text-xs sm:text-sm text-start font-semibold text-gray-700 whitespace-nowrap">
                Close Date
              </th>
              <th className="px-3 py-2 border-b border-gray-200 text-xs sm:text-sm text-start font-semibold text-gray-700 whitespace-nowrap">
                Assigned Date
              </th>
            </tr>
          </thead>

          <tbody>
            {leads.map((lead, index) => (
              <tr
                key={lead.id}
                className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-gray-100 transition-colors`}
              >
                <td className="px-3 py-2.5 border-b border-gray-200 text-xs sm:text-sm text-gray-600 font-semibold whitespace-nowrap">
                  {lead.staff_name}
                </td>

                <td className="px-3 py-2.5 border-b border-gray-200 text-xs sm:text-sm text-gray-600 font-semibold whitespace-nowrap">
                  {lead.name ||
                    getFieldValue(lead.question_fields_data, "full_name")}
                </td>

                <td className="px-3 py-2.5 border-b border-gray-200 text-xs sm:text-sm text-gray-600 font-semibold whitespace-nowrap">
                  {lead.phone ||
                    getFieldValue(lead.question_fields_data, "phone_number")}
                </td>

                <td className="px-3 py-2.5 border-b border-gray-200 text-xs sm:text-sm text-gray-600 font-semibold whitespace-nowrap">
                  {lead.leadSource || "META"}
                </td>

                <td className="px-3 py-2.5 border-b border-gray-200 text-xs sm:text-sm text-gray-600 font-semibold whitespace-nowrap">
                  {lead.address ||
                    getFieldValue(lead.question_fields_data, "street_address")}
                </td>

                <td className="px-3 py-2.5 border-b border-gray-200 text-xs sm:text-sm text-gray-600 font-semibold whitespace-nowrap">
                  {lead.project_name}
                </td>

                <td className="px-3 py-2.5 border-b border-gray-200 text-xs sm:text-sm text-gray-600 font-semibold whitespace-nowrap">
                  {lead.project_id}
                </td>

                <td className="px-3 py-2.5 border-b border-gray-200 text-xs sm:text-sm text-gray-600 font-semibold whitespace-nowrap">
                  {lead.unit_type}
                </td>

                <td className="px-3 py-2.5 border-b border-gray-200 text-xs sm:text-sm text-gray-600 font-semibold whitespace-nowrap">
                  {lead.unit_number}
                </td>

                <td className="px-3 py-2.5 border-b border-gray-200 text-xs sm:text-sm text-gray-600 font-semibold whitespace-nowrap">
                  {lead.unit_status}
                </td>

                <td className="px-3 py-2.5 border-b border-gray-200 text-xs sm:text-sm text-gray-600 font-semibold whitespace-nowrap">
                  {lead.unit_updated_at}
                </td>

                <td className="px-3 py-2.5 border-b border-gray-200 text-xs sm:text-sm text-gray-600 font-semibold whitespace-nowrap">
                  {lead.createdTime || lead.meta_updated_at}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default LeadOverview;
