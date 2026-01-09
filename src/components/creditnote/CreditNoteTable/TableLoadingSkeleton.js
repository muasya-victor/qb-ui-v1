import React from "react";

const TableLoadingSkeleton = () => {
  const tableHeaders = Array(11).fill(0);

  return (
    <div className="animate-pulse">
      <div className="overflow-hidden">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              {tableHeaders.map((_, index) => (
                <th key={index} className="px-6 py-4">
                  <div className="h-4 bg-gray-300 rounded w-24"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {[...Array(5)].map((_, index) => (
              <tr key={index} className="bg-white">
                {tableHeaders.map((_, cellIndex) => (
                  <td key={cellIndex} className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableLoadingSkeleton;
