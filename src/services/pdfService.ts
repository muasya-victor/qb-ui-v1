// pdfService.ts
"use client";

import apiService from "./apiService";

interface PDFDownloadResponse {
  success: boolean;
  blob?: Blob;
  error?: string;
}

class PDFService {
  private baseURL: string;

  constructor() {
    this.baseURL =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";
  }

  private getAuthHeaders(): HeadersInit {
    const token = apiService.isAuthenticated() ? this.getAuthToken() : null;
    return {
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

  /**
   * Download invoice as PDF
   * @param invoiceId - The ID of the invoice to download
   * @returns Promise with success status and blob data
   */
  async downloadInvoicePDF(invoiceId: string): Promise<PDFDownloadResponse> {
    try {
      console.log(`Downloading PDF for invoice: ${invoiceId}`);

      const response = await fetch(
        `${this.baseURL}/invoices/pdf/${invoiceId}/download/`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`
        );
      }

      // Check if response is PDF
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/pdf")) {
        throw new Error("Response is not a PDF file");
      }

      const blob = await response.blob();

      // Create download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get("content-disposition");
      let filename = `invoice-${invoiceId}.pdf`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log(`PDF downloaded successfully for invoice: ${invoiceId}`);

      return {
        success: true,
        blob,
      };
    } catch (error) {
      console.error("Error downloading invoice PDF:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Get PDF as blob without automatic download
   * Useful for preview or custom download handling
   */
  async getInvoicePDFBlob(invoiceId: string): Promise<PDFDownloadResponse> {
    try {
      console.log(`Fetching PDF blob for invoice: ${invoiceId}`);

      const response = await fetch(
        `${this.baseURL}/invoices/${invoiceId}/pdf/`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();

      return {
        success: true,
        blob,
      };
    } catch (error) {
      console.error("Error fetching invoice PDF blob:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Open PDF in new tab instead of downloading
   */
  async openInvoicePDF(invoiceId: string): Promise<PDFDownloadResponse> {
    try {
      const result = await this.getInvoicePDFBlob(invoiceId);

      if (result.success && result.blob) {
        const url = window.URL.createObjectURL(result.blob);
        window.open(url, "_blank");

        // Clean up the URL after some time
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 1000);

        return result;
      }

      return result;
    } catch (error) {
      console.error("Error opening invoice PDF:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Preview PDF in an iframe or embed element
   */
  async getInvoicePDFUrl(invoiceId: string): Promise<string | null> {
    try {
      const result = await this.getInvoicePDFBlob(invoiceId);

      if (result.success && result.blob) {
        return window.URL.createObjectURL(result.blob);
      }

      return null;
    } catch (error) {
      console.error("Error getting invoice PDF URL:", error);
      return null;
    }
  }
}

// Create and export singleton instance
const pdfService = new PDFService();
export default pdfService;

// Export types
export type { PDFDownloadResponse };
