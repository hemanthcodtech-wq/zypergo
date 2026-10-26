import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation, Banknote, ShieldCheck, ArrowRight, Zap, Award } from 'lucide-react';

export default function RiderSplash() {
  const navigate = useNavigate();
  const [stage, setStage] = useState('splash'); // 'splash' -> 'welcome'

  const isPrefix = window.location.pathname.startsWith('/rider');
  const loginPath = isPrefix ? '/rider/login' : '/login';
  const signupPath = isPrefix ? '/rider/signup' : '/signup';

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
      <div className="flex-1 w-full h-full min-h-[600px] flex flex-col items-center justify-between p-8 bg-gradient-to-b from-[#1E293B] via-[#0F172A] to-black text-white font-sans relative overflow-hidden select-none">
        {/* Radiant amber glow circles */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl animate-pulse pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top spacer */}
        <div className="pt-6">
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-amber-400/80">ZyperGo Fleet</span>
        </div>

        {/* Center Animated Logo & Branding */}
        <div className="flex flex-col items-center text-center my-auto animate-in zoom-in-75 fade-in duration-700">
          
          {/* Logo Container with Smooth Pulse & Glow */}
          <div className="relative mb-6">
            <div className="absolute -inset-4 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-3xl blur-xl opacity-50 animate-pulse" />
            <div className="relative w-24 h-24 rounded-3xl bg-white p-4 shadow-2xl flex items-center justify-center border-2 border-amber-400/60">
              <img 
                src="/images/logo.png" 
                alt="ZyperGo Logo" 
                className="w-full h-full object-contain drop-shadow-md animate-in fade-in duration-1000"
              />
            </div>
          </div>

          <h1 className="text-3xl font-black text-white tracking-tight mb-2 uppercase">
            Zyper<span className="text-[#FFB703]">Go</span>
          </h1>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-[#FFB703] text-xs font-black uppercase tracking-wider mb-2">
            <span>Rider Partner App</span>
          </div>

          <p className="text-xs text-slate-400 max-w-[220px]">
            Drive, Deliver, & Earn Daily.
          </p>
        </div>

        {/* Bottom Loading Progress Bar */}
        <div className="w-full max-w-[180px] pb-6 flex flex-col items-center gap-2">
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full animate-[progress_2.2s_ease-in-out_forwards] w-full" />
          </div>
          <span className="text-[10px] text-amber-400/60 font-medium tracking-widest uppercase">
            Starting Up...
          </span>
        </div>

      </div>
    );
  }

  // 2. Welcome & Login Screen (Revealed after Splash Animation)
  return (
    <div className="flex-1 w-full flex flex-col justify-between p-6 bg-gradient-to-b from-amber-50 via-white to-amber-50/40 text-slate-900 font-sans selection:bg-[#FFB703] selection:text-black animate-in fade-in duration-500">
      
      {/* Top Branding */}
      <div className="flex flex-col items-center pt-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white p-2.5 shadow-md border border-slate-100 mb-3 flex items-center justify-center">
          <img src="/images/logo.png" alt="ZyperGo" className="w-full h-full object-contain" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-100 border border-amber-300/80 text-amber-900 text-[10px] font-black uppercase tracking-wider mb-1.5">
          <span>Rider Partner App</span>
        </span>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight uppercase">
          Drive, Deliver, <br />
          <span className="text-[#D97706]">& Earn Daily</span>
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1.5 max-w-[270px] leading-relaxed">
          Accept trip orders, scan OTP handovers, and withdraw guaranteed daily earnings.
        </p>
      </div>

      {/* Hero Visual Card */}
      <div className="my-auto py-3 flex flex-col items-center justify-center">
        <div className="w-full bg-slate-900 text-white rounded-3xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-300">Trips Available Now</span>
            </div>
            <span className="text-[11px] font-black bg-amber-500 text-black px-2.5 py-0.5 rounded-full">
              ₹500 - ₹1200 / day
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-800">
            <div>
              <Zap size={18} className="text-amber-400 mx-auto mb-1" />
              <span className="text-[10px] font-black text-white block">Instant Trips</span>
              <span className="text-[8px] text-slate-400">Zero Idle Time</span>
            </div>
            <div>
              <ShieldCheck size={18} className="text-emerald-400 mx-auto mb-1" />
              <span className="text-[10px] font-black text-white block">OTP Safe</span>
              <span className="text-[8px] text-slate-400">Secure Handovers</span>
            </div>
            <div>
              <Banknote size={18} className="text-blue-400 mx-auto mb-1" />
              <span className="text-[10px] font-black text-white block">Daily Payout</span>
              <span className="text-[8px] text-slate-400">Direct to Bank</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA Buttons */}
      <div className="flex flex-col gap-2.5 pb-2">
        {/* Primary: Login as Rider Partner */}
        <button
          onClick={() => navigate(loginPath)}
          className="w-full bg-black hover:bg-slate-800 active:scale-[0.98] text-[#FFB703] font-black py-3.5 px-6 rounded-2xl text-sm shadow-lg flex items-center justify-center gap-2 transition-all uppercase tracking-wide"
        >
          <span>Login as Rider Partner</span>
          <ArrowRight size={18} strokeWidth={2.5} />
        </button>

        {/* Secondary: Apply as New Rider */}
        <button
          onClick={() => navigate(signupPath)}
          className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 font-black py-3 px-6 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] uppercase tracking-wide"
        >
          <span>Apply as New Rider (Sign Up)</span>
        </button>

        <p className="text-center text-[10px] text-slate-400 mt-0.5">
          ZyperGo Rider Partner Network • Fast Verification
        </p>
      </div>

    </div>
  );
}
