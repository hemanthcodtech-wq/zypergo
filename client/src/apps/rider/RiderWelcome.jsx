import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation, Banknote, ShieldCheck, MapPin } from 'lucide-react';
import SplashScreen from '../../components/common/SplashScreen';

export default function RiderWelcome() {
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(true);

  return (
    <div className="w-full flex-1 bg-[#FFB703] flex flex-col items-center justify-between pt-4 pb-6 px-5 relative min-h-full">
      {/* Animated Splash Screen before opening app */}
      {showSplash && (
        <SplashScreen 
          appName="Rider App"
          tagline="Drive • Deliver • Earn"
          theme="rider"
          duration={2200} 
          onFinish={() => setShowSplash(false)} 
        />
      )}

      {/* Top Header */}
      <div className="w-full flex justify-between items-center mb-2">
        <span className="text-[10px] font-black text-black tracking-widest uppercase bg-white/40 px-3 py-1 rounded-full border border-black/10">
          Rider Fleet
        </span>
      </div>

      <div className="text-center w-full my-auto">
        <img src="/images/logo.png" alt="ZyperGo Logo" className="h-10 w-auto object-contain mx-auto mb-3" />
        <h1 className="text-3xl font-black text-black leading-[1.1] tracking-tight uppercase">
          Drive, Deliver, <br /> & Earn
        </h1>
        <p className="text-xs font-bold text-black/70 mt-1.5">
          Accept nearby delivery jobs & earn on every trip
        </p>
      </div>

      {/* Illustration */}
      <div className="flex items-center justify-center w-full my-3 relative">
        <div className="relative w-40 h-40 bg-black rounded-full shadow-2xl flex flex-col items-center justify-center text-[#FFB703]">
          <MapPin size={60} strokeWidth={1.5} className="drop-shadow-lg z-10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 translate-x-10 -translate-y-8 z-10 bg-white rounded-full p-2 shadow-xl border-4 border-black">
            <Banknote size={20} className="text-black" />
          </div>
        </div>
      </div>

      {/* Buttons Content Card */}
      <div className="bg-white w-full rounded-2xl p-4 shadow-xl flex flex-col gap-2.5 mt-auto relative z-10 border border-black/5">
        <button
          onClick={() => navigate('/login')}
          className="w-full bg-black text-[#FFB703] font-black py-3.5 rounded-xl text-base shadow-md active:scale-95 transition-all uppercase tracking-wide"
        >
          Login to Rider App
        </button>

        <button
          onClick={() => navigate('/signup')}
          className="w-full bg-slate-100 text-black font-black py-3 rounded-xl text-xs hover:bg-slate-200 active:scale-95 transition-all uppercase tracking-wide"
        >
          Sign Up as Rider
        </button>
        
        {/* Footer features */}
        <div className="flex items-center justify-center gap-3 text-[9px] font-black text-slate-500 mt-2 uppercase tracking-widest">
          <span className="flex items-center gap-1"><Navigation size={11} className="text-black" /> Route</span>
          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
          <span className="flex items-center gap-1"><Banknote size={11} className="text-black" /> Pay</span>
          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
          <span className="flex items-center gap-1"><ShieldCheck size={11} className="text-black" /> Support</span>
        </div>
      </div>
    </div>
  );
}
