// src/app/dashboard/layout.tsx
'use client';

import React, { useState, createContext, useContext } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import AuthGuard from '../../components/auth/AuthGuard';

interface DashboardContextType {
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardLayout');
  }
  return context;
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [statusFilter, setStatusFilter] = useState('All');

  return (
    <AuthGuard>
      <DashboardContext.Provider value={{ statusFilter, setStatusFilter }}>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </DashboardContext.Provider>
    </AuthGuard>
  );
};

export default DashboardLayout;