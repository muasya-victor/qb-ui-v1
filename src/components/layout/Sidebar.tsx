// src/components/layout/Sidebar.tsx
"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, Users, FileText, BarChart3, Wallet } from "lucide-react";

const Sidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    // {
    //   id: "dashboard",
    //   icon: LayoutDashboard,
    //   label: "Dashboard",
    //   path: "/dashboard",
    // },
    {
      id: "invoices",
      icon: FileText,
      label: "Invoices",
      path: "/dashboard/invoices",
    },
    {
      id: "creditnote",
      icon: Wallet,
      label: "Credit Notes",
      path: "/dashboard/creditnote",
    },
    {
      id: "customers",
      icon: Users,
      label: "Customers",
      path: "/dashboard/customers",
    },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-gray-900">
            Invoice Manager
          </span>
        </div>
      </div>

      <nav className="mt-6">
        <div className="px-6 space-y-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = pathname === item.path;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-left transition-colors ${
                  isActive
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <IconComponent className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
