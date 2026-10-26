import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation, Banknote, ShieldCheck, MapPin } from 'lucide-react';

export default function RiderWelcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] bg-[#FFB703] flex justify-center font-sans">
      {/* Mobile Constrained Container */}
      <div className="w-full max-w-md bg-[#FFB703] min-h-[100dvh] relative flex flex-col items-center pt-16 pb-8 px-6 overflow-hidden">

        {/* Header Text */}
        <div className="text-center mb-8 w-full">
          <p className="text-[10px] font-black text-black mb-4 tracking-widest uppercase bg-white/30 inline-block px-3 py-1 rounded-full border border-black/10">Rider App</p>
          <img src="/images/logo.png" alt="ZyperGo Logo" className="h-12 w-auto object-contain mx-auto mb-6" />
          <h1 className="text-4xl font-black text-black leading-[1.1] tracking-tight uppercase">
            Drive, Deliver, <br /> & Earn
          </h1>
        </div>

        {/* Illustration Placeholder */}
        <div className="flex-1 flex items-center justify-center w-full mb-10 relative">
          <div className="relative w-56 h-56 bg-black rounded-full shadow-2xl flex flex-col items-center justify-center text-[#FFB703]">
            <MapPin size={80} strokeWidth={1.5} className="drop-shadow-lg z-10" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 translate-x-14 -translate-y-10 z-10 bg-white rounded-full p-2 shadow-xl border-4 border-black">
              <Banknote size={24} className="text-black" />
            </div>
          </div>
        </div>

        {/* Buttons Content Card */}
        <div className="bg-white w-full rounded-3xl p-6 shadow-2xl flex flex-col gap-4 mt-auto relative z-10 border border-slate-100">
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-black text-[#FFB703] font-black py-4 rounded-xl text-lg shadow-lg active:scale-95 transition-all uppercase tracking-wide"
          >
            Login to Rider
          </button>

          <button
            onClick={() => navigate('/signup')}
            className="w-full bg-slate-100 text-black font-black py-4 rounded-xl text-lg hover:bg-slate-200 active:scale-95 transition-all uppercase tracking-wide"
          >
            Apply as New Rider
          </button>
          
          {/* Footer features */}
          <div className="flex items-center justify-center gap-4 text-[10px] font-black text-slate-500 mt-4 uppercase tracking-widest">
            <span className="flex items-center gap-1"><Navigation size={12} className="text-black" /> Route</span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span className="flex items-center gap-1"><Banknote size={12} className="text-black" /> Pay</span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-black" /> Support</span>
          </div>
        </div>

      </div>
    </div>
  );
}
