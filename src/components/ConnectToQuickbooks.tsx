"use client";
import { useState } from "react";
import { toast } from "../lib/toast";
import { useAuth } from "../contexts/AuthContext";
import RegistrationForm from "./auth/RegistrationForm";

export default function ConnectToQuickbooks() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { login } = useAuth();

  const handleConnect = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!password) {
      toast.error("Please enter your password.");
      return;
    }

    setMessage(null);
    setIsConnecting(true);

    const loadingPromise = login(email.trim(), password.trim());

    toast.promise(loadingPromise, {
      loading: "Authenticating...",
      success: (result) => {
        if (result.success) {
          if (result.needsConnection) {
            setMessage(
              result.message ||
                "Please connect your QuickBooks company to continue."
            );

            // alert(result.authUrl);

            if (result.authUrl && localStorage.getItem("auth_tokens")) {
              setTimeout(() => {
                window.location.href = result.authUrl!;
              }, 1500);
            }
            return "Login successful! Redirecting to QuickBooks...";
          } else {
            setTimeout(() => {
              window.location.href = "/dashboard/invoices";
            }, 1000);
            return "Login successful! Redirecting to dashboard...";
          }
        }
        return "Login successful!";
      },
      error: (error) => {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Could not connect. Please try again.";
        setMessage(errorMessage);
        return errorMessage;
      },
    });

    try {
      await loadingPromise;
    } catch (error: unknown) {
      // Error is already handled by toast.promise
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRegistrationSuccess = () => {
    setMessage(
      "Registration successful! Please connect your QuickBooks company to continue."
    );
    setTimeout(() => {
      setMode("login");
    }, 2000);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="w-1/2 bg-gray-50 flex items-center justify-center px-16 py-8">
        {mode === "register" ? (
          <RegistrationForm
            onSuccess={handleRegistrationSuccess}
            onSwitchToLogin={() => setMode("login")}
          />
        ) : (
          <div className="w-full max-w-md">
            {/* Form Header */}
            <div className="mb-10">
              <h1 className="text-2xl font-normal text-gray-800">Sign In</h1>
              <p className="text-sm text-gray-600 mt-2">
                Enter your email and password to connect your QuickBooks account
                and receive updates.
              </p>
            </div>

            {/* Form */}
            <div className="space-y-6">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-normal text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-teal-500"
                  required
                  disabled={isConnecting}
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-normal text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-teal-500"
                  required
                  disabled={isConnecting}
                />
              </div>

              {/* Success/Error Message */}
              {message && (
                <div
                  className={`border rounded-md px-4 py-3 ${
                    message.includes("valid") ||
                    message.includes("error") ||
                    message.includes("Could not")
                      ? "bg-red-50 border-red-200 text-red-700"
                      : "bg-green-50 border-green-200 text-green-700"
                  }`}
                >
                  <p className="text-sm">{message}</p>
                </div>
              )}

              {/* Sign In Button */}
              <button
                onClick={handleConnect}
                disabled={isConnecting || !email || !password}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 mt-8"
              >
                {isConnecting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
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
                    <span>Signing In...</span>
                  </div>
                ) : (
                  "Sign In & Connect QuickBooks"
                )}
              </button>

              {/* Switch to Registration */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                  disabled={isConnecting}
                >
                  Don&apos;t have an account? Sign up
                </button>
              </div>

              {/* Privacy Notice */}
              <div className="text-xs text-gray-500 text-center">
                By connecting, you agree to our Terms of Service and Privacy
                Policy. You&apos;ll receive a welcome email upon successful
                connection.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Side - Teal Background with Content */}
      <div className="w-1/2 bg-teal-600 flex flex-col items-center justify-center px-16 py-8 relative overflow-hidden">
        {/* Background Pattern - Squares */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-12 w-16 h-16 bg-teal-500 opacity-20 rounded-md"></div>
          <div className="absolute top-32 right-20 w-12 h-12 bg-teal-500 opacity-15 rounded-md"></div>
          <div className="absolute bottom-24 left-16 w-20 h-20 bg-teal-500 opacity-10 rounded-md"></div>
          <div className="absolute bottom-40 right-32 w-14 h-14 bg-teal-500 opacity-25 rounded-md"></div>
          <div className="absolute top-1/2 left-8 w-8 h-8 bg-teal-500 opacity-30 rounded-md"></div>
          <div className="absolute top-1/3 right-8 w-10 h-10 bg-teal-500 opacity-15 rounded-md"></div>
          <div className="absolute top-2/3 left-1/3 w-6 h-6 bg-teal-500 opacity-20 rounded-md"></div>
          <div className="absolute bottom-1/3 right-1/4 w-12 h-12 bg-teal-500 opacity-25 rounded-md"></div>
        </div>

        {/* Analytics Card */}
        <div className="bg-white rounded-lg p-6 mb-8 w-80 relative z-10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">Analytics</h3>
            <div className="flex space-x-6 text-sm">
              <span className="text-gray-900 border-b-2 border-gray-900 pb-1 font-medium">
                Weekly
              </span>
              <span className="text-gray-500">Monthly</span>
              <span className="text-gray-500">Yearly</span>
            </div>
          </div>

          {/* Line Chart */}
          <div className="h-20 mb-6 relative">
            <svg className="w-full h-full" viewBox="0 0 320 80">
              <polyline
                fill="none"
                stroke="#6b7280"
                strokeWidth="2"
                points="0,60 80,40 160,50 240,20 320,25"
              />
              <polyline
                fill="none"
                stroke="#374151"
                strokeWidth="2"
                points="0,70 80,55 160,45 240,35 320,30"
              />
            </svg>
          </div>

          <div className="flex justify-between text-xs text-gray-500 mb-6">
            <span>MON</span>
            <span>TUE</span>
            <span>WED</span>
            <span>THU</span>
          </div>

          {/* Progress Section */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Total</div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Circular Progress */}
              <div className="relative w-12 h-12">
                <svg
                  className="w-12 h-12 transform -rotate-90"
                  viewBox="0 0 48 48"
                >
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="4"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="none"
                    stroke="#0d9488"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="125.6"
                    strokeDashoffset="73"
                  />
                </svg>
              </div>
              <span className="text-xl font-semibold text-gray-900">42%</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center text-white max-w-md relative z-10">
          <h2 className="text-2xl font-medium mb-4 leading-tight">
            Very simple way you can engage
          </h2>
          <p className="text-teal-100 leading-relaxed text-sm">
            Welcome to Smart Invoice Management System! Efficiently track and
            manage your invoices with ease. Connect your QuickBooks and receive
            instant notifications.
          </p>
        </div>
      </div>
    </div>
  );
}
