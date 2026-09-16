import React from 'react';
import { Menu, Search, ScanBarcode, Scale, User, LogOut, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';

export const TopNavigation = () => {
  const { toggleMobileMenu, compareItems } = useApp();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) return 'Dashboard';
    if (path.includes('scanner')) return 'Scan Product';
    if (path.includes('search')) return 'Search Food';
    if (path.includes('analysis')) return 'Food Analysis';
    if (path.includes('compare')) return 'Compare Products';
    if (path.includes('history')) return 'Scan History';
    if (path.includes('favorites')) return 'Favorites';
    if (path.includes('profile')) return 'Profile';
    if (path.includes('settings')) return 'Settings';
    if (path.includes('product')) return 'Product Details';
    return 'FoodLens AI';
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 md:h-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between transition-all">
      {/* Left Title & Mobile Menu Trigger */}
      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 focus:outline-none"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <div>
          <h2 className="text-base md:text-xl font-bold text-slate-900 tracking-tight leading-tight">
            {getPageTitle()}
          </h2>
          <p className="hidden md:block text-xs text-slate-500 font-medium">
            Scan. Understand. Eat Smarter.
          </p>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Search Shortcut */}
        <button
          onClick={() => navigate('/app/search')}
          className="hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-400 text-xs hover:border-emerald-400 hover:text-slate-600 transition-all shadow-2xs group"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          <span>Search foods, brands...</span>
          <kbd className="bg-white px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-200 text-slate-400">
            /
          </kbd>
        </button>

        {/* Scan Button CTA */}
        <Button
          size="sm"
          onClick={() => navigate('/app/scanner')}
          className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm shadow-emerald-600/20 text-xs sm:text-sm h-9 px-3 sm:px-4 gap-1.5"
        >
          <ScanBarcode className="w-4 h-4" />
          <span className="hidden xs:inline">Scan</span>
        </Button>

        {/* Compare Quick Access */}
        {compareItems && compareItems.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const barcodes = compareItems.map((i) => i.barcode).join(',');
              navigate(`/app/compare?barcodes=${barcodes}`);
            }}
            className="rounded-xl border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs h-9 px-2.5 sm:px-3 gap-1.5"
          >
            <Scale className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-bold">{compareItems.length}</span>
          </Button>
        )}

        {/* User Profile avatar */}
        <div
          onClick={() => navigate('/app/profile')}
          className="flex items-center gap-2.5 pl-1.5 cursor-pointer group"
          title="View profile & diet settings"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center overflow-hidden border border-emerald-200 group-hover:ring-2 group-hover:ring-emerald-500 transition-all text-xs">
            {user?.profileImage ? (
              <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0).toUpperCase() || 'U'
            )}
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          title="Sign Out"
          className="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-200 transition-all"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
