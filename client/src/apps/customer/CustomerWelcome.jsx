import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, MapPin, ShieldCheck, ArrowRight, Headphones } from 'lucide-react';
import SplashScreen from '../../components/common/SplashScreen';

export default function CustomerWelcome() {
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(true);

  return (
    <div className="w-full flex-1 bg-white flex flex-col justify-between pt-3 pb-6 px-5 overflow-x-hidden relative min-h-full">
      {/* Animated Splash Screen before opening app */}
      {showSplash && (
        <SplashScreen 
          appName="Customer App"
          tagline="Ship Smarter • Deliver Faster"
          duration={2200} 
          onFinish={() => setShowSplash(false)} 
        />
      )}

      {/* Top Header */}
      <div>
        <div className="flex items-center mb-3">
          <img src="/images/logo.png" alt="ZyperGo" className="h-7 w-auto object-contain" />
        </div>

        {/* 3D Fleet Hero Visual */}
        <div className="relative w-full my-1 flex items-center justify-center">
          <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-b from-blue-50/40 via-white to-transparent p-1">
            <img 
              src="/images/fleet_hero.jpg" 
              alt="ZyperGo Fleet" 
              className="w-full h-auto object-cover rounded-xl shadow-xs"
            />
          </div>
        </div>

        {/* 4 Feature Columns Card */}
        <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100 my-2.5">
          <div className="grid grid-cols-4 gap-1 text-center">
            
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0052CC] mb-1">
                <Package size={15} strokeWidth={2.2} />
              </div>
              <span className="text-[10px] font-black text-slate-900 leading-tight">Parcels</span>
              <span className="text-[7.5px] font-medium text-slate-400 leading-tight mt-0.5">Pickup</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF6B00] mb-1">
                <MapPin size={15} strokeWidth={2.2} />
              </div>
              <span className="text-[10px] font-black text-slate-900 leading-tight">Tracking</span>
              <span className="text-[7.5px] font-medium text-slate-400 leading-tight mt-0.5">Live</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-1">
                <Headphones size={15} strokeWidth={2.2} />
              </div>
              <span className="text-[10px] font-black text-slate-900 leading-tight">24/7 Help</span>
              <span className="text-[7.5px] font-medium text-slate-400 leading-tight mt-0.5">Support</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-1">
                <ShieldCheck size={15} strokeWidth={2.2} />
              </div>
              <span className="text-[10px] font-black text-slate-900 leading-tight">Safe</span>
              <span className="text-[7.5px] font-medium text-slate-400 leading-tight mt-0.5">OTP verified</span>
            </div>

          </div>
        </div>
      </div>

      {/* Primary CTA Buttons: Login & Signup */}
      <div className="w-full flex flex-col gap-2 pt-2 mt-auto">
        <button 
          onClick={() => navigate('/login')}
          className="w-full bg-[#0052CC] hover:bg-[#0047cc] text-white font-black py-3.5 px-5 rounded-2xl text-sm shadow-[0_8px_20px_-4px_rgba(0,82,204,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <span>Login to Customer App</span>
          <ArrowRight size={16} strokeWidth={2.5} />
        </button>

        <div className="text-center py-1">
          <p className="text-xs text-slate-500 font-semibold">
            New to ZyperGo?{' '}
            <button 
              type="button" 
              onClick={() => navigate('/signup')} 
              className="text-[#0052CC] font-black hover:underline"
            >
              Sign Up
            </button>
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-100/60 flex items-center justify-center text-[#0052CC] shrink-0">
              <ShieldCheck size={14} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-[10.5px] font-black text-slate-800 leading-tight">Trusted logistics made simple.</p>
              <p className="text-[8.5px] font-semibold text-slate-500 mt-0.5">Fast • Secure • Reliable</p>
            </div>
          </div>
          <img 
            src="/images/box_asset.jpg" 
            alt="Package" 
            className="w-7 h-7 object-contain rounded-md shadow-xs"
          />
        </div>
      </div>

    </div>
  );
}
