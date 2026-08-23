import React, { useState, useEffect } from 'react';
import { Package, Archive, FileText, AlertTriangle, Scan, ChevronRight, MapPin } from 'lucide-react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import api from '../../api';

export default function HubHome() {
  const { user, selectedHub, setSelectedHub, hubs, unscannedAlerts } = useOutletContext();
  const navigate = useNavigate();
  const [manifests, setManifests] = useState([]);

  useEffect(() => {
    fetchManifests();
  }, []);

  const fetchManifests = async () => {
    try {
      const r = await api.get('/manifest');
      setManifests(r.data.data || []);
    } catch {}
  };

  const statusBadge = (s) => {
    const m = { Created: 'bg-slate-100 text-slate-700', Sealed: 'bg-blue-100 text-blue-700', Dispatched: 'bg-amber-100 text-amber-700', 'In Transit': 'bg-purple-100 text-purple-700', Completed: 'bg-green-100 text-green-700' };
    return m[s] || 'bg-slate-100 text-slate-600';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-7xl mx-auto">
      <div className="bg-white/50 backdrop-blur-xl p-6 rounded-[2rem] border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user.name.split(' ')[0]}! 👋</h1>
        <p className="text-slate-500 text-sm mt-1 font-bold">Hub operations overview for today.</p>
      </div>

      {/* Hub Selector (mobile) */}
      {hubs.length > 0 && (
        <div className="md:hidden bg-white/40 backdrop-blur-md p-4 rounded-3xl border border-white/80 shadow-[0_4px_15px_-5px_rgba(0,0,0,0.05)]">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Active Hub</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MapPin size={16} className="text-[#006D77]" />
            </div>
            {hubs.length === 1 ? (
              <div className="w-full bg-white/60 backdrop-blur-md text-slate-800 font-bold pl-12 pr-4 py-3 rounded-2xl border border-white/80 shadow-sm">
                {hubs[0].name}
              </div>
            ) : (
              <>
                <select value={selectedHub?._id || ''} onChange={e => setSelectedHub(hubs.find(h => h._id === e.target.value))} className="w-full bg-white/60 backdrop-blur-md text-slate-800 font-bold pl-12 pr-4 py-3 rounded-2xl border border-white/80 outline-none focus:border-[#006D77] shadow-sm appearance-none">
                  {hubs.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <ChevronRight size={16} className="text-slate-400 rotate-90" />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      {selectedHub && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Current Load', value: selectedHub.capacity?.currentParcels || 0, max: selectedHub.capacity?.maxCapacity, color: '#006D77', icon: Package },
            { label: 'Max Capacity', value: selectedHub.capacity?.maxCapacity || 0, color: '#3B82F6', icon: Archive },
            { label: 'Manifests Today', value: manifests.filter(m => new Date(m.createdAt).toDateString() === new Date().toDateString()).length, color: '#8B5CF6', icon: FileText },
            { label: 'Unscanned Alerts', value: unscannedAlerts?.length || 0, color: unscannedAlerts?.length > 0 ? '#EF4444' : '#22C55E', icon: AlertTriangle }
          ].map(stat => (
            <div key={stat.label} className="bg-white/50 backdrop-blur-md rounded-3xl p-5 border border-white/80 shadow-[0_4px_15px_-5px_rgba(0,0,0,0.05)] hover:bg-white/60 transition-colors group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-2xl shadow-sm transition-transform group-hover:scale-110 group-hover:shadow-md" style={{ background: stat.color + '15' }}>
                  <stat.icon size={20} style={{ color: stat.color }} />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value.toLocaleString()}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">{stat.label}</div>
              {stat.max && (
                <div className="mt-3 h-1.5 bg-white/80 rounded-full overflow-hidden shadow-inner p-0.5">
                  <div className="h-full rounded-full shadow-sm" style={{ width: `${Math.min(100, (stat.value / stat.max) * 100)}%`, background: stat.color }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Book Parcel Card */}
        <div className="bg-gradient-to-br from-[#0052CC] to-[#00388A] rounded-[2rem] p-6 text-white shadow-[0_8px_30px_-6px_rgba(0,82,204,0.5)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
          <Package size={32} className="mb-4 opacity-90 relative z-10 drop-shadow-md text-amber-300" />
          <h3 className="font-black text-xl relative z-10 tracking-tight">+ Book Customer Parcel</h3>
          <p className="text-xs font-bold opacity-80 mt-1 mb-6 relative z-10">Walk-in booking, live SMS & Email invoice</p>
          <button onClick={() => navigate('/dashboard/book')} className="w-full sm:w-auto bg-white hover:bg-slate-50 text-[#0052CC] font-black px-5 py-3 rounded-2xl text-sm transition-all flex items-center justify-center sm:justify-start gap-2 relative z-10 shadow-md group-hover:shadow-lg">
            Book Parcel <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Scan Desk */}
        <div className="bg-gradient-to-br from-[#006D77] to-[#004d55] rounded-[2rem] p-6 text-white shadow-[0_8px_30px_-6px_rgba(0,109,119,0.5)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
          <Scan size={32} className="mb-4 opacity-90 relative z-10 drop-shadow-md" />
          <h3 className="font-black text-xl relative z-10 tracking-tight">Scan Desk</h3>
          <p className="text-xs font-bold opacity-80 mt-1 mb-6 relative z-10">Process parcel scans at any checkpoint</p>
          <button onClick={() => navigate('/dashboard/scan')} className="w-full sm:w-auto bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white font-black px-5 py-3 rounded-2xl text-sm transition-all flex items-center justify-center sm:justify-start gap-2 relative z-10 group-hover:shadow-lg">
            Open Scan Desk <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Create Manifest */}
        <div className="bg-gradient-to-br from-[#6366F1] to-[#4338ca] rounded-[2rem] p-6 text-white shadow-[0_8px_30px_-6px_rgba(99,102,241,0.5)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
          <FileText size={32} className="mb-4 opacity-90 relative z-10 drop-shadow-md" />
          <h3 className="font-black text-xl relative z-10 tracking-tight">Create Manifest</h3>
          <p className="text-xs font-bold opacity-80 mt-1 mb-6 relative z-10">Group parcels into bags & consignments</p>
          <button onClick={() => navigate('/dashboard/manifests')} className="w-full sm:w-auto bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white font-black px-5 py-3 rounded-2xl text-sm transition-all flex items-center justify-center sm:justify-start gap-2 relative z-10 group-hover:shadow-lg">
            Create Now <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Recent Manifests */}
      <div className="bg-white/50 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="p-5 border-b border-white/60 flex justify-between items-center bg-white/30">
          <h3 className="font-black text-slate-800 tracking-tight">Recent Manifests</h3>
          <button onClick={() => navigate('/dashboard/manifests')} className="text-xs font-black text-[#006D77] bg-white/60 px-3 py-1.5 rounded-full hover:bg-white shadow-sm transition-all">View All</button>
        </div>
        <div className="divide-y divide-white/60">
          {manifests.slice(0, 5).map(m => (
            <div key={m._id} onClick={() => navigate('/dashboard/manifests')}
              className="flex items-center justify-between px-5 py-4 hover:bg-white/60 cursor-pointer transition-all">
              <div>
                <div className="font-black text-sm text-[#006D77]">{m.manifestId}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{m.manifestType} • {m.parcelCount} parcels</div>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm ${statusBadge(m.status)}`}>{m.status}</span>
            </div>
          ))}
          {manifests.length === 0 && <p className="text-slate-400 font-bold text-center py-8 text-sm">No manifests yet</p>}
        </div>
      </div>

      {/* Unscanned Alerts */}
      {unscannedAlerts?.length > 0 && (
        <div className="bg-red-50/80 backdrop-blur-xl border border-red-200/60 rounded-[2rem] shadow-[0_8px_30px_-6px_rgba(239,68,68,0.15)] overflow-hidden p-5">
          <h3 className="font-black text-red-700 flex items-center gap-2 mb-4 tracking-tight"><AlertTriangle size={20} /> {unscannedAlerts.length} Unscanned Parcel Alert{unscannedAlerts.length > 1 ? 's' : ''}</h3>
          <div className="space-y-3">
            {unscannedAlerts.slice(0, 3).map(b => (
              <div key={b._id} className="flex items-center justify-between bg-white/80 rounded-2xl p-4 border border-red-100 shadow-sm">
                <div>
                  <div className="font-black text-sm text-red-700">{b.trackingId}</div>
                  <div className="text-[10px] font-bold text-red-500/80 uppercase tracking-widest mt-1">Stuck at: {b.status}</div>
                </div>
                <button onClick={() => navigate('/dashboard/scan')} className="text-[10px] font-black uppercase tracking-widest text-red-700 bg-red-100 border border-red-200 px-3 py-2 rounded-xl hover:bg-red-200 transition-all shadow-sm">Scan Now</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
