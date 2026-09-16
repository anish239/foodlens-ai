import React from 'react';
import { Card } from '../ui/card';
import { Flame, Dumbbell, Wheat, Candy, Sparkles, Droplet, ShieldAlert, Scale } from 'lucide-react';

export const NutritionPreview = ({ nutrition = {} }) => {
  const formatVal = (val, unit = 'g') => {
    if (val === null || val === undefined || isNaN(Number(val))) {
      return { value: 'Not available', unit: '' };
    }
    return { value: Number(val), unit };
  };

  const metrics = [
    {
      label: 'Calories',
      ...formatVal(nutrition.calories, 'kcal'),
      icon: Flame,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    {
      label: 'Protein',
      ...formatVal(nutrition.protein, 'g'),
      icon: Dumbbell,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      label: 'Carbohydrates',
      ...formatVal(nutrition.carbs ?? nutrition.carbohydrates, 'g'),
      icon: Wheat,
      color: 'text-amber-700 bg-amber-50/60 border-amber-100',
    },
    {
      label: 'Sugars',
      ...formatVal(nutrition.sugar ?? nutrition.sugars, 'g'),
      icon: Candy,
      color: 'text-rose-600 bg-rose-50 border-rose-100',
    },
    {
      label: 'Dietary Fiber',
      ...formatVal(nutrition.fiber, 'g'),
      icon: Sparkles,
      color: 'text-teal-600 bg-teal-50 border-teal-100',
    },
    {
      label: 'Total Fat',
      ...formatVal(nutrition.fat, 'g'),
      icon: Droplet,
      color: 'text-sky-600 bg-sky-50 border-sky-100',
    },
    {
      label: 'Saturated Fat',
      ...formatVal(nutrition.saturatedFat ?? nutrition.saturated_fat, 'g'),
      icon: ShieldAlert,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      label: 'Sodium',
      ...formatVal(
        nutrition.sodium !== null && nutrition.sodium !== undefined
          ? (Number(nutrition.sodium) > 10 ? Number(nutrition.sodium) : Number(nutrition.sodium) * 1000)
          : null,
        'mg'
      ),
      icon: Scale,
      color: 'text-purple-600 bg-purple-50 border-purple-100',
    },
  ];

  return (
    <Card className="p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Nutrition Facts
          </h3>
          <p className="text-xs text-slate-500 font-medium">Standardized per 100g serving</p>
        </div>
        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
          Official Data
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          const isAvailable = m.value !== 'Not available';

          return (
            <div
              key={idx}
              className="bg-slate-50/80 p-3.5 sm:p-4 rounded-2xl border border-slate-100/90 flex flex-col justify-between space-y-2 hover:bg-slate-50 hover:border-slate-200 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">{m.label}</span>
                <div className={`p-1.5 rounded-lg border ${m.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <div>
                <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  {isAvailable ? m.value : <span className="text-xs text-slate-400 font-medium">Not available</span>}
                  {isAvailable && m.unit && (
                    <span className="text-xs font-normal text-slate-400 ml-1">{m.unit}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
