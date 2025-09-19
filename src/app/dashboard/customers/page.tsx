'use client';
// src/app/dashboard/customers/page.tsx
import React from 'react';
import SearchInput from '../../../components/ui/SearchInput';
import FilterSelect from '../../../components/ui/FilterSelect';
import CustomerTable from '../../../components/customers/CustomerTable';
import customersData  from '../../../data/customers';

const CustomersPage: React.FC = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-6">Customers</h1>
    
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <SearchInput placeholder="Search customers" />
          <div className="flex items-center space-x-3">
            <FilterSelect 
              options={['Active', 'Inactive']}
              value="All"
              onChange={() => {}}
              placeholder="Status"
            />
            <FilterSelect 
              options={['Recent', 'Oldest']}
              value="All"
              onChange={() => {}}
              placeholder="Date"
            />
          </div>
        </div>
      </div>
      <CustomerTable customers={customersData} />
    </div>
  </div>
);

export default CustomersPage;