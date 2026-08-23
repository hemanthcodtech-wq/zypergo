import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import api from '../../../../api';

export default function OperationalReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/analytics/operational');
        if (res.data.success) setData(res.data.data);
      } catch (err) {
        console.error("Failed to fetch operational reports:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleExport = (endpoint) => {
    const baseUrl = api.defaults.baseURL || '/api';
    const token = localStorage.getItem('zypergo_token');
    window.open(`${baseUrl}${endpoint}?token=${token || ''}`, '_blank');
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Operational Reports...</div>;

  return (
    <div className="space-y-6">
      
      {/* Daily Stats Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">Daily Operations Summary</h3>
          <button 
            className="text-sm font-bold text-[#006D77] flex items-center gap-1 hover:underline"
            onClick={() => handleExport('/analytics/export/daily-bookings')}
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Total Bookings</th>
                <th className="px-4 py-3">Delivered</th>
                <th className="px-4 py-3">Failed</th>
                <th className="px-4 py-3">Pending Pickups</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.dailyStats?.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{row._id}</td>
                  <td className="px-4 py-3">{row.total}</td>
                  <td className="px-4 py-3 text-emerald-600 font-bold">{row.delivered}</td>
                  <td className="px-4 py-3 text-red-600">{row.failed}</td>
                  <td className="px-4 py-3 text-amber-600">{row.pendingPickups}</td>
                </tr>
              )) || <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-500">No daily stats available.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delayed & Unscanned Shipments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">Delayed & Unscanned Parcels (Last 24h)</h3>
          <button className="text-sm font-bold text-[#006D77] flex items-center gap-1 hover:underline">
            <Download size={14} /> Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Tracking ID</th>
                <th className="px-4 py-3">Current Status</th>
                <th className="px-4 py-3">Last Updated</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.delayedShipments?.map((shipment, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-slate-900">{shipment.trackingId}</td>
                  <td className="px-4 py-3"><span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-bold">{shipment.status}</span></td>
                  <td className="px-4 py-3">{new Date(shipment.updatedAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button className="text-blue-600 font-bold text-xs hover:underline">Investigate</button>
                  </td>
                </tr>
              )) || <tr><td colSpan="4" className="px-4 py-8 text-center text-slate-500">No delayed shipments found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
