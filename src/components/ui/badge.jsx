import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none gap-1',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-slate-900 text-slate-50 hover:bg-slate-900/80',
        secondary:
          'border-transparent bg-slate-100 text-slate-900 hover:bg-slate-200/80',
        destructive:
          'border-transparent bg-rose-50 text-rose-700 border-rose-200',
        outline: 'text-slate-700 border-slate-200 bg-white',
        emerald:
          'border-emerald-200 bg-emerald-50 text-emerald-700',
        success:
          'border-emerald-200 bg-emerald-50 text-emerald-700',
        warning:
          'border-amber-200 bg-amber-50 text-amber-800',
        info:
          'border-sky-200 bg-sky-50 text-sky-700',
        purple:
          'border-purple-200 bg-purple-50 text-purple-700',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.2 text-[11px]',
        lg: 'px-3 py-1 text-sm font-medium',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

function Badge({ className, variant, size, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
