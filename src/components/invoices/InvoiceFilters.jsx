'use client';
// src/components/invoices/InvoiceFilters.jsx
import React from 'react';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

const InvoiceFilters = ({
  statusFilter,
  setStatusFilter,
  searchTerm,
  setSearchTerm,
  onSearch
}) => {

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  const statusOptions = [
    { value: 'All', label: 'All Invoices', count: null },
    { value: 'Paid', label: 'Paid', count: null },
    { value: 'Unpaid', label: 'Unpaid', count: null }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Search */}
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search invoices by number or customer name..."
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Search Button */}
        <button
          onClick={onSearch}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
          Search
        </button>
      </div>

      {/* Status Filter Pills */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <FunnelIcon className="h-4 w-4" />
          <span className="font-medium">Filter by status:</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                statusFilter === option.value
                  ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-500 ring-opacity-50'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
              {statusFilter === option.value && (
                <span className="ml-1.5 w-2 h-2 bg-blue-500 rounded-full"></span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Active Filters Display */}
      {(searchTerm || statusFilter !== 'All') && (
        <div className="flex items-center space-x-3 pt-2 border-t border-gray-200">
          <span className="text-sm text-gray-600 font-medium">Active filters:</span>
          <div className="flex flex-wrap gap-2">
            {searchTerm && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Search: "{searchTerm}"
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    onSearch();
                  }}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-400 hover:bg-green-200 hover:text-green-600 focus:outline-none"
                >
                  ×
                </button>
              </span>
            )}
            {statusFilter !== 'All' && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Status: {statusFilter}
                <button
                  type="button"
                  onClick={() => setStatusFilter('All')}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600 focus:outline-none"
                >
                  ×
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
                onSearch();
              }}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceFilters;