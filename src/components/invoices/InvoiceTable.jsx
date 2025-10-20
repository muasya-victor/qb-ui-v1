// components/invoices/InvoiceTable.jsx
"use client";
import React, { useState } from "react";
import {
  ChevronUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import StatusBadge from "../ui/StatusBadge";
import KRAStatusBadge from "../kra/KRAStatusBadge";
import ValidationModal from "../kra/ValidationModal";
import SubmissionDetailsModal from "./SubmissionDetailsModal";
import invoiceService from "../../services/invoiceService";

const InvoiceTable = ({
  invoices,
  companyInfo,
  loading,
  sortBy,
  sortOrder,
  onSort,
  onViewInvoice,
  onValidationComplete,
}) => {
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Add KRA status column to table headers
  const tableHeaders = [
    { key: "doc_number", label: "Invoice #", sortable: true },
    { key: "customer_name", label: "Customer", sortable: true },
    { key: "total_amt", label: "Total Amount", sortable: true },
    // { key: "balance", label: "Balance", sortable: true },
    { key: "status", label: "Payment Status", sortable: false },
    { key: "kra_status", label: "KRA Status", sortable: false },
    { key: "kra_invoice_number", label: "KRA #", sortable: false },
    { key: "txn_date", label: "Invoice Date", sortable: true },
    // { key: "due_date", label: "Due Date", sortable: true },
    { key: "actions", label: "Actions", sortable: false },
  ];

  const handleValidateClick = (invoice) => {
    setSelectedInvoice(invoice);
    setValidationModalOpen(true);
  };

  const handleViewSubmissionDetails = (invoice) => {
    setSelectedInvoice(invoice);
    setSelectedSubmission(invoice.kra_submission);
    setDetailsModalOpen(true);
  };

  const handleValidation = async (invoiceId) => {
    try {
      const result = await invoiceService.validateInvoiceToKRA(invoiceId);

      // Notify parent to refresh data
      if (onValidationComplete) {
        onValidationComplete();
      }

      return result;
    } catch (error) {
      throw error;
    }
  };

  const getKRAStatus = (invoice) => {
    // Use the actual kra_submission object instead of is_kra_validated
    return invoice.kra_submission?.status || "pending";
  };

  const hasKRASubmission = (invoice) => {
    return !!invoice.kra_submission;
  };

  const canValidateKRA = (invoice) => {
    // Only allow validation if no successful submission exists
    const submission = invoice.kra_submission;
    if (!submission) return true;

    // Allow re-submission for failed submissions
    return submission.status === "failed";
  };

  const getValidationButtonText = (invoice) => {
    const submission = invoice.kra_submission;

    if (!submission) return "Validate KRA";
    if (submission.status === "success") return "Validated";
    if (submission.status === "failed") return "Retry KRA";
    if (submission.status === "submitted") return "Processing";

    return "Validate KRA";
  };

  const getKRAInvoiceNumber = (invoice) => {
    return invoice.kra_submission?.kra_invoice_number || "-";
  };

  const getInvoiceStatus = (invoice) => {
    if (invoice.balance === 0 || invoice.balance === "0.00") {
      return "paid";
    } else if (invoice.due_date && new Date(invoice.due_date) < new Date()) {
      return "overdue";
    } else {
      return "pending";
    }
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
              {invoices.length === 0 ? (
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
                          No invoices found
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
                invoices.map((invoice, index) => (
                  <tr
                    key={invoice.id}
                    className={`hover:bg-blue-50 transition-colors duration-150 ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                    }`}
                  >
                    {/* Invoice Number */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-semibold text-gray-900">
                          {invoice.doc_number || `#${invoice.qb_invoice_id}`}
                        </div>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium">
                        {invoice.customer_name || "N/A"}
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatAmount(invoice.total_amt)}
                      </div>
                    </td>

                    {/* Balance */}
                    {/* <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm font-semibold ${
                          parseFloat(invoice.balance || 0) === 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatAmount(invoice.balance)}
                      </div>
                    </td> */}

                    {/* Payment Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={getInvoiceStatus(invoice)} />
                    </td>

                    {/* KRA Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <KRAStatusBadge
                        submission={invoice.kra_submission}
                        size="sm"
                      />
                    </td>

                    {/* KRA Invoice Number */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-mono">
                        {getKRAInvoiceNumber(invoice)}
                      </div>
                    </td>

                    {/* Invoice Date */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(invoice.txn_date)}
                      </div>
                    </td>

                    {/* Due Date */}
                    {/* <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm ${
                          invoice.due_date &&
                          new Date(invoice.due_date) < new Date() &&
                          parseFloat(invoice.balance || 0) > 0
                            ? "text-red-600 font-medium"
                            : "text-gray-900"
                        }`}
                      >
                        {formatDate(invoice.due_date)}
                      </div>
                    </td> */}

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {/* KRA Validation Button */}
                        <button
                          className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white transition-all duration-200 shadow-sm hover:shadow-md ${
                            canValidateKRA(invoice)
                              ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:ring-green-500"
                              : "bg-gray-400 cursor-not-allowed"
                          }`}
                          onClick={() => handleValidateClick(invoice)}
                          disabled={!canValidateKRA(invoice)}
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
                          {getValidationButtonText(invoice)}
                        </button>

                        {/* View Invoice Button */}
                        <button
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                          onClick={() =>
                            onViewInvoice && onViewInvoice(invoice)
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
        {invoices.length > 0 && (
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                Showing {invoices.length} invoice
                {invoices.length !== 1 ? "s" : ""}
                {companyInfo && (
                  <span className="ml-2 text-gray-500">
                    • Currency: {companyInfo.currency_code}
                  </span>
                )}
                {/* KRA Stats Summary */}
                <span className="ml-4 text-gray-500">
                  • KRA Validated:{" "}
                  {
                    invoices.filter(
                      (inv) => inv.kra_submission?.status === "success"
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

      {/* Validation Modal */}
      <ValidationModal
        isOpen={validationModalOpen}
        onClose={() => setValidationModalOpen(false)}
        invoice={selectedInvoice}
        onValidate={handleValidation}
      />

      {/* Submission Details Modal */}
      <SubmissionDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        invoice={selectedInvoice}
        submission={selectedSubmission}
      />
    </>
  );
};

export default InvoiceTable;
