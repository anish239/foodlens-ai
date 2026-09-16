import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ProductSearchCard } from '../../components/food/ProductSearchCard';
import { PageTransition } from '../../components/animation/PageTransition';
import { useApp } from '../../context/AppContext';
import { foodService } from '../../services/foodService';
import {
  Search,
  Sparkles,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  RotateCcw,
} from 'lucide-react';
import { SAMPLE_SEARCH_SUGGESTIONS } from '../../constants/appConstants';

export const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  const urlPage = parseInt(searchParams.get('page') || '1', 10);

  const [inputQuery, setInputQuery] = useState(urlQuery);
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: null, hasNextPage: false });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [hasExecutedSearch, setHasExecutedSearch] = useState(false);

  const executeSearch = useCallback(async (queryText, pageNum) => {
    const trimmed = queryText?.trim();
    if (!trimmed || trimmed.length < 2) {
      setResults([]);
      setHasExecutedSearch(false);
      setErrorMessage(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setHasExecutedSearch(true);

    try {
      const response = await foodService.searchProducts(trimmed, pageNum, 20);
      const data = response.data?.data || response.data || {};
      setResults(data.items || []);
      setPagination(
        data.pagination || {
          page: pageNum,
          pageSize: 20,
          total: null,
          hasNextPage: false,
        }
      );
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to search products. Please try again.';
      setErrorMessage(msg);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync state with URL params
  useEffect(() => {
    setInputQuery(urlQuery);
    if (urlQuery && urlQuery.trim().length >= 2) {
      executeSearch(urlQuery, urlPage || 1);
    } else {
      setResults([]);
      setHasExecutedSearch(false);
    }
  }, [urlQuery, urlPage, executeSearch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = inputQuery.trim();
    if (!trimmed || trimmed.length < 2) return;

    setSearchParams({ q: trimmed, page: '1' });
  };

  const handleSuggestionClick = (term) => {
    setInputQuery(term);
    setSearchParams({ q: term, page: '1' });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    setSearchParams({ q: urlQuery, page: String(newPage) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <PageTransition className="space-y-8 max-w-6xl mx-auto pb-24">
      <PageHeader
        title="Search Food"
        description="Search across thousands of packaged food products to analyze nutrition, ingredients, and compatibility."
      />

      {/* Search Input Box */}
      <Card className="p-6 sm:p-7 bg-gradient-to-br from-emerald-50/40 via-white to-white border-emerald-100/90 shadow-sm rounded-3xl">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search products by name, brand, or ingredient (e.g., Greek Yogurt, Cheerios, Oat Milk)..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              className="pl-12 pr-10 py-3.5 h-auto text-sm rounded-2xl bg-white border-slate-200 focus:ring-emerald-500 shadow-2xs placeholder:text-slate-400"
            />
            {inputQuery && (
              <button
                type="button"
                onClick={() => setInputQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isLoading || inputQuery.trim().length < 2}
            className="rounded-2xl font-bold shadow-sm"
          >
            {isLoading ? 'Searching...' : 'Search Food'}
          </Button>
        </form>

        {/* Search Suggestions */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400">Popular:</span>
          {SAMPLE_SEARCH_SUGGESTIONS.map((term, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSuggestionClick(term)}
              className="px-3 py-1 bg-white border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/60 text-slate-600 hover:text-emerald-900 text-xs font-semibold rounded-xl transition-all shadow-2xs"
            >
              {term}
            </button>
          ))}
        </div>
      </Card>

      {/* Results Section */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-6 w-48 bg-slate-100 rounded-md animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <Card key={n} className="h-80 animate-pulse bg-slate-50 p-4 rounded-3xl">
                <div className="w-full h-40 bg-slate-200 rounded-2xl mb-4" />
                <div className="w-1/3 h-4 bg-slate-200 rounded mb-2" />
                <div className="w-4/5 h-5 bg-slate-200 rounded" />
              </Card>
            ))}
          </div>
        </div>
      ) : errorMessage ? (
        <Card className="p-8 text-center border-rose-200 bg-rose-50/40 rounded-3xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">Search Encountered an Issue</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto mb-4 font-medium">{errorMessage}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => executeSearch(urlQuery, urlPage)}
            className="rounded-xl gap-2 font-semibold"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retry Search</span>
          </Button>
        </Card>
      ) : hasExecutedSearch && results.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No products found"
          description={`We couldn't find any packaged products matching "${urlQuery}". Try searching with different keywords or brand names.`}
          actionText="Clear Search"
          onAction={() => {
            setInputQuery('');
            setSearchParams({});
          }}
        />
      ) : results.length > 0 ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-sm text-slate-600 font-medium">
              Found results for <span className="font-bold text-slate-900">"{urlQuery}"</span>
              {pagination.total && (
                <span className="text-xs text-slate-400 ml-1.5 font-normal">
                  (~{pagination.total} total items)
                </span>
              )}
            </p>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              Page {pagination.page}
            </span>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {results.map((product, idx) => (
              <ProductSearchCard key={product.barcode || idx} product={product} />
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => handlePageChange(pagination.page - 1)}
              className="rounded-xl font-bold gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Page</span>
            </Button>

            <span className="text-xs font-bold text-slate-600">
              Page {pagination.page}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNextPage}
              onClick={() => handlePageChange(pagination.page + 1)}
              className="rounded-xl font-bold gap-1.5"
            >
              <span>Next Page</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Sparkles}
          title="Start exploring food products"
          description="Type a product name, brand, or click one of the popular suggestions above to view instant nutrition, allergen, and score breakdowns."
        />
      )}
    </PageTransition>
  );
};
