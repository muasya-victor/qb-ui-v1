// src/components/customers/CustomerTable.jsx
import React from 'react';
import StatusBadge from '../ui/StatusBadge';

const CustomerTable = ({ customers }) => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {customers.map((customer, index) => (
          <tr key={index} className="hover:bg-gray-50">
            <td className="px-6 py-4">
              <div>
                <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                <div className="text-sm text-gray-500">{customer.email}</div>
              </div>
            </td>
            <td className="px-6 py-4">
              <StatusBadge status={customer.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default CustomerTable;