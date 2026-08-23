import React, { useState, useEffect } from 'react';
import { X, User, Phone, MapPin, Package, AlertCircle } from 'lucide-react';
import api from '../../../api';

export default function CRMProfilePanel({ userId, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/support/admin/crm/${userId}`);
        if (res.data.success) setProfile(res.data.data);
      } catch (err) {
        console.error("Error fetching CRM profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  return (
    <div className="absolute inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col transform transition-transform animate-in slide-in-from-right duration-300">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <User size={18} className="text-[#006D77]" /> Customer Profile
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition">
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {loading ? (
          <p className="text-center text-slate-500 mt-10">Loading profile...</p>
        ) : profile ? (
          <>
            {/* Basic Info */}
            <div className="text-center space-y-2">
              <div className="w-20 h-20 bg-[#006D77]/10 text-[#006D77] rounded-full flex items-center justify-center font-black text-2xl mx-auto">
                {profile.customer?.name?.substring(0, 2).toUpperCase() || 'NA'}
              </div>
              <h2 className="text-xl font-bold text-slate-900">{profile.customer?.name}</h2>
              <p className="text-sm text-slate-500 flex items-center justify-center gap-1">
                <Phone size={14} /> {profile.customer?.phone}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-center">
                <Package size={20} className="text-blue-500 mx-auto mb-1" />
                <p className="text-2xl font-black text-slate-900">{profile.bookingHistory?.length || 0}</p>
                <p className="text-[10px] font-bold uppercase text-slate-400">Total Bookings</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-center">
                <AlertCircle size={20} className="text-red-500 mx-auto mb-1" />
                <p className="text-2xl font-black text-slate-900">{profile.ticketHistory?.length || 0}</p>
                <p className="text-[10px] font-bold uppercase text-slate-400">Support Tickets</p>
              </div>
            </div>

            {/* Saved Addresses */}
            {profile.customer?.savedAddresses?.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3 border-b pb-1">Saved Addresses</h4>
                <div className="space-y-2">
                  {profile.customer.savedAddresses.map((addr, idx) => (
                    <div key={idx} className="flex gap-2 items-start text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                      <MapPin size={16} className="text-[#006D77] shrink-0 mt-0.5" />
                      <p>{addr.addressLine1}, {addr.city} - {addr.pincode}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Bookings */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3 border-b pb-1">Recent Bookings</h4>
              <div className="space-y-2">
                {profile.bookingHistory?.slice(0, 5).map((booking, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm p-2 bg-slate-50 border border-slate-100 rounded">
                    <div>
                      <p className="font-mono text-slate-900 font-bold">{booking.trackingId}</p>
                      <p className="text-xs text-slate-500">{new Date(booking.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${booking.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {booking.status}
                    </span>
                  </div>
                ))}
                {profile.bookingHistory?.length === 0 && <p className="text-xs text-slate-400">No booking history.</p>}
              </div>
            </div>
          </>
        ) : (
          <p className="text-center text-red-500">Failed to load profile.</p>
        )}
      </div>
    </div>
  );
}
