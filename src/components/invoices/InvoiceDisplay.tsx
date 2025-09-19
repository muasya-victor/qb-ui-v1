'use client';

import React from 'react';
import { Calendar, MapPin, Phone, Mail, Globe, FileText, Download, Share } from 'lucide-react';

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
  private_note?: string;
  customer_memo?: string;
  currency_code: string;
  status: 'paid' | 'unpaid' | 'partial';
  line_items: InvoiceLineItem[];
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
  className = ''
}: InvoiceDisplayProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: companyInfo.currency_code || 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) return 'Invalid Date';

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Date formatting error:', error, 'for date:', dateString);
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-50 border-green-200';
      case 'unpaid': return 'text-red-600 bg-red-50 border-red-200';
      case 'partial': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const brandColor = companyInfo.brand_color || '#0077C5';

  // Debug logging
  console.log('Invoice data:', invoice);
  console.log('Company info:', companyInfo);
  console.log('Invoice doc_number:', invoice.doc_number);
  console.log('Invoice qb_invoice_id:', invoice.qb_invoice_id);
  console.log('Invoice txn_date:', invoice.txn_date);
  console.log('Invoice due_date:', invoice.due_date);
  console.log('Formatted txn_date:', formatDate(invoice.txn_date));
  console.log('Formatted due_date:', formatDate(invoice.due_date));

  return (
    <div className={`max-w-4xl mx-auto bg-white shadow-lg ${className}`}>
      {/* Action Bar */}
      <div className="flex justify-between items-center p-4 bg-gray-50 border-b">
        <div className="flex items-center space-x-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(invoice.status)}`}>
            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
          </span>
          <span className="text-sm text-gray-500">
            Invoice #{invoice.doc_number || invoice.qb_invoice_id || 'NO_INVOICE_NUMBER'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {onShare && (
            <button
              onClick={onShare}
              className="flex items-center space-x-1 px-3 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Share className="w-4 h-4" />
              <span className="text-sm">Share</span>
            </button>
          )}
          {onDownload && (
            <button
              onClick={onDownload}
              className="flex items-center space-x-1 px-3 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">Download</span>
            </button>
          )}
        </div>
      </div>

      {/* Invoice Content */}
      <div className="p-8">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-8">
          {/* Company Info */}
          <div className="flex-1">
            {companyInfo.logo_url && companyInfo.invoice_logo_enabled && (
              <div className="mb-4">
                <img
                  src={companyInfo.logo_url}
                  alt={`${companyInfo.name} logo`}
                  className="h-16 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            <div>
              <h1
                className="text-2xl font-bold mb-2"
                style={{ color: brandColor }}
              >
                {companyInfo.qb_company_name || companyInfo.name}
              </h1>
              {companyInfo.qb_legal_name && companyInfo.qb_legal_name !== companyInfo.qb_company_name && (
                <p className="text-gray-600 text-sm mb-2">{companyInfo.qb_legal_name}</p>
              )}
              {companyInfo.formatted_address && (
                <div className="flex items-start space-x-2 text-gray-600 text-sm mb-1">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{companyInfo.formatted_address}</span>
                </div>
              )}
              {companyInfo.contact_info && (
                <div className="space-y-1">
                  {companyInfo.contact_info.phone && (
                    <div className="flex items-center space-x-2 text-gray-600 text-sm">
                      <Phone className="w-4 h-4" />
                      <span>{companyInfo.contact_info.phone}</span>
                    </div>
                  )}
                  {companyInfo.contact_info.email && (
                    <div className="flex items-center space-x-2 text-gray-600 text-sm">
                      <Mail className="w-4 h-4" />
                      <span>{companyInfo.contact_info.email}</span>
                    </div>
                  )}
                  {companyInfo.contact_info.website && (
                    <div className="flex items-center space-x-2 text-gray-600 text-sm">
                      <Globe className="w-4 h-4" />
                      <span>{companyInfo.contact_info.website}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Invoice Details */}
          <div className="text-right">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">INVOICE</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Invoice #:</span>
                <span className="ml-2 font-medium">{invoice.doc_number || invoice.qb_invoice_id || 'NO_INVOICE_NUMBER'}</span>
              </div>
              <div className="flex items-center justify-end space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-500">Date:</span>
                <span className="ml-2 font-medium">{formatDate(invoice.txn_date) || 'NO_DATE'}</span>
              </div>
              {invoice.due_date && (
                <div className="flex items-center justify-end space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-500">Due:</span>
                  <span className="ml-2 font-medium">{formatDate(invoice.due_date) || 'NO_DUE_DATE'}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bill To Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Bill To:</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-medium text-gray-800">{invoice.customer_name}</p>
            {/* Add customer address here when available */}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mb-8">
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: brandColor + '10' }}>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800 border-b border-gray-200">
                    Description
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-800 border-b border-gray-200">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-800 border-b border-gray-200">
                    Unit Price
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-800 border-b border-gray-200">
                    Tax Rate
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-800 border-b border-gray-200">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.line_items.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 border-b border-gray-100">
                      <div>
                        <p className="font-medium text-gray-800">{item.item_name}</p>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center border-b border-gray-100">
                      <span className="text-gray-800">{item.qty}</span>
                    </td>
                    <td className="px-4 py-3 text-right border-b border-gray-100">
                      <span className="text-gray-800">{formatCurrency(item.unit_price)}</span>
                    </td>
                    <td className="px-4 py-3 text-right border-b border-gray-100">
                      <span className="text-gray-800">
                        {item.tax_rate ? `${(item.tax_rate * 100).toFixed(2)}%` : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right border-b border-gray-100">
                      <span className="font-medium text-gray-800">{formatCurrency(item.amount)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end mb-8">
          <div className="w-80">
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(invoice.subtotal || invoice.total_amt)}</span>
              </div>
              {invoice.tax_total && invoice.tax_total > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-medium">{formatCurrency(invoice.tax_total)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b-2 border-gray-300">
                <span className="text-lg font-semibold text-gray-800">Total:</span>
                <span className="text-lg font-bold" style={{ color: brandColor }}>
                  {formatCurrency(invoice.total_amt)}
                </span>
              </div>
              {invoice.balance > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Amount Due:</span>
                  <span className="font-bold text-red-600">{formatCurrency(invoice.balance)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notes Section */}
        {(invoice.customer_memo || invoice.private_note) && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Notes
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              {invoice.customer_memo && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Message to Customer:</p>
                  <p className="text-gray-800">{invoice.customer_memo}</p>
                </div>
              )}
              {invoice.private_note && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Internal Note:</p>
                  <p className="text-gray-600">{invoice.private_note}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        {companyInfo.invoice_footer_text && (
          <div className="text-center pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600">{companyInfo.invoice_footer_text}</p>
          </div>
        )}
      </div>
    </div>
  );
}