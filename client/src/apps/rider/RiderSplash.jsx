import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation, Banknote, ShieldCheck, ArrowRight, Zap } from 'lucide-react';

export default function RiderSplash() {
  const navigate = useNavigate();
  const [stage, setStage] = useState('splash'); // 'splash' -> 'welcome'

  const isPrefix = window.location.pathname.startsWith('/rider');
  const loginPath = isPrefix ? '/rider/login' : '/login';
  const signupPath = isPrefix ? '/rider/signup' : '/signup';

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
      <div className="flex-1 w-full h-full min-h-[620px] flex flex-col items-center justify-between p-8 bg-gradient-to-b from-white via-amber-50/30 to-amber-100/40 text-slate-900 font-sans relative overflow-hidden select-none animate-in fade-in duration-300">
        
        {/* Ambient radiant glow circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top spacer */}
        <div className="pt-8">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-800/60">
            ZyperGo Partner Network
          </span>
        </div>

        {/* Center: Animated Official Website Logo */}
        <div className="flex flex-col items-center text-center my-auto w-full px-4">
          <div className="relative flex flex-col items-center justify-center w-full">
            {/* Ambient radiant pulse backdrop */}
            <div className="absolute -inset-10 bg-gradient-to-r from-amber-400/20 via-orange-500/25 to-yellow-400/20 rounded-full blur-3xl animate-pulse pointer-events-none" />
            
            {/* The Authentic Official Website Logo */}
            <img 
              src="/images/logo.png" 
              alt="ZyperGo Logo" 
              className="relative w-64 max-w-[85%] h-auto object-contain animate-splash-logo"
            />
          </div>

          {/* Sub-label & Tagline under Logo */}
          <div className="mt-6 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-2 duration-700">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-black uppercase tracking-wider shadow-xs mb-3">
              Rider Partner App
            </span>
            <p className="text-sm font-black text-slate-800 tracking-tight">Trusted logistics made simple.</p>
            <p className="text-xs font-bold text-slate-500 mt-1">ZyperGo • Fast • Secure • Reliable</p>
          </div>
        </div>

        {/* Bottom Loading Progress Bar */}
        <div className="w-full max-w-[200px] pb-8 flex flex-col items-center gap-2.5">
          <div className="w-full h-1.5 bg-amber-200/70 rounded-full overflow-hidden p-0.5">
            <div className="h-full bg-gradient-to-r from-amber-500 via-[#FF6B00] to-yellow-500 rounded-full animate-splash-progress" />
          </div>
          <span className="text-[10px] text-amber-800/60 font-bold tracking-widest uppercase">
            Loading Partner App...
          </span>
        </div>

      </div>
    );
  }

  // 2. Welcome & Login Screen (Revealed only after Splash Animation)
  return (
    <div className="flex-1 w-full flex flex-col justify-between p-6 bg-gradient-to-b from-amber-50/50 via-white to-amber-50/30 text-slate-900 font-sans selection:bg-[#FFB703] selection:text-black animate-in fade-in duration-500">
      
      {/* Top Branding with Official Logo */}
      <div className="flex flex-col items-center pt-4 text-center">
        <img 
          src="/images/logo.png" 
          alt="ZyperGo" 
          className="h-10 w-auto object-contain mb-2.5 drop-shadow-xs" 
        />

        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-100 border border-amber-300/80 text-amber-900 text-[10px] font-black uppercase tracking-wider mb-2">
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
      <div className="my-auto py-2 flex flex-col items-center justify-center">
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
