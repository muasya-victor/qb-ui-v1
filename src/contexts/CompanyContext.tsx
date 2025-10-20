"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { toast } from "../lib/toast";
import apiService, { Company } from "../services/apiService";
import { useAuth } from "./AuthContext";

interface CompanyContextType {
  companies: Company[];
  activeCompany: Company | null;
  isLoading: boolean;
  refreshCompanies: () => Promise<void>;
  refreshActiveCompany: () => Promise<void>;
  switchCompany: (
    companyId: string
  ) => Promise<{ success: boolean; message: string }>;
  disconnectCompany: (
    companyId: string
  ) => Promise<{ success: boolean; message: string }>;
  setActiveCompany: (company: Company | null) => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
};

interface CompanyProviderProps {
  children: ReactNode;
}

export const CompanyProvider: React.FC<CompanyProviderProps> = ({
  children,
}) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompany, setActiveCompanyState] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  // Load active company from localStorage on initial load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedActiveCompany = localStorage.getItem("active_company");
      if (savedActiveCompany) {
        try {
          setActiveCompanyState(JSON.parse(savedActiveCompany));
        } catch (error) {
          console.error("Failed to parse saved active company:", error);
          localStorage.removeItem("active_company");
        }
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refreshCompanies();
    } else {
      setIsLoading(false);
      setCompanies([]);
      setActiveCompanyState(null);
    }
  }, [isAuthenticated]);

  const refreshCompanies = async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      const response = await apiService.getCompanies();

      if (response.success) {
        setCompanies(response.companies);

        // Find active company - prioritize API response, then localStorage, then first company
        let active: Company | null = null;

        // First try to find the company marked as active in the API response
        if (response.active_company_id) {
          active =
            response.companies.find(
              (c) => c.id === response.active_company_id
            ) || null;
        }

        // If no active company from API, try to find one marked as active
        if (!active) {
          active = response.companies.find((c) => c.is_active) || null;
        }

        // If still no active company, use the first company or existing active company
        if (!active && response.companies.length > 0) {
          active = response.companies[0];
        }

        setActiveCompanyState(active);

        if (active) {
          localStorage.setItem("active_company", JSON.stringify(active));
        }
      }
    } catch (error) {
      console.error("Failed to fetch companies:", error);
      toast.error("Failed to load companies");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshActiveCompany = async () => {
    if (!activeCompany?.id || !isAuthenticated) return;

    try {
      // Refresh the companies list which will update the active company
      await refreshCompanies();

      // Alternatively, you could fetch the specific company details if needed:
      // const companyResponse = await apiService.getCompany(activeCompany.id);
      // if (companyResponse.success) {
      //   setActiveCompanyState(companyResponse.company);
      //   localStorage.setItem('active_company', JSON.stringify(companyResponse.company));
      // }
    } catch (error) {
      console.error("Failed to refresh active company:", error);
      toast.error("Failed to refresh company details");
    }
  };

  const switchCompany = async (companyId: string) => {
    try {
      const response = await apiService.setActiveCompany({
        company_id: companyId,
      });

      if (response.success) {
        const newActiveCompany = response.active_company;
        setActiveCompanyState(newActiveCompany);
        localStorage.setItem(
          "active_company",
          JSON.stringify(newActiveCompany)
        );

        // Update companies list to reflect active status
        setCompanies((prev) =>
          prev.map((c) => ({
            ...c,
            is_active: c.id === companyId,
          }))
        );

        toast.success(`Switched to ${newActiveCompany.name}`);
        return { success: true, message: response.message };
      }

      const errorMsg = response.message || "Failed to switch company";
      toast.error(errorMsg);
      return { success: false, message: errorMsg };
    } catch (error: any) {
      const errorMsg = error.message || "Failed to switch company";
      toast.error(errorMsg);
      return { success: false, message: errorMsg };
    }
  };

  const disconnectCompany = async (companyId: string) => {
    try {
      const companyName =
        companies.find((c) => c.id === companyId)?.name || "Company";
      const response = await apiService.disconnectCompany(companyId);

      if (response.success) {
        await refreshCompanies();

        // If the disconnected company was the active one, clear it
        if (activeCompany?.id === companyId) {
          setActiveCompanyState(null);
          localStorage.removeItem("active_company");
        }

        toast.success(`Disconnected ${companyName} from QuickBooks`);
        return { success: true, message: response.message };
      }

      const errorMsg = response.message || "Failed to disconnect company";
      toast.error(errorMsg);
      return { success: false, message: errorMsg };
    } catch (error: any) {
      const errorMsg = error.message || "Failed to disconnect company";
      toast.error(errorMsg);
      return { success: false, message: errorMsg };
    }
  };

  const setActiveCompany = (company: Company | null) => {
    setActiveCompanyState(company);
    if (company) {
      localStorage.setItem("active_company", JSON.stringify(company));

      // Update companies list to reflect active status
      setCompanies((prev) =>
        prev.map((c) => ({
          ...c,
          is_active: c.id === company.id,
        }))
      );
    } else {
      localStorage.removeItem("active_company");
    }
  };

  const value: CompanyContextType = {
    companies,
    activeCompany,
    isLoading,
    refreshCompanies,
    refreshActiveCompany,
    switchCompany,
    disconnectCompany,
    setActiveCompany,
  };

  return (
    <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
  );
};
