import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { APP_NAME } from '../../constants/appConstants';
import { Button } from '../common/Button';
import { ShieldCheck } from 'lucide-react';

export const PublicLayout = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-emerald-500 selection:text-white">
      {/* Public Header */}
      <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-4 md:px-12 flex items-center justify-between">
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">{APP_NAME}</h1>
            <p className="text-[11px] text-slate-500 font-medium">Scan. Understand. Eat Smarter.</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/app/dashboard')}>
            Dashboard
          </Button>
          <Button variant="primary" onClick={() => navigate('/app/scanner')}>
            Launch Scanner
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Public Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 px-4 md:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-bold text-slate-900 text-lg">{APP_NAME}</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              AI-powered food intelligence platform helping you understand ingredients, allergens, nutrition, and processing quality.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li><a href="#features" className="hover:text-emerald-600 transition-colors">Barcode Scanning</a></li>
              <li><a href="#features" className="hover:text-emerald-600 transition-colors">Food Search</a></li>
              <li><a href="#features" className="hover:text-emerald-600 transition-colors">FoodLens Score</a></li>
              <li><a href="#features" className="hover:text-emerald-600 transition-colors">AI Insights</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wider">Resources</h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li><a href="#" className="hover:text-emerald-600 transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-emerald-600 transition-colors">Scoring Methodology</a></li>
              <li><a href="#" className="hover:text-emerald-600 transition-colors">Allergen Safety</a></li>
              <li><a href="#" className="hover:text-emerald-600 transition-colors">API Access</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wider">Legal & Trust</h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li><a href="#" className="hover:text-emerald-600 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-emerald-600 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-emerald-600 transition-colors">Medical Disclaimer</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400">
          <p>© {new Date().getFullYear()} FoodLens AI. All rights reserved.</p>
          <p className="mt-2 md:mt-0">Scan. Understand. Eat Smarter.</p>
        </div>
      </footer>
    </div>
  );
};
