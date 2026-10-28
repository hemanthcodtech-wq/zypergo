import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import RiderDashboard from './rider/RiderDashboard';
import RiderProfile from './rider/RiderProfile';
import RiderSettings from './rider/RiderSettings';
import RiderEarnings from './rider/RiderEarnings';
import RiderHistory from './rider/RiderHistory';
import LoginScreen from '../components/Auth/LoginScreen';
import SignupScreen from '../components/Auth/SignupScreen';
import RiderSplash from './rider/RiderSplash';
import { ProtectedRoute, PublicRoute } from '../components/Auth/RouteGuards';
import api from '../api';
import { LayoutDashboard, Wallet, User as UserIcon, Clock, Settings, LogOut, Navigation } from 'lucide-react';
import MobileDeviceFrame from '../components/common/MobileDeviceFrame';
import { getImageUrl } from '../utils/imageUrl';

function RiderLayout({ children, onLogout, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const isPrefix = currentPath.startsWith('/rider');
  const base = isPrefix ? '/rider' : '';
  const getProfilePhoto = () => {
    const userId = user?.id || user?._id || user?.phone;
    let photo = user?.photoUrl || user?.riderDetails?.documents?.profileImageUrl;
    if (!photo && userId) {
      photo = localStorage.getItem('zypergo_profile_photo_' + userId);
    }
    if (!photo) {
      const stored = localStorage.getItem('zypergo_user');
      if (stored) {
        try {
          const u = JSON.parse(stored);
          const uId = u.id || u._id || u.phone;
          photo = u.photoUrl || u.riderDetails?.documents?.profileImageUrl || (uId ? localStorage.getItem('zypergo_profile_photo_' + uId) : null);
        } catch (e) {}
      }
    }
    return photo;
  };

  const navProfilePhoto = getProfilePhoto();

  const navItems = [
    { name: 'Dashboard', path: `${base}/dashboard`, icon: <LayoutDashboard size={20} /> },
    { name: 'Earnings', path: `${base}/earnings`, icon: <Wallet size={20} /> },
    { name: 'History', path: `${base}/history`, icon: <Clock size={20} /> },
    { 
      name: 'Profile', 
      path: `${base}/profile`, 
      icon: navProfilePhoto ? (
        <div className="w-5 h-5 rounded-full overflow-hidden border border-amber-400 shadow-2xs">
          <img src={getImageUrl(navProfilePhoto)} alt="Profile" className="w-full h-full object-cover" />
        </div>
      ) : (
        <UserIcon size={20} />
      ) 
    }
  ];

  return (
    <div 
      className="w-full h-full flex flex-col bg-[#F8FAFC] font-sans relative overflow-hidden"
      style={{ transform: 'translate3d(0, 0, 0)' }}
    >
      {/* Main Content Area */}
      <main className="flex-1 w-full overflow-y-auto pb-20 relative z-10">
        {children}
      </main>

      {/* Mobile App Bottom Navigation Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-8px_25px_rgba(0,0,0,0.05)] z-40 px-6 py-2.5 flex justify-between items-center rounded-t-3xl">
        {navItems.map((item) => {
          const isActive = currentPath === item.path || (item.path.endsWith('/dashboard') && (currentPath === '/rider' || currentPath === '/'));
          return (
            <button 
              key={item.name}
              onClick={() => navigate(item.path)} 
              className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-[#D97706]' : 'text-slate-400 hover:text-slate-800'}`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isActive ? 'bg-amber-100/60 text-[#D97706]' : 'bg-transparent text-slate-400'}`}>
                {item.icon}
              </div>
              <span className={`text-[10px] ${isActive ? 'font-black text-[#D97706]' : 'font-bold'}`}>{item.name}</span>
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
    sessionStorage.removeItem('zypergo_portal');
    setIsAuthenticated(false);
    setUser(null);
    window.location.href = '/rider/login';
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
    const target = window.location.pathname.startsWith('/rider') ? '/rider/dashboard' : '/dashboard';
    navigate(target, { replace: true });
  };

  if (loading) return <div className="flex h-screen items-center justify-center font-bold text-slate-500">Loading Profile...</div>;

  const approvalStatus = user?.riderDetails?.approvalStatus;

  const renderDashboard = () => (
    <ProtectedRoute requiredRole="Rider">
      <RiderLayout onLogout={handleClearAuth} user={user}>
        {approvalStatus === 'Approved' ? (
          <RiderDashboard user={user} onLogout={handleClearAuth} />
        ) : (
          <div className="min-h-full bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-white p-6 rounded-2xl shadow-lg max-w-sm w-full">
              <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="text-3xl">⏱</div>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Application Under Review</h2>
              <p className="text-slate-500 text-xs mb-5">Your documents are under review. You will be notified via SMS/email once approved to accept trips.</p>
              <button onClick={() => window.location.reload()} className="px-5 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200">
                Refresh Status
              </button>
            </div>
          </div>
        )}
      </RiderLayout>
    </ProtectedRoute>
  );

  const renderProfile = () => (
    <ProtectedRoute requiredRole="Rider">
      <RiderLayout onLogout={handleClearAuth} user={user}>
        <RiderProfile user={user} onLogout={handleClearAuth} />
      </RiderLayout>
    </ProtectedRoute>
  );

  const renderEarnings = () => (
    <ProtectedRoute requiredRole="Rider">
      <RiderLayout onLogout={handleClearAuth} user={user}>
        <RiderEarnings user={user} onLogout={handleClearAuth} />
      </RiderLayout>
    </ProtectedRoute>
  );

  const renderHistory = () => (
    <ProtectedRoute requiredRole="Rider">
      <RiderLayout onLogout={handleClearAuth} user={user}>
        <RiderHistory user={user} />
      </RiderLayout>
    </ProtectedRoute>
  );

  const renderSettings = () => (
    <ProtectedRoute requiredRole="Rider">
      <RiderLayout onLogout={handleClearAuth} user={user}>
        <RiderSettings user={user} onLogout={handleClearAuth} />
      </RiderLayout>
    </ProtectedRoute>
  );

  const isStandaloneApp = window.location.port === '8082' || window.location.port === '8002' || navigator.userAgent.includes('ZyperGoRider') || window.location.pathname.startsWith('/rider');

  const routesContent = (
    <Routes>
      {/* Splash & Welcome screens (Splash only on standalone app) */}
      <Route path="/rider/splash" element={
        <PublicRoute requiredRole="Rider">
          {isStandaloneApp ? <RiderSplash /> : <LoginScreen role="Rider" hideSwitchRole={true} onLoginSuccess={handleLoginSuccess} />}
        </PublicRoute>
      } />
      <Route path="/splash" element={
        <PublicRoute requiredRole="Rider">
          {isStandaloneApp ? <RiderSplash /> : <LoginScreen role="Rider" hideSwitchRole={true} onLoginSuccess={handleLoginSuccess} />}
        </PublicRoute>
      } />
      <Route path="/rider" element={
        <PublicRoute requiredRole="Rider">
          {isStandaloneApp ? <RiderSplash /> : <LoginScreen role="Rider" hideSwitchRole={true} onLoginSuccess={handleLoginSuccess} />}
        </PublicRoute>
      } />
      <Route path="/" element={
        <PublicRoute requiredRole="Rider">
          {isStandaloneApp ? <RiderSplash /> : <LoginScreen role="Rider" hideSwitchRole={true} onLoginSuccess={handleLoginSuccess} />}
        </PublicRoute>
      } />

      {/* Login routes */}
      <Route path="/rider/login" element={
        <PublicRoute requiredRole="Rider">
          <LoginScreen role="Rider" hideSwitchRole={true} onLoginSuccess={handleLoginSuccess} />
        </PublicRoute>
      } />
      <Route path="/login" element={
        <PublicRoute requiredRole="Rider">
          <LoginScreen role="Rider" hideSwitchRole={true} onLoginSuccess={handleLoginSuccess} />
        </PublicRoute>
      } />

      {/* Signup routes */}
      <Route path="/rider/signup" element={
        <PublicRoute requiredRole="Rider">
          <SignupScreen role="Rider" onLoginSuccess={handleLoginSuccess} />
        </PublicRoute>
      } />
      <Route path="/signup" element={
        <PublicRoute requiredRole="Rider">
          <SignupScreen role="Rider" onLoginSuccess={handleLoginSuccess} />
        </PublicRoute>
      } />

      {/* Dashboard routes */}
      <Route path="/dashboard" element={renderDashboard()} />
      <Route path="/rider/dashboard" element={renderDashboard()} />

      {/* Profile routes */}
      <Route path="/profile" element={renderProfile()} />
      <Route path="/rider/profile" element={renderProfile()} />

      {/* Earnings routes */}
      <Route path="/earnings" element={renderEarnings()} />
      <Route path="/rider/earnings" element={renderEarnings()} />

      {/* History routes */}
      <Route path="/history" element={renderHistory()} />
      <Route path="/rider/history" element={renderHistory()} />

      {/* Settings routes - redirected to Profile tab where settings and preferences are now embedded */}
      <Route path="/settings" element={<Navigate to="/profile" replace />} />
      <Route path="/rider/settings" element={<Navigate to="/rider/profile" replace />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={isAuthenticated ? (window.location.pathname.startsWith('/rider') ? "/rider/dashboard" : "/dashboard") : (window.location.pathname.startsWith('/rider') ? "/rider" : "/")} replace />} />
    </Routes>
  );

  if (isStandaloneApp) {
    return (
      <MobileDeviceFrame appName="ZyperGo Rider Partner App" deviceTheme="gold">
        {routesContent}
      </MobileDeviceFrame>
    );
  }

  return routesContent;
}
