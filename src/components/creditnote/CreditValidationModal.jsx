"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { toast } from "../../lib/toast";
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

const CreditValidationModal = ({
  isOpen,
  onClose,
  creditNote,
  availableInvoices,
  onValidate,
  onLink,
  companyInfo,
}) => {
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedInvoice(null);
      setValidationResult(null);
    }
  }, [isOpen]);

  const handleValidate = async () => {
    if (!selectedInvoice || !creditNote) return;

    try {
      setLoading(true);
      const result = await onValidate(creditNote.id, selectedInvoice.id);
      setValidationResult(result);
    } catch (error) {
      toast.error(`Validation failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async () => {
    if (!selectedInvoice || !creditNote) return;

    try {
      await onLink(creditNote.id, selectedInvoice.id);
      onClose();
    } catch (error) {
      // Error handled in parent
    }
  };

  const formatAmount = (amount) => {
    if (!amount) amount = 0;
    const numericAmount = parseFloat(amount);
    const currencyCode = companyInfo?.currency_code || "USD"; // Now companyInfo is defined

    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode,
      }).format(numericAmount);
    } catch (error) {
      return `${currencyCode} ${numericAmount.toFixed(2)}`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Validate Credit Note Linkage</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Credit Note Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">
              Credit Note Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-600">Credit Note #</p>
                <p className="font-medium">{creditNote?.doc_number}</p>
              </div>
              <div>
                <p className="text-sm text-blue-600">Amount</p>
                <p className="font-medium text-green-600">
                  {formatAmount(creditNote?.total_amt)}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-600">Customer</p>
                <p className="font-medium">{creditNote?.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-blue-600">Date</p>
                <p className="font-medium">
                  {new Date(creditNote?.txn_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Invoice Selection */}
          <div>
            <h3 className="font-semibold mb-3">Select Invoice to Link</h3>
            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
              {availableInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedInvoice?.id === invoice.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    setSelectedInvoice(invoice);
                    setValidationResult(null);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{invoice.doc_number}</p>
                      <p className="text-sm text-gray-500">
                        {invoice.customer_display}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatAmount(invoice.total_amt)}
                      </p>
                      {invoice.available_balance !== undefined && (
                        <p className="text-sm text-blue-600">
                          Available: {formatAmount(invoice.available_balance)}
                        </p>
                      )}
                    </div>
                  </div>
                  {invoice.is_fully_credited && (
                    <div className="flex items-center mt-2 text-amber-600 text-sm">
                      <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                      Invoice is fully credited
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Validation Result */}
          {validationResult && (
            <div
              className={`p-4 rounded-lg ${
                validationResult.validation.valid
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="flex items-start">
                {validationResult.validation.valid ? (
                  <CheckCircleIcon className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" />
                ) : (
                  <XCircleIcon className="w-6 h-6 text-red-500 mr-3 flex-shrink-0" />
                )}
                <div>
                  <h4
                    className={`font-semibold ${
                      validationResult.validation.valid
                        ? "text-green-800"
                        : "text-red-800"
                    }`}
                  >
                    {validationResult.validation.valid
                      ? "✓ Validation Successful"
                      : "✗ Validation Failed"}
                  </h4>
                  <p className="mt-1 text-sm">
                    {validationResult.validation.message}
                  </p>
                  {validationResult.validation.available_balance && (
                    <div className="mt-2 text-sm">
                      <p>
                        Available Balance:{" "}
                        {formatAmount(
                          validationResult.validation.available_balance
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleValidate}
              disabled={!selectedInvoice || loading}
              loading={loading}
            >
              Validate
            </Button>
            <Button
              variant="default"
              onClick={handleLink}
              disabled={
                !selectedInvoice ||
                !validationResult?.validation?.valid ||
                loading
              }
              loading={loading}
            >
              Link Invoice
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreditValidationModal;
