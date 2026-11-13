import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  MapPin, 
  Truck, 
  CheckCircle2, 
  ChevronLeft, 
  Search, 
  ArrowRight, 
  Navigation, 
  Phone, 
  Calendar, 
  FileText, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Eye,
  X,
  XCircle,
  KeyRound,
  Loader2,
  PackageCheck
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api';
import { getImageUrl } from '../../utils/imageUrl';

export default function RiderHistory({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isPrefix = location.pathname.startsWith('/rider');
  const base = isPrefix ? '/rider' : '';

  // Accept active tab from navigation state (e.g. from Dashboard accept/reject)
  const initialTab = location.state?.activeTab || 'all';
  const [activeTab, setActiveTab] = useState(initialTab); // 'all', 'ongoing', 'completed', 'rejected'
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [allRides, setAllRides] = useState([]);
  const [ongoingRides, setOngoingRides] = useState([]);
  const [completedRides, setCompletedRides] = useState([]);
  const [rejectedRides, setRejectedRides] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);

  // OTP State per ride
  const [otpInputs, setOtpInputs] = useState({});
  const [otpError, setOtpError] = useState('');
  const [actionSuccessNotice, setActionSuccessNotice] = useState('');

  const getResolvedPhoto = () => {
    const userId = user?.id || user?._id || user?.phone;
    let photo = user?.photoUrl || user?.riderDetails?.documents?.profileImageUrl;
    if (!photo && userId) {
      photo = localStorage.getItem('zypergo_profile_photo_' + userId);
    }
    return photo;
  };

  const [profilePhoto, setProfilePhoto] = useState(getResolvedPhoto());
  const [photoError, setPhotoError] = useState(false);

  useEffect(() => {
    setProfilePhoto(getResolvedPhoto());
  }, [user]);

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  const fetchRiderHistory = async () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem('zypergo_user');
      const u = stored ? JSON.parse(stored) : user;
      const userId = u?.id || u?._id;

      // 1. Fetch real database bookings for this rider
      if (userId) {
        const res = await api.get(`/rider/history?userId=${userId}`);
        if (res.data?.success) {
          const rawData = res.data.data || [];
          const rawOngoing = res.data.ongoing || [];
          const rawCompleted = res.data.completed || [];

          setAllRides(rawData);
          setOngoingRides(rawOngoing);
          setCompletedRides(rawCompleted);
        } else {
          setAllRides([]);
          setOngoingRides([]);
          setCompletedRides([]);
        }

        // 2. Load rejected orders from localStorage
        const rejectedKey = 'zypergo_rejected_orders_' + userId;
        const storedRejected = JSON.parse(localStorage.getItem(rejectedKey) || '[]');
        setRejectedRides(storedRejected);
      } else {
        setAllRides([]);
        setOngoingRides([]);
        setCompletedRides([]);
        setRejectedRides([]);
      }
    } catch (err) {
      console.warn('API history fetch notice:', err.message);
      setAllRides([]);
      setOngoingRides([]);
      setCompletedRides([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiderHistory();
  }, []);

  // 1. Start Ride to Pickup -> Open Google Maps & Update Status to Rider On the Way
  const handleStartRideToPickup = async (ride) => {
    const pickupAddr = ride.pickupLocation?.address || '';
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(pickupAddr)}`;

    setActionLoading(true);
    try {
      if (ride.status === 'Rider Assigned') {
        await api.post(`/rider/jobs/${ride._id}/update-status`, {
          status: 'Rider On the Way',
          reason: 'Rider started navigation to pickup location',
          userId: user?._id || user?.id
        });
        await fetchRiderHistory();
      }
      // Open Google Maps App navigation
      window.open(mapsUrl, '_system');
      setActionSuccessNotice('Opened Google Maps Navigation to Pickup!');
      setTimeout(() => setActionSuccessNotice(''), 3500);
    } catch (err) {
      // Still open Google Maps even if status ping times out
      window.open(mapsUrl, '_system');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Verify Pickup OTP from customer & update status to Picked Up
  const handleVerifyPickupOtp = async (ride) => {
    const enteredOtp = otpInputs[ride._id] || '';
    if (!enteredOtp || enteredOtp.trim().length < 4) {
      setOtpError('Please enter the 4-digit OTP provided by customer');
      setTimeout(() => setOtpError(''), 3500);
      return;
    }

    setActionLoading(true);
    setOtpError('');
    try {
      const res = await api.post(`/rider/jobs/${ride._id}/update-status`, {
        status: 'Picked Up',
        otp: enteredOtp.trim(),
        userId: user?._id || user?.id,
        reason: 'Parcel verified and picked up with customer OTP'
      });

      if (res.data?.success) {
        setOtpInputs(prev => ({ ...prev, [ride._id]: '' }));
        setActionSuccessNotice('Parcel Picked Up Successfully! Ready to navigate to drop location.');
        setTimeout(() => setActionSuccessNotice(''), 4000);
        await fetchRiderHistory();
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Invalid OTP. Please check with customer and try again.';
      setOtpError(errMsg);
      setTimeout(() => setOtpError(''), 4000);
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Start Ride to Drop Location -> Open Google Maps & Update Status to In Transit
  const handleStartRideToDrop = async (ride) => {
    const dropAddr = ride.dropLocation?.address || '';
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dropAddr)}`;

    setActionLoading(true);
    try {
      if (ride.status === 'Picked Up') {
        await api.post(`/rider/jobs/${ride._id}/update-status`, {
          status: 'In Transit',
          reason: 'Rider navigating to drop destination',
          userId: user?._id || user?.id
        });
        await fetchRiderHistory();
      }
      window.open(mapsUrl, '_system');
      setActionSuccessNotice('Opened Google Maps Navigation to Drop Location!');
      setTimeout(() => setActionSuccessNotice(''), 3500);
    } catch (err) {
      window.open(mapsUrl, '_system');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Complete Delivery
  const handleCompleteDelivery = async (ride) => {
    const confirm = window.confirm('Are you sure you want to mark this delivery as complete?');
    if (!confirm) return;

    setActionLoading(true);
    try {
      const res = await api.post(`/rider/jobs/${ride._id}/update-status`, {
        status: 'Delivered',
        userId: user?._id || user?.id,
        reason: 'Delivered to destination successfully'
      });

      if (res.data?.success) {
        setActionSuccessNotice('Delivery Completed! Payout credited to your wallet.');
        setTimeout(() => setActionSuccessNotice(''), 4000);
        await fetchRiderHistory();
        setActiveTab('completed');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to complete delivery');
    } finally {
      setActionLoading(false);
    }
  };

  const getFilteredRides = () => {
    let list = allRides;
    if (activeTab === 'ongoing') {
      list = ongoingRides;
    } else if (activeTab === 'completed') {
      list = completedRides;
    } else if (activeTab === 'rejected') {
      list = rejectedRides;
    }

    if (!searchQuery.trim()) return list;

    const query = searchQuery.toLowerCase();
    return list.filter(r => 
      (r.trackingId || '').toLowerCase().includes(query) ||
      (r.pickupLocation?.address || '').toLowerCase().includes(query) ||
      (r.dropLocation?.address || '').toLowerCase().includes(query) ||
      (r.status || '').toLowerCase().includes(query)
    );
  };

  const filteredRides = getFilteredRides();

  return (
    <div className="min-h-full bg-[#F8FAFC] pb-24 font-sans text-slate-900">
      
      {/* Top Header */}
      <div className="bg-white px-4 py-3 sticky top-0 z-20 shadow-xs border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button 
            type="button"
            onClick={() => {
              if (window.__handleAppBack) window.__handleAppBack();
              else if (window.history.length > 1) navigate(-1);
              else navigate(`${base}/dashboard`);
            }} 
            className="p-1 -ml-1 text-slate-700 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
          >
            <ChevronLeft size={22} />
          </button>
          <div>
            <h1 className="text-base font-black text-slate-900 leading-tight">Orders</h1>
            <p className="text-[10px] font-bold text-slate-400">ONGOING, COMPLETED &amp; REJECTED</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchRiderHistory}
            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer border border-slate-200"
            title="Refresh Orders"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-[#FFB703]' : ''} />
          </button>

          <button
            type="button"
            onClick={() => navigate(`${base}/profile`)}
            className="w-8 h-8 rounded-full overflow-hidden border-2 border-white ring-2 ring-amber-400 shadow-xs flex items-center justify-center bg-amber-100 hover:scale-105 transition-transform cursor-pointer"
            title="My Profile"
          >
            {profilePhoto && !photoError ? (
              <img src={getImageUrl(profilePhoto)} alt="Profile" className="w-full h-full object-cover" onError={() => setPhotoError(true)} />
            ) : (
              <span className="text-xs font-black text-amber-800 uppercase">{user?.name ? user.name.substring(0, 2) : 'RD'}</span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-3.5 space-y-3.5">
        
        {/* Success / Error Banners */}
        {actionSuccessNotice && (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-bold border border-emerald-200 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{actionSuccessNotice}</span>
          </div>
        )}

        {otpError && (
          <div className="p-3 bg-red-50 text-red-700 rounded-2xl text-xs font-bold border border-red-200 flex items-center gap-2 animate-in fade-in">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <span>{otpError}</span>
          </div>
        )}

        {/* KPI Summary Row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-2xl p-2.5 border border-slate-100 shadow-xs text-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase">Ongoing</p>
            <h3 className="text-sm font-black text-amber-600 mt-0.5">{ongoingRides.length} Active</h3>
          </div>

          <div className="bg-white rounded-2xl p-2.5 border border-slate-100 shadow-xs text-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase">Completed</p>
            <h3 className="text-sm font-black text-emerald-600 mt-0.5">{completedRides.length} Done</h3>
          </div>

          <div className="bg-white rounded-2xl p-2.5 border border-slate-100 shadow-xs text-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase">Rejected</p>
            <h3 className="text-sm font-black text-red-600 mt-0.5">{rejectedRides.length} Declined</h3>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Waybill, Location, or Status..."
            className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold outline-none focus:border-[#FFB703] transition-colors shadow-2xs"
          />
          {searchQuery && (
            <button 
              type="button" 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Horizontal Scrollable Filter Tabs */}
        <div className="overflow-x-auto no-scrollbar py-0.5">
          <div className="flex bg-slate-200/70 p-1 rounded-2xl gap-1 min-w-max">
            <button 
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'all' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Orders ({allRides.length})
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('ongoing')}
              className={`px-3.5 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'ongoing' 
                  ? 'bg-white text-amber-900 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {ongoingRides.length > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
              <span>Ongoing ({ongoingRides.length})</span>
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('completed')}
              className={`px-3.5 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'completed' 
                  ? 'bg-white text-emerald-800 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Completed ({completedRides.length})
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('rejected')}
              className={`px-3.5 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'rejected' 
                  ? 'bg-white text-red-700 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Rejected ({rejectedRides.length})
            </button>
          </div>
        </div>

        {/* Orders List (Real Data ONLY) */}
        <div className="space-y-3">
          {filteredRides.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xs text-center space-y-3">
              <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto">
                <Clock size={26} />
              </div>
              <h3 className="text-base font-black text-slate-900">
                {activeTab === 'rejected' ? 'No Rejected Orders' : 'No Orders Found'}
              </h3>
              <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
                {activeTab === 'ongoing' 
                  ? 'You currently have no active deliveries in progress.' 
                  : (activeTab === 'completed' 
                      ? 'No completed delivery rides recorded yet.' 
                      : (activeTab === 'rejected' 
                          ? 'No orders have been rejected by you.'
                          : 'No real orders match your current filter.'))}
              </p>
              <button 
                type="button"
                onClick={() => navigate(`${base}/dashboard`)}
                className="mt-2 py-2 px-4 bg-[#FFB703] hover:bg-[#e5a400] text-slate-950 font-black text-xs rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Go to Dashboard</span>
                <ArrowRight size={13} />
              </button>
            </div>
          ) : (
            filteredRides.map((ride) => {
              const isOngoing = ['Rider Assigned', 'Rider On the Way', 'Arrived at Pickup', 'Picked Up', 'In Transit', 'Out for Delivery'].includes(ride.status);
              const isRejected = activeTab === 'rejected' || ride.status === 'Rejected';
              const isDelivered = ride.status === 'Delivered';
              const payout = ride.pricing?.total || ride.earnings || 120;

              const isAtPickupStage = ['Rider Assigned', 'Rider On the Way', 'Arrived at Pickup'].includes(ride.status);
              const isAtDropStage = ['Picked Up', 'In Transit', 'Out for Delivery'].includes(ride.status);

              return (
                <div 
                  key={ride._id || ride.trackingId}
                  className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3 hover:border-slate-200 transition-colors"
                >
                  {/* Card Header: Tracking ID + Status Pill */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400">ORDER:</span>
                      <span className="font-mono text-xs font-black text-slate-900">
                        {ride.trackingId || '#' + (ride._id?.slice(-8).toUpperCase() || 'ZYP8821')}
                      </span>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      isRejected
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : isOngoing 
                          ? 'bg-amber-50 text-amber-800 border-amber-200' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {isOngoing && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />}
                      {isRejected && <XCircle size={10} />}
                      <span>{ride.status || 'Order'}</span>
                    </span>
                  </div>

                  {/* Route Timeline */}
                  <div className="space-y-2 text-xs">
                    {/* Pickup */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-blue-100 text-[#0052CC] flex items-center justify-center shrink-0 mt-0.5 font-black text-[10px]">
                        A
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Pickup Location</p>
                          {ride.pickupLocation?.phone && (
                            <a href={`tel:${ride.pickupLocation.phone}`} className="text-blue-600 font-bold text-[10px] flex items-center gap-0.5">
                              <Phone size={10} /> Call Sender
                            </a>
                          )}
                        </div>
                        <p className="font-bold text-slate-800 text-[11px] line-clamp-2 mt-0.5">
                          {ride.pickupLocation?.address || 'Pickup Point'}
                        </p>
                      </div>
                    </div>

                    {/* Drop */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 font-black text-[10px]">
                        B
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Drop Location</p>
                          {ride.dropLocation?.phone && (
                            <a href={`tel:${ride.dropLocation.phone}`} className="text-emerald-600 font-bold text-[10px] flex items-center gap-0.5">
                              <Phone size={10} /> Call Receiver
                            </a>
                          )}
                        </div>
                        <p className="font-bold text-slate-800 text-[11px] line-clamp-2 mt-0.5">
                          {ride.dropLocation?.address || 'Drop Address'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Trip Details Strip & Payout */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Truck size={10} />
                        <span>{ride.metadata?.vehicleType || 'Bike'}</span>
                      </span>
                      {ride.metadata?.distanceKm && <span>{ride.metadata.distanceKm} km</span>}
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Est. Payout</span>
                      <span className="text-xs font-black text-emerald-600">
                        ₹{payout}
                      </span>
                    </div>
                  </div>

                  {/* Ongoing Order Execution Workflow */}
                  {isOngoing && (
                    <div className="pt-2 border-t border-slate-100 space-y-2.5">
                      
                      {/* Step A: Start Ride to Pickup */}
                      {isAtPickupStage && (
                        <div className="space-y-2">
                          <button 
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleStartRideToPickup(ride)}
                            className="w-full py-2.5 bg-black hover:bg-slate-800 text-[#FFB703] font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer"
                          >
                            <Navigation size={14} className="text-[#FFB703]" />
                            <span>START RIDE TO PICKUP (GOOGLE MAPS)</span>
                            <ArrowRight size={14} />
                          </button>

                          {/* Pickup OTP Input Box */}
                          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase text-amber-900 flex items-center gap-1">
                                <KeyRound size={12} />
                                <span>Enter Customer Pickup OTP</span>
                              </span>
                              <span className="text-[10px] text-amber-700 font-bold">4 Digits</span>
                            </div>

                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                maxLength={4}
                                placeholder="e.g. 1234"
                                value={otpInputs[ride._id] || ''}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                  setOtpInputs(prev => ({ ...prev, [ride._id]: val }));
                                }}
                                className="w-32 px-3 py-2 bg-white border border-amber-300 rounded-lg text-center font-mono font-black text-sm tracking-widest outline-none focus:ring-2 focus:ring-amber-400"
                              />
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleVerifyPickupOtp(ride)}
                                className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60"
                              >
                                {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <PackageCheck size={14} />}
                                <span>VERIFY &amp; PICKUP</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Step B: Start Ride to Drop Location */}
                      {isAtDropStage && (
                        <div className="space-y-2">
                          <button 
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleStartRideToDrop(ride)}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer"
                          >
                            <Navigation size={14} />
                            <span>START RIDE TO DROP (GOOGLE MAPS)</span>
                            <ArrowRight size={14} />
                          </button>

                          <button 
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleCompleteDelivery(ride)}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer"
                          >
                            <CheckCircle2 size={14} />
                            <span>COMPLETE DELIVERY</span>
                          </button>
                        </div>
                      )}

                    </div>
                  )}

                  {/* Completed / Rejected Summary Button */}
                  {!isOngoing && (
                    <div className="pt-1">
                      <button 
                        type="button"
                        onClick={() => setSelectedRide(ride)}
                        className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
                      >
                        <Eye size={13} />
                        <span>View Order Details</span>
                      </button>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Order Details Modal */}
      {selectedRide && (
        <div 
          onClick={() => setSelectedRide(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-sm max-h-[85vh] overflow-y-auto p-5 shadow-2xl relative space-y-4 animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900">Order Details</h3>
                <p className="font-mono text-xs font-bold text-[#0052CC]">{selectedRide.trackingId || selectedRide._id}</p>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedRide(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-emerald-800 uppercase">Payout Earned</p>
                  <p className="text-base font-black text-emerald-700 mt-0.5">
                    ₹{selectedRide.pricing?.total || selectedRide.earnings || 120}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-emerald-800 uppercase">Status</p>
                  <span className="font-black text-xs text-emerald-700">{selectedRide.status}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase">Pickup Location</span>
                <p className="font-bold text-slate-800 mt-0.5">{selectedRide.pickupLocation?.address}</p>
              </div>

              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase">Delivery Location</span>
                <p className="font-bold text-slate-800 mt-0.5">{selectedRide.dropLocation?.address}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Vehicle Type:</span>
                  <span className="font-bold text-slate-800">{selectedRide.metadata?.vehicleType || 'Bike'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Delivery Mode:</span>
                  <span className="font-bold text-slate-800">{selectedRide.deliveryMode || 'DIRECT_DEDICATED'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment:</span>
                  <span className="font-bold text-slate-800">{selectedRide.paymentStatus || 'Paid Online'}</span>
                </div>
              </div>
            </div>

            <button 
              type="button" 
              onClick={() => setSelectedRide(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-black text-xs hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
