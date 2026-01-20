"use client";

import React, { useEffect, useState, forwardRef } from "react";
import { Calendar, Phone, Mail, Globe, FileText, Download } from "lucide-react";
import QRCode from "react-qr-code";
import companyService from "../../services/companyService";
import pdfService from "../../services/pdfService";

export interface CreditNoteLineItem {
  id: string;
  line_num: number;
  item_name: string;
  description: string;
  qty: number;
  unit_price: number;
  amount: number;
  tax_code_ref?: string;
  tax_amount?: number;
  tax_rate?: number;
  hs_code?: string;
  weight_lbs?: number;
  material_description?: string;
}

export interface CompanyInfo {
  name: string;
  qb_company_name: string;
  qb_legal_name: string;
  currency_code: string;
  logo_url?: string;
  custom_logo?: string;
  credit_note_logo_enabled: boolean;
  brand_color: string;
  credit_note_footer_text?: string;
  formatted_address?: string;
  contact_info?: {
    email?: string;
    phone?: string;
    website?: string;
  };
}

export interface KRASubmission {
  id: string;
  kra_credit_note_number: number;
  trd_credit_note_no: string;
  status: string;
  qr_code_data?: string;
  receipt_signature?: string;
  created_at: string;
  updated_at: string;
}

export interface CreditNote {
  id: string;
  qb_credit_id: string;
  doc_number: string;
  txn_date: string;
  customer_name: string;
  total_amt: number;
  balance: number;
  subtotal?: number;
  tax_total?: number;
  tax_percent?: number;
  shipping_total?: number;
  private_note?: string;
  customer_memo?: string;
  currency_code: string;
  status: "applied" | "pending" | "void";
  line_items: CreditNoteLineItem[];
  related_invoice_ref?: string;
  exporter_info?: string;
  consignee_info?: string;
  country_of_export?: string;
  reason_for_export?: string;
  country_of_destination?: string;
  kra_submission?: KRASubmission;
}

interface CreditNoteDisplayProps {
  creditNote: CreditNote;
  companyInfo: CompanyInfo;
  onDownload?: () => void;
  onShare?: () => void;
  className?: string;
}

const CreditNoteDisplay = forwardRef<HTMLDivElement, CreditNoteDisplayProps>(
  ({ creditNote, companyInfo, onDownload, onShare, className = "" }, ref) => {
    const [activeCompany, setActiveCompany] = useState(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownloadPDF = async () => {
      setIsDownloading(true);
      try {
        const result = await pdfService.downloadCreditNotePDF(creditNote?.id);
        if (!result.success) {
          alert(`Failed to download PDF: ${result.error}`);
        }
      } catch (error) {
        alert("Error downloading PDF");
      } finally {
        setIsDownloading(false);
      }
    };

    const formatCurrency = (amount: number, currency_code: string) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency_code || "KES",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    useEffect(() => {
      const fetchData = async () => {
        console.log("getting active comp");

        try {
          const activeCompany = await companyService.getCurrentActiveCompany();
          console.log("Active company:", activeCompany);
          setActiveCompany(activeCompany);
        } catch (error) {
          console.error("Error fetching active company:", error);
        }
      };

      fetchData();
    }, []);

    const formatDate = (dateString: string) => {
      if (!dateString) return "N/A";
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "Invalid Date";

        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      } catch (error) {
        return "Invalid Date";
      }
    };

    const handleOpenReceipt = () => {
      if (creditNote.kra_submission?.qr_code_data) {
        window.open(
          creditNote.kra_submission.qr_code_data,
          "_blank",
          "noopener,noreferrer"
        );
      }
    };

    return (
      <div
        ref={ref}
        className={`max-w-4xl mx-auto bg-white shadow-lg border border-gray-300 py-4 ${className}`}
      >
        <button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className={`border-gray-300 w-fit h-fit py-2 px-4 rounded flex items-center gap-2 cursor-pointer ${
            activeCompany ? "!text-white" : "text-gray-800"
          }`}
          style={{
            backgroundColor: activeCompany
              ? activeCompany?.brand_color
              : "#f3f4f6",
          }}
        >
          <Download className="h-4 w-4" />
          {isDownloading ? "Downloading..." : "Download PDF"}
        </button>

        {/* Header Section */}
        <div className="border-gray-300 p-8 flex flex-col gap-4">
          <div className="flex gap-4">
            {companyInfo.custom_logo && companyInfo.credit_note_logo_enabled ? (
              <div className="">
                <img
                  src={companyInfo.custom_logo}
                  alt={`${companyInfo.name} logo`}
                  className="h-16 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            ) : (
              <div className="">
                <div
                  className="h-24 w-36 bg-center bg-cover rounded"
                  style={{
                    backgroundImage: `url(${activeCompany?.custom_logo})`,
                  }}
                />
              </div>
            )}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {companyInfo.qb_company_name || companyInfo.name}
              </h1>
              {companyInfo.formatted_address && (
                <p className="text-gray-700 text-sm">
                  {companyInfo.formatted_address}
                </p>
              )}
              <div className="space-y-1 text-sm text-gray-600">
                {companyInfo.contact_info?.phone && (
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    <span>{companyInfo.contact_info.phone}</span>
                  </div>
                )}
                {companyInfo.contact_info?.email && (
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    <span>{companyInfo.contact_info.email}</span>
                  </div>
                )}
                {companyInfo.contact_info?.website && (
                  <div className="flex items-center">
                    <Globe className="w-4 h-4 mr-2" />
                    <span>{companyInfo.contact_info.website}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-end text-black flex-1">
            {/* Company Logo and Info - Left aligned */}
            <div className="flex-1">
              <div className="flex flex-col gap-2 mt-2">
                <h2 className="font-semibold">BILL TO</h2>
                <div>{creditNote?.customer_name}</div>
              </div>

              <div
                className={`border-gray-300 w-full h-2 mt-2 ${
                  activeCompany ? "!text-white" : "text-gray-800"
                }`}
                style={{
                  backgroundColor: activeCompany
                    ? activeCompany?.brand_color
                    : "#f3f4f6",
                }}
              />
            </div>

            <div className="flex-1">
              <div className="flex flex-col gap-2 mt-2">
                <h2 className="font-semibold">SHIP TO</h2>
                <div>
                  {creditNote?.raw_data?.ShipFromAddr?.Line1 ||
                    creditNote?.raw_data?.ShipFromAddr?.Line2}
                </div>
              </div>

              <div
                className={`border-gray-300 w-full h-2 mt-2 ${
                  activeCompany ? "!text-white" : "text-gray-800"
                }`}
                style={{
                  backgroundColor: activeCompany
                    ? activeCompany?.brand_color
                    : "#f3f4f6",
                }}
              />
            </div>

            {/* Credit Note Header - Right aligned */}
            <div className="text-right flex flex-col items-end justify-between gap-4 !h-[100%] flex-1">
              <h2
                className={`border-gray-300 flex items-center gap-2 p-2 w-fit ${
                  activeCompany ? "!text-white" : "text-gray-800"
                }`}
                style={{
                  backgroundColor: activeCompany
                    ? activeCompany?.brand_color
                    : "#f3f4f6",
                }}
              >
                COMMERCIAL CREDIT NOTE{" "}
                {creditNote.doc_number || creditNote.qb_credit_id || "N/A"}
              </h2>

              <div
                className={`border-gray-300 flex items-center gap-2 p-2 w-fit ${
                  activeCompany ? "!text-white" : "text-gray-800"
                }`}
                style={{
                  backgroundColor: activeCompany
                    ? activeCompany?.brand_color
                    : "#f3f4f6",
                }}
              >
                <Calendar className="w-4 h-4 text-white" />
                <span className="">Date:</span>
                <span>{formatDate(creditNote.txn_date)}</span>
              </div>

              {creditNote.related_invoice_ref && (
                <div
                  className={`border-gray-300 flex items-center gap-2 p-2 w-fit ${
                    activeCompany ? "!text-white" : "text-gray-800"
                  }`}
                  style={{
                    backgroundColor: activeCompany
                      ? activeCompany?.brand_color
                      : "#f3f4f6",
                  }}
                >
                  <FileText className="w-4 h-4 text-white" />
                  <span className="">Original Invoice:</span>
                  <span>{creditNote.related_invoice_ref}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="p-8">
          <div className="overflow-hidden border border-gray-300 text-black">
            <table className="w-full">
              <thead>
                <tr
                  className={`border-gray-300 ${
                    activeCompany ? "!text-white" : "text-gray-800"
                  }`}
                  style={{
                    backgroundColor: activeCompany
                      ? activeCompany?.brand_color
                      : "#f3f4f6",
                  }}
                >
                  <th className="inherit text-inherit px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider border-gray-300">
                    #Item No
                  </th>
                  <th className="inherit text-inherit px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider border-gray-300">
                    Description
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold uppercase tracking-wider border-gray-300 w-24">
                    Tax
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold uppercase tracking-wider border-gray-300 w-20">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold uppercase tracking-wider border-gray-300 w-32">
                    Unit Price
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold uppercase tracking-wider w-32">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {creditNote.line_items.map((item, index) => (
                  <tr
                    key={item.id}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-4 py-3 border-gray-300">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {index + 1}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-gray-300">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {item.item_name}
                        </p>
                        <p className="text-gray-600 text-xs mt-1">
                          {item.material_description ||
                            item.description ||
                            "Product description"}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center border-gray-300 text-sm text-gray-900">
                      {item.tax_amount || "0"}
                    </td>
                    <td className="px-4 py-3 text-center border-gray-300 text-sm text-gray-900">
                      {item.qty}
                    </td>
                    <td className="px-4 py-3 text-center border-gray-300 text-sm text-gray-900">
                      {formatCurrency(
                        item.unit_price,
                        creditNote.currency_code,
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                      {formatCurrency(item.amount, creditNote.currency_code)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end pt-4">
            <div className="w-80">
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">SUBTOTAL:</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(
                      creditNote.subtotal || creditNote.total_amt,
                      creditNote.currency_code,
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-700">TOTAL TAX:</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(
                      creditNote?.tax_total || 0,
                      creditNote.currency_code,
                    )}
                  </span>
                </div>

                {creditNote.shipping_total && creditNote.shipping_total > 0 && (
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-700">Shipping:</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(
                        creditNote.shipping_total,
                        creditNote.currency_code,
                      )}
                    </span>
                  </div>
                )}

                <div className="flex justify-between py-3 border-t-2 border-gray-400">
                  <span className="text-lg font-semibold text-gray-900">
                    Credit Amount:
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(
                      creditNote.total_amt,
                      creditNote.currency_code,
                    )}
                  </span>
                </div>

                {creditNote.balance > 0 && (
                  <div
                    className={`border-gray-300 flex justify-between py-2 px-4 ${
                      activeCompany ? "!text-white" : "text-gray-800"
                    }`}
                    style={{
                      backgroundColor: activeCompany
                        ? activeCompany?.brand_color
                        : "#f3f4f6",
                    }}
                  >
                    <span className="text-lg font-semibold">
                      Available Credit:
                    </span>
                    <span className="text-lg font-bold">
                      {formatCurrency(
                        creditNote.balance,
                        creditNote.currency_code,
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tax Summary Section - Exactly like Invoice */}
          <div className="text-black flex flex-col gap-4 w-full py-4">
            <h2 className="font-semibold text-2xl text-gray-500">
              TAX SUMMARY
            </h2>

            <div className="flex flex-col gap-4">
              <table className="w-full border-collapse">
                <thead
                  className={`border-gray-300 text-left ${
                    activeCompany ? "!text-white" : "text-gray-800"
                  }`}
                  style={{
                    backgroundColor: activeCompany
                      ? activeCompany?.brand_color
                      : "#f3f4f6",
                  }}
                >
                  <tr>
                    <th className="py-2 px-4">RATE</th>
                    <th className="py-2 px-4">TAX</th>
                    <th className="py-2 px-4">NET</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2 px-4">
                      {creditNote?.tax_percent || 0} %
                    </td>
                    <td className="py-2 px-4">
                      {formatCurrency(
                        creditNote?.tax_total || 0,
                        creditNote.currency_code,
                      )}
                    </td>
                    <td className="py-2 px-4">
                      {formatCurrency(
                        creditNote?.subtotal || 0,
                        creditNote.currency_code,
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* KRA QR Code Section */}
          {creditNote.kra_submission?.qr_code_data && (
            <div className="mt-8 pt-6">
              <div className="">
                <QRCode
                  value={creditNote.kra_submission.qr_code_data}
                  size={150}
                  style={{
                    height: "auto",
                    maxWidth: "100px",
                    width: "100px",
                  }}
                  viewBox="0 0 256 256"
                />
              </div>
            </div>
          )}

          {creditNote.kra_submission && (
            <div className="flex flex-col gap-4 py-4 text-xs">
              <div className="flex gap-2">
                <span className="font-bold">Receipt Signature: </span>
                <span>
                  {creditNote?.kra_submission?.response_data?.data?.rcptSign}
                </span>
              </div>

              <div className="flex gap-2">
                <span className="font-bold">CU Number: </span>
                <span>
                  {creditNote?.kra_submission?.response_data?.data?.sdcId}
                </span>
              </div>

              <div className="flex gap-2">
                <span className="font-bold">Internal Data: </span>
                <span>
                  {creditNote?.kra_submission?.response_data?.data?.intrlData}
                </span>
              </div>

              <div className="flex gap-2">
                <span className="font-bold">Invoice Number: </span>
                <span>
                  {creditNote?.kra_submission?.response_data?.data?.sdcId}/
                  {creditNote?.kra_submission?.kra_invoice_number}
                </span>
              </div>
            </div>
          )}

          {/* Notes Section */}
          {(creditNote.customer_memo || creditNote.private_note) && (
            <div className="mt-8 pt-6 border-t border-gray-300 hidden">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-gray-600" />
                Notes
              </h3>
              <div className="bg-gray-50 p-4 rounded border border-gray-200 space-y-3">
                {creditNote.customer_memo && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Customer Message:
                    </p>
                    <p className="text-gray-800">{creditNote.customer_memo}</p>
                  </div>
                )}
                {creditNote.private_note && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Internal Notes:
                    </p>
                    <p className="text-gray-600">{creditNote.private_note}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

CreditNoteDisplay.displayName = "CreditNoteDisplay";

export default CreditNoteDisplay;
