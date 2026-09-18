import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { useApp } from '../../context/AppContext';
import { Package, ExternalLink, Scale, Check, AlertCircle } from 'lucide-react';

export const ProductSearchCard = ({ product }) => {
  const { isInCompare, addToCompare, removeFromCompare } = useApp();
  const [imageError, setImageError] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  if (!product) return null;

  const inCompare = isInCompare(product.barcode);

  const handleCompareToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (inCompare) {
      removeFromCompare(product.barcode);
    } else {
      const result = addToCompare(product);
      if (!result.success && result.message) {
        setToastMessage(result.message);
        setTimeout(() => setToastMessage(null), 3000);
      }
    }
  };

  const getNutriScoreColor = (grade) => {
    switch (String(grade).toUpperCase()) {
      case 'A': return 'bg-emerald-600 text-white';
      case 'B': return 'bg-emerald-500 text-white';
      case 'C': return 'bg-amber-400 text-slate-900';
      case 'D': return 'bg-orange-500 text-white';
      case 'E': return 'bg-rose-600 text-white';
      default: return 'bg-slate-200 text-slate-700';
    }
  };

  const getNovaColor = (group) => {
    switch (Number(group)) {
      case 1: return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 2: return 'bg-sky-100 text-sky-800 border-sky-300';
      case 3: return 'bg-amber-100 text-amber-800 border-amber-300';
      case 4: return 'bg-rose-100 text-rose-800 border-rose-300';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const energyKcal = product.nutrition?.energyKcal ?? product.nutrition?.calories;

  return (
    <Card className="flex flex-col h-full overflow-hidden hover:border-emerald-300 hover:shadow-lg transition-all duration-300 group relative rounded-3xl bg-white border-slate-200/90">
      {/* Toast message if compare limit is reached */}
      {toastMessage && (
        <div className="absolute top-3 inset-x-3 z-30 bg-slate-900/95 text-white text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-xl backdrop-blur-sm animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span className="font-medium">{typeof toastMessage === 'string' ? toastMessage : (toastMessage?.message || '')}</span>
        </div>
      )}

      {/* Top Image & Badges */}
      <div className="relative w-full h-48 bg-slate-50 flex items-center justify-center p-4 border-b border-slate-100 overflow-hidden">
        {product.image && !imageError ? (
          <img
            src={product.image}
            alt={`${product.name} package`}
            className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-300">
            <Package className="w-12 h-12 stroke-[1.5]" />
            <span className="text-[11px] text-slate-400 mt-1 font-medium">No Image Available</span>
          </div>
        )}

        {/* Quality Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.nutriscore && (
            <span
              className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-2xs ${getNutriScoreColor(
                product.nutriscore
              )}`}
              title={`Nutri-Score Grade ${product.nutriscore}`}
            >
              Nutri-Score {product.nutriscore}
            </span>
          )}
          {product.novaGroup && (
            <span
              className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold shadow-2xs ${getNovaColor(
                product.novaGroup
              )}`}
              title={`NOVA Group ${product.novaGroup}`}
            >
              NOVA {product.novaGroup}
            </span>
          )}
        </div>

        {product.quantity && (
          <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
            {product.quantity}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <p className="text-xs font-bold text-emerald-700 tracking-wider uppercase line-clamp-1">
            {product.brand || 'Brand Unspecified'}
          </p>
          <h3
            className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 mt-1"
            title={product.name}
          >
            {product.name}
          </h3>
        </div>

        {/* Key Quick Indicators */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="font-mono text-[11px] text-slate-400 font-medium">
            #{product.barcode}
          </span>
          {energyKcal != null ? (
            <span className="font-bold text-slate-700">
              {energyKcal} kcal <span className="text-[10px] font-normal text-slate-400">/ 100g</span>
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">Nutrition n/a</span>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Link
            to={`/app/product/${product.barcode}`}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200/80 transition-colors shadow-2xs"
          >
            <span>Details</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={handleCompareToggle}
            className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all border shadow-2xs ${
              inCompare
                ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            {inCompare ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                <span>Added</span>
              </>
            ) : (
              <>
                <Scale className="w-3.5 h-3.5 text-slate-400" />
                <span>Compare</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Card>
  );
};
