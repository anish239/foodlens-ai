import * as React from 'react';
import { cva } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer select-none',
  {
    variants: {
      variant: {
        default:
          'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 hover:shadow shadow-emerald-600/20 active:bg-emerald-800',
        primary:
          'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 hover:shadow shadow-emerald-600/20 active:bg-emerald-800',
        destructive:
          'bg-rose-600 text-white shadow-sm hover:bg-rose-700 hover:shadow shadow-rose-600/20 active:bg-rose-800',
        danger:
          'bg-rose-600 text-white shadow-sm hover:bg-rose-700 hover:shadow shadow-rose-600/20 active:bg-rose-800',
        outline:
          'border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100',
        secondary:
          'bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-300',
        ghost:
          'text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200',
        link:
          'text-emerald-600 underline-offset-4 hover:underline hover:text-emerald-700 p-0 h-auto',
        emeraldSubtle:
          'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        md: 'h-10 px-4 py-2',
        lg: 'h-12 rounded-xl px-6 text-base',
        icon: 'h-10 w-10 p-0',
        iconSm: 'h-8 w-8 p-0 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
