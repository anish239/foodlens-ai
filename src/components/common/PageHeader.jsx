import React from 'react';
import { cn } from '../../lib/utils';

export const PageHeader = ({ title, description, action, badge, className }) => {
  return (
    <div className={cn('flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 sm:mb-8', className)}>
      <div className="space-y-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{title}</h1>
          {badge && <div>{badge}</div>}
        </div>
        {description && (
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex items-center gap-2.5 flex-wrap">{action}</div>}
    </div>
  );
};
