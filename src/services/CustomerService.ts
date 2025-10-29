"use client";
import apiService from "./apiService";

interface Customer {
  id: string;
  qb_customer_id: string;
  display_name: string;
  given_name?: string;
  family_name?: string;
  company_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
  website?: string;
  balance: number;
  balance_with_jobs: number;
  active: boolean;
  notes?: string;
  taxable: boolean;
  tax_code_ref_value?: string;
  tax_code_ref_name?: string;
  currency_code: string;
  created_at: string;
  updated_at: string;
  is_stub?: boolean;

  // Address fields
  bill_addr_line1?: string;
  bill_addr_line2?: string;
  bill_addr_city?: string;
  bill_addr_state?: string;
  bill_addr_postal_code?: string;
  bill_addr_country?: string;

  ship_addr_line1?: string;
  ship_addr_line2?: string;
  ship_addr_city?: string;
  ship_addr_state?: string;
  ship_addr_postal_code?: string;
  ship_addr_country?: string;
}

interface PaginationInfo {
  count: number;
  next: string | null;
  previous: string | null;
  page_size: number;
  current_page: number;
  total_pages: number;
}

interface CustomersResponse {
  success: boolean;
  customers: Customer[];
  pagination?: PaginationInfo;
  company_info?: {
    currency_code: string;
    name: string;
    realm_id: string;
  };
  stats?: {
    total_customers: number;
    stub_customers: number;
    active_customers: number;
    real_customers: number;
  };
}

interface CustomerQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  active?: string;
  fetch_all?: boolean;
}

interface SyncResponse {
  success: boolean;
  message: string;
  synced_count?: number;
  failed_count?: number;
  stub_customers?: number;
  error?: string;
}

interface EnhanceResponse {
  success: boolean;
  message: string;
  enhanced_count?: number;
  failed_count?: number;
  error?: string;
}

class CustomerService {
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

  private buildQueryString(params: CustomerQueryParams): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return searchParams.toString();
  }

  async getCustomers(
    params: CustomerQueryParams = {}
  ): Promise<CustomersResponse> {
    try {
      const queryString = this.buildQueryString(params);
      const url = `${this.baseURL}/customers/${
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
      console.error("Error fetching customers:", error);
      throw error;
    }
  }

  async getCustomer(
    customerId: string
  ): Promise<{ success: boolean; customer: Customer }> {
    try {
      const response = await fetch(`${this.baseURL}/customers/${customerId}/`, {
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
      console.error("Error fetching customer:", error);
      throw error;
    }
  }

  async syncCustomersFromQuickBooks(): Promise<SyncResponse> {
    try {
      const response = await fetch(`${this.baseURL}/customers/sync/`, {
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
      console.error("Error syncing customers:", error);
      throw error;
    }
  }

  async enhanceStubCustomers(): Promise<EnhanceResponse> {
    try {
      const response = await fetch(`${this.baseURL}/customers/enhance-stubs/`, {
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
      console.error("Error enhancing stub customers:", error);
      throw error;
    }
  }

  async getCustomerStats(): Promise<{
    success: boolean;
    stats?: {
      customers: {
        total: number;
        stub: number;
        real: number;
        active: number;
        inactive: number;
        quality_score: number;
      };
      invoices: {
        total: number;
        with_customers: number;
        with_stub_customers: number;
        without_customers: number;
        link_quality_score: number;
      };
    };
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseURL}/customers/stats/`, {
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
      console.error("Error fetching customer stats:", error);
      throw error;
    }
  }

  async enhanceSingleCustomer(customerId: string): Promise<{
    success: boolean;
    message: string;
    customer?: Customer;
    error?: string;
  }> {
    try {
      const response = await fetch(
        `${this.baseURL}/customers/${customerId}/enhance/`,
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
      console.error("Error enhancing customer:", error);
      throw error;
    }
  }
}

// Create and export singleton instance
const customerService = new CustomerService();
export default customerService;

// Export types for use in other components
export type {
  Customer,
  CustomersResponse,
  SyncResponse,
  EnhanceResponse,
  PaginationInfo,
  CustomerQueryParams,
};
