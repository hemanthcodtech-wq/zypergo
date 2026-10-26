import React, { useState, useEffect, useRef } from 'react';
import { Truck, Navigation, CheckCircle2, MapPin, Package, AlertTriangle, Bell, Settings, Phone, Camera, ArrowRight, ShieldCheck, Clock, LayoutDashboard, Wallet, User as UserIcon, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import RiderTaskFlow from './RiderTaskFlow';
import RiderHeader from './RiderHeader';

export default function RiderDashboard({ user, onLogout }) {
  const [availableJobs, setAvailableJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const navigate = useNavigate();

  // Location State
  const [currentLocation, setCurrentLocation] = useState(null);
  const watchIdRef = useRef(null);

  // Form State
  const [otp, setOtp] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // Fetch Jobs
  const fetchJobs = async () => {
    try {
      // 1. Fetch Active/My Jobs from generic endpoint
      const resAll = await api.get('/admin/bookings');
      if (resAll.data.success) {
        const allBookings = resAll.data.data;
        const active = allBookings.filter(b => ['Rider Assigned', 'Rider On the Way', 'Arrived at Pickup', 'Picked Up', 'In Transit', 'Out for Delivery'].includes(b.status) && b.assignedRiders?.some(r => r.riderId === user?._id || true));
        setMyJobs(active);
        
        if (active.length > 0 && !activeJob) {
          setActiveJob(active[0]);
        }
      }

      // 2. Fetch Available Jobs (only works if online & on shift on backend)
      if (user?._id) {
        const resAvail = await api.get(`/rider/jobs?userId=${user._id}`);
        if (resAvail.data.success) {
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
            // Push to backend
            if (user?._id) {
               try {
                 await api.post('/rider/location', { userId: user._id, lat: latitude, lng: longitude });
               } catch (e) {
                 // Ignore background ping fails
               }
            }
          },
          (err) => console.error("Error watching position", err),
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      }
    };

    const stopTracking = () => {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };

    if (user?.riderDetails?.isOnline && user?.riderDetails?.isOnShift) {
      startTracking();
    } else {
      stopTracking();
      // Also clear available jobs if offline
      setAvailableJobs([]);
    }

    return () => {
      clearInterval(interval);
      stopTracking();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user?.riderDetails?.isOnline, user?.riderDetails?.isOnShift]);

  const handleStatusUpdate = async (newStatus, payload = {}) => {
    if (!activeJob) return;
    setLoading(true);
    try {
      const res = await api.put(`/admin/bookings/${activeJob._id}`, { status: newStatus, ...payload });
      if (res.data.success) {
        setActiveJob(res.data.data);
        fetchJobs();
        // Clear forms
        setOtp('');
        setPhotoUrl('');
      }
    } catch (err) {
      alert('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const acceptJob = async (job) => {
    if (job.status === 'Relay Handoff Pending' || job.status === 'Transhipment Pending') {
      const enteredOtp = window.prompt("Enter the 4-digit Handover OTP from the other Rider:");
      if (!enteredOtp) return;
      
      setLoading(true);
      try {
        const res = await api.post(`/rider/jobs/${job._id}/accept-handover`, { newRiderId: user?._id, otp: enteredOtp });
        if (res.data.success) {
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
      if (res.data.success) {
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

  const handleStrictUpdate = async (newStatus, requireOtp = false, requirePhoto = false) => {
    if (requireOtp && otp !== '1234') {
      alert("Invalid OTP! Please enter 1234 for testing.");
      return;
    }
    if (requirePhoto && !photoUrl) {
      alert("You must capture a photo to proceed!");
      return;
    }

    try {
      // Use the actual rider endpoint which has the strict validations
      const res = await api.post(`/rider/jobs/${activeJob._id}/update-status`, {
        status: newStatus,
        otp,
        photoUrl,
        reason: 'Updated via Rider App'
      });
      if (res.data.success) {
        setActiveJob(res.data.data);
        fetchJobs();
        setOtp('');
        setPhotoUrl('');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update job');
    }
  };

  const handleDepositCash = async () => {
    try {
      // Use existing endpoint
      const res = await api.post('/finance-settlements/deposit', {
        riderId: user?._id,
        amount: user?.riderDetails?.earnings?.pendingDeposit || 0,
        expectedAmount: user?.riderDetails?.earnings?.pendingDeposit || 0,
        notes: 'Deposited at Hub via App'
      });
      if (res.data.success) {
        alert('Cash Deposit Logged Successfully!');
        setShowEarningsModal(false);
      }
    } catch (err) {
      alert('Failed to log deposit');
    }
  };

  // State Machine Render Logic
  const renderActiveJobState = () => {
    if (!activeJob) return null;

    return (
      <RiderTaskFlow 
        activeJob={activeJob} 
        onCompleteJob={() => {
          setActiveJob(null);
          fetchJobs();
        }} 
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col text-slate-900">
      <RiderHeader user={user} onLogout={onLogout} onShowEarnings={() => {}} />
      
      {isOffline && (
        <div className="bg-red-600 text-white text-center py-2 text-sm font-bold flex items-center justify-center gap-2 z-50">
           <AlertTriangle size={16} /> No Internet Connection. Check your network.
        </div>
      )}

      <main className="flex-1 w-full flex flex-col relative overflow-hidden">
        
        {/* Background Map / Radar Pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-40" 
             style={{ backgroundImage: 'radial-gradient(circle at center, #FFB703 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>

        {/* Central Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-4">
           
           {activeJob ? (
             <div className="w-full max-w-lg h-full pb-20">
               {renderActiveJobState()}
             </div>
           ) : (
             <div className="flex flex-col items-center text-center">
                {(!user?.riderDetails?.isOnline || !user?.riderDetails?.isOnShift) ? (
                   // Offline State
                   <div className="bg-white/70 backdrop-blur-xl p-10 rounded-3xl border border-white/60 max-w-sm w-full shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                     <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-6 flex items-center justify-center border border-slate-200 shadow-inner">
                       <Clock size={32} className="text-slate-400" />
                     </div>
                     <h2 className="text-2xl font-black uppercase tracking-widest text-slate-800 mb-2">You are Offline</h2>
                     <p className="text-sm text-slate-500 font-medium leading-relaxed">To start receiving missions, you must grant location access and start your shift.</p>
                     
                     <button 
                       onClick={() => {
                         if ('geolocation' in navigator) {
                           navigator.geolocation.getCurrentPosition(
                             (pos) => alert("Location access granted! You can now turn your shift ON in the header."),
                             (err) => alert("Please allow location access in your browser settings to continue.")
                           );
                         } else {
                           alert("Geolocation is not supported by your browser.");
                         }
                       }}
                       className="w-full mt-6 bg-[#FFB703] hover:bg-[#e5a400] text-black font-black uppercase tracking-widest py-4 rounded-xl shadow-md transition-colors"
                     >
                       Grant Location Access
                     </button>
                   </div>
                ) : (
                   // Online / Radar State
                   <div className="flex flex-col items-center relative">
                     {/* Pulsing Radar Rings */}
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-[#FFB703] rounded-full animate-ping opacity-30"></div>
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-[#FFB703] rounded-full animate-ping opacity-50" style={{ animationDelay: '500ms' }}></div>
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-[#FFB703] rounded-full animate-ping opacity-70" style={{ animationDelay: '1000ms' }}></div>
                     
                     <div className="w-28 h-28 bg-white/80 backdrop-blur-md rounded-full mx-auto mb-8 flex items-center justify-center relative z-10 shadow-[0_0_40px_rgba(255,183,3,0.3)] border-4 border-[#FFB703]">
                       <div className="w-20 h-20 bg-[#FFB703] rounded-full flex items-center justify-center shadow-inner">
                         <Activity size={40} className="text-black" />
                       </div>
                     </div>
                     
                     <h2 className="text-3xl font-black uppercase tracking-widest text-slate-900 mb-3 drop-shadow-sm">Searching...</h2>
                     <p className="text-sm text-slate-700 font-bold tracking-wide uppercase bg-white/60 backdrop-blur-xl px-5 py-2.5 rounded-full border border-white/80 shadow-sm">Scanning for nearby missions</p>
                     
                     {currentLocation && (
                       <p className="text-xs text-slate-500 mt-6 font-mono bg-white/60 backdrop-blur-md border border-white/60 shadow-sm px-3 py-1 rounded-md">
                         LAT: {currentLocation.lat.toFixed(4)} • LNG: {currentLocation.lng.toFixed(4)}
                       </p>
                     )}
                   </div>
                )}
             </div>
           )}

        </div>

        {(!activeJob && availableJobs.length > 0 && user?.riderDetails?.isOnline && user?.riderDetails?.isOnShift) && (() => {
          const job = availableJobs[0];
          const pickupParts = (job.pickupLocation?.address || '').toLowerCase().split(',').map(s => s.trim());
          const dropParts = (job.dropLocation?.address || '').toLowerCase().split(',').map(s => s.trim());
          const ignoreList = ['india', 'andhra pradesh', 'telangana', 'karnataka', 'tamil nadu', 'maharashtra'];
          const commonLocalities = pickupParts.filter(part => dropParts.includes(part) && part.length > 3 && isNaN(part) && !ignoreList.includes(part));
          const isSameRegion = (job.pickupLocation?.pincode && job.dropLocation?.pincode && job.pickupLocation?.pincode === job.dropLocation?.pincode) || commonLocalities.length > 0;
          const isHubDrop = job.metadata?.deliveryType === 'Intercity Hub-and-Spoke' && !isSameRegion;

          return (
            <div className="fixed bottom-[70px] md:bottom-0 left-0 right-0 z-40 bg-white text-slate-900 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.3)] border-t border-slate-200 p-6 pb-6 md:pb-10 max-w-lg mx-auto animate-in slide-in-from-bottom duration-300 ease-out">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="bg-[#FFB703] text-black px-3 py-1 rounded-md text-[10px] font-black tracking-widest uppercase shadow-sm animate-pulse">New Mission</span>
                  <h3 className="text-2xl font-black mt-2 tracking-tight">Mission Assigned</h3>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-slate-900 drop-shadow-sm">₹{job.estimatedPrice || 120}</span>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Est. Payout</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center mt-1">
                    <div className="w-3 h-3 bg-slate-900 rounded-full border-2 border-white ring-1 ring-slate-900"></div>
                    <div className="w-0.5 h-12 bg-slate-300 my-1"></div>
                    <div className="w-3 h-3 bg-red-500 rounded-sm border-2 border-white ring-1 ring-red-500"></div>
                  </div>
                  <div className="flex-1 flex flex-col gap-6">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Pickup</p>
                      <p className="font-bold text-sm leading-tight text-slate-800 line-clamp-2">{job.pickupLocation?.address}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{isHubDrop ? 'Drop-off (Hub)' : 'Drop-off'}</p>
                      <p className="font-bold text-sm leading-tight text-slate-800 line-clamp-2">{isHubDrop ? (job.metadata?.sourceHub?.name || job.metadata?.sourceHub?.city || 'Nearest ZyperGo Hub') : job.dropLocation?.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setAvailableJobs(availableJobs.slice(1))} className="w-16 h-14 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl flex items-center justify-center font-bold transition-colors">
                  Skip
                </button>
                <button 
                  onClick={() => acceptJob(job)} 
                  disabled={loading} 
                  className="flex-1 h-14 bg-black text-[#FFB703] font-black uppercase tracking-widest text-lg rounded-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {loading ? 'Accepting...' : 'ACCEPT MISSION'}
                </button>
              </div>
            </div>
          );
        })()}
      </main>
    </div>
  );
}
