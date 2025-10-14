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
  error?: string;
}

interface CustomerFormData {
  display_name: string;
  given_name: string;
  family_name: string;
  company_name: string;
  email: string;
  phone: string;
  mobile: string;
  fax: string;
  website: string;
  active: boolean;
  notes: string;
  taxable: boolean;
  tax_code_ref_value: string;
  bill_addr_line1: string;
  bill_addr_line2: string;
  bill_addr_city: string;
  bill_addr_state: string;
  bill_addr_postal_code: string;
  bill_addr_country: string;
  ship_addr_line1: string;
  ship_addr_line2: string;
  ship_addr_city: string;
  ship_addr_state: string;
  ship_addr_postal_code: string;
  ship_addr_country: string;
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

  async updateCustomer(
    customerId: string,
    formData: CustomerFormData
  ): Promise<{ success: boolean; customer: Customer }> {
    try {
      const response = await fetch(`${this.baseURL}/customers/${customerId}/`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(formData),
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
      console.error("Error updating customer:", error);
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

  async createCustomer(
    formData: CustomerFormData
  ): Promise<{ success: boolean; customer: Customer }> {
    try {
      const response = await fetch(`${this.baseURL}/customers/`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(formData),
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
      console.error("Error creating customer:", error);
      throw error;
    }
  }
}

export default new CustomerService();
export type {
  Customer,
  CustomersResponse,
  SyncResponse,
  PaginationInfo,
  CustomerQueryParams,
  CustomerFormData,
};
