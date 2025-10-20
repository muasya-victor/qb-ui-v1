"use client";

import React from "react";
import {
  Calendar,
  MapPin,
  Phone,
  Mail,
  Globe,
  FileText,
  Download,
  Share,
  QrCode,
} from "lucide-react";
import QRCode from "react-qr-code";

export interface InvoiceLineItem {
  id: string;
  line_num: number;
  item_name: string;
  description: string;
  qty: number;
  unit_price: number;
  amount: number;
  tax_code_ref?: string;
  tax_amount?: number;
  tax_rate?: number;
  hs_code?: string;
  weight_lbs?: number;
  material_description?: string;
}

export interface CompanyInfo {
  name: string;
  qb_company_name: string;
  qb_legal_name: string;
  currency_code: string;
  logo_url?: string;
  invoice_logo_enabled: boolean;
  brand_color: string;
  invoice_footer_text?: string;
  formatted_address?: string;
  contact_info?: {
    email?: string;
    phone?: string;
    website?: string;
  };
}

export interface KRASubmission {
  id: string;
  kra_invoice_number: number;
  trd_invoice_no: string;
  status: string;
  qr_code_data?: string;
  receipt_signature?: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  qb_invoice_id: string;
  doc_number: string;
  txn_date: string;
  due_date: string;
  customer_name: string;
  total_amt: number;
  balance: number;
  subtotal?: number;
  tax_total?: number;
  shipping_total?: number;
  private_note?: string;
  customer_memo?: string;
  currency_code: string;
  status: "paid" | "unpaid" | "partial";
  line_items: InvoiceLineItem[];
  // Commercial invoice specific fields
  exporter_info?: string;
  consignee_info?: string;
  country_of_export?: string;
  reason_for_export?: string;
  country_of_destination?: string;
  // KRA submission
  kra_submission?: KRASubmission;
}

interface InvoiceDisplayProps {
  invoice: Invoice;
  companyInfo: CompanyInfo;
  onDownload?: () => void;
  onShare?: () => void;
  className?: string;
}

export default function InvoiceDisplay({
  invoice,
  companyInfo,
  onDownload,
  onShare,
  className = "",
}: InvoiceDisplayProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: companyInfo.currency_code || "USD",
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "unpaid":
        return "bg-red-100 text-red-800 border-red-200";
      case "partial":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleOpenReceipt = () => {
    if (invoice.kra_submission?.qr_code_data) {
      window.open(
        invoice.kra_submission.qr_code_data,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  const brandColor = companyInfo.brand_color || "#0077C5";

  return (
    <div
      className={`max-w-4xl mx-auto bg-white shadow-lg border border-gray-300 ${className}`}
    >
      {/* Header Section */}
      <div className="border-b border-gray-300 p-8">
        <div className="flex justify-between items-start mb-8">
          {/* Company Logo and Info - Left aligned */}
          <div className="flex-1">
            {companyInfo.logo_url && companyInfo.invoice_logo_enabled ? (
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
                    Replace with LOGO
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {companyInfo.qb_company_name || companyInfo.name}
              </h1>
              {companyInfo.formatted_address && (
                <p className="text-gray-700 text-sm">
                  {companyInfo.formatted_address}
                </p>
              )}
              <div className="space-y-1 text-sm text-gray-600">
                {companyInfo.contact_info?.phone && (
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    <span>{companyInfo.contact_info.phone}</span>
                  </div>
                )}
                {companyInfo.contact_info?.email && (
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    <span>{companyInfo.contact_info.email}</span>
                  </div>
                )}
                {companyInfo.contact_info?.website && (
                  <div className="flex items-center">
                    <Globe className="w-4 h-4 mr-2" />
                    <span>{companyInfo.contact_info.website}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Header - Right aligned */}
          <div className="text-right">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              COMMERCIAL INVOICE
            </h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Invoice #:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {invoice.doc_number || invoice.qb_invoice_id || "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-end space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Date:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {formatDate(invoice.txn_date)}
                </span>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                  invoice.status
                )} inline-block mt-2`}
              >
                {invoice.status.charAt(0).toUpperCase() +
                  invoice.status.slice(1)}
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-300 my-6"></div>

        {/* Exporter and Consignee Section */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          {/* Exporter */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Exporter
            </h3>
            <div className="bg-gray-50 p-4 border border-gray-200 rounded">
              <p className="text-gray-900 font-medium">
                {invoice.customer_name}
              </p>
              {invoice.exporter_info && (
                <p className="text-gray-600 text-sm mt-1">
                  {invoice.exporter_info}
                </p>
              )}
            </div>
          </div>

          {/* Consignee */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Consignee
            </h3>
            <div className="bg-gray-50 p-4 border border-gray-200 rounded">
              <p className="text-gray-900 font-medium">
                {invoice.customer_name}
              </p>
              {invoice.consignee_info && (
                <p className="text-gray-600 text-sm mt-1">
                  {invoice.consignee_info}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Export Information */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div>
            <span className="text-sm font-semibold text-gray-700">
              Country of export:
            </span>
            <p className="text-gray-900 mt-1">
              {invoice.country_of_export || "United States"}
            </p>
          </div>
          <div>
            <span className="text-sm font-semibold text-gray-700">
              Reason for export:
            </span>
            <p className="text-gray-900 mt-1">
              {invoice.reason_for_export || "Sale"}
            </p>
          </div>
          <div>
            <span className="text-sm font-semibold text-gray-700">
              Country of destination:
            </span>
            <p className="text-gray-900 mt-1">
              {invoice.country_of_destination || "Various"}
            </p>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="p-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Product</h3>

        <div className="overflow-hidden border border-gray-300">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300">
                  Description (Material)
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300 w-24">
                  HS Code
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300 w-20">
                  Qty
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300 w-24">
                  Wt (lbs)
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300 w-32">
                  Unit value
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider w-32">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.line_items.map((item, index) => (
                <tr
                  key={item.id}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-4 py-3 border-r border-gray-300">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {item.item_name}
                      </p>
                      <p className="text-gray-600 text-xs mt-1">
                        {item.material_description ||
                          item.description ||
                          "Product description"}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center border-r border-gray-300 text-sm text-gray-900">
                    {item.hs_code || "0"}
                  </td>
                  <td className="px-4 py-3 text-center border-r border-gray-300 text-sm text-gray-900">
                    {item.qty}
                  </td>
                  <td className="px-4 py-3 text-center border-r border-gray-300 text-sm text-gray-900">
                    {item.weight_lbs || "0"}
                  </td>
                  <td className="px-4 py-3 text-center border-r border-gray-300 text-sm text-gray-900">
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-300 my-6"></div>

        {/* Totals Section */}
        <div className="flex justify-end">
          <div className="w-80">
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-700">Subtotal:</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(invoice.subtotal || invoice.total_amt)}
                </span>
              </div>

              {invoice.tax_total && invoice.tax_total > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Sales tax:</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(invoice.tax_total)}
                  </span>
                </div>
              )}

              {invoice.shipping_total && invoice.shipping_total > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Shipping:</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(invoice.shipping_total)}
                  </span>
                </div>
              )}

              <div className="flex justify-between py-3 border-t-2 border-gray-400">
                <span className="text-lg font-semibold text-gray-900">
                  Total:
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(invoice.total_amt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* KRA QR Code Section */}
        {invoice.kra_submission?.qr_code_data && (
          <div className="mt-8 pt-6 ">
            <div className="">
              <QRCode
                value={invoice.kra_submission.qr_code_data}
                size={150}
                style={{
                  height: "auto",
                  maxWidth: "100px",
                  width: "100px",
                }}
                viewBox="0 0 256 256"
              />
            </div>
          </div>
        )}

        {/* Notes Section */}
        {(invoice.customer_memo || invoice.private_note) && (
          <div className="mt-8 pt-6 border-t border-gray-300 hidden">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-gray-600" />
              Notes
            </h3>
            <div className="bg-gray-50 p-4 rounded border border-gray-200 space-y-3">
              {invoice.customer_memo && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Customer Message:
                  </p>
                  <p className="text-gray-800">{invoice.customer_memo}</p>
                </div>
              )}
              {invoice.private_note && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Internal Notes:
                  </p>
                  <p className="text-gray-600">{invoice.private_note}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        {companyInfo.invoice_footer_text && (
          <div className="mt-8 pt-6 border-t border-gray-300 text-center">
            <p className="text-sm text-gray-600">
              {companyInfo.invoice_footer_text}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
