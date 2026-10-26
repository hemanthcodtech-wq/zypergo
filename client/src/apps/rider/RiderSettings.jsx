import React, { useState } from 'react';
import { Bell, Moon, Sun, Lock, Shield, HelpCircle, LogOut, ChevronRight, Smartphone, Settings as SettingsIcon, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RiderSettings({ user, onLogout }) {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [locationAccess, setLocationAccess] = useState(true);
  const navigate = useNavigate();

  return (
    <div className="min-h-full bg-slate-50 flex flex-col font-sans select-none text-slate-900 pb-28">
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shadow-xs">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="w-9 h-9 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 active:scale-95 transition"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-sm font-black text-slate-900 tracking-tight">Preferences</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">App & Account Settings</p>
        </div>
        <div className="w-9 h-9 flex items-center justify-center bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
          <SettingsIcon size={18} />
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        
        {/* App Preferences */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            System Preferences
          </h3>

          <div className="space-y-2">
            {/* Push Notifications */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                  <Bell size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Push Alerts</h4>
                  <p className="text-[10px] text-slate-400">New mission alerts</p>
                </div>
              </div>
              <button 
                onClick={() => setNotifications(!notifications)}
                className={`w-10 h-5 rounded-full transition-colors relative ${notifications ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${notifications ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
              </button>
            </div>

            {/* GPS Tracking */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                  <Smartphone size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">GPS Auto-Track</h4>
                  <p className="text-[10px] text-slate-400">Real-time route matching</p>
                </div>
              </div>
              <button 
                onClick={() => setLocationAccess(!locationAccess)}
                className={`w-10 h-5 rounded-full transition-colors relative ${locationAccess ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${locationAccess ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
              </button>
            </div>
          </div>
        </div>

        {/* Security & Support Links */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
            Support & Legal
          </h3>

          <button 
            onClick={() => alert("Support Hotline: +91 99895 51305 (24/7 Operations Hub)")}
            className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                <HelpCircle size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Rider Support Hub</h4>
                <p className="text-[10px] text-slate-400">24/7 dispatch assistance</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>

          <button 
            onClick={() => alert("ZyperGo Rider Operations & Safety Policy")}
            className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                <Shield size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Safety & Terms</h4>
                <p className="text-[10px] text-slate-400">Insurance & partner terms</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>
        </div>

        {/* Log Out Button */}
        <button 
          onClick={onLogout}
          className="w-full py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 border border-rose-200 active:scale-98"
        >
          <LogOut size={16} />
          <span>Log Out Rider Account</span>
        </button>

        <p className="text-center text-[10px] text-slate-400 font-bold pt-2">
          ZyperGo Rider App v2.2.0 • Build 2026
        </p>

      </div>
    </div>
  );
}
