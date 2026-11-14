import React, { useState, useEffect, useRef } from 'react';
import { Truck, CheckCircle2, FileText, Headphones, Info, Package, MapPin, Share2, ArrowLeft, Phone, Calendar, Clock, Navigation, Radio, Bell } from 'lucide-react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { io } from 'socket.io-client';
import api from '../../api';

// Custom Leaflet Icons for Rapido-like Live Tracking
const createCustomPinIcon = (label, bgHex) => L.divIcon({
  className: 'custom-pin-marker',
  html: `
    <div style="
      background: ${bgHex};
      color: white;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 13px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      border: 2.5px solid white;
    ">
      ${label}
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const pickupPinIcon = createCustomPinIcon('A', '#16A34A');
const dropPinIcon = createCustomPinIcon('B', '#DC2626');

// Rapido Captain Moving Vehicle (Bike/Scooter) Marker with Live Radar Ring
const captainVehicleIcon = L.divIcon({
  className: 'captain-moving-bike-marker',
  html: `
    <div style="position: relative; width: 46px; height: 46px; display: flex; align-items: center; justify-content: center;">
      <!-- Pulsating Radar Ring -->
      <div style="
        position: absolute;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: rgba(0, 82, 204, 0.25);
        animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></div>

      <!-- Vehicle Circle -->
      <div style="
        position: relative;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: #0052CC;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0, 82, 204, 0.5);
        border: 2.5px solid white;
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="18.5" cy="17.5" r="3.5"/>
          <circle cx="5.5" cy="17.5" r="3.5"/>
          <circle cx="15" cy="5" r="1"/>
          <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
        </svg>

        <!-- Live Online Dot -->
        <span style="
          position: absolute;
          top: -2px;
          right: -2px;
          width: 11px;
          height: 11px;
          background: #22C55E;
          border-radius: 50%;
          border: 2px solid white;
        "></span>
      </div>
    </div>
  `,
  iconSize: [46, 46],
  iconAnchor: [23, 23]
});

// Haversine formula to calculate accurate real-time distance in kilometers
function calculateHaversineKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Dynamic Map View Bounds Controller (smoothly fits the blue road route, vehicle and destination)
function MapBoundsController({ routeCoords, riderPos, targetPos, defaultPos }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    if (routeCoords && routeCoords.length > 1) {
      try {
        const bounds = L.latLngBounds(routeCoords);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        return;
      } catch (e) {}
    }
    const points = [];
    if (riderPos && riderPos[0] && riderPos[1]) points.push(riderPos);
    if (targetPos && targetPos[0] && targetPos[1]) points.push(targetPos);
    if (points.length >= 2) {
      try {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [45, 45], maxZoom: 16 });
      } catch (e) {}
    } else if (points.length === 1) {
      map.setView(points[0], 15);
    } else if (defaultPos) {
      map.setView(defaultPos, 13);
    }
  }, [routeCoords, riderPos, targetPos, map]);
  return null;
}

export default function TrackingTimeline() {
  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const trackingId = paramId || searchParams.get('id');
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [activeShipments, setActiveShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-Time Captain Live GPS Coordinates & Route State
  const [riderLocation, setRiderLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [showArrivalBanner, setShowArrivalBanner] = useState(false);
  const [arrivalBannerText, setArrivalBannerText] = useState('Your ZyperGo Captain is waiting for you at pickup location.');
  const [liveStatusText, setLiveStatusText] = useState('');
  const socketRef = useRef(null);
  const hasNotifiedArrivalRef = useRef(false);
  const lastFetchedPosRef = useRef(null);

  // Request browser Notification permission on mount for instant arrival alerts
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const fetchBooking = () => {
    if (!trackingId) return;
    api.get(`/bookings/${trackingId}`)
      .then(res => {
        if (res.data && res.data.data) {
          const b = res.data.data;
          setBooking(b);
          // Seed rider location from populated booking if not already streaming
          if (b.currentRider?.riderDetails?.currentLocation?.lat) {
            setRiderLocation(prev => prev || {
              lat: Number(b.currentRider.riderDetails.currentLocation.lat),
              lng: Number(b.currentRider.riderDetails.currentLocation.lng)
            });
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch booking error:', err);
        setLoading(false);
      });
  };

  // 100-Meter Geofence & Captain Arrival Alert Trigger
  const triggerCaptainArrivedNotification = (customTitle = '🔔 Captain is waiting for you!', customBody = 'Your ZyperGo Captain has arrived at your pickup location. Share OTP to start trip.') => {
    // A. Audio chime using Web Audio API (cross-platform, zero asset dependency)
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {}

    // B. Physical device vibration
    if (navigator.vibrate) {
      try { navigator.vibrate([200, 100, 200, 100, 300]); } catch (e) {}
    }

    // C. Post message to native React Native WebView app wrapper
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'CAPTAIN_ARRIVED_NOTIFICATION',
          title: customTitle,
          body: customBody,
          trackingId
        }));
      } catch (e) {}
    }

    // D. Android / Browser Notification Bar Alert
    if ('Notification' in window) {
      const targetUrl = window.location.pathname.startsWith('/customer') ? '/customer/notifications' : '/notifications';
      const showSystemNotification = () => {
        try {
          const notif = new Notification(customTitle, {
            body: customBody,
            icon: '/favicon.ico',
            tag: 'captain-arrived',
            requireInteraction: true
          });
          notif.onclick = () => {
            window.focus();
            navigate(targetUrl);
          };
        } catch (e) {}
      };

      if (Notification.permission === 'granted') {
        showSystemNotification();
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(perm => {
          if (perm === 'granted') showSystemNotification();
        }).catch(() => {});
      }
    }

    // E. Prominent In-App Heads-up Alert Banner
    setArrivalBannerText(customBody);
    setShowArrivalBanner(true);
  };

  useEffect(() => {
    if (trackingId) {
      fetchBooking();

      // Real-Time Socket Connection to track captain movement & acceptance
      const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
      const socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('join_tracking', { trackingId });
      });

      // INSTANT ACCEPTANCE UPDATE: When captain accepts, update map & route immediately without reload
      socket.on('rider_assigned', (data) => {
        if (data?.booking) {
          setBooking(data.booking);
        }
        if (data?.rider?.riderDetails?.currentLocation?.lat) {
          setRiderLocation({
            lat: Number(data.rider.riderDetails.currentLocation.lat),
            lng: Number(data.rider.riderDetails.currentLocation.lng)
          });
        }
        fetchBooking();
      });

      // Real-Time Order Status Transitions
      socket.on('order_status_update', (data) => {
        if (data?.status) {
          setBooking(prev => prev ? { ...prev, status: data.status } : prev);
        }
        fetchBooking();
      });

      // Real-Time Captain Arrived & Waiting Notification
      socket.on('captain_arrived_pickup', (data) => {
        triggerCaptainArrivedNotification(
          data?.title || '🔔 Captain is waiting for you!',
          data?.message || 'Your ZyperGo Captain has arrived at your pickup location. Share OTP to start trip.'
        );
        fetchBooking();
      });

      // Real-Time Live Moving Vehicle GPS Stream
      socket.on('rider_location', (data) => {
        if (data && data.lat && data.lng) {
          setRiderLocation({
            lat: Number(data.lat),
            lng: Number(data.lng)
          });
        }
      });

      // 5-second polling fallback to keep status synced
      const pollTimer = setInterval(fetchBooking, 5000);

      return () => {
        clearInterval(pollTimer);
        socket.disconnect();
      };
    } else {
      api.get('/bookings/my-shipments')
        .then(res => {
          const shipments = res.data?.data || [];
          setActiveShipments(shipments);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [trackingId]);

  // Fetch Swiggy/Rapido-Style Turn-by-Turn Road Route via OSRM
  useEffect(() => {
    if (!booking) return;

    const pLat = booking.pickupLocation?.lat ? Number(booking.pickupLocation.lat) : null;
    const pLng = booking.pickupLocation?.lng ? Number(booking.pickupLocation.lng) : null;
    const dLat = booking.dropLocation?.lat ? Number(booking.dropLocation.lat) : null;
    const dLng = booking.dropLocation?.lng ? Number(booking.dropLocation.lng) : null;

    const isPickupStageActive = ['Pending', 'Booking Confirmed', 'Rider Assigned', 'Rider On the Way', 'Arrived at Pickup'].includes(booking.status);

    let start = null;
    let end = null;

    if (riderLocation && riderLocation.lat && riderLocation.lng) {
      start = [riderLocation.lng, riderLocation.lat];
      end = isPickupStageActive ? [pLng, pLat] : [dLng, dLat];
    } else if (pLat && pLng && dLat && dLng) {
      start = [pLng, pLat];
      end = [dLng, dLat];
    }

    if (!start || !end || !start[0] || !start[1] || !end[0] || !end[1]) return;

    // Throttle OSRM calls: only refetch if start position moved > 25 meters
    if (lastFetchedPosRef.current) {
      const dist = calculateHaversineKm(lastFetchedPosRef.current.lat, lastFetchedPosRef.current.lng, start[1], start[0]);
      if (dist !== null && dist < 0.025 && routeCoordinates.length > 0) {
        return;
      }
    }

    lastFetchedPosRef.current = { lat: start[1], lng: start[0] };

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`;

    fetch(osrmUrl)
      .then(r => r.json())
      .then(data => {
        if (data?.routes?.[0]?.geometry?.coordinates?.length) {
          // OSRM coordinates are [lng, lat], Leaflet Polyline needs [lat, lng]
          const latLngs = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
          setRouteCoordinates(latLngs);
        } else {
          setRouteCoordinates([[start[1], start[0]], [end[1], end[0]]]);
        }
      })
      .catch(() => {
        // Fallback straight line if OSRM is unreachable
        setRouteCoordinates([[start[1], start[0]], [end[1], end[0]]]);
      });
  }, [riderLocation?.lat, riderLocation?.lng, booking?.status, booking?.pickupLocation?.lat, booking?.dropLocation?.lat]);

  // Monitor 100-Meter Geofence Distance for Captain Arrival
  useEffect(() => {
    if (!booking || hasNotifiedArrivalRef.current) return;

    const isPickupStageActive = ['Pending', 'Booking Confirmed', 'Rider Assigned', 'Rider On the Way', 'Arrived at Pickup'].includes(booking.status);
    if (!isPickupStageActive) return;

    const pLat = booking.pickupLocation?.lat ? Number(booking.pickupLocation.lat) : null;
    const pLng = booking.pickupLocation?.lng ? Number(booking.pickupLocation.lng) : null;

    if (riderLocation?.lat && riderLocation?.lng && pLat && pLng) {
      const distance = calculateHaversineKm(riderLocation.lat, riderLocation.lng, pLat, pLng);
      // Trigger notification when captain is within 100 meters (0.10 km) or marked Arrived
      if (distance !== null && (distance <= 0.10 || booking.status === 'Arrived at Pickup')) {
        hasNotifiedArrivalRef.current = true;
        triggerCaptainArrivedNotification();
      }
    }
  }, [riderLocation?.lat, riderLocation?.lng, booking?.status]);

  const handleShare = () => {
    const url = window.location.href;
    const text = `Track my ZyperGo parcel live! Tracking ID: ${booking?.trackingId}. Link: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getStatusBadge = (status = '') => {
    const s = status.toUpperCase();
    if (s.includes('CONFIRMED')) {
      return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-blue-50 text-[#0052CC]">Booking Confirmed</span>;
    }
    if (s.includes('ON THE WAY')) {
      return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-amber-50 text-amber-700 animate-pulse">Captain On the Way</span>;
    }
    if (s.includes('ARRIVED')) {
      return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-purple-50 text-purple-700">Arrived at Pickup</span>;
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

  if (!trackingId || !booking) {
    return (
      <div className="bg-[#F8FAFC] min-h-full font-sans pb-24 px-4 pt-4 max-w-md md:max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={() => {
                if (window.__handleAppBack) window.__handleAppBack();
                else if (window.history.length > 1) navigate(-1);
                else navigate('/dashboard');
              }}
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
                    <p className="text-[10px] text-slate-400 font-medium">Click to view live route &amp; timeline</p>
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

  // Target Location and Position Calculation
  const pickupLat = booking.pickupLocation?.lat ? Number(booking.pickupLocation.lat) : null;
  const pickupLng = booking.pickupLocation?.lng ? Number(booking.pickupLocation.lng) : null;
  const dropLat = booking.dropLocation?.lat ? Number(booking.dropLocation.lat) : null;
  const dropLng = booking.dropLocation?.lng ? Number(booking.dropLocation.lng) : null;

  const isPickupStage = ['Pending', 'Booking Confirmed', 'Rider Assigned', 'Rider On the Way', 'Arrived at Pickup'].includes(booking.status);
  const targetCoords = isPickupStage ? [pickupLat, pickupLng] : [dropLat, dropLng];
  const defaultCenter = (pickupLat && pickupLng) ? [pickupLat, pickupLng] : ((dropLat && dropLng) ? [dropLat, dropLng] : [17.3850, 78.4867]);

  // Dynamic Rapido-Style Real-Time ETA Computation
  let dynamicEta = '';
  let distanceKm = null;

  if (booking.status === 'Delivered') {
    dynamicEta = 'Delivered Successfully';
  } else if (riderLocation && riderLocation.lat && riderLocation.lng) {
    if (isPickupStage && pickupLat && pickupLng) {
      distanceKm = calculateHaversineKm(riderLocation.lat, riderLocation.lng, pickupLat, pickupLng);
      if (distanceKm !== null) {
        if (distanceKm <= 0.12 || booking.status === 'Arrived at Pickup') {
          dynamicEta = '⚡ Captain has arrived at pickup!';
        } else {
          const mins = Math.max(2, Math.round((distanceKm / 24) * 60));
          dynamicEta = `Arriving in ~${mins} mins (${distanceKm.toFixed(1)} km away)`;
        }
      }
    } else if (!isPickupStage && dropLat && dropLng) {
      distanceKm = calculateHaversineKm(riderLocation.lat, riderLocation.lng, dropLat, dropLng);
      if (distanceKm !== null) {
        if (distanceKm <= 0.15) {
          dynamicEta = '⚡ Arrived at destination!';
        } else {
          const mins = Math.max(3, Math.round((distanceKm / 25) * 60));
          dynamicEta = `Reaching destination in ~${mins} mins (${distanceKm.toFixed(1)} km away)`;
        }
      }
    }
  }

  // Fallback if rider hasn't broadcasted yet
  if (!dynamicEta) {
    if (['Pending', 'Booking Confirmed'].includes(booking.status)) {
      dynamicEta = 'Assigning Captain nearby (~5-10 mins)';
    } else if (['Rider Assigned', 'Rider On the Way'].includes(booking.status)) {
      dynamicEta = 'Captain on the way (~10-15 mins)';
    } else {
      dynamicEta = booking.eta || 'Express (~20-30 mins)';
    }
  }

  const steps = [
    { title: 'Booking Confirmed', done: true },
    { title: 'Picked Up', done: ['Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'].includes(booking.status) },
    { title: 'In Transit', done: ['In Transit', 'Out for Delivery', 'Delivered'].includes(booking.status) },
    { title: 'Out for Delivery', done: ['Out for Delivery', 'Delivered'].includes(booking.status) },
    { title: 'Delivered', done: booking.status === 'Delivered' }
  ];

  return (
    <div className="min-h-full bg-[#F8FAFC] font-sans pb-28 text-slate-900 animate-in fade-in">
      
      {/* Prominent 100-Meter Geofence Arrival Heads-Up Banner */}
      {showArrivalBanner && (
        <div className="fixed top-4 left-3 right-3 z-50 max-w-md mx-auto bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white p-3.5 rounded-2xl shadow-2xl border-2 border-emerald-300 animate-in slide-in-from-top duration-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 animate-bounce">
              <Bell size={18} className="text-white" />
            </div>
            <div>
              <h4 className="text-xs font-black tracking-wide">🔔 Captain Alert</h4>
              <p className="text-[10px] text-emerald-100 font-semibold leading-tight">{arrivalBannerText}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button 
              onClick={() => {
                const target = window.location.pathname.startsWith('/customer') ? '/customer/notifications' : '/notifications';
                navigate(target);
              }}
              className="px-2.5 py-1.5 bg-white text-emerald-800 text-[10px] font-black rounded-xl shadow-xs hover:bg-emerald-50 active:scale-95 transition-all cursor-pointer"
            >
              View
            </button>
            <button 
              onClick={() => setShowArrivalBanner(false)}
              className="w-6 h-6 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {/* Top Map View Area with Moving Rapido Captain Vehicle */}
      <div className="relative h-[260px] md:h-[340px] w-full shrink-0">
        <MapContainer center={defaultCenter} zoom={13} scrollWheelZoom={false} className="w-full h-full z-0">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Controller to keep vehicle and destination in frame */}
          <MapBoundsController 
            routeCoords={routeCoordinates}
            riderPos={riderLocation ? [riderLocation.lat, riderLocation.lng] : null}
            targetPos={(targetCoords[0] && targetCoords[1]) ? targetCoords : null}
            defaultPos={defaultCenter}
          />

          {/* Swiggy/Rapido-Style Turn-by-Turn Blue Road Polyline with Navigation Depth */}
          {routeCoordinates && routeCoordinates.length > 1 && (
            <>
              {/* Dark Navy Casing Border */}
              <Polyline 
                positions={routeCoordinates} 
                pathOptions={{ color: '#0F2942', weight: 6, opacity: 0.6, lineCap: 'round', lineJoin: 'round' }} 
              />
              {/* High-Visibility Vibrant Navigation Blue Core */}
              <Polyline 
                positions={routeCoordinates} 
                pathOptions={{ color: '#0052CC', weight: 4.5, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }} 
              />
            </>
          )}

          {/* Pickup Marker (Pin A) */}
          {pickupLat && pickupLng && (
            <Marker position={[pickupLat, pickupLng]} icon={pickupPinIcon}>
              <Popup>
                <div className="text-xs font-sans">
                  <p className="font-bold text-emerald-700">📍 Pickup Location (A)</p>
                  <p className="text-slate-600 mt-0.5">{booking.pickupLocation?.address || 'Pickup Point'}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Drop Location Marker (Pin B) */}
          {dropLat && dropLng && (
            <Marker position={[dropLat, dropLng]} icon={dropPinIcon}>
              <Popup>
                <div className="text-xs font-sans">
                  <p className="font-bold text-red-600">🎯 Drop Destination (B)</p>
                  <p className="text-slate-600 mt-0.5">{booking.dropLocation?.address || 'Drop Point'}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* LIVE MOVING VEHICLE (Rapido Captain Bike/Scooter Marker) */}
          {riderLocation && riderLocation.lat && riderLocation.lng && (
            <Marker position={[riderLocation.lat, riderLocation.lng]} icon={captainVehicleIcon}>
              <Popup>
                <div className="text-xs font-sans">
                  <p className="font-black text-[#0052CC] flex items-center gap-1">
                    <span>🏍️ {booking.currentRider?.name || 'ZyperGo Captain'}</span>
                  </p>
                  <p className="text-slate-500 text-[10px] mt-0.5 font-bold">🟢 Moving Live on Route</p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Floating Top Controls */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center pointer-events-none">
          <button 
            onClick={() => navigate(-1)} 
            className="pointer-events-auto w-9 h-9 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center shadow-md text-slate-700 hover:scale-105 active:scale-95 transition-all border border-slate-100 cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          
          <div className="bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md flex items-center gap-1.5 pointer-events-auto border border-slate-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="font-black text-[#0052CC] text-xs tracking-tight">Live Tracking</span>
          </div>

          <button 
            onClick={handleShare} 
            className="pointer-events-auto w-9 h-9 bg-[#0052CC] hover:bg-[#0047cc] rounded-full flex items-center justify-center shadow-md text-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      <div className="max-w-md md:max-w-4xl mx-auto px-4 -mt-6 relative z-20 space-y-4">
        
        {/* Status Card with Dynamic Real-Time Arrival Time (No Hardcoded 3 Days) */}
        <div className="bg-white rounded-3xl p-4.5 border border-slate-100 shadow-md">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tracking Number</p>
              <h2 className="text-base font-black text-slate-900 mt-0.5">#{booking.trackingId}</h2>
            </div>
            {getStatusBadge(booking.status)}
          </div>

          {/* Dynamic Real-Time ETA Box */}
          <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-2xl p-3.5 border border-blue-100/90 flex items-center justify-between shadow-2xs">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-[10px] font-black text-[#0052CC] uppercase tracking-wider">Estimated Arrival</p>
              </div>
              <p className="text-sm font-black text-slate-900 mt-0.5 tracking-tight">{dynamicEta}</p>
            </div>
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#0052CC] shadow-xs border border-blue-100">
              <Clock size={19} />
            </div>
          </div>

          {/* Permanent 4-Digit Pickup OTP Card */}
          {['Pending', 'Booking Confirmed', 'Rider Assigned', 'Rider On the Way', 'Arrived at Pickup'].includes(booking.status || 'Booking Confirmed') && (() => {
            let cachedOtp = null;
            try { cachedOtp = JSON.parse(localStorage.getItem('zypergo_user') || 'null')?.pickupOtp; } catch {}
            const pickupPin = booking.pickupOtp || booking.sender?.pickupOtp || cachedOtp || booking.proofOfDelivery?.otp || '1234';
            return (
              <div className="mt-3.5 bg-gradient-to-r from-amber-50 to-amber-100/90 rounded-2xl p-4 border-2 border-amber-300 text-center shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] uppercase tracking-widest">
                    START RIDE OTP
                  </span>
                  <span className="text-[10px] text-amber-800 font-bold">Share at pickup</span>
                </div>
                <div className="bg-white rounded-xl py-2 px-4 inline-block border border-amber-200 shadow-2xs my-1">
                  <span className="font-mono text-2xl font-black text-slate-950 tracking-[0.25em]">{pickupPin}</span>
                </div>
                <p className="text-[10px] font-bold text-amber-900 mt-1">
                  Share this 4-digit OTP with your Captain when he arrives at your pickup point
                </p>
              </div>
            );
          })()}

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

        {/* Assigned Captain Card with Call Action */}
        {booking.currentRider && (
          <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0052CC] font-black text-sm">
                {booking.currentRider.name?.charAt(0) || 'C'}
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">ZyperGo Captain</p>
                <p className="text-xs font-black text-slate-900">{booking.currentRider.name}</p>
                <p className="text-[10px] font-bold text-amber-500">★ 4.9 Verified Partner</p>
              </div>
            </div>
            {booking.currentRider.phone && (
              <a 
                href={`tel:${booking.currentRider.phone}`}
                className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 active:scale-95 transition-all shadow-xs"
              >
                <Phone size={17} />
              </a>
            )}
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
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Route &amp; Shipment</h3>
          
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5">
              <div className="w-3 h-3 rounded-full bg-emerald-600 mt-0.5 shrink-0 flex items-center justify-center text-[7px] text-white font-black">A</div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Pickup Location</p>
                <p className="text-xs font-bold text-slate-800">{booking.pickupLocation?.address || booking.pickupLocation?.city}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2.5">
              <div className="w-3 h-3 rounded-full bg-red-600 mt-0.5 shrink-0 flex items-center justify-center text-[7px] text-white font-black">B</div>
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
