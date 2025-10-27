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
    kra_pin: "",
  });
  const [kraError, setKraError] = useState<string | null>(null);

  // Validate KRA PIN format (Kenyan format: 11 characters)
  const validateKraPin = (pin: string): boolean => {
    if (!pin) return true; // Empty is allowed
    // Format: A000000000B (one letter, nine digits, one letter)
    const kraRegex = /^[A-Z]{1}\d{9}[A-Z]{1}$/;
    return kraRegex.test(pin);
  };

  const handleKraPinChange = (value: string) => {
    const uppercaseValue = value.toUpperCase();
    setFormData({ ...formData, kra_pin: uppercaseValue });

    if (uppercaseValue && !validateKraPin(uppercaseValue)) {
      setKraError(
        "KRA PIN must be in the format A000000000B (one letter, nine digits, one letter)"
      );
    } else {
      setKraError(null);
    }
  };

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
          kra_pin: response.company.kra_pin || "",
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
    if (kraError) {
      toast.error("Please fix KRA PIN errors before saving");
      return;
    }

    try {
      setSaving(true);

      if (!company?.id) {
        throw new Error("No company selected");
      }

      const response = await companyService.updateCompany(company.id, formData).then((res)=>{
        setCompany(res.company);
        refreshActiveCompany();
        setIsEditing(false);
        toast.success("Company details updated successfully");
      })
      .catch(()=>{
        throw new Error("Failed to update company details");
      })

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
      kra_pin: company?.kra_pin || "",
    });
    setKraError(null);
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

  // Get brand color with fallback
  const brandColor = company?.brand_color || "#0077C5";

  // Generate lighter/darker shades for UI
  const getBrandShades = (color: string) => {
    return {
      primary: color,
      light: `${color}20`, // 20% opacity
      lighter: `${color}10`, // 10% opacity
      dark: color, // You could implement color darkening logic here
    };
  };

  const brandShades = getBrandShades(brandColor);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2"
            style={{ borderColor: brandColor }}
          ></div>
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
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-red-400"
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
            <div className="ml-4">
              <h3 className="text-lg font-medium text-red-800">
                Error loading company details
              </h3>
              <p className="text-red-700 mt-2">{error}</p>
              <button
                onClick={fetchCompanyDetails}
                className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-medium transition-colors"
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
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-yellow-400"
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
            <div className="ml-4">
              <h3 className="text-lg font-medium text-yellow-800">
                No Company Selected
              </h3>
              <p className="text-yellow-700 mt-2">
                Please select a company to view details.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-yellow-400"
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
            <div className="ml-4">
              <h3 className="text-lg font-medium text-yellow-800">
                Company Data Not Loaded
              </h3>
              <p className="text-yellow-700 mt-2">
                Active company is selected but data couldn't be loaded.
              </p>
              <button
                onClick={fetchCompanyDetails}
                className="mt-4 px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg font-medium transition-colors"
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
    <div className="min-h-screen bg-gray-50/30 p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-4">
            <div
              className="w-3 h-12 rounded-full"
              style={{ backgroundColor: brandColor }}
            ></div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Company Details
              </h1>
              <p className="text-gray-600 mt-1 max-w-2xl">
                Manage your company information, tax details, and invoice
                branding settings
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 lg:mt-0 flex flex-wrap gap-3">
          {company.is_connected && (
            <button
              onClick={handleRefreshInfo}
              disabled={loading}
              className={`inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                loading
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-gray-400 shadow-sm hover:shadow-md"
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
              className="inline-flex items-center px-6 py-3 bg-white text-gray-900 rounded-xl text-sm font-semibold border border-gray-300 hover:border-gray-400 shadow-sm hover:shadow-md transition-all duration-200"
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
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="inline-flex items-center px-5 py-2.5 bg-white text-gray-700 rounded-xl text-sm font-semibold border border-gray-300 hover:border-gray-400 shadow-sm hover:shadow-md transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !!kraError}
                style={{ backgroundColor: brandColor }}
                className={`inline-flex items-center px-6 py-3 text-white rounded-xl text-sm font-semibold transition-all duration-200 ${
                  saving || kraError
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:shadow-lg transform hover:-translate-y-0.5"
                }`}
              >
                {saving ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Connection Status Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div
          className="p-6 border-b border-gray-100"
          style={{ backgroundColor: brandShades.lighter }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4">
              <div
                className={`p-3 rounded-xl ${
                  company.is_connected
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                <svg
                  className="w-6 h-6"
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
                <h3 className="text-xl font-semibold text-gray-900">
                  QuickBooks Connection
                </h3>
                <p
                  className={`text-sm font-medium ${
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
                className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors duration-200 border border-red-200"
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
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Disconnect
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 !text-black">
        {/* Left Column - Basic Info & Tax Details */}
        <div className="xl:col-span-2 space-y-8">
          {/* Basic Information Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900">
                Basic Information
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Core company details and identification
              </p>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Company Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200"
                      style={
                        {
                          focusRingColor: brandColor,
                          "--tw-ring-color": brandColor,
                        } as any
                      }
                    />
                  ) : (
                    <p className="text-gray-900 text-lg font-medium">
                      {company.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    KRA PIN
                  </label>
                  {isEditing ? (
                    <div>
                      <input
                        type="text"
                        value={formData.kra_pin}
                        onChange={(e) => handleKraPinChange(e.target.value)}
                        maxLength={11}
                        placeholder="A123456789X"
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 ${
                          kraError ? "border-red-300" : "border-gray-300"
                        }`}
                        style={
                          {
                            "--tw-ring-color": brandColor,
                          } as any
                        }
                      />
                      {kraError && (
                        <p className="text-red-600 text-sm mt-2 flex items-center">
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {kraError}
                        </p>
                      )}
                      <p className="text-gray-500 text-xs mt-2">
                        Must be exactly 11 alphanumeric characters
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-900 text-lg font-mono font-medium">
                      {company.kra_pin || "Not provided"}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    QuickBooks Realm ID
                  </label>
                  <p className="text-gray-600 font-mono bg-gray-50 px-3 py-2 rounded-lg">
                    {company.realm_id}
                  </p>
                </div>

                {company.currency_code && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Currency
                    </label>
                    <p className="text-gray-900 text-lg font-medium">
                      {company.currency_code}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* QuickBooks Information */}
          {company.qb_company_info && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div
                className="p-6 border-b border-gray-100"
                style={{ backgroundColor: brandShades.lighter }}
              >
                <h3 className="text-xl font-semibold text-gray-900">
                  QuickBooks Company Details
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  Information synced from your QuickBooks account
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {company.qb_legal_name && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Legal Name
                      </label>
                      <p className="text-gray-900">{company.qb_legal_name}</p>
                    </div>
                  )}

                  {company.qb_company_name && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Company Name
                      </label>
                      <p className="text-gray-900">{company.qb_company_name}</p>
                    </div>
                  )}

                  {company.qb_country && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Country
                      </label>
                      <p className="text-gray-900">{company.qb_country}</p>
                    </div>
                  )}

                  {company.qb_email && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Email
                      </label>
                      <p className="text-gray-900">{company.qb_email}</p>
                    </div>
                  )}

                  {company.qb_phone && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Phone
                      </label>
                      <p className="text-gray-900">{company.qb_phone}</p>
                    </div>
                  )}

                  {company.qb_website && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Website
                      </label>
                      <a
                        href={company.qb_website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {company.qb_website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Invoice Branding */}
        <div className="space-y-8">
          {/* Invoice Branding Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900">
                Invoice Branding
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Customize your invoice appearance
              </p>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">
                    Show Logo on Invoices
                  </label>
                  <p className="text-gray-600 text-sm">
                    Display your company logo on generated invoices
                  </p>
                </div>
                {isEditing ? (
                  <div className="relative inline-block w-12 h-6">
                    <input
                      type="checkbox"
                      checked={formData.invoice_logo_enabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          invoice_logo_enabled: e.target.checked,
                        })
                      }
                      className="sr-only"
                    />
                    <div
                      className={`block w-12 h-6 rounded-full transition-colors duration-200 ${
                        formData.invoice_logo_enabled
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    ></div>
                    <div
                      className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                        formData.invoice_logo_enabled
                          ? "transform translate-x-6"
                          : ""
                      }`}
                    ></div>
                  </div>
                ) : (
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${
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
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Brand Color
                </label>
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-4">
                      <input
                        type="color"
                        value={formData.brand_color}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            brand_color: e.target.value,
                          })
                        }
                        className="h-12 w-20 rounded-xl border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.brand_color}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            brand_color: e.target.value,
                          })
                        }
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent font-mono text-sm"
                        style={
                          {
                            "--tw-ring-color": brandColor,
                          } as any
                        }
                      />
                    </div>
                    <p className="text-gray-500 text-xs">
                      This color will be used for headers, buttons, and accents
                      throughout the application
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                    <div
                      className="w-12 h-12 rounded-lg border border-gray-300"
                      style={{ backgroundColor: company.brand_color }}
                    ></div>
                    <span className="text-gray-900 font-mono font-medium">
                      {company.brand_color}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
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
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent resize-none transition-all duration-200"
                    placeholder="Thank you for your business!&#10;Contact us for any questions..."
                    style={
                      {
                        "--tw-ring-color": brandColor,
                      } as any
                    }
                  />
                ) : (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {company.invoice_footer_text || "No footer text set"}
                    </p>
                  </div>
                )}
              </div>

              {company.invoice_template_name && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Invoice Template
                  </label>
                  <p className="text-gray-900 font-medium">
                    {company.invoice_template_name}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetails;
