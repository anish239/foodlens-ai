import React from 'react';

export const Badge = ({ children, variant = 'success', className = '', icon: Icon }) => {
  const variants = {
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    danger: 'bg-red-50 text-red-700 border border-red-200/60',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200/60',
    info: 'bg-blue-50 text-blue-700 border border-blue-200/60',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${variants[variant] || variants.success} ${className}`}>
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </span>
  );
};
