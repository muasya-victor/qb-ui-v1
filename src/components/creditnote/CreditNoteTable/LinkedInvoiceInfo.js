import React from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

const LinkedInvoiceInfo = ({
  creditNote,
  invoiceCreditSummaries,
  formatAmount,
}) => {
  if (!creditNote.related_invoice) return null;

  const invoiceId = creditNote.related_invoice.id;
  const summary = invoiceCreditSummaries[invoiceId];

  if (!summary || summary.error) {
    return <div className="text-xs text-gray-500">Loading balance info...</div>;
  }

  const utilization = summary.credit_utilization_percentage || 0;
  const available = summary.available_credit_balance || 0;
  const totalCredits = summary.calculated_total_credits || 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700">Credits:</span>
        <span className="text-xs font-semibold">{totalCredits.toFixed(2)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700">Utilization:</span>
        <span className="text-xs font-semibold">{utilization.toFixed(1)}%</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700">Available:</span>
        <span className="text-xs font-semibold text-blue-600">
          {formatAmount(available, creditNote?.currency_code)}
        </span>
      </div>
      {summary.is_fully_credited && (
        <div className="flex items-center mt-1">
          <ExclamationTriangleIcon className="w-3 h-3 text-amber-500 mr-1" />
          <span className="text-xs text-amber-600 font-medium">
            Invoice fully credited
          </span>
        </div>
      )}
    </div>
  );
};

export default LinkedInvoiceInfo;
