import React from 'react';
import { Card } from '../ui/card';
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck } from 'lucide-react';

export const CompatibilityBadge = ({ compatibilityData }) => {
  if (!compatibilityData) {
    return (
      <Card className="p-6 bg-slate-50 border-slate-200/80 rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-200 text-slate-500 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Dietary Compatibility</h4>
            <p className="text-xs text-slate-500">Evaluation unavailable</p>
          </div>
        </div>
      </Card>
    );
  }

  const { status, label, reasons = [], warnings = [], positiveMatches = [], checkedAgainst } = compatibilityData;

  const configs = {
    compatible: {
      bg: 'bg-emerald-50/60 border-emerald-200/90 text-emerald-950',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      title: 'Compatible with Diet',
    },
    caution: {
      bg: 'bg-amber-50/60 border-amber-200/90 text-amber-950',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
      title: 'Caution Advised',
    },
    not_compatible: {
      bg: 'bg-rose-50/60 border-rose-200/90 text-rose-950',
      icon: XCircle,
      iconColor: 'text-rose-600',
      badgeBg: 'bg-rose-100 text-rose-900 border-rose-300',
      title: 'Not Compatible',
    },
  };

  const config = configs[status] || configs.compatible;
  const Icon = config.icon;

  return (
    <Card className={`p-6 border ${config.bg} space-y-4 shadow-sm rounded-3xl`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center ${config.badgeBg} border shadow-2xs flex-shrink-0`}
          >
            <Icon className={`w-5 h-5 ${config.iconColor} stroke-[2.2]`} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Dietary Compatibility
            </span>
            <h3 className="text-lg font-black tracking-tight text-slate-900 truncate">
              {label || config.title}
            </h3>
          </div>
        </div>
        {checkedAgainst && checkedAgainst.diet && (
          <span className="text-xs font-bold px-3 py-1 rounded-xl bg-white border border-slate-200/80 shadow-2xs capitalize text-slate-700 flex-shrink-0">
            {checkedAgainst.diet}
          </span>
        )}
      </div>

      {reasons.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-slate-200/60">
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Conflicts Detected</span>
          </h4>
          <ul className="space-y-1.5 text-xs font-medium">
            {reasons.map((r, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 bg-white/80 px-3 py-1.5 rounded-xl border border-rose-100 text-rose-900"
              >
                <span className="font-bold text-rose-600">•</span>
                <span>{typeof r === 'string' ? r : (r?.message || r?.reason || r?.allergen || 'Dietary conflict detected')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-slate-200/60">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Cautions & Traces</span>
          </h4>
          <ul className="space-y-1.5 text-xs font-medium">
            {warnings.map((w, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 bg-white/80 px-3 py-1.5 rounded-xl border border-amber-100 text-amber-900"
              >
                <span className="font-bold text-amber-600">!</span>
                <span>{typeof w === 'string' ? w : (w?.message || w?.reason || 'Dietary warning detected')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {positiveMatches.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-slate-200/60">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Preferences Aligned</span>
          </h4>
          <ul className="space-y-1.5 text-xs font-medium">
            {positiveMatches.map((p, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 bg-white/80 px-3 py-1.5 rounded-xl border border-emerald-100 text-emerald-900"
              >
                <span className="font-bold text-emerald-600">✓</span>
                <span>{typeof p === 'string' ? p : (p?.message || p?.reason || 'Preference aligned')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
};
