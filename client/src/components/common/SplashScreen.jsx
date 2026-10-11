import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SplashScreen({ 
  onFinish, 
  duration = 2000, 
  appName = "Customer App",
  tagline = "Hyperfast Logistics",
  theme = "customer"
}) {
  const [visible, setVisible] = useState(true);
  const isRider = theme === 'rider' || appName.toLowerCase().includes('rider');

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onFinish) onFinish();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onFinish]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className={`absolute inset-0 z-[100] flex flex-col items-center justify-between py-14 px-6 text-white ${
            isRider 
              ? 'bg-gradient-to-br from-[#1E232E] via-[#0F172A] to-[#020617]' 
              : 'bg-gradient-to-br from-[#0052CC] via-[#0047b8] to-[#002e7a]'
          }`}
        >
          {/* Top spacer */}
          <div className="w-full"></div>

          {/* Centered Brand Logo & Pulsing Glow */}
          <motion.div 
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex flex-col items-center text-center"
          >
            {/* Pulsing Glow Ring */}
            <div className="relative mb-6">
              <motion.div 
                animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className={`absolute inset-0 -m-4 rounded-3xl blur-xl ${
                  isRider ? 'bg-amber-400/25' : 'bg-white/20'
                }`}
              />
              <div className="relative bg-white p-5 rounded-3xl shadow-2xl flex items-center justify-center">
                <img 
                  src="/images/logo.png" 
                  alt="ZyperGo Logo" 
                  className="h-12 w-auto object-contain"
                />
              </div>
            </div>

            <motion.h1 
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="text-2xl font-black tracking-tight mt-1"
            >
              Zyper<span className={isRider ? 'text-[#FFB703]' : 'text-[#FF6B00]'}>Go</span>
            </motion.h1>

            {/* App Name Badge */}
            <motion.div
              initial={{ y: 10, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className={`mt-3 px-4 py-1.5 rounded-full backdrop-blur-md border shadow-md ${
                isRider 
                  ? 'bg-amber-400/20 border-amber-400/40 text-[#FFB703]' 
                  : 'bg-white/20 border-white/30 text-white'
              }`}
            >
              <span className="text-xs font-black tracking-widest uppercase">
                {appName}
              </span>
            </motion.div>

            <motion.p 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className={`text-[11px] font-bold uppercase tracking-widest mt-2 ${
                isRider ? 'text-slate-400' : 'text-blue-200'
              }`}
            >
              {tagline}
            </motion.p>
          </motion.div>

          {/* Bottom Loading Indicator */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-28 h-1 bg-white/20 rounded-full overflow-hidden">
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                className={`w-14 h-full rounded-full shadow-sm ${
                  isRider ? 'bg-[#FFB703]' : 'bg-white'
                }`}
              />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${
              isRider ? 'text-slate-400' : 'text-blue-200/80'
            }`}>
              Loading {appName}...
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
