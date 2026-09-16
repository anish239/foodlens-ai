import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { PageTransition } from '../../components/animation/PageTransition';
import { foodService } from '../../services/foodService';
import { NutritionPreview } from '../../components/food/NutritionPreview';
import { IngredientPreview } from '../../components/food/IngredientPreview';
import { AllergenBadge } from '../../components/food/AllergenBadge';
import { FoodLensScoreCard } from '../../components/food/FoodLensScoreCard';
import { CompatibilityBadge } from '../../components/food/CompatibilityBadge';
import { AIInsightCard } from '../../components/food/AIInsightCard';
import { ProductNotFoundState } from '../../components/food/ProductNotFoundState';
import { ManualProductModal } from '../../components/food/ManualProductModal';
import { useApp } from '../../context/AppContext';
import {
  ArrowLeft,
  Heart,
  Share2,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Barcode,
  Globe,
  Scale,
  Check,
  UserCheck,
  Edit3,
  Info,
} from 'lucide-react';

export const ProductDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isInCompare, addToCompare, removeFromCompare } = useApp();

  const [product, setProduct] = useState(null);
  const [scoreData, setScoreData] = useState(null);
  const [compatibilityData, setCompatibilityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isNotFound, setIsNotFound] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // AI Insight State
  const [aiInsightData, setAiInsightData] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  const fetchAIInsight = useCallback(async (barcode) => {
    if (!barcode) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await foodService.getProductInsight(barcode);
      if (res.success && res.data.insight) {
        setAiInsightData(res.data.insight);
      } else {
        setAiError('AI insights are temporarily unavailable.');
      }
    } catch (err) {
      console.warn('AI insight fetch error:', err.message);
      setAiError(err.message || 'AI service unavailable.');
    } finally {
      setAiLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      setError('');
      setIsNotFound(false);
      try {
        const [scoreRes, compatRes, favRes] = await Promise.all([
          foodService.getProductScore(id),
          foodService.getProductCompatibility(id),
          foodService.checkIsFavorite(id).catch(() => ({ data: { isFavorite: false } })),
        ]);

        if (scoreRes.success && scoreRes.data.product) {
          setProduct(scoreRes.data.product);
          setScoreData(scoreRes.data.score);
        }
        if (compatRes.success && compatRes.data.compatibility) {
          setCompatibilityData(compatRes.data.compatibility);
        }
        if (favRes?.data) {
          setIsFavorite(!!favRes.data.isFavorite);
        }
        if (!scoreRes.success && !compatRes.success) {
          setIsNotFound(true);
          setError('Product not found');
          return;
        }

        fetchAIInsight(id);
      } catch (err) {
        const notFound =
          err.status === 404 ||
          err.data?.error?.errorType === 'PRODUCT_NOT_FOUND' ||
          err.message?.toLowerCase().includes('not found');
        if (notFound) {
          setIsNotFound(true);
        }
        setError(err.message || 'Failed to retrieve product analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, fetchAIInsight]);

  const handleFavoriteToggle = async () => {
    if (!product || favoriteLoading) return;
    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await foodService.removeFavorite(product.barcode);
        setIsFavorite(false);
      } else {
        await foodService.addFavorite(product.barcode);
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('Failed to update favorite status:', err);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="text-sm font-bold text-slate-600">
          Analyzing product nutrition and dietary compatibility...
        </p>
      </div>
    );
  }

  if (isNotFound || (!product && error?.toLowerCase().includes('not found'))) {
    return (
      <ProductNotFoundState
        barcode={id}
        onProductEntered={(newProduct, newScore, newCompat) => {
          setProduct(newProduct);
          setScoreData(newScore);
          setCompatibilityData(newCompat);
          setIsNotFound(false);
          setError('');
        }}
      />
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900">Unable to Load Product</h2>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            {error || "We couldn't load product data at this time."}
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <Button variant="primary" onClick={() => navigate('/app/scanner')} className="rounded-xl font-bold">
            Scan Barcode
          </Button>
          <Button variant="outline" onClick={() => navigate('/app/dashboard')} className="rounded-xl font-bold">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const inCompare = product ? isInCompare(product.barcode) : false;

  const handleCompareClick = () => {
    if (!product) return;
    if (inCompare) {
      removeFromCompare(product.barcode);
    } else {
      addToCompare(product);
    }
  };

  const isUserProvided = product.source === 'user-provided' || product.isUserProvided;

  return (
    <PageTransition className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="rounded-xl font-bold gap-1.5 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant={inCompare ? 'primary' : 'outline'}
            size="sm"
            onClick={handleCompareClick}
            className="rounded-xl font-bold gap-1.5 shadow-2xs"
          >
            {inCompare ? <Check className="w-4 h-4" /> : <Scale className="w-4 h-4" />}
            <span>{inCompare ? 'In Comparison' : 'Add to Compare'}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleFavoriteToggle}
            disabled={favoriteLoading}
            className={`rounded-xl font-bold gap-1.5 shadow-2xs ${
              isFavorite
                ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                : 'text-slate-700'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span>{isFavorite ? 'Favorited' : 'Save Favorite'}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="rounded-xl font-bold gap-1.5 shadow-2xs text-slate-700"
          >
            <Share2 className="w-4 h-4" />
            <span>{copiedShare ? 'Copied Link!' : 'Share'}</span>
          </Button>
        </div>
      </div>

      {isUserProvided && (
        <div className="p-4 bg-amber-50 border border-amber-200/90 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-amber-950">User-Provided Product Data</p>
              <p className="text-amber-800/90 font-medium">
                This product was manually submitted. Missing nutrients remain neutral and are not estimated.
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setIsEditModalOpen(true)}
            className="border-amber-300 text-amber-900 hover:bg-amber-100 rounded-xl font-bold gap-1.5 bg-white"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Info</span>
          </Button>
        </div>
      )}

      {(product.isPartial || product.status === 'partial') && !isUserProvided && (
        <div className="p-4 bg-sky-50 border border-sky-200/90 rounded-2xl flex items-center gap-3 text-xs text-sky-900 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center flex-shrink-0 font-bold">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-sky-950">Partial Product Information</p>
            <p className="text-sky-800/90 font-medium">
              Product found, but some nutritional information is unavailable in connected catalogs.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Product Overview Header */}
        <div className="md:col-span-2 space-y-6">
          <Card className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 sm:p-8 rounded-3xl border-slate-200/80 shadow-sm">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 font-bold text-xl flex-shrink-0 overflow-hidden shadow-inner">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-contain p-2"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Barcode className="w-10 h-10 text-slate-300" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  {product.brand || 'Unspecified Brand'}
                </span>
                {isUserProvided && (
                  <Badge variant="warning" className="text-[11px] font-bold gap-1 rounded-full">
                    <UserCheck className="w-3 h-3" />
                    User-Provided
                  </Badge>
                )}
                {product.resolverMetadata?.fallbackUsed && (
                  <Badge variant="info" className="text-[11px] font-bold gap-1 rounded-full">
                    Multi-Source Fallback
                  </Badge>
                )}
                {product.resolverMetadata?.enrichmentApplied && (
                  <Badge variant="default" className="text-[11px] font-bold gap-1 rounded-full bg-indigo-50 text-indigo-800 border-indigo-200">
                    USDA Enriched
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1 mb-2">
                {product.name}
              </h1>
              <p className="text-xs text-slate-500 mb-4 flex items-center gap-2 flex-wrap font-medium">
                <span>
                  Barcode: <strong className="font-mono text-slate-700">{product.barcode}</strong>
                </span>
                {product.quantity && <span>• Quantity: {product.quantity}</span>}
                {product.servingSize && <span>• Serving: {product.servingSize}</span>}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {product.nutriscore && (
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-700 text-white font-black text-xs uppercase tracking-wide">
                    Nutri-Score {product.nutriscore}
                  </span>
                )}
                {product.novaGroup && (
                  <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-white font-bold text-xs">
                    NOVA Group {product.novaGroup}
                  </span>
                )}
              </div>

              <AllergenBadge allergens={product.allergens} />
            </div>
          </Card>

          {/* Nutrition Facts */}
          <NutritionPreview
            nutrition={{
              calories: product.nutrition?.energyKcal,
              protein: product.nutrition?.proteins,
              carbs: product.nutrition?.carbohydrates,
              fat: product.nutrition?.fat,
              sugar: product.nutrition?.sugars,
              fiber: product.nutrition?.fiber,
              saturatedFat: product.nutrition?.saturatedFat,
              sodium: product.nutrition?.sodium,
            }}
          />

          {/* Ingredients Analysis */}
          <Card className="p-6 sm:p-7 rounded-3xl border-slate-200/80 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-3">Ingredients</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4 font-medium">
              {product.ingredients?.text || 'Ingredients list is not provided for this product.'}
            </p>
            {product.traces && product.traces.length > 0 && (
              <div className="text-xs text-slate-600 bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/90 font-medium">
                <strong>May contain traces of:</strong> {product.traces.join(', ')}
              </div>
            )}
          </Card>

          {/* Source Attribution */}
          <Card className="bg-slate-50 border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 rounded-3xl shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
                <Globe className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  {isUserProvided
                    ? 'User-Provided Product Record'
                    : product.source === 'usda_fooddata_central'
                    ? 'USDA FoodData Central Attribution'
                    : product.source === 'secondary'
                    ? 'Secondary Retail Catalog Attribution'
                    : 'Open Food Facts Source Attribution'}
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  {isUserProvided
                    ? 'Information provided via manual entry for this barcode session.'
                    : product.source === 'usda_fooddata_central'
                    ? 'Nutritional facts and item identity sourced directly from the USDA FoodData Central database.'
                    : product.source === 'secondary'
                    ? `Item identity sourced via secondary provider.${
                        product.resolverMetadata?.enrichmentApplied ? ' Enriched with USDA FoodData Central nutrition facts.' : ''
                      }`
                    : `Product information sourced from the Open Food Facts global database.${
                        product.resolverMetadata?.enrichmentApplied ? ' Enriched with USDA nutrition facts.' : ''
                      }`}
                </p>
              </div>
            </div>
            {product.sourceUrl && !isUserProvided && (
              <a
                href={product.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs whitespace-nowrap"
              >
                <span>View Source</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </Card>
        </div>

        {/* Sidebar Analytics */}
        <div className="space-y-6">
          <FoodLensScoreCard scoreData={scoreData} />
          <CompatibilityBadge compatibilityData={compatibilityData} />
          <AIInsightCard
            insightData={aiInsightData}
            loading={aiLoading}
            error={aiError}
            onRetry={() => fetchAIInsight(id)}
          />
        </div>
      </div>

      <ManualProductModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialBarcode={product.barcode}
        onSuccess={(updatedProduct, updatedScore, updatedCompat) => {
          setProduct(updatedProduct);
          setScoreData(updatedScore);
          setCompatibilityData(updatedCompat);
        }}
      />
    </PageTransition>
  );
};
