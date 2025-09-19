"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import apiService from '../services/apiService';
import { toast } from '../lib/toast';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';

export default function QuickBooksCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { } = useAuth();
  const { refreshCompanies } = useCompany();

  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const realmId = searchParams.get("realmId");

    if (!code || !state) {
      setMessage("Missing required QuickBooks authorization parameters.");
      setLoading(false);
      return;
    }

    const sendToBackend = async (attempt = 1) => {
      try {
        setMessage(`Connecting to QuickBooks... ${attempt > 1 ? `(Attempt ${attempt})` : ''}`);

        const data = await apiService.handleCallback({ code, state, realmId: realmId || '' });

        console.log("QuickBooks connected:", data);

        // Store auth tokens
        if (data.tokens) {
          apiService.setTokens(data.tokens);
        }

        // Refresh company list to show new connection
        await refreshCompanies();

        setMessage("QuickBooks connected successfully! 🎉");
        toast.success(`Successfully connected ${data.company?.name || 'QuickBooks company'}!`);

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);

      } catch (error: any) {
        console.error(`Error on attempt ${attempt}:`, error);

        // Check if it's a CSRF/state mismatch error and we have retries left
        if ((error.message?.includes('State mismatch') ||
             error.message?.includes('CSRF') ||
             error.message?.includes('Invalid OAuth state') ||
             error.message?.includes('OAuth state expired')) && attempt <= maxRetries) {
          console.log(`OAuth state error detected, retrying... (${attempt}/${maxRetries})`);
          setRetryCount(attempt);

          toast.info(`Resolving authentication state... (${attempt}/${maxRetries})`);

          // Wait a bit before retrying to allow any session sync
          setTimeout(() => {
            sendToBackend(attempt + 1);
          }, 1500 * attempt); // Longer exponential backoff

          return;
        }

        // Final error - no more retries
        const errorMessage = error.message || "Could not connect to QuickBooks. Please try again.";
        setMessage(errorMessage);
        toast.error(errorMessage);

        // Provide option to return to login
        setTimeout(() => {
          setMessage(errorMessage + " You can close this tab and try again.");
        }, 3000);

      } finally {
        setLoading(false);
      }
    };

    sendToBackend(1);
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        {loading ? (
          <>
            <div className="animate-spin h-10 w-10 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-700">
              {retryCount > 0
                ? `Retrying connection... (${retryCount}/${maxRetries})`
                : 'Finalizing QuickBooks connection...'
              }
            </p>
            {retryCount > 0 && (
              <p className="text-sm text-gray-500 mt-2">
                Resolving session synchronization issue...
              </p>
            )}
          </>
        ) : (
          <>
            <h1 className="text-lg font-semibold mb-2">
              {message?.includes("successfully") ? "✅ Success" : "⚠️ Error"}
            </h1>
            <p className="text-gray-600">{message}</p>
            {!message?.includes("successfully") && (
              <button
                onClick={() => router.push('/login')}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Return to Login
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
