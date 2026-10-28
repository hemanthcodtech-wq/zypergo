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
  X
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api';
import { getImageUrl } from '../../utils/imageUrl';

export default function RiderHistory({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isPrefix = location.pathname.startsWith('/rider');
  const base = isPrefix ? '/rider' : '';

  const [activeTab, setActiveTab] = useState('all'); // 'all', 'ongoing', 'completed'
  const [searchQuery, setSearchQuery] = useState('');
  const getResolvedPhoto = () => {
    const userId = user?.id || user?._id || user?.phone;
    let photo = user?.photoUrl || user?.riderDetails?.documents?.profileImageUrl;
    if (!photo && userId) {
      photo = localStorage.getItem('zypergo_profile_photo_' + userId);
    }
    if (!photo) {
      const stored = localStorage.getItem('zypergo_user');
      if (stored) {
        try {
          const u = JSON.parse(stored);
          const uId = u.id || u._id || u.phone;
          photo = u.photoUrl || u.riderDetails?.documents?.profileImageUrl || (uId ? localStorage.getItem('zypergo_profile_photo_' + uId) : null);
        } catch (e) {}
      }
    }
    return photo;
  };

  const [profilePhoto, setProfilePhoto] = useState(getResolvedPhoto());
  const [photoError, setPhotoError] = useState(false);

  useEffect(() => {
    setProfilePhoto(getResolvedPhoto());
    setPhotoError(false);
  }, [user]);
  const [loading, setLoading] = useState(true);
  const [allRides, setAllRides] = useState([]);
  const [ongoingRides, setOngoingRides] = useState([]);
  const [completedRides, setCompletedRides] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);

  const fetchRiderHistory = async () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem('zypergo_user');
      const u = stored ? JSON.parse(stored) : user;
      const userId = u?.id || u?._id;

      if (userId) {
        const res = await api.get(`/rider/history?userId=${userId}`);
        if (res.data?.success) {
          const rawData = res.data.data || [];
          const rawOngoing = res.data.ongoing || [];
          const rawCompleted = res.data.completed || [];

          if (rawData.length > 0) {
            setAllRides(rawData);
            setOngoingRides(rawOngoing);
            setCompletedRides(rawCompleted);
            setLoading(false);
            return;
          }
        }
      }
    } catch (err) {
      console.warn('API history fetch notice, loading initial sample history:', err);
    }

    // Default rich sample history for demonstration
    const sampleHistory = [
      {
        _id: 'zypr_101',
        trackingId: 'ZYP-98421-HYD',
        status: 'In Transit',
        pickupLocation: {
          address: 'Plot 42, Hitec City Main Rd, Madhapur, Hyderabad',
          contactPerson: 'Suresh Verma',
          contactNumber: '+91 98480 12345'
        },
        dropLocation: {
          address: 'Flat 304, Green Heights, Banjara Hills Rd 12, Hyderabad',
          contactPerson: 'Priya Sharma',
          contactNumber: '+91 98765 43210'
        },
        metadata: { vehicleType: 'Bike', distanceKm: 8.4 },
        pricing: { total: 450 },
        earnings: 120,
        createdAt: new Date().toISOString(),
        paymentMode: 'Online Paid',
        isOngoing: true
      },
      {
        _id: 'zypr_102',
        trackingId: 'ZYP-87114-KUK',
        status: 'Delivered',
        pickupLocation: {
          address: 'Kukatpally Logistics Hub, Industrial Area, Hyderabad',
          contactPerson: 'Hub Dispatcher',
          contactNumber: '+91 80088 11223'
        },
        dropLocation: {
          address: 'Shop 14, Forum Mall Rd, KPHB Colony, Hyderabad',
          contactPerson: 'Kalyan Kumar',
          contactNumber: '+91 91234 56789'
        },
        metadata: { vehicleType: 'Scooter', distanceKm: 5.2 },
        pricing: { total: 320 },
        earnings: 95,
        deliveredAt: 'Today, 2:30 PM',
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        paymentMode: 'Online Paid',
        isOngoing: false
      },
      {
        _id: 'zypr_103',
        trackingId: 'ZYP-76509-SEC',
        status: 'Delivered',
        pickupLocation: {
          address: 'Secunderabad Station Parcel Depot, Hyderabad',
          contactPerson: 'Hub Coordinator',
          contactNumber: '+91 93456 78901'
        },
        dropLocation: {
          address: 'Office 402, Begumpet Tech Park, Hyderabad',
          contactPerson: 'Anand Rao',
          contactNumber: '+91 99887 76655'
        },
        metadata: { vehicleType: 'Scooter', distanceKm: 11.5 },
        pricing: { total: 580 },
        earnings: 150,
        deliveredAt: 'Yesterday, 5:15 PM',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        paymentMode: 'Cash on Delivery (COD)',
        isOngoing: false
      },
      {
        _id: 'zypr_104',
        trackingId: 'ZYP-65230-JBL',
        status: 'Delivered',
        pickupLocation: {
          address: 'Rd 36, Jubilee Hills, Hyderabad',
          contactPerson: 'Arun Reddy',
          contactNumber: '+91 98490 22334'
        },
        dropLocation: {
          address: 'Gachibowli Financial District, Hyderabad',
          contactPerson: 'Megha Patel',
          contactNumber: '+91 97000 11223'
        },
        metadata: { vehicleType: 'Bike', distanceKm: 9.8 },
        pricing: { total: 490 },
        earnings: 135,
        deliveredAt: '25 Oct, 3:45 PM',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        paymentMode: 'Online Paid',
        isOngoing: false
      }
    ];

    setAllRides(sampleHistory);
    setOngoingRides(sampleHistory.filter(r => r.isOngoing || ['In Transit', 'Rider Assigned', 'Picked Up'].includes(r.status)));
    setCompletedRides(sampleHistory.filter(r => !r.isOngoing && r.status === 'Delivered'));
    setLoading(false);
  };

  useEffect(() => {
    fetchRiderHistory();
  }, []);

  const getFilteredRides = () => {
    let list = allRides;
    if (activeTab === 'ongoing') {
      list = ongoingRides;
    } else if (activeTab === 'completed') {
      list = completedRides;
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
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate(`${base}/dashboard`)} 
            className="p-1 -ml-1 text-slate-700 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
          >
            <ChevronLeft size={22} />
          </button>
          <div>
            <h1 className="text-base font-black text-slate-900 leading-tight">Ride History</h1>
            <p className="text-[10px] font-bold text-slate-400">ONGOING & COMPLETED MISSIONS</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchRiderHistory}
            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer border border-slate-200"
            title="Refresh History"
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
        
        {/* KPI Summary Row */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Active Trips</p>
              <h3 className="text-base font-black text-slate-900">{ongoingRides.length} In Progress</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Completed</p>
              <h3 className="text-base font-black text-emerald-600">{completedRides.length} Delivered</h3>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, Area, or Status..."
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

        {/* Filter Navigation Tabs */}
        <div className="flex bg-slate-200/70 p-1 rounded-2xl gap-1">
          <button 
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
              activeTab === 'all' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All ({allRides.length})
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('ongoing')}
            className={`flex-1 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
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
            className={`flex-1 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
              activeTab === 'completed' 
                ? 'bg-white text-emerald-800 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Completed ({completedRides.length})
          </button>
        </div>

        {/* Rides List */}
        <div className="space-y-3">
          {filteredRides.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xs text-center space-y-3">
              <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto">
                <Clock size={26} />
              </div>
              <h3 className="text-base font-black text-slate-900">No Rides Found</h3>
              <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
                {activeTab === 'ongoing' 
                  ? 'You currently have no active deliveries in progress.' 
                  : (activeTab === 'completed' 
                      ? 'No completed delivery rides recorded yet.' 
                      : 'No ride history matches your search.')}
              </p>
              <button 
                type="button"
                onClick={() => window.history.length > 1 ? navigate(-1) : navigate(`${base}/dashboard`)}
                className="mt-2 py-2 px-4 bg-[#FFB703] hover:bg-[#e5a400] text-slate-950 font-black text-xs rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Go to Active Dashboard</span>
                <ArrowRight size={13} />
              </button>
            </div>
          ) : (
            filteredRides.map((ride) => {
              const isOngoing = ride.isOngoing || ['In Transit', 'Rider Assigned', 'Picked Up', 'Out for Delivery'].includes(ride.status);
              const payout = ride.earnings || Math.floor((ride.pricing?.total || 400) * 0.25);

              return (
                <div 
                  key={ride._id || ride.trackingId}
                  className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3 hover:border-slate-200 transition-colors"
                >
                  {/* Card Header: Tracking ID + Status Pill */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400">WAYBILL:</span>
                      <span className="font-mono text-xs font-black text-slate-900">{ride.trackingId}</span>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      isOngoing 
                        ? 'bg-amber-50 text-amber-800 border-amber-200' 
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {isOngoing && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />}
                      <span>{ride.status}</span>
                    </span>
                  </div>

                  {/* Route Timeline */}
                  <div className="space-y-2 text-xs">
                    {/* Pickup */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-blue-100 text-[#0052CC] flex items-center justify-center shrink-0 mt-0.5 font-black text-[9px]">
                        A
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Pickup</p>
                        <p className="font-bold text-slate-800 text-[11px] truncate">
                          {ride.pickupLocation?.address || 'Pickup Hub / Door'}
                        </p>
                      </div>
                    </div>

                    {/* Drop */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 font-black text-[9px]">
                        B
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Drop Destination</p>
                        <p className="font-bold text-slate-800 text-[11px] truncate">
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
                      <span>{ride.metadata?.distanceKm || '6.5'} km</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Rider Payout</span>
                      <span className="text-xs font-black text-emerald-600">
                        +₹{payout}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-1">
                    {isOngoing ? (
                      <button 
                        type="button"
                        onClick={() => window.history.length > 1 ? navigate(-1) : navigate(`${base}/dashboard`)}
                        className="w-full py-2 bg-[#FFB703] hover:bg-[#e5a400] text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Navigation size={13} />
                        <span>Resume Live Mission</span>
                        <ArrowRight size={13} />
                      </button>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => setSelectedRide(ride)}
                        className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
                      >
                        <Eye size={13} />
                        <span>View Trip Summary</span>
                      </button>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Ride Details Modal */}
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
                <h3 className="text-sm font-black text-slate-900">Trip Waybill Details</h3>
                <p className="font-mono text-xs font-bold text-[#0052CC]">{selectedRide.trackingId}</p>
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
                    +₹{selectedRide.earnings || Math.floor((selectedRide.pricing?.total || 400) * 0.25)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-emerald-800 uppercase">Status</p>
                  <span className="font-black text-xs text-emerald-700">Delivered & Settled</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase">Pickup Location</span>
                <p className="font-bold text-slate-800 mt-0.5">{selectedRide.pickupLocation?.address}</p>
                {selectedRide.pickupLocation?.contactNumber && (
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">Contact: {selectedRide.pickupLocation.contactNumber}</p>
                )}
              </div>

              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase">Delivery Location</span>
                <p className="font-bold text-slate-800 mt-0.5">{selectedRide.dropLocation?.address}</p>
                {selectedRide.dropLocation?.contactNumber && (
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">Recipient: {selectedRide.dropLocation.contactNumber}</p>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Vehicle Type:</span>
                  <span className="font-bold text-slate-800">{selectedRide.metadata?.vehicleType || 'Bike'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Trip Distance:</span>
                  <span className="font-bold text-slate-800">{selectedRide.metadata?.distanceKm || '6.5'} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Mode:</span>
                  <span className="font-bold text-slate-800">{selectedRide.paymentMode || 'Online Paid'}</span>
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
