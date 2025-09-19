'use client';
// src/components/layout/Header.tsx
import React, { useState } from 'react';
import { Bell, LogOut, User, ChevronDown } from 'lucide-react';
import { toast } from '../../lib/toast';
import SearchInput from '../ui/SearchInput';
import CompanySwitcher from '../companies/CompanySwitcher';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';

const Header: React.FC = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const { activeCompany } = useCompany();

  const handleLogout = async () => {
    toast.confirm(
      'Are you sure you want to sign out?',
      async () => {
        toast.loading('Signing out...');
        await logout();
      }
    );
    setShowUserMenu(false);
  };

  const getDisplayName = () => {
    if (user?.first_name || user?.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user?.email?.split('@')[0] || 'User';
  };

  const getInitials = () => {
    if (user?.first_name || user?.last_name) {
      return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <SearchInput placeholder="Search" />
          {activeCompany && (
            <div className="hidden md:flex items-center text-sm text-gray-600">
              <span className="mr-2">Company:</span>
              <span className="font-medium text-gray-900">{activeCompany.name}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <CompanySwitcher />

          <button className="relative p-2 text-gray-600 hover:text-gray-900">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
            >
              <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                {getInitials()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">{getDisplayName()}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                <div className="py-2">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{getDisplayName()}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    {activeCompany && (
                      <p className="text-xs text-gray-500 mt-1">
                        Active: {activeCompany.name}
                      </p>
                    )}
                  </div>

                  <button
                    className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </div>
  );
};

export default Header;