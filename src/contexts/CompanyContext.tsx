'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from '../lib/toast';
import apiService, { Company } from '../services/apiService';
import { useAuth } from './AuthContext';

interface CompanyContextType {
  companies: Company[];
  activeCompany: Company | null;
  isLoading: boolean;
  refreshCompanies: () => Promise<void>;
  switchCompany: (companyId: string) => Promise<{ success: boolean; message: string }>;
  disconnectCompany: (companyId: string) => Promise<{ success: boolean; message: string }>;
  setActiveCompany: (company: Company | null) => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};

interface CompanyProviderProps {
  children: ReactNode;
}

export const CompanyProvider: React.FC<CompanyProviderProps> = ({ children }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompany, setActiveCompanyState] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

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

        const active = response.companies.find(c => c.is_active) ||
                      response.companies.find(c => c.id === response.active_company_id);

        setActiveCompanyState(active || null);

        if (active) {
          localStorage.setItem('active_company', JSON.stringify(active));
        }
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const switchCompany = async (companyId: string) => {
    try {
      const response = await apiService.setActiveCompany({ company_id: companyId });

      if (response.success) {
        setActiveCompanyState(response.active_company);
        localStorage.setItem('active_company', JSON.stringify(response.active_company));

        setCompanies(prev => prev.map(c => ({
          ...c,
          is_active: c.id === companyId
        })));

        toast.success(`Switched to ${response.active_company.name}`);
        return { success: true, message: response.message };
      }
      const errorMsg = 'Failed to switch company';
      toast.error(errorMsg);
      return { success: false, message: errorMsg };
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to switch company';
      toast.error(errorMsg);
      return { success: false, message: errorMsg };
    }
  };

  const disconnectCompany = async (companyId: string) => {
    try {
      const companyName = companies.find(c => c.id === companyId)?.name || 'Company';
      const response = await apiService.disconnectCompany(companyId);

      if (response.success) {
        await refreshCompanies();
        toast.success(`Disconnected ${companyName} from QuickBooks`);
        return { success: true, message: response.message };
      }
      const errorMsg = 'Failed to disconnect company';
      toast.error(errorMsg);
      return { success: false, message: errorMsg };
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to disconnect company';
      toast.error(errorMsg);
      return { success: false, message: errorMsg };
    }
  };

  const setActiveCompany = (company: Company | null) => {
    setActiveCompanyState(company);
    if (company) {
      localStorage.setItem('active_company', JSON.stringify(company));
    } else {
      localStorage.removeItem('active_company');
    }
  };

  const value: CompanyContextType = {
    companies,
    activeCompany,
    isLoading,
    refreshCompanies,
    switchCompany,
    disconnectCompany,
    setActiveCompany
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};