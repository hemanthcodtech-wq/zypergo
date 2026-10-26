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
import LoginScreen from '../components/Auth/LoginScreen';
import SignupScreen from '../components/Auth/SignupScreen';
import CustomerWelcome from './customer/CustomerWelcome';
import { ProtectedRoute, PublicRoute } from '../components/Auth/RouteGuards';
import { Search, Bell, ChevronDown, User as UserIcon, Settings, Home, Package, MapPin, Plus, Calendar, HelpCircle } from 'lucide-react';
import CustomerNotifications from './customer/CustomerNotifications';
import OrderDetails from './customer/OrderDetails';

function CustomerLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: 'Customer User', role: 'Customer' });
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isCustomerPrefix = location.pathname.startsWith('/customer');
  const base = isCustomerPrefix ? '/customer' : '';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem('zypergo_user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('zypergo_token');
    localStorage.removeItem('zypergo_user');
    window.location.href = isCustomerPrefix ? '/customer/login' : '/login';
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center font-sans">
      {/* App Container */}
      <div className="w-full max-w-md md:max-w-full bg-white h-[100dvh] relative shadow-2xl md:shadow-none flex flex-col md:flex-row overflow-hidden">
        
        {/* Desktop Sidebar Navigation */}
        <nav className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 p-6 z-50 shadow-[10px_0_40px_rgba(0,0,0,0.02)] shrink-0">
          <div className="flex items-center gap-2 mb-10">
            <img src="/images/logo.png" alt="ZyperGo" className="h-8 w-auto object-contain" />
          </div>
          
          <div className="flex flex-col gap-2">
            <Link to={`${base}/dashboard`} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${location.pathname.endsWith('/dashboard') ? 'bg-[#0052CC] text-white shadow-md' : 'text-slate-500 hover:bg-blue-50 hover:text-[#0052CC]'}`}>
              <Home size={20} />
              <span className="font-bold text-sm">Dashboard</span>
            </Link>
            <Link to={`${base}/shipments`} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${location.pathname.includes('/shipments') ? 'bg-[#0052CC] text-white shadow-md' : 'text-slate-500 hover:bg-blue-50 hover:text-[#0052CC]'}`}>
              <Package size={20} />
              <span className="font-bold text-sm">Orders</span>
            </Link>
            <Link to={`${base}/booking`} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${location.pathname.includes('/booking') ? 'bg-[#0052CC] text-white shadow-md' : 'text-slate-500 hover:bg-blue-50 hover:text-[#0052CC]'}`}>
              <Calendar size={20} />
              <span className="font-bold text-sm">Bookings</span>
            </Link>
            <Link to={`${base}/track`} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${location.pathname.includes('/track') ? 'bg-[#0052CC] text-white shadow-md' : 'text-slate-500 hover:bg-blue-50 hover:text-[#0052CC]'}`}>
              <MapPin size={20} />
              <span className="font-bold text-sm">Track Order</span>
            </Link>
          </div>
          
          <div className="mt-auto">
            <Link to={`${base}/profile`} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${location.pathname.includes('/profile') ? 'bg-[#0052CC] text-white shadow-md' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}>
              <UserIcon size={20} />
              <div className="flex flex-col">
                <span className="font-bold text-sm">{user.name}</span>
                <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest">{user.role}</span>
              </div>
            </Link>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 w-full overflow-y-auto bg-[#F8FAFC] pb-20 md:pb-0 relative">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="md:hidden absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex justify-between items-center px-4 pb-4 pt-2.5 z-[60] shadow-[0_-10px_30px_rgba(0,0,0,0.06)] rounded-t-3xl">
          <Link to={`${base}/dashboard`} className={`flex flex-col items-center gap-1 w-1/5 transition-colors ${location.pathname.endsWith('/dashboard') ? 'text-[#0052CC]' : 'text-slate-400 hover:text-slate-600'}`}>
            <Home size={22} className={location.pathname.endsWith('/dashboard') ? 'stroke-[2.5]' : 'stroke-2'} />
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
      </div>
    </div>
  );
}

export default function CustomerApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('zypergo_token'));
  const navigate = useNavigate();

  const handleClearAuth = () => {
    localStorage.removeItem('zypergo_token');
    localStorage.removeItem('zypergo_user');
    setIsAuthenticated(false);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    navigate('/customer/dashboard', { replace: true });
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
      <Route path="profile" element={<CustomerProfile />} />
      <Route path="settings" element={<CustomerSettings />} />
    </>
  );

  return (
    <Routes>
      <Route path="/customer/login" element={
        <PublicRoute requiredRole="Customer">
          <LoginScreen role="Customer" onLoginSuccess={handleLoginSuccess} />
        </PublicRoute>
      } />
      <Route path="/login" element={
        <PublicRoute requiredRole="Customer">
          <LoginScreen role="Customer" onLoginSuccess={handleLoginSuccess} />
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

      <Route path="/customer" element={
        <PublicRoute requiredRole="Customer">
          <LoginScreen role="Customer" onLoginSuccess={handleLoginSuccess} />
        </PublicRoute>
      } />
      <Route path="/customer/welcome" element={
        <PublicRoute requiredRole="Customer">
          <CustomerWelcome />
        </PublicRoute>
      } />
      <Route path="/" element={
        <PublicRoute requiredRole="Customer">
          <LoginScreen role="Customer" onLoginSuccess={handleLoginSuccess} />
        </PublicRoute>
      } />

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
      
      <Route path="*" element={<Navigate to={isAuthenticated ? "/customer/dashboard" : "/customer"} replace />} />
    </Routes>
  );
}
