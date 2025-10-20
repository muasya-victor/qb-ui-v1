"use client";
import React, { useState, useEffect } from "react";
import { toast } from "../../lib/toast";
import StatsCard from "../ui/StatsCard";
import companyService, {
  Company,
  UpdateCompanyRequest,
} from "../../services/companyService";
import { useCompany } from "../../contexts/CompanyContext";

const CompanyDetails: React.FC = () => {
  const { activeCompany, refreshActiveCompany } = useCompany();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UpdateCompanyRequest>({
    name: "",
    invoice_logo_enabled: true,
    brand_color: "#0077C5",
    invoice_footer_text: "",
  });

  useEffect(() => {
    console.log(
      "🔄 [CompanyDetails] Active company from context:",
      activeCompany
    );
    if (activeCompany) {
      fetchCompanyDetails();
    } else {
      console.log("❌ [CompanyDetails] No active company in context");
      setLoading(false);
    }
  }, [activeCompany]);

  const fetchCompanyDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔄 [CompanyDetails] Starting fetch...");
      console.log("🔄 [CompanyDetails] Active company:", activeCompany);

      if (!activeCompany?.id) {
        const errorMsg = "No active company selected";
        console.error("❌ [CompanyDetails]", errorMsg);
        setError(errorMsg);
        setLoading(false);
        return;
      }

      console.log(
        "🔄 [CompanyDetails] Fetching company with ID:",
        activeCompany.id
      );

      const response = await companyService.getCompany(activeCompany.id);
      console.log("✅ [CompanyDetails] Service response:", response);

      // Add null checks for the response structure
      if (response.success && response.company) {
        console.log(
          "✅ [CompanyDetails] Setting company data:",
          response.company
        );
        setCompany(response.company);
        setFormData({
          name: response.company.name || "",
          invoice_logo_enabled: response.company.invoice_logo_enabled ?? true,
          brand_color: response.company.brand_color || "#0077C5",
          invoice_footer_text: response.company.invoice_footer_text || "",
        });
      } else {
        console.error(
          "❌ [CompanyDetails] Invalid response structure:",
          response
        );
        const errorMsg = response.message || "Invalid response from server";
        setError(errorMsg);
      }
    } catch (err: any) {
      console.error("❌ [CompanyDetails] Error in fetchCompanyDetails:", err);
      console.error("❌ [CompanyDetails] Error details:", {
        message: err.message,
        stack: err.stack,
      });
      setError(err.message || "Failed to fetch company details");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (!company?.id) {
        throw new Error("No company selected");
      }

      const response = await companyService.updateCompany(company.id, formData);

      if (response.success) {
        setCompany(response.company);
        await refreshActiveCompany();
        setIsEditing(false);
        toast.success("Company details updated successfully");
      } else {
        throw new Error("Failed to update company details");
      }
    } catch (err: any) {
      toast.error(`Failed to update: ${err.message}`);
      console.error("Error updating company:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: company?.name || "",
      invoice_logo_enabled: company?.invoice_logo_enabled ?? true,
      brand_color: company?.brand_color || "#0077C5",
      invoice_footer_text: company?.invoice_footer_text || "",
    });
    setIsEditing(false);
  };

  const handleDisconnect = async () => {
    if (
      !company?.id ||
      !window.confirm(
        "Are you sure you want to disconnect from QuickBooks? This will remove all connection data."
      )
    ) {
      return;
    }

    try {
      const response = await companyService.disconnectCompany(company.id);

      if (response.success) {
        await fetchCompanyDetails();
        await refreshActiveCompany();
        toast.success("Company disconnected successfully");
      } else {
        throw new Error("Failed to disconnect company");
      }
    } catch (err: any) {
      toast.error(`Disconnect failed: ${err.message}`);
      console.error("Error disconnecting company:", err);
    }
  };

  const handleRefreshInfo = async () => {
    if (!company?.id) return;

    try {
      setLoading(true);
      const response = await companyService.refreshCompanyInfo(company.id);

      if (response.success) {
        setCompany(response.company);
        await refreshActiveCompany();
        toast.success("Company information refreshed from QuickBooks");
      } else {
        throw new Error("Failed to refresh company info");
      }
    } catch (err: any) {
      toast.error(`Refresh failed: ${err.message}`);
      console.error("Error refreshing company info:", err);
    } finally {
      setLoading(false);
    }
  };

  // Debug: Log when activeCompany changes
  useEffect(() => {
    console.log("🔍 [CompanyDetails] activeCompany changed:", activeCompany);
  }, [activeCompany]);

  // Debug: Log when company changes
  useEffect(() => {
    console.log("🔍 [CompanyDetails] company state changed:", company);
  }, [company]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">
              Loading Company Details
            </h3>
            <p className="text-gray-600 mt-1">
              Fetching company information...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading company details
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={fetchCompanyDetails}
                className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!activeCompany) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                No Company Selected
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Please select a company to view details.
              </p>
              <div className="mt-2">
                <p className="text-sm text-yellow-600">
                  Debug info: Active company from context:{" "}
                  {activeCompany ? JSON.stringify(activeCompany) : "null"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Company Data Not Loaded
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Active company is selected but data couldn't be loaded.
              </p>
              <button
                onClick={fetchCompanyDetails}
                className="mt-2 text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded"
              >
                Load Company Data
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Company Details</h1>
          <p className="text-gray-600 mt-1">
            Manage your company information and invoice settings
          </p>
          <div className="mt-2 text-sm text-gray-500">
            Active Company ID: {activeCompany.id}
          </div>
        </div>

        <div className="mt-4 sm:mt-0 flex space-x-3">
          {company.is_connected && (
            <button
              onClick={handleRefreshInfo}
              disabled={loading}
              className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                loading
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              }`}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refresh from QuickBooks
                </>
              )}
            </button>
          )}

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit Details
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleCancel}
                className="inline-flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  saving
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                }`}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Connection Status Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`p-2 rounded-full ${
                  company.is_connected ? "bg-green-100" : "bg-red-100"
                }`}
              >
                <svg
                  className={`w-6 h-6 ${
                    company.is_connected ? "text-green-600" : "text-red-600"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {company.is_connected ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  )}
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  QuickBooks Connection
                </h3>
                <p
                  className={`text-sm ${
                    company.is_connected ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {company.is_connected ? "Connected" : "Disconnected"}
                </p>
              </div>
            </div>
            {company.is_connected && (
              <button
                onClick={handleDisconnect}
                className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors duration-200"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Disconnect
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Company Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">
              Basic Information
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-gray-900">{company.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                QuickBooks Realm ID
              </label>
              <p className="text-gray-600 font-mono">{company.realm_id}</p>
            </div>

            {company.qb_company_name && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  QuickBooks Company Name
                </label>
                <p className="text-gray-900">{company.qb_company_name}</p>
              </div>
            )}

            {company.currency_code && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <p className="text-gray-900">{company.currency_code}</p>
              </div>
            )}
          </div>
        </div>

        {/* Invoice Branding */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">
              Invoice Branding
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Show Logo on Invoices
              </label>
              {isEditing ? (
                <input
                  type="checkbox"
                  checked={formData.invoice_logo_enabled}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      invoice_logo_enabled: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              ) : (
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    company.invoice_logo_enabled
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {company.invoice_logo_enabled ? "Enabled" : "Disabled"}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand Color
              </label>
              {isEditing ? (
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={formData.brand_color}
                    onChange={(e) =>
                      setFormData({ ...formData, brand_color: e.target.value })
                    }
                    className="h-10 w-20 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={formData.brand_color}
                    onChange={(e) =>
                      setFormData({ ...formData, brand_color: e.target.value })
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  />
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <div
                    className="w-6 h-6 rounded border border-gray-300"
                    style={{ backgroundColor: company.brand_color }}
                  ></div>
                  <span className="text-gray-900 font-mono">
                    {company.brand_color}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Footer Text
              </label>
              {isEditing ? (
                <textarea
                  value={formData.invoice_footer_text}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      invoice_footer_text: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Thank you for your business!"
                />
              ) : (
                <p className="text-gray-900 whitespace-pre-wrap">
                  {company.invoice_footer_text || "No footer text set"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QuickBooks Information */}
      {company.qb_company_info && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
            <h3 className="text-lg font-semibold text-gray-900">
              QuickBooks Details
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {company.qb_legal_name && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Legal Name
                  </label>
                  <p className="text-gray-900">{company.qb_legal_name}</p>
                </div>
              )}

              {company.qb_country && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <p className="text-gray-900">{company.qb_country}</p>
                </div>
              )}

              {company.qb_email && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <p className="text-gray-900">{company.qb_email}</p>
                </div>
              )}

              {company.qb_phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <p className="text-gray-900">{company.qb_phone}</p>
                </div>
              )}

              {company.qb_website && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <a
                    href={company.qb_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {company.qb_website}
                  </a>
                </div>
              )}

              {company.invoice_template_name && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Template
                  </label>
                  <p className="text-gray-900">
                    {company.invoice_template_name}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyDetails;
