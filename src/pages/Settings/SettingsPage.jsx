import React from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { PageTransition } from '../../components/animation/PageTransition';
import { Settings, Bell, Lock, Database, Moon, Shield } from 'lucide-react';

export const SettingsPage = () => {
  return (
    <PageTransition className="space-y-8 max-w-4xl mx-auto pb-16">
      <PageHeader
        title="Settings"
        description="Manage your appearance, notifications, privacy, and data export options."
      />

      <div className="space-y-6">
        <Card className="p-6 sm:p-7 space-y-4 rounded-3xl border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Appearance &amp; Theme</h3>
              <p className="text-xs text-slate-500 font-medium">Choose your preferred visual theme for FoodLens AI.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl border-2 border-emerald-600 bg-emerald-50 text-emerald-900 font-black text-xs shadow-2xs"
            >
              Light Mode (Active)
            </button>
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-400 font-bold text-xs opacity-60 cursor-not-allowed"
            >
              Dark Mode (Coming Soon)
            </button>
          </div>
        </Card>

        <Card className="p-6 sm:p-7 space-y-4 rounded-3xl border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Notifications</h3>
              <p className="text-xs text-slate-500 font-medium">Configure alert preferences for scan results and product updates.</p>
            </div>
          </div>
          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4" />
              <span className="text-xs font-bold text-slate-700">Scan summary alerts &amp; health score achievements</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4" />
              <span className="text-xs font-bold text-slate-700">Allergen and dietary conflict notifications</span>
            </label>
          </div>
        </Card>

        <Card className="p-6 sm:p-7 space-y-4 rounded-3xl border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Data &amp; Cache Storage</h3>
              <p className="text-xs text-slate-500 font-medium">Manage local scan history cache and device storage preferences.</p>
            </div>
          </div>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.removeItem('foodlens_search_history');
                alert('Local search history cache cleared.');
              }}
              className="rounded-xl font-bold"
            >
              Clear Local Search Cache
            </Button>
          </div>
        </Card>
      </div>
    </PageTransition>
  );
};
