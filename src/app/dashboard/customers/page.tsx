// In your main app component or page
"use client";
import React, { useState } from "react";
import CustomerManager from "../../../components/customers/CustomerManager";

export default function CustomersPage() {
  const [statusFilter, setStatusFilter] = useState("All");

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerManager
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />
    </div>
  );
}
