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
  custom_logo?: string;
  kra_pin?: string;
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
  kra_pin?: string;
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

interface LogoUploadResponse {
  success: boolean;
  company: Company;
  message?: string;
}

class CompanyService {
  private baseURL: string;

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
    console.log(`🔄 Making request to: ${url}`);
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage =
        errorData?.error ||
        errorData?.message ||
        `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
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
    const response = await this.makeRequest<any>(
      `${this.baseURL}/companies/${companyId}/`,
      { method: "GET" }
    );

    let companyData: Company;

    if (response.company) companyData = response.company;
    else if (response.id) companyData = response;
    else if (response.data) companyData = response.data;
    else throw new Error("Unexpected response structure from server");

    return { success: true, company: companyData };
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
      { method: "DELETE" }
    );
  }

  // Company Actions
  async disconnectCompany(companyId: string): Promise<DisconnectResponse> {
    return this.makeRequest<DisconnectResponse>(
      `${this.baseURL}/companies/${companyId}/disconnect/`,
      { method: "POST" }
    );
  }

  async refreshCompanyInfo(companyId: string): Promise<CompanyResponse> {
    return this.makeRequest<CompanyResponse>(
      `${this.baseURL}/companies/${companyId}/refresh-info/`,
      { method: "POST" }
    );
  }

  // Logo Upload Methods
  async uploadCompanyLogo(
    companyId: string,
    file: File
  ): Promise<LogoUploadResponse> {
    const formData = new FormData();
    formData.append("custom_logo", file);

    const response = await fetch(`${this.baseURL}/companies/${companyId}/`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${apiService.getAccessToken()}`,
      },
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage =
        errorData?.error ||
        errorData?.message ||
        `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async removeCompanyLogo(companyId: string): Promise<LogoUploadResponse> {
    return this.makeRequest<LogoUploadResponse>(
      `${this.baseURL}/companies/${companyId}/remove-logo/`,
      { method: "POST" }
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
      { method: "DELETE" }
    );
  }

  async setDefaultCompany(membershipId: string): Promise<MembershipResponse> {
    return this.makeRequest<MembershipResponse>(
      `${this.baseURL}/memberships/${membershipId}/set-default/`,
      { method: "POST" }
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
      { method: "GET" }
    );
  }

  // Utility
  async getCurrentUserCompanies(): Promise<Company[]> {
    const response = await this.getMyCompanies();
    return response.companies;
  }

  async getCurrentActiveCompany(): Promise<Company | null> {
    try {
      const response = await this.getActiveCompany();
      console.log("🔍 Raw response:", response);

      // Handle both structures
      if (Array.isArray(response) && response.length > 0) {
        return response[0].company_data; // your backend structure
      }
      return (response as any).active_company || null;
    } catch (error) {
      console.error("Error getting active company:", error);
      return null;
    }
  }

  async hasCompanyAccess(companyId: string): Promise<boolean> {
    try {
      await this.getCompany(companyId);
      return true;
    } catch {
      return false;
    }
  }

  async isCompanyAdmin(companyId: string): Promise<boolean> {
    try {
      const memberships = await this.getMyMemberships();
      const membership = memberships.memberships.find(
        (m) => m.company === companyId
      );
      return membership?.role === "admin";
    } catch {
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
  LogoUploadResponse,
};
