import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Zap, Star, ArrowRight, UserCheck, Package, MapPin } from 'lucide-react';

export default function CustomerSplash() {
  const navigate = useNavigate();

  const isPrefix = window.location.pathname.startsWith('/customer');
  const loginPath = isPrefix ? '/customer/login' : '/login';
  const signupPath = isPrefix ? '/customer/signup' : '/signup';

  return (
    <div className="flex-1 w-full flex flex-col justify-between p-6 bg-gradient-to-b from-blue-50/50 via-white to-slate-50 text-slate-900 font-sans selection:bg-[#0052CC] selection:text-white">
      
      {/* Top Branding */}
      <div className="flex flex-col items-center pt-8 text-center animate-in fade-in duration-500">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#0052CC] to-blue-400 p-0.5 shadow-xl shadow-blue-500/25 mb-4 flex items-center justify-center">
          <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center p-2.5">
            <img src="/images/logo.png" alt="ZyperGo" className="w-full h-full object-contain" />
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[#0052CC] text-[11px] font-black uppercase tracking-wider mb-2">
          <span>Customer App</span>
        </span>

        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
          Ship Smarter.<br />
          Deliver <span className="text-[#FF6B00]">Faster.</span>
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-2 max-w-[260px] leading-relaxed">
          Doorstep parcel pickup, intercity transport, and live GPS delivery tracking.
        </p>
      </div>

      {/* Hero Visual Card */}
      <div className="my-auto py-4 flex flex-col items-center justify-center">
        <div className="relative w-full rounded-2xl overflow-hidden bg-white p-2 border border-slate-100 shadow-md">
          <img 
            src="/images/fleet_hero.jpg" 
            alt="ZyperGo Fleet" 
            className="w-full h-44 object-cover rounded-xl"
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
      <div className="flex flex-col gap-3 pb-4">
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

        <p className="text-center text-[10px] text-slate-400 mt-1">
          By continuing, you agree to ZyperGo's Terms & Privacy Policy
        </p>
      </div>

    </div>
  );
}
