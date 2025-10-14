"use client";

import React from "react";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Building,
  User,
  Calendar,
  DollarSign,
} from "lucide-react";

export interface Customer {
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
  balance: number;
  balance_with_jobs: number;
  active: boolean;
  notes?: string;
  taxable: boolean;
  tax_code_ref_name?: string;
  currency_code: string;
  created_at: string;
  updated_at: string;

  // Address fields
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

export interface CompanyInfo {
  name: string;
  qb_company_name: string;
  currency_code: string;
  logo_url?: string;
  brand_color: string;
  contact_info?: {
    email?: string;
    phone?: string;
    website?: string;
  };
}

interface CustomerDisplayProps {
  customer: Customer;
  companyInfo: CompanyInfo;
  onEdit?: () => void;
  onViewInvoices?: () => void;
  className?: string;
}

export default function CustomerDisplay({
  customer,
  companyInfo,
  onEdit,
  onViewInvoices,
  className = "",
}: CustomerDisplayProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: customer.currency_code || companyInfo.currency_code || "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const getPrimaryContact = () => {
    if (customer.given_name && customer.family_name) {
      return `${customer.given_name} ${customer.family_name}`;
    }
    return customer.display_name;
  };

  const getBillingAddress = () => {
    const parts = [
      customer.bill_addr_line1,
      customer.bill_addr_line2,
      customer.bill_addr_city,
      customer.bill_addr_state,
      customer.bill_addr_postal_code,
      customer.bill_addr_country,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(", ") : "No billing address";
  };

  const getShippingAddress = () => {
    const parts = [
      customer.ship_addr_line1,
      customer.ship_addr_line2,
      customer.ship_addr_city,
      customer.ship_addr_state,
      customer.ship_addr_postal_code,
      customer.ship_addr_country,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(", ") : "No shipping address";
  };

  const brandColor = companyInfo.brand_color || "#0077C5";

  return (
    <div
      className={`max-w-4xl mx-auto bg-white shadow-lg border border-gray-300 ${className}`}
    >
      {/* Header Section */}
      <div
        className="border-b border-gray-300 p-8"
        style={{ borderBottomColor: brandColor }}
      >
        <div className="flex justify-between items-start mb-6">
          {/* Company Info - Left aligned */}
          <div className="flex-1">
            {companyInfo.logo_url ? (
              <div className="mb-4">
                <img
                  src={companyInfo.logo_url}
                  alt={`${companyInfo.name} logo`}
                  className="h-16 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            ) : (
              <div className="mb-4">
                <div className="h-16 flex items-center justify-center bg-gray-100 border border-gray-300">
                  <span className="text-lg font-bold text-gray-600">
                    {companyInfo.name}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {companyInfo.qb_company_name || companyInfo.name}
              </h1>
              <p className="text-gray-600 text-sm">Customer Details</p>
            </div>
          </div>

          {/* Customer Header - Right aligned */}
          <div className="text-right">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              CUSTOMER PROFILE
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-end space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Since:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {formatDate(customer.created_at)}
                </span>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium border ${
                  customer.active
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-red-100 text-red-800 border-red-200"
                } inline-block mt-2`}
              >
                {customer.active ? "Active" : "Inactive"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Details */}
      <div className="p-8">
        {/* Basic Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Primary Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Basic Information
            </h3>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Building className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Display Name</p>
                  <p className="font-medium text-gray-900">
                    {customer.display_name}
                  </p>
                </div>
              </div>

              {customer.company_name && (
                <div className="flex items-start space-x-3">
                  <Building className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Company Name</p>
                    <p className="font-medium text-gray-900">
                      {customer.company_name}
                    </p>
                  </div>
                </div>
              )}

              {(customer.given_name || customer.family_name) && (
                <div className="flex items-start space-x-3">
                  <User className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Contact Person</p>
                    <p className="font-medium text-gray-900">
                      {getPrimaryContact()}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-3">
                <DollarSign className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Tax Status</p>
                  <p className="font-medium text-gray-900">
                    {customer.taxable ? "Taxable" : "Non-taxable"}
                    {customer.tax_code_ref_name &&
                      ` (${customer.tax_code_ref_name})`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Contact Information
            </h3>

            <div className="space-y-4">
              {customer.email && (
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">
                      {customer.email}
                    </p>
                  </div>
                </div>
              )}

              {customer.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">
                      {customer.phone}
                    </p>
                  </div>
                </div>
              )}

              {customer.mobile && (
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Mobile</p>
                    <p className="font-medium text-gray-900">
                      {customer.mobile}
                    </p>
                  </div>
                </div>
              )}

              {customer.website && (
                <div className="flex items-center space-x-3">
                  <Globe className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Website</p>
                    <p className="font-medium text-gray-900">
                      {customer.website}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Billing Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Billing Address
            </h3>
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-medium text-gray-900 whitespace-pre-line">
                  {getBillingAddress()}
                </p>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Shipping Address
            </h3>
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-medium text-gray-900 whitespace-pre-line">
                  {getShippingAddress()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Financial Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Current Balance</p>
              <p
                className={`text-2xl font-bold ${
                  customer.balance > 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {formatCurrency(customer.balance)}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Balance With Jobs</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(customer.balance_with_jobs)}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Customer Since</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatDate(customer.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        {customer.notes && (
          <div className="mt-8 pt-6 border-t border-gray-300">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <p className="text-gray-800 whitespace-pre-line">
                {customer.notes}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 pt-6 border-t border-gray-300 flex justify-end space-x-4">
          {onViewInvoices && (
            <button
              onClick={onViewInvoices}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View Invoices
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Edit Customer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
