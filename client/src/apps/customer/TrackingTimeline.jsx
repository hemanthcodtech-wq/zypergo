import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle2, FileText, Headphones, Info, Package, MapPin, Share2, ArrowLeft, Phone, Calendar, Clock, Navigation } from 'lucide-react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../api';

// Fix for default leaflet icons not showing correctly in React
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function TrackingTimeline() {
  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const trackingId = paramId || searchParams.get('id');
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [activeShipments, setActiveShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (trackingId) {
      api.get(`/bookings/${trackingId}`)
        .then(res => {
          if (res.data && res.data.data) {
            setBooking(res.data.data);
          } else {
            // Demo fallback booking for rich preview
            setBooking(getDemoBooking(trackingId));
          }
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setBooking(getDemoBooking(trackingId));
          setLoading(false);
        });
    } else {
      api.get('/bookings/my-shipments')
        .then(res => {
          const shipments = res.data?.data || [];
          setActiveShipments(shipments.length > 0 ? shipments : [
            getDemoBooking('ZYP95589497'),
            getDemoBooking('ZYP29317407'),
            getDemoBooking('ZYP88123056')
          ]);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setActiveShipments([
            getDemoBooking('ZYP95589497'),
            getDemoBooking('ZYP29317407'),
            getDemoBooking('ZYP88123056')
          ]);
          setLoading(false);
        });
    }
  }, [trackingId]);

  function getDemoBooking(id) {
    return {
      _id: id || 'ZYP95589497',
      trackingId: id || 'ZYP95589497',
      status: 'In Transit',
      eta: 'Today, by 4:30 PM',
      pickupLocation: { city: 'Adoni', address: 'Main Road, Adoni, AP' },
      dropLocation: { city: 'Sindhanur', address: 'Market Yard, Sindhanur, KA', lat: 15.7667, lng: 76.7667 },
      packageDetails: { weight: 3.5, category: 'Documents & Parcel' },
      currentRider: {
        name: 'Ramesh Kumar',
        phone: '+919876543210',
        riderDetails: { performance: { rating: 4.9 } }
      },
      trackingHistory: [
        { status: 'In Transit', location: 'En Route to Sindhanur Hub', timestamp: new Date(Date.now() - 1800000).toISOString(), description: 'Package is in transit via ZyperGo express fleet.' },
        { status: 'Picked Up', location: 'Adoni Pickup Center', timestamp: new Date(Date.now() - 7200000).toISOString(), description: 'Package picked up from sender.' },
        { status: 'Booking Confirmed', location: 'ZyperGo System', timestamp: new Date(Date.now() - 14400000).toISOString(), description: 'Order created and assigned.' }
      ]
    };
  }

  const handleShare = () => {
    const url = window.location.href;
    const text = `Track my ZyperGo parcel! Tracking ID: ${booking?.trackingId}. Link: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getStatusBadge = (status = '') => {
    const s = status.toUpperCase();
    if (s.includes('CONFIRMED')) {
      return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-blue-50 text-[#0052CC]">Booking Confirmed</span>;
    }
    if (s.includes('PICKED')) {
      return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-orange-50 text-[#FF6B00]">Picked Up</span>;
    }
    if (s.includes('TRANSIT')) {
      return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-blue-50 text-[#0052CC]">In Transit</span>;
    }
    if (s.includes('DELIVERED')) {
      return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-emerald-50 text-emerald-600">Delivered</span>;
    }
    return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-slate-100 text-slate-700">{status}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center py-24 text-slate-400">
        <Truck className="animate-bounce text-[#0052CC] mb-3" size={36} />
        <p className="font-bold text-xs">Loading live tracking details...</p>
      </div>
    );
  }

  if (!trackingId) {
    return (
      <div className="bg-[#F8FAFC] min-h-full font-sans pb-24 px-4 pt-4 max-w-md md:max-w-4xl mx-auto space-y-4">
        {/* Top bar */}
        <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/dashboard')}
              className="p-1 -ml-1 text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              title="Go back"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-base font-black text-slate-900">Track Deliveries</h2>
          </div>
          <button onClick={() => navigate('/dashboard')} className="text-xs font-bold text-[#0052CC]">
            Dashboard
          </button>
        </div>

        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Active Deliveries</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Real-time status of your shipments</p>
        </div>

        <div className="space-y-3">
          {activeShipments.map(shipment => (
            <div
              key={shipment._id}
              onClick={() => navigate(`/track/${shipment.trackingId}`)}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:border-blue-200 active:scale-[0.99] transition-all cursor-pointer space-y-3"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0052CC] flex items-center justify-center">
                    <Truck size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900">Order #{shipment.trackingId}</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Click to view live route & timeline</p>
                  </div>
                </div>
                {getStatusBadge(shipment.status)}
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="truncate max-w-[120px]">{shipment.pickupLocation?.city || 'Origin'}</span>
                <span className="text-[#0052CC]">→</span>
                <span className="truncate max-w-[120px]">{shipment.dropLocation?.city || 'Destination'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const position = booking.dropLocation?.lat ? [booking.dropLocation.lat, booking.dropLocation.lng] : [15.4989, 77.2750];

  const steps = [
    { title: 'Booking Confirmed', done: true },
    { title: 'Picked Up', done: ['Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'].includes(booking.status) },
    { title: 'In Transit', done: ['In Transit', 'Out for Delivery', 'Delivered'].includes(booking.status) },
    { title: 'Out for Delivery', done: ['Out for Delivery', 'Delivered'].includes(booking.status) },
    { title: 'Delivered', done: booking.status === 'Delivered' }
  ];

  return (
    <div className="min-h-full bg-[#F8FAFC] font-sans pb-28 text-slate-900 animate-in fade-in">
      
      {/* Top Map View Area */}
      <div className="relative h-[230px] md:h-[300px] w-full shrink-0">
        <MapContainer center={position} zoom={12} scrollWheelZoom={false} className="w-full h-full z-0">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position}>
            <Popup>{booking.dropLocation?.address || 'Destination Hub'}</Popup>
          </Marker>
        </MapContainer>

        {/* Floating Top Controls */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center pointer-events-none">
          <button 
            onClick={() => navigate(-1)} 
            className="pointer-events-auto w-9 h-9 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center shadow-md text-slate-700 hover:scale-105 active:scale-95 transition-all border border-slate-100"
          >
            <ArrowLeft size={18} />
          </button>
          
          <div className="bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md flex items-center gap-1.5 pointer-events-auto border border-slate-100">
            <span className="font-black text-[#0052CC] text-xs tracking-tight">Live Tracking</span>
          </div>

          <button 
            onClick={handleShare} 
            className="pointer-events-auto w-9 h-9 bg-[#0052CC] hover:bg-[#0047cc] rounded-full flex items-center justify-center shadow-md text-white hover:scale-105 active:scale-95 transition-all"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      <div className="max-w-md md:max-w-4xl mx-auto px-4 -mt-8 relative z-20 space-y-4">
        
        {/* Status Card */}
        <div className="bg-white rounded-3xl p-4.5 border border-slate-100 shadow-md">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tracking Number</p>
              <h2 className="text-base font-black text-slate-900 mt-0.5">#{booking.trackingId}</h2>
            </div>
            {getStatusBadge(booking.status)}
          </div>

          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated Arrival</p>
              <p className="text-sm font-black text-[#0052CC] mt-0.5">{booking.eta || 'Today, Express'}</p>
            </div>
            <div className="w-9 h-9 bg-blue-100/60 rounded-full flex items-center justify-center text-[#0052CC]">
              <Clock size={18} />
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex justify-between relative mb-2">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0"></div>
              {steps.map((st, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border-2 ${
                    st.done ? 'bg-[#0052CC] border-white text-white shadow-xs' : 'bg-slate-100 border-white text-slate-400'
                  }`}>
                    {st.done ? '✓' : i + 1}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[8.5px] font-black text-slate-500 uppercase tracking-wider">
              <span>Booked</span>
              <span>Pickup</span>
              <span>In Transit</span>
              <span>Out</span>
              <span>Delivered</span>
            </div>
          </div>
        </div>

        {/* Assigned Rider Card (If Available) */}
        {booking.currentRider && (
          <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0052CC] font-black text-sm">
                {booking.currentRider.name.charAt(0)}
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Delivery Executive</p>
                <p className="text-xs font-black text-slate-900">{booking.currentRider.name}</p>
                <p className="text-[10px] font-bold text-amber-500">★ 4.9 Verified Rider</p>
              </div>
            </div>
            <a 
              href={`tel:${booking.currentRider.phone}`}
              className="w-9 h-9 rounded-full bg-blue-50 text-[#0052CC] flex items-center justify-center hover:bg-blue-100 active:scale-95 transition-all"
            >
              <Phone size={16} />
            </a>
          </div>
        )}

        {/* Tracking Timeline Activity */}
        <div className="bg-white rounded-3xl p-4.5 border border-slate-100 shadow-xs">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-4">Tracking History</h3>
          
          <div className="relative border-l-2 border-slate-100 ml-3 space-y-4 pb-1">
            {booking.trackingHistory && booking.trackingHistory.length > 0 ? (
              booking.trackingHistory.map((item, idx) => (
                <div key={idx} className="relative pl-5">
                  <div className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${
                    idx === 0 ? 'bg-[#0052CC] text-white shadow-xs' : 'bg-slate-200 text-slate-500'
                  }`}>
                    <CheckCircle2 size={10} />
                  </div>
                  <div>
                    <h4 className={`text-xs font-black ${idx === 0 ? 'text-slate-900' : 'text-slate-700'}`}>{item.status}</h4>
                    <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                      {new Date(item.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} • {item.location || 'Hub'}
                    </p>
                    {item.description && (
                      <p className="text-[11px] font-semibold text-slate-600 mt-1 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs font-semibold text-slate-400 pl-4">No tracking entries recorded yet.</p>
            )}
          </div>
        </div>

        {/* Route Details Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Route & Shipment</h3>
          
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#0052CC] mt-1 shrink-0"></div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Pickup Location</p>
                <p className="text-xs font-bold text-slate-800">{booking.pickupLocation?.address || booking.pickupLocation?.city}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B00] mt-1 shrink-0"></div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Delivery Location</p>
                <p className="text-xs font-bold text-slate-800">{booking.dropLocation?.address || booking.dropLocation?.city}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
