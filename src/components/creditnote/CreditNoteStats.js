import React from "react";
import StatsCard from "../ui/StatsCard";

const CreditNoteStats = ({ creditNotes, customerStats, pagination }) => {
  const totalCreditNotes = pagination?.count || 0;
  const appliedCreditNotes = creditNotes.filter(
    (cn) =>
      cn.status === "applied" || parseFloat(cn.balance?.toString() || "0") === 0
  ).length;

  const creditNotesWithCustomerLinks =
    customerStats?.credit_notes_with_customers ||
    creditNotes.filter(
      (cn) => cn.customer_name && cn.customer_name !== "Unknown Customer"
    ).length;

  const creditNotesWithStubCustomers =
    customerStats?.credit_notes_with_stub_customers ||
    creditNotes.filter(
      (cn) => cn.customer_name && cn.customer_name.includes("Customer")
    ).length;

  const customerLinkQuality =
    customerStats?.customer_link_quality ||
    (totalCreditNotes > 0
      ? (creditNotesWithCustomerLinks / totalCreditNotes) * 100
      : 0);

  const appliedPercentage =
    totalCreditNotes > 0
      ? Math.round((appliedCreditNotes / totalCreditNotes) * 100)
      : 0;
  const stubPercentage =
    totalCreditNotes > 0
      ? Math.round((creditNotesWithStubCustomers / totalCreditNotes) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <StatsCard
        title="Total Credit Notes"
        value={totalCreditNotes}
        icon="📄"
        trend={pagination ? `${pagination.total_pages} pages` : undefined}
      />
      <StatsCard
        title="Customer Links"
        value={`${creditNotesWithCustomerLinks}/${totalCreditNotes}`}
        color={
          customerLinkQuality > 80
            ? "green"
            : customerLinkQuality > 50
            ? "yellow"
            : "red"
        }
        icon="🔗"
        trend={`${Math.round(customerLinkQuality)}%`}
      />
      <StatsCard
        title="Applied Credits"
        value={appliedCreditNotes}
        color="green"
        icon="✅"
        trend={`${appliedPercentage}%`}
      />
      <StatsCard
        title="Stub Customers"
        value={creditNotesWithStubCustomers}
        color="orange"
        icon="🔄"
        trend={`${stubPercentage}%`}
      />
    </div>
  );
};

export default CreditNoteStats;
