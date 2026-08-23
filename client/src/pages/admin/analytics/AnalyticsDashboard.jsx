import React, { useState } from 'react';
import DashboardKPIs from './components/DashboardKPIs';
import OperationalReports from './components/OperationalReports';
import BusinessAnalytics from './components/BusinessAnalytics';
import { BarChart, Activity, PieChart } from 'lucide-react';
import api from '../../../api';

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('kpi');

  const handleExport = () => {
    const baseUrl = api.defaults.baseURL || '/api';
    const token = localStorage.getItem('zypergo_token');
    window.open(`${baseUrl}/analytics/export/daily-bookings?token=${token || ''}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Reports & Analytics</h1>
          <p className="text-sm text-slate-500">Data intelligence for route expansion and operational improvement.</p>
        </div>
        
        {/* Export Button */}
        <button 
          className="bg-[#006D77] hover:bg-[#005f6a] text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition"
          onClick={handleExport}
        >
          Export Daily Report
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex">
        <button 
          onClick={() => setActiveTab('kpi')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'kpi' ? 'bg-[#006D77]/10 text-[#006D77]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
        >
          <Activity size={16} /> Dashboard KPIs
        </button>
        <button 
          onClick={() => setActiveTab('operations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'operations' ? 'bg-[#006D77]/10 text-[#006D77]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
        >
          <BarChart size={16} /> Operational Reports
        </button>
        <button 
          onClick={() => setActiveTab('business')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'business' ? 'bg-[#006D77]/10 text-[#006D77]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
        >
          <PieChart size={16} /> Business Analytics
        </button>
      </div>

      {/* Content Area */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {activeTab === 'kpi' && <DashboardKPIs />}
        {activeTab === 'operations' && <OperationalReports />}
        {activeTab === 'business' && <BusinessAnalytics />}
      </div>
    </div>
  );
}
