import React from 'react';
import { Card } from '../ui/card';
import { AnimatedNumber } from '../animation/AnimatedNumber';
import { cn } from '../../lib/utils';

export const StatCard = ({
  title,
  value,
  subtitle,
  change,
  icon: Icon,
  color = 'emerald',
  isNumeric = true,
  formatter,
  className,
}) => {
  const colorStyles = {
    emerald: {
      bg: 'bg-emerald-50 border-emerald-100 text-emerald-700',
      iconBg: 'bg-emerald-100/80 text-emerald-700',
    },
    red: {
      bg: 'bg-rose-50 border-rose-100 text-rose-700',
      iconBg: 'bg-rose-100/80 text-rose-700',
    },
    rose: {
      bg: 'bg-rose-50 border-rose-100 text-rose-700',
      iconBg: 'bg-rose-100/80 text-rose-700',
    },
    blue: {
      bg: 'bg-sky-50 border-sky-100 text-sky-700',
      iconBg: 'bg-sky-100/80 text-sky-700',
    },
    amber: {
      bg: 'bg-amber-50 border-amber-100 text-amber-800',
      iconBg: 'bg-amber-100/80 text-amber-800',
    },
    purple: {
      bg: 'bg-purple-50 border-purple-100 text-purple-700',
      iconBg: 'bg-purple-100/80 text-purple-700',
    },
    slate: {
      bg: 'bg-slate-50 border-slate-200 text-slate-700',
      iconBg: 'bg-slate-100 text-slate-700',
    },
  };

  const style = colorStyles[color] || colorStyles.emerald;
  const numValue = typeof value === 'number' ? value : parseInt(value, 10);
  const canAnimate = isNumeric && !isNaN(numValue);
  const subText = subtitle || change;

  return (
    <Card
      className={cn(
        'relative overflow-hidden border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all duration-200 p-5 bg-white rounded-2xl',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {canAnimate ? (
              <AnimatedNumber value={numValue} formatter={formatter || ((v) => v)} />
            ) : (
              value
            )}
          </div>
          {subText && (
            <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-0.5">
              {subText}
            </p>
          )}
        </div>

        {Icon && (
          <div
            className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200',
              style.iconBg
            )}
          >
            <Icon className="w-5 h-5 stroke-[2.2]" />
          </div>
        )}
      </div>
    </Card>
  );
};
