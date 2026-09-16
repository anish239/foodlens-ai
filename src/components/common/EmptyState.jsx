import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export const EmptyState = ({
  icon: Icon = PackageOpen,
  title = 'No items found',
  description = 'Get started by scanning or searching for foods.',
  actionText,
  onAction,
  className,
  children,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-14 text-center bg-white rounded-3xl border border-dashed border-slate-200/90 shadow-2xs',
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100/80 flex items-center justify-center mb-4 shadow-sm shadow-emerald-500/10">
        <Icon className="w-8 h-8 stroke-[1.8]" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1.5 tracking-tight">{title}</h3>
      <p className="text-sm text-slate-500 max-w-md leading-relaxed mb-6">{description}</p>
      {actionText && onAction && (
        <Button onClick={onAction} className="rounded-xl px-5 py-2.5 shadow-sm">
          {actionText}
        </Button>
      )}
      {children}
    </div>
  );
};
