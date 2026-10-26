import React from 'react';
import { User as UserIcon, MapPin, Truck, FileText, CheckCircle2, ShieldCheck, Mail, Phone, Calendar, ChevronLeft, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RiderProfile({ user, onLogout }) {
  const approvalStatus = user?.riderDetails?.approvalStatus || 'Pending';
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans p-4 md:p-6 lg:p-8 pb-24">
      <header className="sticky top-0 z-50 bg-[#F8FAFC]/90 backdrop-blur-xl mb-8 pb-4 pt-4 -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 border-b border-slate-200/50 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div className="flex items-center justify-center">
            <img src="/images/logo.png" alt="ZyperGo Logo" className="h-8 object-contain" />
          </div>
          <div className="w-10 h-10"></div> {/* Spacer for centering */}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm shrink-0">
            <UserIcon size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Profile</h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Your details and stats</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Avatar & Status */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col items-center text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFB703]/10 rounded-full blur-2xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
             
             {user?.riderDetails?.documents?.profileImageUrl ? (
               <img src={user.riderDetails.documents.profileImageUrl} alt="Profile" className="w-24 h-24 rounded-[2rem] object-cover mb-4 shadow-sm border border-slate-200" />
             ) : (
               <div className="w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center mb-4 shadow-sm border border-slate-200">
                 <UserIcon size={40} className="text-slate-400" />
               </div>
             )}
             <h2 className="text-2xl font-black text-slate-900 tracking-tight">{user?.name || 'Rider Name'}</h2>
             <p className="text-sm text-slate-500 font-medium mb-4">{user?.phone}</p>
             
             <div className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm ${
               approvalStatus === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
             }`}>
               {approvalStatus === 'Approved' ? <ShieldCheck size={16} /> : <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>}
               Status: {approvalStatus}
             </div>
          </div>
          
          <div className="bg-gradient-to-br from-[#006D77] to-teal-800 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-teal-400/20 rounded-full blur-2xl -z-10 translate-x-1/3 -translate-y-1/3"></div>
             <h3 className="text-[10px] font-black uppercase tracking-widest mb-1 text-teal-200">Total Trips</h3>
             <p className="text-4xl font-black tracking-tighter mb-4">124</p>
             <h3 className="text-[10px] font-black uppercase tracking-widest mb-1 text-teal-200">Performance Score</h3>
             <p className="text-2xl font-bold tracking-tight">{user?.riderDetails?.performance?.completionRate || 100}%</p>
          </div>
        </div>

        {/* Right Column: Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Personal Info */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
             <h3 className="text-lg font-black text-slate-900 mb-6 tracking-tight flex items-center gap-2">
               <FileText size={20} className="text-[#FFB703]" /> Personal Information
             </h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email</p>
                  <p className="font-bold text-slate-800 flex items-center gap-2"><Mail size={14} className="text-slate-400"/> {user?.email || 'Not provided'}</p>
                </div>
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone</p>
                  <p className="font-bold text-slate-800 flex items-center gap-2"><Phone size={14} className="text-slate-400"/> {user?.phone}</p>
                </div>
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 sm:col-span-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Address</p>
                  <p className="font-bold text-slate-800 flex items-center gap-2"><MapPin size={14} className="text-slate-400"/> {user?.riderDetails?.address || 'Not provided'}</p>
                </div>
             </div>
          </div>

          {/* Vehicle Info */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
             <h3 className="text-lg font-black text-slate-900 mb-6 tracking-tight flex items-center gap-2">
               <Truck size={20} className="text-[#FFB703]" /> Vehicle Details
             </h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Vehicle Type</p>
                  <p className="font-bold text-slate-800">{user?.riderDetails?.vehicleType || 'Bike'}</p>
                </div>
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Registration</p>
                  <p className="font-bold text-slate-800 font-mono">{user?.riderDetails?.vehicleRegistration || 'TS09EA1234'}</p>
                </div>
             </div>
          </div>

          {/* KYC Status */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
             <h3 className="text-lg font-black text-slate-900 mb-6 tracking-tight flex items-center gap-2">
               <CheckCircle2 size={20} className="text-[#FFB703]" /> Documents & KYC
             </h3>
             <div className="space-y-3">
               {[
                 { label: 'Driving License', key: 'drivingLicenseUrl' },
                 { label: 'Aadhaar Card', key: 'aadhaarUrl' },
                 { label: 'PAN Card', key: 'panUrl' },
                 { label: 'Vehicle RC', key: 'rcUrl' }
               ].map((doc) => {
                 const docUrl = user?.riderDetails?.documents?.[doc.key];
                 return (
                   <div key={doc.label} className="flex justify-between items-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                     <span className="font-bold text-slate-700">{doc.label}</span>
                     {docUrl ? (
                       <button 
                         onClick={() => window.open(docUrl, '_blank')}
                         className="px-4 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-xs font-black rounded-lg transition-colors shadow-sm"
                       >
                         View Document
                       </button>
                     ) : (
                       <span className="px-3 py-1 bg-amber-50 text-amber-600 text-xs font-black rounded-lg">Missing</span>
                     )}
                   </div>
                 );
               })}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
