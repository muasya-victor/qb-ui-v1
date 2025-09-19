// src/app/dashboard/invoices/page.tsx
'use client';

import React from 'react';
import InvoiceManager from '../../../components/invoices/InvoiceManager';
import { useDashboard } from '../layout';

const InvoicesPage: React.FC = () => {
  const { statusFilter, setStatusFilter } = useDashboard();
  
  return <InvoiceManager statusFilter={statusFilter} setStatusFilter={setStatusFilter} />;
};

export default InvoicesPage;