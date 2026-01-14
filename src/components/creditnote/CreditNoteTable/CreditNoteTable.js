"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import CreditNoteTableHeader from "./CreditNoteTableHeader";
import CreditNoteTableRow from "./CreditNoteTableRow";
import TableLoadingSkeleton from "./TableLoadingSkeleton";
import TableEmptyState from "./TableEmptyState";
import TableSummary from "./TableSummary";
import ValidationModal from "../../kra/ValidationModal";
import SubmissionDetailsModal from "../../invoices/SubmissionDetailsModal";
import CreditValidationModal from "../CreditValidationModal";
import creditNoteService from "@/services/CreditNoteService";
import { toast } from "../../../lib/toast";

const CreditNoteTable = ({
  creditNotes,
  companyInfo,
  loading,
  sortBy,
  sortOrder,
  onSort,
  onViewCreditNote,
  onValidationComplete,
  onInvoiceLinkUpdate,
}) => {
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [creditValidationModalOpen, setCreditValidationModalOpen] =
    useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedCreditNote, setSelectedCreditNote] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [availableInvoices, setAvailableInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [invoicePagination, setInvoicePagination] = useState({
    page: 1,
    page_size: 20,
    count: 0,
    next: null,
    previous: null,
    total_pages: 1,
  });
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [invoiceCreditSummaries, setInvoiceCreditSummaries] = useState({});
  const [linkedInvoicesCache, setLinkedInvoicesCache] = useState({});
  const [updatingInvoice, setUpdatingInvoice] = useState(null);

  // Add handleInvoiceChange function
  const handleInvoiceChange = useCallback(
    async (creditNoteId, invoiceId) => {
      try {
        console.log("🔄 Starting invoice change:", { creditNoteId, invoiceId });
        setUpdatingInvoice(creditNoteId);

        // If selecting "none", remove the invoice link
        if (invoiceId === "none") {
          console.log("🗑️ Removing invoice link...");
          const result = await creditNoteService.updateRelatedInvoice(
            creditNoteId,
            null
          );

          console.log("✅ Remove result:", result);

          if (result.success) {
            toast.success("Invoice link removed successfully");
            if (onInvoiceLinkUpdate) {
              onInvoiceLinkUpdate();
            }
          } else {
            console.error("❌ Remove failed:", result.error);
            toast.error(`Failed to remove invoice link: ${result.error}`);
          }
          return;
        }

        // Validate before linking
        console.log("✅ Validating credit linkage...");
        const creditNote = creditNotes.find((cn) => cn.id === creditNoteId);
        if (!creditNote) {
          throw new Error("Credit note not found");
        }

        const validation = await creditNoteService.validateCreditLinkage(
          invoiceId,
          creditNote.total_amt
        );
        console.log("📊 Validation result:", validation);

        if (validation.success && validation.validation.valid) {
          // Proceed with linking
          console.log("🔗 Linking invoice...");
          const result = await creditNoteService.updateRelatedInvoice(
            creditNoteId,
            invoiceId
          );

          console.log("✅ Link result:", result);

          if (result.success) {
            toast.success("Invoice linked successfully");
            if (onInvoiceLinkUpdate) {
              onInvoiceLinkUpdate();
            }

            // Refresh the invoice credit summary
            const summary = await fetchInvoiceCreditSummary(invoiceId);
            if (summary) {
              setInvoiceCreditSummaries((prev) => ({
                ...prev,
                [invoiceId]: summary,
              }));
            }

            // Update the linked invoice in cache
            if (creditNote) {
              const invoice = availableInvoices.find(
                (inv) => inv.id === invoiceId
              );
              if (invoice) {
                setLinkedInvoicesCache((prev) => ({
                  ...prev,
                  [invoiceId]: invoice,
                }));
              }
            }
          } else {
            console.error("❌ Link failed:", result.error);
            toast.error(`Failed to link invoice: ${result.error}`);
          }
        } else {
          console.error("❌ Validation failed:", validation);
          toast.error(
            `Cannot link: ${
              validation.validation.error || validation.validation.message
            }`
          );
        }
      } catch (error) {
        console.error("💥 Error in handleInvoiceChange:", error);
        toast.error(
          `Failed to link invoice: ${error.message || "Please try again"}`
        );
      } finally {
        setUpdatingInvoice(null);
      }
    },
    [creditNotes, availableInvoices, onInvoiceLinkUpdate]
  );

  const fetchAvailableInvoices = useCallback(
    async (
      searchTerm = "",
      customerName = "",
      forceAll = false,
      page = 1,
      isLoadMore = false
    ) => {
      console.log("📞 fetchAvailableInvoices called with:", {
        searchTerm,
        customerName,
        forceAll,
        page,
        isLoadMore,
      });

      try {
        if (isLoadMore) {
          setIsLoadingMore(true);
        } else {
          setLoadingInvoices(true);
        }

        const response = await creditNoteService.getAvailableInvoices(
          searchTerm,
          forceAll ? "" : customerName,
          invoicePagination.page_size,
          page,
          undefined
        );

        if (response.success) {
          const newInvoices = response.invoices || [];
          if (isLoadMore) {
            setAvailableInvoices((prev) => [...prev, ...newInvoices]);
          } else {
            setAvailableInvoices(newInvoices);
          }

          if (response.pagination) {
            setInvoicePagination(response.pagination);
          }

          const cache = {};
          creditNotes.forEach((creditNote) => {
            if (creditNote.related_invoice?.id) {
              cache[creditNote.related_invoice.id] = creditNote.related_invoice;
            }
          });
          setLinkedInvoicesCache(cache);
        }
      } catch (error) {
        console.error("Error fetching available invoices:", error);
        toast.error("Failed to load available invoices");
      } finally {
        setLoadingInvoices(false);
        setIsLoadingMore(false);
      }
    },
    [creditNotes, invoicePagination.page_size]
  );

  const handleDropdownOpen = (creditNote, searchTerm = "") => {
    console.log("📖 Dropdown opened for:", {
      creditNoteId: creditNote.id,
      customerName: creditNote.customer_name,
      searchTerm,
    });

    // Reset invoices list if not loading more
    if (!isLoadingMore) {
      setAvailableInvoices([]);
      setInvoicePagination({
        page: 1,
        page_size: 20,
        count: 0,
        next: null,
        previous: null,
        total_pages: 1,
      });
    }

    // Get customer name
    const customerName = creditNote.customer_name || "";

    // Determine if we should show all invoices
    // forceAll = true if no customer name, false if we have customer name
    const forceAll = customerName === "" || !customerName;

    console.log("📤 Fetching with:", {
      searchTerm,
      customerName,
      forceAll,
      page: 1,
    });

    // CORRECT parameter order
    fetchAvailableInvoices(
      searchTerm, // 1st: search term
      customerName, // 2nd: customer name
      forceAll, // 3rd: forceAll (boolean)
      1, // 4th: page (NUMBER 1)
      false // 5th: isLoadMore
    );
  };

  const loadMoreInvoices = useCallback(() => {
    if (!invoicePagination.next || isLoadingMore || loadingInvoices) return;

    const nextPage = invoicePagination.page + 1;

    console.log("📥 Loading more invoices, page:", nextPage);

    fetchAvailableInvoices(
      "", // 1st: search term
      "", // 2nd: customer name
      true, // 3rd: forceAll (true for load more)
      nextPage, // 4th: page
      true // 5th: isLoadMore
    );
  }, [
    invoicePagination,
    isLoadingMore,
    loadingInvoices,
    fetchAvailableInvoices,
  ]);

  const handleDropdownScroll = useCallback(
    (event) => {
      const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        loadMoreInvoices();
      }
    },
    [loadMoreInvoices]
  );

  const fetchInvoiceCreditSummary = useCallback(async (invoiceId) => {
    if (!invoiceId) return null;
    try {
      const response = await creditNoteService.getInvoiceCreditSummary(
        invoiceId
      );
      return response.success ? response.summary : null;
    } catch (error) {
      console.error("Error fetching invoice credit summary:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    console.log("Initial load - fetching all invoices");
    fetchAvailableInvoices(
      "", // 1st: search term
      "", // 2nd: customer name
      true, // 3rd: forceAll (true to get all invoices initially)
      1, // 4th: page (NUMBER 1)
      false // 5th: isLoadMore
    );
  }, [fetchAvailableInvoices]);

  useEffect(() => {
    const loadCreditSummaries = async () => {
      const summaries = {};
      for (const creditNote of creditNotes) {
        if (creditNote.related_invoice?.id) {
          const summary = await fetchInvoiceCreditSummary(
            creditNote.related_invoice.id
          );
          if (summary) summaries[creditNote.related_invoice.id] = summary;
        }
      }
      setInvoiceCreditSummaries(summaries);
    };

    if (creditNotes.length > 0) {
      loadCreditSummaries();
    }
  }, [creditNotes, fetchInvoiceCreditSummary]);

  const handleValidateClick = (creditNote) => {
    setSelectedCreditNote(creditNote);
    setValidationModalOpen(true);
  };

  const handleValidateCreditLinkage = (creditNote) => {
    setSelectedCreditNote(creditNote);
    setCreditValidationModalOpen(true);
  };

  const handleViewSubmissionDetails = (creditNote) => {
    setSelectedCreditNote(creditNote);
    setSelectedSubmission(creditNote.kra_submission);
    setDetailsModalOpen(true);
  };

  const handleValidation = async (creditNoteId) => {
    try {
      const result = await creditNoteService.validateCreditNoteToKRA(
        creditNoteId
      );

      if (onValidationComplete) {
        onValidationComplete();
      }

      return result;
    } catch (error) {
      throw error;
    }
  };

  const handleValidationSuccess = () => {
    setValidationModalOpen(false);
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  if (loading) {
    return <TableLoadingSkeleton />;
  }

  return (
    <>
      <div className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <CreditNoteTableHeader
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={onSort}
            />
            <tbody className="bg-white divide-y divide-gray-100">
              {creditNotes.length === 0 ? (
                <TableEmptyState colSpan={11} />
              ) : (
                creditNotes.map((creditNote, index) => (
                  <CreditNoteTableRow
                    key={creditNote.id}
                    creditNote={creditNote}
                    index={index}
                    companyInfo={companyInfo}
                    availableInvoices={availableInvoices}
                    loadingInvoices={loadingInvoices}
                    isLoadingMore={isLoadingMore}
                    invoicePagination={invoicePagination}
                    invoiceCreditSummaries={invoiceCreditSummaries}
                    linkedInvoicesCache={linkedInvoicesCache}
                    updatingInvoice={updatingInvoice}
                    onDropdownScroll={handleDropdownScroll}
                    onDropdownOpen={handleDropdownOpen}
                    onInvoiceChange={handleInvoiceChange}
                    onValidateClick={handleValidateClick}
                    onValidateCreditLinkage={handleValidateCreditLinkage}
                    onViewCreditNote={onViewCreditNote}
                    onViewSubmissionDetails={handleViewSubmissionDetails}
                    onInvoiceLinkUpdate={onInvoiceLinkUpdate}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {creditNotes.length > 0 && (
          <TableSummary
            creditNotes={creditNotes}
            companyInfo={companyInfo}
            invoiceCreditSummaries={invoiceCreditSummaries}
          />
        )}
      </div>

      {/* Modals */}
      <ValidationModal
        isOpen={validationModalOpen}
        onClose={() => setValidationModalOpen(false)}
        creditNote={selectedCreditNote}
        onValidate={handleValidation}
        onValidationSuccess={handleValidationSuccess}
        type="credit_note"
      />

      {selectedCreditNote && (
        <CreditValidationModal
          isOpen={creditValidationModalOpen}
          onClose={() => setCreditValidationModalOpen(false)}
          creditNote={selectedCreditNote}
          availableInvoices={availableInvoices}
          companyInfo={companyInfo}
        />
      )}

      <SubmissionDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        creditNote={selectedCreditNote}
        submission={selectedSubmission}
      />
    </>
  );
};

export default CreditNoteTable;
