import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Sparkles, CheckCircle2, AlertTriangle, Info, RefreshCw, AlertCircle, HelpCircle } from 'lucide-react';

export const AIInsightCard = ({ insightData, loading = false, error = null, onRetry }) => {
  if (loading) {
    return (
      <Card className="p-6 sm:p-7 bg-slate-900 text-white border-slate-800 shadow-lg rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center animate-pulse">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Google Gemini AI
              </span>
              <h4 className="text-sm font-bold text-slate-100">Analyzing Product Intelligence...</h4>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Generating
          </span>
        </div>
        <div className="space-y-2.5 pt-2 animate-pulse">
          <div className="h-3.5 bg-slate-800 rounded-lg w-full" />
          <div className="h-3.5 bg-slate-800 rounded-lg w-5/6" />
          <div className="h-3.5 bg-slate-800 rounded-lg w-3/4" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-slate-50 border-slate-200/80 rounded-3xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center">
              <AlertCircle className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                AI Service Status
              </span>
              <h4 className="text-sm font-bold text-slate-900">AI Insights Temporarily Unavailable</h4>
            </div>
          </div>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="rounded-xl gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </Button>
          )}
        </div>
        <p className="text-xs text-slate-500 leading-relaxed font-medium">
          {typeof error === 'string' ? error : (error?.message || 'Unable to generate Gemini AI insights at this moment. Deterministic product details and FoodLens scores remain fully accessible.')}
        </p>
      </Card>
    );
  }

  if (!insightData) {
    return null;
  }

  const {
    summary,
    highlights = [],
    concerns = [],
    scoreExplanation,
    compatibilityExplanation,
    recommendation,
    disclaimer,
  } = insightData;

  const getText = (val) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    return val.message || val.text || val.reason || '';
  };

  return (
    <Card className="p-6 sm:p-7 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white border-slate-800 shadow-xl rounded-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-sm">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                AI Food Insight
              </span>
              <span className="text-[9px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                AI-generated explanation
              </span>
            </div>
            <h3 className="text-base font-extrabold text-white tracking-tight">
              Nutritional Intelligence
            </h3>
          </div>
        </div>
        <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 hidden xs:inline-block">
          Google Gemini
        </span>
      </div>

      {/* Summary */}
      {summary && (
        <div className="space-y-1.5 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Product Summary</h4>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">{getText(summary)}</p>
        </div>
      )}

      {/* Highlights & Concerns Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {highlights.length > 0 && (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Key Positives</span>
            </div>
            <ul className="space-y-1.5 text-xs text-emerald-100">
              {highlights.map((h, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-bold text-emerald-400">•</span>
                  <span>{getText(h)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {concerns.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Things to Consider</span>
            </div>
            <ul className="space-y-1.5 text-xs text-amber-100">
              {concerns.map((c, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-bold text-amber-400">•</span>
                  <span>{getText(c)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Score Explanation */}
      {scoreExplanation && (
        <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Info className="w-4 h-4 text-emerald-400" />
            <span>Why This FoodLens Score?</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{getText(scoreExplanation)}</p>
        </div>
      )}

      {/* Compatibility Explanation */}
      {compatibilityExplanation && (
        <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>Dietary & Profile Compatibility</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{getText(compatibilityExplanation)}</p>
        </div>
      )}

      {/* Recommendation */}
      {recommendation && (
        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 space-y-1">
          <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Overall Insight</h4>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium italic">
            "{getText(recommendation)}"
          </p>
        </div>
      )}

      {/* Informational Disclaimer */}
      <div className="pt-3 border-t border-slate-800">
        <p className="text-[10px] text-slate-400 text-center leading-normal">
          {disclaimer || 'This information is for general educational purposes and should not replace professional medical or dietary advice.'}
        </p>
      </div>
    </Card>
  );
};
