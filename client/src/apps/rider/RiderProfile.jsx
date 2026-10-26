import React from 'react';
import { User as UserIcon, MapPin, Truck, FileText, CheckCircle2, ShieldCheck, Mail, Phone, Calendar, ChevronLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RiderProfile({ user, onLogout }) {
  const approvalStatus = user?.riderDetails?.approvalStatus || 'Approved';
  const navigate = useNavigate();
  
  return (
    <div className="min-h-full bg-slate-50 flex flex-col font-sans select-none text-slate-900 pb-28">
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shadow-xs">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="w-9 h-9 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 active:scale-95 transition"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-sm font-black text-slate-900 tracking-tight">Rider Profile</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verification & Details</p>
        </div>
        <div className="w-9 h-9 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
          <UserIcon size={18} />
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        
        {/* Rider Identification Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col items-center text-center relative overflow-hidden">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-600 to-teal-800 text-white rounded-3xl flex items-center justify-center text-2xl font-black shadow-md border-3 border-white ring-2 ring-emerald-500/20 mb-3">
            {user?.name ? user.name.substring(0, 2).toUpperCase() : 'RD'}
          </div>

          <h2 className="text-lg font-black text-slate-900 tracking-tight">{user?.name || 'Verified Rider'}</h2>
          <p className="text-xs text-slate-500 font-medium">{user?.phone || 'No phone registered'}</p>
          
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Account {approvalStatus}</span>
          </div>

          {/* Quick Metrics */}
          <div className="w-full grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100">
            <div className="bg-slate-50 rounded-2xl p-2.5 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Vehicle</span>
              <p className="text-xs font-black text-slate-800 mt-0.5">{user?.riderDetails?.vehicleType || 'Scooter / Bike'}</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-2.5 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Rating</span>
              <p className="text-xs font-black text-emerald-600 mt-0.5">⭐ 4.9 (Top Rated)</p>
            </div>
          </div>
        </div>

        {/* Contact & Personal Information */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <FileText size={14} /> Personal Details
          </h3>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs">
              <span className="text-slate-400 font-medium">Email</span>
              <span className="font-bold text-slate-800 truncate max-w-[180px]">{user?.email || 'Not provided'}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs">
              <span className="text-slate-400 font-medium">Phone</span>
              <span className="font-bold text-slate-800">{user?.phone}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs">
              <span className="text-slate-400 font-medium">Registration</span>
              <span className="font-mono font-bold text-slate-800">{user?.riderDetails?.vehicleRegistration || 'TS09EA1234'}</span>
            </div>
          </div>
        </div>

        {/* KYC & Documentation Status */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 size={14} /> Verified Documents
          </h3>

          <div className="space-y-1.5">
            {[
              { label: 'Driving License', key: 'drivingLicenseUrl' },
              { label: 'Aadhaar Card', key: 'aadhaarUrl' },
              { label: 'PAN Card', key: 'panUrl' },
              { label: 'Vehicle Registration (RC)', key: 'rcUrl' }
            ].map((doc) => {
              const docUrl = user?.riderDetails?.documents?.[doc.key];
              return (
                <div key={doc.label} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl text-xs">
                  <span className="font-bold text-slate-700">{doc.label}</span>
                  {docUrl ? (
                    <button 
                      onClick={() => window.open(docUrl, '_blank')}
                      className="px-2.5 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-[11px] font-black rounded-lg transition"
                    >
                      View
                    </button>
                  ) : (
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-md flex items-center gap-1">
                      <CheckCircle2 size={11} /> Verified
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
