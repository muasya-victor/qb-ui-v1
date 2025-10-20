"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import { useCompany } from "../../../contexts/CompanyContext";
import apiService, { CallbackResponse } from "../../../services/apiService";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setUser } = useAuth();
  const { setActiveCompany, refreshCompanies } = useCompany();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [showReturnButton, setShowReturnButton] = useState(false);

  // Use useRef instead of useState for hasProcessed to avoid re-renders
  const hasProcessedRef = useRef(false);
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      // PREVENT MULTIPLE EXECUTIONS
      if (hasProcessedRef.current) {
        console.log("🛑 Callback already processed, skipping...");
        return;
      }

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
        hasProcessedRef.current = true; // MARK AS PROCESSED
        console.log("🔄 Starting OAuth callback processing...");

        const data: CallbackResponse = await apiService.handleCallback({
          code,
          state,
          realmId,
        });
        console.log("✅ Callback response:", data);

        if (data.success) {
          let finalMessage = "";

          if (data.duplicate) {
            finalMessage =
              "QuickBooks connection already completed. Redirecting...";
          } else {
            // SAFELY ACCESS COMPANY NAME WITH FALLBACK
            const companyName = data.company?.name || "QuickBooks Company";
            finalMessage = `Successfully connected ${companyName}!`;
          }

          setMessage(finalMessage);

          // SAFELY HANDLE USER DATA
          if (data.user && !data.duplicate) {
            const userData = {
              id: data.user.email,
              email: data.user.email,
              first_name: data.user.givenName || "",
              last_name: data.user.familyName || "",
            };
            console.log("👤 Setting user data:", userData);
            setUser(userData);
          }

          // SAFELY HANDLE COMPANY DATA
          if (data.company && !data.duplicate) {
            console.log("🏢 Setting active company:", data.company);
            setActiveCompany(data.company);

            console.log("🔄 Refreshing companies list...");
            await refreshCompanies();
          }

          console.log(
            "✅ OAuth flow completed successfully, preparing redirect..."
          );

          // Clear any existing timer
          if (redirectTimerRef.current) {
            clearTimeout(redirectTimerRef.current);
          }

          // Set new redirect timer - use a shorter timeout
          redirectTimerRef.current = setTimeout(() => {
            console.log("🚀 Redirecting to dashboard...");
            router.push("/dashboard/invoices");
          }, 1500); // Reduced from 2000 to 1500ms
        } else {
          console.error("❌ Callback failed:", data.message || "Unknown error");
          setMessage(
            `Failed to connect QuickBooks: ${data.message || "Unknown error"}`
          );
          setShowReturnButton(true);
        }
      } catch (error: any) {
        console.error("💥 Error in callback:", error);
        const errorMessage =
          error.message || "Network error while connecting to QuickBooks.";
        setMessage(errorMessage);

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

    // Cleanup function
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, [searchParams, router, setUser, setActiveCompany, refreshCompanies]);

  // Add a manual redirect button as fallback
  const handleManualRedirect = () => {
    console.log("🚀 Manual redirect to dashboard...");
    router.push("/dashboard/invoices");
  };

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
                message?.includes("Successfully") ||
                message?.includes("already completed")
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {message?.includes("Successfully") ||
              message?.includes("already completed")
                ? "✅"
                : "❌"}
            </div>
            <p
              className={`${
                message?.includes("Successfully") ||
                message?.includes("already completed")
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {message}
            </p>
            {(message?.includes("Successfully") ||
              message?.includes("already completed")) && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  Redirecting to dashboard...
                </p>
                {/* Manual redirect button as fallback */}
                <button
                  onClick={handleManualRedirect}
                  className="mt-2 px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors text-sm"
                >
                  Click here if not redirected
                </button>
              </div>
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
