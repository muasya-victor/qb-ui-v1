// components/kra/SubmissionDetailsModal.jsx
"use client";
import React from "react";
import QRCode from "react-qr-code"; // You'll need to install this package

const SubmissionDetailsModal = ({ isOpen, onClose, invoice, submission }) => {
  if (!isOpen || !submission) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleOpenReceipt = () => {
    if (submission.qr_code_data) {
      window.open(submission.qr_code_data, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">KRA Receipt</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
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
          <p className="text-sm text-gray-600 mt-1">
            Invoice: {invoice?.doc_number} - {invoice?.customer_name}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* QR Code */}
          {submission.qr_code_data && (
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                <QRCode
                  value={submission.qr_code_data}
                  size={200}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  viewBox="0 0 256 256"
                />
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Scan to view KRA receipt
                </p>
                <button
                  onClick={handleOpenReceipt}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  Open Receipt
                </button>
              </div>
            </div>
          )}

          {/* Receipt Information */}
          <div className="mt-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">KRA Invoice Number:</span>
              <span className="font-medium">
                {submission.kra_invoice_number}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Submitted:</span>
              <span className="font-medium">
                {formatDate(submission.created_at)}
              </span>
            </div>
            {submission.receipt_signature && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Signature:</span>
                <span className="font-mono text-xs">
                  {submission.receipt_signature}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetailsModal;
