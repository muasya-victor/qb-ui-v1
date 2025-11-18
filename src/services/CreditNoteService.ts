"use client";
import apiService from "./apiService";

interface CreditNote {
  id: string;
  doc_number: string;
  total_amt: number;
  balance: number;
  txn_date: string;
  customer_name: string;
  status: string;
  currency_code?: string;
  qb_credit_id?: string;
  subtotal?: number;
  tax_total?: number;
  tax_percent?: number;
  customer_ref_value?: string;
  private_note?: string;
  customer_memo?: string;
  is_kra_validated?: boolean;
  kra_submissions?: any[];
  line_items?: any[];
  related_invoice?: RelatedInvoice;
}

interface RelatedInvoice {
  id: string;
  doc_number: string;
  qb_invoice_id: string;
  customer_name: string;
  customer_display: string;
  customer?: any;
  total_amt: number;
  txn_date: string;
  due_date: string;
  status: string;
}

interface InvoiceForDropdown {
  id: string;
  doc_number: string;
  qb_invoice_id: string;
  txn_date: string;
  total_amt: number;
  customer: any;
  customer_display: string;
}

interface PaginationInfo {
  count: number;
  next: string | null;
  previous: string | null;
  page_size: number;
  current_page: number;
  total_pages: number;
}

interface CreditNotesResponse {
  success: boolean;
  credit_notes: CreditNote[];
  pagination?: PaginationInfo;
  company_info?: {
    currency_code: string;
    name: string;
    realm_id: string;
    id?: string;
  };
  stats?: {
    total_credit_notes: number;
    applied_credit_notes: number;
    pending_credit_notes: number;
    void_credit_notes: number;
    total_amount: number;
    outstanding_balance: number;
    kra_validated_credit_notes: number;
    validation_rate: number;
    credit_notes_with_linked_invoices: number;
    invoice_link_rate: number;
  };
  kra_stats?: {
    total_submissions: number;
    successful_submissions: number;
    failed_submissions: number;
    pending_submissions: number;
  };
}

interface CreditNoteQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  kra_validated?: boolean;
}

interface SyncResponse {
  success: boolean;
  message: string;
  synced_count?: number;
  failed_count?: number;
  stub_customers_created?: number;
  error?: string;
}

interface KRAValidationResponse {
  success: boolean;
  message: string;
  submission_id?: string;
  kra_invoice_number?: number;
  receipt_signature?: string;
  qr_code_data?: string;
  kra_response?: any;
  error?: string;
}

interface CustomerAnalysisResponse {
  success: boolean;
  analysis?: {
    total_credit_notes: number;
    credit_notes_with_customers: number;
    credit_notes_without_customers: number;
    stub_customers: number;
    credit_notes_with_stub_customers: number;
    quality_score: number;
    credit_notes_with_linked_invoices: number;
    credit_notes_without_linked_invoices: number;
    invoice_link_score: number;
  };
  error?: string;
}

interface AvailableInvoicesResponse {
  success: boolean;
  invoices: InvoiceForDropdown[];
  count: number;
}

interface UpdateInvoiceResponse {
  success: boolean;
  message: string;
  credit_note?: CreditNote;
  error?: string;
}

class CreditNoteService {
  private baseURL: string;

  constructor() {
    this.baseURL =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";
  }

  private getAuthHeaders() {
    const token = apiService.isAuthenticated() ? this.getAuthToken() : null;
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private getAuthToken(): string | null {
    if (typeof window === "undefined") return null;

    const authData = localStorage.getItem("auth_tokens");
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        return parsed.access;
      } catch (error) {
        console.error("Failed to parse auth tokens:", error);
        return null;
      }
    }
    return null;
  }

  private buildQueryString(params: CreditNoteQueryParams): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return searchParams.toString();
  }

  async getCreditNotes(
    params: CreditNoteQueryParams = {}
  ): Promise<CreditNotesResponse> {
    try {
      const queryString = this.buildQueryString(params);
      const url = `${this.baseURL}/credit-notes/${
        queryString ? `?${queryString}` : ""
      }`;

      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching credit notes:", error);
      throw error;
    }
  }

  async getAllCreditNotes(
    progressCallback?: (message: string) => void
  ): Promise<CreditNotesResponse> {
    try {
      let allCreditNotes: CreditNote[] = [];
      let currentPage = 1;
      let totalPages = 1;
      let companyInfo: any = null;

      const updateProgress = (message: string) => {
        console.log(message);
        if (progressCallback) {
          progressCallback(message);
        }
      };

      updateProgress("Starting to fetch all credit notes from QuickBooks...");

      while (currentPage <= totalPages) {
        updateProgress(
          `Fetching page ${currentPage}${
            totalPages > 1 ? ` of ${totalPages}` : ""
          }...`
        );

        const response = await this.getCreditNotes({
          page: currentPage,
          page_size: 100,
        });

        if (!response.success) {
          throw new Error("Failed to fetch credit notes");
        }

        allCreditNotes = [...allCreditNotes, ...response.credit_notes];

        if (response.company_info && !companyInfo) {
          companyInfo = response.company_info;
        }

        if (response.pagination) {
          totalPages = response.pagination.total_pages;
          currentPage = response.pagination.current_page + 1;

          updateProgress(
            `Loaded ${allCreditNotes.length} credit notes so far (page ${response.pagination.current_page} of ${totalPages})`
          );
        } else {
          updateProgress(
            `Loaded ${allCreditNotes.length} credit notes (no pagination)`
          );
          break;
        }
      }

      updateProgress(
        `✅ Successfully fetched all ${allCreditNotes.length} credit notes from QuickBooks`
      );

      return {
        success: true,
        credit_notes: allCreditNotes,
        company_info: companyInfo,
        pagination: {
          count: allCreditNotes.length,
          next: null,
          previous: null,
          page_size: allCreditNotes.length,
          current_page: 1,
          total_pages: 1,
        },
      };
    } catch (error) {
      console.error("Error fetching all credit notes:", error);
      throw error;
    }
  }

  async getCreditNote(
    creditNoteId: string
  ): Promise<{ success: boolean; credit_note: CreditNote }> {
    try {
      const response = await fetch(
        `${this.baseURL}/credit-notes/${creditNoteId}/`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching credit note:", error);
      throw error;
    }
  }

  async syncCreditNotesFromQuickBooks(): Promise<SyncResponse> {
    try {
      const response = await fetch(
        `${this.baseURL}/credit-notes/sync_from_quickbooks/`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(
          errorData.error ||
            errorData.detail ||
            `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error syncing credit notes:", error);
      throw error;
    }
  }

  // ✅ NEW: Smart Sync for Credit Notes
  async smartSyncCreditNotes(): Promise<{
    success: boolean;
    synced_count: number;
    failed_count: number;
    stub_customers_created: number;
    message: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseURL}/credit-notes/smart-sync/`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(
          errorData.error ||
            errorData.detail ||
            `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error with smart sync:", error);
      throw error;
    }
  }

  // ✅ NEW: Analyze Customer Links for Credit Notes
  async analyzeCustomerLinks(): Promise<CustomerAnalysisResponse> {
    try {
      const response = await fetch(
        `${this.baseURL}/credit-notes/analyze-customer-links/`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
          credentials: "include",
        }
      );

      if (!response.ok) {
        // If endpoint doesn't exist (404) or server error (500), calculate locally
        if (response.status === 404 || response.status === 500) {
          console.warn(
            "Analyze customer links endpoint not available, calculating locally"
          );
          return this.analyzeCustomerLinksLocally();
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(
        "Error analyzing customer links, falling back to local calculation:",
        error
      );
      return this.analyzeCustomerLinksLocally();
    }
  }

  // ✅ NEW: Enhance Stub Customers for Credit Notes
  async enhanceStubCustomers(): Promise<{
    success: boolean;
    enhanced_count: number;
    failed_count: number;
    message: string;
    error?: string;
  }> {
    try {
      const response = await fetch(
        `${this.baseURL}/credit-notes/enhance-stub-customers/`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(
          errorData.error ||
            errorData.detail ||
            `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error enhancing stub customers:", error);
      throw error;
    }
  }

  // ✅ NEW: Get available invoices for linking
  async getAvailableInvoices(
    search?: string,
    customerName?: string,
    limit?: number
  ): Promise<AvailableInvoicesResponse> {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (customerName) params.append("customer_name", customerName);
      if (limit) params.append("limit", limit.toString());

      const url = `${this.baseURL}/credit-notes/available-invoices/?${params}`;

      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching available invoices:", error);
      throw error;
    }
  }

  // ✅ NEW: Update related invoice for a credit note
  async updateRelatedInvoice(
    creditNoteId: string,
    invoiceId: string | null
  ): Promise<UpdateInvoiceResponse> {
    try {
      if (invoiceId === null) {
        // Remove related invoice
        const response = await fetch(
          `${this.baseURL}/credit-notes/${creditNoteId}/remove-related-invoice/`,
          {
            method: "DELETE",
            headers: this.getAuthHeaders(),
            credentials: "include",
          }
        );

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: "Unknown error" }));
          throw new Error(
            errorData.error ||
              errorData.detail ||
              `HTTP error! status: ${response.status}`
          );
        }

        const data = await response.json();
        return data;
      } else {
        // Update related invoice
        const response = await fetch(
          `${this.baseURL}/credit-notes/${creditNoteId}/update-related-invoice/`,
          {
            method: "PATCH",
            headers: this.getAuthHeaders(),
            credentials: "include",
            body: JSON.stringify({
              related_invoice: invoiceId,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: "Unknown error" }));
          throw new Error(
            errorData.error ||
              errorData.detail ||
              `HTTP error! status: ${response.status}`
          );
        }

        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error("Error updating related invoice:", error);
      throw error;
    }
  }

  // Add this method for local calculation as fallback
  private async analyzeCustomerLinksLocally(): Promise<{
    success: boolean;
    analysis: {
      total_credit_notes: number;
      credit_notes_with_customers: number;
      credit_notes_without_customers: number;
      stub_customers: number;
      credit_notes_with_stub_customers: number;
      quality_score: number;
      credit_notes_with_linked_invoices: number;
      credit_notes_without_linked_invoices: number;
      invoice_link_score: number;
    };
  }> {
    try {
      // Get all credit notes to analyze locally
      const response = await this.getCreditNotes({ page_size: 1000 });

      if (!response.success || !response.credit_notes) {
        return {
          success: true,
          analysis: {
            total_credit_notes: 0,
            credit_notes_with_customers: 0,
            credit_notes_without_customers: 0,
            stub_customers: 0,
            credit_notes_with_stub_customers: 0,
            quality_score: 0,
            credit_notes_with_linked_invoices: 0,
            credit_notes_without_linked_invoices: 0,
            invoice_link_score: 0,
          },
        };
      }

      const creditNotes = response.credit_notes;
      const totalCreditNotes = creditNotes.length;

      // Calculate customer links locally
      const creditNotesWithCustomers = creditNotes.filter(
        (cn) => cn.customer_name && cn.customer_name !== "Unknown Customer"
      ).length;

      const creditNotesWithStubCustomers = creditNotes.filter(
        (cn) =>
          cn.customer_name &&
          (cn.customer_name.startsWith("Customer ") ||
            cn.customer_name.includes("Stub") ||
            !cn.customer_name.trim()) // Empty or null names
      ).length;

      // Calculate linked invoices locally
      const creditNotesWithLinkedInvoices = creditNotes.filter(
        (cn) => cn.related_invoice && cn.related_invoice.id
      ).length;

      return {
        success: true,
        analysis: {
          total_credit_notes: totalCreditNotes,
          credit_notes_with_customers: creditNotesWithCustomers,
          credit_notes_without_customers:
            totalCreditNotes - creditNotesWithCustomers,
          stub_customers: creditNotesWithStubCustomers,
          credit_notes_with_stub_customers: creditNotesWithStubCustomers,
          quality_score:
            totalCreditNotes > 0
              ? (creditNotesWithCustomers / totalCreditNotes) * 100
              : 0,
          credit_notes_with_linked_invoices: creditNotesWithLinkedInvoices,
          credit_notes_without_linked_invoices:
            totalCreditNotes - creditNotesWithLinkedInvoices,
          invoice_link_score:
            totalCreditNotes > 0
              ? (creditNotesWithLinkedInvoices / totalCreditNotes) * 100
              : 0,
        },
      };
    } catch (error) {
      console.error("Error in local customer links analysis:", error);
      return {
        success: true,
        analysis: {
          total_credit_notes: 0,
          credit_notes_with_customers: 0,
          credit_notes_without_customers: 0,
          stub_customers: 0,
          credit_notes_with_stub_customers: 0,
          quality_score: 0,
          credit_notes_with_linked_invoices: 0,
          credit_notes_without_linked_invoices: 0,
          invoice_link_score: 0,
        },
      };
    }
  }

  // KRA Validation Methods for Credit Notes
  async validateCreditNoteToKRA(
    creditNoteId: string
  ): Promise<KRAValidationResponse> {
    try {
      console.log(`Validating credit note ${creditNoteId} with KRA...`);

      const response = await fetch(
        `${this.baseURL}/credit-notes/${creditNoteId}/submit_to_kra/`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(
          errorData.error ||
            errorData.detail ||
            `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();

      if (data.success) {
        console.log("KRA validation successful:", data);
      } else {
        console.error("KRA validation failed:", data.error);
      }

      return data;
    } catch (error) {
      console.error("Error validating credit note with KRA:", error);
      throw error;
    }
  }

  async getCreditNoteStats() {
    try {
      const response = await fetch(`${this.baseURL}/credit-notes/stats/`, {
        method: "GET",
        headers: this.getAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching credit note stats:", error);
      throw error;
    }
  }

  async bulkValidateCreditNotesToKRA(
    creditNoteIds: string[],
    progressCallback?: (
      progress: number,
      current: string,
      success: boolean
    ) => void
  ): Promise<{
    success: number;
    failed: number;
    results: Array<{ creditNoteId: string; success: boolean; error?: string }>;
  }> {
    try {
      console.log(
        `Starting bulk KRA validation for ${creditNoteIds.length} credit notes...`
      );

      const results = [];
      let successCount = 0;
      let failedCount = 0;

      for (let i = 0; i < creditNoteIds.length; i++) {
        const creditNoteId = creditNoteIds[i];

        try {
          if (progressCallback) {
            progressCallback(
              Math.round((i / creditNoteIds.length) * 100),
              creditNoteId,
              false
            );
          }

          const result = await this.validateCreditNoteToKRA(creditNoteId);

          if (result.success) {
            successCount++;
            results.push({
              creditNoteId,
              success: true,
              kraInvoiceNumber: result.kra_invoice_number,
            });
          } else {
            failedCount++;
            results.push({ creditNoteId, success: false, error: result.error });
          }

          if (progressCallback) {
            progressCallback(
              Math.round(((i + 1) / creditNoteIds.length) * 100),
              creditNoteId,
              result.success
            );
          }

          // Small delay to avoid overwhelming the API
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error: any) {
          failedCount++;
          results.push({ creditNoteId, success: false, error: error.message });

          if (progressCallback) {
            progressCallback(
              Math.round(((i + 1) / creditNoteIds.length) * 100),
              creditNoteId,
              false
            );
          }
        }
      }

      console.log(
        `Bulk KRA validation completed: ${successCount} successful, ${failedCount} failed`
      );

      return {
        success: successCount,
        failed: failedCount,
        results,
      };
    } catch (error) {
      console.error("Error in bulk KRA validation:", error);
      throw error;
    }
  }
}

// Create and export singleton instance
const creditNoteService = new CreditNoteService();
export default creditNoteService;

// Export types for use in other components
export type {
  CreditNote,
  RelatedInvoice,
  InvoiceForDropdown,
  CreditNotesResponse,
  SyncResponse,
  PaginationInfo,
  CreditNoteQueryParams,
  KRAValidationResponse,
  CustomerAnalysisResponse,
  AvailableInvoicesResponse,
  UpdateInvoiceResponse,
};
