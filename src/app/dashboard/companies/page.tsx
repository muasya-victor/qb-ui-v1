// src/app/dashboard/credit-notes/page.tsx
"use client";

import React from "react";
import CreditNoteManager from "../../../components/creditnote/CreditNoteManager";
import { useDashboard } from "../layout";
import CompanyDetails from "@/components/companies/CompanyDetails";

const CompanyPage: React.FC = () => {
  const { statusFilter, setStatusFilter } = useDashboard();

  return (
    <CompanyDetails/>
  );
};

export default CompanyPage;
