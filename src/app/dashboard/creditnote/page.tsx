// src/app/dashboard/credit-notes/page.tsx
"use client";

import React from "react";
import CreditNoteManager from "../../../components/creditnote/CreditNoteManager";
import { useDashboard } from "../layout";

const CreditNotesPage: React.FC = () => {
  const { statusFilter, setStatusFilter } = useDashboard();

  return (
    <CreditNoteManager
      statusFilter={statusFilter}
      setStatusFilter={setStatusFilter}
    />
  );
};

export default CreditNotesPage;
