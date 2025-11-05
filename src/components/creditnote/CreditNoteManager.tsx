"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "../../lib/toast";
import StatsCard from "../ui/StatsCard";
import CreditNoteFilters from "./CreditNoteFilters";
import CreditNoteTable from "./CreditNoteTable";
import Pagination from "../ui/Pagination";
import CreditNoteModal from "./CreditNoteModal";
import creditNoteService, {
  CreditNote,
  CreditNotesResponse,
  PaginationInfo,
} from "../../services/CreditNoteService";
import { useCompany } from "../../contexts/CompanyContext";

interface CreditNoteManagerProps {
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
}

const CreditNoteManager: React.FC<CreditNoteManagerProps> = ({
  statusFilter,
  setStatusFilter,
}) => {
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [enhancingStubs, setEnhancingStubs] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("txn_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [selectedCreditNote, setSelectedCreditNote] =
    useState<CreditNote | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerStats, setCustomerStats] = useState<any>(null);
  const { activeCompany } = useCompany();

  const fetchCreditNotes = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          page,
          page_size: 20,
          search: searchTerm || undefined,
          status:
            statusFilter !== "All" ? statusFilter.toLowerCase() : undefined,
        };

        const data: CreditNotesResponse =
          await creditNoteService.getCreditNotes(params);

        if (data.success) {
          setCreditNotes(data.credit_notes || []);
          setPagination(data.pagination || null);
          setCompanyInfo(data.company_info || null);
          setCustomerStats(data.stats || null);
          setCurrentPage(page);
        } else {
          setError("Failed to fetch credit notes");
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch credit notes");
        console.error("Error fetching credit notes:", err);
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, statusFilter]
  );

  const fetchCustomerStats = async () => {
    try {
      const analysis = await creditNoteService.analyzeCustomerLinks();
      if (analysis.success) {
        setCustomerStats(analysis.analysis);
      }
    } catch (error) {
      console.error("Error fetching customer stats:", error);
    }
  };

  useEffect(() => {
    if (activeCompany) {
      fetchCreditNotes(1);
      fetchCustomerStats();
    } else {
      setLoading(false);
      setError("No active company selected");
    }
  }, [activeCompany, fetchCreditNotes]);

  const handlePageChange = (page: number) => {
    fetchCreditNotes(page);
  };

  // ✅ PRIMARY: Smart Sync (One-click solution)
  const handleSmartSync = async () => {
    try {
      setSyncing(true);

      const result = await creditNoteService.smartSyncCreditNotes();

      if (result.success) {
        toast.success(
          `Smart sync completed: ${result.synced_count} credit notes processed, ${result.stub_customers_created} stub customers created`
        );

        // Check if we should auto-enhance stub customers
        if (
          result.stub_customers_created > 0 &&
          result.stub_customers_created <= 10
        ) {
          toast.info("Auto-enhancing stub customers...");
          await handleEnhanceStubCustomers();
        }

        await fetchCreditNotes(currentPage);
        await fetchCustomerStats();
      } else {
        toast.error(`Smart sync failed: ${result.error}`);
      }
    } catch (err: any) {
      toast.error(`Smart sync failed: ${err.message || "Please try again."}`);
      console.error("Smart sync error:", err);
    } finally {
      setSyncing(false);
    }
  };

  // 🎯 Enhance Stub Customers
  const handleEnhanceStubCustomers = async () => {
    try {
      setEnhancingStubs(true);

      const result = await creditNoteService.enhanceStubCustomers();

      if (result.success) {
        toast.success(
          `Enhanced ${result.enhanced_count} stub customers with real QuickBooks data`
        );
        await fetchCreditNotes(currentPage);
        await fetchCustomerStats();
      } else {
        toast.error(`Enhancement failed: ${result.error}`);
      }
    } catch (err: any) {
      toast.error(`Enhancement failed: ${err.message || "Please try again."}`);
      console.error("Enhancement error:", err);
    } finally {
      setEnhancingStubs(false);
    }
  };

  // 📊 Legacy Sync (if you still want it)
  const handleLegacySync = async () => {
    try {
      setSyncing(true);

      const result = await creditNoteService.syncCreditNotesFromQuickBooks();

      if (result.success) {
        await fetchCreditNotes(currentPage);
        await fetchCustomerStats();
        toast.success(
          `Successfully synced ${result.synced_count || 0} credit notes`
        );
      } else {
        toast.error(`Sync failed: ${result.error || result.message}`);
      }
    } catch (err: any) {
      toast.error(`Sync failed: ${err.message || "Please try again."}`);
      console.error("Sync error:", err);
    } finally {
      setSyncing(false);
    }
  };

  const handleViewCreditNote = (creditNote: CreditNote) => {
    setSelectedCreditNote(creditNote);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCreditNote(null);
  };

  // Calculate stats
  const totalCreditNotes = pagination?.count || 0;
  const appliedCreditNotes = creditNotes.filter(
    (cn) =>
      cn.status === "applied" || parseFloat(cn.balance?.toString() || "0") === 0
  ).length;
  const pendingCreditNotes = creditNotes.filter(
    (cn) =>
      cn.status === "pending" || parseFloat(cn.balance?.toString() || "0") > 0
  ).length;
  const totalCreditAmount = creditNotes.reduce(
    (sum, cn) => sum + parseFloat(cn.total_amt.toString()),
    0
  );
  const availableCredit = creditNotes.reduce(
    (sum, cn) => sum + parseFloat(cn.balance.toString()),
    0
  );

  // Customer link stats from backend or calculate from credit notes
  const creditNotesWithCustomerLinks =
    customerStats?.credit_notes_with_customers ||
    creditNotes.filter(
      (cn) => cn.customer_name && cn.customer_name !== "Unknown Customer"
    ).length;

  const creditNotesWithStubCustomers =
    customerStats?.credit_notes_with_stub_customers ||
    creditNotes.filter(
      (cn) => cn.customer_name && cn.customer_name.includes("Customer")
    ).length; // Simple heuristic

  const customerLinkQuality =
    customerStats?.customer_link_quality ||
    (totalCreditNotes > 0
      ? (creditNotesWithCustomerLinks / totalCreditNotes) * 100
      : 0);

  if (loading && !pagination) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">
              Loading Credit Notes
            </h3>
            <p className="text-gray-600 mt-1">
              Fetching credit note data from QuickBooks...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading credit notes
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={() => fetchCreditNotes(currentPage)}
                className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Sync Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Credit Notes</h1>
          <p className="text-gray-600 mt-1">
            Manage and validate credit notes against QuickBooks data
          </p>
        </div>

        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
          {/* ✅ PRIMARY: Smart Sync Button */}
          <button
            onClick={handleSmartSync}
            disabled={syncing}
            className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              syncing
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            }`}
          >
            {syncing ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Smart Syncing...
              </>
            ) : (
              <>
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Smart Sync
              </>
            )}
          </button>

          {/* Enhance Stub Customers Button */}
          {creditNotesWithStubCustomers > 0 && (
            <button
              onClick={handleEnhanceStubCustomers}
              disabled={enhancingStubs}
              className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                enhancingStubs
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              }`}
            >
              {enhancingStubs ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Enhancing...
                </>
              ) : (
                <>
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
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  Fix Customer Links ({creditNotesWithStubCustomers})
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Total Credit Notes"
          value={totalCreditNotes}
          icon="📄"
          trend={pagination ? `${pagination.total_pages} pages` : undefined}
        />
        <StatsCard
          title="Customer Links"
          value={`${creditNotesWithCustomerLinks}/${totalCreditNotes}`}
          color={
            customerLinkQuality > 80
              ? "green"
              : customerLinkQuality > 50
              ? "yellow"
              : "red"
          }
          icon="🔗"
          trend={`${Math.round(customerLinkQuality)}%`}
        />
        <StatsCard
          title="Applied Credits"
          value={appliedCreditNotes}
          color="green"
          icon="✅"
          trend={
            totalCreditNotes > 0
              ? `${Math.round((appliedCreditNotes / totalCreditNotes) * 100)}%`
              : "0%"
          }
        />
        <StatsCard
          title="Stub Customers"
          value={creditNotesWithStubCustomers}
          color="orange"
          icon="🔄"
          trend={
            totalCreditNotes > 0
              ? `${Math.round(
                  (creditNotesWithStubCustomers / totalCreditNotes) * 100
                )}%`
              : "0%"
          }
        />
      </div>

      {/* Customer Quality Alert */}
      {creditNotesWithStubCustomers > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-orange-600 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-orange-800">
                Stub Customers Detected
              </h3>
              <p className="text-sm text-orange-700 mt-1">
                {creditNotesWithStubCustomers} credit notes are linked to stub
                customers. Click "Fix Customer Links" to enhance them with real
                QuickBooks data.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Missing Customer Links Alert */}
      {creditNotesWithCustomerLinks < totalCreditNotes &&
        totalCreditNotes > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-yellow-600 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Customer Links Missing
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  {totalCreditNotes - creditNotesWithCustomerLinks} credit notes
                  don't have proper customer links. Use "Smart Sync" to
                  automatically resolve customer relationships.
                </p>
              </div>
            </div>
          </div>
        )}

      {/* Filters and Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <CreditNoteFilters
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onSearch={() => fetchCreditNotes(1)}
          />
        </div>

        <CreditNoteTable
          creditNotes={creditNotes}
          companyInfo={companyInfo}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={(field: string) => {
            if (sortBy === field) {
              setSortOrder(sortOrder === "asc" ? "desc" : "asc");
            } else {
              setSortBy(field);
              setSortOrder("desc");
            }
            fetchCreditNotes(1);
          }}
          onViewCreditNote={handleViewCreditNote}
        />

        {pagination && pagination.total_pages > 1 && (
          <div className="border-t border-gray-100">
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.total_pages}
              totalItems={pagination.count}
              onPageChange={handlePageChange}
              showAll={false}
            />
          </div>
        )}
      </div>

      {/* Credit Note Modal */}
      <CreditNoteModal
        creditNote={selectedCreditNote}
        companyInfo={companyInfo}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default CreditNoteManager;
