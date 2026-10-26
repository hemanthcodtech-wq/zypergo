import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import RiderDashboard from './rider/RiderDashboard';
import RiderProfile from './rider/RiderProfile';
import RiderSettings from './rider/RiderSettings';
import RiderEarnings from './rider/RiderEarnings';
import LoginScreen from '../components/Auth/LoginScreen';
import SignupScreen from '../components/Auth/SignupScreen';
import { ProtectedRoute, PublicRoute } from '../components/Auth/RouteGuards';
import api from '../api';
import RiderWelcome from './rider/RiderWelcome';
import { LayoutDashboard, Wallet, User as UserIcon, Settings, LogOut, Navigation } from 'lucide-react';

function RiderLayout({ children, onLogout, user }) {
  const navigate = useNavigate();
  const currentPath = window.location.pathname;

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Earnings', path: '/earnings', icon: <Wallet size={20} /> },
    { name: 'Profile', path: '/profile', icon: <UserIcon size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> }
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans">
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 transition-all duration-300 shadow-[10px_0_40px_rgba(0,0,0,0.02)] z-50">
        <div className="p-6 flex items-center gap-3 mb-6">
          <img src="/images/logo.png" alt="ZyperGo Logo" className="h-8 w-auto object-contain" />
        </div>

        <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-[#006D77] text-white shadow-md' 
                    : 'text-slate-500 hover:bg-teal-50 hover:text-[#006D77] font-bold'
                }`}
              >
                {item.icon}
                <span className="text-sm">{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 mt-auto">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 font-bold rounded-xl hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="flex-1 overflow-y-auto pb-24 md:pb-0 relative z-10">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 shadow-[0_-8px_30px_rgba(0,0,0,0.05)] z-50 px-6 py-3 pb-safe-area flex justify-between items-center">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <button 
              key={item.name}
              onClick={() => navigate(item.path)} 
              className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-800'}`}
            >
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isActive ? 'bg-emerald-50' : 'bg-transparent'}`}>
                {item.icon}
              </div>
              <span className={`text-[10px] ${isActive ? 'font-black' : 'font-bold'}`}>{item.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function RiderApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('zypergo_token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleClearAuth = () => {
    localStorage.removeItem('zypergo_token');
    localStorage.removeItem('zypergo_user');
    setIsAuthenticated(false);
    setUser(null);
  };

  useEffect(() => {
    if (isAuthenticated) {
      const fetchProfile = async () => {
        setLoading(true);
        try {
          const userStr = localStorage.getItem('zypergo_user');
          if (userStr) {
             const u = JSON.parse(userStr);
             const userId = u.id || u._id;
             const res = await api.get(`/rider/me?userId=${userId}`);
             if (res.data.success) {
                setUser(res.data.data);
                localStorage.setItem('zypergo_user', JSON.stringify(res.data.data));
             }
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }
  }, [isAuthenticated]);

  const handleLoginSuccess = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    navigate('/', { replace: true });
  };

  if (loading) return <div className="flex h-screen items-center justify-center font-bold text-slate-500">Loading Profile...</div>;

  const approvalStatus = user?.riderDetails?.approvalStatus;

  return (
    <Routes>
      <Route path="/" element={
        <PublicRoute requiredRole="Rider">
          <RiderWelcome />
        </PublicRoute>
      } />
      <Route path="/login" element={
        <PublicRoute requiredRole="Rider">
          <LoginScreen role="Rider" onLoginSuccess={handleLoginSuccess} />
        </PublicRoute>
      } />
      <Route path="/signup" element={
        <PublicRoute requiredRole="Rider">
          <SignupScreen role="Rider" onLoginSuccess={handleLoginSuccess} />
        </PublicRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute requiredRole="Rider">
          <RiderLayout onLogout={handleClearAuth} user={user}>
            {approvalStatus === 'Approved' ? (
              <RiderDashboard user={user} onLogout={handleClearAuth} />
            ) : (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
              <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <div className="text-4xl">⏱</div>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Pending</h2>
                <p className="text-slate-500 mb-6">Your application is currently under review by our operations team. We will notify you via email once you are approved to start accepting trips.</p>
                <button onClick={() => window.location.reload()} className="px-6 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200">
                  Check Status
                </button>
              </div>
              </div>
            )}
          </RiderLayout>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute requiredRole="Rider">
          <RiderLayout onLogout={handleClearAuth} user={user}>
            <RiderProfile user={user} onLogout={handleClearAuth} />
          </RiderLayout>
        </ProtectedRoute>
      } />
      <Route path="/earnings" element={
        <ProtectedRoute requiredRole="Rider">
          <RiderLayout onLogout={handleClearAuth} user={user}>
            <RiderEarnings user={user} onLogout={handleClearAuth} />
          </RiderLayout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute requiredRole="Rider">
          <RiderLayout onLogout={handleClearAuth} user={user}>
            <RiderSettings user={user} onLogout={handleClearAuth} />
          </RiderLayout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />} />
    </Routes>
  );
}
