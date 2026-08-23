import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import HubManagerDashboard from './hub/HubManagerDashboard';
import LoginScreen from '../components/Auth/LoginScreen';
import HubWelcome from './hub/HubWelcome';
import { ProtectedRoute, PublicRoute } from '../components/Auth/RouteGuards';
import HubScan from './hub/HubScan';
import HubManifests from './hub/HubManifests';
import HubInventory from './hub/HubInventory';
import HubRecords from './hub/HubRecords';
import HubHome from './hub/HubHome';
import HubAccount from './hub/HubAccount';
import HubBookOrder from './hub/HubBookOrder';

export default function HubApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('zypergo_token'));
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    navigate('/dashboard', { replace: true });
  };

  const handleClearAuth = () => {
    localStorage.removeItem('zypergo_token');
    localStorage.removeItem('zypergo_user');
    setIsAuthenticated(false);
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={
        <PublicRoute requiredRole="HubManager">
          <HubWelcome />
        </PublicRoute>
      } />
      
      <Route path="/login" element={
        <PublicRoute requiredRole="HubManager">
          <LoginScreen role="HubManager" onLoginSuccess={handleLoginSuccess} />
        </PublicRoute>
      } />

      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute requiredRole="HubManager">
          <HubManagerDashboard onLogout={handleClearAuth} />
        </ProtectedRoute>
      }>
        <Route index element={<HubHome />} />
        <Route path="book" element={<HubBookOrder />} />
        <Route path="scan" element={<HubScan />} />
        <Route path="manifests" element={<HubManifests />} />
        <Route path="inventory" element={<HubInventory />} />
        <Route path="records" element={<HubRecords />} />
        <Route path="account" element={<HubAccount />} />
      </Route>
      
      {/* Wildcard */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />} />
    </Routes>
  );
}
