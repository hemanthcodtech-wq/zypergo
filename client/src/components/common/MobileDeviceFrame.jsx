import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';

export default function MobileDeviceFrame({ children, appName = "Customer App" }) {
  const [time, setTime] = useState('9:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#0B1120] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,82,204,0.25),rgba(255,255,255,0))] flex flex-col items-center justify-center p-0 md:p-6 select-none font-sans">
      
      {/* Realistic Phone Device Mockup */}
      <div className="w-full h-screen md:h-[844px] md:w-[390px] md:max-h-[95vh] bg-[#1E232E] md:rounded-[54px] p-0 md:p-[10px] md:shadow-[0_30px_90px_rgba(0,0,0,0.8),0_0_50px_rgba(0,82,204,0.18)] md:ring-1 md:ring-white/15 relative flex flex-col">
        
        {/* Hardware Side Buttons (Desktop only) */}
        <div className="hidden md:block absolute -left-[14px] top-[115px] w-[4px] h-[32px] bg-slate-700/80 rounded-l-sm"></div>
        <div className="hidden md:block absolute -left-[14px] top-[160px] w-[4px] h-[54px] bg-slate-700/80 rounded-l-sm"></div>
        <div className="hidden md:block absolute -left-[14px] top-[225px] w-[4px] h-[54px] bg-slate-700/80 rounded-l-sm"></div>
        <div className="hidden md:block absolute -right-[14px] top-[170px] w-[4px] h-[75px] bg-slate-700/80 rounded-r-sm"></div>

        {/* Inner Phone Screen Container */}
        <div className="w-full h-full bg-[#F8FAFC] md:rounded-[44px] overflow-hidden flex flex-col relative shadow-inner [transform:translateZ(0)]">
          
          {/* Dynamic Island Notch (Desktop preview) */}
          <div className="hidden md:flex absolute top-2 left-1/2 -translate-x-1/2 w-[116px] h-[28px] bg-black rounded-full z-50 items-center justify-between px-3 shadow-md pointer-events-none">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 ring-1 ring-white/10 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-blue-950/80"></div>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 ring-1 ring-emerald-500/20"></div>
          </div>

          {/* iOS Status Bar */}
          <div className="w-full pt-3 px-6 pb-1 flex justify-between items-center text-slate-800 text-xs font-semibold z-40 bg-transparent shrink-0">
            <span className="font-bold text-[13px] tracking-tight">{time}</span>
            <div className="flex items-center gap-1.5 text-slate-700">
              <Signal size={13} strokeWidth={2.5} />
              <Wifi size={13} strokeWidth={2.5} />
              <div className="flex items-center gap-0.5">
                <span className="text-[10px] font-bold">98%</span>
                <Battery size={15} strokeWidth={2.5} className="fill-slate-800" />
              </div>
            </div>
          </div>

          {/* App Viewport with smooth scroll */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col w-full">
            {children}
          </div>

          {/* iOS Bottom Home Bar */}
          <div className="w-full pt-1 pb-2 flex justify-center bg-transparent z-40 shrink-0 pointer-events-none">
            <div className="w-32 h-[4px] bg-slate-800/40 rounded-full"></div>
          </div>

        </div>
      </div>

    </div>
  );
}
