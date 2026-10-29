import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Zap, Star, ArrowRight } from 'lucide-react';
import { LOGO_DATA_URI } from '../../assets/logoDataUri';
import { SPLASH_LOGO_DATA_URI } from '../../assets/splashLogoDataUri';
import { FLEET_HERO_DATA_URI } from '../../assets/fleetHeroDataUri';

export default function CustomerSplash() {
  const navigate = useNavigate();
  const isMobileApp = typeof navigator !== 'undefined' && (navigator.userAgent.includes('ZyperGo') || navigator.userAgent.includes('Mobile'));
  // In native mobile app, show welcome screen immediately without double splash delay
  const [stage, setStage] = useState(isMobileApp ? 'welcome' : 'splash');

  const isPrefix = window.location.pathname.startsWith('/customer');
  const loginPath = isPrefix ? '/customer/login' : '/login';
  const signupPath = isPrefix ? '/customer/signup' : '/signup';
  const dashboardPath = isPrefix ? '/customer/dashboard' : '/dashboard';

  useEffect(() => {
    // If user is already authenticated, bypass splash and go straight to dashboard
    if (localStorage.getItem('zypergo_token')) {
      navigate(dashboardPath, { replace: true });
      return;
    }

    if (stage === 'splash') {
      const timer = setTimeout(() => {
        setStage('welcome');
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [navigate, dashboardPath, stage]);

  const handleSkipToWelcome = () => {
    setStage('welcome');
  };

  // 1. Initial Animated Logo Splash Screen (Instant Zero-Latency Render)
  if (stage === 'splash') {
    return (
      <div 
        onClick={handleSkipToWelcome}
        className="flex-1 w-full h-full min-h-[620px] flex flex-col items-center justify-between p-8 bg-gradient-to-b from-white via-slate-50 to-blue-50/50 text-slate-900 font-sans relative overflow-hidden select-none cursor-pointer"
      >
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="pt-8">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
            ZyperGo Logistics
          </span>
        </div>

        <div className="flex flex-col items-center text-center my-auto w-full px-4">
          <div className="relative flex flex-col items-center justify-center w-full">
            <div className="absolute -inset-10 bg-gradient-to-r from-blue-500/15 via-orange-500/20 to-amber-500/15 rounded-full blur-3xl animate-pulse pointer-events-none" />
            
            <img 
              src={SPLASH_LOGO_DATA_URI || "/images/splash-logo.png"} 
              alt="ZyperGo Logo" 
              className="relative w-64 max-w-[85%] h-auto object-contain animate-splash-logo"
              loading="eager"
              decoding="sync"
            />
          </div>

          <div className="mt-6 flex flex-col items-center text-center">
            <h1 className="text-xl font-black text-slate-800 tracking-tight capitalize">welcome to customer app</h1>
          </div>
        </div>

        <div className="w-full max-w-[200px] pb-8 flex flex-col items-center gap-2.5">
          <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden p-0.5">
            <div className="h-full bg-gradient-to-r from-[#0052CC] via-orange-500 to-[#FF6B00] rounded-full animate-splash-progress" />
          </div>
          <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
            Tap to continue
          </span>
        </div>
      </div>
    );
  }

  // 2. Welcome & Login Screen (Instant Zero-Latency Render)
  return (
    <div className="flex-1 w-full flex flex-col justify-between p-6 bg-gradient-to-b from-blue-50/50 via-white to-slate-50 text-slate-900 font-sans selection:bg-[#0052CC] selection:text-white">
      
      {/* Top Branding with Instant Logo */}
      <div className="flex flex-col items-center pt-4 text-center">
        <img 
          src={LOGO_DATA_URI || "/images/logo.png"} 
          alt="ZyperGo" 
          className="h-12 w-auto object-contain mb-2.5 drop-shadow-xs" 
          loading="eager"
          decoding="sync"
        />

        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 border border-blue-200/80 text-[#0052CC] text-[10px] font-black uppercase tracking-wider mb-2">
          <span>Customer App</span>
        </span>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
          Ship Smarter.<br />
          Deliver <span className="text-[#FF6B00]">Faster.</span>
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1.5 max-w-[270px] leading-relaxed">
          Doorstep parcel pickup, intercity transport, and live GPS delivery tracking.
        </p>
      </div>

      {/* Hero Visual Card with Instant Base64 image */}
      <div className="my-auto py-2 flex flex-col items-center justify-center">
        <div className="relative w-full rounded-2xl overflow-hidden bg-white p-1.5 border border-slate-100 shadow-sm">
          <img 
            src={FLEET_HERO_DATA_URI || "/images/fleet_hero.jpg"} 
            alt="ZyperGo Fleet" 
            className="w-full h-36 object-cover rounded-xl"
            loading="eager"
            decoding="sync"
          />
        </div>

        {/* 3 Quick Value Badges */}
        <div className="grid grid-cols-3 gap-2 w-full mt-3">
          <div className="bg-white border border-slate-100 rounded-xl p-2 text-center shadow-xs">
            <Shield size={16} className="text-[#0052CC] mx-auto mb-1" />
            <span className="text-[10px] font-black text-slate-800 block">100% Insured</span>
            <span className="text-[8px] text-slate-400 font-medium">Safe Handling</span>
          </div>
          <div className="bg-white border border-slate-100 rounded-xl p-2 text-center shadow-xs">
            <Zap size={16} className="text-[#FF6B00] mx-auto mb-1" />
            <span className="text-[10px] font-black text-slate-800 block">Express</span>
            <span className="text-[8px] text-slate-400 font-medium">Fast Pickup</span>
          </div>
          <div className="bg-white border border-slate-100 rounded-xl p-2 text-center shadow-xs">
            <Star size={16} className="text-emerald-500 mx-auto mb-1" />
            <span className="text-[10px] font-black text-slate-800 block">Live GPS</span>
            <span className="text-[8px] text-slate-400 font-medium">Real-time Track</span>
          </div>
        </div>
      </div>

      {/* Bottom CTA Buttons */}
      <div className="flex flex-col gap-2.5 pb-2">
        <button
          onClick={() => navigate(loginPath)}
          className="w-full bg-[#0052CC] hover:bg-[#0045b0] active:scale-[0.98] text-white font-extrabold py-3.5 px-6 rounded-2xl text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <span>Login as Customer</span>
          <ArrowRight size={18} strokeWidth={2.5} />
        </button>

        <button
          onClick={() => navigate(signupPath)}
          className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold py-3 px-6 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
        >
          <span>New Customer? Create Account</span>
        </button>

        <p className="text-center text-[10px] text-slate-400 mt-0.5">
          By continuing, you agree to ZyperGo's Terms & Privacy Policy
        </p>
      </div>

    </div>
  );
}
