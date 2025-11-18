// components/credit-notes/CreditNoteTable.jsx
"use client";
import React, { useState, useEffect } from "react";
import {
  ChevronUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import StatusBadge from "../ui/StatusBadge";
import KRAStatusBadge from "../kra/KRAStatusBadge";
import ValidationModal from "../kra/ValidationModal";
import SubmissionDetailsModal from "../invoices/SubmissionDetailsModal";
import creditNoteService, {
  InvoiceForDropdown,
} from "../../services/CreditNoteService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "../../lib/toast";

const CreditNoteTable = ({
  creditNotes,
  companyInfo,
  loading,
  sortBy,
  sortOrder,
  onSort,
  onViewCreditNote,
  onValidationComplete,
  onInvoiceLinkUpdate,
}) => {
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedCreditNote, setSelectedCreditNote] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [availableInvoices, setAvailableInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [updatingInvoice, setUpdatingInvoice] = useState(null);

  // Table headers with new Linked Invoice column
  const tableHeaders = [
    { key: "doc_number", label: "Credit Note #", sortable: true },
    { key: "customer_name", label: "Customer", sortable: true },
    { key: "linked_invoice", label: "Linked Invoice", sortable: false },
    { key: "total_amt", label: "Credit Amount", sortable: true },
    { key: "balance", label: "Available Credit", sortable: true },
    { key: "status", label: "Status", sortable: false },
    { key: "kra_status", label: "KRA Status", sortable: false },
    { key: "kra_credit_note_number", label: "KRA #", sortable: false },
    { key: "txn_date", label: "Credit Date", sortable: true },
    { key: "actions", label: "Actions", sortable: false },
  ];

  // Fetch available invoices for dropdown
  const fetchAvailableInvoices = async (customerName) => {
    try {
      setLoadingInvoices(true);
      const response = await creditNoteService.getAvailableInvoices(
        "", // search term
        customerName, // filter by customer name
        100 // limit
      );
      if (response.success) {
        setAvailableInvoices(response.invoices || []);
      }
    } catch (error) {
      console.error("Error fetching available invoices:", error);
      toast.error("Failed to load available invoices");
    } finally {
      setLoadingInvoices(false);
    }
  };

  useEffect(() => {
    // Load available invoices on component mount
    fetchAvailableInvoices();
  }, []);

  const handleValidateClick = (creditNote) => {
    console.log("Selected Credit Note:", creditNote);
    setSelectedCreditNote(creditNote);
    setValidationModalOpen(true);
  };

  const handleViewSubmissionDetails = (creditNote) => {
    setSelectedCreditNote(creditNote);
    setSelectedSubmission(creditNote.kra_submission);
    setDetailsModalOpen(true);
  };

  const handleValidation = async (creditNoteId) => {
    try {
      const result = await creditNoteService.validateCreditNoteToKRA(
        creditNoteId
      );

      if (onValidationComplete) {
        onValidationComplete();
      }

      return result;
    } catch (error) {
      throw error;
    }
  };

  const handleValidationSuccess = () => {
    setValidationModalOpen(false);
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  // Handle invoice selection change
  const handleInvoiceChange = async (creditNoteId, invoiceId) => {
    try {
      setUpdatingInvoice(creditNoteId);

      const result = await creditNoteService.updateRelatedInvoice(
        creditNoteId,
        invoiceId
      );

      if (result.success) {
        toast.success("Invoice linked successfully");
        if (onInvoiceLinkUpdate) {
          onInvoiceLinkUpdate();
        }
      } else {
        toast.error(`Failed to link invoice: ${result.error}`);
      }
    } catch (error) {
      toast.error(
        `Failed to link invoice: ${error.message || "Please try again"}`
      );
    } finally {
      setUpdatingInvoice(null);
    }
  };

  // Handle remove invoice link
  const handleRemoveInvoice = async (creditNoteId) => {
    try {
      setUpdatingInvoice(creditNoteId);

      const result = await creditNoteService.updateRelatedInvoice(
        creditNoteId,
        null
      );

      if (result.success) {
        toast.success("Invoice link removed successfully");
        if (onInvoiceLinkUpdate) {
          onInvoiceLinkUpdate();
        }
      } else {
        toast.error(`Failed to remove invoice link: ${result.error}`);
      }
    } catch (error) {
      toast.error(
        `Failed to remove invoice link: ${error.message || "Please try again"}`
      );
    } finally {
      setUpdatingInvoice(null);
    }
  };

  const getKRAStatus = (creditNote) => {
    return creditNote.kra_submission?.status || "pending";
  };

  const hasKRASubmission = (creditNote) => {
    return !!creditNote.kra_submission;
  };

  const canValidateKRA = (creditNote) => {
    const submission = creditNote.kra_submission;
    if (!submission) return true;
    return submission.status === "failed";
  };

  const getValidationButtonText = (creditNote) => {
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
    const currencyCode = companyInfo?.currency_code || "USD";

    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode,
      }).format(numericAmount);
    } catch (error) {
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

  const getInvoiceDisplayText = (invoice) => {
    return `${invoice.doc_number} - ${invoice.customer_display} (${formatAmount(
      invoice.total_amt
    )})`;
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
    <>
      <div className="overflow-hidden">
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
                          {creditNote.doc_number ||
                            `#${creditNote.qb_credit_id}`}
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
                      {creditNote.related_invoice ? (
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">
                              {creditNote.related_invoice.doc_number}
                            </div>
                            <div className="text-xs text-gray-500">
                              {creditNote.related_invoice.customer_display}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveInvoice(creditNote.id)}
                            disabled={updatingInvoice === creditNote.id}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                            title="Remove invoice link"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <Select
                          onValueChange={(value) =>
                            handleInvoiceChange(creditNote.id, value)
                          }
                          disabled={
                            updatingInvoice === creditNote.id || loadingInvoices
                          }
                        >
                          <SelectTrigger className="w-full max-w-xs">
                            <SelectValue
                              placeholder={
                                loadingInvoices
                                  ? "Loading invoices..."
                                  : "Select invoice"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              No invoice linked
                            </SelectItem>
                            {availableInvoices.map((invoice) => (
                              <SelectItem key={invoice.id} value={invoice.id}>
                                {getInvoiceDisplayText(invoice)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
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

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {/* KRA Validation Button */}
                        <button
                          className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white transition-all duration-200 shadow-sm hover:shadow-md ${
                            canValidateKRA(creditNote)
                              ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:ring-green-500"
                              : "bg-gray-400 cursor-not-allowed"
                          }`}
                          onClick={() => handleValidateClick(creditNote)}
                          disabled={!canValidateKRA(creditNote)}
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
                          {getValidationButtonText(creditNote)}
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
                {/* Linked Invoices Stats */}
                <span className="ml-4 text-gray-500">
                  • Linked Invoices:{" "}
                  {creditNotes.filter((cn) => cn.related_invoice).length}/
                  {creditNotes.length}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Last updated: {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Validation Modal */}
      <ValidationModal
        isOpen={validationModalOpen}
        onClose={() => setValidationModalOpen(false)}
        creditNote={selectedCreditNote}
        onValidate={handleValidation}
        onValidationSuccess={handleValidationSuccess}
        type="credit_note"
      />

      {/* Submission Details Modal */}
      <SubmissionDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        creditNote={selectedCreditNote}
        submission={selectedSubmission}
      />
    </>
  );
};

export default CreditNoteTable;
