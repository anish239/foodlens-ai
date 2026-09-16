import React from 'react';
import { Card } from '../ui/card';
import { Check, Sparkles } from 'lucide-react';

export const IngredientPreview = ({ ingredients = [] }) => {
  const items = Array.isArray(ingredients)
    ? ingredients
    : typeof ingredients === 'string'
    ? ingredients.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <Card className="p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Ingredients List
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            {items.length > 0 ? `${items.length} ingredients analyzed` : 'Declared packaging ingredients'}
          </p>
        </div>
        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
          Source Verified
        </span>
      </div>

      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {items.map((ing, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200/80 shadow-2xs hover:bg-slate-100 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{typeof ing === 'string' ? ing : ing.text || ing.name || 'Ingredient'}</span>
            </span>
          ))}
        </div>
      ) : (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-center">
          <p className="text-xs text-slate-500 font-medium">
            Full ingredient list is not provided for this product entry.
          </p>
        </div>
      )}
    </Card>
  );
};
