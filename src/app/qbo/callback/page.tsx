"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import { useCompany } from "../../../contexts/CompanyContext";
import apiService from "../../../services/apiService";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setUser } = useAuth();
  const { setActiveCompany, refreshCompanies } = useCompany();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [showReturnButton, setShowReturnButton] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const realmId = searchParams.get("realmId");

      console.log("🔍 Callback parameters received:", {
        code: code ? `${code.substring(0, 10)}...` : "None",
        state,
        realmId,
      });

      if (!code || !state || !realmId) {
        const errorMsg = `Missing parameters from QuickBooks. Code: ${!!code}, State: ${!!state}, RealmId: ${!!realmId}`;
        console.error(errorMsg);
        setMessage("Missing parameters from QuickBooks.");
        setLoading(false);
        setShowReturnButton(true);
        return;
      }

      try {
        console.log("🔄 Starting OAuth callback processing...");

        const data = await apiService.handleCallback({ code, state, realmId });
        console.log("✅ Callback response:", data);

        if (data.success) {
          setMessage(`Successfully connected ${data.company.name}!`);

          if (data.user) {
            const userData = {
              id: data.user.email,
              email: data.user.email,
              first_name: data.user.givenName,
              last_name: data.user.familyName,
            };
            console.log("👤 Setting user data:", userData);
            setUser(userData);
          }

          console.log("🏢 Setting active company:", data.company);
          setActiveCompany(data.company);

          console.log("🔄 Refreshing companies list...");
          await refreshCompanies();

          console.log(
            "✅ OAuth flow completed successfully, redirecting to dashboard..."
          );
          setTimeout(() => {
            router.push("/dashboard/invoices");
          }, 2000);
        } else {
          console.error("❌ Callback failed:", data.error);
          setMessage(`Failed to connect QuickBooks: ${data.error}`);
          setShowReturnButton(true);
        }
      } catch (error: any) {
        console.error("💥 Error in callback:", error);
        const errorMessage =
          error.message || "Network error while connecting to QuickBooks.";
        setMessage(errorMessage);

        // If it's a CSRF/state mismatch error, provide more specific guidance
        if (
          errorMessage.toLowerCase().includes("state") ||
          errorMessage.toLowerCase().includes("csrf") ||
          errorMessage.toLowerCase().includes("oauth")
        ) {
          setMessage(
            "Security validation failed. This might be because the login session expired. Please try logging in again."
          );
          setShowReturnButton(true);
        } else {
          setShowReturnButton(true);
        }
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, router, setUser, setActiveCompany, refreshCompanies]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        {loading ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin h-10 w-10 border-4 border-teal-600 border-t-transparent rounded-full"></div>
            <p className="text-gray-600">Connecting to QuickBooks...</p>
            <p className="text-xs text-gray-500">This may take a few moments</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <div
              className={`text-4xl ${
                message?.includes("Successfully")
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {message?.includes("Successfully") ? "✅" : "❌"}
            </div>
            <p
              className={`${
                message?.includes("Successfully")
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {message}
            </p>
            {message?.includes("Successfully") && (
              <p className="text-sm text-gray-500">
                Redirecting to dashboard...
              </p>
            )}
            {showReturnButton && (
              <button
                onClick={() => router.push("/")}
                className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
              >
                Return to Login
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function QboCallback() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin h-10 w-10 border-4 border-teal-600 border-t-transparent rounded-full"></div>
            <p className="text-gray-600">Loading callback...</p>
          </div>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
