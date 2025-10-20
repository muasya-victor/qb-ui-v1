import apiService from "./apiService";

interface Company {
  id: string;
  name?: string;
  realm_id: string;
  is_connected: boolean;
  is_default?: boolean;
  role?: string;
  is_active?: boolean;
  created_at?: string;
  // Additional company details from your model
  qb_company_name?: string;
  qb_legal_name?: string;
  qb_country?: string;
  qb_address?: any;
  qb_phone?: string;
  qb_email?: string;
  qb_website?: string;
  currency_code?: string;
  logo_url?: string;
  invoice_template_id?: string;
  invoice_template_name?: string;
  invoice_logo_enabled?: boolean;
  brand_color?: string;
  invoice_footer_text?: string;
  created_by?: string;
  qb_company_info?: string;
}

interface CompanyMembership {
  id: string;
  user: string;
  user_email: string;
  company: string;
  company_name: string;
  is_default: boolean;
  role: string;
}

interface CreateCompanyRequest {
  name: string;
  realm_id: string;
}

interface UpdateCompanyRequest {
  name?: string;
  invoice_logo_enabled?: boolean;
  brand_color?: string;
  invoice_footer_text?: string;
}

interface AddMemberRequest {
  user_email: string;
  role?: string;
  is_default?: boolean;
}

interface UpdateMemberRequest {
  role?: string;
  is_default?: boolean;
}

interface CompaniesResponse {
  success: boolean;
  companies: Company[];
  active_company_id: string | null;
}

interface CompanyResponse {
  success: boolean;
  company: Company;
}

interface MembershipsResponse {
  success: boolean;
  memberships: CompanyMembership[];
}

interface MembershipResponse {
  success: boolean;
  membership: CompanyMembership;
}

interface DisconnectResponse {
  success: boolean;
  message: string;
}

class CompanyService {
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
    return apiService.getAccessToken();
  }

  // Company CRUD Operations
  async createCompany(data: CreateCompanyRequest): Promise<CompanyResponse> {
    try {
      const response = await fetch(`${this.baseURL}/companies/`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating company:", error);
      throw error;
    }
  }

  async getMyCompanies(): Promise<CompaniesResponse> {
    try {
      const response = await fetch(`${this.baseURL}/companies/`, {
        method: "GET",
        headers: this.getAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching companies:", error);
      throw error;
    }
  }

  async getCompany(companyId: string): Promise<CompanyResponse> {
    try {
      console.log("🔄 [CompanyService] Fetching company with ID:", companyId);
      console.log(
        "🔄 [CompanyService] Full URL:",
        `${this.baseURL}/companies/${companyId}/`
      );

      const response = await fetch(`${this.baseURL}/companies/${companyId}/`, {
        method: "GET",
        headers: this.getAuthHeaders(),
        credentials: "include",
      });

      console.log("📡 [CompanyService] Response status:", response.status);
      console.log("📡 [CompanyService] Response ok:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "❌ [CompanyService] HTTP error:",
          response.status,
          errorText
        );
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log("✅ [CompanyService] Raw response data:", responseData);

      // Handle different response structures
      let companyData: Company;

      if (responseData.company) {
        // Structure: {success: true, company: {...}}
        companyData = responseData.company;
      } else if (responseData.id) {
        // Structure: company object directly {...}
        console.log(
          "🔄 [CompanyService] Detected direct company object response"
        );
        companyData = responseData;
      } else if (responseData.data) {
        // Structure: {data: {...}}
        companyData = responseData.data;
      } else {
        console.warn(
          "⚠️ [CompanyService] Unexpected response structure:",
          responseData
        );
        throw new Error("Unexpected response structure from server");
      }

      console.log("✅ [CompanyService] Processed company data:", companyData);

      return {
        success: true,
        company: companyData,
      };
    } catch (error) {
      console.error("❌ [CompanyService] Error fetching company:", error);
      throw error;
    }
  }

  async updateCompany(
    companyId: string,
    data: UpdateCompanyRequest
  ): Promise<CompanyResponse> {
    try {
      const response = await fetch(`${this.baseURL}/companies/${companyId}/`, {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating company:", error);
      throw error;
    }
  }

  async deleteCompany(
    companyId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseURL}/companies/${companyId}/`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error deleting company:", error);
      throw error;
    }
  }

  // Company Actions
  async disconnectCompany(companyId: string): Promise<DisconnectResponse> {
    try {
      const response = await fetch(
        `${this.baseURL}/companies/${companyId}/disconnect/`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error disconnecting company:", error);
      throw error;
    }
  }

  async refreshCompanyInfo(companyId: string): Promise<CompanyResponse> {
    try {
      const response = await fetch(
        `${this.baseURL}/companies/${companyId}/refresh-info/`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error refreshing company info:", error);
      throw error;
    }
  }

  // Membership Management
  async getMyMemberships(): Promise<MembershipsResponse> {
    try {
      const response = await fetch(`${this.baseURL}/memberships/`, {
        method: "GET",
        headers: this.getAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching memberships:", error);
      throw error;
    }
  }

  async addMember(
    companyId: string,
    data: AddMemberRequest
  ): Promise<MembershipResponse> {
    try {
      const response = await fetch(
        `${this.baseURL}/companies/${companyId}/add-member/`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error adding member:", error);
      throw error;
    }
  }

  async updateMember(
    membershipId: string,
    data: UpdateMemberRequest
  ): Promise<MembershipResponse> {
    try {
      const response = await fetch(
        `${this.baseURL}/memberships/${membershipId}/`,
        {
          method: "PATCH",
          headers: this.getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating membership:", error);
      throw error;
    }
  }

  async removeMember(
    membershipId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(
        `${this.baseURL}/memberships/${membershipId}/`,
        {
          method: "DELETE",
          headers: this.getAuthHeaders(),
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error removing member:", error);
      throw error;
    }
  }

  async setDefaultCompany(membershipId: string): Promise<MembershipResponse> {
    try {
      const response = await fetch(
        `${this.baseURL}/memberships/${membershipId}/set-default/`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error setting default company:", error);
      throw error;
    }
  }

  // Active Company Management
  async setActiveCompany(
    companyId: string
  ): Promise<{ success: boolean; message: string; active_company: Company }> {
    try {
      const response = await fetch(
        `${this.baseURL}/active-company/set-active/`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify({ company_id: companyId }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error setting active company:", error);
      throw error;
    }
  }

  async getActiveCompany(): Promise<{
    success: boolean;
    active_company: Company;
  }> {
    try {
      const response = await fetch(`${this.baseURL}/active-company/`, {
        method: "GET",
        headers: this.getAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching active company:", error);
      throw error;
    }
  }

  // Utility Methods
  async getCurrentUserCompanies(): Promise<Company[]> {
    const response = await this.getMyCompanies();
    return response.companies;
  }

  async getCurrentActiveCompany(): Promise<Company | null> {
    try {
      const response = await this.getActiveCompany();
      return response.active_company;
    } catch (error) {
      console.error("Error getting active company:", error);
      return null;
    }
  }

  // Check if user has access to a company
  async hasCompanyAccess(companyId: string): Promise<boolean> {
    try {
      await this.getCompany(companyId);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Check if user is admin of a company
  async isCompanyAdmin(companyId: string): Promise<boolean> {
    try {
      const memberships = await this.getMyMemberships();
      const membership = memberships.memberships.find(
        (m) => m.company === companyId
      );
      return membership?.role === "admin";
    } catch (error) {
      return false;
    }
  }
}

export default new CompanyService();
export type {
  Company,
  CompanyMembership,
  CreateCompanyRequest,
  UpdateCompanyRequest,
  AddMemberRequest,
  UpdateMemberRequest,
  CompaniesResponse,
  CompanyResponse,
  MembershipsResponse,
  MembershipResponse,
  DisconnectResponse,
};
