"use client";
import React, { useState } from "react";
import {
  ChevronUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import StatusBadge from "../ui/StatusBadge";

// Add KRA PIN validation function
const validateKraPin = (pin: string): boolean => {
  if (!pin) return true; // Empty is valid
  const pattern = /^[A-Z]{1}\d{9}[A-Z]{1}$/;
  return pattern.test(pin);
};

interface Customer {
  id: string;
  qb_customer_id: string;
  display_name: string;
  given_name?: string;
  family_name?: string;
  company_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
  website?: string;
  kra_pin?: string;
  balance: number;
  balance_with_jobs: number;
  active: boolean;
  notes?: string;
  taxable: boolean;
  tax_code_ref_value?: string;
  tax_code_ref_name?: string;
  currency_code: string;
  created_at: string;
  updated_at: string;
  is_stub?: boolean;
  bill_addr_line1?: string;
  bill_addr_line2?: string;
  bill_addr_city?: string;
  bill_addr_state?: string;
  bill_addr_postal_code?: string;
  bill_addr_country?: string;
  ship_addr_line1?: string;
  ship_addr_line2?: string;
  ship_addr_city?: string;
  ship_addr_state?: string;
  ship_addr_postal_code?: string;
  ship_addr_country?: string;
}

interface CustomerTableProps {
  customers: Customer[];
  companyInfo?: {
    currency_code: string;
    name: string;
    realm_id: string;
  };
  loading: boolean;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;
  onViewCustomer?: (customer: Customer) => void;
  onEditCustomer?: (customer: Customer) => void;
  onUpdateCustomer?: (
    customerId: string,
    updates: Partial<Customer>
  ) => Promise<void>;
}

const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  companyInfo,
  loading,
  sortBy,
  sortOrder,
  onSort,
  onViewCustomer,
  onEditCustomer,
  onUpdateCustomer,
}) => {
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(
    null
  );
  const [editingKraPin, setEditingKraPin] = useState<string>("");
  const [kraError, setKraError] = useState<string | null>(null);
  const [updatingCustomerId, setUpdatingCustomerId] = useState<string | null>(
    null
  );

  const formatAmount = (amount: number | string) => {
    if (!amount) amount = 0;
    const numericAmount = parseFloat(amount as string);

    const currencyCode = companyInfo?.currency_code || "USD";

    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode,
      }).format(numericAmount);
    } catch (error) {
      console.warn("Invalid currency code:", currencyCode);
      return `${currencyCode} ${numericAmount.toFixed(2)}`;
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ChevronUpDownIcon className="w-4 h-4 text-gray-400" />;
    }
    if (sortOrder === "asc") {
      return <ChevronUpIcon className="w-4 h-4 text-blue-500" />;
    }
    return <ChevronDownIcon className="w-4 h-4 text-blue-500" />;
  };

  const handleKraPinChange = (value: string) => {
    const uppercaseValue = value.toUpperCase();
    setEditingKraPin(uppercaseValue);

    if (uppercaseValue && !validateKraPin(uppercaseValue)) {
      setKraError(
        "KRA PIN must be in the format A000000000B (one letter, nine digits, one letter)"
      );
    } else {
      setKraError(null);
    }
  };

  const startEditing = (customer: Customer) => {
    setEditingCustomerId(customer.id);
    setEditingKraPin(customer.kra_pin || "");
    setKraError(null);
  };

  const cancelEditing = () => {
    setEditingCustomerId(null);
    setEditingKraPin("");
    setKraError(null);
  };

  const saveKraPin = async (customer: Customer) => {
    if (kraError) {
      return; // Don't save if there's an error
    }

    if (editingKraPin === customer.kra_pin) {
      cancelEditing();
      return;
    }

    if (!onUpdateCustomer) {
      console.error("onUpdateCustomer function is required for inline editing");
      cancelEditing();
      return;
    }

    try {
      setUpdatingCustomerId(customer.id);
      await onUpdateCustomer(customer.id, { kra_pin: editingKraPin || null });
      cancelEditing();
    } catch (error) {
      console.error("Failed to update KRA PIN:", error);
      setKraError("Failed to update KRA PIN. Please try again.");
    } finally {
      setUpdatingCustomerId(null);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent, customer: Customer) => {
    if (event.key === "Enter") {
      saveKraPin(customer);
    } else if (event.key === "Escape") {
      cancelEditing();
    }
  };

  const tableHeaders = [
    { key: "display_name", label: "Customer Name", sortable: true },
    { key: "company_name", label: "Company", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "phone", label: "Phone", sortable: false },
    { key: "kra_pin", label: "KRA PIN", sortable: true },
    { key: "balance", label: "Balance", sortable: true },
    { key: "active", label: "Status", sortable: true },
    { key: "created_at", label: "Customer Since", sortable: true },
    { key: "actions", label: "Actions", sortable: false },
  ];

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
            {customers.length === 0 ? (
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
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        No customers found
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
              customers.map((customer, index) => (
                <tr
                  key={customer.id}
                  className={`hover:bg-blue-50 transition-colors duration-150 ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                  }`}
                >
                  {/* Customer Name */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-semibold text-gray-900">
                        {customer.display_name}
                      </div>
                    </div>
                  </td>

                  {/* Company */}
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {customer.company_name || "Individual"}
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {customer.email || "N/A"}
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {customer.phone || "N/A"}
                    </div>
                  </td>

                  {/* KRA PIN - Inline Editable */}
                  <td className="px-6 py-4 whitespace-nowrap text-black">
                    {editingCustomerId === customer.id ? (
                      <div className="relative">
                        <input
                          type="text"
                          value={editingKraPin}
                          onChange={(e) => handleKraPinChange(e.target.value)}
                          onKeyDown={(e) => handleKeyPress(e, customer)}
                          className={`w-32 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 ${
                            kraError
                              ? "border-red-300 focus:ring-red-500"
                              : "border-gray-300 focus:ring-blue-500"
                          }`}
                          placeholder="A000000000B"
                          maxLength={11}
                          autoFocus
                        />
                        {kraError && (
                          <div className="absolute top-full left-0 mt-1 w-64 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200 z-10">
                            {kraError}
                          </div>
                        )}
                        <div className="flex space-x-1 mt-1">
                          <button
                            onClick={() => saveKraPin(customer)}
                            disabled={
                              !!kraError || updatingCustomerId === customer.id
                            }
                            className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            {updatingCustomerId === customer.id
                              ? "Saving..."
                              : "✓"}
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                          >
                            ✗
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="flex items-center space-x-2 group cursor-pointer"
                        onClick={() => startEditing(customer)}
                      >
                        <div
                          className={`text-sm ${
                            customer.kra_pin
                              ? "text-gray-900"
                              : "text-gray-400 italic"
                          }`}
                        >
                          {customer.kra_pin || "Click to add KRA PIN"}
                        </div>
                        <svg
                          className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </div>
                    )}
                  </td>

                  {/* Balance */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`text-sm font-semibold ${
                        parseFloat(customer.balance?.toString() || "0") === 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatAmount(customer.balance)}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge
                      status={customer.active ? "active" : "inactive"}
                      labels={{ active: "Active", inactive: "Inactive" }}
                    />
                  </td>

                  {/* Customer Since */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {customer.created_at
                        ? new Date(customer.created_at).toLocaleDateString()
                        : "N/A"}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        onClick={() =>
                          onViewCustomer && onViewCustomer(customer)
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
                      {/* <button
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                        onClick={() =>
                          onEditCustomer && onEditCustomer(customer)
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Edit
                      </button> */}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Summary */}
      {customers.length > 0 && (
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Showing {customers.length} customer
              {customers.length !== 1 ? "s" : ""}
              {companyInfo && (
                <span className="ml-2 text-gray-500">
                  • Currency: {companyInfo.currency_code}
                </span>
              )}
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

export default CustomerTable;
