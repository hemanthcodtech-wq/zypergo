import React, { useState, useEffect, useRef } from 'react';
import { Truck, Navigation, CheckCircle2, MapPin, Package, AlertTriangle, Bell, Settings, Phone, Camera, ArrowRight, ShieldCheck, Clock, LayoutDashboard, Wallet, User as UserIcon, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import RiderTaskFlow from './RiderTaskFlow';
import RiderHeader from './RiderHeader';
import { reverseGeocode } from '../../utils/locationService';

export default function RiderDashboard({ user, onLogout }) {
  const [availableJobs, setAvailableJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [riderDetails, setRiderDetails] = useState({
    isOnline: user?.riderDetails?.isOnline || false,
    isOnBreak: user?.riderDetails?.isOnBreak || false,
    isOnShift: user?.riderDetails?.isOnShift || false
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.riderDetails) {
      setRiderDetails({
        isOnline: user.riderDetails.isOnline || false,
        isOnBreak: user.riderDetails.isOnBreak || false,
        isOnShift: user.riderDetails.isOnShift || false
      });
    }
  }, [user]);

  // Location State
  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentAddress, setCurrentAddress] = useState('');
  const watchIdRef = useRef(null);

  // Form State
  const [otp, setOtp] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [helperActionNotice, setHelperActionNotice] = useState('');
  const [completedHelperTasks, setCompletedHelperTasks] = useState({});

  // Rapido-Style Buzzer Sound & Vibration Refs
  const buzzerAudioRef = useRef(null);
  const vibrationIntervalRef = useRef(null);
  const availableJobsRef = useRef(availableJobs);
  const activeJobRef = useRef(activeJob);

  useEffect(() => {
    availableJobsRef.current = availableJobs;
    activeJobRef.current = activeJob;
  }, [availableJobs, activeJob]);

  const stopBuzzer = () => {
    if (buzzerAudioRef.current) {
      buzzerAudioRef.current.pause();
      buzzerAudioRef.current.currentTime = 0;
    }
    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current);
      vibrationIntervalRef.current = null;
    }
    if ('vibrate' in navigator) {
      try { navigator.vibrate(0); } catch (e) {}
    }
  };

  useEffect(() => {
    try {
      const audio = new Audio('/sounds/order_buzzer.wav');
      audio.loop = true;
      audio.preload = 'auto';
      audio.onended = () => {
        if (buzzerAudioRef.current && availableJobsRef.current?.length > 0 && !activeJobRef.current) {
          buzzerAudioRef.current.currentTime = 0;
          buzzerAudioRef.current.play().catch(() => {});
        }
      };
      buzzerAudioRef.current = audio;
    } catch (e) {
      console.warn('[Buzzer] Audio initialization notice:', e);
    }

    return () => {
      stopBuzzer();
      buzzerAudioRef.current = null;
    };
  }, []);

  const isHelper = user?.riderDetails?.partnerMode === 'Helper';
  const helperWorkType = user?.riderDetails?.helperWorkType || 'Load & Unload';
  const assignedCaptain = user?.riderDetails?.assignedCaptain;
  const captainDisplayName = assignedCaptain?.name || user?.riderDetails?.captainName || '';
  const captainDisplayPhone = assignedCaptain?.phone || user?.riderDetails?.captainPhone || '';

  // Fetch Jobs
  const fetchJobs = async () => {
    try {
      // 1. Fetch Active/My Jobs from generic endpoint
      const resAll = await api.get('/admin/bookings');
      if (resAll.data.success) {
        const allBookings = resAll.data.data || [];
        const currentRiderId = String(user?._id || user?.id || '');
        const active = allBookings.filter(b => {
          if (!['Rider Assigned', 'Rider On the Way', 'Arrived at Pickup', 'Picked Up', 'In Transit', 'Out for Delivery'].includes(b.status)) {
            return false;
          }
          if (!currentRiderId) return false;
          const inAssignedList = Array.isArray(b.assignedRiders) && b.assignedRiders.some(r => String(r.riderId || r._id || r) === currentRiderId);
          const isDirectRider = String(b.riderId || b.assignedRider || '') === currentRiderId;
          return inAssignedList || isDirectRider;
        });
        setMyJobs(active);
        
        if (active.length > 0) {
          setActiveJob(active[0]);
        } else {
          setActiveJob(null);
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

            // Reverse geocode with Google Maps Platform
            let resolvedAddress = '';
            try {
              const loc = await reverseGeocode(latitude, longitude);
              if (loc?.area || loc?.city) {
                resolvedAddress = loc.area ? `${loc.area}, ${loc.city}` : loc.city;
                setCurrentAddress(resolvedAddress);
              }
            } catch (e) {
              // Ignore geocode errors
            }

            // Push to backend
            if (user?._id) {
               try {
                 await api.post('/rider/location', { userId: user._id, lat: latitude, lng: longitude, address: resolvedAddress });
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

    if (riderDetails.isOnline && !riderDetails.isOnBreak) {
      startTracking();
    } else {
      stopTracking();
      // Also clear available jobs if offline or on break
      setAvailableJobs([]);
    }

    return () => {
      clearInterval(interval);
      stopTracking();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [riderDetails.isOnline, riderDetails.isOnBreak]);

  // Trigger Rapido-Style Buzzer Sound & Vibration on New Order (Continuous Loop until Accept/Reject)
  useEffect(() => {
    if (availableJobs.length > 0 && riderDetails.isOnline && !activeJob) {
      if (buzzerAudioRef.current) {
        buzzerAudioRef.current.loop = true;
        buzzerAudioRef.current.play().catch(e => {
          console.log('[Buzzer] Waiting for user gesture:', e);
        });
      }
      if ('vibrate' in navigator) {
        try { navigator.vibrate([1000, 500, 1000, 500]); } catch (e) {}
        if (!vibrationIntervalRef.current) {
          vibrationIntervalRef.current = setInterval(() => {
            if ('vibrate' in navigator && availableJobsRef.current?.length > 0 && !activeJobRef.current) {
              try { navigator.vibrate([1000, 500, 1000, 500]); } catch (e) {}
            }
          }, 3000);
        }
      }
    } else {
      stopBuzzer();
    }
  }, [availableJobs.length, riderDetails.isOnline, !!activeJob]);

  // Sync Native Device FCM Token with Server
  useEffect(() => {
    const handleRegisterToken = async (token) => {
      if (!token) return;
      const uid = user?._id || user?.id;
      if (uid) {
        try {
          await api.post('/rider/fcm-token', { userId: uid, fcmToken: token });
          console.log('[FCM] Captain registered FCM token with server.');
        } catch (e) {
          console.warn('[FCM] Token sync error:', e?.message);
        }
      }
    };

    window.__onNativeFcmToken = handleRegisterToken;

    const handleNativeMessage = (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.type === 'FCM_TOKEN' && data?.token) {
          handleRegisterToken(data.token);
        }
      } catch (e) {}
    };

    window.addEventListener('message', handleNativeMessage);
    document.addEventListener('message', handleNativeMessage);

    if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'GET_FCM_TOKEN' }));
    }

    return () => {
      window.removeEventListener('message', handleNativeMessage);
      document.removeEventListener('message', handleNativeMessage);
      delete window.__onNativeFcmToken;
    };
  }, [user?._id]);

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

  const rejectJob = (job) => {
    stopBuzzer();
    const userId = user?.id || user?._id || user?.phone;
    if (userId && job) {
      try {
        const key = 'zypergo_rejected_orders_' + userId;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        if (!existing.some(j => j._id === job._id)) {
          existing.unshift({
            ...job,
            rejectedAt: new Date().toISOString(),
            status: 'Rejected'
          });
          localStorage.setItem(key, JSON.stringify(existing.slice(0, 50)));
        }
      } catch (e) {}
    }
    setAvailableJobs(prev => prev.filter(j => j._id !== job._id));
    navigate('/rider/history', { state: { activeTab: 'rejected' } });
  };

  const acceptJob = async (job) => {
    stopBuzzer();
    if (job.status === 'Relay Handoff Pending' || job.status === 'Transhipment Pending') {
      const enteredOtp = window.prompt("Enter the 4-digit Handover OTP from the other Rider:");
      if (!enteredOtp) return;
      
      setLoading(true);
      try {
        const res = await api.post(`/rider/jobs/${job._id}/accept-handover`, { newRiderId: user?._id, otp: enteredOtp });
        if (res.data.success) {
          fetchJobs();
          navigate('/rider/history', { state: { activeTab: 'ongoing' } });
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
        navigate('/rider/history', { state: { activeTab: 'ongoing' } });
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

  const handleHelperConfirmAction = async (job, actionLabel) => {
    setCompletedHelperTasks((prev) => ({
      ...prev,
      [`${job._id}_${actionLabel}`]: true
    }));
    setHelperActionNotice(`${actionLabel} marked complete for #${job.trackingId || job._id?.slice(-6).toUpperCase()}`);
    setTimeout(() => setHelperActionNotice(''), 3500);
  };

  if (isHelper) {
    const canLoad = helperWorkType === 'Load Only' || helperWorkType === 'Load & Unload';
    const canUnload = helperWorkType === 'Unload Only' || helperWorkType === 'Load & Unload';
    const helperQueue = [...myJobs, ...availableJobs].filter(
      (job, idx, arr) => arr.findIndex((x) => x._id === job._id) === idx
    );

    return (
      <div className="min-h-screen bg-[#F4F9F9] font-sans flex flex-col text-slate-900 pb-24">
        <RiderHeader
          user={user}
          onLogout={onLogout}
          onShowEarnings={() => {}}
          onStatusChange={(status) => {
            setRiderDetails((prev) => ({ ...prev, ...status }));
            fetchJobs();
          }}
        />

        {isOffline && (
          <div className="bg-red-600 text-white text-center py-2 text-sm font-bold flex items-center justify-center gap-2 z-50">
            <AlertTriangle size={16} /> No Internet Connection. Check your network.
          </div>
        )}

        <main className="flex-1 w-full max-w-md mx-auto px-4 pt-4 space-y-4">
          {/* Helper Mode Banner Card */}
          <div className="bg-gradient-to-br from-[#006D77] to-[#004E56] rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider mb-2">
                  Helper Panel
                </span>
                <h2 className="text-xl font-black leading-tight capitalize">{user?.name || 'ZyperGo Helper'}</h2>
                <p className="text-xs text-teal-100 font-semibold mt-1">
                  Work Scope: <span className="text-amber-300 font-black">{helperWorkType}</span>
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                <Package size={22} className="text-amber-300" />
              </div>
            </div>

            {(captainDisplayName || captainDisplayPhone) && (
              <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-teal-200 font-bold">Assigned Captain</p>
                  <p className="font-black text-white">{captainDisplayName || 'Captain'} {captainDisplayPhone ? `· ${captainDisplayPhone}` : ''}</p>
                </div>
                {captainDisplayPhone && (
                  <a
                    href={`tel:${captainDisplayPhone}`}
                    className="px-3 py-1.5 rounded-xl bg-white text-[#006D77] font-black text-[11px] flex items-center gap-1 shadow-xs"
                  >
                    <Phone size={12} /> Call
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Work Scope Summary Pills */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className={`p-3.5 rounded-2xl border ${canLoad ? 'bg-white border-teal-200 shadow-xs' : 'bg-slate-100/70 border-slate-200 opacity-55'}`}>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Loading Work</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{canLoad ? 'Active' : 'Not Assigned'}</p>
            </div>
            <div className={`p-3.5 rounded-2xl border ${canUnload ? 'bg-white border-teal-200 shadow-xs' : 'bg-slate-100/70 border-slate-200 opacity-55'}`}>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Unloading Work</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{canUnload ? 'Active' : 'Not Assigned'}</p>
            </div>
          </div>

          {helperActionNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              <span>{helperActionNotice}</span>
            </div>
          )}

          {/* Loading & Unloading Assignment Queue */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                {helperWorkType} Queue
              </h3>
              <span className="text-[10px] font-bold text-slate-500">
                {riderDetails.isOnline && !riderDetails.isOnBreak ? `${helperQueue.length} active parcel(s)` : 'Go Online to receive tasks'}
              </span>
            </div>

            {(!riderDetails.isOnline || riderDetails.isOnBreak) ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
                <Clock size={24} className="mx-auto text-slate-400 mb-2" />
                <h4 className="text-sm font-black text-slate-800">
                  {riderDetails.isOnBreak ? 'On Break' : 'Helper Shift Offline'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Tap &ldquo;Go Online&rdquo; above to view and confirm {helperWorkType.toLowerCase()} tasks.
                </p>
              </div>
            ) : helperQueue.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-teal-200 p-6 text-center">
                <Package size={26} className="mx-auto text-[#006D77] mb-2" />
                <h4 className="text-sm font-black text-slate-800">Ready for {helperWorkType}</h4>
                <p className="text-xs text-slate-500 mt-1">
                  New parcels assigned for {helperWorkType.toLowerCase()} will appear here automatically.
                </p>
              </div>
            ) : (
              helperQueue.map((job) => (
                <div key={job._id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-teal-50 text-[#006D77] border border-teal-200">
                      {job.status}
                    </span>
                    <span className="text-[11px] font-black text-slate-500">
                      #{job.trackingId || job._id?.slice(-6).toUpperCase()}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <p className="font-bold text-slate-800 line-clamp-1">
                      <span className="text-slate-400">Load Pickup:</span> {job.pickupLocation?.address || 'Hub / Sender'}
                    </p>
                    <p className="font-bold text-slate-800 line-clamp-1">
                      <span className="text-slate-400">Unload Drop:</span> {job.dropLocation?.address || 'Drop Destination'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {canLoad && (
                      <button
                        type="button"
                        onClick={() => handleHelperConfirmAction(job, 'Loading')}
                        disabled={!!completedHelperTasks[`${job._id}_Loading`]}
                        className="flex-1 py-2.5 rounded-xl bg-[#006D77] hover:bg-[#00555d] text-white font-black text-xs disabled:opacity-50 cursor-pointer transition-colors"
                      >
                        {completedHelperTasks[`${job._id}_Loading`] ? '✓ Loaded' : 'Confirm Load'}
                      </button>
                    )}
                    {canUnload && (
                      <button
                        type="button"
                        onClick={() => handleHelperConfirmAction(job, 'Unloading')}
                        disabled={!!completedHelperTasks[`${job._id}_Unloading`]}
                        className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs disabled:opacity-50 cursor-pointer transition-colors"
                      >
                        {completedHelperTasks[`${job._id}_Unloading`] ? '✓ Unloaded' : 'Confirm Unload'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col text-slate-900">
      <RiderHeader 
        user={user} 
        onLogout={onLogout} 
        onShowEarnings={() => {}} 
        onStatusChange={(status) => {
          setRiderDetails(prev => ({ ...prev, ...status }));
          fetchJobs();
        }} 
      />
      
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
                {(!riderDetails.isOnline || riderDetails.isOnBreak) ? (
                    // Offline / On Break State
                    <div className="bg-white/85 backdrop-blur-xl p-6 rounded-3xl border border-white/60 max-w-sm w-full shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                       <div className="w-14 h-14 bg-slate-100 rounded-full mx-auto mb-3 flex items-center justify-center border border-slate-200 shadow-inner">
                         <Clock size={24} className={riderDetails.isOnBreak ? "text-amber-500" : "text-slate-400"} />
                       </div>
                       <h2 className="text-lg font-black uppercase tracking-wide text-slate-800 mb-1">
                         {riderDetails.isOnBreak ? 'You are on Break' : 'You are Offline'}
                       </h2>
                       <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
                         {riderDetails.isOnBreak 
                           ? 'Tap "End Break" above when you are ready to receive delivery missions.' 
                           : 'To start receiving delivery missions, tap "Go Online" above.'}
                       </p>
                       
                       {!riderDetails.isOnBreak && (
                         <button 
                           onClick={() => {
                             if ('geolocation' in navigator) {
                               navigator.geolocation.getCurrentPosition(
                                 (pos) => alert("Location access granted! You can now tap 'Go Online' above."),
                                 (err) => alert("Please allow location access in your browser settings to continue.")
                               );
                             } else {
                               alert("Geolocation is not supported by your browser.");
                             }
                           }}
                           className="w-full mt-4 bg-[#FFB703] hover:bg-[#e5a400] text-slate-900 font-black text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-[0.98]"
                         >
                           Grant Location Access
                         </button>
                       )}
                     </div>
                 ) : (
                   // Online / Radar State
                    <div className="flex flex-col items-center relative py-6">
                      {/* Pulsing Radar Rings in Yellow */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border-2 border-[#FFB703] rounded-full animate-ping opacity-25"></div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 border-2 border-[#FFB703] rounded-full animate-ping opacity-45" style={{ animationDelay: '400ms' }}></div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 border-[#FFB703] rounded-full animate-ping opacity-65" style={{ animationDelay: '800ms' }}></div>
                      
                      <div className="w-24 h-24 bg-white/90 backdrop-blur-md rounded-full mx-auto mb-6 flex items-center justify-center relative z-10 shadow-[0_0_35px_rgba(255,183,3,0.45)] border-4 border-[#FFB703]">
                        <div className="w-16 h-16 bg-[#FFB703] rounded-full flex items-center justify-center shadow-inner">
                          <Activity size={32} className="text-slate-950 animate-pulse" />
                        </div>
                      </div>
                      
                      <h2 className="text-2xl font-black uppercase tracking-widest text-slate-900 mb-2 drop-shadow-sm">Searching for Orders...</h2>
                      <p className="text-xs text-amber-900 font-black tracking-wider uppercase bg-amber-100/90 backdrop-blur-xl px-4 py-2 rounded-full border border-amber-300 shadow-xs">
                        Radar Active • Searching nearby trips
                      </p>
                      
                      {currentLocation && (
                        <p className="text-[10px] text-slate-500 mt-4 font-mono bg-white/70 backdrop-blur-md border border-slate-200 px-3 py-1 rounded-full shadow-2xs">
                          GPS: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                        </p>
                      )}
                    </div>
                )}
             </div>
           )}

        </div>

        {(!activeJob && availableJobs.length > 0 && riderDetails.isOnline && !riderDetails.isOnBreak) && (() => {
          const job = availableJobs[0];
          const pickupParts = (job.pickupLocation?.address || '').toLowerCase().split(',').map(s => s.trim());
          const dropParts = (job.dropLocation?.address || '').toLowerCase().split(',').map(s => s.trim());
          const ignoreList = ['india', 'andhra pradesh', 'telangana', 'karnataka', 'tamil nadu', 'maharashtra'];
          const commonLocalities = pickupParts.filter(part => dropParts.includes(part) && part.length > 3 && isNaN(part) && !ignoreList.includes(part));
          const isSameRegion = (job.pickupLocation?.pincode && job.dropLocation?.pincode && job.pickupLocation?.pincode === job.dropLocation?.pincode) || commonLocalities.length > 0;
          const isDirectDedicated = job.deliveryMode === 'DIRECT_DEDICATED';
          const isHubDrop = !isDirectDedicated && job.metadata?.deliveryType === 'Intercity Hub-and-Spoke' && !isSameRegion;

          return (
            <div className="fixed bottom-[70px] md:bottom-0 left-0 right-0 z-40 bg-white text-slate-900 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.3)] border-t border-slate-200 p-6 pb-6 md:pb-10 max-w-lg mx-auto animate-in slide-in-from-bottom duration-300 ease-out">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="bg-[#FFB703] text-black px-2.5 py-0.5 rounded-md text-[10px] font-black tracking-widest uppercase shadow-sm animate-pulse">
                      New Mission
                    </span>
                    {isDirectDedicated && (
                      <span className="bg-blue-600 text-white px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase">
                        🚚 Direct Highway
                      </span>
                    )}
                    {job.helpers?.needed && (
                      <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase">
                        🛠️ {job.helpers.count} Helper(s)
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-black mt-2 tracking-tight">
                    {job.metadata?.vehicleType || 'Cargo'} Mission
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-slate-900 drop-shadow-sm">₹{job.pricing?.total || job.estimatedPrice || 120}</span>
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
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">
                        {isDirectDedicated ? 'Direct Destination Drop (No Hubs)' : (isHubDrop ? 'Drop-off (Hub)' : 'Drop-off')}
                      </p>
                      <p className="font-bold text-sm leading-tight text-slate-800 line-clamp-2">{isHubDrop ? (job.metadata?.sourceHub?.name || job.metadata?.sourceHub?.city || 'Nearest ZyperGo Hub') : job.dropLocation?.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => rejectJob(job)} 
                  className="w-1/3 h-14 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-black uppercase tracking-wider text-sm rounded-2xl flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs"
                >
                  REJECT
                </button>
                <button 
                  onClick={() => acceptJob(job)} 
                  disabled={loading} 
                  className="flex-1 h-14 bg-black text-[#FFB703] font-black uppercase tracking-wider text-base rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2 cursor-pointer border border-[#FFB703]/30"
                >
                  {loading ? 'ACCEPTING...' : 'ACCEPT MISSION'}
                </button>
              </div>
            </div>
          );
        })()}
      </main>
    </div>
  );
}
