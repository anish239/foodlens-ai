import React from 'react';

export const Card = ({ children, className = '', hoverable = false, ...props }) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/85 p-6 shadow-xs transition-all duration-200 ${
        hoverable ? 'hover:shadow-md hover:border-emerald-200' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
