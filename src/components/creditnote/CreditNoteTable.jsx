"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  ChevronUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
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
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import CreditValidationModal from "./CreditValidationModal"; // We'll create this

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
  const [creditValidationModalOpen, setCreditValidationModalOpen] =
    useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedCreditNote, setSelectedCreditNote] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [availableInvoices, setAvailableInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [updatingInvoice, setUpdatingInvoice] = useState(null);
  const [validatingCredit, setValidatingCredit] = useState(null);
  const [invoiceCreditSummaries, setInvoiceCreditSummaries] = useState({});

  // Table headers with enhanced Linked Invoice column
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

  // Fetch available invoices with credit balance information
  const fetchAvailableInvoices = useCallback(async (customerName = "") => {
    try {
      setLoadingInvoices(true);
      const response = await creditNoteService.getAvailableInvoices(
        "", // search term
        customerName, // filter by customer name
        100 // limit
      );

      if (response.success) {
        // Enhanced invoices now include available_balance and is_fully_credited
        setAvailableInvoices(response.invoices || []);
      }
    } catch (error) {
      console.error("Error fetching available invoices:", error);
      toast.error("Failed to load available invoices");
    } finally {
      setLoadingInvoices(false);
    }
  }, []);

  // Fetch credit summary for a specific invoice
  const fetchInvoiceCreditSummary = useCallback(async (invoiceId) => {
    if (!invoiceId) return null;

    try {
      const response = await creditNoteService.getInvoiceCreditSummary(
        invoiceId
      );
      if (response.success) {
        return response.summary;
      }
    } catch (error) {
      console.error("Error fetching invoice credit summary:", error);
    }
    return null;
  }, []);

  // Pre-validate credit note linkage
  const validateCreditLinkage = async (creditNoteId, invoiceId) => {
    try {
      setValidatingCredit(creditNoteId);

      // Get credit note amount
      const creditNote = creditNotes.find((cn) => cn.id === creditNoteId);
      if (!creditNote) {
        throw new Error("Credit note not found");
      }

      const response = await creditNoteService.validateCreditLinkage(
        invoiceId,
        creditNote.total_amt
      );

      return response;
    } catch (error) {
      toast.error(`Validation failed: ${error.message || "Please try again"}`);
      throw error;
    } finally {
      setValidatingCredit(null);
    }
  };

  useEffect(() => {
    fetchAvailableInvoices();
  }, [fetchAvailableInvoices]);

  // Load credit summaries for linked invoices
  useEffect(() => {
    const loadCreditSummaries = async () => {
      const summaries = {};
      for (const creditNote of creditNotes) {
        if (creditNote.related_invoice?.id) {
          const summary = await fetchInvoiceCreditSummary(
            creditNote.related_invoice.id
          );
          if (summary) {
            summaries[creditNote.related_invoice.id] = summary;
          }
        }
      }
      setInvoiceCreditSummaries(summaries);
    };

    if (creditNotes.length > 0) {
      loadCreditSummaries();
    }
  }, [creditNotes, fetchInvoiceCreditSummary]);

  const handleValidateClick = (creditNote) => {
    console.log("Selected Credit Note:", creditNote);
    setSelectedCreditNote(creditNote);
    setValidationModalOpen(true);
  };

  const handleValidateCreditLinkage = (creditNote) => {
    setSelectedCreditNote(creditNote);
    setCreditValidationModalOpen(true);
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

  const handleInvoiceChange = async (creditNoteId, invoiceId) => {
    try {
      setUpdatingInvoice(creditNoteId);

      // If selecting "none", remove the invoice link
      if (invoiceId === "none") {
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
        return;
      }

      // Validate before linking
      const validation = await validateCreditLinkage(creditNoteId, invoiceId);

      if (validation.success && validation.validation.valid) {
        // Proceed with linking
        const result = await creditNoteService.updateRelatedInvoice(
          creditNoteId,
          invoiceId
        );

        if (result.success) {
          toast.success("Invoice linked successfully");
          if (onInvoiceLinkUpdate) {
            onInvoiceLinkUpdate();
          }

          // Refresh the invoice credit summary
          const summary = await fetchInvoiceCreditSummary(invoiceId);
          if (summary) {
            setInvoiceCreditSummaries((prev) => ({
              ...prev,
              [invoiceId]: summary,
            }));
          }
        } else {
          toast.error(`Failed to link invoice: ${result.error}`);
        }
      } else {
        toast.error(
          `Cannot link: ${
            validation.validation.error || validation.validation.message
          }`
        );
      }
    } catch (error) {
      toast.error(
        `Failed to link invoice: ${error.message || "Please try again"}`
      );
    } finally {
      setUpdatingInvoice(null);
    }
  };

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
    const balanceText =
      invoice.available_balance !== undefined
        ? `Avail: ${formatAmount(invoice.available_balance)}`
        : `Total: ${formatAmount(invoice.total_amt)}`;

    return `${invoice.doc_number} - ${invoice.customer_display} (${balanceText})`;
  };

  const getInvoiceStatusBadge = (invoice) => {
    if (!invoice) return null;

    if (invoice.is_fully_credited) {
      return (
        <Tooltip>
          <TooltipTrigger>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300">
              <XCircleIcon className="w-3 h-3 mr-1" />
              Fully Credited
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>This invoice cannot accept more credits</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    if (invoice.available_balance < invoice.total_amt) {
      return (
        <Tooltip>
          <TooltipTrigger>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
              <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
              Partially Credited
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Available balance: {formatAmount(invoice.available_balance)}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Tooltip>
        <TooltipTrigger>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-300">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Available
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Full credit available: {formatAmount(invoice.total_amt)}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  const getLinkedInvoiceBalanceInfo = (creditNote) => {
    if (!creditNote.related_invoice) return null;

    const invoiceId = creditNote.related_invoice.id;
    const summary = invoiceCreditSummaries[invoiceId];

    if (!summary || summary.error) {
      return (
        <div className="text-xs text-gray-500">Loading balance info...</div>
      );
    }

    const utilization = summary.credit_utilization_percentage || 0;
    const available = summary.available_credit_balance || 0;
    const totalCredits = summary.calculated_total_credits || 0;

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-700">Credits:</span>
          <span className="text-xs font-semibold">
            {totalCredits.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-700">
            Utilization:
          </span>
          <span className="text-xs font-semibold">
            {utilization.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-700">Available:</span>
          <span className="text-xs font-semibold text-blue-600">
            {formatAmount(available)}
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

  const renderInvoiceSelector = (creditNote) => {
    if (creditNote.related_invoice) {
      const summary = invoiceCreditSummaries[creditNote.related_invoice.id];
      const isFullyCredited = summary?.is_fully_credited || false;

      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <div className="text-sm font-medium text-gray-900">
                  {creditNote.related_invoice.doc_number}
                </div>
                {getInvoiceStatusBadge(summary || creditNote.related_invoice)}
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

          {/* Credit utilization progress bar */}
          {summary && (
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    summary.credit_utilization_percentage || 0
                  )}%`,
                }}
              ></div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <Select
          onValueChange={(value) => handleInvoiceChange(creditNote.id, value)}
          disabled={updatingInvoice === creditNote.id || loadingInvoices}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={
                loadingInvoices
                  ? "Loading invoices..."
                  : "Select invoice to link"
              }
            />
          </SelectTrigger>
          <SelectContent className="max-h-96">
            <SelectItem value="none">
              <div className="flex items-center">
                <span>No invoice linked</span>
              </div>
            </SelectItem>
            {availableInvoices.map((invoice) => (
              <SelectItem key={invoice.id} value={invoice.id}>
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{invoice.doc_number}</span>
                    {getInvoiceStatusBadge(invoice)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {invoice.customer_display}
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span>Total: {formatAmount(invoice.total_amt)}</span>
                    {invoice.available_balance !== undefined && (
                      <span className="font-medium text-blue-600">
                        Avail: {formatAmount(invoice.available_balance)}
                      </span>
                    )}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Quick validation button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => handleValidateCreditLinkage(creditNote)}
          disabled={!creditNote.total_amt || creditNote.total_amt <= 0}
        >
          <InformationCircleIcon className="w-4 h-4 mr-2" />
          Validate Credit Amount
        </Button>
      </div>
    );
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
                      {renderInvoiceSelector(creditNote)}
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

                    {/* Invoice Balance Info */}
                    <td className="px-6 py-4">
                      {getLinkedInvoiceBalanceInfo(creditNote)}
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
                      <div className="flex flex-col space-y-2">
                        {/* KRA Validation Button */}
                        <button
                          className={`inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white transition-all duration-200 shadow-sm hover:shadow-md ${
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
                          className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
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
                {/* Enhanced Linked Invoices Stats */}
                <div className="flex items-center space-x-4">
                  <span className="text-gray-500">
                    • Linked Invoices:{" "}
                    <span className="font-medium">
                      {creditNotes.filter((cn) => cn.related_invoice).length}/
                      {creditNotes.length}
                    </span>
                  </span>
                  <span className="text-gray-500">
                    • Fully Credited Invoices:{" "}
                    <span className="font-medium">
                      {
                        Object.values(invoiceCreditSummaries).filter(
                          (summary) => summary.is_fully_credited
                        ).length
                      }
                    </span>
                  </span>
                  <span className="text-gray-500">
                    • Total Credits Applied:{" "}
                    <span className="font-medium">
                      {formatAmount(
                        Object.values(invoiceCreditSummaries).reduce(
                          (sum, summary) =>
                            sum + (summary.calculated_total_credits || 0),
                          0
                        )
                      )}
                    </span>
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Last updated: {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KRA Validation Modal */}
      <ValidationModal
        isOpen={validationModalOpen}
        onClose={() => setValidationModalOpen(false)}
        creditNote={selectedCreditNote}
        onValidate={handleValidation}
        onValidationSuccess={handleValidationSuccess}
        type="credit_note"
      />

      {/* Credit Validation Modal */}
      {selectedCreditNote && (
        <CreditValidationModal
          isOpen={creditValidationModalOpen}
          onClose={() => setCreditValidationModalOpen(false)}
          creditNote={selectedCreditNote}
          availableInvoices={availableInvoices}
          onValidate={validateCreditLinkage}
          companyInfo={companyInfo}
          onLink={handleInvoiceChange}
        />
      )}

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
