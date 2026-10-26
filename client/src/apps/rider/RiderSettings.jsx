import React, { useState } from 'react';
import { Bell, Moon, Sun, Lock, Shield, HelpCircle, LogOut, ChevronRight, Smartphone, Settings as SettingsIcon, ChevronLeft, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RiderSettings({ user, onLogout }) {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [locationAccess, setLocationAccess] = useState(true);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans p-4 md:p-6 lg:p-8 pb-24">
      <header className="sticky top-0 z-50 bg-[#F8FAFC]/90 backdrop-blur-xl mb-8 pb-4 pt-4 -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 border-b border-slate-200/50 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div className="flex items-center justify-center">
            <img src="/images/logo.png" alt="ZyperGo Logo" className="h-8 object-contain" />
          </div>
          <div className="w-10 h-10"></div> {/* Spacer for centering */}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center border border-purple-100 shadow-sm shrink-0">
            <SettingsIcon size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Settings</h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">App preferences</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto w-full space-y-6">
        
        {/* App Settings */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <h3 className="text-sm font-black text-[#FFB703] uppercase tracking-widest mb-4">Preferences</h3>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                  <Bell size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Push Notifications</h4>
                  <p className="text-xs text-slate-500 font-medium">New jobs and updates</p>
                </div>
              </div>
              <button 
                onClick={() => setNotifications(!notifications)}
                className={`w-12 h-6 rounded-full transition-colors relative ${notifications ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${notifications ? 'translate-x-6' : 'translate-x-1'}`}></div>
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
                  {darkMode ? <Moon size={20} /> : <Sun size={20} />}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Dark Mode</h4>
                  <p className="text-xs text-slate-500 font-medium">Coming soon</p>
                </div>
              </div>
              <button 
                disabled
                onClick={() => setDarkMode(!darkMode)}
                className={`w-12 h-6 rounded-full transition-colors relative opacity-50 ${darkMode ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`}></div>
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center">
                  <Smartphone size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Location Access</h4>
                  <p className="text-xs text-slate-500 font-medium">Required for routing</p>
                </div>
              </div>
              <button 
                onClick={() => setLocationAccess(!locationAccess)}
                className={`w-12 h-6 rounded-full transition-colors relative ${locationAccess ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${locationAccess ? 'translate-x-6' : 'translate-x-1'}`}></div>
              </button>
            </div>
          </div>
        </div>

        {/* Account & Security */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <h3 className="text-sm font-black text-[#FFB703] uppercase tracking-widest mb-4">Account</h3>
          
          <div className="space-y-2">
            {[
              { icon: <Lock size={20} />, title: 'Change Password', desc: 'Update your security credentials', color: 'text-slate-600', bg: 'bg-slate-100' },
              { icon: <Shield size={20} />, title: 'Privacy Policy', desc: 'Read our terms and conditions', color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { icon: <HelpCircle size={20} />, title: 'Help & Support', desc: 'Contact ZyperGo operations', color: 'text-amber-600', bg: 'bg-amber-50' }
            ].map((item, i) => (
              <button key={i} className="w-full flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-slate-100/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 ${item.bg} ${item.color} rounded-xl flex items-center justify-center`}>
                    {item.icon}
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-slate-900">{item.title}</h4>
                    <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Logout */}
        <button 
          onClick={onLogout}
          className="w-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 font-black py-4 rounded-[1.5rem] text-lg flex justify-center items-center gap-2 shadow-sm transition-all"
        >
          <LogOut size={20} /> Log Out Account
        </button>
        
        <p className="text-center text-xs text-slate-400 font-bold mt-8">ZyperGo Rider App v2.1.0</p>
      </div>
    </div>
  );
}
