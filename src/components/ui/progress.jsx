import * as React from 'react';
import { cn } from '../../lib/utils';

const Progress = React.forwardRef(({ className, value = 0, max = 100, indicatorColor = 'bg-emerald-600', ...props }, ref) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div
      ref={ref}
      className={cn(
        'relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100',
        className
      )}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      {...props}
    >
      <div
        className={cn('h-full w-full flex-1 transition-all duration-500 ease-out rounded-full', indicatorColor)}
        style={{ transform: `translateX(-${100 - percentage}%)` }}
      />
    </div>
  );
});
Progress.displayName = 'Progress';

export { Progress };
