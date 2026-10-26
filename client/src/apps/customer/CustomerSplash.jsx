import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Zap, Star, ArrowRight, Package, MapPin } from 'lucide-react';

export default function CustomerSplash() {
  const navigate = useNavigate();
  const [stage, setStage] = useState('splash'); // 'splash' -> 'welcome'

  const isPrefix = window.location.pathname.startsWith('/customer');
  const loginPath = isPrefix ? '/customer/login' : '/login';
  const signupPath = isPrefix ? '/customer/signup' : '/signup';

  useEffect(() => {
    // 2.2 seconds of animated logo splash screen, then reveal login & onboarding
    const timer = setTimeout(() => {
      setStage('welcome');
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  // 1. Initial Animated Logo Splash Screen
  if (stage === 'splash') {
    return (
      <div className="flex-1 w-full h-full min-h-[600px] flex flex-col items-center justify-between p-8 bg-gradient-to-b from-[#0052CC] via-[#0041a3] to-[#002d73] text-white font-sans relative overflow-hidden select-none">
        {/* Radiant glow circles */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-orange-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Top spacer */}
        <div className="pt-6">
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-blue-200/70">ZyperGo Platform</span>
        </div>

        {/* Center Animated Logo & Branding */}
        <div className="flex flex-col items-center text-center my-auto animate-in zoom-in-75 fade-in duration-700">
          
          {/* Logo Container with Smooth Pulse & Glow */}
          <div className="relative mb-6">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-400 to-orange-400 rounded-3xl blur-xl opacity-60 animate-pulse" />
            <div className="relative w-24 h-24 rounded-3xl bg-white p-4 shadow-2xl flex items-center justify-center border-2 border-white/80">
              <img 
                src="/images/logo.png" 
                alt="ZyperGo Logo" 
                className="w-full h-full object-contain drop-shadow-md animate-in fade-in duration-1000"
              />
            </div>
          </div>

          <h1 className="text-3xl font-black text-white tracking-tight mb-2">
            Zyper<span className="text-[#FF6B00]">Go</span>
          </h1>

          <p className="text-sm font-semibold text-blue-100/90 tracking-wide">
            Customer App
          </p>

          <p className="text-xs text-blue-200/70 mt-1 max-w-[220px]">
            Ship Smarter. Deliver Faster.
          </p>
        </div>

        {/* Bottom Loading Progress Bar */}
        <div className="w-full max-w-[180px] pb-6 flex flex-col items-center gap-2">
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-400 to-white rounded-full animate-[progress_2.2s_ease-in-out_forwards] w-full" />
          </div>
          <span className="text-[10px] text-blue-200/60 font-medium tracking-widest uppercase">
            Loading...
          </span>
        </div>

      </div>
    );
  }

  // 2. Welcome & Login Screen (Revealed after Splash Animation)
  return (
    <div className="flex-1 w-full flex flex-col justify-between p-6 bg-gradient-to-b from-blue-50/50 via-white to-slate-50 text-slate-900 font-sans selection:bg-[#0052CC] selection:text-white animate-in fade-in duration-500">
      
      {/* Top Branding */}
      <div className="flex flex-col items-center pt-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white p-2.5 shadow-md border border-slate-100 mb-3 flex items-center justify-center">
          <img src="/images/logo.png" alt="ZyperGo" className="w-full h-full object-contain" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 border border-blue-200/80 text-[#0052CC] text-[10px] font-black uppercase tracking-wider mb-1.5">
          <span>Customer App</span>
        </span>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
          Ship Smarter.<br />
          Deliver <span className="text-[#FF6B00]">Faster.</span>
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1.5 max-w-[260px] leading-relaxed">
          Doorstep parcel pickup, intercity transport, and live GPS delivery tracking.
        </p>
      </div>

      {/* Hero Visual Card */}
      <div className="my-auto py-3 flex flex-col items-center justify-center">
        <div className="relative w-full rounded-2xl overflow-hidden bg-white p-1.5 border border-slate-100 shadow-sm">
          <img 
            src="/images/fleet_hero.jpg" 
            alt="ZyperGo Fleet" 
            className="w-full h-40 object-cover rounded-xl"
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
        {/* Primary: Login as Customer */}
        <button
          onClick={() => navigate(loginPath)}
          className="w-full bg-[#0052CC] hover:bg-[#0045b0] active:scale-[0.98] text-white font-extrabold py-3.5 px-6 rounded-2xl text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
        >
          <span>Login as Customer</span>
          <ArrowRight size={18} strokeWidth={2.5} />
        </button>

        {/* Secondary: Sign Up */}
        <button
          onClick={() => navigate(signupPath)}
          className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold py-3 px-6 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
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
