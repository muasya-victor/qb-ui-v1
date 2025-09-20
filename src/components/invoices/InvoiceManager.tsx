'use client';
// src/components/invoices/InvoiceManager.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from '../../lib/toast';
import StatsCard from '../ui/StatsCard';
import InvoiceFilters from './InvoiceFilters';
import InvoiceTable from './InvoiceTable';
import Pagination from '../ui/Pagination';
import InvoiceModal from './InvoiceModal';
import invoiceService, { Invoice, InvoicesResponse, PaginationInfo } from '../../services/invoiceService';
import { useCompany } from '../../contexts/CompanyContext';

interface InvoiceManagerProps {
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
}

const InvoiceManager: React.FC<InvoiceManagerProps> = ({ statusFilter, setStatusFilter }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('txn_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { activeCompany } = useCompany();

  const fetchInvoices = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        page_size: 20,
        search: searchTerm || undefined,
        status: statusFilter !== 'All' ? statusFilter.toLowerCase() : undefined
      };

      const data: InvoicesResponse = await invoiceService.getInvoices(params);

      if (data.success) {
        setInvoices(data.invoices || []);
        setPagination(data.pagination || null);
        setCompanyInfo(data.company_info || null);
        setCurrentPage(page);
      } else {
        setError('Failed to fetch invoices');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch invoices');
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    if (activeCompany) {
      fetchInvoices(1);
    } else {
      setLoading(false);
      setError('No active company selected');
    }
  }, [activeCompany, fetchInvoices]);

  const handlePageChange = (page: number) => {
    fetchInvoices(page);
  };

  const handleSync = async () => {
    try {
      setSyncing(true);

      const result = await invoiceService.syncInvoicesFromQuickBooks();

      if (result.success) {
        await fetchInvoices(currentPage);
        toast.success(`Successfully synced ${result.synced_count || 0} invoices`);
      } else {
        toast.error(`Sync failed: ${result.error || result.message}`);
      }
    } catch (err: any) {
      toast.error(`Sync failed: ${err.message || 'Please try again.'}`);
      console.error('Sync error:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedInvoice(null);
  };

  // Calculate stats from pagination data
  const totalInvoices = pagination?.count || 0;
  const paidInvoices = invoices.filter(inv =>
    parseFloat(inv.balance?.toString() || '0') === 0
  ).length;
  const unpaidInvoices = invoices.filter(inv =>
    parseFloat(inv.balance?.toString() || '0') > 0
  ).length;

  if (loading && !pagination) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">Loading Invoices</h3>
            <p className="text-gray-600 mt-1">Fetching invoice data from QuickBooks...</p>
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
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading invoices</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={() => fetchInvoices(currentPage)}
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
          <h1 className="text-3xl font-bold text-gray-900">
            Invoices
          </h1>
          <p className="text-gray-600 mt-1">Manage and validate invoices against QuickBooks data</p>
        </div>

        <button
          onClick={handleSync}
          disabled={syncing}
          className={`mt-4 sm:mt-0 inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            syncing
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
          }`}
        >
          {syncing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Syncing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sync from QuickBooks
            </>
          )}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Total Invoices"
          value={totalInvoices}
          icon="📄"
          trend={pagination ? `${pagination.total_pages} pages` : undefined}
        />
        <StatsCard
          title="Paid Invoices"
          value={`${paidInvoices}/${totalInvoices}`}
          color="green"
          icon="✅"
          trend={totalInvoices > 0 ? `${Math.round((paidInvoices / totalInvoices) * 100)}%` : '0%'}
        />
        <StatsCard
          title="Unpaid Invoices"
          value={`${unpaidInvoices}/${totalInvoices}`}
          color="red"
          icon="⏳"
          trend={totalInvoices > 0 ? `${Math.round((unpaidInvoices / totalInvoices) * 100)}%` : '0%'}
        />
      </div>

      {/* Filters and Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <InvoiceFilters
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onSearch={() => fetchInvoices(1)}
          />
        </div>

        <InvoiceTable
          invoices={invoices}
          companyInfo={companyInfo}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={(field: string) => {
            if (sortBy === field) {
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
            } else {
              setSortBy(field);
              setSortOrder('desc');
            }
            fetchInvoices(1);
          }}
          onViewInvoice={handleViewInvoice}
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

      {/* Invoice Modal */}
      <InvoiceModal
        invoice={selectedInvoice}
        companyInfo={companyInfo}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default InvoiceManager;