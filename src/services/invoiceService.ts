import apiService from './apiService';

interface Invoice {
  id: string;
  doc_number: string;
  total_amt: number;
  balance: number;
  txn_date: string;
  due_date: string;
  customer_name: string;
  status: string;
  currency_code?: string;
}

interface PaginationInfo {
  count: number;
  next: string | null;
  previous: string | null;
  page_size: number;
  current_page: number;
  total_pages: number;
}

interface InvoicesResponse {
  success: boolean;
  invoices: Invoice[];
  pagination?: PaginationInfo;
  company_info?: {
    currency_code: string;
    name: string;
    realm_id: string;
  };
}

interface InvoiceQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  fetch_all?: boolean;
}

interface SyncResponse {
  success: boolean;
  message: string;
  synced_count?: number;
  error?: string;
}

class InvoiceService {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
  }

  private getAuthHeaders() {
    const token = apiService.isAuthenticated() ? this.getAuthToken() : null;
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;

    const authData = localStorage.getItem('auth_tokens');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        return parsed.access;
      } catch (error) {
        console.error('Failed to parse auth tokens:', error);
        return null;
      }
    }
    return null;
  }

  private buildQueryString(params: InvoiceQueryParams): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return searchParams.toString();
  }

  async getInvoices(params: InvoiceQueryParams = {}): Promise<InvoicesResponse> {
    try {
      const queryString = this.buildQueryString(params);
      const url = `${this.baseURL}/invoices/${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  }

  async getAllInvoices(progressCallback?: (message: string) => void): Promise<InvoicesResponse> {
    try {
      let allInvoices: Invoice[] = [];
      let currentPage = 1;
      let totalPages = 1;
      let companyInfo: any = null;

      const updateProgress = (message: string) => {
        console.log(message);
        if (progressCallback) {
          progressCallback(message);
        }
      };

      updateProgress('Starting to fetch all invoices from QuickBooks...');

      while (currentPage <= totalPages) {
        updateProgress(`Fetching page ${currentPage}${totalPages > 1 ? ` of ${totalPages}` : ''}...`);

        const response = await this.getInvoices({
          page: currentPage,
          page_size: 100 // Use large page size for efficiency
        });

        if (!response.success) {
          throw new Error('Failed to fetch invoices');
        }

        allInvoices = [...allInvoices, ...response.invoices];

        if (response.company_info && !companyInfo) {
          companyInfo = response.company_info;
        }

        if (response.pagination) {
          totalPages = response.pagination.total_pages;
          currentPage = response.pagination.current_page + 1;

          updateProgress(`Loaded ${allInvoices.length} invoices so far (page ${response.pagination.current_page} of ${totalPages})`);
        } else {
          // No pagination info means this is all the data
          updateProgress(`Loaded ${allInvoices.length} invoices (no pagination)`);
          break;
        }
      }

      updateProgress(`✅ Successfully fetched all ${allInvoices.length} invoices from QuickBooks`);

      return {
        success: true,
        invoices: allInvoices,
        company_info: companyInfo,
        pagination: {
          count: allInvoices.length,
          next: null,
          previous: null,
          page_size: allInvoices.length,
          current_page: 1,
          total_pages: 1
        }
      };
    } catch (error) {
      console.error('Error fetching all invoices:', error);
      throw error;
    }
  }

  async syncInvoicesFromQuickBooks(): Promise<SyncResponse> {
    try {
      const response = await fetch(`${this.baseURL}/invoices/sync_from_quickbooks/`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error syncing invoices:', error);
      throw error;
    }
  }

  async getInvoice(invoiceId: string): Promise<{ success: boolean; invoice: Invoice }> {
    try {
      const response = await fetch(`${this.baseURL}/invoices/${invoiceId}/`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      throw error;
    }
  }
}

export default new InvoiceService();
export type { Invoice, InvoicesResponse, SyncResponse, PaginationInfo, InvoiceQueryParams };