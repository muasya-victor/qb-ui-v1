import React from "react";

const CustomerAlerts = ({ creditNotes, customerStats, totalCreditNotes }) => {
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

  return (
    <>
      {/* Stub Customers Alert */}
      {creditNotesWithStubCustomers > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-orange-600 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-orange-800">
                Stub Customers Detected
              </h3>
              <p className="text-sm text-orange-700 mt-1">
                {creditNotesWithStubCustomers} credit notes are linked to stub
                customers. Click "Fix Customer Links" to enhance them with real
                QuickBooks data.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Missing Customer Links Alert */}
      {creditNotesWithCustomerLinks < totalCreditNotes &&
        totalCreditNotes > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-yellow-600 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Customer Links Missing
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  {totalCreditNotes - creditNotesWithCustomerLinks} credit notes
                  don't have proper customer links. Use "Smart Sync" to
                  automatically resolve customer relationships.
                </p>
              </div>
            </div>
          </div>
        )}
    </>
  );
};

export default CustomerAlerts;
