import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Zap, Star, Headphones, Package, MapPin, ShieldCheck, ArrowRight } from 'lucide-react';

export default function CustomerWelcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] bg-[#F8FAFC] flex justify-center font-sans antialiased text-slate-900">
      {/* Mobile Constrained / Responsive Container */}
      <div className="w-full max-w-md bg-white min-h-[100dvh] relative shadow-2xl flex flex-col pt-6 pb-8 px-5 overflow-x-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <img src="/images/logo.png" alt="ZyperGo" className="h-8 w-auto object-contain" />
          </div>
          <button 
            onClick={() => navigate('/support')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Headphones size={15} className="text-slate-600" />
            <span className="text-xs font-bold">Help</span>
          </button>
        </div>

        {/* Hero Headline */}
        <div className="text-left mb-4">
          <h1 className="text-3xl font-black text-slate-900 leading-[1.15] tracking-tight">
            Ship Smarter.<br />
            Deliver <span className="text-[#FF6B00]">Faster.</span>
          </h1>
          <p className="text-slate-500 text-xs font-semibold mt-2.5 leading-relaxed max-w-[280px]">
            Reliable parcel delivery and logistics solutions, right at your fingertips.
          </p>
        </div>

        {/* Value Badges */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/70 border border-blue-100 rounded-xl">
            <Shield size={14} className="text-[#0052CC]" />
            <span className="text-[11px] font-bold text-slate-700">Secure</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50/70 border border-orange-100 rounded-xl">
            <Zap size={14} className="text-[#FF6B00]" />
            <span className="text-[11px] font-bold text-slate-700">Fast</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50/70 border border-emerald-100 rounded-xl">
            <Star size={14} className="text-emerald-600 fill-emerald-600" />
            <span className="text-[11px] font-bold text-slate-700">Reliable</span>
          </div>
        </div>

        {/* 3D Fleet Hero Visual */}
        <div className="relative w-full my-2 flex items-center justify-center">
          <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-b from-blue-50/40 via-white to-transparent p-1">
            <img 
              src="/images/fleet_hero.jpg" 
              alt="ZyperGo Fleet" 
              className="w-full h-auto object-cover rounded-xl shadow-xs"
            />
          </div>
        </div>

        {/* 4 Feature Columns Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 my-4">
          <div className="grid grid-cols-4 gap-2 text-center">
            
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0052CC] mb-2">
                <Package size={18} strokeWidth={2.2} />
              </div>
              <span className="text-[11px] font-black text-slate-900 leading-tight">Parcels</span>
              <span className="text-[8.5px] font-medium text-slate-400 leading-tight mt-1">Doorstep pickup & delivery</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF6B00] mb-2">
                <MapPin size={18} strokeWidth={2.2} />
              </div>
              <span className="text-[11px] font-black text-slate-900 leading-tight">Live Tracking</span>
              <span className="text-[8.5px] font-medium text-slate-400 leading-tight mt-1">Track parcel in real-time</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
                <Headphones size={18} strokeWidth={2.2} />
              </div>
              <span className="text-[11px] font-black text-slate-900 leading-tight">24/7 Support</span>
              <span className="text-[8.5px] font-medium text-slate-400 leading-tight mt-1">Here to help anytime</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-2">
                <ShieldCheck size={18} strokeWidth={2.2} />
              </div>
              <span className="text-[11px] font-black text-slate-900 leading-tight">Safe Delivery</span>
              <span className="text-[8.5px] font-medium text-slate-400 leading-tight mt-1">Secure handling of parcels</span>
            </div>

          </div>
        </div>

        {/* Primary CTA Button */}
        <div className="w-full my-2">
          <button 
            onClick={() => navigate('/login')}
            className="w-full bg-[#0052CC] hover:bg-[#0047cc] text-white font-extrabold py-4 px-6 rounded-2xl text-base shadow-[0_10px_25px_-5px_rgba(0,82,204,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>Login / Sign Up</span>
            <ArrowRight size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Bottom Banner */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100/60 flex items-center justify-center text-[#0052CC] shrink-0">
              <ShieldCheck size={20} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-800 leading-tight">Trusted logistics made simple.</p>
              <p className="text-[10px] font-semibold text-slate-500 mt-0.5">Fast • Secure • Reliable</p>
            </div>
          </div>
          <img 
            src="/images/box_asset.jpg" 
            alt="Package" 
            className="w-11 h-11 object-contain rounded-lg shadow-xs"
          />
        </div>

      </div>
    </div>
  );
}
