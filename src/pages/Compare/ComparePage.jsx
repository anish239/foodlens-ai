import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ProductComparisonTable } from '../../components/food/ProductComparisonTable';
import { PageTransition } from '../../components/animation/PageTransition';
import { useApp } from '../../context/AppContext';
import { foodService } from '../../services/foodService';
import {
  Scale,
  Plus,
  Trash2,
  Search,
  RotateCcw,
  AlertCircle,
  Package,
  X,
} from 'lucide-react';

export const ComparePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const barcodesParam = searchParams.get('barcodes');

  const { compareItems, addToCompare, removeFromCompare, clearCompare } = useApp();

  const [comparisonData, setComparisonData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Quick add search modal state
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [modalSearchResults, setModalSearchResults] = useState([]);
  const [isModalSearching, setIsModalSearching] = useState(false);

  // Determine current active barcodes list from URL or Context
  const activeBarcodes = React.useMemo(() => {
    if (barcodesParam) {
      return barcodesParam.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return compareItems.map((item) => item.barcode);
  }, [barcodesParam, compareItems]);

  const fetchComparison = useCallback(async (barcodesList) => {
    if (!barcodesList || barcodesList.length < 2 || barcodesList.length > 4) {
      setComparisonData(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await foodService.compareProducts(barcodesList);
      const data = response.data?.data || response.data || {};
      setComparisonData(data);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to compare selected products.';
      setErrorMessage(msg);
      setComparisonData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeBarcodes.length >= 2 && activeBarcodes.length <= 4) {
      fetchComparison(activeBarcodes);
    } else {
      setComparisonData(null);
    }
  }, [activeBarcodes, fetchComparison]);

  const handleRemoveProduct = (barcode) => {
    removeFromCompare(barcode);
    const updated = activeBarcodes.filter((b) => b !== barcode);
    if (updated.length > 0) {
      setSearchParams({ barcodes: updated.join(',') });
    } else {
      setSearchParams({});
    }
  };

  const handleClearAll = () => {
    clearCompare();
    setSearchParams({});
    setComparisonData(null);
  };

  const handleModalSearch = async (e) => {
    e.preventDefault();
    if (!modalSearchQuery.trim() || modalSearchQuery.trim().length < 2) return;

    setIsModalSearching(true);
    try {
      const response = await foodService.searchProducts(modalSearchQuery.trim(), 1, 10);
      const data = response.data?.data || response.data || {};
      setModalSearchResults(data.items || []);
    } catch (err) {
      setModalSearchResults([]);
    } finally {
      setIsModalSearching(false);
    }
  };

  const handleAddFromModal = (product) => {
    addToCompare(product);
    const updated = [...new Set([...activeBarcodes, product.barcode])];
    setSearchParams({ barcodes: updated.join(',') });
    setIsSearchModalOpen(false);
    setModalSearchQuery('');
    setModalSearchResults([]);
  };

  return (
    <PageTransition className="space-y-8 max-w-6xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Compare Products"
          description="Compare nutrition facts, ingredients, FoodLens scores, and dietary suitability side-by-side."
        />
        {activeBarcodes.length >= 2 && (
          <div className="flex items-center gap-2">
            {activeBarcodes.length < 4 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSearchModalOpen(true)}
                className="rounded-xl font-bold gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product ({activeBarcodes.length}/4)</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 rounded-xl font-bold gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Comparison</span>
            </Button>
          </div>
        )}
      </div>

      {/* When less than 2 products are selected: Empty Slots Setup */}
      {activeBarcodes.length < 2 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((index) => {
              const currentItem = compareItems[index] || null;
              return currentItem ? (
                <Card key={index} className="p-5 flex flex-col items-center text-center relative group rounded-3xl border-slate-200/90 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(currentItem.barcode)}
                    className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center p-2 mb-3 border border-slate-100 overflow-hidden shadow-2xs">
                    {currentItem.image ? (
                      <img
                        src={currentItem.image}
                        alt={currentItem.name}
                        className="max-h-full max-w-full object-contain mix-blend-multiply"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">{currentItem.brand || 'Product'}</p>
                  <h4 className="font-bold text-slate-900 text-xs line-clamp-2 mt-0.5">{currentItem.name}</h4>
                </Card>
              ) : (
                <Card
                  key={index}
                  className="p-6 text-center border-dashed border-2 border-slate-200 flex flex-col items-center justify-center min-h-[220px] hover:border-emerald-300 transition-colors rounded-3xl"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                    <Plus className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-xs mb-1">
                    Slot {index + 1} {index < 2 ? '(Required)' : '(Optional)'}
                  </h4>
                  <p className="text-[11px] text-slate-400 mb-3 font-medium">Add a product to compare</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSearchModalOpen(true)}
                    className="rounded-xl font-bold"
                  >
                    Select Product
                  </Button>
                </Card>
              );
            })}
          </div>

          <EmptyState
            icon={Scale}
            title="Select 2 to 4 products to compare"
            description="Add products from the Food Search page or click 'Select Product' above to begin side-by-side nutrition, allergen, and score comparison."
            actionText="Go to Food Search"
            actionLink="/app/search"
          />
        </div>
      ) : isLoading ? (
        <div className="space-y-4">
          <div className="h-8 w-64 bg-slate-100 rounded-xl animate-pulse" />
          <Card className="p-8 rounded-3xl">
            <LoadingSkeleton count={4} />
          </Card>
        </div>
      ) : errorMessage ? (
        <Card className="p-8 text-center border-rose-200 bg-rose-50/40 rounded-3xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">Comparison Failed</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto mb-4 font-medium">{errorMessage}</p>
          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchComparison(activeBarcodes)}
              className="rounded-xl font-bold gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry</span>
            </Button>
            <Button variant="primary" size="sm" onClick={handleClearAll} className="rounded-xl font-bold">
              Reset List
            </Button>
          </div>
        </Card>
      ) : comparisonData ? (
        <ProductComparisonTable
          comparisonData={comparisonData}
          onRemoveProduct={handleRemoveProduct}
        />
      ) : null}

      {/* Quick Search Modal for adding products */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden shadow-2xl rounded-3xl border-slate-700 animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-600" />
                <span>Add Product to Comparison</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsSearchModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <form onSubmit={handleModalSearch} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Search product name or brand..."
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  className="flex-1 text-sm rounded-xl"
                  autoFocus
                />
                <Button type="submit" variant="primary" size="sm" disabled={isModalSearching} className="rounded-xl font-bold">
                  {isModalSearching ? 'Searching...' : 'Search'}
                </Button>
              </form>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-2.5 min-h-[250px]">
              {isModalSearching ? (
                <div className="space-y-2">
                  <div className="h-14 bg-slate-100 rounded-2xl animate-pulse" />
                  <div className="h-14 bg-slate-100 rounded-2xl animate-pulse" />
                  <div className="h-14 bg-slate-100 rounded-2xl animate-pulse" />
                </div>
              ) : modalSearchResults.length > 0 ? (
                <div className="space-y-2">
                  {modalSearchResults.map((prod) => {
                    const isAlreadyAdded = activeBarcodes.includes(prod.barcode);
                    return (
                      <div
                        key={prod.barcode}
                        className="p-3.5 border border-slate-100 rounded-2xl hover:bg-slate-50 flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center p-1 shrink-0 border border-slate-100 overflow-hidden shadow-2xs">
                            {prod.image ? (
                              <img
                                src={prod.image}
                                alt={prod.name}
                                className="max-h-full max-w-full object-contain mix-blend-multiply"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-emerald-700 truncate">{prod.brand || '—'}</p>
                            <h5 className="font-bold text-slate-900 text-xs truncate" title={prod.name}>
                              {prod.name}
                            </h5>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant={isAlreadyAdded ? 'outline' : 'primary'}
                          size="sm"
                          disabled={isAlreadyAdded}
                          onClick={() => handleAddFromModal(prod)}
                          className="rounded-xl font-bold"
                        >
                          {isAlreadyAdded ? 'Added' : 'Add'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-medium">Search for a product above to add to comparison</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </PageTransition>
  );
};
