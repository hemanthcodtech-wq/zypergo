import React, { useState, useEffect, useRef } from 'react';
import { Truck, Navigation, CheckCircle2, MapPin, Package, AlertTriangle, ShieldCheck, Clock, Activity, Power, Star, ArrowUpRight, ChevronRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import RiderTaskFlow from './RiderTaskFlow';
import RiderHeader from './RiderHeader';

export default function RiderDashboard({ user, onLogout }) {
  const [availableJobs, setAvailableJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [isShiftToggling, setIsShiftToggling] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const navigate = useNavigate();

  // Location State
  const [currentLocation, setCurrentLocation] = useState(null);
  const watchIdRef = useRef(null);

  // Form State
  const [otp, setOtp] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const isOnShift = user?.riderDetails?.isOnShift || false;
  const isOnline = user?.riderDetails?.isOnline || false;

  // Fetch Jobs
  const fetchJobs = async () => {
    try {
      // 1. Fetch Active/My Jobs from generic endpoint
      const resAll = await api.get('/admin/bookings');
      if (resAll.data?.success) {
        const allBookings = resAll.data.data;
        const active = allBookings.filter(b => 
          ['Rider Assigned', 'Rider On the Way', 'Arrived at Pickup', 'Picked Up', 'In Transit', 'Out for Delivery'].includes(b.status) && 
          b.assignedRiders?.some(r => r.riderId === user?._id || true)
        );
        setMyJobs(active);
        
        if (active.length > 0 && !activeJob) {
          setActiveJob(active[0]);
        }
      }

      // 2. Fetch Available Jobs (only works if online & on shift)
      if (user?._id) {
        const resAvail = await api.get(`/rider/jobs?userId=${user._id}`);
        if (resAvail.data?.success) {
          setAvailableJobs(resAvail.data.data);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchJobs();
    
    // Poll for new jobs every 10 seconds
    const interval = setInterval(() => {
      fetchJobs();
    }, 10000);

    // Offline Listener
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Location Tracking
    const startTracking = () => {
      if ('geolocation' in navigator) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setCurrentLocation({ lat: latitude, lng: longitude });
            if (user?._id) {
               try {
                 await api.post('/rider/location', { userId: user._id, lat: latitude, lng: longitude });
               } catch (e) {
                 // Ignore ping error
               }
            }
          },
          (err) => console.warn("Location watch error:", err.message),
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
        );
      }
    };

    const stopTracking = () => {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };

    if (isOnShift && isOnline) {
      startTracking();
    } else {
      stopTracking();
      setAvailableJobs([]);
    }

    return () => {
      clearInterval(interval);
      stopTracking();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnShift, isOnline, user?._id]);

  const handleStartShift = async () => {
    setIsShiftToggling(true);
    try {
      // 1. Request location if available
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            setCurrentLocation({ lat: latitude, lng: longitude });
            if (user?._id) {
              await api.post('/rider/location', { userId: user._id, lat: latitude, lng: longitude }).catch(() => {});
            }
          },
          (err) => console.log('Location permission info:', err.message),
          { timeout: 5000 }
        );
      }

      // 2. Turn Shift ON & Online in backend
      const res = await api.post('/rider/shift', {
        userId: user?._id,
        isOnShift: true,
        isOnline: true,
        isOnBreak: false
      });

      if (res.data?.success) {
        if (user) {
          user.riderDetails = {
            ...user.riderDetails,
            isOnShift: true,
            isOnline: true,
            isOnBreak: false
          };
          localStorage.setItem('zypergo_user', JSON.stringify(user));
        }
        fetchJobs();
      }
    } catch (err) {
      console.error('Error starting shift:', err);
    } finally {
      setIsShiftToggling(false);
    }
  };

  const acceptJob = async (job) => {
    if (job.status === 'Relay Handoff Pending' || job.status === 'Transhipment Pending') {
      const enteredOtp = window.prompt("Enter the 4-digit Handover OTP from the other Rider:");
      if (!enteredOtp) return;
      
      setLoading(true);
      try {
        const res = await api.post(`/rider/jobs/${job._id}/accept-handover`, { newRiderId: user?._id, otp: enteredOtp });
        if (res.data?.success) {
          fetchJobs();
          setActiveJob(res.data.data);
        }
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to accept handover');
        fetchJobs(); 
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      const res = await api.put(`/admin/bookings/${job._id}/assign-rider`, { riderId: user?._id });
      if (res.data?.success) {
        fetchJobs();
        setActiveJob(res.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to accept job');
      fetchJobs(); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 font-sans flex flex-col text-slate-900 select-none">
      <RiderHeader user={user} onLogout={onLogout} />
      
      {isOffline && (
        <div className="bg-rose-500 text-white text-center py-1.5 px-3 text-xs font-bold flex items-center justify-center gap-1.5 z-40">
           <AlertTriangle size={14} /> Offline Mode - Check your internet
        </div>
      )}

      {/* Main App Content Viewport */}
      <main className="flex-1 w-full flex flex-col relative px-4 py-4 pb-28">
        
        {/* Quick Shift Metric Bar */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today</span>
            <span className="text-sm font-extrabold text-slate-900 mt-0.5">₹{user?.riderDetails?.earnings?.today || '0'}</span>
          </div>
          <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Missions</span>
            <span className="text-sm font-extrabold text-emerald-600 mt-0.5">{myJobs.length} Active</span>
          </div>
          <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rating</span>
            <div className="flex items-center gap-0.5 mt-0.5">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <span className="text-sm font-extrabold text-slate-900">4.9</span>
            </div>
          </div>
        </div>

        {/* Central Display */}
        {activeJob ? (
          <div className="w-full flex-1">
            <RiderTaskFlow 
              activeJob={activeJob} 
              onCompleteJob={() => {
                setActiveJob(null);
                fetchJobs();
              }} 
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-6">
            {!isOnShift || !isOnline ? (
              /* Professional Offline Hero Card */
              <div className="w-full bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col items-center text-center">
                {/* Modern Indicator Icon */}
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4 border border-slate-200 shadow-inner">
                  <Clock size={28} />
                </div>
                
                <h2 className="text-lg font-black tracking-tight text-slate-900 mb-1">
                  You are Offline
                </h2>
                <p className="text-xs text-slate-500 max-w-[260px] leading-relaxed mb-6 font-medium">
                  Go online to receive instant pickup and parcel delivery orders in your zone.
                </p>

                {/* Primary Action Button */}
                <button
                  onClick={handleStartShift}
                  disabled={isShiftToggling}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <Power size={16} />
                  <span>{isShiftToggling ? 'Connecting...' : 'Go Online & Start Shift'}</span>
                </button>

                {/* Readiness Checklist */}
                <div className="w-full mt-6 pt-4 border-t border-slate-100 flex items-center justify-around text-[11px] font-bold text-slate-500">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={13} className="text-emerald-500" /> GPS Auto-detect
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={13} className="text-emerald-500" /> Fast Payouts
                  </span>
                </div>
              </div>
            ) : (
              /* Online Radar / Searching Mode */
              <div className="w-full flex-1 flex flex-col items-center justify-center text-center relative py-6">
                {/* Pulsing Radar Ring Animation */}
                <div className="relative w-44 h-44 flex items-center justify-center mb-6">
                  <div className="absolute inset-0 rounded-full border border-emerald-400/30 animate-ping" style={{ animationDuration: '3s' }}></div>
                  <div className="absolute inset-4 rounded-full border border-emerald-500/20 animate-pulse"></div>
                  <div className="w-24 h-24 rounded-full bg-emerald-50 border-2 border-emerald-500/30 shadow-lg flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                      <Truck size={28} />
                    </div>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/70 text-emerald-800 text-xs font-black uppercase tracking-wider mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Radar Active
                </div>
                
                <h3 className="text-base font-extrabold text-slate-900 mb-1">
                  Searching for Deliveries...
                </h3>
                <p className="text-xs text-slate-500 max-w-[240px] leading-relaxed">
                  Stay near central hub areas for faster dispatch assignment.
                </p>

                {currentLocation && (
                  <div className="mt-4 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-500">
                    GPS: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Incoming Available Mission Popup (Within Phone Frame) */}
        {(!activeJob && availableJobs.length > 0 && isOnShift && isOnline) && (() => {
          const job = availableJobs[0];
          return (
            <div className="mt-4 w-full bg-white rounded-3xl p-4 border border-emerald-200 shadow-xl animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                  New Order
                </span>
                <span className="text-lg font-black text-slate-900">
                  ₹{job.estimatedPrice || 120}
                </span>
              </div>

              <div className="space-y-2 mb-4 text-left">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-800 mt-1 shrink-0"></div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Pickup</p>
                    <p className="text-xs font-bold text-slate-800 line-clamp-1">{job.pickupLocation?.address || 'Pickup Point'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0"></div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Delivery</p>
                    <p className="text-xs font-bold text-slate-800 line-clamp-1">{job.dropLocation?.address || 'Destination'}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setAvailableJobs(availableJobs.slice(1))} 
                  className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition"
                >
                  Decline
                </button>
                <button 
                  onClick={() => acceptJob(job)} 
                  disabled={loading} 
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition flex items-center justify-center gap-1.5"
                >
                  {loading ? 'Accepting...' : 'Accept Mission'}
                </button>
              </div>
            </div>
          );
        })()}

      </main>
    </div>
  );
}
