import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ScanBarcode,
  Search,
  Sparkles,
  Scale,
  History,
  Heart,
  User,
  Settings,
  ShieldCheck,
  X,
  LogOut,
} from 'lucide-react';
import { APP_NAME, APP_TAGLINE } from '../../constants/appConstants';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

// Unified single navigation list in exact requested order
const navItems = [
  { name: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
  { name: 'Scanner', path: '/app/scanner', icon: ScanBarcode },
  { name: 'Search', path: '/app/search', icon: Search },
  { name: 'Analysis', path: '/app/analysis', icon: Sparkles },
  { name: 'Compare', path: '/app/compare', icon: Scale },
  { name: 'History', path: '/app/history', icon: History },
  { name: 'Favorites', path: '/app/favorites', icon: Heart },
  { name: 'Profile', path: '/app/profile', icon: User },
  { name: 'Settings', path: '/app/settings', icon: Settings },
];

export const Sidebar = () => {
  const { mobileMenuOpen, toggleMobileMenu, compareItems, favorites } = useApp();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs transition-opacity duration-200"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 md:w-72 bg-white/95 backdrop-blur-xl border-r border-slate-200/90 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100/80">
          <NavLink
            to="/app/dashboard"
            onClick={() => mobileMenuOpen && toggleMobileMenu()}
            className="flex items-center gap-3 group"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 group-hover:scale-105 transition-all duration-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                {APP_NAME}
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300/60">
                  AI
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 font-semibold">{APP_TAGLINE}</p>
            </div>
          </NavLink>

          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Unified Navigation List (Single section, no category headers) */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => mobileMenuOpen && toggleMobileMenu()}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 group ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-900 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                            : 'bg-slate-100/80 text-slate-500 group-hover:bg-slate-200/80 group-hover:text-slate-800'
                        }`}
                      >
                        <IconComponent className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <span className="tracking-tight">{item.name}</span>
                    </div>
                    {item.name === 'Compare' && compareItems?.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-2xs">
                        {compareItems.length}
                      </span>
                    )}
                    {item.name === 'Favorites' && favorites?.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                        {favorites.length}
                      </span>
                    )}
                    {isActive && !item.name.includes('Compare') && !item.name.includes('Favorites') && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Sidebar Footer User Info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70">
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
            <div
              onClick={() => {
                navigate('/app/profile');
                if (mobileMenuOpen) toggleMobileMenu();
              }}
              className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center overflow-hidden border border-emerald-200/80 flex-shrink-0 text-xs shadow-2xs">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                  {user?.name || 'FoodLens User'}
                </p>
                <p className="text-[11px] text-emerald-700 font-semibold truncate">
                  {user?.preferences?.diet || 'Diet Configured'}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
