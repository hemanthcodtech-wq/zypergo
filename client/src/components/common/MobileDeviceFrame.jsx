import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';

export default function MobileDeviceFrame({ children, appName = "ZyperGo App" }) {
  const [currentTime, setCurrentTime] = useState('9:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-200/90 flex flex-col items-center justify-center p-0 md:py-6 md:px-4 font-sans selection:bg-[#0052CC] selection:text-white">
      
      {/* Optional Top Mini Title on Desktop */}
      <div className="hidden md:flex items-center gap-2 mb-3 text-slate-500 font-bold text-xs uppercase tracking-widest">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>{appName}</span>
      </div>

      {/* Realistic Mobile Device Mockup Frame */}
      <div className="relative w-full h-[100dvh] md:h-[830px] md:max-h-[94vh] md:w-[395px] md:rounded-[50px] md:p-[10px] md:bg-slate-900 md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.1),0_0_0_8px_#1E293B] flex flex-col">
        
        {/* Physical buttons on phone frame (Desktop Only) */}
        <div className="hidden md:block absolute -left-[11px] top-28 w-[3px] h-10 bg-slate-700 rounded-l-md" />
        <div className="hidden md:block absolute -left-[11px] top-42 w-[3px] h-12 bg-slate-700 rounded-l-md" />
        <div className="hidden md:block absolute -left-[11px] top-58 w-[3px] h-12 bg-slate-700 rounded-l-md" />
        <div className="hidden md:block absolute -right-[11px] top-36 w-[3px] h-16 bg-slate-700 rounded-r-md" />

        {/* Inner Phone Screen Display */}
        <div className="relative w-full h-full bg-white md:rounded-[40px] overflow-hidden flex flex-col shadow-inner">
          
          {/* Dynamic Island / Notch */}
          <div className="hidden md:flex absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-50 items-center justify-end pr-2 gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-800/80 border border-slate-700" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#0052CC]/60" />
          </div>

          {/* iOS Style Mobile Status Bar */}
          <div className="w-full h-10 px-6 pt-2 shrink-0 flex items-center justify-between text-slate-800 text-xs font-bold select-none z-40 bg-transparent">
            <span>{currentTime}</span>
            <div className="flex items-center gap-1.5">
              <Signal size={13} strokeWidth={2.5} />
              <Wifi size={13} strokeWidth={2.5} />
              <Battery size={15} strokeWidth={2.5} className="fill-slate-800" />
            </div>
          </div>

          {/* App Scrollable Content */}
          <div className="flex-1 w-full overflow-y-auto relative flex flex-col scrollbar-none">
            {children}
          </div>

          {/* Bottom Native Home Bar */}
          <div className="hidden md:flex w-full py-1.5 bg-transparent justify-center items-center shrink-0 pointer-events-none z-50">
            <div className="w-32 h-1 bg-slate-400/80 rounded-full" />
          </div>

        </div>

      </div>

    </div>
  );
}
