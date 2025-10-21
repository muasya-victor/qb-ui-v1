"use client";
import React, { useState } from "react";
import {
  ChevronUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import StatusBadge from "../ui/StatusBadge";
import KRAStatusBadge from "../kra/KRAStatusBadge";
import creditNoteService from "../../services/CreditNoteService";

const CreditNoteTable = ({
  creditNotes,
  companyInfo,
  loading,
  sortBy,
  sortOrder,
  onSort,
  onViewCreditNote,
  onValidationComplete,
}) => {
  const [validatingId, setValidatingId] = useState(null);
  const [validationError, setValidationError] = useState(null);

  // Add KRA status column to table headers
  const tableHeaders = [
    { key: "doc_number", label: "Credit Note #", sortable: true },
    { key: "customer_name", label: "Customer", sortable: true },
    { key: "total_amt", label: "Credit Amount", sortable: true },
    { key: "balance", label: "Available Credit", sortable: true },
    { key: "status", label: "Status", sortable: false },
    { key: "kra_status", label: "KRA Status", sortable: false },
    { key: "kra_credit_note_number", label: "KRA #", sortable: false },
    { key: "txn_date", label: "Credit Date", sortable: true },
    { key: "related_invoice", label: "Related Invoice", sortable: true },
    { key: "actions", label: "Actions", sortable: false },
  ];

  const handleValidateClick = async (creditNote) => {
    // Simple confirmation popover
    const isConfirmed = window.confirm(
      `Are you sure you want to validate Credit Note ${
        creditNote.doc_number
      } with KRA?\n\nCustomer: ${
        creditNote.customer_name
      }\nAmount: ${formatAmount(creditNote.total_amt)}`
    );

    if (!isConfirmed) {
      return;
    }

    setValidatingId(creditNote.id);
    setValidationError(null);

    try {
      console.log("Validating credit note:", creditNote.id);

      // Make sure creditNote has an id
      if (!creditNote.id) {
        throw new Error("Credit note ID is missing");
      }

      const result = await creditNoteService.validateCreditNoteToKRA(
        creditNote.id
      );

      if (result.success) {
        // Show success message
        alert(
          `✅ Credit Note ${creditNote.doc_number} successfully submitted to KRA!`
        );

        // Notify parent to refresh data
        if (onValidationComplete) {
          onValidationComplete();
        }
      } else {
        setValidationError(result.error || "Validation failed");
        alert(`❌ Validation failed: ${result.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error validating credit note:", error);
      setValidationError(error.message);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setValidatingId(null);
    }
  };

  const getKRAStatus = (creditNote) => {
    return creditNote.kra_submission?.status || "pending";
  };

  const hasKRASubmission = (creditNote) => {
    return !!creditNote.kra_submission;
  };

  const canValidateKRA = (creditNote) => {
    // Only allow validation if no successful submission exists
    const submission = creditNote.kra_submission;
    if (!submission) return true;

    // Allow re-submission for failed submissions
    return submission.status === "failed";
  };

  const getValidationButtonText = (creditNote) => {
    if (validatingId === creditNote.id) {
      return "Validating...";
    }

    const submission = creditNote.kra_submission;

    if (!submission) return "Validate KRA";
    if (submission.status === "success") return "Validated";
    if (submission.status === "failed") return "Retry KRA";
    if (submission.status === "submitted") return "Processing";

    return "Validate KRA";
  };

  const getKRACreditNoteNumber = (creditNote) => {
    return creditNote.kra_submission?.kra_credit_note_number || "-";
  };

  const getCreditNoteStatus = (creditNote) => {
    return creditNote.status || "pending";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatAmount = (amount) => {
    if (!amount) amount = 0;
    const numericAmount = parseFloat(amount);

    // Get currency from company info or individual credit note, fallback to USD
    const currencyCode = companyInfo?.currency_code || "USD";

    // Create currency formatter
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode,
      }).format(numericAmount);
    } catch (error) {
      // Fallback if currency code is invalid
      console.warn("Invalid currency code:", currencyCode);
      return `${currencyCode} ${numericAmount.toFixed(2)}`;
    }
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) {
      return <ChevronUpDownIcon className="w-4 h-4 text-gray-400" />;
    }
    if (sortOrder === "asc") {
      return <ChevronUpIcon className="w-4 h-4 text-blue-500" />;
    }
    return <ChevronDownIcon className="w-4 h-4 text-blue-500" />;
  };

  const getRelatedInvoiceInfo = (creditNote) => {
    if (!creditNote.related_invoice) return "-";

    const invoice = creditNote.related_invoice;
    return invoice.doc_number || `Invoice #${invoice.qb_invoice_id}`;
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                {tableHeaders.map((header, index) => (
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
  }

  return (
    <div className="overflow-hidden">
      {/* Validation Error Banner */}
      {validationError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Validation Error
              </h3>
              <div className="mt-1 text-sm text-red-700">
                <p>{validationError}</p>
              </div>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setValidationError(null)}
                  className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
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
                  onClick={
                    header.sortable ? () => onSort(header.key) : undefined
                  }
                >
                  <div className="flex items-center space-x-1">
                    <span>{header.label}</span>
                    {header.sortable && getSortIcon(header.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {creditNotes.length === 0 ? (
              <tr>
                <td
                  colSpan={tableHeaders.length}
                  className="px-6 py-16 text-center"
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        No credit notes found
                      </h3>
                      <p className="text-gray-500 mt-1">
                        Try adjusting your search criteria or sync from
                        QuickBooks to load data.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              creditNotes.map((creditNote, index) => (
                <tr
                  key={creditNote.id}
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

                  {/* Credit Amount */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-green-600">
                      {formatAmount(creditNote.total_amt)}
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
                      {formatAmount(creditNote.balance)}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={getCreditNoteStatus(creditNote)} />
                  </td>

                  {/* KRA Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <KRAStatusBadge
                      submission={creditNote.kra_submission}
                      size="sm"
                    />
                  </td>

                  {/* KRA Credit Note Number */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-mono">
                      {getKRACreditNoteNumber(creditNote)}
                    </div>
                  </td>

                  {/* Credit Date */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(creditNote.txn_date)}
                    </div>
                  </td>

                  {/* Related Invoice */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {getRelatedInvoiceInfo(creditNote)}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {/* KRA Validation Button */}
                      <button
                        className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white transition-all duration-200 shadow-sm hover:shadow-md ${
                          canValidateKRA(creditNote) &&
                          validatingId !== creditNote.id
                            ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:ring-green-500"
                            : "bg-gray-400 cursor-not-allowed"
                        }`}
                        onClick={() => handleValidateClick(creditNote)}
                        disabled={
                          !canValidateKRA(creditNote) ||
                          validatingId === creditNote.id
                        }
                      >
                        {validatingId === creditNote.id ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-2 h-3 w-3 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Validating...
                          </>
                        ) : (
                          <>
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
                            {getValidationButtonText(creditNote)}
                          </>
                        )}
                      </button>

                      {/* View Credit Note Button */}
                      <button
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        onClick={() =>
                          onViewCreditNote && onViewCreditNote(creditNote)
                        }
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

                      {/* Apply Credit Note Button */}
                      {creditNote.balance > 0 && (
                        <button
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                          onClick={() =>
                            console.log("Apply credit note:", creditNote.id)
                          }
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
                          Apply
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Summary */}
      {creditNotes.length > 0 && (
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Showing {creditNotes.length} credit note
              {creditNotes.length !== 1 ? "s" : ""}
              {companyInfo && (
                <span className="ml-2 text-gray-500">
                  • Currency: {companyInfo.currency_code}
                </span>
              )}
              {/* KRA Stats Summary */}
              <span className="ml-4 text-gray-500">
                • KRA Validated:{" "}
                {
                  creditNotes.filter(
                    (cn) => cn.kra_submission?.status === "success"
                  ).length
                }
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Last updated: {new Date().toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditNoteTable;
