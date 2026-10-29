import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, Bell, Package, Calendar, Map, FileText, ChevronRight, 
  CheckCircle2, Clock, Truck, ChevronDown, ArrowRight, X, Search, Sparkles, Navigation 
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../../api';
import { reverseGeocode } from '../../utils/locationService';

// Custom Rapido-style captain bike icon
const createRiderIcon = (heading = 45) => {
  return L.divIcon({
    className: 'custom-rider-icon',
    html: `
      <div style="transform: rotate(${heading}deg); transition: transform 0.4s ease;" class="relative flex items-center justify-center">
        <div style="background: linear-gradient(135deg, #FDB813, #F59E0B); box-shadow: 0 4px 10px rgba(0,0,0,0.25);" class="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-slate-900">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
          </svg>
        </div>
        <span class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white"></span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

// Pulsing user beacon icon
const createUserIcon = () => {
  return L.divIcon({
    className: 'custom-user-icon',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="w-4 h-4 rounded-full bg-[#0052CC] border-2 border-white shadow-lg z-10"></div>
        <div class="absolute w-8 h-8 rounded-full bg-[#0052CC]/30 animate-ping"></div>
        <div class="absolute w-12 h-12 rounded-full bg-[#0052CC]/15"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
}

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: 'Customer' });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // User GPS coordinates (Defaults to Hyderabad, updates via GPS)
  const [userCoords, setUserCoords] = useState([17.3850, 78.4867]);
  const [userLocationName, setUserLocationName] = useState('Hyderabad, Telangana');

  useEffect(() => {
    const userData = localStorage.getItem('zypergo_user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    // Fetch Location with high accuracy & update map coordinates
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          setUserCoords([latitude, longitude]);
          const loc = await reverseGeocode(latitude, longitude);
          if (loc && loc.city) {
            setUserLocationName(loc.colony ? `${loc.colony}, ${loc.city}` : `${loc.city}, ${loc.state || 'Telangana'}`);
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

  // Compute 5 realistic nearby online captains surrounding user's live coordinates
  const nearbyCaptains = [
    { id: 'c1', lat: userCoords[0] + 0.0031, lng: userCoords[1] + 0.0024, heading: 45, eta: '2 mins' },
    { id: 'c2', lat: userCoords[0] - 0.0028, lng: userCoords[1] + 0.0036, heading: 120, eta: '3 mins' },
    { id: 'c3', lat: userCoords[0] + 0.0042, lng: userCoords[1] - 0.0029, heading: 215, eta: '4 mins' },
    { id: 'c4', lat: userCoords[0] - 0.0035, lng: userCoords[1] - 0.0031, heading: 310, eta: '2 mins' },
    { id: 'c5', lat: userCoords[0] + 0.0016, lng: userCoords[1] - 0.0042, heading: 85, eta: '3 mins' },
  ];

  const handleRecenter = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserCoords([pos.coords.latitude, pos.coords.longitude]);
      });
    }
  };

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

  return (
    <div className="min-h-full bg-[#F8FAFC] pb-24 font-sans text-slate-900">
      
      {/* Top App Bar with Bigger Logo and Removed Hamburger Menu */}
      <div className="bg-white px-4 py-3 sticky top-0 z-20 shadow-xs flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center">
          <img 
            src="/images/logo.png" 
            alt="ZyperGo" 
            className="h-10 md:h-11 w-auto max-w-[150px] object-contain cursor-pointer drop-shadow-xs transition-transform active:scale-95" 
            onClick={() => navigate('/dashboard')}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Current City Pill */}
          <div 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50/70 text-slate-800 shadow-2xs max-w-[170px]"
            title={userLocationName}
          >
            <MapPin size={14} className="text-[#0052CC] shrink-0" />
            <div className="text-left truncate">
              <span className="text-xs font-black text-slate-900 block truncate">
                {userLocationName.split(',')[0]}
              </span>
            </div>
          </div>

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

      <div className="max-w-md md:max-w-4xl mx-auto px-4 pt-4 space-y-4">
        
        {/* Rapido-Style Live Interactive Map View */}
        <div className="relative rounded-3xl overflow-hidden shadow-md border border-slate-200/90 bg-slate-100 h-[290px] w-full">
          <MapContainer 
            center={userCoords} 
            zoom={14} 
            zoomControl={false}
            scrollWheelZoom={false}
            attributionControl={false}
            style={{ height: '100%', width: '100%', zIndex: 0 }}
          >
            <TileLayer 
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
            />
            <RecenterMap center={userCoords} />

            {/* Pulsing User Current Location Marker */}
            <Marker position={userCoords} icon={createUserIcon()} />

            {/* Live Nearby Online Captains */}
            {nearbyCaptains.map((captain) => (
              <Marker 
                key={captain.id} 
                position={[captain.lat, captain.lng]} 
                icon={createRiderIcon(captain.heading)}
              />
            ))}
          </MapContainer>

          {/* Top Live Captains Overlay Badge */}
          <div className="absolute top-3 left-3 z-10">
            <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-md text-white px-3 py-1.5 rounded-full shadow-lg border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-black tracking-tight">
                ⚡ 5 Captains nearby
              </span>
              <span className="text-[10px] text-amber-300 font-bold bg-amber-400/20 px-1.5 py-0.5 rounded-full">
                2-3 mins
              </span>
            </div>
          </div>

          {/* Top Right Recenter Button */}
          <div className="absolute top-3 right-3 z-10">
            <button 
              type="button"
              onClick={handleRecenter}
              className="w-9 h-9 bg-white/95 hover:bg-white text-slate-800 rounded-full shadow-lg border border-slate-200 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
              title="Recenter to my location"
            >
              <Navigation size={17} className="text-[#0052CC]" />
            </button>
          </div>

          {/* Floating Bottom Rapido-Style Booking Action Card */}
          <div className="absolute bottom-3 left-3 right-3 z-10">
            <div 
              onClick={() => navigate('/booking')}
              className="bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-slate-100 flex items-center justify-between cursor-pointer hover:bg-white transition-all active:scale-[0.99] group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs font-black shrink-0">
                  <Package size={18} strokeWidth={2.4} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fastest Parcel Delivery</p>
                  <h4 className="text-xs font-black text-slate-900 group-hover:text-[#0052CC] transition-colors">
                    Where are you sending to?
                  </h4>
                </div>
              </div>

              <div className="bg-[#FF6B00] hover:bg-[#E56000] text-white px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm shrink-0">
                <span>Book Now</span>
                <ArrowRight size={13} strokeWidth={2.5} />
              </div>
            </div>
          </div>
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
              className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs flex flex-col items-center text-center group hover:border-blue-200 active:scale-95 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0052CC] mb-2 group-hover:scale-105 transition-transform">
                <Package size={22} strokeWidth={2.2} />
              </div>
              <span className="text-[11px] font-black text-slate-800 leading-tight">Send Parcel</span>
            </button>

            {/* Schedule Pickup */}
            <button 
              onClick={() => navigate('/booking')}
              className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs flex flex-col items-center text-center group hover:border-orange-200 active:scale-95 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF6B00] mb-2 group-hover:scale-105 transition-transform">
                <Calendar size={22} strokeWidth={2.2} />
              </div>
              <span className="text-[11px] font-black text-slate-800 leading-tight">Schedule Pickup</span>
            </button>

            {/* Track Order */}
            <button 
              onClick={() => navigate('/track')}
              className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs flex flex-col items-center text-center group hover:border-emerald-200 active:scale-95 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-2 group-hover:scale-105 transition-transform">
                <MapPin size={22} strokeWidth={2.2} />
              </div>
              <span className="text-[11px] font-black text-slate-800 leading-tight">Track Order</span>
            </button>

            {/* Rate Card */}
            <button 
              onClick={() => navigate('/support')}
              className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs flex flex-col items-center text-center group hover:border-purple-200 active:scale-95 transition-all cursor-pointer"
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

    </div>
  );
}
