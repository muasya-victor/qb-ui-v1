interface TokenData {
  access: string;
  refresh: string;
}

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface Company {
  id: string;
  name: string;
  realm_id: string;
  is_connected: boolean;
  is_default: boolean;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

interface RegisterResponse {
  success: boolean;
  message: string;
  user: User;
  tokens: TokenData;
}

interface AuthUrlRequest {
  email: string;
  password: string;
  scopes?: string;
}

interface AuthUrlResponse {
  success: boolean;
  company: Company | null;
  is_connected: boolean;
  authUrl: string | null;
  tokens: TokenData;
  message?: string;
}

interface CompaniesResponse {
  success: boolean;
  companies: Company[];
  active_company_id: string;
}

interface SetActiveCompanyRequest {
  company_id: string;
}

interface SetActiveCompanyResponse {
  success: boolean;
  message: string;
  active_company: Company;
}

interface CallbackRequest {
  code: string;
  realmId: string;
  state: string;
}

interface CallbackResponse {
  success: boolean;
  company: Company;
  membership: {
    is_default: boolean;
    role: string;
  };
  active_company: string;
  user: {
    email: string;
    givenName: string;
    familyName: string;
  };
  tokens: TokenData;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";
  }

  private getAuthHeaders(): Record<string, string> {
    const token = this.getAccessToken();
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private getAccessToken(): string | null {
    if (typeof window === "undefined") return null;

    const authData = localStorage.getItem("auth_tokens");
    if (authData) {
      try {
        const parsed: TokenData = JSON.parse(authData);
        return parsed.access;
      } catch (error) {
        console.error("Failed to parse auth tokens:", error);
        return null;
      }
    }
    return null;
  }

  setTokens(tokens: TokenData): void {
    if (typeof window === "undefined") return;
    console.log(">>> setTokens called in browser:", tokens);
    localStorage.setItem("auth_tokens", JSON.stringify(tokens));
    console.log(">>> localStorage now:", localStorage.getItem("auth_tokens"));
  }

  clearTokens(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("auth_tokens");
    localStorage.removeItem("user_data");
    localStorage.removeItem("active_company");
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const responseData = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage =
        responseData?.error ||
        responseData?.detail ||
        responseData?.message ||
        `HTTP error! status: ${response.status}`;
      console.error("API Error:", {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        data: responseData,
      });
      throw new Error(errorMessage);
    }

    return responseData;
  }

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await fetch(`${this.baseUrl}/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return this.handleResponse<RegisterResponse>(response);
  }

  async getAuthUrl(data: AuthUrlRequest): Promise<AuthUrlResponse> {
    const response = await fetch(`${this.baseUrl}/auth-url/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Include cookies for session management
      body: JSON.stringify(data),
    });
    return this.handleResponse<AuthUrlResponse>(response);
  }

  async getCompanies(): Promise<CompaniesResponse> {
    const response = await fetch(`${this.baseUrl}/companies/`, {
      headers: this.getAuthHeaders(),
      credentials: "include",
    });
    return this.handleResponse<CompaniesResponse>(response);
  }

  async setActiveCompany(
    data: SetActiveCompanyRequest
  ): Promise<SetActiveCompanyResponse> {
    const response = await fetch(`${this.baseUrl}/companies/set-active/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data),
    });
    return this.handleResponse<SetActiveCompanyResponse>(response);
  }

  async handleCallback(data: CallbackRequest): Promise<CallbackResponse> {
    // Try with auth headers first
    let response = await fetch(`${this.baseUrl}/callback/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      credentials: "include", // Include cookies for session management
      body: JSON.stringify(data),
    });

    // If unauthorized, try without auth headers (for cases where token might be expired)
    if (response.status === 401) {
      response = await fetch(`${this.baseUrl}/callback/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Include cookies for session management
        body: JSON.stringify(data),
      });
    }

    return this.handleResponse<CallbackResponse>(response);
  }

  async logout(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/logout/`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        credentials: "include", // Include cookies for session management
      });

      if (!response.ok) {
        console.warn("Logout request failed, but clearing local data anyway");
      }
    } catch (error) {
      console.warn(
        "Logout request failed, but clearing local data anyway:",
        error
      );
    } finally {
      this.clearTokens();
    }
  }

  async disconnectCompany(
    companyId: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await fetch(
      `${this.baseUrl}/companies/${companyId}/disconnect/`,
      {
        method: "POST",
        headers: this.getAuthHeaders(),
        credentials: "include",
      }
    );
    return this.handleResponse<{ success: boolean; message: string }>(response);
  }

  isAuthenticated(): boolean {
    return this.getAccessToken() !== null;
  }
}

export default new ApiService();
export type { User, Company, TokenData, RegisterRequest, AuthUrlRequest, CompaniesResponse };