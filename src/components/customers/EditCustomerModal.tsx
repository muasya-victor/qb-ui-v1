"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  User,
  Building,
  Mail,
  Phone,
  Globe,
  MapPin,
  DollarSign,
} from "lucide-react";
import { Customer, CompanyInfo } from "./CustomerDisplay";
import customerService from "../../services/CustomerService";

interface EditCustomerModalProps {
  customer: Customer | null;
  companyInfo: CompanyInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface CustomerFormData {
  display_name: string;
  given_name: string;
  family_name: string;
  company_name: string;
  email: string;
  phone: string;
  mobile: string;
  fax: string;
  website: string;
  active: boolean;
  notes: string;
  taxable: boolean;
  tax_code_ref_value: string;
  // Billing Address
  bill_addr_line1: string;
  bill_addr_line2: string;
  bill_addr_city: string;
  bill_addr_state: string;
  bill_addr_postal_code: string;
  bill_addr_country: string;
  // Shipping Address
  ship_addr_line1: string;
  ship_addr_line2: string;
  ship_addr_city: string;
  ship_addr_state: string;
  ship_addr_postal_code: string;
  ship_addr_country: string;
}

export default function EditCustomerModal({
  customer,
  companyInfo,
  isOpen,
  onClose,
  onSave,
}: EditCustomerModalProps) {
  const [formData, setFormData] = useState<CustomerFormData>({
    display_name: "",
    given_name: "",
    family_name: "",
    company_name: "",
    email: "",
    phone: "",
    mobile: "",
    fax: "",
    website: "",
    active: true,
    notes: "",
    taxable: true,
    tax_code_ref_value: "",
    bill_addr_line1: "",
    bill_addr_line2: "",
    bill_addr_city: "",
    bill_addr_state: "",
    bill_addr_postal_code: "",
    bill_addr_country: "",
    ship_addr_line1: "",
    ship_addr_line2: "",
    ship_addr_city: "",
    ship_addr_state: "",
    ship_addr_postal_code: "",
    ship_addr_country: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customer) {
      setFormData({
        display_name: customer.display_name || "",
        given_name: customer.given_name || "",
        family_name: customer.family_name || "",
        company_name: customer.company_name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        mobile: customer.mobile || "",
        fax: customer.fax || "",
        website: customer.website || "",
        active: customer.active ?? true,
        notes: customer.notes || "",
        taxable: customer.taxable ?? true,
        tax_code_ref_value: customer.tax_code_ref_value || "",
        bill_addr_line1: customer.bill_addr_line1 || "",
        bill_addr_line2: customer.bill_addr_line2 || "",
        bill_addr_city: customer.bill_addr_city || "",
        bill_addr_state: customer.bill_addr_state || "",
        bill_addr_postal_code: customer.bill_addr_postal_code || "",
        bill_addr_country: customer.bill_addr_country || "",
        ship_addr_line1: customer.ship_addr_line1 || "",
        ship_addr_line2: customer.ship_addr_line2 || "",
        ship_addr_city: customer.ship_addr_city || "",
        ship_addr_state: customer.ship_addr_state || "",
        ship_addr_postal_code: customer.ship_addr_postal_code || "",
        ship_addr_country: customer.ship_addr_country || "",
      });
    }
  }, [customer]);

  // Fixed handleInputChange function
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Alternative handler for checkboxes to ensure they work properly
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  // Handler for text inputs with better typing support
  // const handleInputChange = (
  //   e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  // ) => {
  //   const { name, value } = e.target;
  //   setFormData((prev) => ({
  //     ...prev,
  //     [name]: value,
  //   }));
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    try {
      setLoading(true);
      setError(null);

      await customerService.updateCustomer(customer.id, formData);
      onSave();
    } catch (err: any) {
      setError(err.message || "Failed to update customer");
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !customer) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleBackdropClick}
      />

      {/* Modal Container */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-3">
              <User className="w-6 h-6 text-gray-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Edit Customer
                </h2>
                <p className="text-sm text-gray-600">
                  Update customer details in QuickBooks
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="overflow-y-auto max-h-[calc(90vh-8rem)]"
          >
            <div className="p-6 space-y-8">
              {error && (
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
                        Error
                      </h3>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="display_name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Display Name *
                    </label>
                    <input
                      id="display_name"
                      type="text"
                      name="display_name"
                      value={formData.display_name}
                      onChange={handleInputChange}
                      required
                      className="
                      w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white
                      "
                    />
                  </div>

                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <label
                        htmlFor="given_name"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Given Name
                      </label>
                      <input
                        id="given_name"
                        type="text"
                        name="given_name"
                        value={formData.given_name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      />
                    </div>
                    <div className="flex-1">
                      <label
                        htmlFor="family_name"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Family Name
                      </label>
                      <input
                        id="family_name"
                        type="text"
                        name="family_name"
                        value={formData.family_name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="company_name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Company Name
                    </label>
                    <input
                      id="company_name"
                      type="text"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    />
                  </div>

                  <div className="flex items-center space-x-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="active"
                        checked={formData.active}
                        onChange={handleCheckboxChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="taxable"
                        checked={formData.taxable}
                        onChange={handleCheckboxChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Taxable
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center">
                  <Mail className="w-5 h-5 mr-2" />
                  Contact Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Phone
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="mobile"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Mobile
                    </label>
                    <input
                      id="mobile"
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="website"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Website
                    </label>
                    <input
                      id="website"
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Billing Address */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Billing Address
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label
                      htmlFor="bill_addr_line1"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Address Line 1
                    </label>
                    <input
                      id="bill_addr_line1"
                      type="text"
                      name="bill_addr_line1"
                      value={formData.bill_addr_line1}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="bill_addr_line2"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Address Line 2
                    </label>
                    <input
                      id="bill_addr_line2"
                      type="text"
                      name="bill_addr_line2"
                      value={formData.bill_addr_line2}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="bill_addr_city"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      City
                    </label>
                    <input
                      id="bill_addr_city"
                      type="text"
                      name="bill_addr_city"
                      value={formData.bill_addr_city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="bill_addr_state"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      State/Province
                    </label>
                    <input
                      id="bill_addr_state"
                      type="text"
                      name="bill_addr_state"
                      value={formData.bill_addr_state}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="bill_addr_postal_code"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Postal Code
                    </label>
                    <input
                      id="bill_addr_postal_code"
                      type="text"
                      name="bill_addr_postal_code"
                      value={formData.bill_addr_postal_code}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="bill_addr_country"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Country
                    </label>
                    <input
                      id="bill_addr_country"
                      type="text"
                      name="bill_addr_country"
                      value={formData.bill_addr_country}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Shipping Address
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label
                      htmlFor="ship_addr_line1"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Address Line 1
                    </label>
                    <input
                      id="ship_addr_line1"
                      type="text"
                      name="ship_addr_line1"
                      value={formData.ship_addr_line1}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="ship_addr_line2"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Address Line 2
                    </label>
                    <input
                      id="ship_addr_line2"
                      type="text"
                      name="ship_addr_line2"
                      value={formData.ship_addr_line2}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="ship_addr_city"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      City
                    </label>
                    <input
                      id="ship_addr_city"
                      type="text"
                      name="ship_addr_city"
                      value={formData.ship_addr_city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="ship_addr_state"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      State/Province
                    </label>
                    <input
                      id="ship_addr_state"
                      type="text"
                      name="ship_addr_state"
                      value={formData.ship_addr_state}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="ship_addr_postal_code"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Postal Code
                    </label>
                    <input
                      id="ship_addr_postal_code"
                      type="text"
                      name="ship_addr_postal_code"
                      value={formData.ship_addr_postal_code}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="ship_addr_country"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Country
                    </label>
                    <input
                      id="ship_addr_country"
                      type="text"
                      name="ship_addr_country"
                      value={formData.ship_addr_country}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Additional Information
                </h3>

                <div>
                  <label
                    htmlFor="notes"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
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
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
