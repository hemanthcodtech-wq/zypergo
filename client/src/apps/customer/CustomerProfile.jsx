import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, CreditCard, Bell, LogOut, ChevronRight, CheckCircle2, FileText, Calendar, Settings, HelpCircle, Package, Receipt } from 'lucide-react';

export default function CustomerProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: 'Guest', email: 'guest@zypergo.com', phone: '0000000000' });

  useEffect(() => {
    const userData = localStorage.getItem('zypergo_user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {}
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('zypergo_token');
    localStorage.removeItem('zypergo_user');
    window.location.href = '/welcome';
  };

  const OptionRow = ({ icon, label, onClick, color = "text-slate-700", noBorder = false }) => (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between py-4 bg-white active:bg-slate-50 transition-all ${noBorder ? '' : 'border-b border-slate-50 hover:bg-slate-50/50'}`}
    >
      <div className="flex items-center gap-4">
        <div className={`flex items-center justify-center p-2.5 rounded-2xl bg-slate-50 shadow-sm border border-slate-100 ${color}`}>
          {icon}
        </div>
        <span className={`font-bold text-[15px] tracking-wide ${color}`}>{label}</span>
      </div>
      <ChevronRight size={20} className={color === 'text-red-500' ? 'text-red-300' : 'text-slate-300'} />
    </button>
  );

  return (
    <div className="flex flex-col bg-white min-h-full pb-20 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Header */}
      <div className="bg-white px-4 py-5 flex items-center gap-4 sticky top-0 z-20">
        <h1 className="text-xl font-black text-slate-900 mx-auto">Profile</h1>
      </div>

      <div className="px-6">
        {/* Profile Info */}
        <div className="flex items-center gap-5 py-8 mb-4 border-b border-slate-100">
          <div className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center shrink-0 border-4 border-white shadow-md">
             <User size={36} className="text-[#006D77]" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 leading-tight mb-1">{user.name}</h2>
            <div className="flex items-center gap-2 text-slate-500 font-bold mb-1">
              <span className="bg-slate-100 px-2 py-0.5 rounded-md text-xs">+91 {user.phone}</span>
            </div>
            <p className="text-slate-500 text-sm font-medium">{user.email || 'No email provided'}</p>
          </div>
        </div>

        {/* Options List */}
        <div className="mt-4">
          <OptionRow 
            icon={<Package size={20} strokeWidth={2.5} />} 
            label="My Orders" 
            onClick={() => navigate('/shipments')} 
          />
          <OptionRow 
            icon={<Calendar size={20} strokeWidth={2.5} />} 
            label="My Bookings" 
            onClick={() => navigate('/booking')} 
          />
          <OptionRow 
            icon={<MapPin size={20} strokeWidth={2.5} />} 
            label="Addresses" 
            onClick={() => navigate('/addresses')} 
          />
          <OptionRow 
            icon={<CreditCard size={20} strokeWidth={2.5} />} 
            label="Wallet & Payments" 
            onClick={() => {}} 
          />
          <OptionRow 
            icon={<Receipt size={20} strokeWidth={2.5} />} 
            label="Rate Card" 
            onClick={() => {}} 
          />
          <OptionRow 
            icon={<Settings size={20} strokeWidth={2.5} />} 
            label="Settings" 
            onClick={() => navigate('/settings')} 
          />
          <OptionRow 
            icon={<HelpCircle size={20} strokeWidth={2.5} />} 
            label="Help & Support" 
            onClick={() => navigate('/support')} 
          />
          <OptionRow 
            icon={<LogOut size={20} strokeWidth={2.5} />} 
            label="Logout" 
            color="text-red-500"
            noBorder
            onClick={handleLogout} 
          />
        </div>
      </div>
    </div>
  );
}
