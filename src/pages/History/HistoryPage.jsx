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
  History,
  ScanBarcode,
  Trash2,
  ExternalLink,
  Scale,
  Check,
  Calendar,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Package,
} from 'lucide-react';

export const HistoryPage = () => {
  const navigate = useNavigate();
  const { isInCompare, addToCompare, removeFromCompare } = useApp();

  const [historyItems, setHistoryItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);

  const fetchHistory = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await foodService.getScanHistory(page, 20);
      if (res.success && res.data) {
        setHistoryItems(res.data.items || []);
        setPagination(res.data.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 });
      }
    } catch (err) {
      setError(err.message || 'Failed to load scan history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  const handleDeleteItem = async (id, e) => {
    e.stopPropagation();
    if (!id || deletingId) return;
    setDeletingId(id);
    try {
      await foodService.deleteScanHistory(id);
      setHistoryItems((prev) => prev.filter((item) => item._id !== id));
      setPagination((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));
    } catch (err) {
      console.error('Failed to delete history item:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (clearing) return;
    setClearing(true);
    try {
      await foodService.clearScanHistory();
      setHistoryItems([]);
      setPagination({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
      setShowClearConfirm(false);
    } catch (err) {
      console.error('Failed to clear history:', err);
    } finally {
      setClearing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (score >= 70) return 'bg-teal-50 text-teal-800 border-teal-200';
    if (score >= 50) return 'bg-amber-50 text-amber-900 border-amber-200';
    if (score >= 30) return 'bg-orange-50 text-orange-900 border-orange-200';
    return 'bg-rose-50 text-rose-900 border-rose-200';
  };

  const getCompatibilityBadge = (status) => {
    if (status === 'compatible') {
      return (
        <Badge variant="success" className="gap-1 text-[11px] font-bold rounded-full py-0.5 px-2.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Compatible</span>
        </Badge>
      );
    }
    if (status === 'caution') {
      return (
        <Badge variant="warning" className="gap-1 text-[11px] font-bold rounded-full py-0.5 px-2.5">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Caution</span>
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="gap-1 text-[11px] font-bold rounded-full py-0.5 px-2.5">
        <XCircle className="w-3.5 h-3.5" />
        <span>Conflict</span>
      </Badge>
    );
  };

  return (
    <PageTransition className="space-y-8 max-w-6xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Scan History"
          description={`Your historical barcode scans, deterministic FoodLens scores, and dietary records (${pagination.total} total).`}
        />
        {historyItems.length > 0 && (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClearConfirm(true)}
              className="text-rose-600 border-rose-200 hover:bg-rose-50 rounded-xl font-bold gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear History</span>
            </Button>
          </div>
        )}
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 space-y-4 shadow-2xl rounded-3xl border-slate-700 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Clear all scan history?</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              This action will permanently delete your entire scan history from your account. Your saved favorites will remain intact.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowClearConfirm(false)}
                disabled={clearing}
                className="rounded-xl font-bold"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearAll}
                isLoading={clearing}
                className="rounded-xl font-bold"
              >
                Yes, Clear All
              </Button>
            </div>
          </Card>
        </div>
      )}

      {error && (
        <Card className="p-4 rounded-2xl bg-rose-50 border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span className="font-semibold">{typeof error === 'string' ? error : (error?.message || 'Failed to load history')}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchHistory(pagination.page)}
            className="rounded-xl font-bold"
          >
            Retry
          </Button>
        </Card>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div key={idx} className="h-24 rounded-3xl bg-slate-100 border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : historyItems.length === 0 ? (
        <EmptyState
          icon={History}
          title="No scan history yet"
          description="Every packaged food barcode you scan with FoodLens AI will be stored here with its historical health score and allergen compatibility."
          actionText="Scan Your First Product"
          onAction={() => navigate('/app/scanner')}
        />
      ) : (
        <div className="space-y-4">
          {historyItems.map((item) => {
            const product = item.product || {};
            const score = item.score || {};
            const compat = item.compatibility || {};
            const inCompare = isInCompare(product.barcode || item.barcode);

            return (
              <Card
                key={item._id}
                hoverable
                className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all rounded-3xl border-slate-200/80 shadow-2xs group"
                onClick={() => navigate(`/app/product/${product.barcode || item.barcode}`)}
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-2xs">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-contain p-1 mix-blend-multiply group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-slate-300" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="space-y-1 min-w-0">
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block truncate">
                      {product.brand || 'Food Product'}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm md:text-base leading-snug truncate">
                      {product.name || 'Unknown Product'}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap font-medium">
                      <span className="font-mono bg-slate-100 px-2 py-0.5 rounded-lg text-[11px] font-bold">
                        #{product.barcode || item.barcode}
                      </span>
                      <span className="flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(item.scannedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score & Compatibility Badges & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <div className="flex items-center gap-2">
                    {/* Compatibility Badge */}
                    {getCompatibilityBadge(compat.status)}

                    {/* FoodLens Score */}
                    {typeof score.score === 'number' && (
                      <span
                        className={`text-xs font-black px-2.5 py-1 rounded-xl border ${getScoreColor(
                          score.score
                        )}`}
                      >
                        Score {score.score}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant={inCompare ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() =>
                        inCompare
                          ? removeFromCompare(product.barcode || item.barcode)
                          : addToCompare(product)
                      }
                      title={inCompare ? 'In Comparison' : 'Add to Compare'}
                      className="rounded-xl"
                    >
                      {inCompare ? <Check className="w-4 h-4" /> : <Scale className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteItem(item._id, e)}
                      isLoading={deletingId === item._id}
                      className="text-slate-400 hover:text-rose-600 rounded-xl"
                      title="Delete from history"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-slate-200">
              <span className="text-xs text-slate-500 font-bold">
                Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} scans total)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchHistory(pagination.page - 1)}
                  className="rounded-xl font-bold gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchHistory(pagination.page + 1)}
                  className="rounded-xl font-bold gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </PageTransition>
  );
};
