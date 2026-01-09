"use client";
import React, { useState, useEffect, useCallback } from "react";
import { toast } from "../../lib/toast";
import CreditNoteStats from "./CreditNoteStats";
import CustomerAlerts from "./CustomerAlerts";
import CreditNoteHeader from "./CreditNoteHeader";
import CreditNoteFilters from "./CreditNoteFilters";
import CreditNoteTable from "./CreditNoteTable/CreditNoteTable";
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

  const handleSmartSync = async () => {
    try {
      setSyncing(true);
      const result = await creditNoteService.smartSyncCreditNotes();

      if (result.success) {
        toast.success(
          `Smart sync completed: ${result.synced_count} credit notes processed, ${result.stub_customers_created} stub customers created`
        );

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

  const handleViewCreditNote = (creditNote: CreditNote) => {
    setSelectedCreditNote(creditNote);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCreditNote(null);
  };

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

  const totalCreditNotes = pagination?.count || 0;
  const creditNotesWithStubCustomers =
    customerStats?.credit_notes_with_stub_customers || 0;

  return (
    <div className="p-6 space-y-6">
      <CreditNoteHeader
        onSmartSync={handleSmartSync}
        onEnhanceStubs={handleEnhanceStubCustomers}
        syncing={syncing}
        enhancingStubs={enhancingStubs}
        hasStubCustomers={creditNotesWithStubCustomers > 0}
        stubCustomersCount={creditNotesWithStubCustomers}
      />

      <CreditNoteStats
        creditNotes={creditNotes}
        customerStats={customerStats}
        pagination={pagination}
      />

      <CustomerAlerts
        creditNotes={creditNotes}
        customerStats={customerStats}
        totalCreditNotes={totalCreditNotes}
      />

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
