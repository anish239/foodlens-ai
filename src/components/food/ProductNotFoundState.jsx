import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { ManualProductModal } from './ManualProductModal';
import {
  Search,
  ScanBarcode,
  Edit3,
  Sparkles,
  ArrowLeft,
  Copy,
  Check,
  PackageX,
} from 'lucide-react';

export const ProductNotFoundState = ({
  barcode,
  onProductEntered,
  onResetScan,
  compact = false,
}) => {
  const navigate = useNavigate();
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [copiedBarcode, setCopiedBarcode] = useState(false);

  const handleCopyBarcode = () => {
    if (!barcode) return;
    navigator.clipboard?.writeText(barcode);
    setCopiedBarcode(true);
    setTimeout(() => setCopiedBarcode(false), 2000);
  };

  const handleManualSuccess = (product, score, compatibility) => {
    if (onProductEntered) {
      onProductEntered(product, score, compatibility);
    } else {
      navigate(`/app/product/${product.barcode}`);
    }
  };

  return (
    <>
      <div className={`mx-auto ${compact ? 'max-w-xl' : 'max-w-2xl'} py-6 px-4`}>
        <Card className="text-center p-8 sm:p-10 border-slate-200/90 shadow-sm rounded-3xl bg-white space-y-6">
          {/* Visual Icon */}
          <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto border border-slate-200/80 shadow-2xs">
            <PackageX className="w-8 h-8 stroke-[1.8]" />
          </div>

          {/* Title & Description */}
          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Product not found</h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
              We couldn't find this product across our primary and fallback food databases (Open Food Facts &amp; USDA FoodData Central). You can easily enter the package details or scan the nutrition label with Gemini.
            </p>
          </div>

          {/* Barcode Badge */}
          {barcode && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-mono shadow-2xs">
              <span className="text-slate-400 font-sans font-medium">Scanned Barcode:</span>
              <span className="font-bold text-slate-900">{barcode}</span>
              <button
                type="button"
                onClick={handleCopyBarcode}
                className="ml-1 text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-200/60 transition-colors"
                title="Copy Barcode"
              >
                {copiedBarcode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          {/* Action Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto text-left">
            <button
              type="button"
              onClick={() => setIsManualModalOpen(true)}
              className="p-4 rounded-2xl border border-emerald-200/90 bg-emerald-50/50 hover:bg-emerald-50 text-slate-900 transition-all flex items-start gap-3.5 group shadow-2xs"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                <Edit3 className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-950">Enter Product Information</p>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Add packaging info &amp; get instant score</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate('/app/search')}
              className="p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 transition-all flex items-start gap-3.5 group shadow-2xs"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Search className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Search Product Manually</p>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Search by brand or food name</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => (onResetScan ? onResetScan() : navigate('/app/scanner'))}
              className="p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 transition-all flex items-start gap-3.5 group shadow-2xs"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <ScanBarcode className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Try Another Scan</p>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Scan a different product package</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate('/app/analysis')}
              className="p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 transition-all flex items-start gap-3.5 group shadow-2xs"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Scan Label with AI</p>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Upload nutrition label photo</p>
              </div>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app/dashboard')}
              className="rounded-xl gap-2 font-semibold text-slate-600"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Button>
          </div>
        </Card>
      </div>

      <ManualProductModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        initialBarcode={barcode || ''}
        onSuccess={handleManualSuccess}
      />
    </>
  );
};
