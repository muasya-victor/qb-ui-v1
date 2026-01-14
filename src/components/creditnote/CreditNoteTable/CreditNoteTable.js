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

  const fetchAvailableInvoices = useCallback(
    async (
      searchTerm = "",
      customerName = "",
      forceAll = false,
      page = 1,
      isLoadMore = false
    ) => {
      try {
        if (isLoadMore) {
          setIsLoadingMore(true);
        } else {
          setLoadingInvoices(true);
        }

        const response = await creditNoteService.getAvailableInvoices(
          searchTerm, // Pass search term to backend - search by doc_number
          forceAll ? "" : customerName, // customer name
          invoicePagination.page_size,
          page,
          undefined // min_balance
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
    console.log(
      "Dropdown opened for credit note:",
      creditNote,
      "Search term:",
      searchTerm
    );

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

    // Fetch with customer filter if available, and search term
    const customerName = creditNote.customer_name || "";
    fetchAvailableInvoices(
      searchTerm,
      customerName,
      customerName === "",
      1,
      false
    );
  };

  const loadMoreInvoices = useCallback(() => {
    if (!invoicePagination.next || isLoadingMore || loadingInvoices) return;
    const nextPage = invoicePagination.page + 1;
    fetchAvailableInvoices("", true, nextPage, true);
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
    fetchAvailableInvoices("", true, 1, false);
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
                    // onDropdownOpen={fetchAvailableInvoices}
                    onDropdownScroll={handleDropdownScroll}
                    onDropdownOpen={handleDropdownOpen}
                    onInvoiceChange={() => {}} 
                    onValidateClick={handleValidateClick}
                    onValidateCreditLinkage={handleValidateCreditLinkage}
                    onViewCreditNote={onViewCreditNote}
                    onViewSubmissionDetails={handleViewSubmissionDetails}
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
