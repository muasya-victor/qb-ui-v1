'use client';
// src/components/ui/StatsCard.jsx
import React from 'react';

const StatsCard = ({ title, value, color = 'gray', icon, trend }) => {
  const colorClasses = {
    gray: {
      text: 'text-gray-900',
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      icon: 'text-gray-600'
    },
    green: {
      text: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-500'
    },
    red: {
      text: 'text-red-500',
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-500'
    },
    blue: {
      text: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-500'
    }
  };

  const styles = colorClasses[color];

  return (
    <div className={`${styles.bg} p-6 rounded-xl ${styles.border} border-2 shadow-sm hover:shadow-md transition-shadow duration-200`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
          <p className={`text-2xl font-bold ${styles.text} mb-1`}>{value}</p>
          {trend && (
            <p className="text-xs text-gray-500 font-medium">{trend}</p>
          )}
        </div>
        {icon && (
          <div className={`text-2xl ${styles.icon} opacity-80`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;