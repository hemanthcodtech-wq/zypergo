import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Package, CheckCircle2, Navigation, ArrowLeft, Phone, X, Truck, Clock, MapPin, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../api';

export default function TrackShipment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trackingId, setTrackingId] = useState(id || '');
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLiveMap, setShowLiveMap] = useState(false);

  useEffect(() => {
    if (id) {
      handleSearch(null, id);
    }
  }, [id]);

  const handleSearch = async (e, forceId = null) => {
    if (e) e.preventDefault();
    const searchId = forceId || trackingId;
    if (!searchId) return;

    setLoading(true);
    setError('');
    
    try {
      const res = await api.get(`/bookings/${searchId}`);
      if (res.data && res.data.data) {
        setShipment(res.data.data);
        if (!forceId) navigate(`/track/${searchId}`);
      } else {
        setError('Tracking ID not found. Please check and try again.');
        setShipment(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Tracking ID not found. Please verify the code.');
      setShipment(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIndex = (status = '') => {
    const s = status.toUpperCase();
    if (s.includes('DELIVERED')) return 3;
    if (s.includes('OUT FOR DELIVERY')) return 2;
    if (s.includes('TRANSIT') || s.includes('PICKED')) return 1;
    return 0;
  };

  const allStatuses = [
    'Booking Confirmed',
    'In Transit',
    'Out for Delivery',
    'Delivered'
  ];

  if (!shipment && !loading) {
    return (
      <div className="flex-1 bg-[#F8FAFC] min-h-screen py-12 px-4 flex flex-col items-center justify-center font-sans">
        <div className="w-full max-w-md bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
          <div className="text-center">
            <img src="/images/logo.png" alt="ZyperGo" className="h-8 mx-auto mb-3 object-contain" />
            <h1 className="text-2xl font-black text-slate-900 leading-tight">
              Track Your <span className="text-[#FF6B00]">Package</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Enter your tracking number to get real-time delivery status
            </p>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                placeholder="e.g. ZYP95589497"
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20 outline-none font-mono font-bold text-base uppercase text-slate-900 transition-all"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={loading || !trackingId}
              className="w-full bg-[#0052CC] hover:bg-[#0047cc] text-white py-3.5 rounded-2xl font-black text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Track Order</span>
              <ArrowRight size={17} />
            </button>
          </form>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold text-center border border-red-200">
              {error}
            </div>
          )}

          <div className="pt-2 text-center">
            <p className="text-[11px] font-bold text-slate-400">Trusted logistics made simple. Fast • Secure • Reliable</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 bg-[#F8FAFC] min-h-screen flex flex-col items-center justify-center text-slate-400">
        <Truck className="animate-bounce text-[#0052CC] mb-3" size={36} />
        <p className="text-xs font-bold">Searching shipment records...</p>
      </div>
    );
  }

  const currentStep = getStatusIndex(shipment.status);
  const position = [15.4989, 77.2750];

  return (
    <div className="max-w-md md:max-w-xl mx-auto bg-[#F8FAFC] min-h-screen pb-24 font-sans text-slate-900">
      
      {/* Top Header */}
      <div className="bg-white px-4 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-xs border-b border-slate-100">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <img src="/images/logo.png" alt="ZyperGo" className="h-6 w-auto object-contain" />
        </div>
        <button onClick={() => setShipment(null)} className="text-xs font-bold text-[#0052CC]">
          New Search
        </button>
      </div>

      <div className="p-4 space-y-4">
        
        {/* Status Hero Card */}
        <div className="bg-white p-5 rounded-3xl shadow-xs border border-slate-100 space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-blue-50 text-[#0052CC] rounded-2xl flex items-center justify-center shrink-0">
                <Package size={22} />
              </div>
              <div>
                <h2 className="font-black text-slate-900 text-sm">{shipment.packageDetails?.category || 'Parcel Delivery'}</h2>
                <p className="text-slate-400 text-xs font-mono font-bold mt-0.5">#{shipment.trackingId}</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-blue-50 text-[#0052CC]">
              {shipment.status}
            </span>
          </div>

          {/* Stepper Progress */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
              {allStatuses.map((st, i) => (
                <span key={i} className={i <= currentStep ? 'text-[#0052CC]' : 'text-slate-400'}>
                  {st.split(' ')[0]}
                </span>
              ))}
            </div>
            <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 bottom-0 left-0 bg-[#0052CC] rounded-full transition-all duration-500"
                style={{ width: `${((currentStep + 1) / allStatuses.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Route Details */}
        <div className="bg-white p-5 rounded-3xl shadow-xs border border-slate-100 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Delivery Route</h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Origin</p>
              <p className="font-bold text-slate-800 mt-0.5 truncate">{shipment.pickupLocation?.address?.split(',')[0] || 'Origin'}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Destination</p>
              <p className="font-bold text-slate-800 mt-0.5 truncate">{shipment.dropLocation?.address?.split(',')[0] || 'Destination'}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
