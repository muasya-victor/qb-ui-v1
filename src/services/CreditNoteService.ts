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
  available_balance?: number;
  is_fully_credited?: boolean;
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
  available_balance?: number;
  is_fully_credited?: boolean;
  calculated_total_credits?: number;
  credit_utilization_percentage?: number;
}

interface InvoiceForDropdown {
  id: string;
  doc_number: string;
  qb_invoice_id: string;
  txn_date: string;
  total_amt: number;
  customer: any;
  customer_display: string;
  available_balance?: number;
  is_fully_credited?: boolean;
}

interface PaginationInfo {
  count: number;
  next: string | null;
  previous: string | null;
  page_size: number;
  current_page: number;
  total_pages: number;
  has_more?: boolean;
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
  summary?: any;
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
  kra_credit_note_number?: number;
  trd_credit_note_no?: string;
  receipt_signature?: string;
  qr_code_data?: string;
  kra_response?: any;
  error?: string;
  validation_details?: any;
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
  summary?: any;
  pagination?: {
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

interface UpdateInvoiceResponse {
  success: boolean;
  message: string;
  credit_note?: CreditNote;
  error?: string;
  validation_details?: any;
  details?: any;
}

// ================ NEW INTERFACES FOR CREDIT VALIDATION ================

interface CreditValidationRequest {
  invoice_id: string;
  credit_amount: number;
}

interface CreditValidationResponse {
  success: boolean;
  validation: {
    valid: boolean;
    message: string;
    available_balance?: number;
    invoice_number?: string;
    invoice_total?: number;
    calculated_total_credits?: number;
    requested_amount?: number;
    error?: string;
    has_invoice?: boolean;
    credit_note_amount?: number;
  };
  error?: string;
}

interface CreditValidationResult {
  valid: boolean;
  message: string;
  available_balance?: number;
  invoice_number?: string;
  invoice_total?: number;
  calculated_total_credits?: number;
  requested_amount?: number;
  error?: string;
}

interface InvoiceCreditSummary {
  success: boolean;
  summary?: {
    invoice_id: string;
    invoice_number: string;
    invoice_total: number;
    calculated_total_credits: number;
    available_credit_balance: number;
    is_fully_credited: boolean;
    credit_utilization_percentage: number;
    linked_credit_notes_count: number;
    linked_credit_notes?: Array<{
      id: string;
      doc_number: string;
      txn_date: string;
      amount: number;
      customer_name: string;
    }>;
  };
  error?: string;
}

interface FullyCreditedInvoicesResponse {
  success: boolean;
  invoices: Array<{
    id: string;
    doc_number: string;
    total_amt: number;
    calculated_total_credits: number;
    available_balance: number;
    is_fully_credited: boolean;
    credit_utilization_percentage: number;
    customer_name: string;
  }>;
  count: number;
  pagination?: {
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

interface InvoiceWithCreditInfo {
  id: string;
  doc_number: string;
  qb_invoice_id: string;
  txn_date: string;
  total_amt: number;
  customer: any;
  customer_display: string;
  available_balance: number;
  is_fully_credited: boolean;
  calculated_total_credits?: number;
  credit_utilization_percentage?: number;
}

// ================ END OF NEW INTERFACES ================

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

  private buildQueryString(params: any): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return searchParams.toString();
  }

  private async handleRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const defaultOptions: RequestInit = {
        headers: this.getAuthHeaders(),
        credentials: "include",
        ...options,
      };

      const response = await fetch(url, defaultOptions);

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(
          errorData.error ||
            errorData.detail ||
            errorData.message ||
            `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`Request failed for ${url}:`, error);
      throw error;
    }
  }

  // ================ EXISTING METHODS (UPDATED WHERE NEEDED) ================

  async getCreditNotes(
    params: CreditNoteQueryParams = {}
  ): Promise<CreditNotesResponse> {
    const queryString = this.buildQueryString(params);
    const url = `${this.baseURL}/credit-notes/${
      queryString ? `?${queryString}` : ""
    }`;
    return this.handleRequest<CreditNotesResponse>(url);
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
    const url = `${this.baseURL}/credit-notes/${creditNoteId}/`;
    return this.handleRequest<{ success: boolean; credit_note: CreditNote }>(
      url
    );
  }

  async syncCreditNotesFromQuickBooks(): Promise<SyncResponse> {
    const url = `${this.baseURL}/credit-notes/sync_from_quickbooks/`;
    return this.handleRequest<SyncResponse>(url, { method: "POST" });
  }

  async smartSyncCreditNotes(): Promise<{
    success: boolean;
    synced_count: number;
    failed_count: number;
    stub_customers_created: number;
    message: string;
    error?: string;
  }> {
    const url = `${this.baseURL}/credit-notes/smart-sync/`;
    return this.handleRequest<{
      success: boolean;
      synced_count: number;
      failed_count: number;
      stub_customers_created: number;
      message: string;
      error?: string;
    }>(url, { method: "POST" });
  }

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

  async enhanceStubCustomers(): Promise<{
    success: boolean;
    enhanced_count: number;
    failed_count: number;
    message: string;
    error?: string;
  }> {
    const url = `${this.baseURL}/credit-notes/enhance-stub-customers/`;
    return this.handleRequest<{
      success: boolean;
      enhanced_count: number;
      failed_count: number;
      message: string;
      error?: string;
    }>(url, { method: "POST" });
  }

  // ================ UPDATED AVAILABLE INVOICES METHOD ================
  async getAvailableInvoices(
    search?: string,
    customerName?: string,
    limit?: number,
    offset?: number,
    min_balance?: number
  ): Promise<AvailableInvoicesResponse> {
    const params: any = {};
    if (search) params.search = search;
    if (customerName) params.customer_name = customerName;
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    if (min_balance !== undefined) params.min_balance = min_balance;

    const queryString = this.buildQueryString(params);
    const url = `${this.baseURL}/credit-notes/available-invoices/?${queryString}`;

    return this.handleRequest<AvailableInvoicesResponse>(url);
  }

  // ================ UPDATED UPDATE RELATED INVOICE METHOD ================
  async updateRelatedInvoice(
    creditNoteId: string,
    invoiceId: string | null
  ): Promise<UpdateInvoiceResponse> {
    if (invoiceId === null) {
      const url = `${this.baseURL}/credit-notes/${creditNoteId}/remove-related-invoice/`;
      return this.handleRequest<UpdateInvoiceResponse>(url, {
        method: "DELETE",
      });
    } else {
      const url = `${this.baseURL}/credit-notes/${creditNoteId}/update-related-invoice/`;
      return this.handleRequest<UpdateInvoiceResponse>(url, {
        method: "PATCH",
        body: JSON.stringify({
          related_invoice: invoiceId,
        }),
      });
    }
  }

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

      const creditNotesWithCustomers = creditNotes.filter(
        (cn) => cn.customer_name && cn.customer_name !== "Unknown Customer"
      ).length;

      const creditNotesWithStubCustomers = creditNotes.filter(
        (cn) =>
          cn.customer_name &&
          (cn.customer_name.startsWith("Customer ") ||
            cn.customer_name.includes("Stub") ||
            !cn.customer_name.trim())
      ).length;

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

  async validateCreditNoteToKRA(
    creditNoteId: string
  ): Promise<KRAValidationResponse> {
    const url = `${this.baseURL}/credit-notes/${creditNoteId}/submit_to_kra/`;
    return this.handleRequest<KRAValidationResponse>(url, {
      method: "POST",
    });
  }

  async getCreditNoteStats() {
    const url = `${this.baseURL}/credit-notes/stats/`;
    return this.handleRequest<any>(url);
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
              kraInvoiceNumber:
                result.kra_credit_note_number || result.kra_invoice_number,
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

  // ================ NEW CREDIT VALIDATION METHODS ================

  /**
   * Validate credit note linkage to an invoice before linking
   */
  async validateCreditLinkage(
    invoiceId: string,
    creditAmount: number
  ): Promise<CreditValidationResponse> {
    const url = `${this.baseURL}/credit-notes/validate-credit/`;
    return this.handleRequest<CreditValidationResponse>(url, {
      method: "POST",
      body: JSON.stringify({
        invoice_id: invoiceId,
        credit_amount: creditAmount,
      }),
    });
  }

  /**
   * Validate if the current credit note can be linked to its invoice
   */
  async validateCurrentCreditNoteLinkage(
    creditNoteId: string
  ): Promise<CreditValidationResponse> {
    const url = `${this.baseURL}/credit-notes/${creditNoteId}/validate-current/`;
    return this.handleRequest<CreditValidationResponse>(url);
  }

  /**
   * Get detailed credit summary for a specific invoice
   */
  async getInvoiceCreditSummary(
    invoiceId: string
  ): Promise<InvoiceCreditSummary> {
    const url = `${this.baseURL}/credit-notes/invoice-credit-summary/${invoiceId}/`;
    return this.handleRequest<InvoiceCreditSummary>(url);
  }

  /**
   * Get list of fully credited invoices
   */
  async getFullyCreditedInvoices(
    limit: number = 50,
    offset: number = 0
  ): Promise<FullyCreditedInvoicesResponse> {
    const params = {
      limit,
      offset,
    };
    const queryString = this.buildQueryString(params);
    const url = `${this.baseURL}/credit-notes/fully-credited-invoices/?${queryString}`;
    return this.handleRequest<FullyCreditedInvoicesResponse>(url);
  }

  /**
   * Get invoices summary with credit statistics
   */
  async getInvoicesSummary(): Promise<{
    success: boolean;
    summary: any;
    error?: string;
  }> {
    const url = `${this.baseURL}/credit-notes/available-invoices/`;
    const response = await this.handleRequest<AvailableInvoicesResponse>(url);

    // Extract summary from response if available
    if (response.success && response.summary) {
      return {
        success: true,
        summary: response.summary,
      };
    }

    // Calculate summary locally if not provided
    return {
      success: true,
      summary: await this.calculateInvoicesSummaryLocally(),
    };
  }

  /**
   * Pre-validate credit note amount for a specific invoice
   */
  async preValidateCreditNote(
    creditNote: CreditNote,
    targetInvoiceId?: string
  ): Promise<CreditValidationResult> {
    const invoiceId = targetInvoiceId || creditNote.related_invoice?.id;

    if (!invoiceId) {
      return {
        valid: false,
        message: "No invoice specified for validation",
      };
    }

    try {
      const response = await this.validateCreditLinkage(
        invoiceId,
        creditNote.total_amt
      );

      if (response.success) {
        return response.validation;
      } else {
        return {
          valid: false,
          message: response.error || "Validation failed",
        };
      }
    } catch (error: any) {
      return {
        valid: false,
        message: error.message || "Validation error",
      };
    }
  }

  /**
   * Calculate invoices summary locally (fallback method)
   */
  private async calculateInvoicesSummaryLocally(): Promise<any> {
    try {
      // Get all available invoices
      const invoicesResponse = await this.getAvailableInvoices("", "", 1000);

      if (!invoicesResponse.success || !invoicesResponse.invoices) {
        return {
          total_invoices: 0,
          invoices_with_credits: 0,
          fully_credited_invoices: 0,
          total_invoice_amount: 0,
          calculated_total_credits: 0,
          credit_utilization_percentage: 0,
        };
      }

      const invoices = invoicesResponse.invoices;
      const totalInvoices = invoices.length;

      // Calculate summary
      const invoicesWithCredits = invoices.filter(
        (inv) => (inv.available_balance || inv.total_amt) < inv.total_amt
      ).length;

      const fullyCreditedInvoices = invoices.filter(
        (inv) => inv.is_fully_credited === true
      ).length;

      const totalInvoiceAmount = invoices.reduce(
        (sum, inv) => sum + inv.total_amt,
        0
      );

      const totalCreditsApplied = invoices.reduce(
        (sum, inv) =>
          sum + (inv.total_amt - (inv.available_balance || inv.total_amt)),
        0
      );

      const creditUtilizationPercentage =
        totalInvoiceAmount > 0
          ? (totalCreditsApplied / totalInvoiceAmount) * 100
          : 0;

      return {
        total_invoices: totalInvoices,
        invoices_with_credits: invoicesWithCredits,
        invoices_without_credits: totalInvoices - invoicesWithCredits,
        fully_credited_invoices: fullyCreditedInvoices,
        total_invoice_amount: totalInvoiceAmount,
        calculated_total_credits: totalCreditsApplied,
        credit_utilization_percentage: creditUtilizationPercentage,
      };
    } catch (error) {
      console.error("Error calculating invoices summary locally:", error);
      return {
        total_invoices: 0,
        invoices_with_credits: 0,
        fully_credited_invoices: 0,
        total_invoice_amount: 0,
        calculated_total_credits: 0,
        credit_utilization_percentage: 0,
      };
    }
  }

  /**
   * Enhanced method to get available invoices with additional filtering
   */
  async getEnhancedAvailableInvoices(
    options: {
      search?: string;
      customerName?: string;
      minAvailableBalance?: number;
      excludeFullyCredited?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<AvailableInvoicesResponse> {
    const {
      search = "",
      customerName = "",
      minAvailableBalance,
      excludeFullyCredited = true,
      limit = 50,
      offset = 0,
    } = options;

    // Use the existing method with enhanced parameters
    return this.getAvailableInvoices(
      search,
      customerName,
      limit,
      offset,
      minAvailableBalance
    );
  }

  /**
   * Check if credit note can be linked to an invoice
   */
  async canLinkToInvoice(
    creditNoteId: string,
    invoiceId: string
  ): Promise<{ canLink: boolean; reason?: string; availableBalance?: number }> {
    try {
      const creditNote = await this.getCreditNote(creditNoteId);
      if (!creditNote.success) {
        return { canLink: false, reason: "Credit note not found" };
      }

      const validation = await this.validateCreditLinkage(
        invoiceId,
        creditNote.credit_note.total_amt
      );

      return {
        canLink: validation.validation?.valid || false,
        reason: validation.validation?.error || validation.validation?.message,
        availableBalance: validation.validation?.available_balance,
      };
    } catch (error: any) {
      return { canLink: false, reason: error.message };
    }
  }

  /**
   * Batch validate multiple credit notes for linking
   */
  async batchValidateCreditNotes(
    creditNoteIds: string[],
    targetInvoiceId: string
  ): Promise<
    Array<{
      creditNoteId: string;
      canLink: boolean;
      reason?: string;
      availableBalance?: number;
    }>
  > {
    const results = [];

    for (const creditNoteId of creditNoteIds) {
      try {
        const result = await this.canLinkToInvoice(
          creditNoteId,
          targetInvoiceId
        );
        results.push({
          creditNoteId,
          ...result,
        });
      } catch (error: any) {
        results.push({
          creditNoteId,
          canLink: false,
          reason: error.message,
        });
      }

      // Small delay to avoid overwhelming the API
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return results;
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
  // New types
  CreditValidationRequest,
  CreditValidationResponse,
  CreditValidationResult,
  InvoiceCreditSummary,
  FullyCreditedInvoicesResponse,
  InvoiceWithCreditInfo,
};
