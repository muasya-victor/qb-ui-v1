import React from "react";
import { formatAmount } from "@/utils/formatters";

const TableSummary = ({ creditNotes, companyInfo, invoiceCreditSummaries }) => {
  const linkedCount = creditNotes.filter((cn) => cn.related_invoice).length;
  const fullyCreditedCount = Object.values(invoiceCreditSummaries).filter(
    (summary) => summary.is_fully_credited
  ).length;
  const totalCreditsApplied = Object.values(invoiceCreditSummaries).reduce(
    (sum, summary) => sum + (summary.calculated_total_credits || 0),
    0
  );

  return (
    <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="space-y-1">
          <div>
            Showing {creditNotes.length} credit note
            {creditNotes.length !== 1 ? "s" : ""}
            {companyInfo && (
              <span className="ml-2 text-gray-500">
                • Currency: {companyInfo.currency_code}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-500">
              • Linked Invoices:{" "}
              <span className="font-medium">
                {linkedCount}/{creditNotes.length}
              </span>
            </span>
            <span className="text-gray-500">
              • Fully Credited Invoices:{" "}
              <span className="font-medium">{fullyCreditedCount}</span>
            </span>
            <span className="text-gray-500">
              • Total Credits Applied:{" "}
              <span className="font-medium">
                {formatAmount(totalCreditsApplied, companyInfo?.currency_code)}
              </span>
            </span>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default TableSummary;
