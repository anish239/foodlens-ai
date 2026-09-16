import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavigation } from './TopNavigation';
import { ComparisonDock } from './ComparisonDock';
import {
  LayoutDashboard,
  ScanBarcode,
  Search,
  History,
  Heart,
} from 'lucide-react';

const mobileBottomNavItems = [
  { name: 'Home', path: '/app/dashboard', icon: LayoutDashboard },
  { name: 'Search', path: '/app/search', icon: Search },
  { name: 'Scan', path: '/app/scanner', icon: ScanBarcode, isPrimary: true },
  { name: 'History', path: '/app/history', icon: History },
  { name: 'Saved', path: '/app/favorites', icon: Heart },
];

export const AppLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-emerald-500 selection:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 lg:pl-72 pb-16 md:pb-0">
        <TopNavigation />
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Floating Comparison Dock */}
      <ComparisonDock />

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-3 py-1.5 flex items-center justify-around">
        {mobileBottomNavItems.map((item) => {
          const Icon = item.icon;
          if (item.isPrimary) {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 active:scale-95 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-emerald-800 mt-1">
                  {item.name}
                </span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[11px] font-semibold transition-colors ${
                  isActive
                    ? 'text-emerald-700 font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-5 h-5 mb-0.5 ${
                      isActive ? 'text-emerald-600 stroke-[2.5]' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};
