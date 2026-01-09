import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { formatAmount } from "@/utils/formatters";

const InvoiceSelector = ({
  creditNote,
  availableInvoices,
  loadingInvoices,
  isLoadingMore,
  invoicePagination,
  linkedInvoicesCache,
  updatingInvoice,
  onDropdownOpen,
  onDropdownScroll,
  onInvoiceChange,
}) => {
  const [searchInput, setSearchInput] = useState("");
  const [debounceTimer, setDebounceTimer] = useState(null);

  const getCombinedInvoices = () => {
    const combined = [...availableInvoices];
    if (
      creditNote.related_invoice?.id &&
      !availableInvoices.find((inv) => inv.id === creditNote.related_invoice.id)
    ) {
      combined.push({
        ...creditNote.related_invoice,
        doc_number:
          creditNote.related_invoice.doc_number ||
          `INV-${creditNote.related_invoice.id}`,
        customer_display:
          creditNote.related_invoice.customer_name || "Unknown Customer",
        customer_name:
          creditNote.related_invoice.customer_name || "Unknown Customer",
        total_amt: creditNote.related_invoice.total_amt || 0,
        available_balance:
          creditNote.related_invoice.available_balance ||
          creditNote.related_invoice.total_amt ||
          0,
      });
    }
    return combined;
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);

    // Debounce the search
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const newTimer = setTimeout(() => {
      onDropdownOpen(creditNote, value);
    }, 600);

    setDebounceTimer(newTimer);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    onDropdownOpen(creditNote, "");
  };

  const getInvoiceStatusBadge = (invoice) => {
    if (!invoice) return null;

    if (invoice.is_fully_credited) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
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

    if (
      invoice.available_balance !== undefined &&
      invoice.total_amt !== undefined &&
      invoice.available_balance < invoice.total_amt
    ) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
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
        <TooltipTrigger asChild>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-300">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Available
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Full credit available: {formatAmount(invoice.total_amt || 0)}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  const handleRemoveInvoice = () => {
    onInvoiceChange("none");
  };

  if (creditNote.related_invoice) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
            <div className="flex items-center space-x-2">
              <div className="text-xs font-medium text-gray-900 truncate">
                {creditNote.related_invoice.doc_number ||
                  `INV-${creditNote.related_invoice.id}`}
              </div>
              {getInvoiceStatusBadge(creditNote.related_invoice)}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {creditNote.related_invoice.customer_name || "Customer"}
            </div>
          </div>
          <button
            onClick={handleRemoveInvoice}
            disabled={updatingInvoice === creditNote.id}
            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors disabled:opacity-50 flex-shrink-0"
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
      </div>
    );
  }

  const combinedInvoices = getCombinedInvoices();

  return (
    <Select
      onValueChange={onInvoiceChange}
      disabled={updatingInvoice === creditNote.id || loadingInvoices}
      value={creditNote.related_invoice?.id || "none"}
      onOpenChange={(open) => {
        if (open) {
          onDropdownOpen(creditNote, searchInput);
        } else {
          setSearchInput("");
        }
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue
          placeholder={
            loadingInvoices ? "Loading invoices..." : "Select invoice to link"
          }
        />
      </SelectTrigger>
      <SelectContent className="max-h-96">
        <div className="max-h-96 flex flex-col">
          {/* Search Input */}
          <div className="p-2 border-b">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by invoice number or customer..."
                className="w-full pl-9 pr-8 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchInput}
                onChange={handleSearchChange}
                onClick={(e) => e.stopPropagation()} // Prevent dropdown from closing
              />
              {searchInput && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  type="button"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Scrollable invoice list */}
          <div
            className="flex-1 overflow-auto"
            onScroll={(e) => onDropdownScroll(e, creditNote.id)}
          >
            <SelectItem value="none">
              <div className="flex items-center py-2">
                <span>No invoice linked</span>
              </div>
            </SelectItem>

            {combinedInvoices.length === 0 &&
              !loadingInvoices &&
              !isLoadingMore && (
                <div className="py-4 text-center text-sm text-gray-500">
                  {searchInput
                    ? "No invoices found matching your search"
                    : "No invoices available for linking"}
                </div>
              )}

            {combinedInvoices.map((invoice) => (
              <SelectItem key={invoice.id} value={invoice.id} className="py-2">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">
                      {invoice.doc_number || `INV-${invoice.id}`}
                    </span>
                    {getInvoiceStatusBadge(invoice)}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {invoice.customer_display ||
                      invoice.customer_name ||
                      "Customer"}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>Total: {formatAmount(invoice.total_amt || 0)}</span>
                    {invoice.available_balance !== undefined && (
                      <span className="font-medium text-blue-600">
                        Avail: {formatAmount(invoice.available_balance)}
                      </span>
                    )}
                  </div>
                </div>
              </SelectItem>
            ))}

            {loadingInvoices && !isLoadingMore && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-500">
                  Loading invoices...
                </span>
              </div>
            )}

            {isLoadingMore && (
              <div className="flex items-center justify-center py-3">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-xs text-gray-500">
                  Loading more invoices...
                </span>
              </div>
            )}

            {combinedInvoices.length > 0 &&
              invoicePagination.total_pages > 1 && (
                <div className="border-t pt-2 mt-1">
                  <div className="text-xs text-gray-500 px-2 text-center">
                    Showing {combinedInvoices.length} of{" "}
                    {invoicePagination.count} invoices
                    <div className="mt-1">
                      Page {invoicePagination.page} of{" "}
                      {invoicePagination.total_pages}
                    </div>
                  </div>
                  {!isLoadingMore && invoicePagination.next && (
                    <div className="text-xs text-blue-600 text-center mt-1">
                      Scroll down to load more
                    </div>
                  )}
                </div>
              )}
          </div>
        </div>
      </SelectContent>
    </Select>
  );
};

export default InvoiceSelector;
