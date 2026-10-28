import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Zap, Star, ArrowRight } from 'lucide-react';

export default function CustomerSplash() {
  const navigate = useNavigate();
  const [stage, setStage] = useState('splash'); // 'splash' -> 'welcome'

  const isPrefix = window.location.pathname.startsWith('/customer');
  const loginPath = isPrefix ? '/customer/login' : '/login';
  const signupPath = isPrefix ? '/customer/signup' : '/signup';

  useEffect(() => {
    // 2.5 seconds animated logo splash screen, then smoothly reveal welcome & login screen
    const timer = setTimeout(() => {
      setStage('welcome');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // 1. Initial Animated Logo Splash Screen
  if (stage === 'splash') {
    return (
      <div className="flex-1 w-full h-full min-h-[620px] flex flex-col items-center justify-between p-8 bg-gradient-to-b from-white via-slate-50 to-blue-50/50 text-slate-900 font-sans relative overflow-hidden select-none animate-in fade-in duration-300">
        
        {/* Soft background ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top spacer */}
        <div className="pt-8">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
            ZyperGo Logistics
          </span>
        </div>

        {/* Center: Animated Official Website Logo */}
        <div className="flex flex-col items-center text-center my-auto w-full px-4">
          <div className="relative flex flex-col items-center justify-center w-full">
            {/* Ambient radiant pulse backdrop */}
            <div className="absolute -inset-10 bg-gradient-to-r from-blue-500/15 via-orange-500/20 to-amber-500/15 rounded-full blur-3xl animate-pulse pointer-events-none" />
            
            {/* The Authentic Official Website Logo */}
            <img 
              src="/images/logo.png" 
              alt="ZyperGo Logo" 
              className="relative w-64 max-w-[85%] h-auto object-contain animate-splash-logo"
            />
          </div>

          {/* Sub-label & Tagline under Logo */}
          <div className="mt-6 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-2 duration-700">
            <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-blue-50 border border-blue-200/80 text-[#0052CC] text-[10px] font-black uppercase tracking-wider shadow-xs mb-3">
              Customer App
            </span>
            <p className="text-sm font-black text-slate-800 tracking-tight">Trusted logistics made simple.</p>
            <p className="text-xs font-bold text-slate-500 mt-1">ZyperGo • Fast • Secure • Reliable</p>
          </div>
        </div>

        {/* Bottom Loading Progress Bar */}
        <div className="w-full max-w-[200px] pb-8 flex flex-col items-center gap-2.5">
          <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden p-0.5">
            <div className="h-full bg-gradient-to-r from-[#0052CC] via-orange-500 to-[#FF6B00] rounded-full animate-splash-progress" />
          </div>
          <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
            Loading App...
          </span>
        </div>

      </div>
    );
  }

  // 2. Welcome & Login Screen (Revealed only after Splash Animation)
  return (
    <div className="flex-1 w-full flex flex-col justify-between p-6 bg-gradient-to-b from-blue-50/50 via-white to-slate-50 text-slate-900 font-sans selection:bg-[#0052CC] selection:text-white animate-in fade-in duration-500">
      
      {/* Top Branding with Official Logo */}
      <div className="flex flex-col items-center pt-4 text-center">
        <img 
          src="/images/logo.png" 
          alt="ZyperGo" 
          className="h-10 w-auto object-contain mb-2.5 drop-shadow-xs" 
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

      {/* Hero Visual Card */}
      <div className="my-auto py-2 flex flex-col items-center justify-center">
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
