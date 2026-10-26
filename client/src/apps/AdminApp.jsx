import React, { useState } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import AdminLayout from '../pages/admin/AdminLayout';
import LiveMapPage from '../pages/admin/LiveMapPage';
import RiderManagementPage from '../pages/admin/RiderManagementPage';
import AdminDashboard from './admin/AdminDashboard';
import BookingManagement from './admin/BookingManagement';
import PlatformConfig from './admin/PlatformConfig';
import MarketingBroadcast from './admin/MarketingBroadcast';
import HubManagement from './admin/HubManagement';
import DispatchRouting from './admin/DispatchRouting';
import FinancePricing from './admin/FinancePricing';
import FinanceSettlements from './admin/FinanceSettlements';
import SupportTickets from './admin/SupportTickets';
import ServiceabilityEngine from './admin/ServiceabilityEngine';
import NdrExceptions from './admin/NdrExceptions';
import ReverseLogistics from './admin/ReverseLogistics';
import AnalyticsDashboard from '../pages/admin/analytics/AnalyticsDashboard';
import AdminLoginScreen from './admin/AdminLoginScreen';
import ScanningManifest from './admin/ScanningManifest';
import { ProtectedRoute, PublicRoute } from '../components/Auth/RouteGuards';

function AdminApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('zypergo_token'));
  const navigate = useNavigate();

  const handleClearAuth = () => {
    localStorage.removeItem('zypergo_token');
    localStorage.removeItem('zypergo_user');
    setIsAuthenticated(false);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    navigate('/admin', { replace: true });
  };

  const adminChildRoutes = (
    <>
      <Route index element={<AdminDashboard />} />
      <Route path="bookings" element={<BookingManagement />} />
      <Route path="hubs" element={<HubManagement />} />
      <Route path="scanning" element={<ScanningManifest />} />
      <Route path="dispatch" element={<DispatchRouting />} />
      <Route path="rider-management" element={<RiderManagementPage />} />
      <Route path="live-map" element={<LiveMapPage />} />
      <Route path="finance" element={<FinancePricing />} />
      <Route path="settlements" element={<FinanceSettlements />} />
      <Route path="serviceability" element={<ServiceabilityEngine />} />
      <Route path="ndr" element={<NdrExceptions />} />
      <Route path="returns" element={<ReverseLogistics />} />
      <Route path="support" element={<SupportTickets />} />
      <Route path="reports" element={<AnalyticsDashboard />} />
      <Route path="marketing" element={<MarketingBroadcast />} />
      <Route path="settings" element={<PlatformConfig />} />
    </>
  );

  return (
    <Routes>
      <Route path="/admin/login" element={
        <PublicRoute requiredRole="SuperAdmin">
          <AdminLoginScreen onLoginSuccess={handleLoginSuccess} />
        </PublicRoute>
      } />
      <Route path="/login" element={
        <PublicRoute requiredRole="SuperAdmin">
          <AdminLoginScreen onLoginSuccess={handleLoginSuccess} />
        </PublicRoute>
      } />
      
      <Route path="/admin" element={
        isAuthenticated ? (
          <ProtectedRoute requiredRole="SuperAdmin">
            <AdminLayout />
          </ProtectedRoute>
        ) : (
          <PublicRoute requiredRole="SuperAdmin">
            <AdminLoginScreen onLoginSuccess={handleLoginSuccess} />
          </PublicRoute>
        )
      } />
      
      <Route path="/admin/*" element={
        <ProtectedRoute requiredRole="SuperAdmin">
          <AdminLayout />
        </ProtectedRoute>
      }>
        {adminChildRoutes}
      </Route>

      <Route path="/" element={
        isAuthenticated ? (
          <ProtectedRoute requiredRole="SuperAdmin">
            <AdminLayout />
          </ProtectedRoute>
        ) : (
          <PublicRoute requiredRole="SuperAdmin">
            <AdminLoginScreen onLoginSuccess={handleLoginSuccess} />
          </PublicRoute>
        )
      }>
        {adminChildRoutes}
      </Route>
      
      <Route path="*" element={<Navigate to={isAuthenticated ? "/admin" : "/admin/login"} replace />} />
    </Routes>
  );
}

export default AdminApp;
