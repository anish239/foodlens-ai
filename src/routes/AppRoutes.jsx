import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from '../components/layout/PublicLayout';
import { AppLayout } from '../components/layout/AppLayout';
import { LandingPage } from '../pages/Home/LandingPage';
import { DashboardPage } from '../pages/Dashboard/DashboardPage';
import { ScannerPage } from '../pages/Scanner/ScannerPage';
import { SearchPage } from '../pages/Search/SearchPage';
import { ProductDetailsPage } from '../pages/Product/ProductDetailsPage';
import { AnalysisPage } from '../pages/Analysis/AnalysisPage';
import { ComparePage } from '../pages/Compare/ComparePage';
import { HistoryPage } from '../pages/History/HistoryPage';
import { FavoritesPage } from '../pages/Favorites/FavoritesPage';
import { ProfilePage } from '../pages/Profile/ProfilePage';
import { SettingsPage } from '../pages/Settings/SettingsPage';
import { LoginPage } from '../pages/Auth/LoginPage';
import { RegisterPage } from '../pages/Auth/RegisterPage';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { NotFoundPage } from '../pages/NotFoundPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
      </Route>

      {/* Auth Pages */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected App Routes */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="scanner" element={<ScannerPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="product/:id" element={<ProductDetailsPage />} />
        <Route path="analysis" element={<AnalysisPage />} />
        <Route path="compare" element={<ComparePage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="favorites" element={<FavoritesPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
