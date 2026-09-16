import React from 'react';
import { Skeleton } from '../ui/skeleton';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';

export const LoadingSkeleton = ({ count = 3, className = '' }) => {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="p-6 rounded-2xl border-slate-200/80">
          <div className="flex items-center space-x-4 mb-4">
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4 rounded-lg" />
              <Skeleton className="h-3 w-1/3 rounded-lg" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-full rounded-lg" />
            <Skeleton className="h-3 w-5/6 rounded-lg" />
          </div>
        </Card>
      ))}
    </div>
  );
};
