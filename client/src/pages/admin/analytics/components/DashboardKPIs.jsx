import React, { useState, useEffect } from 'react';
import { Package, Truck, AlertTriangle, RefreshCcw, DollarSign, Wallet, CheckCircle, Clock } from 'lucide-react';
import api from '../../../../api';

export default function DashboardKPIs() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const res = await api.get('/analytics/kpis');
        if (res.data.success) setData(res.data.data);
      } catch (err) {
        console.error("Failed to fetch KPIs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchKPIs();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading Dashboard KPIs...</div>;
  }

  const kpis = [
    { label: 'Total Bookings', value: data?.totalBookings || 0, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'In-Transit Parcels', value: data?.inTransit || 0, icon: Truck, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Failed Deliveries', value: data?.failedDeliveries || data?.failed || 0, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Returns', value: data?.returns || 0, icon: RefreshCcw, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total Revenue', value: `₹${(data?.revenue || 0).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Cash Pending (COD)', value: `₹${(data?.cashPending || 0).toLocaleString()}`, icon: Wallet, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Complaint Aging (Open)', value: data?.openTickets || data?.openExceptions || 0, icon: Clock, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-start gap-4">
            <div className={`p-3 rounded-lg ${kpi.bg} ${kpi.color}`}>
              <kpi.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{kpi.label}</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{kpi.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar Stub */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
        <div className="text-sm font-bold text-slate-700">Filters:</div>
        <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none"><option>All Cities</option></select>
        <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none"><option>All Routes</option></select>
        <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none"><option>All Hubs</option></select>
        <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none"><option>All Riders</option></select>
        <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none"><option>All Partners</option></select>
      </div>

      {/* Alert Layer */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-4">
        <div className="bg-red-100 p-2 rounded-full text-red-600"><AlertTriangle size={20} /></div>
        <div>
          <h4 className="font-bold text-red-800">Alert Layer</h4>
          <p className="text-sm text-red-600 mt-0.5">3 delayed shipments require immediate attention. 1 payment pending SLA breach.</p>
        </div>
      </div>
    </div>
  );
}
