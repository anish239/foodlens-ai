import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export const ErrorState = ({
  title = 'Unable to load content',
  description = 'We encountered an issue loading this information. Please try again or check your connection.',
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-3xl border border-rose-100 shadow-2xs',
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mb-4">
        <AlertTriangle className="w-7 h-7 stroke-[2]" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1.5 tracking-tight">{title}</h3>
      <p className="text-sm text-slate-500 max-w-md leading-relaxed mb-6">{description}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          className="rounded-xl px-5 py-2.5 gap-2 border-slate-200 hover:bg-slate-50"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </Button>
      )}
    </div>
  );
};
