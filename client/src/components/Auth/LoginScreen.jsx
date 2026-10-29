import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Phone, KeyRound, ArrowRight, Eye, EyeOff, 
  CheckCircle2, RefreshCw, Loader2, User, UserPlus, Mail, Headphones, Shield, 
  Zap, Star, Lock, Award, Compass, Truck, Package, Handshake 
} from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import api from '../../api';

const ROLE_CONFIGS = {
  customer: {
    portalName: 'Customer Portal',
    badgeText: 'Customer Login',
    badgeColor: 'bg-teal-50 text-[#006D77] border-teal-200/90',
    dotColor: 'bg-[#006D77]',
    titleHighlight: 'Customer Login',
    titleSuffix: 'Sign In & Track Orders',
    subtitle: 'Book parcels, calculate delivery rates, and track orders live in real time.',
    loginTabLabel: 'Customer Login',
    registerTabLabel: 'New Customer Sign Up',
    themeColor: '#006D77',
    btnClass: 'bg-[#006D77] hover:bg-[#005a63] text-white',
    activeTabClass: 'bg-[#006D77] text-white shadow-xs',
    activeMethodClass: 'text-[#006D77] border-[#006D77]',
    focusRingClass: 'focus:border-[#006D77] focus:ring-[#006D77]/20',
    badges: [
      { title: 'Secure', subtitle: '100% Insured & Safe', bg: 'bg-teal-50/80 border-teal-100/80', text: 'text-[#006D77]', icon: Shield },
      { title: 'Express', subtitle: 'Instant Door Pickup', bg: 'bg-orange-50/80 border-orange-100/80', text: 'text-[#FF6B00]', icon: Zap },
      { title: 'Reliable', subtitle: 'Live GPS Tracking', bg: 'bg-emerald-50/80 border-emerald-100/80', text: 'text-emerald-600', icon: Star },
    ]
  },
  rider: {
    portalName: 'Rider Partner Portal',
    badgeText: 'Rider Partner Login',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200/90',
    dotColor: 'bg-amber-500',
    titleHighlight: 'Rider Partner Login',
    titleSuffix: 'Driver Login & Tasks',
    subtitle: 'Accept pickup trips, scan customer OTP handovers, and track your daily payouts.',
    loginTabLabel: 'Rider Login',
    registerTabLabel: 'Join as Rider',
    themeColor: '#D97706',
    btnClass: 'bg-[#D97706] hover:bg-[#B45309] text-white',
    activeTabClass: 'bg-[#D97706] text-white shadow-xs',
    activeMethodClass: 'text-[#D97706] border-[#D97706]',
    focusRingClass: 'focus:border-[#D97706] focus:ring-[#D97706]/20',
    badges: [
      { title: 'Quick Trips', subtitle: 'Instant Trip Alerts', bg: 'bg-amber-50/80 border-amber-100/80', text: 'text-amber-600', icon: Zap },
      { title: 'OTP Safe', subtitle: 'Zero Dispute Handover', bg: 'bg-blue-50/80 border-blue-100/80', text: 'text-[#0052CC]', icon: ShieldCheck },
      { title: 'Payouts', subtitle: 'Direct Daily Bank Pay', bg: 'bg-emerald-50/80 border-emerald-100/80', text: 'text-emerald-600', icon: Star },
    ]
  },
  hubmanager: {
    portalName: 'Hub Manager Portal',
    badgeText: 'Hub Manager Portal Login',
    badgeColor: 'bg-orange-50 text-orange-800 border-orange-200/90',
    dotColor: 'bg-[#EA580C]',
    titleHighlight: 'Hub Manager Login',
    titleSuffix: 'Operations Workspace',
    subtitle: 'High-speed parcel scanning, bag sorting, vehicle manifests, and hub dispatch control.',
    loginTabLabel: 'Hub Manager Login',
    registerTabLabel: 'New Manager Access',
    themeColor: '#EA580C',
    btnClass: 'bg-[#EA580C] hover:bg-[#C2410C] text-white',
    activeTabClass: 'bg-[#EA580C] text-white shadow-xs',
    activeMethodClass: 'text-[#EA580C] border-[#EA580C]',
    focusRingClass: 'focus:border-[#EA580C] focus:ring-[#EA580C]/20',
    badges: [
      { title: 'Scanner', subtitle: 'Camera & Barcode', bg: 'bg-orange-50/80 border-orange-100/80', text: 'text-[#EA580C]', icon: Zap },
      { title: 'Sorting', subtitle: 'Intelligent Route Bins', bg: 'bg-blue-50/80 border-blue-100/80', text: 'text-[#0052CC]', icon: Package },
      { title: 'Manifests', subtitle: 'Linehaul Handover', bg: 'bg-emerald-50/80 border-emerald-100/80', text: 'text-emerald-600', icon: Shield },
    ]
  },
  hub: {
    portalName: 'Hub Manager Portal',
    badgeText: 'Hub Manager Portal Login',
    badgeColor: 'bg-orange-50 text-orange-800 border-orange-200/90',
    dotColor: 'bg-[#EA580C]',
    titleHighlight: 'Hub Manager Login',
    titleSuffix: 'Operations Workspace',
    subtitle: 'High-speed parcel scanning, bag sorting, vehicle manifests, and hub dispatch control.',
    loginTabLabel: 'Hub Manager Login',
    registerTabLabel: 'New Manager Access',
    themeColor: '#EA580C',
    btnClass: 'bg-[#EA580C] hover:bg-[#C2410C] text-white',
    activeTabClass: 'bg-[#EA580C] text-white shadow-xs',
    activeMethodClass: 'text-[#EA580C] border-[#EA580C]',
    focusRingClass: 'focus:border-[#EA580C] focus:ring-[#EA580C]/20',
    badges: [
      { title: 'Scanner', subtitle: 'Camera & Barcode', bg: 'bg-orange-50/80 border-orange-100/80', text: 'text-[#EA580C]', icon: Zap },
      { title: 'Sorting', subtitle: 'Intelligent Route Bins', bg: 'bg-blue-50/80 border-blue-100/80', text: 'text-[#0052CC]', icon: Package },
      { title: 'Manifests', subtitle: 'Linehaul Handover', bg: 'bg-emerald-50/80 border-emerald-100/80', text: 'text-emerald-600', icon: Shield },
    ]
  },
  partner: {
    portalName: 'Hauler & Partner Portal',
    badgeText: 'Hauler & Fleet Portal',
    badgeColor: 'bg-blue-50 text-[#023E8A] border-blue-200/90',
    dotColor: 'bg-[#023E8A]',
    titleHighlight: 'Hauler & Fleet',
    titleSuffix: 'Partner Workspace',
    subtitle: 'Manage regional fleet vehicles, linehaul bulk manifests, driver assignments, and settlements.',
    loginTabLabel: 'Partner Login',
    registerTabLabel: 'Register Fleet',
    themeColor: '#023E8A',
    btnClass: 'bg-[#023E8A] hover:bg-[#002855] text-white',
    activeTabClass: 'bg-[#023E8A] text-white shadow-xs',
    activeMethodClass: 'text-[#023E8A] border-[#023E8A]',
    focusRingClass: 'focus:border-[#023E8A] focus:ring-[#023E8A]/20',
    badges: [
      { title: 'Fleet GPS', subtitle: 'Live Vehicle Telemetry', bg: 'bg-blue-50/80 border-blue-100/80', text: 'text-[#023E8A]', icon: Truck },
      { title: 'Linehaul', subtitle: 'Bulk Route Contracts', bg: 'bg-orange-50/80 border-orange-100/80', text: 'text-[#FF6B00]', icon: Zap },
      { title: 'Settlement', subtitle: 'Transparent Weekly Pay', bg: 'bg-emerald-50/80 border-emerald-100/80', text: 'text-emerald-600', icon: Star },
    ]
  },
  superadmin: {
    portalName: 'SuperAdmin Portal',
    badgeText: 'SuperAdmin Control Panel',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200/90',
    dotColor: 'bg-[#7C3AED]',
    titleHighlight: 'SuperAdmin',
    titleSuffix: 'Control Center',
    subtitle: 'Centralized administration for live rider dispatch, KYC verification, hub networks, and finances.',
    loginTabLabel: 'Admin Login',
    registerTabLabel: 'Admin Access',
    themeColor: '#7C3AED',
    btnClass: 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white',
    activeTabClass: 'bg-[#7C3AED] text-white shadow-xs',
    activeMethodClass: 'text-[#7C3AED] border-[#7C3AED]',
    focusRingClass: 'focus:border-[#7C3AED] focus:ring-[#7C3AED]/20',
    badges: [
      { title: 'Full Access', subtitle: 'Platform Governance', bg: 'bg-purple-50/80 border-purple-100/80', text: 'text-[#7C3AED]', icon: Shield },
      { title: 'Live Map', subtitle: 'Real-Time Dispatch', bg: 'bg-blue-50/80 border-blue-100/80', text: 'text-[#0052CC]', icon: Zap },
      { title: 'Security', subtitle: 'KYC & Audit Compliance', bg: 'bg-emerald-50/80 border-emerald-100/80', text: 'text-emerald-600', icon: Star },
    ]
  },
  admin: {
    portalName: 'SuperAdmin Portal',
    badgeText: 'SuperAdmin Control Panel',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200/90',
    dotColor: 'bg-[#7C3AED]',
    titleHighlight: 'SuperAdmin',
    titleSuffix: 'Control Center',
    subtitle: 'Centralized administration for live rider dispatch, KYC verification, hub networks, and finances.',
    loginTabLabel: 'Admin Login',
    registerTabLabel: 'Admin Access',
    themeColor: '#7C3AED',
    btnClass: 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white',
    activeTabClass: 'bg-[#7C3AED] text-white shadow-xs',
    activeMethodClass: 'text-[#7C3AED] border-[#7C3AED]',
    focusRingClass: 'focus:border-[#7C3AED] focus:ring-[#7C3AED]/20',
    badges: [
      { title: 'Full Access', subtitle: 'Platform Governance', bg: 'bg-purple-50/80 border-purple-100/80', text: 'text-[#7C3AED]', icon: Shield },
      { title: 'Live Map', subtitle: 'Real-Time Dispatch', bg: 'bg-blue-50/80 border-blue-100/80', text: 'text-[#0052CC]', icon: Zap },
      { title: 'Security', subtitle: 'KYC & Audit Compliance', bg: 'bg-emerald-50/80 border-emerald-100/80', text: 'text-emerald-600', icon: Star },
    ]
  }
};

export default function LoginScreen({ role = 'Customer', onLoginSuccess, hideSwitchRole = false }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
  const [loginMethod, setLoginMethod] = useState('otp'); // 'otp' or 'password'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('input'); // 'input', 'otp', or 'forgot_password'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notRegisteredError, setNotRegisteredError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [cooldown, setCooldown] = useState(30);

  useEffect(() => {
    let timer;
    if (step === 'otp' && cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, cooldown]);

  const normalizedKey = (role || 'Customer').toLowerCase().replace(/[^a-z]/g, '');
  const currentConfig = ROLE_CONFIGS[normalizedKey] || ROLE_CONFIGS.customer;

  const isPrefixCustomer = window.location.pathname.startsWith('/customer');
  const isPrefixRider = window.location.pathname.startsWith('/rider');
  const signupUrl = role === 'Rider' 
    ? (isPrefixRider ? '/rider/signup' : '/signup') 
    : (isPrefixCustomer ? '/customer/signup' : '/signup');

  const isEmail = identifier.includes('@');

  const handleSwitchRole = () => {
    sessionStorage.removeItem('zypergo_portal');
    window.location.href = '/login?select=true';
  };

  const handleSendOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (identifier.length < 5) {
      setError('Please enter a valid email or phone number');
      return;
    }
    
    setLoading(true);
    setError('');
    setResendSuccess('');
    try {
      const payload = { role };
      if (isEmail) payload.email = identifier;
      else payload.phone = identifier;
      
      await api.post('/auth/send-otp', payload);
      setOtp('');
      setCooldown(30);
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (resending || cooldown > 0) return;

    setResending(true);
    setError('');
    setResendSuccess('');
    try {
      const payload = { role };
      if (isEmail) payload.email = identifier;
      else payload.phone = identifier;

      await api.post('/auth/send-otp', payload);
      setOtp('');
      setCooldown(30);
      setResendSuccess('✓ Fresh OTP sent to your registered phone via MSG91 SMS!');
      setTimeout(() => setResendSuccess(''), 6000);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length < 4) {
      setError('Please enter the complete OTP');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const payload = { role, otp, name: name || undefined };
      if (isEmail) payload.email = identifier;
      else payload.phone = identifier;

      const res = await api.post('/auth/verify-otp', payload);
      const data = res.data;
      
      localStorage.setItem('zypergo_token', data.token);
      localStorage.setItem('zypergo_user', JSON.stringify(data.data));
      if (onLoginSuccess) {
        onLoginSuccess(data.data);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordAuth = async (e) => {
    e.preventDefault();
    if (identifier.length < 4 || !password) {
      setError('Please enter valid credentials');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const endpoint = activeTab === 'register' ? '/auth/register' : '/auth/login-password';
      const payload = activeTab === 'register' 
        ? { name: name || identifier.split('@')[0], email: isEmail ? identifier : undefined, phone: !isEmail ? identifier : undefined, password, role }
        : { identifier, password, role };

      const res = await api.post(endpoint, payload);
      const data = res.data;
      
      localStorage.setItem('zypergo_token', data.token);
      localStorage.setItem('zypergo_user', JSON.stringify(data.data));
      if (onLoginSuccess) {
        onLoginSuccess(data.data);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || (activeTab === 'register' ? 'Registration failed' : 'Invalid credentials'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!identifier || identifier.length < 5 || !isEmail) {
      setError('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email: identifier });
      alert('Password reset link has been sent to your email.');
      setStep('input');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

    const handleGoogleSignIn = () => {
    const clientId = '435325462650-2ormagrttrufcs8o7d87qqhcdub4n81t.apps.googleusercontent.com';
    const redirectUri = 'https://zypergo.com/google-auth-bridge';
    const stateObj = { role, isSignup: false };
    const state = encodeURIComponent(JSON.stringify(stateObj));
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token%20id_token&scope=openid%20email%20profile&nonce=${Date.now()}&prompt=select_account&state=${state}`;

    window.location.href = googleAuthUrl;
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError('');
      setNotRegisteredError(false);
      try {
        const res = await api.post('/auth/google', { 
          accessToken: tokenResponse.access_token, 
          role,
          isSignup: false
        });
        const data = res.data;
        
        localStorage.setItem('zypergo_token', data.token);
        localStorage.setItem('zypergo_user', JSON.stringify(data.data));
        if (onLoginSuccess) {
          onLoginSuccess(data.data);
        } else {
          navigate('/dashboard');
        }
      } catch (err) {
        const errorMsg = err.response?.data?.error || 'Google login failed';
        setError(errorMsg);
        if (err.response?.data?.notRegistered) {
          setNotRegisteredError(true);
        }
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Google Login was cancelled or failed')
  });

  return (
    <div className="w-full min-h-full flex justify-center font-sans antialiased text-slate-900">
      {/* Mobile-first Constrained App Container */}
      <div className="w-full max-w-md bg-white relative flex flex-col pt-3 pb-16 px-5">
        
        {/* Top Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/images/logo.png" alt="ZyperGo" className="h-8 w-auto object-contain" />
          </div>
          <div className="flex items-center gap-2">
            {!hideSwitchRole && window.location.port !== '8081' && window.location.port !== '8082' && (
              <button 
                type="button"
                onClick={handleSwitchRole}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-xs text-xs font-bold"
                title="Select another portal or role"
              >
                <Compass size={14} className="text-slate-500" />
                <span>Switch Role</span>
              </button>
            )}
            <button 
              type="button"
              onClick={() => navigate('/support')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Headphones size={15} className="text-slate-600" />
              <span className="text-xs font-bold">Help</span>
            </button>
          </div>
        </div>

        {/* Role Dedicated Header & Hero Section */}
        <div className="mb-4">
          {/* Prominent Role Identification Badge */}
          <div className="flex items-center justify-between mb-2">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-black tracking-wide ${currentConfig.badgeColor}`}>
              <span className={`w-2 h-2 rounded-full ${currentConfig.dotColor} animate-pulse`} />
              <span>{currentConfig.badgeText}</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Dedicated Portal
            </span>
          </div>

          <h1 className="text-2xl font-black text-slate-900 leading-tight">
            {currentConfig.titleHighlight}<br />
            <span style={{ color: currentConfig.themeColor }}>{currentConfig.titleSuffix}</span>
          </h1>
          <p className="text-slate-500 text-[11px] font-semibold mt-1 mb-3">
            {currentConfig.subtitle}
          </p>

          {/* Badges + Fleet Illustration Side-by-Side */}
          <div className="flex items-center gap-2.5">
            {/* Left 3 Badges Column tailored to Role */}
            <div className="flex flex-col gap-2 w-[44%] shrink-0">
              {currentConfig.badges.map((b, idx) => {
                const IconComponent = b.icon;
                return (
                  <div key={idx} className={`p-2 border rounded-xl flex flex-col items-center text-center ${b.bg}`}>
                    <IconComponent size={15} className={`${b.text} mb-0.5`} />
                    <span className="text-[10px] font-black text-slate-800 leading-tight">{b.title}</span>
                    <span className="text-[8px] font-medium text-slate-500 mt-0.5">{b.subtitle}</span>
                  </div>
                );
              })}
            </div>

            {/* Right Clear 3D Fleet Illustration */}
            <div className="flex-1 h-[190px] rounded-2xl overflow-hidden bg-gradient-to-b from-slate-50/50 to-white flex items-center justify-center p-0.5 border border-slate-100">
              <img 
                src="/images/fleet_hero.jpg" 
                alt="ZyperGo Fleet" 
                className="w-full h-full object-contain object-center drop-shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* Main Auth Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 mt-2">
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold text-center mb-3 border border-red-200 animate-in fade-in flex flex-col items-center">
              <p>{error}</p>
              {notRegisteredError && (
                <button
                  type="button"
                  onClick={() => navigate(signupUrl)}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF6B00] text-white text-xs font-black shadow-xs hover:bg-[#e05e00] transition-colors cursor-pointer"
                >
                  <span>Sign Up Now</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>
          )}

          {step === 'input' ? (
            <div>
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5">
                    Mobile Number or Email
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                    <input 
                      type="text" 
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Enter email or phone number"
                      className={`w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white ${currentConfig.focusRingClass} outline-none font-semibold text-xs text-slate-900 transition-all`}
                      required
                    />
                  </div>
                </div>

                {/* Send OTP Button */}
                <button 
                  type="submit" 
                  disabled={loading || identifier.length < 4}
                  className={`w-full font-black py-3.5 px-4 rounded-xl shadow-md active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm ${currentConfig.btnClass}`}
                >
                  {loading ? 'Sending OTP...' : 'SEND OTP'}
                  <ArrowRight size={17} strokeWidth={2.5} />
                </button>
              </form>

              {/* Social Login Divider */}
              <div className="mt-5">
                <div className="relative flex items-center justify-center">
                  <div className="w-full border-t border-slate-200"></div>
                  <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 absolute">or continue with</span>
                </div>

                <div className="mt-4">
                  <button 
                    type="button" 
                    onClick={handleGoogleSignIn} 
                    className="flex items-center justify-center gap-2.5 w-full py-3 px-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all bg-white shadow-xs font-bold text-xs text-slate-800 active:scale-[0.98]"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    <span>Sign in with Google</span>
                  </button>
                </div>
              </div>

              {/* Bottom Sign Up Link / Button as requested */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500 font-semibold">
                  {role === 'Customer' ? "Don't have a Customer account?" : (role === 'Rider' ? "New to ZyperGo Fleet?" : "Don't have an account?")}
                </p>
                <button
                  type="button"
                  onClick={() => navigate(signupUrl)}
                  className="mt-2 inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-900 text-xs font-black transition-all active:scale-[0.98] shadow-xs"
                >
                  <UserPlus size={15} className="text-[#FF6B00]" />
                  <span>{role === 'Customer' ? 'New Customer Sign Up' : (role === 'Rider' ? 'Apply as New Rider (Sign Up)' : 'Create New Account')}</span>
                  <ArrowRight size={14} className="text-slate-400" />
                </button>
              </div>

            </div>
          ) : step === 'otp' ? (
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in">
              <div className="text-center">
                <p className="text-xs font-bold text-slate-700">Enter OTP sent to</p>
                <p className="text-xs font-black mt-0.5" style={{ color: currentConfig.themeColor }}>{identifier}</p>
                <div className="mt-1">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${currentConfig.badgeColor}`}>
                    {currentConfig.badgeText} Verification
                  </span>
                </div>
              </div>

              <div>
                {resendSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-2.5 text-xs font-bold text-center mb-3 animate-in fade-in flex items-center justify-center gap-1.5">
                    <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                    <span>{resendSuccess}</span>
                  </div>
                )}

                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 text-center">
                  Enter 4-Digit SMS / Email OTP
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    maxLength="6"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className={`w-full text-center py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white ${currentConfig.focusRingClass} outline-none font-mono font-bold text-xl tracking-widest text-slate-900 transition-all`}
                    required
                  />
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => {
                      setStep('input');
                      setError('');
                      setResendSuccess('');
                    }} 
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 py-1.5 px-2 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    ← Change details
                  </button>
                  <button 
                    type="button" 
                    onClick={handleResendOtp}
                    disabled={resending || cooldown > 0}
                    className={`text-xs font-bold py-1.5 px-3 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      cooldown > 0 || resending
                        ? 'text-slate-400 bg-slate-100 cursor-not-allowed opacity-70'
                        : 'text-amber-700 bg-amber-50 border border-amber-200/80 hover:bg-amber-100 active:scale-95'
                    }`}
                  >
                    {resending ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : cooldown > 0 ? (
                      <span>Resend in {cooldown}s</span>
                    ) : (
                      <>
                        <RefreshCw size={13} />
                        <span>Resend OTP</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || otp.length < 4}
                className={`w-full font-black py-3 rounded-xl shadow-md active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm transition-all ${currentConfig.btnClass}`}
              >
                {loading ? 'Verifying...' : `Verify & Access ${currentConfig.portalName}`}
                <ShieldCheck size={18} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4 animate-in fade-in">
              <div className="text-center">
                <h3 className="text-sm font-black text-slate-900">Reset Your Password</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Enter your registered email address for {currentConfig.portalName}</p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input 
                    type="email" 
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="name@example.com"
                    className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white ${currentConfig.focusRingClass} outline-none font-semibold text-xs text-slate-900 transition-all`}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || !identifier.includes('@')}
                className={`w-full font-black py-3 rounded-xl shadow-md active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm transition-all ${currentConfig.btnClass}`}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
                <ArrowRight size={17} />
              </button>

              <div className="text-center mt-2">
                <button 
                  type="button" 
                  onClick={() => setStep('input')} 
                  className="text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Back to Login
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
