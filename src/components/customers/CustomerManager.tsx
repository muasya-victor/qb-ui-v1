"use client";
// src/components/customers/CustomerManager.tsx
import React, { useState, useEffect, useCallback } from "react";
import { toast } from "../../lib/toast";
import StatsCard from "../ui/StatsCard";
import CustomerFilters from "./CustomFilters";
import CustomerTable from "./CustomerTable";
import Pagination from "../ui/Pagination";
import CustomerModal from "./CustomerModal";
import EditCustomerModal from "./EditCustomerModal";
import customerService, {
  Customer,
  CustomersResponse,
  PaginationInfo,
} from "../../services/CustomerService";
import { useCompany } from "../../contexts/CompanyContext";

interface CustomerManagerProps {
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
}

const CustomerManager: React.FC<CustomerManagerProps> = ({
  statusFilter,
  setStatusFilter,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("display_name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { activeCompany } = useCompany();

  const fetchCustomers = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          page,
          page_size: 20,
          search: searchTerm || undefined,
          active:
            statusFilter !== "All"
              ? statusFilter === "Active"
                ? "true"
                : "false"
              : undefined,
        };

        const data: CustomersResponse = await customerService.getCustomers(
          params
        );

        if (data.success) {
          setCustomers(data.customers || []);
          setPagination(data.pagination || null);
          setCompanyInfo(data.company_info || null);
          setCurrentPage(page);
        } else {
          setError("Failed to fetch customers");
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch customers");
        console.error("Error fetching customers:", err);
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, statusFilter]
  );

  useEffect(() => {
    if (activeCompany) {
      fetchCustomers(1);
    } else {
      setLoading(false);
      setError("No active company selected");
    }
  }, [activeCompany, fetchCustomers]);

  const handlePageChange = (page: number) => {
    fetchCustomers(page);
  };

  const handleSync = async () => {
    try {
      setSyncing(true);

      const result = await customerService.syncCustomersFromQuickBooks();

      if (result.success) {
        await fetchCustomers(currentPage);
        toast.success(
          `Successfully synced ${result.synced_count || 0} customers`
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

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingCustomer(null);
  };

  const handleCustomerUpdated = () => {
    fetchCustomers(currentPage);
    handleCloseEditModal();
  };

  // Calculate stats
  const totalCustomers = pagination?.count || 0;
  const activeCustomers = customers.filter((c) => c.active).length;
  const totalBalance = customers.reduce(
    (sum, customer) => sum + parseFloat(customer.balance.toString() || "0"),
    0
  );

  if (loading && !pagination) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">
              Loading Customers
            </h3>
            <p className="text-gray-600 mt-1">
              Fetching customer data from QuickBooks...
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
                Error loading customers
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={() => fetchCustomers(currentPage)}
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
      {/* Header with Sync Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">
            Manage customer profiles and sync with QuickBooks
          </p>
        </div>

        <button
          onClick={handleSync}
          disabled={syncing}
          className={`mt-4 sm:mt-0 inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            syncing
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
              Syncing...
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
              Sync from QuickBooks
            </>
          )}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Total Customers"
          value={totalCustomers}
          icon="👥"
          trend={pagination ? `${pagination.total_pages} pages` : undefined}
        />
        <StatsCard
          title="Active Customers"
          value={`${activeCustomers}/${totalCustomers}`}
          color="green"
          icon="✅"
          trend={
            totalCustomers > 0
              ? `${Math.round((activeCustomers / totalCustomers) * 100)}%`
              : "0%"
          }
        />
        <StatsCard
          title="Total Balance"
          value={`$${totalBalance.toLocaleString()}`}
          color="blue"
          icon="💰"
          trend="Outstanding"
        />
      </div>

      {/* Filters and Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <CustomerFilters
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onSearch={() => fetchCustomers(1)}
          />
        </div>

        <CustomerTable
          customers={customers}
          companyInfo={companyInfo}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={(field: string) => {
            if (sortBy === field) {
              setSortOrder(sortOrder === "asc" ? "desc" : "asc");
            } else {
              setSortBy(field);
              setSortOrder("asc");
            }
            fetchCustomers(1);
          }}
          onViewCustomer={handleViewCustomer}
          onEditCustomer={handleEditCustomer}
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

      {/* Customer View Modal */}
      <CustomerModal
        customer={selectedCustomer}
        companyInfo={companyInfo}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onEdit={() => {
          if (selectedCustomer) {
            handleEditCustomer(selectedCustomer);
            handleCloseModal();
          }
        }}
      />

      {/* Customer Edit Modal */}
      <EditCustomerModal
        customer={editingCustomer}
        companyInfo={companyInfo}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleCustomerUpdated}
      />
    </div>
  );
};

export default CustomerManager;
