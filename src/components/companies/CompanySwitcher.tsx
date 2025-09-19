'use client';

import { useState } from 'react';
import { ChevronDown, Building, AlertCircle, Plus } from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';

interface CompanySwitcherProps {
  onDisconnectCompany?: (companyId: string) => void;
}

export default function CompanySwitcher({ onDisconnectCompany }: CompanySwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { companies, activeCompany, switchCompany, disconnectCompany } = useCompany();

  const handleSwitchCompany = async (companyId: string) => {
    if (companyId === activeCompany?.id) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const result = await switchCompany(companyId);
      if (result.success) {
        setMessage(result.message);
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage(result.message);
      }
    } catch (error) {
      setMessage('Failed to switch company');
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  const handleDisconnectCompany = async (companyId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (!confirm('Are you sure you want to disconnect this company? You will need to reconnect to access its data.')) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await disconnectCompany(companyId);
      if (result.success) {
        setMessage(result.message);
        setTimeout(() => setMessage(null), 3000);
        onDisconnectCompany?.(companyId);
      } else {
        setMessage(result.message);
      }
    } catch (error) {
      setMessage('Failed to disconnect company');
    } finally {
      setIsLoading(false);
    }
  };

  const connectedCompanies = companies.filter(c => c.is_connected);
  const disconnectedCompanies = companies.filter(c => !c.is_connected);

  return (
    <div className="relative">
      {message && (
        <div className="absolute top-0 right-0 transform translate-y-[-110%] z-50">
          <div className={`px-3 py-2 rounded-md text-sm ${
            message.includes('success') || message.includes('set to')
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        </div>
      )}

      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
        >
          <Building className="w-4 h-4" />
          <span className="max-w-32 truncate">
            {activeCompany ? activeCompany.name : 'Select Company'}
          </span>
          <ChevronDown className="w-4 h-4" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50">
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                Connected Companies
              </div>

              {connectedCompanies.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 italic">
                  No connected companies
                </div>
              ) : (
                connectedCompanies.map((company) => (
                  <div
                    key={company.id}
                    className={`group flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                      company.id === activeCompany?.id ? 'bg-teal-50 border-l-4 border-teal-500' : ''
                    }`}
                    onClick={() => handleSwitchCompany(company.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {company.name}
                        </span>
                        {company.id === activeCompany?.id && (
                          <span className="px-2 py-1 text-xs bg-teal-100 text-teal-800 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        Role: {company.role} • ID: {company.realm_id}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDisconnectCompany(company.id, e)}
                      className="opacity-0 group-hover:opacity-100 ml-2 p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-all"
                      title="Disconnect company"
                    >
                      <AlertCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}

              {disconnectedCompanies.length > 0 && (
                <>
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100 border-t border-gray-100 mt-2">
                    Disconnected Companies
                  </div>
                  {disconnectedCompanies.map((company) => (
                    <div
                      key={company.id}
                      className="flex items-center justify-between px-4 py-3 bg-gray-50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-500 truncate">
                            {company.name}
                          </span>
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                            Disconnected
                          </span>
                        </div>
                        <div className="text-xs text-gray-400">
                          Role: {company.role} • ID: {company.realm_id}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              <div className="border-t border-gray-100 mt-2">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    window.location.href = '/';
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-3 text-sm text-teal-600 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Connect New Company</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}