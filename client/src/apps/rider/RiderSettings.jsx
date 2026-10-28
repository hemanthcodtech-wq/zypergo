import React, { useState } from 'react';
import { 
  Bell, 
  Moon, 
  Sun, 
  Lock, 
  Shield, 
  HelpCircle, 
  LogOut, 
  ChevronRight, 
  Smartphone, 
  Settings as SettingsIcon, 
  ChevronLeft 
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function RiderSettings({ user, onLogout }) {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [locationAccess, setLocationAccess] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const isPrefix = location.pathname.startsWith('/rider');
  const base = isPrefix ? '/rider' : '';

  const handleLogout = () => {
    localStorage.removeItem('zypergo_token');
    localStorage.removeItem('zypergo_user');
    sessionStorage.removeItem('zypergo_portal');
    if (onLogout) {
      onLogout();
    }
    window.location.href = '/rider/login';
  };

  return (
    <div className="min-h-full bg-[#F8FAFC] pb-24 font-sans text-slate-900">
      
      {/* Top Header */}
      <div className="bg-white px-4 py-3 sticky top-0 z-20 shadow-xs border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button 
            type="button"
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate(`${base}/dashboard`)} 
            className="p-1 -ml-1 text-slate-700 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
          >
            <ChevronLeft size={22} />
          </button>
          <div>
            <h1 className="text-base font-black text-slate-900 leading-tight">Settings</h1>
            <p className="text-[10px] font-bold text-slate-400">Partner App Preferences</p>
          </div>
        </div>
        <img src="/images/logo.png" alt="ZyperGo" className="h-6 w-auto object-contain" />
      </div>

      <div className="max-w-md mx-auto px-4 pt-3.5 space-y-3.5">
        
        {/* App Preferences */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 space-y-3">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Device & Notifications</h3>
          
          <div className="space-y-2">
            {/* Push Notifications */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-blue-50 text-[#0052CC] rounded-lg flex items-center justify-center">
                  <Bell size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">Job Alerts & Sounds</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Instant alerts for nearby pickups</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setNotifications(!notifications)}
                className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer ${notifications ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.75 transition-transform ${notifications ? 'translate-x-5' : 'translate-x-1'}`}></div>
              </button>
            </div>

            {/* Location Tracking */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                  <Smartphone size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">GPS Background Routing</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Required for live distance calculation</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setLocationAccess(!locationAccess)}
                className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer ${locationAccess ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.75 transition-transform ${locationAccess ? 'translate-x-5' : 'translate-x-1'}`}></div>
              </button>
            </div>

            {/* Dark Mode */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center">
                  {darkMode ? <Moon size={16} /> : <Sun size={16} />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">Night Map Mode</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Automatic after 7:00 PM</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Auto</span>
            </div>
          </div>
        </div>

        {/* Account & Security Section */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 space-y-2">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-1">Account & Support</h3>
          
          {[
            { icon: <Lock size={15} />, title: 'Security & PIN', desc: 'Manage your shift login PIN', color: 'text-slate-600', bg: 'bg-slate-100' },
            { icon: <Shield size={15} />, title: 'Rider Partner Agreement', desc: 'Payout terms & insurance coverage', color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { icon: <HelpCircle size={15} />, title: 'Support & Hub Dispatch', desc: 'Instant SOS & operations help', color: 'text-amber-600', bg: 'bg-amber-50' }
          ].map((item, i) => (
            <button 
              key={i} 
              type="button"
              className="w-full flex items-center justify-between p-2.5 bg-slate-50/80 rounded-xl border border-slate-100 hover:bg-slate-100/60 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 ${item.bg} ${item.color} rounded-lg flex items-center justify-center shrink-0`}>
                  {item.icon}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                  <p className="text-[10px] text-slate-400 font-medium">{item.desc}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>
          ))}
        </div>

        {/* Logout Button (Reduced Size & Clean Design) */}
        <div className="pt-1">
          <button 
            type="button"
            onClick={handleLogout}
            className="w-full py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-black text-xs border border-red-200 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
          >
            <LogOut size={15} />
            <span>Logout Rider Account</span>
          </button>
        </div>
        
        <p className="text-center text-[10px] text-slate-400 font-bold pt-2">ZyperGo Rider v2.1.0 • Build 2026.10</p>
      </div>

    </div>
  );
}
