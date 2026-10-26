import React, { useState, useEffect, useRef } from 'react';
import { User as UserIcon, Settings as SettingsIcon, Wallet, LogOut, Power, Coffee, CheckCircle2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api';

export default function RiderHeader({ user, onLogout }) {
  const [isOnline, setIsOnline] = useState(user?.riderDetails?.isOnline || false);
  const [isOnShift, setIsOnShift] = useState(user?.riderDetails?.isOnShift || false);
  const [isOnBreak, setIsOnBreak] = useState(user?.riderDetails?.isOnBreak || false);
  const [loadingShift, setLoadingShift] = useState(false);
  
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

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
    if (loadingShift) return;
    setLoadingShift(true);
    try {
      let payload = { userId: user?._id };
      if (type === 'shift') {
        const nextShift = !isOnShift;
        payload.isOnShift = nextShift;
        payload.isOnline = nextShift;
        payload.isOnBreak = false;
      } else if (type === 'break') {
        const nextBreak = !isOnBreak;
        payload.isOnBreak = nextBreak;
        payload.isOnline = !nextBreak;
      } else if (type === 'online') {
        payload.isOnline = !isOnline;
      }

      const res = await api.post('/rider/shift', payload);
      if (res.data?.success) {
        if (type === 'shift') {
          setIsOnShift(payload.isOnShift);
          setIsOnline(payload.isOnline);
          setIsOnBreak(false);
        } else if (type === 'break') {
          setIsOnBreak(payload.isOnBreak);
          setIsOnline(payload.isOnline);
        } else if (type === 'online') {
          setIsOnline(payload.isOnline);
        }
      }
    } catch (err) {
      console.error('Failed to toggle shift status:', err);
    } finally {
      setLoadingShift(false);
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

  const getInitials = () => {
    if (!user?.name) return 'RD';
    const parts = user.name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return user.name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 sticky top-0 z-40 shadow-xs flex items-center justify-between gap-2 select-none">
      {/* Brand & App Tag */}
      <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => navigate('/dashboard')}>
        <img 
          src="/images/logo.png" 
          alt="ZyperGo" 
          className="h-7 w-auto object-contain max-w-[110px]" 
        />
        <span className="text-[10px] font-black tracking-wider uppercase bg-emerald-500/10 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-500/20">
          Rider
        </span>
      </div>

      {/* Right Controls: Shift Pill + Avatar */}
      <div className="flex items-center gap-2">
        {/* Compact Shift Toggle Pill */}
        <button
          onClick={() => handleShiftToggle('shift')}
          disabled={loadingShift}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs active:scale-95 border ${
            isOnShift && isOnline
              ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
              : isOnShift && isOnBreak
              ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
              : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
          }`}
          title="Click to toggle shift"
        >
          <span className={`w-2 h-2 rounded-full ${
            isOnShift && isOnline 
              ? 'bg-emerald-500 animate-pulse' 
              : isOnShift && isOnBreak
              ? 'bg-amber-500'
              : 'bg-slate-400'
          }`}></span>
          <span className="text-[11px] font-extrabold tracking-tight">
            {loadingShift ? '...' : (isOnShift && isOnline ? 'Online' : (isOnBreak ? 'On Break' : 'Offline'))}
          </span>
        </button>

        {/* Profile Avatar Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="w-9 h-9 bg-gradient-to-br from-emerald-600 to-teal-800 text-white rounded-full flex items-center justify-center font-black text-xs shadow-xs border-2 border-white ring-1 ring-slate-200 active:scale-95 transition-all"
            aria-label="Rider menu"
          >
            {getInitials()}
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-3 border-b border-slate-100 mb-1 bg-slate-50/50 rounded-t-xl -mt-2">
                <p className="text-sm font-extrabold text-slate-900 truncate">{user?.name || 'Rider Partner'}</p>
                <p className="text-[11px] font-medium text-slate-500 truncate">{user?.phone || user?.email || 'Verified Rider'}</p>
                <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-600">
                  <CheckCircle2 size={12} />
                  <span>Approved Partner</span>
                </div>
              </div>

              {/* Shift status quick actions */}
              <div className="px-3 py-2 border-b border-slate-100 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold">Shift Control:</span>
                  <span className={`font-bold ${isOnShift ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {isOnShift ? (isOnBreak ? 'Break' : 'Active') : 'Ended'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    onClick={() => handleShiftToggle('shift')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                      !isOnShift
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                    }`}
                  >
                    <Power size={12} />
                    {!isOnShift ? 'Start Shift' : 'End Shift'}
                  </button>
                  <button
                    onClick={() => handleShiftToggle('break')}
                    disabled={!isOnShift}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                      !isOnShift
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : isOnBreak
                        ? 'bg-amber-600 text-white hover:bg-amber-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Coffee size={12} />
                    {isOnBreak ? 'Resume' : 'Break'}
                  </button>
                </div>
              </div>
              
              <button 
                onClick={() => { setProfileDropdownOpen(false); navigate('/earnings'); }} 
                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-bold transition"
              >
                <Wallet size={15} className="text-slate-500" /> My Earnings
              </button>
              <button 
                onClick={() => { setProfileDropdownOpen(false); navigate('/profile'); }} 
                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-bold transition"
              >
                <UserIcon size={15} className="text-slate-500" /> Rider Profile
              </button>
              <button 
                onClick={() => { setProfileDropdownOpen(false); navigate('/settings'); }} 
                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-bold transition"
              >
                <SettingsIcon size={15} className="text-slate-500" /> Preferences
              </button>
              
              <div className="mt-1 pt-1 border-t border-slate-100">
                <button 
                  onClick={handleLogout} 
                  className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-bold transition"
                >
                  <LogOut size={15} /> Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
