import React, { useState, useEffect } from 'react';
import {
  Scan, FileText, Warehouse, Activity, LayoutDashboard, LogOut,
  User, Bell, Package, PlusCircle
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import api from '../../api';

const NAV_ITEMS = [
  { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'book', path: '/dashboard/book', label: '+ Book Parcel', icon: PlusCircle },
  { id: 'scan', path: '/dashboard/scan', label: 'Scan', icon: Scan },
  { id: 'manifests', path: '/dashboard/manifests', label: 'Manifests', icon: FileText },
  { id: 'inventory', path: '/dashboard/inventory', label: 'Inventory', icon: Warehouse },
  { id: 'records', path: '/dashboard/records', label: 'Records', icon: Activity },
  { id: 'account', path: '/dashboard/account', label: 'Account', icon: User },
];

export default function HubManagerDashboard({ onLogout }) {
  const [user, setUser] = useState({ name: 'Hub Manager', role: 'HubManager', phone: '' });
  const [hubs, setHubs] = useState([]);
  const [selectedHub, setSelectedHub] = useState(null);
  const [unscannedAlerts, setUnscannedAlerts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('zypergo_user');
    if (saved) setUser(JSON.parse(saved));
    fetchHubs();
    fetchUnscannedAlerts();
  }, []);

  const fetchHubs = async () => {
    try {
      const r = await api.get('/hub');
      const hubList = r.data.data || [];
      setHubs(hubList);
      if (hubList.length > 0) setSelectedHub(hubList[0]);
    } catch {}
  };

  const fetchUnscannedAlerts = async () => {
    try {
      const r = await api.get('/scan/alerts/unscanned');
      setUnscannedAlerts(r.data.data || []);
    } catch {}
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('zypergo_token');
      localStorage.removeItem('zypergo_user');
      navigate('/');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 font-sans flex flex-col relative overflow-x-hidden">
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-[#006D77]/30 to-[#83C5BE]/40 rounded-full blur-[100px] -z-10 translate-x-1/3 -translate-y-1/4 mix-blend-multiply"></div>
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-[#006D77]/20 to-[#006D77]/10 rounded-full blur-[100px] -z-10 -translate-x-1/3 translate-y-1/4 mix-blend-multiply"></div>

      {/* TOP HEADER */}
      <header className="bg-white/70 backdrop-blur-xl text-slate-900 px-4 md:px-6 h-16 flex items-center justify-between shrink-0 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border-b border-white/50 z-40 sticky top-0">
        <div className="flex-1 flex items-center justify-start">
          {unscannedAlerts.length > 0 && (
            <button onClick={() => navigate('/dashboard/scan')} className="relative md:hidden">
              <Bell size={20} className="text-[#006D77]" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">{unscannedAlerts.length}</span>
            </button>
          )}
        </div>

        <div className="flex items-center justify-center gap-2">
          <img src="/images/logo.png" alt="ZyperGo Logo" className="h-8 md:h-10 object-contain" />
          <span className="font-black text-xl tracking-tighter text-[#006D77] hidden sm:block">HUB MANAGER</span>
        </div>

        <div className="flex-1 flex justify-end items-center gap-3 md:gap-5">
          <div className="hidden md:flex items-center gap-3 bg-white/60 px-3 md:px-4 py-1.5 md:py-2 rounded-xl border border-white/80 shadow-sm">
            <select
              className="bg-transparent border-none outline-none text-xs md:text-sm font-bold text-slate-800 cursor-pointer"
              value={selectedHub?._id || ''}
              onChange={(e) => setSelectedHub(hubs.find(h => h._id === e.target.value))}
            >
              {hubs.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
            </select>
          </div>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-[#006D77] to-[#83C5BE] flex items-center justify-center text-white shadow-lg border border-white/20">
            <User size={16} className="md:w-5 md:h-5"/>
          </div>
        </div>
      </header>

      {/* HORIZONTAL NAV */}
      <nav className="bg-white/50 backdrop-blur-md border-b border-white/60 sticky top-16 z-30 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto px-2 sm:px-6">
          <div className="flex overflow-x-auto hide-scrollbar py-2 md:py-3 gap-1 md:gap-2">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-300
                  ${isActive ? 'bg-[#006D77] text-white shadow-md shadow-[#006D77]/20 scale-[1.02]' : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'}
                `}
              >
                <item.icon size={16} className="sm:w-5 sm:h-5" />
                {item.label}
              </NavLink>
            ))}
            <div className="flex-1"></div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap text-red-500 hover:bg-red-50 transition-colors ml-2"
            >
              <LogOut size={16} className="sm:w-5 sm:h-5"/>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 md:p-6 overflow-x-hidden relative">
        <Outlet context={{ user, selectedHub, setSelectedHub, hubs, fetchUnscannedAlerts, unscannedAlerts }} />
      </main>
    </div>
  );
}
