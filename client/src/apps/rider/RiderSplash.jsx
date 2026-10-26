import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation, Banknote, ShieldCheck, ArrowRight, Zap, Award } from 'lucide-react';

export default function RiderSplash() {
  const navigate = useNavigate();

  const isPrefix = window.location.pathname.startsWith('/rider');
  const loginPath = isPrefix ? '/rider/login' : '/login';
  const signupPath = isPrefix ? '/rider/signup' : '/signup';

  return (
    <div className="flex-1 w-full flex flex-col justify-between p-6 bg-gradient-to-b from-amber-50 via-white to-amber-50/40 text-slate-900 font-sans selection:bg-[#FFB703] selection:text-black">
      
      {/* Top Branding */}
      <div className="flex flex-col items-center pt-8 text-center animate-in fade-in duration-500">
        <div className="w-16 h-16 rounded-3xl bg-black p-0.5 shadow-xl shadow-amber-500/20 mb-4 flex items-center justify-center">
          <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center p-2.5">
            <img src="/images/logo.png" alt="ZyperGo" className="w-full h-full object-contain" />
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300/80 text-amber-900 text-[11px] font-black uppercase tracking-wider mb-2">
          <span>Rider Partner App</span>
        </span>

        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight uppercase">
          Drive, Deliver, <br />
          <span className="text-[#D97706]">& Earn Daily</span>
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-2 max-w-[270px] leading-relaxed">
          Accept trip orders, scan OTP handovers, and withdraw guaranteed daily earnings.
        </p>
      </div>

      {/* Hero Visual Card */}
      <div className="my-auto py-4 flex flex-col items-center justify-center">
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
      <div className="flex flex-col gap-3 pb-4">
        {/* Primary: Login as Rider */}
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

        <p className="text-center text-[10px] text-slate-400 mt-1">
          ZyperGo Rider Partner Network • Fast Verification
        </p>
      </div>

    </div>
  );
}
