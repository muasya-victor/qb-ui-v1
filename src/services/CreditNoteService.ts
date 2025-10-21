"use client";
import apiService from "./apiService";

class CreditNoteService {
  constructor() {
    this.baseURL =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";
  }

  getAuthHeaders() {
    const token = apiService.isAuthenticated() ? this.getAuthToken() : null;
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  getAuthToken() {
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

  buildQueryString(params = {}) {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return searchParams.toString();
  }

  async getCreditNotes(params = {}) {
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

  async getAllCreditNotes(progressCallback) {
    try {
      let allCreditNotes = [];
      let currentPage = 1;
      let totalPages = 1;
      let companyInfo = null;

      const updateProgress = (message) => {
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

  async getCreditNote(creditNoteId) {
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

  async syncCreditNotesFromQuickBooks() {
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

  // KRA Validation Methods for Credit Notes
  async validateCreditNoteToKRA(creditNoteId) {
    try {
      console.log(`Validating credit note ${creditNoteId} with KRA...`);

      // FIX: Changed from submit-to-kra to submit_to_kra
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

  async getKRASubmissionStatus(submissionId) {
    try {
      console.log(`Fetching KRA submission status for: ${submissionId}`);

      const response = await fetch(
        `${this.baseURL}/kra/credit-note-submissions/${submissionId}/status/`,
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

  async bulkValidateCreditNotesToKRA(creditNoteIds, progressCallback) {
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
              kraCreditNoteNumber: result.kra_credit_note_number,
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
        } catch (error) {
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
}

// Create and export singleton instance
const creditNoteService = new CreditNoteService();
export default creditNoteService;
