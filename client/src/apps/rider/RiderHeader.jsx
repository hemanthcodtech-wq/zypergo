import React, { useState, useEffect, useRef } from 'react';
import { User as UserIcon, Settings as SettingsIcon, ChevronDown, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

export default function RiderHeader({ user, onLogout, onShowEarnings }) {
  const [isOnline, setIsOnline] = useState(user?.riderDetails?.isOnline || false);
  const [isOnShift, setIsOnShift] = useState(user?.riderDetails?.isOnShift || false);
  const [isOnBreak, setIsOnBreak] = useState(user?.riderDetails?.isOnBreak || false);
  
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Sync state if user prop changes
  useEffect(() => {
    if (user?.riderDetails) {
      setIsOnline(user.riderDetails.isOnline || false);
      setIsOnShift(user.riderDetails.isOnShift || false);
      setIsOnBreak(user.riderDetails.isOnBreak || false);
    }
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleShiftToggle = async (type) => {
    try {
      let payload = { userId: user._id };
      if (type === 'online') {
        payload.isOnline = !isOnline;
      } else if (type === 'shift') {
        payload.isOnShift = !isOnShift;
        if (!isOnShift) payload.isOnline = true;
        else {
          payload.isOnline = false;
          payload.isOnBreak = false;
        }
      } else if (type === 'break') {
        payload.isOnBreak = !isOnBreak;
        if (!isOnBreak) payload.isOnline = false;
      }

      const res = await api.post('/rider/shift', payload);
      if (res.data.success) {
         if (type === 'online') setIsOnline(payload.isOnline);
         if (type === 'shift') { setIsOnShift(payload.isOnShift); setIsOnline(payload.isOnline); setIsOnBreak(payload.isOnBreak || false); }
         if (type === 'break') { setIsOnBreak(payload.isOnBreak); setIsOnline(payload.isOnline); }
      }
    } catch (err) {
      alert('Failed to update shift status');
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('zypergo_token');
      localStorage.removeItem('zypergo_user');
      window.location.href = '/login';
    }
  };

  return (
    <>
    <header className="bg-white/70 backdrop-blur-md border-b border-white/50 px-4 md:px-6 py-3 z-50 sticky top-0 shadow-sm flex flex-col md:flex-row md:justify-between md:items-center gap-3">
      {/* Top Row: Logo & Profile */}
      <div className="flex justify-between items-center w-full">
        {/* Spacer for centering on mobile */}
        <div className="w-10 md:hidden"></div>
        
        <div className="flex items-center gap-4 md:gap-8 justify-center">
          <img src="/images/logo.png" alt="ZyperGo Logo" className="h-8 md:h-10 cursor-pointer object-contain" onClick={() => navigate('/')} />
          <div className="hidden md:block h-6 w-px bg-slate-300"></div>
          <nav className="hidden md:flex gap-4 md:gap-6">
            <button onClick={() => navigate('/')} className={`font-bold text-xs md:text-sm border-b-2 pb-1 transition-colors ${window.location.pathname === '/' ? 'text-[#006D77] border-[#006D77]' : 'text-slate-500 border-transparent hover:text-slate-800'}`}>Dashboard</button>
            <button onClick={() => navigate('/earnings')} className={`font-bold text-xs md:text-sm border-b-2 pb-1 transition-colors ${window.location.pathname === '/earnings' ? 'text-[#006D77] border-[#006D77]' : 'text-slate-500 border-transparent hover:text-slate-800'}`}>
               Earnings
            </button>
          </nav>
        </div>
        
        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-1 hover:bg-slate-50/50 p-1 rounded-full transition focus:outline-none"
          >
            <div className="w-10 h-10 md:w-11 md:h-11 bg-gradient-to-br from-[#006D77] to-teal-700 text-white rounded-full flex items-center justify-center font-black shadow-md uppercase text-xs md:text-sm border-[3px] border-white ring-1 ring-[#006D77]/30 hover:scale-105 transition-transform">
              {user?.name ? user.name.substring(0, 2) : 'RD'}
            </div>
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-3 border-b border-slate-100/50 mb-2 bg-slate-50/30 rounded-t-2xl mt-[-8px]">
                <p className="text-sm font-black text-slate-900">{user?.name || 'Rider'}</p>
                <p className="text-xs font-bold text-slate-500 truncate">{user?.phone || user?.email || 'No contact info'}</p>
              </div>
              
              <button onClick={() => { setProfileDropdownOpen(false); navigate('/profile'); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#006D77] flex items-center gap-3 font-bold transition">
                <UserIcon size={16} /> My Profile
              </button>
              <button onClick={() => { setProfileDropdownOpen(false); navigate('/settings'); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#006D77] flex items-center gap-3 font-bold transition">
                <SettingsIcon size={16} /> Settings
              </button>
              
              <div className="mt-2 pt-2 border-t border-slate-100/50">
                <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 font-black transition">
                  <LogOut size={16} /> Logout Session
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Desktop Right Side: Controls */}
      <div className="hidden md:flex items-center justify-end gap-3 w-auto mt-2 md:mt-0">
        {!isOnShift ? (
           <button onClick={() => handleShiftToggle('shift')} className="bg-gradient-to-r from-[#006D77] to-teal-700 text-white px-5 py-2 rounded-full text-xs font-black whitespace-nowrap shadow-[0_4px_15px_-4px_rgba(0,109,119,0.4)] hover:shadow-[0_6px_20px_-4px_rgba(0,109,119,0.5)] hover:-translate-y-0.5 transition-all text-center">Start Shift</button>
        ) : (
           <>
             <button onClick={() => handleShiftToggle('break')} className={`px-5 py-2 rounded-full text-xs font-black transition-all whitespace-nowrap shadow-sm hover:shadow-md hover:-translate-y-0.5 text-center ${isOnBreak ? 'bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200' : 'bg-white/60 backdrop-blur-sm text-slate-600 border border-white/60 hover:bg-white/90'}`}>{isOnBreak ? 'End Break' : 'Take Break'}</button>
             <button onClick={() => handleShiftToggle('shift')} className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-5 py-2 rounded-full text-xs font-black whitespace-nowrap shadow-[0_4px_15px_-4px_rgba(15,23,42,0.4)] hover:shadow-[0_6px_20px_-4px_rgba(15,23,42,0.5)] hover:-translate-y-0.5 transition-all text-center">End Shift</button>
           </>
        )}

        <div className="bg-white/60 backdrop-blur-sm border border-white/50 rounded-full p-1 flex items-center shadow-sm shrink-0">
          <button onClick={() => handleShiftToggle('online')} disabled={!isOnShift} className={`px-4 py-1.5 rounded-full text-xs font-black transition-all whitespace-nowrap ${isOnline ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 opacity-50'}`}>Online</button>
          <button onClick={() => handleShiftToggle('online')} disabled={!isOnShift} className={`px-4 py-1.5 rounded-full text-xs font-black transition-all whitespace-nowrap ${!isOnline ? 'bg-slate-500 text-white shadow-md' : 'text-slate-400 opacity-50'}`}>Offline</button>
        </div>
      </div>
    </header>
      
      {/* Mobile Shift Controls (Floating Island above Bottom Nav) */}
      <div className="fixed bottom-[100px] left-4 right-4 md:hidden z-30 flex items-center justify-between gap-2 bg-white/60 backdrop-blur-2xl border border-white/80 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)] p-2 rounded-2xl">
        {!isOnShift ? (
           <button onClick={() => handleShiftToggle('shift')} className="flex-1 bg-gradient-to-r from-[#006D77] to-teal-700 text-white py-3 px-4 rounded-xl text-sm font-black shadow-[0_4px_15px_-5px_rgba(0,109,119,0.4)] transition-all text-center tracking-tight hover:shadow-[0_6px_20px_-5px_rgba(0,109,119,0.5)] active:scale-95">Start Shift</button>
        ) : (
           <div className="flex-1 flex gap-2">
             <button onClick={() => handleShiftToggle('break')} className={`flex-1 py-3 px-2 rounded-xl text-xs font-black transition-all shadow-sm text-center tracking-tight active:scale-95 ${isOnBreak ? 'bg-amber-100 text-amber-700 border border-amber-200 shadow-inner' : 'bg-white/80 border border-white text-slate-700 hover:bg-white'}`}>{isOnBreak ? 'End Break' : 'Take Break'}</button>
             <button onClick={() => handleShiftToggle('shift')} className="flex-1 bg-gradient-to-r from-slate-800 to-slate-900 text-white py-3 px-2 rounded-xl text-xs font-black shadow-[0_4px_15px_-5px_rgba(15,23,42,0.4)] transition-all text-center tracking-tight active:scale-95">End Shift</button>
           </div>
        )}

        <div className="bg-white/40 border border-white/60 rounded-xl p-1 flex items-center shadow-inner shrink-0">
          <button onClick={() => handleShiftToggle('online')} disabled={!isOnShift} className={`px-3 sm:px-4 py-2.5 rounded-lg text-[10px] sm:text-xs font-black transition-all whitespace-nowrap ${isOnline ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 opacity-50 hover:bg-white/50'}`}>Online</button>
          <button onClick={() => handleShiftToggle('online')} disabled={!isOnShift} className={`px-3 sm:px-4 py-2.5 rounded-lg text-[10px] sm:text-xs font-black transition-all whitespace-nowrap ${!isOnline ? 'bg-slate-500 text-white shadow-md' : 'text-slate-400 opacity-50 hover:bg-white/50'}`}>Offline</button>
        </div>
      </div>
    </>
  );
}
