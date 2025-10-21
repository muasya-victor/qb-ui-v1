"use client";
import apiService from "./apiService";

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

  // KRA Validation Methods for Credit Notes
  async validateCreditNoteToKRA(creditNoteId: string) {
    try {
      console.log(`Validating credit note ${creditNoteId} with KRA...`);

      const response = await fetch(
        `${this.baseURL}/credit-notes/${creditNoteId}/submit-to-kra/`,
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

  async getKRASubmissionStatus(submissionId: string) {
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

  async bulkValidateCreditNotesToKRA(
    creditNoteIds: string[],
    progressCallback?: (
      progress: number,
      current: string,
      success: boolean
    ) => void
  ) {
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
}

// Create and export singleton instance
const creditNoteService = new CreditNoteService();
export default creditNoteService;
