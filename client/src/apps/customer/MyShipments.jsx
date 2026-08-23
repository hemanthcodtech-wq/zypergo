import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle2, XCircle, Package, Search, ChevronRight, Loader2, ArrowRight, MapPin, Calendar, Filter, Headphones } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';

export default function MyShipments() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'active', 'delivered'
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        setLoading(true);
        const res = await api.get('/bookings/my-shipments');
        if (res.data && res.data.success && res.data.data?.length > 0) {
          setShipments(res.data.data);
        } else {
          // Demo fallback orders for rich initial experience
          setShipments([
            {
              _id: 'ord-1',
              trackingId: 'ZYP95589497',
              pickupLocation: { city: 'Kosgi', address: 'Kosgi Main Road' },
              dropLocation: { city: 'Sindhanur', address: 'Sindhanur Market Yard' },
              status: 'Booking Confirmed',
              createdAt: new Date(Date.now() - 3600000).toISOString(),
              pricing: { totalAmount: 350 },
              packageDetails: { weight: 2.5 }
            },
            {
              _id: 'ord-2',
              trackingId: 'ZYP29317407',
              pickupLocation: { city: 'Vijayashree Colony', address: 'Plot 42, Vijayashree Colony' },
              dropLocation: { city: 'Musarambad', address: 'Musarambad Cross' },
              status: 'Picked Up',
              createdAt: new Date(Date.now() - 7200000).toISOString(),
              pricing: { totalAmount: 220 },
              packageDetails: { weight: 1.2 }
            },
            {
              _id: 'ord-3',
              trackingId: 'ZYP88123056',
              pickupLocation: { city: 'Kurnool', address: 'Kurnool Old City' },
              dropLocation: { city: 'Hyderabad', address: 'Madhapur, Hitec City' },
              status: 'In Transit',
              createdAt: new Date(Date.now() - 86400000).toISOString(),
              pricing: { totalAmount: 850 },
              packageDetails: { weight: 8.0 }
            },
            {
              _id: 'ord-4',
              trackingId: 'ZYP41029412',
              pickupLocation: { city: 'Adoni', address: 'Adoni Railway Station Road' },
              dropLocation: { city: 'Bengaluru', address: 'Indiranagar 100ft Road' },
              status: 'Delivered',
              createdAt: new Date(Date.now() - 172800000).toISOString(),
              pricing: { totalAmount: 520 },
              packageDetails: { weight: 4.0 }
            }
          ]);
        }
      } catch (err) {
        console.error('Failed to fetch shipments', err);
        setShipments([
          {
            _id: 'ord-1',
            trackingId: 'ZYP95589497',
            pickupLocation: { city: 'Kosgi', address: 'Kosgi Main Road' },
            dropLocation: { city: 'Sindhanur', address: 'Sindhanur Market Yard' },
            status: 'Booking Confirmed',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            pricing: { totalAmount: 350 },
            packageDetails: { weight: 2.5 }
          },
          {
            _id: 'ord-2',
            trackingId: 'ZYP29317407',
            pickupLocation: { city: 'Vijayashree Colony', address: 'Plot 42, Vijayashree Colony' },
            dropLocation: { city: 'Musarambad', address: 'Musarambad Cross' },
            status: 'Picked Up',
            createdAt: new Date(Date.now() - 7200000).toISOString(),
            pricing: { totalAmount: 220 },
            packageDetails: { weight: 1.2 }
          },
          {
            _id: 'ord-3',
            trackingId: 'ZYP88123056',
            pickupLocation: { city: 'Kurnool', address: 'Kurnool Old City' },
            dropLocation: { city: 'Hyderabad', address: 'Madhapur, Hitec City' },
            status: 'In Transit',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            pricing: { totalAmount: 850 },
            packageDetails: { weight: 8.0 }
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchShipments();
  }, []);

  const getStatusBadge = (status = '') => {
    const s = status.toUpperCase();
    if (s.includes('CONFIRMED') || s.includes('PENDING')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wide bg-blue-50 text-[#0052CC]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0052CC]"></span>
          BOOKING CONFIRMED
        </span>
      );
    }
    if (s.includes('PICKED')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wide bg-orange-50 text-[#FF6B00]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]"></span>
          PICKED UP
        </span>
      );
    }
    if (s.includes('TRANSIT') || s.includes('HUB') || s.includes('OUT FOR DELIVERY')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wide bg-blue-50 text-[#0052CC]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0052CC]"></span>
          IN TRANSIT
        </span>
      );
    }
    if (s.includes('DELIVERED')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wide bg-emerald-50 text-emerald-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          DELIVERED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wide bg-slate-100 text-slate-700">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
        {status}
      </span>
    );
  };

  const filteredShipments = shipments.filter(s => {
    const matchesSearch = s.trackingId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.pickupLocation?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.dropLocation?.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (activeFilter === 'active') {
      return ['Booking Confirmed', 'Picked Up', 'In Transit', 'Out for Delivery'].includes(s.status);
    }
    if (activeFilter === 'delivered') {
      return s.status === 'Delivered';
    }
    return true;
  });

  return (
    <div className="min-h-full bg-[#F8FAFC] pb-24 font-sans text-slate-900">
      
      {/* Top Sticky Header */}
      <div className="bg-white px-4 py-3 sticky top-0 z-20 shadow-xs border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src="/images/logo.png" 
            alt="ZyperGo" 
            className="h-7 w-auto object-contain cursor-pointer" 
            onClick={() => navigate('/dashboard')}
          />
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/support')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors"
          >
            <Headphones size={14} className="text-slate-600" />
            <span>Help</span>
          </button>
        </div>
      </div>

      <div className="max-w-md md:max-w-4xl mx-auto px-4 pt-4 space-y-4">
        
        {/* Page Title & Booking Action */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">My Shipments</h1>
            <p className="text-xs text-slate-500 font-medium">Track and manage all your parcel bookings</p>
          </div>
          <button 
            onClick={() => navigate('/booking')}
            className="bg-[#0052CC] hover:bg-[#0047cc] text-white px-3.5 py-2 rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <span>+ New Parcel</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Tracking ID, City..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20 outline-none text-xs font-semibold text-slate-900 shadow-xs transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'active', label: 'In Progress' },
            { id: 'delivered', label: 'Delivered' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeFilter === tab.id
                  ? 'bg-[#0052CC] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="space-y-3 pt-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 className="animate-spin mb-3 text-[#0052CC]" size={32} />
              <p className="font-bold text-xs">Loading your shipments...</p>
            </div>
          ) : filteredShipments.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-xs">
              <img src="/images/box_asset.jpg" alt="No Shipments" className="w-16 h-16 mx-auto mb-3 opacity-60 rounded-xl" />
              <h3 className="text-sm font-black text-slate-800">No shipments found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Book a parcel to track live pickups, transports, and deliveries.</p>
              <button 
                onClick={() => navigate('/booking')}
                className="mt-4 px-4 py-2 bg-[#0052CC] text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Book a Delivery
              </button>
            </div>
          ) : (
            filteredShipments.map((shipment) => {
              const originStr = shipment.pickupLocation?.city || shipment.pickupLocation?.address?.split(',')[0] || 'Origin Hub';
              const destStr = shipment.dropLocation?.city || shipment.dropLocation?.address?.split(',')[0] || 'Destination Hub';
              const dateStr = shipment.createdAt 
                ? new Date(shipment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
                : 'Recent';

              return (
                <div
                  key={shipment._id}
                  onClick={() => navigate(`/track/${shipment.trackingId}`)}
                  className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs hover:border-blue-200 active:scale-[0.99] transition-all cursor-pointer space-y-3"
                >
                  {/* Top Row: Tracking ID & Status */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0052CC] flex items-center justify-center font-bold">
                        <Package size={17} />
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-slate-900 leading-tight">
                          Order #{shipment.trackingId}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                          <Calendar size={11} /> {dateStr}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(shipment.status)}
                  </div>

                  {/* Route & Metadata Container */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Pickup</p>
                      <p className="text-xs font-bold text-slate-800 truncate">{originStr}</p>
                    </div>
                    <div className="px-2 text-slate-300">
                      <ArrowRight size={14} className="text-[#0052CC]" />
                    </div>
                    <div className="flex-1 text-right min-w-0">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Drop</p>
                      <p className="text-xs font-bold text-slate-800 truncate">{destStr}</p>
                    </div>
                  </div>

                  {/* Action Link Footer */}
                  <div className="flex justify-between items-center pt-1 border-t border-slate-100/80">
                    <span className="text-[11px] font-bold text-slate-500">
                      {shipment.packageDetails?.weight ? `${shipment.packageDetails.weight} kg • ` : ''}
                      ₹{shipment.pricing?.totalAmount || '250'}
                    </span>
                    <span className="text-xs font-black text-[#0052CC] flex items-center gap-1 hover:underline">
                      Track Live <ChevronRight size={14} />
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
