import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import CustomerDashboard from './customer/CustomerDashboard';
import BookingFlow from './customer/BookingFlow';
import MyShipments from './customer/MyShipments';
import SupportCenter from './customer/SupportCenter';
import TrackingTimeline from './customer/TrackingTimeline';
import AddressBook from './customer/AddressBook';
import CustomerInvoices from './customer/CustomerInvoices';
import CustomerProfile from './customer/CustomerProfile';
import CustomerSettings from './customer/CustomerSettings';
import BookingHistory from './customer/BookingHistory';
import LoginScreen from '../components/Auth/LoginScreen';
import SignupScreen from '../components/Auth/SignupScreen';
import CustomerSplash from './customer/CustomerSplash';
import { ProtectedRoute, PublicRoute } from '../components/Auth/RouteGuards';
import { Search, Bell, ChevronDown, User as UserIcon, Settings, Home, Package, MapPin, Plus, Calendar, HelpCircle } from 'lucide-react';
import CustomerNotifications from './customer/CustomerNotifications';
import OrderDetails from './customer/OrderDetails';
import MobileDeviceFrame from '../components/common/MobileDeviceFrame';

function CustomerLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: 'Customer User', role: 'Customer' });

  const isCustomerPrefix = location.pathname.startsWith('/customer');
  const base = isCustomerPrefix ? '/customer' : '';
  const isBookingPage = location.pathname.includes('/booking');

  useEffect(() => {
    const userData = localStorage.getItem('zypergo_user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('zypergo_token');
    localStorage.removeItem('zypergo_user');
    sessionStorage.removeItem('zypergo_portal');
    window.location.href = '/customer/login';
  };

  return (
    <div 
      className="w-full h-full flex flex-col bg-[#F8FAFC] font-sans relative overflow-hidden"
      style={{ transform: 'translate3d(0, 0, 0)' }}
    >
      
      {/* App Main Content View */}
      <main className={`flex-1 w-full overflow-y-auto relative ${isBookingPage ? 'pb-0' : 'pb-20'}`}>
        <Outlet />
      </main>

      {/* Mobile App Bottom Navigation Bar */}
      {!isBookingPage && (
        <nav className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 flex justify-between items-center px-4 pb-4 pt-2.5 z-40 shadow-[0_-10px_25px_rgba(0,0,0,0.05)] rounded-t-3xl">
        <Link to={`${base}/dashboard`} className={`flex flex-col items-center gap-1 w-1/5 transition-colors ${location.pathname.endsWith('/dashboard') || location.pathname === base || location.pathname === `${base}/` ? 'text-[#0052CC]' : 'text-slate-400 hover:text-slate-600'}`}>
          <Home size={22} className={location.pathname.endsWith('/dashboard') || location.pathname === base || location.pathname === `${base}/` ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="text-[10px] font-bold">Home</span>
        </Link>
        
        <Link to={`${base}/shipments`} className={`flex flex-col items-center gap-1 w-1/5 transition-colors ${location.pathname.includes('/shipments') ? 'text-[#0052CC]' : 'text-slate-400 hover:text-slate-600'}`}>
          <Package size={22} className={location.pathname.includes('/shipments') ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="text-[10px] font-bold">Orders</span>
        </Link>
        
        {/* Raised Floating Book Action Button */}
        <Link to={`${base}/booking`} className="flex flex-col items-center w-1/5 relative group">
          <div className="absolute -top-7 w-13 h-13 bg-[#0052CC] hover:bg-[#0047cc] rounded-full border-4 border-white shadow-[0_8px_20px_rgba(0,82,204,0.4)] flex items-center justify-center text-white active:scale-95 transition-all">
            <Plus size={28} strokeWidth={2.8} />
          </div>
          <span className={`text-[10px] font-bold mt-7 ${location.pathname.includes('/booking') ? 'text-[#0052CC]' : 'text-[#0052CC]'}`}>Book</span>
        </Link>
        
        <Link to={`${base}/track`} className={`flex flex-col items-center gap-1 w-1/5 transition-colors ${location.pathname.includes('/track') ? 'text-[#0052CC]' : 'text-slate-400 hover:text-slate-600'}`}>
          <MapPin size={22} className={location.pathname.includes('/track') ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="text-[10px] font-bold">Track</span>
        </Link>
        
        <Link to={`${base}/profile`} className={`flex flex-col items-center gap-1 w-1/5 transition-colors ${location.pathname.includes('/profile') ? 'text-[#0052CC]' : 'text-slate-400 hover:text-slate-600'}`}>
          <UserIcon size={22} className={location.pathname.includes('/profile') ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="text-[10px] font-bold">Profile</span>
        </Link>
      </nav>
      )}

    </div>
  );
}

export default function CustomerApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('zypergo_token'));
  const navigate = useNavigate();

  const handleClearAuth = () => {
    localStorage.removeItem('zypergo_token');
    localStorage.removeItem('zypergo_user');
    sessionStorage.removeItem('zypergo_portal');
    setIsAuthenticated(false);
    window.location.href = '/customer/login';
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    const target = window.location.pathname.startsWith('/customer') ? '/customer/dashboard' : '/dashboard';
    navigate(target, { replace: true });
  };

  const customerChildRoutes = (
    <>
      <Route path="dashboard" element={<CustomerDashboard />} />
      <Route path="shipments" element={<MyShipments />} />
      <Route path="invoices" element={<CustomerInvoices />} />
      <Route path="order/:id" element={<OrderDetails />} />
      <Route path="track/:id?" element={<TrackingTimeline />} />
      <Route path="address-book" element={<AddressBook />} />
      <Route path="addresses" element={<AddressBook />} />
      <Route path="support" element={<SupportCenter />} />
      <Route path="notifications" element={<CustomerNotifications />} />
      <Route path="booking" element={<BookingFlow />} />
      <Route path="booking-history" element={<BookingHistory />} />
      <Route path="history" element={<BookingHistory />} />
      <Route path="profile" element={<CustomerProfile />} />
      <Route path="wallet" element={<CustomerProfile defaultView="wallet" />} />
      <Route path="rate-card" element={<CustomerProfile defaultView="rateCard" />} />
      <Route path="settings" element={<CustomerSettings />} />
    </>
  );

  const isStandaloneApp = window.location.port === '8081' || window.location.port === '8001';

  const routesContent = (
    <Routes>
      {/* Splash & Welcome Screens (Splash only on standalone app) */}
      <Route path="/customer/splash" element={
        <PublicRoute requiredRole="Customer">
          {isStandaloneApp ? <CustomerSplash /> : <LoginScreen role="Customer" hideSwitchRole={true} onLoginSuccess={handleLoginSuccess} />}
        </PublicRoute>
      } />
      <Route path="/splash" element={
        <PublicRoute requiredRole="Customer">
          {isStandaloneApp ? <CustomerSplash /> : <LoginScreen role="Customer" hideSwitchRole={true} onLoginSuccess={handleLoginSuccess} />}
        </PublicRoute>
      } />
      <Route path="/customer" element={
        <PublicRoute requiredRole="Customer">
          {isStandaloneApp ? <CustomerSplash /> : <LoginScreen role="Customer" hideSwitchRole={true} onLoginSuccess={handleLoginSuccess} />}
        </PublicRoute>
      } />
      <Route path="/" element={
        <PublicRoute requiredRole="Customer">
          {isStandaloneApp ? <CustomerSplash /> : <LoginScreen role="Customer" hideSwitchRole={true} onLoginSuccess={handleLoginSuccess} />}
        </PublicRoute>
      } />

      {/* Customer Login & Signup Routes */}
      <Route path="/customer/login" element={
        <PublicRoute requiredRole="Customer">
          <LoginScreen role="Customer" hideSwitchRole={true} onLoginSuccess={handleLoginSuccess} />
        </PublicRoute>
      } />
      <Route path="/login" element={
        <PublicRoute requiredRole="Customer">
          <LoginScreen role="Customer" hideSwitchRole={true} onLoginSuccess={handleLoginSuccess} />
        </PublicRoute>
      } />

      <Route path="/customer/signup" element={
        <PublicRoute requiredRole="Customer">
          <SignupScreen role="Customer" onLoginSuccess={handleLoginSuccess} />
        </PublicRoute>
      } />
      <Route path="/signup" element={
        <PublicRoute requiredRole="Customer">
          <SignupScreen role="Customer" onLoginSuccess={handleLoginSuccess} />
        </PublicRoute>
      } />

      {/* Protected Customer Routes */}
      <Route path="/customer/*" element={
        <ProtectedRoute requiredRole="Customer">
          <CustomerLayout />
        </ProtectedRoute>
      }>
        {customerChildRoutes}
      </Route>

      <Route element={
        <ProtectedRoute requiredRole="Customer">
          <CustomerLayout />
        </ProtectedRoute>
      }>
        {customerChildRoutes}
      </Route>
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to={isAuthenticated ? (window.location.pathname.startsWith('/customer') ? "/customer/dashboard" : "/dashboard") : (window.location.pathname.startsWith('/customer') ? "/customer" : "/")} replace />} />
    </Routes>
  );

  if (isStandaloneApp) {
    return (
      <MobileDeviceFrame appName="ZyperGo Customer App">
        {routesContent}
      </MobileDeviceFrame>
    );
  }

  return routesContent;
}
