import apiService from "./apiService";

interface CreditNoteLineItem {
  id: string;
  line_num: number;
  item_name: string;
  description: string;
  qty: number;
  unit_price: number;
  amount: number;
}

interface CreditNote {
  id: string;
  qb_credit_id: string;
  doc_number: string;
  txn_date: string;
  total_amt: number;
  balance: number;
  customer_name: string;
  customer_ref_value: string;
  private_note?: string;
  customer_memo?: string;
  related_invoice?: string;
  template_id?: string;
  template_name?: string;
  line_items: CreditNoteLineItem[];
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
  };
}

interface CreditNoteQueryParams {
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
          page_size: 100, // Use large page size for efficiency
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
          // No pagination info means this is all the data
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

  async syncCreditNotesFromQuickBooks(
  ): Promise<SyncResponse> {
    try {
      const response = await fetch(`${this.baseURL}/credit-notes/sync/`, {
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
      console.error("Error syncing credit notes:", error);
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

  async applyCreditNote(
    creditNoteId: string,
    invoiceId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(
        `${this.baseURL}/credit-notes/${creditNoteId}/apply/`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ invoice_id: invoiceId }),
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
      console.error("Error applying credit note:", error);
      throw error;
    }
  }

  async voidCreditNote(
    creditNoteId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(
        `${this.baseURL}/credit-notes/${creditNoteId}/void/`,
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
      console.error("Error voiding credit note:", error);
      throw error;
    }
  }

  // Helper method to calculate credit note status
  calculateCreditNoteStatus(
    creditNote: CreditNote
  ): "applied" | "pending" | "void" {
    if (creditNote.balance === 0) {
      return "applied";
    }
    return "pending";
  }

  // Helper method to format credit note data for display
  formatCreditNoteForDisplay(creditNote: CreditNote) {
    return {
      ...creditNote,
      status: this.calculateCreditNoteStatus(creditNote),
      display_amount: Math.abs(creditNote.total_amt), 
      available_credit: creditNote.balance,
    };
  }
}

export default new CreditNoteService();
export type {
  CreditNote,
  CreditNotesResponse,
  SyncResponse,
  PaginationInfo,
  CreditNoteQueryParams,
  CreditNoteLineItem,
};
