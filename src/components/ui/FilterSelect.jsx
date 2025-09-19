// src/components/ui/FilterSelect.jsx
'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';

const FilterSelect = ({ options, value, onChange, placeholder }) => (
  <div className="relative">
    <select 
      value={value}
      onChange={onChange}
      className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-green-500"
    >
      <option value="All">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
    <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
  </div>
);

export default FilterSelect;