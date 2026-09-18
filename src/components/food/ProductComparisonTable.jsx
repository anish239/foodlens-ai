import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Trash2,
  ChevronDown,
  ChevronUp,
  Package,
  Info,
  ShieldCheck,
  HeartPulse,
  Flame,
} from 'lucide-react';

export const ProductComparisonTable = ({ comparisonData, onRemoveProduct }) => {
  const [expandedIngredients, setExpandedIngredients] = useState({});

  if (!comparisonData || !comparisonData.products || comparisonData.products.length === 0) {
    return null;
  }

  const { products } = comparisonData;

  const toggleIngredients = (barcode) => {
    setExpandedIngredients((prev) => ({
      ...prev,
      [barcode]: !prev[barcode],
    }));
  };

  const getScoreBadge = (score) => {
    if (score == null) return { bg: 'bg-slate-100 text-slate-700', label: '—' };
    if (score >= 85) return { bg: 'bg-emerald-700 text-white', label: 'Excellent' };
    if (score >= 70) return { bg: 'bg-emerald-600 text-white', label: 'Good' };
    if (score >= 50) return { bg: 'bg-amber-600 text-white', label: 'Moderate' };
    if (score >= 30) return { bg: 'bg-orange-600 text-white', label: 'Poor' };
    return { bg: 'bg-rose-700 text-white', label: 'Avoid' };
  };

  const getCompatibilityBadge = (compatibility) => {
    if (!compatibility) return null;
    const status = compatibility.status;
    if (status === 'compatible') {
      return (
        <Badge variant="success" className="gap-1.5 py-1 px-3 text-xs font-bold rounded-full">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Compatible</span>
        </Badge>
      );
    }
    if (status === 'caution') {
      return (
        <Badge variant="warning" className="gap-1.5 py-1 px-3 text-xs font-bold rounded-full">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Caution</span>
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="gap-1.5 py-1 px-3 text-xs font-bold rounded-full">
        <XCircle className="w-3.5 h-3.5" />
        <span>Not Compatible</span>
      </Badge>
    );
  };

  const getNutriScoreColor = (grade) => {
    switch (String(grade).toUpperCase()) {
      case 'A': return 'bg-emerald-700 text-white';
      case 'B': return 'bg-emerald-500 text-white';
      case 'C': return 'bg-amber-500 text-slate-950 font-black';
      case 'D': return 'bg-orange-600 text-white';
      case 'E': return 'bg-rose-700 text-white';
      default: return 'bg-slate-200 text-slate-700';
    }
  };

  const getNovaColor = (group) => {
    switch (Number(group)) {
      case 1: return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 2: return 'bg-sky-50 text-sky-800 border-sky-300';
      case 3: return 'bg-amber-50 text-amber-900 border-amber-300';
      case 4: return 'bg-rose-50 text-rose-900 border-rose-300';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const formatNutrient = (value, unit = 'g') => {
    if (value == null) return '—';
    if (typeof value === 'object') {
      const num = value.value ?? value.amount;
      if (num == null || isNaN(num)) return '—';
      const u = value.unit || unit;
      return `${Number(num).toFixed(1).replace(/\.0$/, '')} ${u}`;
    }
    if (isNaN(value)) return '—';
    return `${Number(value).toFixed(1).replace(/\.0$/, '')} ${unit}`;
  };

  const getPositives = (score) => {
    if (!score) return [];
    if (Array.isArray(score.breakdown?.positives)) return score.breakdown.positives;
    if (Array.isArray(score.breakdown)) return score.breakdown.filter((item) => item && item.impact > 0);
    if (Array.isArray(score.positives)) return score.positives;
    return [];
  };

  const getConcerns = (score) => {
    if (!score) return [];
    if (Array.isArray(score.breakdown?.concerns)) return score.breakdown.concerns;
    if (Array.isArray(score.breakdown)) return score.breakdown.filter((item) => item && item.impact < 0);
    if (Array.isArray(score.concerns)) return score.concerns;
    return [];
  };

  const getConflicts = (compatibility) => {
    if (!compatibility) return [];
    if (Array.isArray(compatibility.conflicts)) return compatibility.conflicts;
    if (Array.isArray(compatibility.reasons)) return compatibility.reasons;
    return [];
  };

  const getWarnings = (compatibility) => {
    if (!compatibility) return [];
    if (Array.isArray(compatibility.warnings)) return compatibility.warnings;
    return [];
  };

  const getItemText = (item, fallback = '') => {
    if (!item) return fallback;
    if (typeof item === 'string') return item;
    return item.message || item.reason || item.allergen || item.matchedValue || item.text || item.factor || fallback;
  };

  return (
    <div className="space-y-6">
      {/* Horizontal Scrollable Table Wrapper */}
      <div className="overflow-x-auto pb-4 -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle px-4 sm:px-0">
          <div className="border border-slate-200/90 rounded-3xl overflow-hidden bg-white shadow-sm">
            {/* 1. Header Row (Product Cards) */}
            <div className="grid grid-cols-[200px_repeat(auto-fit,minmax(220px,1fr))] bg-slate-50/80 border-b border-slate-200 divide-x divide-slate-200 min-w-[750px]">
              {/* Left Attribute Label Header */}
              <div className="p-5 flex flex-col justify-end bg-slate-100/60">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                  Comparing {products.length} Products
                </span>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">
                  Side-by-side nutritional &amp; dietary evaluation
                </p>
              </div>

              {/* Product Columns */}
              {products.map(({ product }) => (
                <div key={product.barcode} className="p-5 flex flex-col bg-white">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="font-mono text-[10px] font-bold text-slate-400 truncate">
                      #{product.barcode}
                    </span>
                    {onRemoveProduct && (
                      <button
                        type="button"
                        onClick={() => onRemoveProduct(product.barcode)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Remove from comparison"
                        aria-label={`Remove ${product.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Image */}
                  <div className="w-full h-32 bg-slate-50 rounded-2xl flex items-center justify-center p-2 mb-3 border border-slate-100 overflow-hidden shadow-2xs">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="max-h-full max-w-full object-contain mix-blend-multiply"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Package className="w-10 h-10 text-slate-300" />
                    )}
                  </div>

                  {/* Brand & Name */}
                  <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide truncate">
                    {product.brand || '—'}
                  </p>
                  <h4 className="font-black text-slate-900 text-sm line-clamp-2 mt-0.5" title={product.name}>
                    {product.name}
                  </h4>

                  {/* Link to Details */}
                  <Link
                    to={`/app/product/${product.barcode}`}
                    className="mt-3 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold rounded-xl transition-colors shadow-2xs"
                  >
                    <span>Full Details</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>

            {/* 2. SECTION: FOODLENS HEALTH SCORE */}
            <div className="bg-slate-950 text-white px-5 py-3 font-black text-xs flex items-center gap-2.5 tracking-wider uppercase">
              <HeartPulse className="w-4 h-4 text-emerald-400" />
              <span>FoodLens Health Score (0–100)</span>
            </div>

            <div className="grid grid-cols-[200px_repeat(auto-fit,minmax(220px,1fr))] border-b border-slate-200 divide-x divide-slate-200 min-w-[750px]">
              <div className="p-5 bg-slate-50/50 font-bold text-xs text-slate-700 flex items-center">
                Overall Health Score
              </div>
              {products.map(({ product, score }) => {
                const s = score?.score ?? null;
                const badge = getScoreBadge(s);
                return (
                  <div key={product.barcode} className="p-5 flex flex-col justify-center">
                    <div className="flex items-center gap-2.5">
                      <span className="text-3xl font-black text-slate-900">{s ?? '—'}</span>
                      {s != null && (
                        <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-black tracking-wide ${badge.bg}`}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                    {score?.breakdown && (
                      <p className="text-[11px] text-slate-500 mt-1 font-medium">
                        Base: 100 • Deductions: -{Array.isArray(score.breakdown)
                          ? Math.abs(score.breakdown.filter((f) => f && f.impact < 0).reduce((acc, f) => acc + f.impact, 0))
                          : (score.breakdown.deductions?.total || 0)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-[200px_repeat(auto-fit,minmax(220px,1fr))] border-b border-slate-200 divide-x divide-slate-200 min-w-[750px]">
              <div className="p-5 bg-slate-50/50 font-bold text-xs text-slate-700">
                Key Positives
              </div>
              {products.map(({ product, score }) => {
                const positives = getPositives(score);
                return (
                  <div key={product.barcode} className="p-5 text-xs text-slate-600 font-medium">
                    {positives.length > 0 ? (
                      <ul className="space-y-1.5">
                        {positives.map((pos, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-emerald-800 text-xs">
                            <span className="text-emerald-500 font-black">•</span>
                            <span>{getItemText(pos, 'Favorable nutrient profile')}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-slate-400 text-xs">None identified</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-[200px_repeat(auto-fit,minmax(220px,1fr))] border-b border-slate-200 divide-x divide-slate-200 min-w-[750px]">
              <div className="p-5 bg-slate-50/50 font-bold text-xs text-slate-700">
                Nutritional Concerns
              </div>
              {products.map(({ product, score }) => {
                const concerns = getConcerns(score);
                return (
                  <div key={product.barcode} className="p-5 text-xs text-slate-600 font-medium">
                    {concerns.length > 0 ? (
                      <ul className="space-y-1.5">
                        {concerns.map((con, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-rose-800 text-xs">
                            <span className="text-rose-500 font-black">•</span>
                            <span>{getItemText(con, 'Nutritional deduction')}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-emerald-700 text-xs font-bold">No major concerns</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 3. SECTION: DIETARY COMPATIBILITY */}
            <div className="bg-slate-900 text-white px-5 py-3 font-black text-xs flex items-center gap-2.5 tracking-wider uppercase">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Your Dietary Compatibility</span>
            </div>

            <div className="grid grid-cols-[200px_repeat(auto-fit,minmax(220px,1fr))] border-b border-slate-200 divide-x divide-slate-200 min-w-[750px]">
              <div className="p-5 bg-slate-50/50 font-bold text-xs text-slate-700 flex items-center">
                Preference Fit
              </div>
              {products.map(({ product, compatibility }) => (
                <div key={product.barcode} className="p-5 flex flex-col justify-center">
                  <div>{getCompatibilityBadge(compatibility)}</div>
                  {compatibility?.summary && (
                    <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 font-medium">
                      {typeof compatibility.summary === 'string'
                        ? compatibility.summary
                        : (compatibility.summary?.message || '')}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-[200px_repeat(auto-fit,minmax(220px,1fr))] border-b border-slate-200 divide-x divide-slate-200 min-w-[750px]">
              <div className="p-5 bg-slate-50/50 font-bold text-xs text-slate-700">
                Dietary Conflicts &amp; Warnings
              </div>
              {products.map(({ product, compatibility }) => {
                const conflicts = getConflicts(compatibility);
                const warnings = getWarnings(compatibility);
                const hasIssues = conflicts.length > 0 || warnings.length > 0;

                return (
                  <div key={product.barcode} className="p-5 text-xs text-slate-600 font-medium">
                    {hasIssues ? (
                      <div className="space-y-1.5">
                        {conflicts.map((conf, idx) => (
                          <div key={idx} className="text-rose-800 text-xs font-bold flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>{getItemText(conf, 'Dietary conflict detected')}</span>
                          </div>
                        ))}
                        {warnings.map((warn, idx) => (
                          <div key={idx} className="text-amber-800 text-xs font-medium flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>{getItemText(warn, 'Dietary warning detected')}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Fits all configured preferences
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 4. SECTION: NUTRITION FACTS */}
            <div className="bg-slate-800 text-white px-5 py-3 font-black text-xs flex items-center gap-2.5 tracking-wider uppercase">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Nutrition Facts (per 100g / 100ml)</span>
            </div>

            {[
              { key: 'energyKcal', label: 'Calories', unit: 'kcal' },
              { key: 'sugars', label: 'Sugars', unit: 'g' },
              { key: 'saturatedFat', label: 'Saturated Fat', unit: 'g' },
              { key: 'fat', label: 'Total Fat', unit: 'g' },
              { key: 'carbohydrates', label: 'Carbohydrates', unit: 'g' },
              { key: 'fiber', label: 'Dietary Fiber', unit: 'g' },
              { key: 'proteins', label: 'Proteins', unit: 'g' },
              { key: 'salt', label: 'Salt', unit: 'g' },
              { key: 'sodium', label: 'Sodium', unit: 'g' },
            ].map(({ key, label, unit }) => (
              <div
                key={key}
                className="grid grid-cols-[200px_repeat(auto-fit,minmax(220px,1fr))] border-b border-slate-200 divide-x divide-slate-200 min-w-[750px] hover:bg-slate-50/60 transition-colors"
              >
                <div className="p-3.5 bg-slate-50/70 font-semibold text-xs text-slate-700 flex items-center justify-between">
                  <span>{label}</span>
                  <span className="text-[10px] text-slate-400">({unit})</span>
                </div>
                {products.map(({ product }) => (
                  <div key={product.barcode} className="p-3.5 text-xs text-slate-800 font-bold flex items-center">
                    {formatNutrient(product.nutrition?.[key], unit)}
                  </div>
                ))}
              </div>
            ))}

            {/* 5. SECTION: PROCESSING & QUALITY */}
            <div className="bg-slate-900 text-white px-5 py-3 font-black text-xs flex items-center gap-2.5 tracking-wider uppercase">
              <Info className="w-4 h-4 text-sky-400" />
              <span>Quality &amp; Processing Grades</span>
            </div>

            <div className="grid grid-cols-[200px_repeat(auto-fit,minmax(220px,1fr))] border-b border-slate-200 divide-x divide-slate-200 min-w-[750px]">
              <div className="p-4 bg-slate-50/50 font-bold text-xs text-slate-700 flex items-center">
                Nutri-Score
              </div>
              {products.map(({ product }) => (
                <div key={product.barcode} className="p-4 flex items-center">
                  {product.nutriscore ? (
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wide ${getNutriScoreColor(
                        product.nutriscore
                      )}`}
                    >
                      Grade {product.nutriscore}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs">—</span>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-[200px_repeat(auto-fit,minmax(220px,1fr))] border-b border-slate-200 divide-x divide-slate-200 min-w-[750px]">
              <div className="p-4 bg-slate-50/50 font-bold text-xs text-slate-700 flex items-center">
                NOVA Processing Group
              </div>
              {products.map(({ product }) => (
                <div key={product.barcode} className="p-4 flex items-center">
                  {product.novaGroup ? (
                    <span
                      className={`px-3 py-1 rounded-xl border text-xs font-black ${getNovaColor(
                        product.novaGroup
                      )}`}
                    >
                      NOVA {product.novaGroup}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs">—</span>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-[200px_repeat(auto-fit,minmax(220px,1fr))] border-b border-slate-200 divide-x divide-slate-200 min-w-[750px]">
              <div className="p-4 bg-slate-50/50 font-bold text-xs text-slate-700 flex items-center">
                Package / Serving
              </div>
              {products.map(({ product }) => (
                <div key={product.barcode} className="p-4 text-xs text-slate-700 font-semibold">
                  {product.quantity || product.servingSize ? (
                    <span>
                      {product.quantity || '—'}
                      {product.servingSize ? ` (Serving: ${product.servingSize})` : ''}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </div>
              ))}
            </div>

            {/* 6. SECTION: INGREDIENTS & ALLERGENS */}
            <div className="bg-slate-900 text-white px-5 py-3 font-black text-xs flex items-center gap-2.5 tracking-wider uppercase">
              <Package className="w-4 h-4 text-emerald-400" />
              <span>Ingredients &amp; Allergen Declarations</span>
            </div>

            <div className="grid grid-cols-[200px_repeat(auto-fit,minmax(220px,1fr))] border-b border-slate-200 divide-x divide-slate-200 min-w-[750px]">
              <div className="p-5 bg-slate-50/50 font-bold text-xs text-slate-700">
                Declared Allergens
              </div>
              {products.map(({ product }) => (
                <div key={product.barcode} className="p-5 text-xs">
                  {product.allergens && product.allergens.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {product.allergens.map((a, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold"
                        >
                          {getItemText(a, 'Allergen')}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs font-medium">None declared on package</span>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-[200px_repeat(auto-fit,minmax(220px,1fr))] divide-x divide-slate-200 min-w-[750px]">
              <div className="p-5 bg-slate-50/50 font-bold text-xs text-slate-700">
                Ingredients Text
              </div>
              {products.map(({ product }) => {
                const isExpanded = expandedIngredients[product.barcode];
                const text = product.ingredients?.text || null;
                return (
                  <div key={product.barcode} className="p-5 text-xs text-slate-600 font-medium">
                    {text ? (
                      <div>
                        <p className={`text-xs leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
                          {text}
                        </p>
                        <button
                          type="button"
                          onClick={() => toggleIngredients(product.barcode)}
                          className="mt-2 text-emerald-700 hover:text-emerald-800 font-bold text-xs inline-flex items-center gap-1"
                        >
                          <span>{isExpanded ? 'Show less' : 'Show full ingredients'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">Ingredients text not available</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
