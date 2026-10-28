import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Package, 
  Search, 
  ChevronRight, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  PlusCircle, 
  MapPin, 
  Filter 
} from 'lucide-react';
import api from '../../api';

export default function BookingHistory() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'delivered', 'cancelled'
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const isCustomerPrefix = location.pathname.startsWith('/customer');
  const base = isCustomerPrefix ? '/customer' : '';

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await api.get('/bookings/my-shipments');
        if (res.data && res.data.success && Array.isArray(res.data.data)) {
          setBookings(res.data.data);
        } else {
          setBookings([]);
        }
      } catch (err) {
        console.error('Failed to fetch booking history', err);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const getStatusBadge = (status = '') => {
    const s = (status || '').toUpperCase();
    if (s.includes('DELIVERED')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-emerald-50 text-emerald-600 border border-emerald-200">
          <CheckCircle2 size={12} className="text-emerald-500" />
          Delivered
        </span>
      );
    }
    if (s.includes('CANCEL')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-red-50 text-red-600 border border-red-200">
          <XCircle size={12} className="text-red-500" />
          Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-blue-50 text-[#0052CC] border border-blue-200">
        <span className="w-1.5 h-1.5 rounded-full bg-[#0052CC]"></span>
        {status || 'In Progress'}
      </span>
    );
  };

  const filteredBookings = bookings.filter((b) => {
    const trackingId = b.trackingId || '';
    const origin = b.pickupLocation?.city || b.pickupLocation?.address || '';
    const destination = b.dropLocation?.city || b.dropLocation?.address || '';
    const term = searchTerm.toLowerCase();

    const matchesSearch = 
      trackingId.toLowerCase().includes(term) ||
      origin.toLowerCase().includes(term) ||
      destination.toLowerCase().includes(term);

    if (!matchesSearch) return false;

    const s = (b.status || '').toUpperCase();
    if (activeFilter === 'delivered') return s.includes('DELIVERED');
    if (activeFilter === 'cancelled') return s.includes('CANCEL');
    return true;
  });

  return (
    <div className="min-h-full bg-[#F8FAFC] pb-24 font-sans text-slate-900">
      
      {/* Top Header */}
      <div className="bg-white px-4 py-3 sticky top-0 z-20 shadow-xs border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate(`${base}/profile`)}
            className="p-1 -ml-1 text-slate-700 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-base font-black text-slate-900 leading-tight">Booking History</h1>
            <p className="text-[10px] font-bold text-slate-400">All past & completed deliveries</p>
          </div>
        </div>

        <button 
          type="button"
          onClick={() => navigate(`${base}/booking`)}
          className="bg-[#0052CC] hover:bg-[#0047cc] text-white px-3 py-1.5 rounded-xl text-xs font-black shadow-xs flex items-center gap-1 active:scale-95 transition-all"
        >
          <PlusCircle size={14} />
          <span>Book Now</span>
        </button>
      </div>

      <div className="max-w-md md:max-w-4xl mx-auto px-4 pt-4 space-y-4">
        
        {/* Search Bar */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by Tracking ID or City..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#0052CC] shadow-xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2">
          {[
            { id: 'all', label: `All (${bookings.length})` },
            { id: 'delivered', label: 'Delivered' },
            { id: 'cancelled', label: 'Cancelled' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all ${
                activeFilter === tab.id
                  ? 'bg-[#0052CC] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Bookings List / Empty State */}
        <div className="space-y-3 pt-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="animate-spin mb-3 text-[#0052CC]" size={32} />
              <p className="font-bold text-xs">Loading booking history...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            /* Prominent Empty State Requested by User */
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80 shadow-xs mt-2">
              <div className="w-18 h-18 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#0052CC] shadow-inner">
                <Package size={36} strokeWidth={2} />
              </div>
              <h3 className="text-base font-black text-slate-900 mb-1">No Bookings Yet</h3>
              <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto leading-relaxed mb-6">
                You haven't booked any parcels yet. Start your first delivery with fast door-to-door pickup and live GPS tracking.
              </p>
              <button 
                type="button"
                onClick={() => navigate(`${base}/booking`)}
                className="w-full py-3.5 px-6 bg-[#0052CC] hover:bg-[#0047cc] text-white font-black text-sm rounded-2xl shadow-[0_8px_20px_-6px_rgba(0,82,204,0.4)] active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <PlusCircle size={18} />
                <span>Book Now</span>
              </button>
            </div>
          ) : (
            filteredBookings.map((booking) => {
              const originStr = booking.pickupLocation?.city || booking.pickupLocation?.address?.split(',')[0] || 'Origin';
              const destStr = booking.dropLocation?.city || booking.dropLocation?.address?.split(',')[0] || 'Destination';
              const dateStr = booking.createdAt 
                ? new Date(booking.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
                : 'Recent';

              return (
                <div
                  key={booking._id}
                  onClick={() => navigate(`${base}/track/${booking.trackingId}`)}
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:border-blue-200 active:scale-[0.99] transition-all cursor-pointer space-y-3"
                >
                  {/* Top Row */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0052CC] flex items-center justify-center font-bold">
                        <Package size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 leading-tight">
                          #{booking.trackingId}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                          <Calendar size={11} /> {dateStr}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>

                  {/* Route Container */}
                  <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Pickup</p>
                      <p className="text-xs font-bold text-slate-800 truncate">{originStr}</p>
                    </div>
                    <div className="px-2 text-[#0052CC]">
                      <ArrowRight size={14} />
                    </div>
                    <div className="flex-1 text-right min-w-0">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Drop</p>
                      <p className="text-xs font-bold text-slate-800 truncate">{destStr}</p>
                    </div>
                  </div>

                  {/* Pricing and Action Link */}
                  <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-500">
                      {booking.packageDetails?.weight ? `${booking.packageDetails.weight} kg • ` : ''}
                      ₹{booking.pricing?.totalAmount || booking.pricing?.total || '250'}
                    </span>
                    <span className="text-xs font-black text-[#0052CC] flex items-center gap-1 hover:underline">
                      View Details <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
}
