import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/button';
import { ArrowRight, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function ComparisonDock() {
  const { compareItems, removeFromCompare, clearCompare } = useApp();
  const navigate = useNavigate();

  if (!compareItems || compareItems.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 24, stiffness: 300 }}
        className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-2xl"
      >
        <div className="bg-slate-900/95 text-white backdrop-blur-md px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl shadow-2xl border border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-x-auto py-1">
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs sm:text-sm font-bold text-slate-200">
                {compareItems.length} {compareItems.length === 1 ? 'Product' : 'Products'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {compareItems.map((item) => (
                <div
                  key={item.barcode}
                  className="relative group flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 pl-1.5 pr-2 py-1 rounded-xl text-xs flex-shrink-0"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-5 h-5 object-contain rounded bg-white p-0.5"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded bg-slate-700 flex items-center justify-center text-[10px] font-bold text-emerald-400">
                      {item.name ? item.name.charAt(0).toUpperCase() : 'P'}
                    </div>
                  )}
                  <span className="max-w-[80px] sm:max-w-[110px] truncate font-medium text-slate-200">
                    {item.name}
                  </span>
                  <button
                    onClick={() => removeFromCompare(item.barcode)}
                    className="text-slate-400 hover:text-white rounded-full p-0.5 transition-colors"
                    title="Remove from comparison"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={clearCompare}
              className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 transition-colors hidden sm:block"
            >
              Clear
            </button>
            <Button
              size="sm"
              onClick={() => {
                const barcodes = compareItems.map((i) => i.barcode).join(',');
                navigate(`/app/compare?barcodes=${barcodes}`);
              }}
              disabled={compareItems.length < 2}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs sm:text-sm h-8 px-3 rounded-xl gap-1.5"
            >
              <span>Compare</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
