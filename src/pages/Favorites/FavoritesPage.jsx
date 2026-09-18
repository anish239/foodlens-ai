import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { EmptyState } from '../../components/common/EmptyState';
import { PageTransition } from '../../components/animation/PageTransition';
import { foodService } from '../../services/foodService';
import { useApp } from '../../context/AppContext';
import {
  Heart,
  Search,
  Trash2,
  Scale,
  Check,
  Calendar,
  AlertCircle,
  Loader2,
  ScanBarcode,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Package,
} from 'lucide-react';

export const FavoritesPage = () => {
  const navigate = useNavigate();
  const { isInCompare, addToCompare, removeFromCompare } = useApp();

  const [favorites, setFavorites] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 50, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingBarcode, setRemovingBarcode] = useState(null);

  const fetchFavorites = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await foodService.getFavorites(page, 50);
      if (res.success && res.data) {
        setFavorites(res.data.items || []);
        setPagination(res.data.pagination || { page: 1, pageSize: 50, total: 0, totalPages: 1 });
      }
    } catch (err) {
      setError(err.message || 'Failed to load favorite foods');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites(1);
  }, [fetchFavorites]);

  const handleRemoveFavorite = async (barcode, e) => {
    e.stopPropagation();
    if (!barcode || removingBarcode) return;
    setRemovingBarcode(barcode);
    try {
      await foodService.removeFavorite(barcode);
      setFavorites((prev) => prev.filter((item) => item.barcode !== barcode));
      setPagination((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));
    } catch (err) {
      console.error('Failed to remove favorite:', err);
    } finally {
      setRemovingBarcode(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Saved';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (score >= 70) return 'bg-teal-50 text-teal-800 border-teal-200';
    if (score >= 50) return 'bg-amber-50 text-amber-900 border-amber-200';
    if (score >= 30) return 'bg-orange-50 text-orange-900 border-orange-200';
    return 'bg-rose-50 text-rose-900 border-rose-200';
  };

  return (
    <PageTransition className="space-y-8 max-w-6xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Favorites"
          description={`Your saved packaged foods and frequently monitored grocery items (${pagination.total} total).`}
        />
        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/app/search')}
          className="rounded-xl font-bold gap-2 self-start sm:self-auto"
        >
          <Search className="w-4 h-4" />
          <span>Discover More Products</span>
        </Button>
      </div>

      {error && (
        <Card className="p-4 rounded-2xl bg-rose-50 border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span className="font-semibold">{typeof error === 'string' ? error : (error?.message || 'Failed to load favorites')}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchFavorites(pagination.page)}
            className="rounded-xl font-bold"
          >
            Retry
          </Button>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="h-64 rounded-3xl bg-slate-100 border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No favorite foods saved yet"
          description="Save packaged products while searching or scanning to quickly track their nutrition and compare them anytime."
          actionText="Search Products"
          onAction={() => navigate('/app/search')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((fav) => {
            const product = fav.product || {};
            const inCompare = isInCompare(fav.barcode);
            const score = fav.score?.score;

            return (
              <Card
                key={fav._id || fav.barcode}
                hoverable
                className="p-5 flex flex-col justify-between transition-all group rounded-3xl border-slate-200/80 shadow-2xs"
                onClick={() => navigate(`/app/product/${fav.barcode}`)}
              >
                <div>
                  {/* Top Image & Actions */}
                  <div className="relative w-full h-44 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden mb-4 shadow-2xs">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform mix-blend-multiply"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Package className="w-12 h-12 text-slate-300" />
                    )}

                    {/* Unfavorite Button */}
                    <button
                      type="button"
                      className="absolute top-2.5 right-2.5 p-2 rounded-xl bg-white/90 backdrop-blur-xs border border-slate-200 text-rose-500 hover:bg-rose-50 hover:border-rose-300 transition-colors shadow-xs"
                      onClick={(e) => handleRemoveFavorite(fav.barcode, e)}
                      disabled={removingBarcode === fav.barcode}
                      title="Remove from favorites"
                      aria-label="Remove from favorites"
                    >
                      {removingBarcode === fav.barcode ? (
                        <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                      ) : (
                        <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                      )}
                    </button>

                    {/* NutriScore Badge */}
                    {product.nutriscore && (
                      <span className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-lg bg-emerald-700 text-white font-black text-[10px] uppercase shadow-xs">
                        Nutri-Score {product.nutriscore}
                      </span>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="space-y-1 mb-4">
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                      {product.brand || 'Food Product'}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug">
                      {product.name || 'Unknown Product'}
                    </h4>
                    <p className="text-xs text-slate-400 font-mono font-medium">
                      #{fav.barcode}
                    </p>
                  </div>
                </div>

                {/* Card Footer: Score + Compare Button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    {typeof score === 'number' ? (
                      <span className={`text-xs font-black px-2.5 py-1 rounded-xl border ${getScoreColor(score)}`}>
                        Score {score}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(fav.createdAt)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant={inCompare ? 'default' : 'outline'}
                      size="sm"
                      onClick={() =>
                        inCompare
                          ? removeFromCompare(fav.barcode)
                          : addToCompare(product)
                      }
                      className="rounded-xl font-bold gap-1.5"
                    >
                      {inCompare ? <Check className="w-3.5 h-3.5" /> : <Scale className="w-3.5 h-3.5" />}
                      <span>{inCompare ? 'Compared' : 'Compare'}</span>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-slate-200">
          <span className="text-xs text-slate-500 font-bold">
            Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} favorites total)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchFavorites(pagination.page - 1)}
              className="rounded-xl font-bold gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchFavorites(pagination.page + 1)}
              className="rounded-xl font-bold gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </PageTransition>
  );
};
