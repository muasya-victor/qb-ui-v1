'use client';

import React from 'react';
import { X } from 'lucide-react';
import InvoiceDisplay, { Invoice, CompanyInfo } from './InvoiceDisplay';

interface InvoiceModalProps {
  invoice: Invoice | null;
  companyInfo: CompanyInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: () => void;
  onShare?: () => void;
}

export default function InvoiceModal({
  invoice,
  companyInfo,
  isOpen,
  onClose,
  onDownload,
  onShare
}: InvoiceModalProps) {
  if (!isOpen || !invoice || !companyInfo) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      // Default download behavior - print to PDF
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 bg-opacity-20 transition-opacity"
        onClick={handleBackdropClick}
      />

      {/* Modal Container */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative w-full max-w-6xl max-h-screen bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            {/* <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Invoice #{invoice.doc_number || invoice.qb_invoice_id || 'NO_INVOICE_NUMBER'}
              </h2>
              <p className="text-sm text-gray-600">{companyInfo?.name || 'NO_COMPANY_NAME'}</p>
            </div> */}
            <div/>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(100vh-8rem)]">
            <InvoiceDisplay
              invoice={invoice}
              companyInfo={companyInfo}
              onDownload={handleDownload}
              onShare={onShare}
              className="border-0 shadow-none"
            />
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content,
          .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          /* Hide modal backdrop and controls when printing */
          .fixed,
          button,
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}