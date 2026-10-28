import React, { useState, useEffect, useRef } from 'react';
import { User as UserIcon, Settings as SettingsIcon, LogOut, Power, PowerOff, Coffee } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api';
import { getImageUrl } from '../../utils/imageUrl';

export default function RiderHeader({ user, onLogout, onShowEarnings, onStatusChange }) {
  const [isOnline, setIsOnline] = useState(user?.riderDetails?.isOnline || false);
  const [isOnBreak, setIsOnBreak] = useState(user?.riderDetails?.isOnBreak || false);
  const [loadingAction, setLoadingAction] = useState(false);
  
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isPrefix = location.pathname.startsWith('/rider');

  const getResolvedPhoto = () => {
    const userId = user?.id || user?._id || user?.phone;
    let photo = user?.photoUrl || user?.riderDetails?.documents?.profileImageUrl;
    if (!photo && userId) {
      photo = localStorage.getItem('zypergo_profile_photo_' + userId);
    }
    if (!photo) {
      const stored = localStorage.getItem('zypergo_user');
      if (stored) {
        try {
          const u = JSON.parse(stored);
          const uId = u.id || u._id || u.phone;
          photo = u.photoUrl || u.riderDetails?.documents?.profileImageUrl || (uId ? localStorage.getItem('zypergo_profile_photo_' + uId) : null);
        } catch (e) {}
      }
    }
    return photo;
  };

  const [profilePhoto, setProfilePhoto] = useState(getResolvedPhoto());
  const [photoError, setPhotoError] = useState(false);

  useEffect(() => {
    setProfilePhoto(getResolvedPhoto());
    setPhotoError(false);
  }, [user]);

  // Sync state if user prop changes
  useEffect(() => {
    if (user?.riderDetails) {
      setIsOnline(user.riderDetails.isOnline || false);
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

  const updateStoredUser = (updates) => {
    try {
      const userStr = localStorage.getItem('zypergo_user');
      if (userStr) {
        const u = JSON.parse(userStr);
        u.riderDetails = { ...(u.riderDetails || {}), ...updates };
        localStorage.setItem('zypergo_user', JSON.stringify(u));
      }
    } catch (e) {}
  };

  const handleGoOnline = async () => {
    setLoadingAction(true);
    try {
      const userId = user?._id || user?.id;
      const payload = {
        userId,
        isOnline: true,
        isOnShift: true,
        isOnBreak: false
      };

      const res = await api.post('/rider/shift', payload);
      if (res.data.success) {
        setIsOnline(true);
        setIsOnBreak(false);
        updateStoredUser({ isOnline: true, isOnShift: true, isOnBreak: false });
        if (onStatusChange) {
          onStatusChange({ isOnline: true, isOnShift: true, isOnBreak: false });
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to go online. Please check network connection.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleGoOffline = async () => {
    setLoadingAction(true);
    try {
      const userId = user?._id || user?.id;
      const payload = {
        userId,
        isOnline: false,
        isOnShift: false,
        isOnBreak: false
      };

      const res = await api.post('/rider/shift', payload);
      if (res.data.success) {
        setIsOnline(false);
        setIsOnBreak(false);
        updateStoredUser({ isOnline: false, isOnShift: false, isOnBreak: false });
        if (onStatusChange) {
          onStatusChange({ isOnline: false, isOnShift: false, isOnBreak: false });
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to go offline.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleToggleBreak = async () => {
    setLoadingAction(true);
    try {
      const nextBreak = !isOnBreak;
      const userId = user?._id || user?.id;
      const payload = {
        userId,
        isOnBreak: nextBreak,
        isOnline: !nextBreak,
        isOnShift: true
      };

      const res = await api.post('/rider/shift', payload);
      if (res.data.success) {
        setIsOnBreak(nextBreak);
        setIsOnline(!nextBreak);
        updateStoredUser({ isOnBreak: nextBreak, isOnline: !nextBreak, isOnShift: true });
        if (onStatusChange) {
          onStatusChange({ isOnBreak: nextBreak, isOnline: !nextBreak, isOnShift: true });
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update break status.');
    } finally {
      setLoadingAction(false);
    }
  };

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
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-2.5 z-40 sticky top-0 shadow-xs flex flex-col gap-2 w-full">
      {/* Top Bar: Logo, Status Pill, Profile Avatar */}
      <div className="flex items-center justify-between w-full">
        {/* Logo */}
        <img 
          src="/images/logo.png" 
          alt="ZyperGo" 
          className="h-7 w-auto object-contain cursor-pointer active:scale-95 transition-transform" 
          onClick={() => navigate(isPrefix ? '/rider/dashboard' : '/dashboard')} 
        />

        {/* Live Status Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide uppercase bg-slate-100 border border-slate-200">
          <span className={`w-2 h-2 rounded-full ${isOnline && !isOnBreak ? 'bg-emerald-500 animate-pulse' : isOnBreak ? 'bg-amber-500' : 'bg-slate-400'}`} />
          <span className={isOnline && !isOnBreak ? 'text-emerald-700' : isOnBreak ? 'text-amber-700' : 'text-slate-600'}>
            {isOnBreak ? 'On Break' : isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Profile Avatar / Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            type="button"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="w-9 h-9 rounded-full overflow-hidden border-2 border-white ring-2 ring-amber-400/90 shadow-xs flex items-center justify-center hover:scale-105 transition-transform cursor-pointer bg-amber-100"
            title="Account Menu"
          >
            {profilePhoto && !photoError ? (
              <img 
                src={getImageUrl(profilePhoto)} 
                alt={user?.name || "Rider"} 
                className="w-full h-full object-cover"
                onError={() => setPhotoError(true)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black text-xs uppercase">
                {user?.name ? user.name.substring(0, 2) : 'RD'}
              </div>
            )}
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3.5 py-2.5 border-b border-slate-100 mb-1 bg-slate-50/60 rounded-t-xl -mt-2 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full overflow-hidden border border-amber-300 shrink-0 bg-amber-100 flex items-center justify-center shadow-xs">
                  {profilePhoto && !photoError ? (
                    <img 
                      src={getImageUrl(profilePhoto)} 
                      alt={user?.name || "Rider"} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-black text-amber-800 uppercase">{user?.name ? user.name.substring(0, 2) : 'RD'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-slate-900 truncate">{user?.name || 'Rider'}</p>
                  <p className="text-[10px] font-bold text-slate-500 truncate">{user?.phone || user?.email || 'Rider Partner'}</p>
                </div>
              </div>
              
              <button 
                type="button"
                onClick={() => { setProfileDropdownOpen(false); navigate(isPrefix ? '/rider/profile' : '/profile'); }} 
                className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-[#006D77] flex items-center gap-2.5 font-bold transition-colors"
              >
                <UserIcon size={14} /> My Profile
              </button>
              <button 
                type="button"
                onClick={() => { setProfileDropdownOpen(false); navigate(isPrefix ? '/rider/profile' : '/profile'); }} 
                className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-[#006D77] flex items-center gap-2.5 font-bold transition-colors"
              >
                <SettingsIcon size={14} /> Settings
              </button>
              
              <div className="mt-1 pt-1 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={handleLogout} 
                  className="w-full text-left px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2.5 font-black transition-colors"
                >
                  <LogOut size={14} /> Logout Session
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Online / Offline & Break Controls */}
      <div className="pt-0.5">
        {!isOnline && !isOnBreak ? (
          /* Go Online Primary Button */
          <button 
            type="button"
            onClick={handleGoOnline} 
            disabled={loadingAction}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black py-2.5 px-4 rounded-xl text-xs shadow-sm active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            <Power size={15} />
            <span>{loadingAction ? 'Connecting...' : 'Go Online'}</span>
          </button>
        ) : (
          /* Online Active Bar: Take/End Break + Go Offline */
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={handleToggleBreak} 
              disabled={loadingAction}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black border transition-all active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-70 ${
                isOnBreak 
                  ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-inner' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              <Coffee size={14} />
              <span>{isOnBreak ? 'End Break' : 'Take Break'}</span>
            </button>

            <button 
              type="button"
              onClick={handleGoOffline} 
              disabled={loadingAction}
              className="flex-1 py-2.5 px-3 rounded-xl text-xs font-black bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-70"
            >
              <PowerOff size={14} />
              <span>{loadingAction ? 'Updating...' : 'Go Offline'}</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
