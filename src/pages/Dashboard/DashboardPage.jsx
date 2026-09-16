import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { EmptyState } from '../../components/common/EmptyState';
import { PageTransition } from '../../components/animation/PageTransition';
import { useAuth } from '../../context/AuthContext';
import { foodService } from '../../services/foodService';
import {
  ScanBarcode,
  Search,
  Sparkles,
  Scale,
  History,
  Heart,
  Award,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Layers,
  ChevronRight,
  Zap,
} from 'lucide-react';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  const fetchAnalytics = useCallback(async (period = 'all') => {
    setLoading(true);
    setError('');
    try {
      const res = await foodService.getAnalyticsSummary(period);
      if (res.success && res.data) {
        setAnalytics(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard analytics:', err);
      setError('Unable to load analytics summary');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(selectedPeriod);
  }, [fetchAnalytics, selectedPeriod]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
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
        <Badge variant="success" className="gap-1 text-[11px] font-bold rounded-full py-0.5 px-2">
          <ShieldCheck className="w-3 h-3" />
          <span>Compatible</span>
        </Badge>
      );
    }
    if (status === 'caution') {
      return (
        <Badge variant="warning" className="gap-1 text-[11px] font-bold rounded-full py-0.5 px-2">
          <AlertTriangle className="w-3 h-3" />
          <span>Caution</span>
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="gap-1 text-[11px] font-bold rounded-full py-0.5 px-2">
        <XCircle className="w-3 h-3" />
        <span>Conflict</span>
      </Badge>
    );
  };

  const totalScans = analytics?.totalScans ?? 0;
  const uniqueProducts = analytics?.uniqueProducts ?? 0;
  const favoriteCount = analytics?.favoriteCount ?? 0;
  const averageScore = analytics?.averageScore !== null && analytics?.averageScore !== undefined ? analytics.averageScore : '—';
  const recentScans = analytics?.recentScans || [];
  const recentFavorites = analytics?.recentFavorites || [];
  const scoreDist = analytics?.scoreDistribution || { excellent: 0, good: 0, moderate: 0, poor: 0, avoid: 0 };
  const compatStats = analytics?.compatibility || { compatible: 0, caution: 0, notCompatible: 0 };
  const alertCount = compatStats.notCompatible + compatStats.caution;

  return (
    <PageTransition className="space-y-8 pb-12 max-w-7xl mx-auto">
      {/* 1. HERO SECTION (Asymmetric: Left Value Prop, Right Live Intelligence Widget) */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-950 text-white border border-slate-800 shadow-2xl p-6 sm:p-9 lg:p-10">
        {/* Subtle Ambient Light Effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Heading & CTAs */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-bold tracking-wide shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>AI-Powered Food Intelligence</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Understand what you eat.
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal max-w-xl">
              Scan grocery barcodes or search packaged food products to decode ingredient density, verify allergen safety, and get explainable FoodLens scores.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                size="lg"
                onClick={() => navigate('/app/scanner')}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl shadow-lg shadow-emerald-500/25 px-6 gap-2"
              >
                <ScanBarcode className="w-5 h-5 stroke-[2.2]" />
                <span>Scan a Product</span>
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/app/search')}
                className="bg-slate-900/80 hover:bg-slate-800 text-white border-slate-700 font-bold rounded-2xl px-5 gap-2 backdrop-blur-md"
              >
                <Search className="w-4 h-4 text-slate-300" />
                <span>Search Food</span>
              </Button>
            </div>
          </div>

          {/* Right Column: Interactive Intelligence Preview */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-5 shadow-inner backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    FoodLens Intelligence Engine
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/50">
                  Active
                </span>
              </div>

              <div className="flex items-center gap-5">
                {/* Radial visual indicator */}
                <div className="relative w-20 h-20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#1e293b" strokeWidth="7" />
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="7"
                      strokeDasharray="213"
                      strokeDashoffset={213 - (213 * (typeof averageScore === 'number' ? averageScore : 82)) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-white">
                      {typeof averageScore === 'number' ? averageScore : '82'}
                    </span>
                    <span className="text-[9px] uppercase font-bold text-slate-400">Score</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-white">
                    {user?.preferences?.diet || 'Standard Diet'} • {user?.preferences?.allergies?.length || 0} Allergy Rules
                  </p>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Real-time verification against NOVA processing scale and allergen database.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-center">
                <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Scans Logged</span>
                  <span className="text-base font-black text-emerald-400">{totalScans}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Favorites</span>
                  <span className="text-base font-black text-teal-400">{favoriteCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. METRIC CARDS (4 compact modern metric blocks) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Scans */}
        <Card className="p-5 rounded-3xl border-slate-200/80 shadow-2xs hover:shadow-sm transition-all space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Total Scans</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ScanBarcode className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">{totalScans}</div>
            <div className="text-xs font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{uniqueProducts} unique items</span>
            </div>
          </div>
        </Card>

        {/* Average Score */}
        <Card className="p-5 rounded-3xl border-slate-200/80 shadow-2xs hover:shadow-sm transition-all space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Average Score</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Award className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {typeof averageScore === 'number' ? averageScore : '—'}
            </div>
            <div className="text-xs font-bold text-teal-700 mt-0.5">
              {typeof averageScore === 'number' ? 'Out of 100 base score' : 'Scan items to calculate'}
            </div>
          </div>
        </Card>

        {/* Favorites */}
        <Card className="p-5 rounded-3xl border-slate-200/80 shadow-2xs hover:shadow-sm transition-all space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Saved Items</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Heart className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">{favoriteCount}</div>
            <div className="text-xs font-bold text-slate-500 mt-0.5">Monitored products</div>
          </div>
        </Card>

        {/* Compatibility Alerts */}
        <Card className="p-5 rounded-3xl border-slate-200/80 shadow-2xs hover:shadow-sm transition-all space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Compatibility Alerts</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">{alertCount}</div>
            <div className="text-xs font-bold text-amber-700 mt-0.5">
              {compatStats.notCompatible} conflicts, {compatStats.caution} cautions
            </div>
          </div>
        </Card>
      </div>

      {/* 3. ANALYTICS SECTION: Score Distribution & Compatibility Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Intelligence &amp; Nutrition Analytics</h2>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
            {[
              { key: 'all', label: 'All Time' },
              { key: '7d', label: '7 Days' },
              { key: '30d', label: '30 Days' },
            ].map((period) => (
              <button
                key={period.key}
                type="button"
                onClick={() => setSelectedPeriod(period.key)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  selectedPeriod === period.key
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Score Distribution Visualization */}
          <Card className="p-6 rounded-3xl border-slate-200/80 shadow-2xs space-y-4 bg-white">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>Score Distribution</span>
              </h3>
              <span className="text-[11px] font-bold text-slate-400">Scientific Tiers</span>
            </div>

            <div className="space-y-3 pt-1">
              {[
                { label: 'Excellent (85–100)', count: scoreDist.excellent, color: 'bg-emerald-500' },
                { label: 'Good (70–84)', count: scoreDist.good, color: 'bg-teal-500' },
                { label: 'Moderate (50–69)', count: scoreDist.moderate, color: 'bg-amber-500' },
                { label: 'Poor (30–49)', count: scoreDist.poor, color: 'bg-orange-500' },
                { label: 'Avoid Frequently (0–29)', count: scoreDist.avoid, color: 'bg-rose-500' },
              ].map((tier, idx) => {
                const pct = totalScans > 0 ? Math.round((tier.count / totalScans) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">{tier.label}</span>
                      <span className="text-slate-500 font-mono text-[11px] font-bold">
                        {tier.count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full ${tier.color} rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Compatibility Overview */}
          <Card className="p-6 rounded-3xl border-slate-200/80 shadow-2xs space-y-4 bg-white">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Dietary Compatibility Overview</span>
              </h3>
              <button
                type="button"
                onClick={() => navigate('/app/profile')}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-extrabold"
              >
                Configure
              </button>
            </div>

            <div className="space-y-3 pt-1">
              {[
                {
                  label: 'Fully Compatible',
                  count: compatStats.compatible,
                  color: 'bg-emerald-500',
                  textColor: 'text-emerald-700',
                  icon: ShieldCheck,
                },
                {
                  label: 'Caution / Allergen Traces',
                  count: compatStats.caution,
                  color: 'bg-amber-500',
                  textColor: 'text-amber-700',
                  icon: AlertTriangle,
                },
                {
                  label: 'Diet / Allergen Conflict',
                  count: compatStats.notCompatible,
                  color: 'bg-rose-500',
                  textColor: 'text-rose-700',
                  icon: XCircle,
                },
              ].map((stat, idx) => {
                const pct = totalScans > 0 ? Math.round((stat.count / totalScans) * 100) : 0;
                const Icon = stat.icon;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Icon className={`w-3.5 h-3.5 ${stat.textColor}`} />
                        {stat.label}
                      </span>
                      <span className="text-slate-500 font-mono text-[11px] font-bold">
                        {stat.count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full ${stat.color} rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* 4. RECENT ACTIVITY FEED & SAVED PRODUCTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900">Recent Activity</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app/history')}
              className="rounded-xl font-bold text-slate-600 hover:text-slate-900"
            >
              View Full History
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-3xl bg-slate-100 border border-slate-200 animate-pulse" />
              ))}
            </div>
          ) : recentScans.length === 0 ? (
            <EmptyState
              icon={History}
              title="No scan activity yet"
              description="Point your camera at any food product barcode to get an instant FoodLens health score and ingredient breakdown."
              actionText="Start Scanning"
              onAction={() => navigate('/app/scanner')}
            />
          ) : (
            <div className="space-y-3">
              {recentScans.map((scan) => (
                <Card
                  key={scan.id || scan.barcode}
                  hoverable
                  className="p-4 flex items-center justify-between gap-4 cursor-pointer transition-all rounded-3xl border-slate-200/80 shadow-2xs bg-white"
                  onClick={() => navigate(`/app/product/${scan.barcode}`)}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-2xs">
                      {scan.image ? (
                        <img
                          src={scan.image}
                          alt={scan.name}
                          className="w-full h-full object-contain p-1 mix-blend-multiply"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <ScanBarcode className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block truncate">
                        {scan.brand || 'Packaged Food'}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm truncate">{scan.name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono font-semibold">
                        {formatDate(scan.scannedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getCompatibilityBadge(scan.compatibilityStatus)}
                    {typeof scan.score === 'number' && (
                      <span
                        className={`text-xs font-black px-2.5 py-1 rounded-xl border ${getScoreColor(
                          scan.score
                        )}`}
                      >
                        Score {scan.score}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Saved Products */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900">Saved Products</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app/favorites')}
              className="rounded-xl font-bold text-slate-600 hover:text-slate-900"
            >
              All ({favoriteCount})
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 rounded-3xl bg-slate-100 border border-slate-200 animate-pulse" />
              ))}
            </div>
          ) : recentFavorites.length === 0 ? (
            <Card className="p-6 bg-slate-50/80 border-slate-200/80 text-center space-y-3 rounded-3xl shadow-2xs">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
                <Heart className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">No saved products</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Save food items to track them and quickly access their nutritional metrics.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/app/search')}
                className="w-full rounded-xl font-bold"
              >
                Explore Foods
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentFavorites.map((fav) => (
                <Card
                  key={fav.id || fav.barcode}
                  hoverable
                  className="p-3.5 flex items-center justify-between gap-3 cursor-pointer rounded-2xl border-slate-200/80 shadow-2xs bg-white"
                  onClick={() => navigate(`/app/product/${fav.barcode}`)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-2xs">
                      {fav.image ? (
                        <img
                          src={fav.image}
                          alt={fav.name}
                          className="w-full h-full object-contain p-0.5 mix-blend-multiply"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Heart className="w-4 h-4 text-rose-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-xs truncate">{fav.name}</h4>
                      <p className="text-[10px] text-slate-400 truncate font-semibold">
                        {fav.brand || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {typeof fav.score === 'number' && (
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${getScoreColor(
                          fav.score
                        )}`}
                      >
                        {fav.score}
                      </span>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};
