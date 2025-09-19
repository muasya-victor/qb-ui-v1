'use client';
// src/components/ui/StatusBadge.jsx
import React from 'react';

const StatusBadge = ({ status }) => (
  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
    status === 'Validated' || status === 'Active'
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800'
  }`}>
    {status}
  </span>
);

export default StatusBadge;