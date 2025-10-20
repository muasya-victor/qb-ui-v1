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
  private requestCache: Map<string, Promise<any>> = new Map();

  constructor() {
    this.baseURL =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";
  }

  private getAuthHeaders() {
    const token = apiService.isAuthenticated()
      ? apiService.getAccessToken()
      : null;
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async makeRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const cacheKey = `${url}-${JSON.stringify(options)}`;

    // Prevent duplicate simultaneous requests
    if (this.requestCache.has(cacheKey)) {
      console.log(`🔄 Using cached request for: ${url}`);
      return this.requestCache.get(cacheKey) as Promise<T>;
    }

    console.log(`🔄 Making new request to: ${url}`);
    const requestPromise = this._makeRequest<T>(url, options);
    this.requestCache.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Clear cache after a short delay
      setTimeout(() => {
        this.requestCache.delete(cacheKey);
      }, 1000);
    }
  }

  private async _makeRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: this.getAuthHeaders(),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Company CRUD Operations
  async createCompany(data: CreateCompanyRequest): Promise<CompanyResponse> {
    return this.makeRequest<CompanyResponse>(`${this.baseURL}/companies/`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getMyCompanies(): Promise<CompaniesResponse> {
    return this.makeRequest<CompaniesResponse>(`${this.baseURL}/companies/`, {
      method: "GET",
    });
  }

  async getCompany(companyId: string): Promise<CompanyResponse> {
    try {
      console.log("🔄 [CompanyService] Fetching company with ID:", companyId);

      const response = await this.makeRequest<any>(
        `${this.baseURL}/companies/${companyId}/`,
        {
          method: "GET",
        }
      );

      console.log("✅ [CompanyService] Raw response data:", response);

      // Handle different response structures
      let companyData: Company;

      if (response.company) {
        // Structure: {success: true, company: {...}}
        companyData = response.company;
      } else if (response.id) {
        // Structure: company object directly {...}
        console.log(
          "🔄 [CompanyService] Detected direct company object response"
        );
        companyData = response;
      } else if (response.data) {
        // Structure: {data: {...}}
        companyData = response.data;
      } else {
        console.warn(
          "⚠️ [CompanyService] Unexpected response structure:",
          response
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
    return this.makeRequest<CompanyResponse>(
      `${this.baseURL}/companies/${companyId}/`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    );
  }

  async deleteCompany(
    companyId: string
  ): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>(
      `${this.baseURL}/companies/${companyId}/`,
      {
        method: "DELETE",
      }
    );
  }

  // Company Actions
  async disconnectCompany(companyId: string): Promise<DisconnectResponse> {
    return this.makeRequest<DisconnectResponse>(
      `${this.baseURL}/companies/${companyId}/disconnect/`,
      {
        method: "POST",
      }
    );
  }

  async refreshCompanyInfo(companyId: string): Promise<CompanyResponse> {
    return this.makeRequest<CompanyResponse>(
      `${this.baseURL}/companies/${companyId}/refresh-info/`,
      {
        method: "POST",
      }
    );
  }

  // Membership Management
  async getMyMemberships(): Promise<MembershipsResponse> {
    return this.makeRequest<MembershipsResponse>(
      `${this.baseURL}/memberships/`,
      {
        method: "GET",
      }
    );
  }

  async addMember(
    companyId: string,
    data: AddMemberRequest
  ): Promise<MembershipResponse> {
    return this.makeRequest<MembershipResponse>(
      `${this.baseURL}/companies/${companyId}/add-member/`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  }

  async updateMember(
    membershipId: string,
    data: UpdateMemberRequest
  ): Promise<MembershipResponse> {
    return this.makeRequest<MembershipResponse>(
      `${this.baseURL}/memberships/${membershipId}/`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    );
  }

  async removeMember(
    membershipId: string
  ): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>(
      `${this.baseURL}/memberships/${membershipId}/`,
      {
        method: "DELETE",
      }
    );
  }

  async setDefaultCompany(membershipId: string): Promise<MembershipResponse> {
    return this.makeRequest<MembershipResponse>(
      `${this.baseURL}/memberships/${membershipId}/set-default/`,
      {
        method: "POST",
      }
    );
  }

  // Active Company Management
  async setActiveCompany(
    companyId: string
  ): Promise<{ success: boolean; message: string; active_company: Company }> {
    return this.makeRequest<{
      success: boolean;
      message: string;
      active_company: Company;
    }>(`${this.baseURL}/active-company/set-active/`, {
      method: "POST",
      body: JSON.stringify({ company_id: companyId }),
    });
  }

  async getActiveCompany(): Promise<{
    success: boolean;
    active_company: Company;
  }> {
    return this.makeRequest<{ success: boolean; active_company: Company }>(
      `${this.baseURL}/active-company/`,
      {
        method: "GET",
      }
    );
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

  // Clear all cached requests (useful for logout)
  clearCache(): void {
    this.requestCache.clear();
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
