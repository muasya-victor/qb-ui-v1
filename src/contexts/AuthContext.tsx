"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { toast } from "../lib/toast";
import apiService, { User, TokenData } from "../services/apiService";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{
    success: boolean;
    needsConnection?: boolean;
    authUrl?: string;
    message?: string;
  }>;
  register: (data: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = () => {
      if (typeof window === "undefined") return;

      const isAuthenticated = apiService.isAuthenticated();
      if (isAuthenticated) {
        const userData = localStorage.getItem("user_data");
        if (userData) {
          try {
            setUser(JSON.parse(userData));
          } catch (error) {
            console.error("Failed to parse user data:", error);
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  useEffect(() => {
    // Set up the 401 interceptor
    apiService.setUnauthorizedCallback(() => {
      console.log("🛡️ Session expired, logging out");
      router.push("/");
    });
  }, [router]);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.getAuthUrl({ email, password });

      if (response.success) {
        apiService.setTokens(response.tokens);

        if (response.is_connected && response.company) {
          return { success: true, needsConnection: false };
        } else {
          return {
            success: true,
            needsConnection: true,
            authUrl: response.authUrl || undefined,
            message: response.message,
          };
        }
      }
      return { success: false };
    } catch (error: any) {
      throw new Error(error.message || "Login failed");
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }) => {
    try {
      const response = await apiService.register(data);

      if (response.success) {
        apiService.setTokens(response.tokens);
        setUser(response.user);
        localStorage.setItem("user_data", JSON.stringify(response.user));
        toast.success("Account created successfully!");
        return { success: true, message: response.message };
      }
      const errorMsg = "Registration failed";
      toast.error(errorMsg);
      return { success: false, message: errorMsg };
    } catch (error: any) {
      const errorMsg = error.message || "Registration failed";
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
      setUser(null);
      localStorage.removeItem("user_data");
      toast.success("Logged out successfully");

      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed");
    }
  };

  const setUserData = (userData: User | null) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem("user_data", JSON.stringify(userData));
    } else {
      localStorage.removeItem("user_data");
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: apiService.isAuthenticated(),
    isLoading,
    login,
    register,
    logout,
    setUser: setUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
