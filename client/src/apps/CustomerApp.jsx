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
import MobileDeviceFrame from '../components/common/MobileDeviceFrame';

function CustomerLayout() {
  const location = useLocation();

  return (
    <div className="w-full h-full bg-[#F8FAFC] flex flex-col font-sans relative overflow-hidden">
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="flex-1 overflow-y-auto pb-24 relative z-10">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 flex justify-between items-center px-4 pb-4 pt-2.5 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.06)] rounded-t-3xl">
        <Link 
          to="/dashboard" 
          className={`flex flex-col items-center gap-1 w-1/5 transition-colors ${location.pathname === '/dashboard' ? 'text-[#0052CC]' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Home size={22} className={location.pathname === '/dashboard' ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="text-[10px] font-bold">Home</span>
        </Link>
        <Link 
          to="/shipments" 
          className={`flex flex-col items-center gap-1 w-1/5 transition-colors ${location.pathname.startsWith('/shipments') ? 'text-[#0052CC]' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Package size={22} className={location.pathname.startsWith('/shipments') ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="text-[10px] font-bold">Orders</span>
        </Link>
        
        {/* Raised Floating Book Action Button */}
        <Link to="/booking" className="flex flex-col items-center w-1/5 relative group">
          <div className="absolute -top-7 w-13 h-13 bg-[#0052CC] hover:bg-[#0047cc] rounded-full border-4 border-white shadow-[0_8px_20px_rgba(0,82,204,0.4)] flex items-center justify-center text-white active:scale-95 transition-all">
            <Plus size={28} strokeWidth={2.8} />
          </div>
          <span className="text-[10px] font-bold mt-7 text-[#0052CC]">Book</span>
        </Link>
        
        <Link 
          to="/track" 
          className={`flex flex-col items-center gap-1 w-1/5 transition-colors ${location.pathname.startsWith('/track') ? 'text-[#0052CC]' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <MapPin size={22} className={location.pathname.startsWith('/track') ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="text-[10px] font-bold">Track</span>
        </Link>
        <Link 
          to="/profile" 
          className={`flex flex-col items-center gap-1 w-1/5 transition-colors ${location.pathname.startsWith('/profile') ? 'text-[#0052CC]' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <UserIcon size={22} className={location.pathname.startsWith('/profile') ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="text-[10px] font-bold">Profile</span>
        </Link>
      </nav>
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
    navigate('/dashboard', { replace: true });
  };

  return (
    <MobileDeviceFrame appName="Customer App">
      <Routes>
        <Route path="/login" element={
          <PublicRoute requiredRole="Customer">
            <LoginScreen role="Customer" onLoginSuccess={handleLoginSuccess} />
          </PublicRoute>
        } />
        <Route path="/signup" element={
          <PublicRoute requiredRole="Customer">
            <SignupScreen role="Customer" onLoginSuccess={handleLoginSuccess} />
          </PublicRoute>
        } />

        <Route path="/" element={
          <PublicRoute requiredRole="Customer">
            <CustomerWelcome />
          </PublicRoute>
        } />

        <Route element={
          <ProtectedRoute requiredRole="Customer">
            <CustomerLayout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={<CustomerDashboard />} />
          <Route path="/shipments" element={<MyShipments />} />
          <Route path="/invoices" element={<CustomerInvoices />} />
          <Route path="/order/:id" element={<OrderDetails />} />
          <Route path="/track/:id?" element={<TrackingTimeline />} />
          <Route path="/address-book" element={<AddressBook />} />
          <Route path="/addresses" element={<AddressBook />} />
          <Route path="/support" element={<SupportCenter />} />
          <Route path="/notifications" element={<CustomerNotifications />} />
          <Route path="/booking" element={<BookingFlow />} />
          <Route path="/profile" element={<CustomerProfile />} />
          <Route path="/settings" element={<CustomerSettings />} />
        </Route>
        
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />} />
      </Routes>
    </MobileDeviceFrame>
  );
}
