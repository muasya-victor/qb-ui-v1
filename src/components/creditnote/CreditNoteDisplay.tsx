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
} from "lucide-react";

export interface CreditNoteLineItem {
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
}

export interface CompanyInfo {
  name: string;
  qb_company_name: string;
  qb_legal_name: string;
  currency_code: string;
  logo_url?: string;
  credit_note_logo_enabled: boolean;
  brand_color: string;
  credit_note_footer_text?: string;
  formatted_address?: string;
  contact_info?: {
    email?: string;
    phone?: string;
    website?: string;
  };
}

export interface CreditNote {
  id: string;
  qb_credit_note_id: string;
  doc_number: string;
  txn_date: string;
  customer_name: string;
  total_amt: number;
  balance: number;
  subtotal?: number;
  tax_total?: number;
  private_note?: string;
  customer_memo?: string;
  currency_code: string;
  status: "applied" | "pending" | "void";
  line_items: CreditNoteLineItem[];
  original_invoice_ref?: string;
}

interface CreditNoteDisplayProps {
  creditNote: CreditNote;
  companyInfo: CompanyInfo;
  onDownload?: () => void;
  onShare?: () => void;
  className?: string;
}

export default function CreditNoteDisplay({
  creditNote,
  companyInfo,
  onDownload,
  onShare,
  className = "",
}: CreditNoteDisplayProps) {
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
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "applied":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "void":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "applied":
        return "Applied";
      case "pending":
        return "Pending";
      case "void":
        return "Void";
      default:
        return status;
    }
  };

  const brandColor = companyInfo.brand_color || "#0077C5";

  return (
    <div
      className={`max-w-4xl mx-auto bg-white shadow-sm border border-gray-200 ${className}`}
    >
      {/* Header Section */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex justify-between items-start">
          {/* Company Info */}
          <div className="flex-1">
            <div className="flex items-start space-x-4">
              {companyInfo.logo_url && companyInfo.credit_note_logo_enabled && (
                <div className="flex-shrink-0">
                  <img
                    src={companyInfo.logo_url}
                    alt={`${companyInfo.name} logo`}
                    className="h-12 w-auto object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {companyInfo.qb_company_name || companyInfo.name}
                </h1>
                {companyInfo.qb_legal_name &&
                  companyInfo.qb_legal_name !== companyInfo.qb_company_name && (
                    <p className="text-gray-600 text-sm mb-2">
                      {companyInfo.qb_legal_name}
                    </p>
                  )}
                <div className="space-y-1 text-sm text-gray-600">
                  {companyInfo.formatted_address && (
                    <div className="flex items-start">
                      <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{companyInfo.formatted_address}</span>
                    </div>
                  )}
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
          </div>

          {/* Credit Note Header */}
          <div className="text-right">
            <div className="flex items-center justify-end space-x-3 mb-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                  creditNote.status
                )}`}
              >
                {getStatusText(creditNote.status)}
              </span>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Credit Note #
                {creditNote.doc_number || creditNote.qb_credit_note_id}
              </span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              CREDIT NOTE
            </h2>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-end space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Credit Date:</span>
                <span className="font-medium text-gray-900 w-24 text-left">
                  {formatDate(creditNote.txn_date)}
                </span>
              </div>
              {creditNote.original_invoice_ref && (
                <div className="flex items-center justify-end space-x-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Original Invoice:</span>
                  <span className="font-medium text-gray-900 w-24 text-left">
                    {creditNote.original_invoice_ref}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bill To and Action Bar */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Bill To
            </h3>
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <p className="font-semibold text-gray-900 text-lg">
                {creditNote.customer_name}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-8">
            {onShare && (
              <button
                onClick={onShare}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md border border-gray-300 transition-colors text-sm font-medium"
              >
                <Share className="w-4 h-4" />
                <span>Share</span>
              </button>
            )}
            {onDownload && (
              <button
                onClick={onDownload}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md border border-gray-300 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="p-6">
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">
                  Qty
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                  Rate
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                  Tax
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {creditNote.line_items.map((item, index) => (
                <tr
                  key={item.id}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {item.item_name}
                      </p>
                      {item.description && (
                        <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center text-gray-900 text-sm">
                    {item.qty}
                  </td>
                  <td className="px-4 py-4 text-right text-gray-900 text-sm">
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td className="px-4 py-4 text-right text-gray-900 text-sm">
                    {item.tax_rate
                      ? `${(item.tax_rate * 100).toFixed(1)}%`
                      : "-"}
                  </td>
                  <td className="px-4 py-4 text-right text-gray-900 text-sm font-medium">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end mt-6">
          <div className="w-80">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-700 text-sm">Subtotal</span>
                <span className="font-medium text-gray-900 text-sm">
                  {formatCurrency(creditNote.subtotal || creditNote.total_amt)}
                </span>
              </div>

              {creditNote.tax_total && creditNote.tax_total > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-700 text-sm">Tax</span>
                  <span className="font-medium text-gray-900 text-sm">
                    {formatCurrency(creditNote.tax_total)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center py-3 border-t-2 border-gray-300">
                <span className="text-lg font-semibold text-gray-900">
                  Credit Amount
                </span>
                <span
                  className="text-lg font-bold"
                  style={{ color: brandColor }}
                >
                  {formatCurrency(creditNote.total_amt)}
                </span>
              </div>

              {creditNote.balance > 0 && (
                <div className="flex justify-between items-center py-2 bg-blue-50 px-3 rounded border border-blue-200">
                  <span className="text-blue-800 font-medium text-sm">
                    Available Credit
                  </span>
                  <span className="text-blue-800 font-bold text-sm">
                    {formatCurrency(creditNote.balance)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notes Section */}
        {(creditNote.customer_memo || creditNote.private_note) && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-gray-600" />
              Notes
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
              {creditNote.customer_memo && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Message
                  </p>
                  <p className="text-gray-800 text-sm leading-relaxed">
                    {creditNote.customer_memo}
                  </p>
                </div>
              )}
              {creditNote.private_note && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Internal Notes
                  </p>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {creditNote.private_note}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        {companyInfo.credit_note_footer_text && (
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 leading-relaxed">
              {companyInfo.credit_note_footer_text}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
