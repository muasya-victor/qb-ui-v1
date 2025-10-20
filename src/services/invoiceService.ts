"use client";
import apiService from "./apiService";

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
  qb_invoice_id?: string;
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
    id?: string;
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

interface KRASubmissionStatus {
  submission_id: string;
  invoice_id: string;
  kra_invoice_number: number;
  status: "pending" | "submitted" | "success" | "failed";
  submitted_at: string;
  error_message: string;
  receipt_signature: string;
  qr_code_data: string;
  kra_response: any;
}

interface CompanyKRASubmissions {
  company: string;
  submissions: Array<{
    id: string;
    invoice_number: string;
    kra_invoice_number: number;
    customer_name: string;
    total_amount: number;
    status: string;
    submitted_at: string;
    error_message: string;
  }>;
}

class InvoiceService {
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

  private buildQueryString(params: InvoiceQueryParams): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return searchParams.toString();
  }

  async getInvoices(
    params: InvoiceQueryParams = {}
  ): Promise<InvoicesResponse> {
    try {
      const queryString = this.buildQueryString(params);
      const url = `${this.baseURL}/invoices/${
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
      console.error("Error fetching invoices:", error);
      throw error;
    }
  }

  async getAllInvoices(
    progressCallback?: (message: string) => void
  ): Promise<InvoicesResponse> {
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

      updateProgress("Starting to fetch all invoices from QuickBooks...");

      while (currentPage <= totalPages) {
        updateProgress(
          `Fetching page ${currentPage}${
            totalPages > 1 ? ` of ${totalPages}` : ""
          }...`
        );

        const response = await this.getInvoices({
          page: currentPage,
          page_size: 100, // Use large page size for efficiency
        });

        if (!response.success) {
          throw new Error("Failed to fetch invoices");
        }

        allInvoices = [...allInvoices, ...response.invoices];

        if (response.company_info && !companyInfo) {
          companyInfo = response.company_info;
        }

        if (response.pagination) {
          totalPages = response.pagination.total_pages;
          currentPage = response.pagination.current_page + 1;

          updateProgress(
            `Loaded ${allInvoices.length} invoices so far (page ${response.pagination.current_page} of ${totalPages})`
          );
        } else {
          // No pagination info means this is all the data
          updateProgress(
            `Loaded ${allInvoices.length} invoices (no pagination)`
          );
          break;
        }
      }

      updateProgress(
        `✅ Successfully fetched all ${allInvoices.length} invoices from QuickBooks`
      );

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
          total_pages: 1,
        },
      };
    } catch (error) {
      console.error("Error fetching all invoices:", error);
      throw error;
    }
  }

  async syncInvoicesFromQuickBooks(): Promise<SyncResponse> {
    try {
      const response = await fetch(
        `${this.baseURL}/invoices/sync_from_quickbooks/`,
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
      console.error("Error syncing invoices:", error);
      throw error;
    }
  }

  async getInvoice(
    invoiceId: string
  ): Promise<{ success: boolean; invoice: Invoice }> {
    try {
      const response = await fetch(`${this.baseURL}/invoices/${invoiceId}/`, {
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
      console.error("Error fetching invoice:", error);
      throw error;
    }
  }

  // KRA Validation Methods
  async validateInvoiceToKRA(
    invoiceId: string
  ): Promise<KRAValidationResponse> {
    try {
      console.log(`Validating invoice ${invoiceId} with KRA...`);

      const response = await fetch(
        `${this.baseURL}/kra/invoices/${invoiceId}/validate-kra/`,
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
      console.error("Error validating invoice with KRA:", error);
      throw error;
    }
  }

  async getKRASubmissionStatus(
    submissionId: string
  ): Promise<KRASubmissionStatus> {
    try {
      console.log(`Fetching KRA submission status for: ${submissionId}`);

      const response = await fetch(
        `${this.baseURL}/kra/submissions/${submissionId}/status/`,
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
      console.error("Error fetching KRA submission status:", error);
      throw error;
    }
  }

  async getCompanyKRASubmissions(
    companyId: string
  ): Promise<CompanyKRASubmissions> {
    try {
      console.log(`Fetching KRA submissions for company: ${companyId}`);

      const response = await fetch(
        `${this.baseURL}/kra/companies/${companyId}/kra-submissions/`,
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
      console.error("Error fetching company KRA submissions:", error);
      throw error;
    }
  }

  async pollKRASubmissionStatus(
    submissionId: string,
    maxAttempts: number = 10,
    interval: number = 2000
  ): Promise<KRASubmissionStatus> {
    return new Promise((resolve, reject) => {
      let attempts = 0;

      const poll = async () => {
        try {
          attempts++;
          console.log(
            `Polling KRA submission status (attempt ${attempts}/${maxAttempts})...`
          );

          const status = await this.getKRASubmissionStatus(submissionId);

          if (status.status === "success" || status.status === "failed") {
            resolve(status);
            return;
          }

          if (attempts >= maxAttempts) {
            reject(new Error("Max polling attempts reached"));
            return;
          }

          // Continue polling
          setTimeout(poll, interval);
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }

  async bulkValidateInvoicesToKRA(
    invoiceIds: string[],
    progressCallback?: (
      progress: number,
      current: string,
      success: boolean
    ) => void
  ): Promise<{
    success: number;
    failed: number;
    results: Array<{ invoiceId: string; success: boolean; error?: string }>;
  }> {
    try {
      console.log(
        `Starting bulk KRA validation for ${invoiceIds.length} invoices...`
      );

      const results = [];
      let successCount = 0;
      let failedCount = 0;

      for (let i = 0; i < invoiceIds.length; i++) {
        const invoiceId = invoiceIds[i];

        try {
          if (progressCallback) {
            progressCallback(
              Math.round((i / invoiceIds.length) * 100),
              invoiceId,
              false
            );
          }

          const result = await this.validateInvoiceToKRA(invoiceId);

          if (result.success) {
            successCount++;
            results.push({
              invoiceId,
              success: true,
              kraInvoiceNumber: result.kra_invoice_number,
            });
          } else {
            failedCount++;
            results.push({ invoiceId, success: false, error: result.error });
          }

          if (progressCallback) {
            progressCallback(
              Math.round(((i + 1) / invoiceIds.length) * 100),
              invoiceId,
              result.success
            );
          }

          // Small delay to avoid overwhelming the API
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          failedCount++;
          results.push({ invoiceId, success: false, error: error.message });

          if (progressCallback) {
            progressCallback(
              Math.round(((i + 1) / invoiceIds.length) * 100),
              invoiceId,
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

  // Utility method to check if KRA is configured for a company
  async checkKRAConfiguration(
    companyId: string
  ): Promise<{ configured: boolean; message?: string }> {
    try {
      // Try to fetch KRA submissions - if it works, configuration exists
      await this.getCompanyKRASubmissions(companyId);
      return { configured: true };
    } catch (error: any) {
      if (error.message?.includes("KRA configuration not found")) {
        return {
          configured: false,
          message: "KRA configuration not found for this company",
        };
      }
      if (error.message?.includes("403")) {
        return {
          configured: false,
          message: "Access denied to KRA configuration",
        };
      }
      return {
        configured: false,
        message: "Unable to verify KRA configuration",
      };
    }
  }

  // Method to get KRA receipt details for display
  async getKRAReceiptDetails(invoiceId: string): Promise<{
    success: boolean;
    receipt?: {
      kra_invoice_number: number;
      receipt_signature: string;
      qr_code_data: string;
      submission_date: string;
      control_unit_number?: string;
      invoice_number?: string;
    };
    error?: string;
  }> {
    try {
      // First, get company submissions to find this invoice
      const companyResponse = await this.getCompanyKRASubmissions("current"); // You might need to adjust this
      const submission = companyResponse.submissions.find(
        (sub) => sub.invoice_number === invoiceId || sub.id === invoiceId
      );

      if (!submission) {
        return {
          success: false,
          error: "No KRA submission found for this invoice",
        };
      }

      // Then get detailed status
      const status = await this.getKRASubmissionStatus(submission.id);

      return {
        success: true,
        receipt: {
          kra_invoice_number: status.kra_invoice_number,
          receipt_signature: status.receipt_signature,
          qr_code_data: status.qr_code_data,
          submission_date: status.submitted_at,
          control_unit_number: status.kra_response?.data?.sdcId,
          invoice_number: status.kra_response?.data?.rcptNo?.toString(),
        },
      };
    } catch (error) {
      console.error("Error fetching KRA receipt details:", error);
      return { success: false, error: error.message };
    }
  }
}

// Create and export singleton instance
const invoiceService = new InvoiceService();
export default invoiceService;

// Export types for use in other components
export type {
  Invoice,
  InvoicesResponse,
  SyncResponse,
  PaginationInfo,
  InvoiceQueryParams,
  KRAValidationResponse,
  KRASubmissionStatus,
  CompanyKRASubmissions,
};
