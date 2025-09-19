"use client"
// src/components/ui/SearchInput.jsx
import React from 'react';
import { Search } from 'lucide-react';

const SearchInput = ({ placeholder, className = '' }) => (
  <div className={`relative ${className}`}>
    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
    <input
      type="text"
      placeholder={placeholder}
      className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-full"
    />
  </div>
);

export default SearchInput;