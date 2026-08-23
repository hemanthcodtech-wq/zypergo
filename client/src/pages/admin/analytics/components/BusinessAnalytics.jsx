import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import api from '../../../../api';

export default function BusinessAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/analytics/business');
        if (res.data.success) setData(res.data.data);
      } catch (err) {
        console.error("Failed to fetch business analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Business Analytics...</div>;

  const mockDemandData = data?.demandTrend || [
    { _id: '2023-10-01', bookings: 120 },
    { _id: '2023-10-02', bookings: 132 },
    { _id: '2023-10-03', bookings: 101 },
    { _id: '2023-10-04', bookings: 143 },
    { _id: '2023-10-05', bookings: 190 },
    { _id: '2023-10-06', bookings: 230 },
    { _id: '2023-10-07', bookings: 210 },
  ];

  const topRoutes = data?.topRoutes?.length > 0 ? data.topRoutes : [
    { name: 'HYD - BLR', bookings: 450, revenue: 125000 },
    { name: 'BLR - CHN', bookings: 380, revenue: 95000 },
    { name: 'DEL - MUM', bookings: 600, revenue: 210000 },
    { name: 'HYD - VZG', bookings: 250, revenue: 45000 },
  ];

  return (
    <div className="space-y-6">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Route Profitability Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-bold text-slate-800 mb-6">Most Active / Profitable Routes</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topRoutes} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                <YAxis yAxisId="left" orientation="left" stroke="#006D77" axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#FFB703" axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend />
                <Bar yAxisId="left" dataKey="bookings" name="Total Bookings" fill="#006D77" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar yAxisId="right" dataKey="revenue" name="Revenue (₹)" fill="#FFB703" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Demand Trend Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-bold text-slate-800 mb-6">Demand by Day (Forecasting)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockDemandData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Line type="monotone" dataKey="bookings" name="Bookings" stroke="#3B82F6" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}
