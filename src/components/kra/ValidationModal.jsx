"use client";
import React, { useState, useEffect } from "react";
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";

const ValidationModal = ({ isOpen, onClose, invoice, onValidate }) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [step, setStep] = useState("confirm"); // 'confirm', 'validating', 'result'

  useEffect(() => {
    if (isOpen) {
      setStep("confirm");
      setValidationResult(null);
      setIsValidating(false);
    }
  }, [isOpen]);

  const handleValidate = async () => {
    setIsValidating(true);
    setStep("validating");

    try {
      const result = await onValidate(invoice.id);
      setValidationResult(result);
      setStep("result");
    } catch (error) {
      setValidationResult({
        success: false,
        error: error.message || "Validation failed",
      });
      setStep("result");
    } finally {
      setIsValidating(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset after a delay to allow smooth transition
    setTimeout(() => {
      setStep("confirm");
      setValidationResult(null);
    }, 300);
  };

  const renderConfirmStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full">
        <QrCodeIcon className="w-6 h-6 text-blue-600" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Validate with KRA
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          This will submit invoice <strong>{invoice.doc_number}</strong> to the
          Kenya Revenue Authority for fiscal validation. A digital receipt with
          QR code will be generated.
        </p>
      </div>
      <div className="p-4 bg-yellow-50 rounded-lg">
        <div className="flex">
          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />
          <div className="ml-3">
            <h4 className="text-sm font-medium text-yellow-800">Important</h4>
            <div className="mt-1 text-sm text-yellow-700">
              <p>• This action cannot be undone</p>
              <p>• Invoice number will be sequential as per KRA requirements</p>
              <p>• Digital receipt will be stored in the system</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderValidatingStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Validating with KRA
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Submitting invoice to Kenya Revenue Authority...
        </p>
      </div>
    </div>
  );

  const renderResultStep = () => {
    const isSuccess = validationResult?.success;

    return (
      <div className="space-y-4">
        <div
          className={`flex items-center justify-center w-12 h-12 mx-auto rounded-full ${
            isSuccess ? "bg-green-100" : "bg-red-100"
          }`}
        >
          {isSuccess ? (
            <CheckCircleIcon className="w-6 h-6 text-green-600" />
          ) : (
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
          )}
        </div>
        <div className="text-center">
          <h3
            className={`text-lg font-semibold ${
              isSuccess ? "text-green-900" : "text-red-900"
            }`}
          >
            {isSuccess ? "Validation Successful" : "Validation Failed"}
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            {isSuccess
              ? "Invoice has been successfully validated with KRA and a digital receipt has been generated."
              : validationResult?.error ||
                "An error occurred during validation."}
          </p>
        </div>

        {isSuccess && validationResult && (
          <div className="p-4 bg-green-50 rounded-lg space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">
                  KRA Invoice #:
                </span>
                <div className="text-green-600 font-semibold">
                  {validationResult.kra_invoice_number}
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-700">
                  Receipt Signature:
                </span>
                <div className="font-mono text-xs text-green-600">
                  {validationResult.receipt_signature}
                </div>
              </div>
            </div>

            {validationResult.qr_code_data && (
              <div className="text-center">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                  <QrCodeIcon className="w-3 h-3 mr-1" />
                  QR Code Generated
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Scan to verify receipt on KRA portal
                </p>
              </div>
            )}
          </div>
        )}

        {!isSuccess && validationResult?.error && (
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-red-700">{validationResult.error}</p>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-full p-4 text-center sm:items-center sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleClose}
        />

        <div className="relative px-4 pt-5 pb-4 overflow-hidden text-left transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          {/* Close button */}
          <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
            <button
              type="button"
              className="text-gray-400 bg-white rounded-md hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={handleClose}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="sm:flex sm:items-start">
            <div className="w-full mt-3 text-center sm:mt-0 sm:text-left">
              {step === "confirm" && renderConfirmStep()}
              {step === "validating" && renderValidatingStep()}
              {step === "result" && renderResultStep()}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            {step === "confirm" && (
              <>
                <button
                  type="button"
                  className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleValidate}
                >
                  Validate with KRA
                </button>
                <button
                  type="button"
                  className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={handleClose}
                >
                  Cancel
                </button>
              </>
            )}

            {step === "result" && (
              <button
                type="button"
                className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={handleClose}
              >
                {validationResult?.success ? "Done" : "Close"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidationModal;
