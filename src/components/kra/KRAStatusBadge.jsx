// components/kra/KRAStatusBadge.jsx
"use client";
import React from "react";

const KRAStatusBadge = ({ submission, size = "md" }) => {
  // Determine status from submission object
  const getStatusFromSubmission = (submission) => {
    if (!submission) return "pending";

    // Use the actual status from KRA submission
    return submission.status || "pending";
  };

  const status = getStatusFromSubmission(submission);

  const getStatusConfig = (status) => {
    const config = {
      pending: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        label: "Pending",
        icon: "⏳",
      },
      submitted: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        label: "Submitted",
        icon: "📤",
      },
      signed: {
        color: "bg-orange-100 text-orange-800 border-orange-200",
        label: "Signed",
        icon: "✍️",
      },
      success: {
        color: "bg-green-100 text-green-800 border-green-200",
        label: "Validated",
        icon: "✅",
      },
      failed: {
        color: "bg-red-100 text-red-800 border-red-200",
        label: "Failed",
        icon: "❌",
      },
    };

    return config[status] || config.pending;
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-2.5 py-1.5 text-xs",
    lg: "px-3 py-2 text-sm",
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${config.color} ${sizeClasses[size]}`}
    >
      <span className="mr-1">{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
};

export default KRAStatusBadge;
