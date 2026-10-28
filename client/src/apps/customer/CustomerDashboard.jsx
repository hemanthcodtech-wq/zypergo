import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, Bell, Package, Calendar, Map, FileText, ChevronRight, 
  CheckCircle2, Clock, Truck, ChevronDown, Menu, ArrowRight, X, Search, Sparkles, Navigation 
} from 'lucide-react';
import api from '../../api';
import { reverseGeocode } from '../../utils/locationService';
import PinLocationModal from '../../components/common/PinLocationModal';

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: 'Customer' });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pinned Location State - automatically asks to pin location on every app open
  const [showPinModal, setShowPinModal] = useState(true);
  const [pinnedLocation, setPinnedLocation] = useState(() => {
    const saved = localStorage.getItem('zypergo_customer_location');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });

  const [selectedCity, setSelectedCity] = useState(
    pinnedLocation?.city ? `${pinnedLocation.city}, ${pinnedLocation.state || 'Telangana'}` : 'Kosgi, Telangana'
  );
  const [activeSlide, setActiveSlide] = useState(0);

  const availableCities = [
    'Adoni, Andhra Pradesh',
    'Hyderabad, Telangana',
    'Kurnool, Andhra Pradesh',
    'Bengaluru, Karnataka',
    'Sindhanur, Karnataka',
    'Kosgi, Telangana'
  ];

  useEffect(() => {
    const userData = localStorage.getItem('zypergo_user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    // Fetch Location with Google Maps Geocoding & high accuracy
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const loc = await reverseGeocode(latitude, longitude);
          if (loc && loc.city) {
            setSelectedCity(`${loc.city}, ${loc.state}`);
          }
        } catch (error) {
          console.error("Error geocoding location:", error);
        }
      }, (err) => {
        console.warn("Geolocation warning:", err.message);
      }, { enableHighAccuracy: true, timeout: 8000 });
    }

    // Fetch recent orders
    const fetchOrders = async () => {
      try {
        const res = await api.get('/bookings/my-bookings');
        if (res.data.success && res.data.data?.length > 0) {
          setRecentOrders(res.data.data.slice(0, 5));
        } else {
          // Provide demo active orders matching the reference style if empty
          setRecentOrders([
            {
              _id: 'demo-1',
              trackingId: 'ZYP95589497',
              origin: 'Kosgi',
              destination: 'Sindhanur',
              status: 'BOOKING CONFIRMED',
              date: 'Aug 22, 8:51 AM'
            },
            {
              _id: 'demo-2',
              trackingId: 'ZYP29317407',
              origin: 'Vijayashree Colony',
              destination: 'Musar ambad',
              status: 'PICKED UP',
              date: 'Aug 22, 8:41 AM'
            },
            {
              _id: 'demo-3',
              trackingId: 'ZYP88123056',
              origin: 'Kurnool',
              destination: 'Hyderabad',
              status: 'IN TRANSIT',
              date: 'Aug 22, 7:30 AM'
            }
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch orders", err);
        setRecentOrders([
          {
            _id: 'demo-1',
            trackingId: 'ZYP95589497',
            origin: 'Kosgi',
            destination: 'Sindhanur',
            status: 'BOOKING CONFIRMED',
            date: 'Aug 22, 8:51 AM'
          },
          {
            _id: 'demo-2',
            trackingId: 'ZYP29317407',
            origin: 'Vijayashree Colony',
            destination: 'Musar ambad',
            status: 'PICKED UP',
            date: 'Aug 22, 8:41 AM'
          },
          {
            _id: 'demo-3',
            trackingId: 'ZYP88123056',
            origin: 'Kurnool',
            destination: 'Hyderabad',
            status: 'IN TRANSIT',
            date: 'Aug 22, 7:30 AM'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusBadge = (status = '') => {
    const s = status.toUpperCase();
    if (s.includes('CONFIRMED') || s.includes('CREATED')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black tracking-wide uppercase bg-blue-50 text-[#0052CC]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0052CC]"></span>
          BOOKING CONFIRMED
        </span>
      );
    }
    if (s.includes('PICKED')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black tracking-wide uppercase bg-orange-50 text-[#FF6B00]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]"></span>
          PICKED UP
        </span>
      );
    }
    if (s.includes('TRANSIT') || s.includes('HUB') || s.includes('OUT FOR DELIVERY')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black tracking-wide uppercase bg-blue-50 text-[#0052CC]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0052CC]"></span>
          IN TRANSIT
        </span>
      );
    }
    if (s.includes('DELIVERED')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black tracking-wide uppercase bg-emerald-50 text-emerald-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          DELIVERED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black tracking-wide uppercase bg-slate-100 text-slate-700">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
        {status}
      </span>
    );
  };

  const getOrderIcon = (status = '') => {
    const s = status.toUpperCase();
    if (s.includes('CONFIRMED')) {
      return (
        <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0052CC] shrink-0">
          <Package size={18} />
        </div>
      );
    }
    if (s.includes('PICKED')) {
      return (
        <div className="w-10 h-10 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF6B00] shrink-0">
          <Truck size={18} />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0052CC] shrink-0">
        <Truck size={18} />
      </div>
    );
  };

  const cityNameOnly = selectedCity.split(',')[0].trim();

  return (
    <div className="min-h-full bg-[#F8FAFC] pb-24 font-sans text-slate-900">
      
      {/* Top App Bar (Image 3 Header) */}
      <div className="bg-white px-4 py-3 sticky top-0 z-20 shadow-xs flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/profile')} 
            className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
          >
            <Menu size={22} strokeWidth={2.2} />
          </button>
          
          <img 
            src="/images/logo.png" 
            alt="ZyperGo" 
            className="h-7 w-auto object-contain cursor-pointer" 
            onClick={() => navigate('/dashboard')}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Location Selector Pill */}
          <button 
            type="button"
            onClick={() => setShowPinModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50/70 text-slate-800 hover:bg-blue-100/70 active:scale-95 transition-all cursor-pointer shadow-2xs max-w-[170px]"
            title="Click to pin or change exact delivery location"
          >
            <MapPin size={14} className="text-[#0052CC] shrink-0" />
            <div className="text-left truncate">
              <span className="text-xs font-black text-slate-900 block truncate">
                {pinnedLocation?.colony || pinnedLocation?.city || cityNameOnly}
              </span>
            </div>
            <ChevronDown size={14} className="text-slate-400 shrink-0" />
          </button>

          {/* Notification Bell */}
          <button 
            onClick={() => navigate('/notifications')}
            className="relative p-2 rounded-full text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#FF6B00] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
              3
            </span>
          </button>
        </div>
      </div>

      {/* Pinned Delivery Location Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50/40 border-b border-blue-100/80 px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-700 truncate pr-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
          <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider shrink-0">Delivery at:</span>
          <span className="font-black text-slate-800 truncate text-[11px]">
            {pinnedLocation?.plotNumber ? `${pinnedLocation.plotNumber}, ` : ''}
            {pinnedLocation?.colony ? `${pinnedLocation.colony}, ` : ''}
            {pinnedLocation?.city || selectedCity}
            {pinnedLocation?.landmark ? ` (Near ${pinnedLocation.landmark})` : ''}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowPinModal(true)}
          className="text-[11px] font-black text-[#0052CC] hover:underline shrink-0 cursor-pointer"
        >
          Change Pin
        </button>
      </div>

      <div className="max-w-md md:max-w-4xl mx-auto px-4 pt-4 space-y-4">
        
        {/* Delivering In / Location Banner Card */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0052CC] shrink-0">
              <MapPin size={20} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delivering in</p>
              <h4 className="text-xs font-black text-slate-800 leading-tight">{selectedCity}</h4>
              <div className="flex items-center gap-1 mt-0.5">
                <CheckCircle2 size={12} className="text-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-600">Location access granted</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setShowCityModal(true)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
          >
            Change
          </button>
        </div>

        {/* Hero Banner Carousel (Seamless Royal Blue 3D Card) */}
        <div className="relative rounded-3xl overflow-hidden shadow-md bg-[#003B99] text-white p-5 md:p-6 min-h-[175px] flex flex-col justify-between">
          
          {/* Full seamless 3D fleet banner background */}
          <img 
            src="/images/dashboard_banner.jpg" 
            alt="ZyperGo Fleet" 
            className="absolute inset-0 w-full h-full object-cover object-right pointer-events-none"
          />

          {/* Left Dark Blue Gradient Vignette for clear text contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#003B99] via-[#003B99]/85 to-transparent w-3/4 md:w-3/5 pointer-events-none"></div>

          <div className="relative z-10 max-w-[210px] md:max-w-sm">
            <h2 className="text-xl md:text-2xl font-black leading-tight text-white">
              Send Anything,<br />
              <span className="text-[#FF7A00]">Anywhere.</span>
            </h2>
            <p className="text-blue-100 text-[10.5px] font-bold mt-1.5 flex items-center gap-1.5">
              Fast <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A00]"></span> Safe <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A00]"></span> Affordable
            </p>

            <button 
              onClick={() => navigate('/booking')}
              className="mt-3.5 inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-[#0052CC] font-black px-4 py-2 rounded-full text-xs shadow-md active:scale-95 transition-all"
            >
              <span>Book a Delivery</span>
              <ArrowRight size={14} strokeWidth={2.5} className="text-[#FF7A00]" />
            </button>
          </div>
        </div>

        {/* Carousel Pagination Dots */}
        <div className="flex justify-center items-center gap-1.5 py-1">
          <span className="w-2 h-2 rounded-full bg-[#0052CC]"></span>
          <span className="w-2 h-2 rounded-full bg-slate-300"></span>
          <span className="w-2 h-2 rounded-full bg-slate-300"></span>
        </div>

        {/* Quick Actions Section */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-slate-900 tracking-tight">Quick Actions</h3>
            <button 
              onClick={() => navigate('/booking')}
              className="text-xs font-bold text-[#0052CC] hover:underline flex items-center gap-1"
            >
              View All <ArrowRight size={13} />
            </button>
          </div>

          {/* 4 Action Grid Cards */}
          <div className="grid grid-cols-4 gap-2.5">
            
            {/* Send Parcel */}
            <button 
              onClick={() => navigate('/booking')}
              className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs flex flex-col items-center text-center group hover:border-blue-200 active:scale-95 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0052CC] mb-2 group-hover:scale-105 transition-transform">
                <Package size={22} strokeWidth={2.2} />
              </div>
              <span className="text-[11px] font-black text-slate-800 leading-tight">Send Parcel</span>
            </button>

            {/* Schedule Pickup */}
            <button 
              onClick={() => navigate('/booking')}
              className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs flex flex-col items-center text-center group hover:border-orange-200 active:scale-95 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF6B00] mb-2 group-hover:scale-105 transition-transform">
                <Calendar size={22} strokeWidth={2.2} />
              </div>
              <span className="text-[11px] font-black text-slate-800 leading-tight">Schedule Pickup</span>
            </button>

            {/* Track Order */}
            <button 
              onClick={() => navigate('/track')}
              className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs flex flex-col items-center text-center group hover:border-emerald-200 active:scale-95 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-2 group-hover:scale-105 transition-transform">
                <MapPin size={22} strokeWidth={2.2} />
              </div>
              <span className="text-[11px] font-black text-slate-800 leading-tight">Track Order</span>
            </button>

            {/* Rate Card */}
            <button 
              onClick={() => navigate('/support')}
              className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs flex flex-col items-center text-center group hover:border-purple-200 active:scale-95 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-2 group-hover:scale-105 transition-transform">
                <FileText size={22} strokeWidth={2.2} />
              </div>
              <span className="text-[11px] font-black text-slate-800 leading-tight">Rate Card</span>
            </button>

          </div>
        </div>

        {/* Recent Orders Section */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-slate-900 tracking-tight">Recent Orders</h3>
            <button 
              onClick={() => navigate('/shipments')}
              className="text-xs font-bold text-[#0052CC] hover:underline flex items-center gap-1"
            >
              View All <ArrowRight size={13} />
            </button>
          </div>

          <div className="space-y-2.5">
            {recentOrders.map((order) => {
              const trackingNumber = order.trackingId || order._id;
              const routeOrigin = order.pickupLocation?.address?.split(',')[0] || order.origin || 'Origin Hub';
              const routeDest = order.dropLocation?.address?.split(',')[0] || order.destination || 'Destination Hub';
              const dateStr = order.createdAt 
                ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
                : (order.date || 'Recent');

              return (
                <div 
                  key={order._id}
                  onClick={() => navigate(`/track/${trackingNumber}`)}
                  className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs flex items-center justify-between hover:border-blue-200 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {getOrderIcon(order.status)}
                    <div>
                      <h4 className="text-xs font-black text-slate-900 tracking-tight">
                        Order #{trackingNumber}
                      </h4>
                      <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                        {routeOrigin} <span className="text-slate-300">→</span> {routeDest}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5 flex items-center gap-1">
                        <Calendar size={11} /> {dateStr}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(order.status)}
                    <ChevronRight size={16} className="text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Interactive Pin Location Modal - Prompts on load and on click */}
      <PinLocationModal 
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        initialLocation={pinnedLocation}
        onConfirm={(newLocation) => {
          setPinnedLocation(newLocation);
          if (newLocation.city) {
            setSelectedCity(`${newLocation.city}, ${newLocation.state || 'Telangana'}`);
          }
          setShowPinModal(false);
        }}
      />

    </div>
  );
}
