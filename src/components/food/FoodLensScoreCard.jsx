import React from 'react';
import { Card } from '../ui/card';
import { AnimatedNumber } from '../animation/AnimatedNumber';
import { Award, ShieldCheck, CheckCircle2, AlertCircle, Info, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';

export const FoodLensScoreCard = ({ scoreData }) => {
  if (!scoreData) {
    return (
      <Card className="text-center relative overflow-hidden bg-slate-50 border-slate-200/80 p-6 rounded-3xl">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
          FoodLens Score
        </span>
        <div className="my-6">
          <div className="text-4xl font-extrabold text-slate-300 tracking-tight">—</div>
          <div className="text-xs text-slate-400 mt-1">out of 100</div>
        </div>
        <p className="text-xs text-slate-500">Score calculation unavailable</p>
      </Card>
    );
  }

  const { score = 0, grade = 'Moderate', label = '', version = '1.0', breakdown = [] } = scoreData;

  const getScoreTheme = (s) => {
    if (s >= 85) {
      return {
        stroke: '#10b981', // emerald-500
        tier: 'Excellent',
        tierDesc: 'High nutritional density & clean ingredients',
        bgGradient: 'from-emerald-500/10 via-white to-white',
        border: 'border-emerald-200/80',
        badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        scoreText: 'text-emerald-700',
      };
    }
    if (s >= 70) {
      return {
        stroke: '#0d9488', // teal-600
        tier: 'Good',
        tierDesc: 'Balanced profile with moderate nutrients',
        bgGradient: 'from-teal-500/10 via-white to-white',
        border: 'border-teal-200/80',
        badge: 'bg-teal-50 text-teal-800 border-teal-200',
        scoreText: 'text-teal-700',
      };
    }
    if (s >= 50) {
      return {
        stroke: '#f59e0b', // amber-500
        tier: 'Moderate',
        tierDesc: 'Average nutritional balance or higher sugar/sodium',
        bgGradient: 'from-amber-500/10 via-white to-white',
        border: 'border-amber-200/80',
        badge: 'bg-amber-50 text-amber-900 border-amber-200',
        scoreText: 'text-amber-700',
      };
    }
    if (s >= 30) {
      return {
        stroke: '#f97316', // orange-500
        tier: 'Poor',
        tierDesc: 'Low nutrient density or high processing',
        bgGradient: 'from-orange-500/10 via-white to-white',
        border: 'border-orange-200/80',
        badge: 'bg-orange-50 text-orange-900 border-orange-200',
        scoreText: 'text-orange-700',
      };
    }
    return {
      stroke: '#e11d48', // rose-600
      tier: 'Avoid Frequently',
      tierDesc: 'Ultra-processed or extreme sugar/saturated fat',
      bgGradient: 'from-rose-500/10 via-white to-white',
      border: 'border-rose-200/80',
      badge: 'bg-rose-50 text-rose-900 border-rose-200',
      scoreText: 'text-rose-700',
    };
  };

  const theme = getScoreTheme(score);
  const strokeDashoffset = 283 - (283 * Math.min(Math.max(score, 0), 100)) / 100;

  const positiveFactors = breakdown.filter((item) => item.impact > 0);
  const concernFactors = breakdown.filter((item) => item.impact < 0);

  return (
    <Card
      className={`relative overflow-hidden bg-gradient-to-br ${theme.bgGradient} ${theme.border} p-6 sm:p-7 rounded-3xl shadow-sm space-y-6 bg-white`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-800 bg-white/90 px-3 py-1 rounded-xl border border-slate-200/80 shadow-2xs">
            FoodLens Score
          </span>
          <span className="text-[10px] font-mono text-slate-400 font-bold">v{version}</span>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-black border ${theme.badge} shadow-2xs`}>
          {theme.tier} ({grade})
        </div>
      </div>

      {/* Main Score & Radial Gauge */}
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Radial SVG Gauge */}
        <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
          <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={theme.stroke}
              strokeWidth="8"
              strokeDasharray="283"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className={`text-3xl font-black tracking-tight ${theme.scoreText}`}>
              <AnimatedNumber value={score} />
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400">/ 100</span>
          </div>
        </div>

        {/* Score Context */}
        <div className="space-y-1.5 text-center sm:text-left flex-1">
          <h3 className="text-lg font-black text-slate-900 leading-snug tracking-tight">
            {label || `${theme.tier} Quality`}
          </h3>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            {theme.tierDesc}. Deterministic calculation based on nutrient density, fiber/protein bonuses, and additives.
          </p>
        </div>
      </div>

      {/* Bonus & Deduction Chips Preview */}
      {(positiveFactors.length > 0 || concernFactors.length > 0) && (
        <div className="space-y-3 pt-2">
          {positiveFactors.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Positive Drivers
              </span>
              <div className="flex flex-wrap gap-1.5">
                {positiveFactors.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-2xs"
                  >
                    <span>{typeof item.factor === 'string' ? item.factor : (item.factor?.name || item.factor?.message || 'Factor')}</span>
                    <span className="text-[11px] font-mono text-emerald-600">+{item.impact}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {concernFactors.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-700 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> Deductions
              </span>
              <div className="flex flex-wrap gap-1.5">
                {concernFactors.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold shadow-2xs"
                  >
                    <span>{typeof item.factor === 'string' ? item.factor : (item.factor?.name || item.factor?.message || 'Factor')}</span>
                    <span className="text-[11px] font-mono text-rose-600">{item.impact}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Breakdown Factors Detailed List */}
      {breakdown.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-200/70">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Explainable Score Drivers
            </h4>
            <span className="text-[11px] text-slate-400 font-bold">
              {breakdown.length} criteria evaluated
            </span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {breakdown.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs py-2 px-3.5 rounded-xl bg-white/90 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                  {item.impact > 0 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  ) : item.impact < 0 ? (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                  ) : (
                    <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  )}
                  <span className="font-bold text-slate-800 truncate">
                    {typeof item.factor === 'string' ? item.factor : (item.factor?.name || item.factor?.message || 'Factor')}
                  </span>
                  {item.value !== null && (
                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      ({typeof item.value === 'object' ? (item.value.value ?? '') : item.value} {item.unit || ''})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <span className="text-[11px] text-slate-500 hidden md:inline truncate max-w-[150px]">
                    {typeof item.reason === 'string' ? item.reason : (item.reason?.message || '')}
                  </span>
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded-lg text-xs ${
                      item.impact > 0
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : item.impact < 0
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.impact > 0 ? `+${item.impact}` : item.impact}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
