import React from "react";
import {
  ChevronUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

const CreditNoteTableHeader = ({ sortBy, sortOrder, onSort }) => {
  const tableHeaders = [
    { key: "doc_number", label: "Credit Note #", sortable: true },
    { key: "customer_name", label: "Customer", sortable: true },
    { key: "linked_invoice", label: "Linked Invoice", sortable: false },
    { key: "total_amt", label: "Credit Amount", sortable: true },
    { key: "balance", label: "Available Credit", sortable: true },
    { key: "invoice_balance", label: "Invoice Balance", sortable: false },
    { key: "status", label: "Status", sortable: false },
    { key: "kra_status", label: "KRA Status", sortable: false },
    { key: "kra_credit_note_number", label: "KRA #", sortable: false },
    { key: "txn_date", label: "Credit Date", sortable: true },
    { key: "actions", label: "Actions", sortable: false },
  ];

  const getSortIcon = (column) => {
    if (sortBy !== column) {
      return <ChevronUpDownIcon className="w-4 h-4 text-gray-400" />;
    }
    if (sortOrder === "asc") {
      return <ChevronUpIcon className="w-4 h-4 text-blue-500" />;
    }
    return <ChevronDownIcon className="w-4 h-4 text-blue-500" />;
  };

  return (
    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
      <tr>
        {tableHeaders.map((header) => (
          <th
            key={header.key}
            className={`px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider ${
              header.sortable
                ? "cursor-pointer hover:bg-gray-200 transition-colors"
                : ""
            }`}
            onClick={header.sortable ? () => onSort(header.key) : undefined}
          >
            <div className="flex items-center space-x-1">
              <span>{header.label}</span>
              {header.sortable && getSortIcon(header.key)}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
};

export default CreditNoteTableHeader;
