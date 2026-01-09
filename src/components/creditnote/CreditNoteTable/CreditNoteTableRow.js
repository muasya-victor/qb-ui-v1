import React, { useState } from "react";
import StatusBadge from "../../ui/StatusBadge";
import KRAStatusBadge from "../../kra/KRAStatusBadge";
import InvoiceSelector from "./InvoiceSelector";
import LinkedInvoiceInfo from "./LinkedInvoiceInfo";
import { formatAmount, formatDate } from "@/utils/formatters";
import { Button } from "../../ui/button";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

const CreditNoteTableRow = ({
  creditNote,
  index,
  companyInfo,
  availableInvoices,
  loadingInvoices,
  isLoadingMore,
  invoicePagination,
  invoiceCreditSummaries,
  linkedInvoicesCache,
  onDropdownOpen,
  onDropdownScroll,
  onInvoiceChange,
  onValidateClick,
  onValidateCreditLinkage,
  onViewCreditNote,
  onViewSubmissionDetails,
}) => {
  const [updatingInvoice, setUpdatingInvoice] = useState(null);

  const getKRAStatus = () => creditNote.kra_submission?.status || "pending";
  const getKRACreditNoteNumber = () =>
    creditNote.kra_submission?.kra_credit_note_number || "-";
  const getCreditNoteStatus = () => creditNote.status || "pending";
  const canValidateKRA = () => {
    const submission = creditNote.kra_submission;
    if (!submission) return true;
    return submission.status === "failed";
  };

  const getValidationButtonText = () => {
    const submission = creditNote.kra_submission;
    if (!submission) return "Validate KRA";
    if (submission.status === "success") return "Validated";
    if (submission.status === "failed") return "Retry KRA";
    if (submission.status === "submitted") return "Processing";
    return "Validate KRA";
  };

  const handleInvoiceUpdate = async (invoiceId) => {
    onInvoiceChange(creditNote.id, invoiceId);
  };

  return (
    <tr
      className={`hover:bg-blue-50 transition-colors duration-150 ${
        index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
      }`}
    >
      {/* Credit Note Number */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="text-sm font-semibold text-gray-900">
            {creditNote.doc_number || `#${creditNote.qb_credit_id}`}
          </div>
        </div>
      </td>

      {/* Customer */}
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900 font-medium">
          {creditNote.customer_name || "N/A"}
        </div>
      </td>

      {/* Linked Invoice */}
      <td className="px-6 py-4">
        <div className="space-y-2">
          <InvoiceSelector
            creditNote={creditNote}
            availableInvoices={availableInvoices}
            loadingInvoices={loadingInvoices}
            isLoadingMore={isLoadingMore}
            invoicePagination={invoicePagination}
            linkedInvoicesCache={linkedInvoicesCache}
            updatingInvoice={updatingInvoice}
            onDropdownOpen={onDropdownOpen}
            onDropdownScroll={onDropdownScroll}
            onInvoiceChange={handleInvoiceUpdate}
          />

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onValidateCreditLinkage(creditNote)}
            disabled={!creditNote.total_amt || creditNote.total_amt <= 0}
          >
            <InformationCircleIcon className="w-4 h-4 mr-2" />
            Validate Credit Amount
          </Button>
        </div>
      </td>

      {/* Credit Amount */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-semibold text-green-600">
          {formatAmount(creditNote.total_amt, companyInfo?.currency_code)}
        </div>
      </td>

      {/* Available Credit */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div
          className={`text-sm font-semibold ${
            parseFloat(creditNote.balance || 0) === 0
              ? "text-gray-600"
              : "text-blue-600"
          }`}
        >
          {formatAmount(creditNote.balance, companyInfo?.currency_code)}
        </div>
      </td>

      {/* Invoice Balance Info */}
      <td className="px-6 py-4">
        <LinkedInvoiceInfo
          creditNote={creditNote}
          invoiceCreditSummaries={invoiceCreditSummaries}
          formatAmount={formatAmount}
        />
      </td>

      {/* Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge status={getCreditNoteStatus()} />
      </td>

      {/* KRA Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <KRAStatusBadge submission={creditNote.kra_submission} size="sm" />
      </td>

      {/* KRA Credit Note Number */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900 font-mono">
          {getKRACreditNoteNumber()}
        </div>
      </td>

      {/* Credit Date */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {formatDate(creditNote.txn_date)}
        </div>
      </td>

      {/* Actions */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col space-y-2">
          {/* KRA Validation Button */}
          <button
            className={`inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white transition-all duration-200 shadow-sm hover:shadow-md ${
              canValidateKRA()
                ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:ring-green-500"
                : "bg-gray-400 cursor-not-allowed"
            }`}
            onClick={() => onValidateClick(creditNote)}
            disabled={!canValidateKRA()}
          >
            <svg
              className="w-3 h-3 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            {getValidationButtonText()}
          </button>

          {/* View Credit Note Button */}
          <button
            className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            onClick={() => onViewCreditNote && onViewCreditNote(creditNote)}
          >
            <svg
              className="w-3 h-3 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            View
          </button>
        </div>
      </td>
    </tr>
  );
};

export default CreditNoteTableRow;
