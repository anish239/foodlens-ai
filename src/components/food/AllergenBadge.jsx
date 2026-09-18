import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export const AllergenBadge = ({ allergens = [] }) => {
  const list = Array.isArray(allergens) ? allergens : [];

  if (list.length === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-2xs">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        No Declared Common Allergens
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {list.map((allergen, idx) => (
        <span
          key={idx}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200/90 shadow-2xs"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 stroke-[2.2]" />
          <span>Contains {typeof allergen === 'string' ? allergen : (allergen?.name || allergen?.message || allergen?.allergen || 'Allergen')}</span>
        </span>
      ))}
    </div>
  );
};
