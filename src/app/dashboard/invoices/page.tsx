// src/app/dashboard/invoices/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import InvoiceManager from "../../../components/invoices/InvoiceManager";
import { useDashboard } from "../layout";
import invoiceService from "../../../services/invoiceService";
import { useCompany } from "../../../contexts/CompanyContext";

const InvoicesPage: React.FC = () => {
  const { statusFilter, setStatusFilter } = useDashboard();
  const { activeCompany, isLoading: companyLoading } = useCompany();
  const [kraConfigStatus, setKraConfigStatus] = useState<{
    configured: boolean;
    message?: string;
    loading: boolean;
  }>({ configured: false, loading: true });

  // Check KRA configuration when active company changes
  useEffect(() => {
    const checkKRAConfig = async () => {
      if (!activeCompany?.id) {
        setKraConfigStatus({
          configured: false,
          message: "No company selected",
          loading: false,
        });
        return;
      }

      try {
        setKraConfigStatus((prev) => ({ ...prev, loading: true }));

        const config = await invoiceService.checkKRAConfiguration(
          activeCompany.id
        );
        setKraConfigStatus({
          configured: config.configured,
          message: config.message,
          loading: false,
        });
      } catch (error) {
        console.error("Error checking KRA configuration:", error);
        setKraConfigStatus({
          configured: false,
          message: "Unable to verify KRA configuration",
          loading: false,
        });
      }
    };

    if (!companyLoading) {
      checkKRAConfig();
    }
  }, [activeCompany, companyLoading]);

  const handleBulkKRAValidation = async () => {
    if (!activeCompany) {
      toast.error("Please select a company first");
      return;
    }

    console.log(
      "Starting bulk KRA validation for company:",
      activeCompany.name
    );
    // You can implement bulk validation logic here
    // This could open a modal for selecting multiple invoices
  };



  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Invoices
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your invoices and validate with KRA for fiscal compliance
            {activeCompany && ` • ${activeCompany.name}`}
          </p>
        </div>
        <div className="mt-4 flex sm:mt-0 sm:ml-4">
          {kraConfigStatus.configured && activeCompany && (
            <button
              onClick={handleBulkKRAValidation}
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Bulk KRA Validate
            </button>
          )}
        </div>
      </div>



      {/* Invoice Manager */}
      {activeCompany ? (
        <InvoiceManager
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          kraConfigStatus={kraConfigStatus}
          company={activeCompany}
        />
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <svg
            className="w-12 h-12 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Company Selected
          </h3>
          <p className="text-gray-500 mb-4">
            Please select a company to view and manage invoices.
          </p>
          <button
            onClick={() => (window.location.href = "/dashboard/companies")}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            Manage Companies
          </button>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;
