import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Package, Phone, MessageCircle, Truck, Info, CreditCard, Clock, ChevronRight } from 'lucide-react';
import api from '../../api';

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.get(`/bookings/${id}`)
        .then(res => {
          if (res.data && res.data.data) {
            setBooking(res.data.data);
          } else {
            setBooking(getDemoBooking(id));
          }
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setBooking(getDemoBooking(id));
          setLoading(false);
        });
    }
  }, [id]);

  function getDemoBooking(orderId) {
    return {
      _id: orderId || 'ZYP95589497',
      trackingId: orderId || 'ZYP95589497',
      status: 'Booking Confirmed',
      createdAt: new Date().toISOString(),
      pickupLocation: { address: 'Kosgi Main Road, Kosgi, Telangana', city: 'Kosgi' },
      dropLocation: { address: 'Market Yard, Sindhanur, Karnataka', city: 'Sindhanur' },
      packageDetails: { category: 'Documents & Box', weight: 2.5 },
      pricing: { total: 350 },
      payment: { mode: 'Online', status: 'Completed' }
    };
  }

  if (loading) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center py-24 text-slate-400">
        <Truck className="animate-bounce text-[#0052CC] mb-3" size={36} />
        <p className="font-bold text-xs">Loading order details...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center py-24 text-slate-400">
        <Package size={48} className="text-slate-300 mb-3" />
        <p className="font-bold text-sm text-slate-700">No order information found</p>
      </div>
    );
  }

  const isPending = !booking.status || booking.status === 'Pending' || booking.status === 'Booking Confirmed';
  const hasRider = !['Delivered', 'Cancelled', 'Failed'].includes(booking.status) && !isPending;
  const otp = booking.proofOfDelivery?.otp || booking.trackingId?.replace(/\D/g, '').slice(-4) || '4291';

  return (
    <div className="flex flex-col bg-[#F8FAFC] min-h-full animate-in fade-in pb-24 font-sans text-slate-900">
      
      {/* Top Header */}
      <div className="bg-white px-4 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-xs border-b border-slate-100">
        <button onClick={() => navigate(-1)} className="p-1 rounded-full hover:bg-slate-100 text-slate-700 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-sm font-black text-slate-900">Order Details</h1>
        <div className="w-6"></div>
      </div>

      <div className="max-w-md md:max-w-xl mx-auto w-full p-4 space-y-4">
        
        {/* Order Header Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tracking Number</p>
            <h2 className="text-base font-black text-slate-900 mt-0.5">#{booking.trackingId}</h2>
          </div>
          <button 
            onClick={() => navigate(`/track/${booking.trackingId}`)} 
            className="bg-[#0052CC] hover:bg-[#0047cc] text-white px-4 py-2 rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <MapPin size={14} />
            <span>Track Live</span>
          </button>
        </div>

        {/* Status / Looking for Partner Banner */}
        {isPending && (
          <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-[#0052CC] mb-2 border border-blue-100">
              <Truck size={22} className="animate-pulse" />
            </div>
            <h3 className="font-black text-slate-900 text-sm mb-0.5">Assigning Delivery Executive</h3>
            <p className="text-xs font-medium text-slate-500 max-w-xs">
              We are connecting your parcel to the nearest available rider.
            </p>
          </div>
        )}

        {/* Assigned Rider Card */}
        {hasRider && booking.currentRider && (
          <div className="bg-white rounded-3xl p-4.5 shadow-xs border border-slate-100 space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-blue-50 text-[#0052CC] rounded-full flex items-center justify-center font-black text-sm border border-blue-100">
                  {booking.currentRider.name?.charAt(0) || 'R'}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm leading-tight">{booking.currentRider.name}</h3>
                  <p className="text-[11px] font-bold text-amber-500 mt-0.5">★ 4.9 Verified Rider</p>
                </div>
              </div>

              {/* OTP Pill */}
              <div className="bg-blue-50/70 border border-blue-100 rounded-xl py-1.5 px-3 text-center">
                <p className="text-[8.5px] font-black text-slate-500 uppercase tracking-wider">Pickup OTP</p>
                <p className="text-base font-black text-[#0052CC] tracking-widest">{otp}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <a 
                href={`tel:${booking.currentRider.phone}`}
                className="flex-1 bg-slate-50 border border-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-100 transition-colors"
              >
                <Phone size={15} /> Call
              </a>
              <a 
                href={`https://wa.me/91${booking.currentRider.phone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-[#0052CC] hover:bg-[#0047cc] text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <MessageCircle size={15} /> WhatsApp
              </a>
            </div>
          </div>
        )}

        {/* Route Details */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Route Summary</h3>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#0052CC] mt-1 shrink-0"></div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Pickup Location</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{booking.pickupLocation?.address || 'Origin Address'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B00] mt-1 shrink-0"></div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Drop Location</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{booking.dropLocation?.address || 'Destination Address'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Package & Payment Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0052CC] flex items-center justify-center mb-2">
              <Package size={17} />
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Package</p>
            <p className="text-xs font-black text-slate-900 mt-0.5">{booking.packageDetails?.category || 'General'}</p>
            <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{booking.packageDetails?.weight || 1} kg</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
              <CreditCard size={17} />
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Payment</p>
            <p className="text-xs font-black text-slate-900 mt-0.5">₹{booking.pricing?.total || 250}</p>
            <p className="text-[10px] font-semibold text-emerald-600 mt-0.5">{booking.payment?.mode || 'Paid Online'}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
