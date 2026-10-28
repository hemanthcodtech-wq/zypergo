import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Lock, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CustomerSettings() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    smsAlerts: true,
    whatsappAlerts: false,
    promotions: false
  });

  const [passwordForm, setPasswordForm] = useState({ current: '', new: '' });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  
  const [isDeactivating, setIsDeactivating] = useState(false);

  const toggleToggle = (key) => {
    setNotifications({ ...notifications, [key]: !notifications[key] });
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (!passwordForm.current || !passwordForm.new) return;
    setIsUpdatingPassword(true);
    // Mock API call
    setTimeout(() => {
      setIsUpdatingPassword(false);
      setPasswordSuccess(true);
      setPasswordForm({ current: '', new: '' });
      setTimeout(() => setPasswordSuccess(false), 3000);
    }, 1500);
  };


  const handleLogout = () => {
    localStorage.removeItem('zypergo_token');
    localStorage.removeItem('zypergo_user');
    sessionStorage.removeItem('zypergo_portal');
    window.location.href = '/customer/login';
  };

  const handleDeactivate = () => {
    if (window.confirm('Are you sure you want to deactivate your account? This action cannot be undone.')) {
      setIsDeactivating(true);
      setTimeout(() => {
        localStorage.removeItem('zypergo_user');
        localStorage.removeItem('zypergo_token');
        window.location.href = '/welcome';
      }, 2000);
    }
  };

  return (
    <div className="flex flex-col bg-slate-50 min-h-full animate-in fade-in zoom-in-95 duration-300 relative pb-24">
      {/* Header */}
      <div className="bg-white px-4 py-5 flex items-center gap-4 sticky top-0 z-20 shadow-sm border-b border-slate-100">
        <button onClick={() => navigate(-1)} className="text-slate-700 hover:scale-110 transition-transform active:scale-95">
           <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-black text-slate-900 mx-auto pr-8">Settings</h1>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Notifications */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-[#FFB703]">
              <Bell size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Notifications</h2>
              <p className="text-xs font-bold text-slate-500">Manage your alerts</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {Object.entries(notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                <div>
                  <p className="font-bold text-slate-800 text-sm">{key.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase())}</p>
                </div>
                <button 
                  onClick={() => toggleToggle(key)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${value ? 'bg-[#006D77]' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${value ? 'translate-x-6' : ''}`}></div>
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Security */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-[#006D77]">
              <Lock size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Security</h2>
              <p className="text-xs font-bold text-slate-500">Update your password</p>
            </div>
          </div>
          
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Current Password</label>
              <input 
                type="password" 
                required
                value={passwordForm.current}
                onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})}
                placeholder="••••••••" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#006D77] outline-none text-sm font-bold text-slate-800 transition-all" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">New Password</label>
              <input 
                type="password" 
                required
                value={passwordForm.new}
                onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})}
                placeholder="••••••••" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#006D77] outline-none text-sm font-bold text-slate-800 transition-all" 
              />
            </div>
            
            {passwordSuccess && (
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                 <CheckCircle2 size={16} /> <span className="text-xs font-bold">Password updated successfully!</span>
              </div>
            )}

            <button 
              type="submit"
              disabled={isUpdatingPassword}
              className="w-full bg-[#006D77] hover:bg-[#005a62] text-white py-3.5 rounded-xl font-black text-sm transition-all active:scale-95 disabled:opacity-70 flex justify-center items-center gap-2 shadow-[0_8px_20px_-6px_rgba(0,109,119,0.5)]"
            >
              {isUpdatingPassword ? <Loader2 size={18} className="animate-spin" /> : 'Update Password'}
            </button>
          </form>
        </motion.div>

        {/* Logout Session */}
        <div className="pt-1">
          <button 
            type="button"
            onClick={handleLogout}
            className="w-full py-3.5 bg-red-50 hover:bg-red-100 text-red-600 font-black text-xs rounded-2xl border border-red-200 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <span>Logout Customer Session</span>
          </button>
        </div>

        {/* Danger Zone */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-red-50 border border-red-100 rounded-3xl p-6"
        >
          <div className="flex flex-col items-start gap-4">
            <div>
              <h2 className="text-lg font-black text-red-700 mb-1">Danger Zone</h2>
              <p className="text-xs font-bold text-red-500">Permanently delete your account and data.</p>
            </div>
            <button 
              onClick={handleDeactivate}
              disabled={isDeactivating}
              className="w-full bg-white border border-red-200 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 py-3 rounded-xl font-black text-sm transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
            >
              {isDeactivating ? <Loader2 size={18} className="animate-spin" /> : 'Deactivate Account'}
            </button>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
