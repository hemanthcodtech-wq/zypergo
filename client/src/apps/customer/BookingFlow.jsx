import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, MapPin, Package, CheckCircle2, ChevronDown, ChevronRight, Check, Truck, Zap, 
  Calendar as CalendarIcon, FileText, AlertCircle, X, Bike, Car, CarFront, 
  Map, Bookmark, Home, Building2, Search, Navigation, Sparkles, Info, Clock,
  Users, Minus, Plus, Phone
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet icon path issues
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;
import api from '../../api';
import { reverseGeocode, searchPlaces, forwardGeocode } from '../../utils/locationService';
import { sanitizeDigits, handleNumericKeyDown } from '../../utils/inputValidation';
import { openRazorpayCheckout } from '../../utils/razorpayCheckout';
import { VEHICLE_IMAGES } from '../../assets/vehicleImagesDataUri';

// Helper component for tracking map movements
function MapCenterTracker({ onMoveEnd }) {
  const map = useMapEvents({
    moveend() {
      const center = map.getCenter();
      onMoveEnd(center.lat, center.lng);
    }
  });
  return null;
}

// Rapido-Style Captain marker icons
const createCaptainIcon = (heading = 45) => {
  return L.divIcon({
    className: 'custom-captain-icon',
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

const createPickupMarkerIcon = () => {
  return L.divIcon({
    className: 'pickup-marker-icon',
    html: `
      <div class="relative flex flex-col items-center">
        <div class="w-8 h-8 rounded-full bg-[#0052CC] border-2 border-white shadow-lg flex items-center justify-center text-white font-black text-xs">
          📍
        </div>
        <div class="w-2 h-2 bg-[#0052CC] rotate-45 -mt-1"></div>
      </div>
    `,
    iconSize: [32, 36],
    iconAnchor: [16, 36]
  });
};

const createDropMarkerIcon = () => {
  return L.divIcon({
    className: 'drop-marker-icon',
    html: `
      <div class="relative flex flex-col items-center">
        <div class="w-8 h-8 rounded-full bg-emerald-600 border-2 border-white shadow-lg flex items-center justify-center text-white font-black text-xs">
          🏁
        </div>
        <div class="w-2 h-2 bg-emerald-600 rotate-45 -mt-1"></div>
      </div>
    `,
    iconSize: [32, 36],
    iconAnchor: [16, 36]
  });
};

function MapFitBounds({ pickup, drop }) {
  const map = useMap();
  useEffect(() => {
    if (
      Array.isArray(pickup) &&
      Array.isArray(drop) &&
      Number.isFinite(pickup[0]) &&
      Number.isFinite(pickup[1]) &&
      Number.isFinite(drop[0]) &&
      Number.isFinite(drop[1])
    ) {
      if (pickup[0] === drop[0] && pickup[1] === drop[1]) {
        map.setView(pickup, 14);
      } else {
        const bounds = L.latLngBounds([pickup, drop]);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }
    }
  }, [pickup, drop, map]);
  return null;
}

// Helper component to smoothly fly map to new coordinates
function MapFlyTo({ targetCoords }) {
  const map = useMap();
  useEffect(() => {
    if (targetCoords && targetCoords[0] && targetCoords[1]) {
      map.flyTo(targetCoords, 16, { animate: true, duration: 0.8 });
    }
  }, [targetCoords, map]);
  return null;
}

const DELIVERY_VEHICLES = [
  {
    id: 'Scooter',
    displayName: 'Scooter',
    weightLabel: 'Up to 20 kg',
    maxKg: 20,
    eta: '10 mins',
    img: VEHICLE_IMAGES['bike.png'],
    dimensions: '45 × 35 × 35 cm',
    bestFor: 'Documents, food boxes & small urgent parcels',
    baseFare: 60,
    perKm: 6
  },
  {
    id: 'Mini 3W',
    displayName: 'Mini 3W',
    weightLabel: 'Up to 90 kg',
    maxKg: 90,
    eta: '1 min',
    img: VEHICLE_IMAGES['miniAuto.png'],
    dimensions: '110 × 90 × 90 cm',
    bestFor: 'Multiple cartons & medium home appliances',
    baseFare: 90,
    perKm: 9
  },
  {
    id: '3 Wheeler',
    displayName: '3 Wheeler',
    weightLabel: 'Up to 500 kg',
    maxKg: 500,
    eta: '3 mins',
    img: VEHICLE_IMAGES['3 wheeler.png'],
    dimensions: '170 × 125 × 125 cm',
    bestFor: 'Bulk retail stock & wholesale crates',
    baseFare: 180,
    perKm: 13
  },
  {
    id: 'Tata Ace',
    displayName: 'Tata Ace',
    weightLabel: 'Up to 750 kg',
    maxKg: 750,
    eta: '10 mins',
    img: VEHICLE_IMAGES['tataace.png'],
    dimensions: '215 × 145 × 140 cm',
    bestFor: 'Home shifting, furniture & commercial goods',
    baseFare: 280,
    perKm: 16
  },
  {
    id: 'Pickup 8ft',
    displayName: 'Pickup 8ft',
    weightLabel: 'Up to 1200 kg',
    maxKg: 1200,
    eta: '10 mins',
    img: VEHICLE_IMAGES['pickup8ft.png'],
    dimensions: '245 × 150 × 150 cm',
    bestFor: 'Hardware, machinery & distributor dispatches',
    baseFare: 420,
    perKm: 20
  },
  {
    id: 'Pickup 9ft',
    displayName: 'Pickup 9ft',
    weightLabel: 'Up to 1700 kg',
    maxKg: 1700,
    eta: '9 mins',
    img: VEHICLE_IMAGES['9ft.png'],
    dimensions: '275 × 160 × 160 cm',
    bestFor: 'Heavy B2B cargo & warehouse transfers',
    baseFare: 520,
    perKm: 24
  },
  {
    id: '14ft',
    displayName: '14ft Truck',
    weightLabel: 'Up to 3500 kg',
    maxKg: 3500,
    eta: '12 mins',
    img: VEHICLE_IMAGES['14ft.png'],
    dimensions: '425 × 200 × 200 cm',
    bestFor: 'Large industrial freight & full loads',
    baseFare: 780,
    perKm: 32
  },
  {
    id: '17ft',
    displayName: '17ft Truck',
    weightLabel: 'Up to 6000 kg',
    maxKg: 6000,
    eta: '15 mins',
    img: VEHICLE_IMAGES['17ft.png'],
    dimensions: '520 × 215 × 215 cm',
    bestFor: 'Heavy intercity/intracity truckloads',
    baseFare: 1200,
    perKm: 40
  }
];

function calcDistanceKm(c1, c2) {
  if (!Array.isArray(c1) || !Array.isArray(c2) || !c1[0] || !c2[0]) return 5;
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(c2[0] - c1[0]);
  const dLng = toRad(c2[1] - c1[1]);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(c1[0])) * Math.cos(toRad(c2[0])) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return Math.max(1, Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))));
}

function getRecommendedVehicle(weightStr) {
  const w = parseFloat(weightStr) || 5;
  return DELIVERY_VEHICLES.find((v) => v.maxKg >= w) || DELIVERY_VEHICLES[DELIVERY_VEHICLES.length - 1];
}

function getVehicleEstimatedPrice(vehicleObj, distanceKm) {
  const extraKm = Math.max(0, (distanceKm || 5) - 5);
  return Math.round(vehicleObj.baseFare + extraKm * vehicleObj.perKm);
}

function BookingHeader({ title, onBack }) {
  return (
    <div className="sticky top-0 z-20 bg-white shadow-sm border-b border-slate-100 flex items-center justify-between px-4 py-3.5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-1 -ml-1 text-slate-700 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-black text-slate-900">{title}</h1>
      </div>
    </div>
  );
}

export default function BookingFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookingResult, setBookingResult] = useState(null);
  const [estimatedFare, setEstimatedFare] = useState(60);
  const [fareBreakdown, setFareBreakdown] = useState(null);
  const [vehicleDetailModal, setVehicleDetailModal] = useState(null);
  const [assignCountdown, setAssignCountdown] = useState(120);
  const [liveBookingState, setLiveBookingState] = useState(null);

  // Rapido-Style Captain Assignment Timer & Auto Polling
  useEffect(() => {
    if (step !== 4 || !bookingResult?._id) return;
    setAssignCountdown(120);

    const timer = setInterval(() => {
      setAssignCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    const pollInterval = setInterval(async () => {
      try {
        const res = await api.get(`/bookings/${bookingResult._id}`);
        if (res.data?.success && res.data?.data) {
          const fresh = res.data.data;
          setLiveBookingState(fresh);
          const isAssigned = 
            ['Rider Assigned', 'Rider On the Way', 'Arrived at Pickup', 'Picked Up', 'In Transit', 'Out for Delivery'].includes(fresh.status) ||
            (Array.isArray(fresh.assignedRiders) && fresh.assignedRiders.length > 0) ||
            fresh.currentRider;
          if (isAssigned) {
            setBookingResult(fresh);
          }
        }
      } catch (e) {}
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(pollInterval);
    };
  }, [step, bookingResult?._id]);
  
  // Rapido-Style Map Picker Modal State
  const [mapModal, setMapModal] = useState({ show: false, targetField: '' });
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [flyTarget, setFlyTarget] = useState(null);
  const [tempLocation, setTempLocation] = useState(null);
  const [userLocation, setUserLocation] = useState([17.3850, 78.4867]);
  const [pickupCoords, setPickupCoords] = useState([17.3850, 78.4867]);
  const [dropCoords, setDropCoords] = useState([17.4120, 78.5040]);
  const [realNearbyCaptains, setRealNearbyCaptains] = useState([]);

  // Live polling of real-time online nearby captains from database
  useEffect(() => {
    if (!pickupCoords || !pickupCoords[0] || !pickupCoords[1]) return;
    let isMounted = true;

    const fetchRealCaptains = async () => {
      try {
        const res = await api.get(`/rider/nearby?lat=${pickupCoords[0]}&lng=${pickupCoords[1]}&radius=15`);
        if (isMounted && res.data?.success) {
          setRealNearbyCaptains(res.data.data || []);
        }
      } catch (err) {
        // Silently handle network error
      }
    };

    fetchRealCaptains();
    const interval = setInterval(fetchRealCaptains, 12000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [pickupCoords[0], pickupCoords[1]]);

  const [showPayment, setShowPayment] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentError, setPaymentError] = useState('');
  
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [savedAddressModal, setSavedAddressModal] = useState({ show: false, targetField: '' });

  const currentUser = JSON.parse(localStorage.getItem('zypergo_user') || '{}');

  const [formData, setFormData] = useState({
    // Step 0: Service Type
    serviceType: '',
    // Step 1: Book Parcel
    pickupAddress: 'Locating...',
    dropAddress: '',
    receiverName: '',
    receiverPhone: '',
    weight: '',
    parcelType: '',
    fragile: false,
    cashOnDelivery: false,
    
    // Step 2: Vehicle & Helpers
    vehicle: 'Scooter',
    helpersNeeded: false,
    helperWorkType: 'Both Load & Unload', // 'Load Only', 'Unload Only', 'Both Load & Unload'
    helperCount: 1,
    
    // Step 3: Schedule
    pickupDate: 'Today',
    pickupTimeSlot: '9 AM - 12 PM',
    instructions: ''
  });

  useEffect(() => {
    // 1. First check if customer has a saved location
    const savedPin = localStorage.getItem('zypergo_customer_location');
    if (savedPin) {
      try {
        const parsed = JSON.parse(savedPin);
        if (parsed.formattedAddress) {
          setFormData(prev => ({ ...prev, pickupAddress: parsed.formattedAddress }));
          if (parsed.lat && parsed.lng) {
            setUserLocation([parsed.lat, parsed.lng]);
            setPickupCoords([parsed.lat, parsed.lng]);
          }
          return;
        }
      } catch (e) {}
    }

    // 2. Otherwise auto-detect via GPS & reverseGeocode
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          const loc = await reverseGeocode(latitude, longitude);
          setFormData(prev => ({
            ...prev,
            pickupAddress: loc?.formattedAddress || `${latitude}, ${longitude}`
          }));
        } catch (error) {
          setFormData(prev => ({ ...prev, pickupAddress: 'Location Unavailable' }));
        }
      }, () => {
        setFormData(prev => ({ ...prev, pickupAddress: 'Manual Entry Required' }));
      }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    } else {
      setFormData(prev => ({ ...prev, pickupAddress: 'Manual Entry Required' }));
    }

    // Fetch Saved Addresses
    const fetchSavedAddresses = async () => {
      if (currentUser.id) {
        try {
          const res = await api.get(`/addresses/${currentUser.id}`);
          if (res.data) setSavedAddresses(res.data);
        } catch (err) {
          console.error("Failed to fetch saved addresses:", err);
        }
      }
    };
    fetchSavedAddresses();
  }, []);

  const getIconForType = (type) => {
    if (type?.toLowerCase().includes('office') || type?.toLowerCase().includes('work')) return <Building2 size={20} className="text-[#006D77]" />;
    if (type?.toLowerCase().includes('home')) return <Home size={20} className="text-[#006D77]" />;
    return <MapPin size={20} className="text-[#006D77]" />;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextValue = name === 'receiverPhone' ? sanitizeDigits(value, 10) : value;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : nextValue
    }));
  };

  useEffect(() => {
    const selectedVeh = DELIVERY_VEHICLES.find((v) => v.id === formData.vehicle) || DELIVERY_VEHICLES[0];
    const distKm = calcDistanceKm(pickupCoords, dropCoords);
    setEstimatedFare(getVehicleEstimatedPrice(selectedVeh, distKm));

    // Fetch estimated fare breakdown from the backend pricing engine when available
    const fetchEstimate = async () => {
      try {
        const basePayload = {
          originCity: (formData.pickupAddress || '').split(',')[0]?.trim() || 'Unknown',
          destCity: (formData.dropAddress || '').split(',')[0]?.trim() || 'Unknown',
          distanceKm: distKm,
          actualWeight: parseInt(formData.weight) || 5,
          category: formData.parcelType || 'General Parcel',
          speed: 'Standard'
        };
        
        const res = await api.post('/bookings/estimate', { ...basePayload, vehicle: formData.vehicle });
        if (res.data.success && res.data.data?.breakdown) {
          setFareBreakdown(res.data.data.breakdown);
        }
      } catch (err) {
        console.error("Failed to estimate fare:", err);
      }
    };
    
    if (formData.dropAddress) {
      fetchEstimate();
    }
  }, [formData.weight, formData.parcelType, formData.vehicle, formData.pickupAddress, formData.dropAddress, pickupCoords, dropCoords]);

  const submitBooking = async (paymentDetails = null) => {
    setError('');
    setLoading(true);

    try {
      const isOutstation = formData.serviceType === 'Outstation';
      const largeTruckList = ['Tata Ace', 'Pickup 8ft', 'Pickup 9ft', '14ft Truck', '17ft Truck'];
      const isOutstationLargeTruck = isOutstation && largeTruckList.includes(formData.vehicle);
      const helperRate = (formData.helperWorkType === 'Both Load & Unload' || formData.helperWorkType === 'Load & Unload') ? 350 : 200;
      const calculatedHelperFee = formData.helpersNeeded ? (Number(formData.helperCount) || 1) * helperRate : 0;
      const totalBookingAmount = estimatedFare + calculatedHelperFee;

      const payload = {
        pickupLocation: { 
          address: formData.pickupAddress, 
          pincode: '560004'
        },
        dropLocation: { 
          address: formData.dropAddress || 'Mysore, Karnataka 570001', 
          pincode: '570001'
        },
        sender: currentUser._id || currentUser.id || undefined,
        senderDetails: { 
          name: currentUser.name || 'John Doe', 
          phone: currentUser.phone || '9876543210',
          email: currentUser.email || undefined
        },
        receiver: { 
          name: formData.receiverName, 
          phone: formData.receiverPhone
        },
        packageDetails: {
          category: formData.parcelType || 'General Parcel', 
          weight: parseInt(formData.weight) || 5, 
          fragile: formData.fragile,
          value: 0,
          description: `Packaging: ${formData.securePackaging ? 'Secure' : 'Standard'}`,
          prohibitedDeclared: true
        },
        scheduling: { 
          type: 'Later', 
          date: formData.pickupDate, 
          timeSlot: formData.pickupTimeSlot 
        },
        preferences: { 
          speed: 'Standard', 
          handlingNotes: formData.instructions 
        },
        metadata: {
          vehicleType: formData.vehicle,
          deliveryType: isOutstationLargeTruck ? 'Direct Dedicated Intercity' : (formData.serviceType === 'Outstation' ? 'Intercity Hub-and-Spoke' : 'Within City')
        },
        deliveryMode: isOutstationLargeTruck ? 'DIRECT_DEDICATED' : (formData.serviceType === 'Outstation' ? 'HUB_RELAY' : 'DIRECT_INTRACITY'),
        helpers: {
          needed: Boolean(formData.helpersNeeded),
          count: formData.helpersNeeded ? (Number(formData.helperCount) || 1) : 0,
          workType: formData.helpersNeeded ? formData.helperWorkType : 'None',
          ratePerHelper: formData.helpersNeeded ? (formData.helperWorkType === 'Both Load & Unload' ? 350 : 200) : 0,
          totalFee: calculatedHelperFee
        },
        pricing: {
          total: totalBookingAmount,
          helperFee: calculatedHelperFee
        },
        payment: { 
          mode: formData.cashOnDelivery ? 'Cash' : (paymentDetails?.mode || paymentMethod || 'UPI'), 
          payer: formData.cashOnDelivery ? 'Receiver' : 'Sender',
          ...(paymentDetails?.razorpay_payment_id ? {
            status: 'Completed',
            transactionId: paymentDetails.razorpay_payment_id,
            razorpayOrderId: paymentDetails.razorpay_order_id,
            razorpayPaymentId: paymentDetails.razorpay_payment_id,
            razorpaySignature: paymentDetails.razorpay_signature
          } : {})
        }
      };

      const response = await api.post('/bookings', payload);
      const createdBooking = response.data.data;
      if (createdBooking?.pickupOtp && currentUser && !currentUser.pickupOtp) {
        const updatedUser = { ...currentUser, pickupOtp: createdBooking.pickupOtp };
        localStorage.setItem('zypergo_user', JSON.stringify(updatedUser));
      }
      setBookingResult(createdBooking);
      setStep(4);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async () => {
    if (!bookingResult || !bookingResult._id) return;
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    setLoading(true);
    try {
      const res = await api.post(`/bookings/${bookingResult._id}/cancel`);
      if (res.data.success) {
        alert('Order cancelled successfully.');
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to cancel booking.');
    } finally {
      setLoading(false);
    }
  };

  // Rapido Map Picker Handlers
  const openMapPicker = (targetField) => {
    const currentVal = formData[targetField];
    setMapSearchQuery('');
    setSearchResults([]);
    setResolvedAddress(currentVal && currentVal !== 'Locating...' ? currentVal : '');
    setTempLocation({ lat: userLocation[0], lng: userLocation[1] });
    setFlyTarget([userLocation[0], userLocation[1]]);
    setMapModal({ show: true, targetField });
  };

  const handleMapSearchChange = async (query) => {
    setMapSearchQuery(query);
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchPlaces(query);
      setSearchResults(results || []);
    } catch (err) {
      console.warn("Places search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = async (item) => {
    setSearchResults([]);
    setMapSearchQuery(item.mainText || item.text);
    if (item.lat && item.lng) {
      setFlyTarget([item.lat, item.lng]);
      setTempLocation({ lat: item.lat, lng: item.lng });
      setResolvedAddress(item.text);
      if (mapModal.targetField === 'pickupAddress') {
        setPickupCoords([item.lat, item.lng]);
      } else if (mapModal.targetField === 'dropAddress') {
        setDropCoords([item.lat, item.lng]);
      }
      return;
    }
    try {
      setIsResolving(true);
      const geo = await forwardGeocode(item.text);
      if (geo && geo.lat && geo.lng) {
        setFlyTarget([geo.lat, geo.lng]);
        setTempLocation({ lat: geo.lat, lng: geo.lng });
        setResolvedAddress(geo.formattedAddress || item.text);
        if (mapModal.targetField === 'pickupAddress') {
          setPickupCoords([geo.lat, geo.lng]);
        } else if (mapModal.targetField === 'dropAddress') {
          setDropCoords([geo.lat, geo.lng]);
        }
      }
    } catch (err) {
      console.error('Forward geocode failed:', err);
    } finally {
      setIsResolving(false);
    }
  };

  const handleMapMoveEnd = async (lat, lng) => {
    setTempLocation({ lat, lng });
    try {
      setIsResolving(true);
      const loc = await reverseGeocode(lat, lng);
      if (loc && loc.formattedAddress) {
        setResolvedAddress(loc.formattedAddress);
      } else {
        setResolvedAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    } catch (e) {
      setResolvedAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setIsResolving(false);
    }
  };

  const handleRecenterToGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation([latitude, longitude]);
        setFlyTarget([latitude, longitude]);
        handleMapMoveEnd(latitude, longitude);
      });
    }
  };

  const handleConfirmMapLocation = () => {
    if (resolvedAddress) {
      setFormData(prev => ({ ...prev, [mapModal.targetField]: resolvedAddress }));
    } else if (tempLocation) {
      setFormData(prev => ({ ...prev, [mapModal.targetField]: `${tempLocation.lat.toFixed(5)}, ${tempLocation.lng.toFixed(5)}` }));
    }
    if (tempLocation) {
      if (mapModal.targetField === 'pickupAddress') {
        setPickupCoords([tempLocation.lat, tempLocation.lng]);
      } else if (mapModal.targetField === 'dropAddress') {
        setDropCoords([tempLocation.lat, tempLocation.lng]);
      }
    }
    setMapModal({ show: false, targetField: '' });
  };

  const handleClose = () => {
    if (window.__handleAppBack) {
      window.__handleAppBack();
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  const handleHeaderBack = () => {
    if (step > 1 && step < 4) {
      setStep(step - 1);
    } else if (step === 1) {
      setStep(0);
    } else {
      handleClose();
    }
  };

  return (
    <div className="bg-slate-50 min-h-full flex flex-col font-sans relative">
      <div className="w-full flex-1 bg-white flex flex-col relative mx-auto">
      
      {step === 0 && (
        <div 
          onClick={handleClose}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-[2.5rem] w-full p-6 pb-8 shadow-2xl relative animate-in slide-in-from-bottom duration-300"
          >
            <button 
              type="button"
              onClick={handleClose} 
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors cursor-pointer"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
            <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Choose your service</h2>
            
            <div className="space-y-3.5 mb-2">
              <button 
                type="button"
                onClick={() => { setFormData(prev => ({...prev, serviceType: 'Within City'})); setStep(1); }}
                className="w-full bg-white border border-slate-200/80 hover:border-blue-200 hover:shadow-md rounded-2xl p-3.5 flex items-center justify-between transition-all group active:scale-[0.98] cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-13 bg-[#F0F5FF] rounded-2xl flex items-center justify-center shrink-0">
                     <Truck size={24} className="text-[#0052CC]" strokeWidth={2} />
                  </div>
                  <span className="font-black text-base text-slate-800 tracking-tight">Within City</span>
                </div>
                <ChevronDown size={18} className="text-slate-400 group-hover:text-blue-500 -rotate-90 transition-colors mr-2" />
              </button>

              <button 
                type="button"
                onClick={() => { setFormData(prev => ({...prev, serviceType: 'Outstation'})); setStep(1); }}
                className="w-full bg-white border border-slate-200/80 hover:border-green-200 hover:shadow-md rounded-2xl p-3.5 flex items-center justify-between transition-all group active:scale-[0.98] cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-13 bg-[#F0FDF4] rounded-2xl flex items-center justify-center shrink-0">
                     <Map size={24} className="text-green-600" strokeWidth={2} />
                  </div>
                  <span className="font-black text-base text-slate-800 tracking-tight">Outstation</span>
                </div>
                <ChevronDown size={18} className="text-slate-400 group-hover:text-green-600 -rotate-90 transition-colors mr-2" />
              </button>
            </div>
          </div>
        </div>
      )}

      {(step === 0 || step === 1) && (
        <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-300">
          <BookingHeader title={`Book Parcel ${formData.serviceType ? `(${formData.serviceType})` : ''}`} onBack={handleHeaderBack} />
          
          <div className="p-4 flex-1 overflow-y-auto pb-24 space-y-4">
            <div>
              {/* Rapido-Style From/To Address Box with Dedicated Choose from Map Buttons */}
              <div className="border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm bg-white">
                
                {/* Pickup Address */}
                <div className="relative pl-8 pb-5 border-b border-slate-100">
                  <div className="absolute left-0 top-1 w-6 h-6 flex items-center justify-center">
                    <MapPin size={16} className="text-[#0052CC]" />
                  </div>
                  <div className="absolute left-3 top-7 bottom-3 w-px bg-slate-200 border-dashed border-l-2"></div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">From (Pickup Location)</p>
                  
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      name="pickupAddress"
                      value={formData.pickupAddress}
                      onChange={handleChange}
                      className="w-full font-bold text-sm text-slate-800 outline-none" 
                      placeholder="Pickup address..."
                    />
                    <button 
                      type="button"
                      onClick={() => { setSavedAddressModal({ show: true, targetField: 'pickupAddress' }); }} 
                      className="text-[#FFB703] p-2 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors shrink-0" 
                      title="Saved Addresses"
                    >
                      <Bookmark size={16}/>
                    </button>
                    <button 
                      type="button"
                      onClick={() => openMapPicker('pickupAddress')} 
                      className="text-[#0052CC] p-2 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors shrink-0" 
                      title="Choose on Map"
                    >
                      <Map size={16}/>
                    </button>
                  </div>

                  {/* Prominent Rapido-Style "Choose from Map" Button */}
                  <div className="mt-2.5 flex items-center gap-2">
                    <button 
                      type="button" 
                      onClick={() => openMapPicker('pickupAddress')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#0052CC] text-xs font-black transition-all active:scale-95 cursor-pointer shadow-2xs"
                    >
                      <Map size={13} className="text-[#0052CC]" />
                      <span>Choose from Map</span>
                    </button>
                    <span className="text-[11px] text-slate-400 font-bold">or drag pin directly</span>
                  </div>
                </div>

                {/* Drop Address */}
                <div className="relative pl-8 pt-4">
                  <div className="absolute left-0 top-5 w-6 h-6 flex items-center justify-center">
                     <div className="w-2.5 h-2.5 bg-[#FF6B00] rounded-full ring-4 ring-orange-100"></div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">To (Drop Location)</p>
                  
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      name="dropAddress"
                      value={formData.dropAddress}
                      onChange={handleChange}
                      className="w-full font-bold text-sm text-slate-800 outline-none placeholder:text-slate-300" 
                      placeholder="Drop address..."
                    />
                    <button 
                      type="button"
                      onClick={() => { setSavedAddressModal({ show: true, targetField: 'dropAddress' }); }} 
                      className="text-[#FFB703] p-2 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors shrink-0" 
                      title="Saved Addresses"
                    >
                      <Bookmark size={16}/>
                    </button>
                    <button 
                      type="button"
                      onClick={() => openMapPicker('dropAddress')} 
                      className="text-[#FF6B00] p-2 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors shrink-0" 
                      title="Choose on Map"
                    >
                      <Map size={16}/>
                    </button>
                  </div>

                  {/* Prominent Rapido-Style "Choose from Map" Button */}
                  <div className="mt-2.5 flex items-center gap-2">
                    <button 
                      type="button" 
                      onClick={() => openMapPicker('dropAddress')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-[#FF6B00] text-xs font-black transition-all active:scale-95 cursor-pointer shadow-2xs"
                    >
                      <Map size={13} className="text-[#FF6B00]" />
                      <span>Choose from Map</span>
                    </button>
                    <span className="text-[11px] text-slate-400 font-bold">or drag pin directly</span>
                  </div>
                </div>

              </div>
            </div>
            
            <div className="md:col-span-1">

            {/* Recipient Details */}
            <h3 className="text-sm font-black text-slate-900 mb-3">Recipient Details</h3>
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <input 
                  type="text" 
                  name="receiverName"
                  value={formData.receiverName}
                  onChange={handleChange}
                  placeholder="Recipient Name"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 shadow-sm bg-slate-50 font-bold text-sm outline-none focus:border-[#0052CC]"
                />
              </div>
              <div className="flex-1">
                <input 
                  type="tel" 
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  name="receiverPhone"
                  value={formData.receiverPhone}
                  onChange={handleChange}
                  onKeyDown={(e) => handleNumericKeyDown(e, formData.receiverPhone, 10)}
                  placeholder="10-digit Mobile Number"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 shadow-sm bg-slate-50 font-bold text-sm outline-none focus:border-[#0052CC]"
                />
                {formData.receiverPhone.length > 0 && formData.receiverPhone.length < 10 && (
                  <p className="text-[10px] font-bold text-amber-600 mt-1">Enter 10 digits ({formData.receiverPhone.length}/10)</p>
                )}
              </div>
            </div>

            {/* Parcel Details */}
            <h3 className="text-sm font-black text-slate-900 mb-3">Parcel Details</h3>
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Weight</label>
                <div className="relative border border-slate-200 rounded-xl px-4 py-3 shadow-sm bg-slate-50">
                  <select name="weight" value={formData.weight} onChange={handleChange} className={`w-full bg-transparent font-bold text-sm outline-none appearance-none pr-6 ${!formData.weight ? 'text-slate-400' : 'text-slate-800'}`}>
                    <option value="" disabled hidden>Select</option>
                    <option value="1 kg" className="text-slate-800">1 kg (Document)</option>
                    <option value="5 kg" className="text-slate-800">Up to 5 kg (Small)</option>
                    <option value="20 kg" className="text-slate-800">Up to 20 kg (Scooter)</option>
                    <option value="90 kg" className="text-slate-800">Up to 90 kg (Mini 3W)</option>
                    <option value="500 kg" className="text-slate-800">Up to 500 kg (3 Wheeler)</option>
                    <option value="750 kg" className="text-slate-800">Up to 750 kg (Tata Ace)</option>
                    <option value="1200 kg" className="text-slate-800">Up to 1200 kg (Pickup 8ft)</option>
                    <option value="1700 kg" className="text-slate-800">Up to 1700 kg (Pickup 9ft)</option>
                    <option value="3500 kg" className="text-slate-800">Up to 3500 kg (14ft)</option>
                    <option value="6000 kg" className="text-slate-800">Up to 6000 kg (17ft)</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Parcel Type</label>
                <div className="relative border border-slate-200 rounded-xl px-4 py-3 shadow-sm bg-slate-50">
                  <select name="parcelType" value={formData.parcelType} onChange={handleChange} className={`w-full bg-transparent font-bold text-sm outline-none appearance-none pr-6 ${!formData.parcelType ? 'text-slate-400' : 'text-slate-800'}`}>
                    <option value="" disabled hidden>Select</option>
                    <option value="General Parcel" className="text-slate-800">General Parcel</option>
                    <option value="Box" className="text-slate-800">Box</option>
                    <option value="Document" className="text-slate-800">Document</option>
                    <option value="Clothes" className="text-slate-800">Clothes</option>
                    <option value="Electronics" className="text-slate-800">Electronics</option>
                    <option value="Furniture" className="text-slate-800">Furniture</option>
                    <option value="Appliances" className="text-slate-800">Appliances</option>
                    <option value="Industrial Goods" className="text-slate-800">Industrial Goods</option>
                    <option value="Construction Material" className="text-slate-800">Construction Material</option>
                    <option value="Food & Perishables" className="text-slate-800">Food & Perishables</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Additional Services */}
            <h3 className="text-sm font-black text-slate-900 mb-3">Additional Services</h3>
            <div className="space-y-3 mb-8">
              <ToggleRow icon={<AlertCircle size={18} className="text-[#FFB703]" />} label="Fragile Handling" name="fragile" checked={formData.fragile} onChange={handleChange} />
              <ToggleRow icon={<Package size={18} className="text-[#0052CC]" />} label="Secure Packaging" name="securePackaging" checked={formData.securePackaging} onChange={handleChange} />
              <ToggleRow icon={<FileText size={18} className="text-emerald-500" />} label="Cash on Delivery" name="cashOnDelivery" checked={formData.cashOnDelivery} onChange={handleChange} />
            </div>

            </div>
          </div>
          
          <div className="p-4 border-t border-slate-100 bg-white mt-auto">
             <button 
                type="button"
                onClick={() => {
                  const recommended = getRecommendedVehicle(formData.weight);
                  setFormData((prev) => ({ ...prev, vehicle: recommended.id }));
                  setStep(2);
                }}
                disabled={!formData.dropAddress || !formData.receiverName || formData.receiverPhone.length !== 10 || !formData.weight || !formData.parcelType}
                className="w-full bg-[#0052CC] text-white font-black py-4 rounded-xl shadow-[0_8px_20px_-6px_rgba(0,82,204,0.5)] disabled:opacity-50 transition-all hover:bg-blue-700 active:scale-[0.98] cursor-pointer"
              >
               Continue
             </button>
          </div>
        </div>
      )}

      {step === 2 && (() => {
        const distanceKm = calcDistanceKm(pickupCoords, dropCoords);
        const recommendedVehicle = getRecommendedVehicle(formData.weight);
        const selectedVehicle = DELIVERY_VEHICLES.find((v) => v.id === formData.vehicle) || recommendedVehicle;
        const selectedPrice = getVehicleEstimatedPrice(selectedVehicle, distanceKm);

        return (
          <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300 bg-[#F8FAFC]">
            <BookingHeader title="Choose Your Delivery Vehicle" onBack={handleHeaderBack} />

            {/* Live Route Map with Nearby Captains */}
            <div className="relative w-full h-[185px] shrink-0 border-b border-slate-200 bg-slate-100 overflow-hidden shadow-xs">
              <MapContainer
                center={pickupCoords}
                zoom={14}
                zoomControl={false}
                attributionControl={false}
                style={{ height: '100%', width: '100%', zIndex: 0 }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapFitBounds pickup={pickupCoords} drop={dropCoords} />

                <Polyline
                  positions={[pickupCoords, dropCoords]}
                  color="#0052CC"
                  weight={4}
                  opacity={0.85}
                  dashArray="6, 8"
                />

                <Marker position={pickupCoords} icon={createPickupMarkerIcon()} />
                <Marker position={dropCoords} icon={createDropMarkerIcon()} />

                {realNearbyCaptains.map((c, idx) => (
                  <Marker
                    key={c.id || idx}
                    position={[c.lat, c.lng]}
                    icon={createCaptainIcon(45 + (idx * 60) % 360)}
                  >
                    <Popup>
                      <div className="text-xs p-1">
                        <p className="font-black text-slate-900">{c.name}</p>
                        <p className="text-slate-500 text-[11px]">{c.vehicleType} &bull; {c.distanceKm} km away</p>
                        <p className="text-emerald-600 font-bold text-[11px]">⚡ Est. arrival: {c.etaText}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

              <div className="absolute top-2.5 left-2.5 z-10">
                {realNearbyCaptains.length > 0 ? (
                  <div className="flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md text-white px-3 py-1 rounded-full shadow-md border border-white/20 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="font-black text-[11px]">
                      ⚡ {realNearbyCaptains.length} Captain{realNearbyCaptains.length > 1 ? 's' : ''} online nearby
                    </span>
                    <span className="text-[9px] text-amber-300 font-bold bg-amber-400/20 px-1.5 py-0.5 rounded-full">
                      ~{realNearbyCaptains[0].etaText}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md text-slate-300 px-3 py-1 rounded-full shadow-md border border-white/10 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    <span className="font-semibold text-[11px]">Captains broadcast upon booking</span>
                  </div>
                )}
              </div>
            </div>

            {/* Scrollable Body: Route Summary + Recommendation + 2-Column Vehicle Grid */}
            <div className="p-3.5 flex-1 overflow-y-auto pb-28 space-y-3">
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight">Choose Your Delivery Vehicle</h2>
                <p className="text-[11px] font-medium text-slate-500">
                  Select the best vehicle for your parcel. Price and delivery time shown below.
                </p>
              </div>

              {/* Compact Route Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Pickup</p>
                    <p className="text-[11px] font-black text-slate-800 truncate">{(formData.pickupAddress || 'Pickup').split(',')[0]}</p>
                  </div>
                  <ArrowRight size={14} className="text-slate-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Drop</p>
                    <p className="text-[11px] font-black text-slate-800 truncate">{(formData.dropAddress || 'Drop').split(',')[0]}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-black text-[#0052CC] shrink-0 cursor-pointer"
                >
                  Change
                </button>
              </div>

              {/* Parcel Details + Recommended Banner */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Package size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Parcel Details</p>
                      <p className="text-xs font-black text-slate-800">
                        {formData.weight || '5 kg'} • {formData.parcelType || 'General Parcel'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-[11px] font-bold text-[#0052CC] hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>

                <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-3 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Sparkles size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black text-emerald-800">Recommended for you</p>
                    <p className="text-[10.5px] font-semibold text-emerald-700 leading-snug">
                      Based on your parcel weight, <span className="font-black">{recommendedVehicle.displayName}</span> is the best option.
                    </p>
                  </div>
                </div>
              </div>

              {/* 2-Vehicles-In-A-Row Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {DELIVERY_VEHICLES.map((veh) => {
                  const isSelected = selectedVehicle.id === veh.id;
                  const isRecommended = recommendedVehicle.id === veh.id;
                  const price = getVehicleEstimatedPrice(veh, distanceKm);

                  return (
                    <VehicleOption
                      key={veh.id}
                      vehicle={veh}
                      price={price}
                      isRecommended={isRecommended}
                      selected={isSelected}
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, vehicle: veh.id }));
                        setEstimatedFare(price);
                      }}
                      onViewDetails={(e) => {
                        e.stopPropagation();
                        setVehicleDetailModal({ ...veh, price, isRecommended });
                      }}
                    />
                  );
                })}
              </div>

              {/* Outstation Delivery Mode Indicator */}
              {formData.serviceType === 'Outstation' && (
                <div className={`rounded-2xl p-3 border flex items-center gap-3 ${
                  ['Tata Ace', 'Pickup 8ft', 'Pickup 9ft', '14ft Truck', '17ft Truck'].includes(selectedVehicle.displayName)
                    ? 'bg-blue-50/90 border-blue-200 text-blue-950'
                    : 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                }`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    ['Tata Ace', 'Pickup 8ft', 'Pickup 9ft', '14ft Truck', '17ft Truck'].includes(selectedVehicle.displayName)
                      ? 'bg-blue-100 text-[#0052CC]'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {['Tata Ace', 'Pickup 8ft', 'Pickup 9ft', '14ft Truck', '17ft Truck'].includes(selectedVehicle.displayName) ? (
                      <Truck size={18} />
                    ) : (
                      <Package size={18} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black">
                        {['Tata Ace', 'Pickup 8ft', 'Pickup 9ft', '14ft Truck', '17ft Truck'].includes(selectedVehicle.displayName)
                          ? '🚚 Direct Dedicated Highway Delivery'
                          : '📦 Hub-and-Spoke Relay Transit'}
                      </span>
                    </div>
                    <p className="text-[10px] font-medium text-slate-600 leading-tight mt-0.5">
                      {['Tata Ace', 'Pickup 8ft', 'Pickup 9ft', '14ft Truck', '17ft Truck'].includes(selectedVehicle.displayName)
                        ? 'Direct non-stop door-to-door transit to your destination. No intermediate hub unloading, 0% damage.'
                        : 'Cost-effective shared parcel transit via regional ZyperGo sorting hubs.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Helpers / Labour Selection Card (For Cargo / Trucks) */}
              {selectedVehicle.id !== 'Scooter' && (
                <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                        <Users size={16} />
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-slate-900 leading-tight">Need Helpers / Labour?</h3>
                        <p className="text-[10px] font-semibold text-slate-500">For loading &amp; unloading heavy items</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.helpersNeeded} 
                        onChange={(e) => setFormData(prev => ({ ...prev, helpersNeeded: e.target.checked }))} 
                        className="sr-only peer" 
                      />
                      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0052CC]"></div>
                    </label>
                  </div>

                  {formData.helpersNeeded && (
                    <div className="pt-2 border-t border-slate-100 space-y-3 animate-in fade-in duration-200">
                      <div>
                        <p className="text-[10.5px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
                          Select Labour Work Type
                        </p>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { id: 'Load Only', label: 'Load Only', sub: 'At Pickup', rate: 200 },
                            { id: 'Unload Only', label: 'Unload Only', sub: 'At Drop', rate: 200 },
                            { id: 'Both Load & Unload', label: 'Both', sub: 'Load & Unload', rate: 350 }
                          ].map((wt) => {
                            const active = formData.helperWorkType === wt.id;
                            return (
                              <button
                                key={wt.id}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, helperWorkType: wt.id }))}
                                className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                                  active 
                                    ? 'bg-amber-50 border-amber-500 text-amber-950 font-black shadow-xs ring-1 ring-amber-400' 
                                    : 'bg-slate-50 border-slate-200 text-slate-600 font-bold hover:bg-slate-100'
                                }`}
                              >
                                <span className="text-[11px] block">{wt.label}</span>
                                <span className="text-[9px] text-slate-400 block font-medium">{wt.sub}</span>
                                <span className="text-[10px] font-black text-amber-700 block mt-0.5">₹{wt.rate}/person</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                        <div>
                          <span className="text-[11px] font-black text-slate-800 block">Number of Helpers</span>
                          <span className="text-[9.5px] font-medium text-slate-500">
                            ₹{formData.helperWorkType === 'Both Load & Unload' ? 350 : 200} per helper
                          </span>
                        </div>

                        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-2 py-1 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, helperCount: Math.max(1, (prev.helperCount || 1) - 1) }))}
                            disabled={formData.helperCount <= 1}
                            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 flex items-center justify-center font-black text-slate-700 cursor-pointer"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-xs font-black text-slate-900 w-4 text-center">
                            {formData.helperCount || 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, helperCount: Math.min(4, (prev.helperCount || 1) + 1) }))}
                            disabled={formData.helperCount >= 4}
                            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 flex items-center justify-center font-black text-slate-700 cursor-pointer"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-600 font-bold text-[11px]">Total Labour Charge:</span>
                        <span className="font-black text-amber-800 text-xs bg-amber-100/70 px-2 py-0.5 rounded-full">
                          +₹{((formData.helperWorkType === 'Both Load & Unload' ? 350 : 200) * (formData.helperCount || 1)).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sticky Bottom Bar matching reference screenshot */}
            <div className="p-3.5 border-t border-slate-200 bg-white shadow-[0_-6px_20px_rgba(15,23,42,0.06)] mt-auto flex items-center justify-between gap-2.5 z-20">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={selectedVehicle.img}
                  alt={selectedVehicle.displayName}
                  className="w-11 h-9 object-contain shrink-0 bg-slate-50 rounded-lg p-1 border border-slate-100"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-900 truncate">{selectedVehicle.displayName}</span>
                    {recommendedVehicle.id === selectedVehicle.id && (
                      <span className="text-[8.5px] font-black bg-emerald-500 text-white px-1.5 py-0.5 rounded-full shrink-0">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 truncate">
                    {selectedVehicle.weightLabel}
                    {formData.helpersNeeded ? ` • ${formData.helperCount} Helper(s)` : ''}
                    {' • '}
                    <span className="font-black text-slate-900">
                      ₹{(selectedPrice + (formData.helpersNeeded ? ((formData.helperWorkType === 'Both Load & Unload' ? 350 : 200) * (formData.helperCount || 1)) : 0)).toLocaleString('en-IN')}
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEstimatedFare(selectedPrice);
                  setStep(3);
                }}
                className="bg-[#0052CC] hover:bg-blue-700 text-white font-black px-4 py-3 rounded-xl shadow-[0_6px_16px_-4px_rgba(0,82,204,0.5)] active:scale-[0.98] transition-all text-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        );
      })()}

      {step === 3 && (
        <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
          <BookingHeader title="Schedule Pickup" onBack={handleHeaderBack} />
          
          <div className="p-4 flex-1 overflow-y-auto pb-24 space-y-5">
            <div>
               {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-bold mb-4 border border-red-100">
                  {error}
                </div>
               )}

               <h3 className="text-sm font-black text-slate-900 mb-2">Pickup Address</h3>
               <div className="border border-slate-200 rounded-xl p-4 mb-5 flex justify-between items-start bg-slate-50">
                 <div>
                   <p className="font-bold text-sm text-slate-800">{formData.pickupAddress.split(',')[0]}</p>
                   <p className="text-xs text-slate-500 font-medium">{formData.pickupAddress.split(',').slice(1).join(',')}</p>
                 </div>
                 <button onClick={() => setStep(1)} className="text-[#0052CC] font-bold text-xs uppercase tracking-wider hover:underline">Edit</button>
               </div>

               <h3 className="text-sm font-black text-slate-900 mb-2">Pickup Date</h3>
               <div className="flex gap-2.5 overflow-x-auto pb-2 mb-5 scrollbar-hide whitespace-nowrap">
                  {[
                    { label: 'Today', value: 'Today' },
                    { label: 'Tomorrow', value: 'Tomorrow' },
                    { label: new Date(Date.now() + 86400000 * 2).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), value: new Date(Date.now() + 86400000 * 2).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) },
                    { label: new Date(Date.now() + 86400000 * 3).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), value: new Date(Date.now() + 86400000 * 3).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }
                  ].map(date => (
                    <button 
                      key={date.value}
                      onClick={() => setFormData({...formData, pickupDate: date.value})}
                      className={`shrink-0 py-2.5 px-5 rounded-xl border text-xs font-bold transition-colors ${formData.pickupDate === date.value ? 'bg-[#0052CC] border-[#0052CC] text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-[#0052CC]/50'}`}
                    >
                      {date.label}
                    </button>
                  ))}
               </div>
            </div>

            <div>
               <h3 className="text-sm font-black text-slate-900 mb-2">Pickup Time Slot</h3>
               <div className="grid grid-cols-2 gap-2.5 mb-5">
                  {['9 AM - 12 PM', '12 PM - 3 PM', '3 PM - 6 PM', '6 PM - 9 PM'].map(slot => (
                    <button 
                      key={slot}
                      onClick={() => setFormData({...formData, pickupTimeSlot: slot})}
                      className={`py-3 rounded-xl border text-xs font-bold transition-colors ${formData.pickupTimeSlot === slot ? 'bg-[#0052CC] border-[#0052CC] text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-[#0052CC]/50'}`}
                    >
                      {slot}
                    </button>
                  ))}
               </div>

               <h3 className="text-sm font-black text-slate-900 mb-2">Pickup Instructions (Optional)</h3>
               <textarea 
                 name="instructions"
                 value={formData.instructions}
                 onChange={handleChange}
                 placeholder="Gate number, landmark, etc."
                 className="w-full border border-slate-200 rounded-xl p-3.5 bg-slate-50 text-sm font-medium outline-none focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] min-h-[90px]"
               />

               {/* Fare Summary & Routing Breakdown Card */}
               {(() => {
                 const isOutstation = formData.serviceType === 'Outstation';
                 const largeTruckList = ['Tata Ace', 'Pickup 8ft', 'Pickup 9ft', '14ft Truck', '17ft Truck'];
                 const isOutstationLargeTruck = isOutstation && largeTruckList.includes(formData.vehicle);
                 const helperRate = (formData.helperWorkType === 'Both Load & Unload' || formData.helperWorkType === 'Load & Unload') ? 350 : 200;
                 const calculatedHelperFee = formData.helpersNeeded ? (Number(formData.helperCount) || 1) * helperRate : 0;
                 const totalBookingAmount = estimatedFare + calculatedHelperFee;

                 return (
                   <div className="mt-5 bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-3">
                     <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                       <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Fare Summary</span>
                       <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                         isOutstationLargeTruck 
                           ? 'bg-blue-100 text-[#0052CC]' 
                           : (isOutstation ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700')
                       }`}>
                         {isOutstationLargeTruck ? '🚚 Direct Dedicated Transit' : (isOutstation ? '🏢 Hub Relay Delivery' : '⚡ Intracity Express')}
                       </span>
                     </div>

                     <div className="space-y-2 text-xs">
                       <div className="flex justify-between items-center text-slate-600">
                         <span className="font-medium">Vehicle ({formData.vehicle || 'Standard'}):</span>
                         <span className="font-bold text-slate-900">₹{estimatedFare}</span>
                       </div>

                       {formData.helpersNeeded && (
                         <div className="flex justify-between items-center text-amber-900 bg-amber-50/70 p-2 rounded-xl border border-amber-200/60">
                           <span className="font-semibold text-[11px]">
                             Labour / Helpers ({formData.helperCount} × {formData.helperWorkType}):
                           </span>
                           <span className="font-black text-amber-800">+₹{calculatedHelperFee}</span>
                         </div>
                       )}

                       <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                         <div>
                           <span className="text-xs font-black text-slate-900 block">Total Amount</span>
                           <span className="text-[10px] text-slate-500 font-medium">Inclusive of all taxes & charges</span>
                         </div>
                         <span className="text-xl font-black text-[#0052CC]">₹{totalBookingAmount}</span>
                       </div>
                     </div>
                   </div>
                 );
               })()}
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 bg-white mt-auto">
             {(() => {
               const helperRate = (formData.helperWorkType === 'Both Load & Unload' || formData.helperWorkType === 'Load & Unload') ? 350 : 200;
               const calculatedHelperFee = formData.helpersNeeded ? (Number(formData.helperCount) || 1) * helperRate : 0;
               const totalBookingAmount = estimatedFare + calculatedHelperFee;
               return (
                 <button 
                    onClick={() => {
                      if (formData.cashOnDelivery) {
                        submitBooking();
                      } else {
                        setShowPayment(true);
                      }
                    }}
                    disabled={loading}
                    className="w-full bg-[#0052CC] text-white font-black py-4 rounded-xl shadow-[0_8px_20px_-6px_rgba(0,82,204,0.5)] disabled:opacity-50 flex justify-center items-center hover:bg-blue-700 active:scale-[0.98] transition-all cursor-pointer"
                  >
                   {loading ? (
                     <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                   ) : (
                     formData.cashOnDelivery ? `Confirm Booking (₹${totalBookingAmount})` : `Proceed to Pay ₹${totalBookingAmount}`
                   )}
                 </button>
               );
             })()}
          </div>
        </div>
      )}

      {step === 4 && bookingResult && (() => {
        const activeBooking = liveBookingState || bookingResult;
        const isCaptainAssigned = 
          ['Rider Assigned', 'Rider On the Way', 'Arrived at Pickup', 'Picked Up', 'In Transit', 'Out for Delivery'].includes(activeBooking?.status) ||
          (Array.isArray(activeBooking?.assignedRiders) && activeBooking.assignedRiders.length > 0) ||
          activeBooking?.currentRider ||
          activeBooking?.riderId;

        const assignedCaptain = activeBooking?.currentRider || 
          (activeBooking?.assignedRiders && activeBooking.assignedRiders[0]?.riderId) || 
          null;
        
        const pickupOtp = activeBooking?.pickupOtp || activeBooking?.sender?.pickupOtp || activeBooking?.proofOfDelivery?.otp || currentUser?.pickupOtp || '1234';
        const captainName = assignedCaptain?.name || activeBooking?.riderName || 'Assigned Captain';
        const captainPhone = assignedCaptain?.phone || activeBooking?.riderPhone || '';
        const vehiclePlate = assignedCaptain?.riderDetails?.vehicleRegistration || assignedCaptain?.riderDetails?.vehicleNumber || 'IND TS07WJ2099';
        const vehicleType = assignedCaptain?.riderDetails?.vehicleType || activeBooking?.metadata?.vehicleType || 'Bike';

        return (
          <div className="flex flex-col min-h-full animate-in zoom-in-95 duration-500 bg-[#F8FAFC]">
            
            {/* Header */}
            <div className="bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-20 shadow-xs">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400">WAYBILL TRACKING</p>
                <h3 className="text-base font-black text-slate-900 font-mono">#{activeBooking.trackingId}</h3>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                isCaptainAssigned 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {isCaptainAssigned ? 'Captain Assigned' : 'Finding Captain'}
              </span>
            </div>

            <div className="flex-1 max-w-md mx-auto w-full p-4 space-y-4">
              
              {!isCaptainAssigned ? (
                /* STATE A: Looking for nearby Captain with Rapido-Style Radar & Countdown Timer */
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md text-center relative overflow-hidden">
                  
                  {/* Pulsing Radar Animation */}
                  <div className="relative w-44 h-44 mx-auto my-4 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-amber-400 animate-ping opacity-25"></div>
                    <div className="absolute inset-4 rounded-full border-2 border-amber-400 animate-ping opacity-45" style={{ animationDelay: '400ms' }}></div>
                    <div className="absolute inset-8 rounded-full border-2 border-amber-400 animate-ping opacity-65" style={{ animationDelay: '800ms' }}></div>
                    
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 to-[#FFB703] flex items-center justify-center shadow-[0_0_35px_rgba(255,183,3,0.5)] border-4 border-white relative z-10">
                      <Truck size={38} className="text-slate-950 animate-bounce" />
                    </div>
                  </div>

                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Looking for nearby Captain...</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-1">Connecting with nearest verified ZyperGo drivers</p>

                  {/* Rapido-Style Assignment Timer Card */}
                  <div className="mt-5 p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-800">Captain will be assigned in</p>
                    <div className="text-3xl font-mono font-black text-slate-900 my-1 tracking-wider">
                      {Math.floor(assignCountdown / 60).toString().padStart(2, '0')}:{(assignCountdown % 60).toString().padStart(2, '0')}
                    </div>
                    <p className="text-[10px] text-amber-700 font-bold">Please wait while a driver accepts your trip request</p>
                  </div>

                  {/* Fare Summary Strip */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-500">Total Booking Fare:</span>
                    <span className="text-base font-black text-slate-900">₹{activeBooking?.pricing?.total || estimatedFare}</span>
                  </div>
                </div>
              ) : (
                /* STATE B: Captain Assigned! Show Captain Details & RAPIDO-STYLE PROMINENT OTP */
                <div className="space-y-4 animate-in fade-in duration-300">
                  
                  {/* Captain Assigned Banner */}
                  <div className="bg-emerald-500 text-white p-3.5 rounded-2xl flex items-center gap-2.5 shadow-md">
                    <CheckCircle2 size={20} className="shrink-0" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider">Captain Assigned &amp; On the Way</h4>
                      <p className="text-[10px] text-emerald-100 font-medium">Your ZyperGo Captain is arriving at your pickup point</p>
                    </div>
                  </div>

                  {/* RAPIDO-STYLE PROMINENT 4-DIGIT PICKUP OTP CARD */}
                  <div className="bg-gradient-to-br from-amber-400 via-[#FFB703] to-amber-500 rounded-3xl p-6 text-center text-slate-950 shadow-xl border-2 border-amber-300 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
                    
                    <span className="inline-block px-3 py-1 rounded-full bg-slate-950 text-[#FFB703] text-[10px] font-black uppercase tracking-widest mb-2 shadow-xs">
                      START RIDE OTP
                    </span>
                    
                    <div className="my-2 bg-white/90 backdrop-blur-md rounded-2xl py-3 px-6 inline-block shadow-inner border border-white">
                      <span className="font-mono font-black text-4xl text-slate-950 tracking-[0.3em]">
                        {pickupOtp}
                      </span>
                    </div>

                    <p className="text-xs font-black text-slate-950 max-w-xs mx-auto mt-2 leading-relaxed">
                      Share this 4-digit OTP with your Captain when he arrives for pickup
                    </p>
                  </div>

                  {/* Captain Card with Contact & Vehicle */}
                  <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-md space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-base shadow-inner">
                          {captainName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900 capitalize">{captainName}</h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              ★ 5.0
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 capitalize">{vehicleType} Captain</span>
                          </div>
                        </div>
                      </div>

                      {captainPhone && (
                        <a 
                          href={`tel:${captainPhone}`}
                          className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md hover:bg-emerald-600 transition-colors"
                          title="Call Captain"
                        >
                          <Phone size={18} />
                        </a>
                      )}
                    </div>

                    {/* License Plate Strip */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Vehicle Plate</p>
                        <div className="mt-1 inline-flex items-center bg-white border border-slate-300 rounded-md shadow-2xs overflow-hidden">
                          <span className="bg-blue-700 text-white text-[8px] font-black px-1.5 py-0.5 tracking-tighter">IND</span>
                          <span className="px-2 py-0.5 font-black text-xs tracking-wider text-slate-900 uppercase font-mono">{vehiclePlate}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Trip Fare</p>
                        <span className="text-base font-black text-slate-900 mt-0.5 block">₹{activeBooking?.pricing?.total || estimatedFare}</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* Order Route Strip */}
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-2 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-blue-100 text-[#0052CC] flex items-center justify-center shrink-0 mt-0.5 font-black text-[9px]">A</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Pickup</p>
                    <p className="font-bold text-slate-800 text-[11px] truncate">{activeBooking.pickupLocation?.address || formData.pickupAddress}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 font-black text-[9px]">B</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Drop</p>
                    <p className="font-bold text-slate-800 text-[11px] truncate">{activeBooking.dropLocation?.address || formData.dropAddress}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button 
                  onClick={() => navigate(`/track/${activeBooking.trackingId}`)} 
                  className="w-full py-3.5 bg-[#0052CC] hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  <Navigation size={15} />
                  <span>LIVE TRACK ON MAP</span>
                  <ArrowRight size={15} />
                </button>

                <div className="flex gap-2">
                  <button 
                    onClick={() => navigate('/')} 
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Back to Home
                  </button>
                  {!isCaptainAssigned && (
                    <button 
                      onClick={cancelBooking} 
                      disabled={loading} 
                      className="flex-1 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl border border-red-200 transition-colors cursor-pointer"
                    >
                      {loading ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                  )}
                </div>
              </div>

            </div>

          </div>
        );
      })()}

      {/* Rapido-Style Full Interactive Map Modal with Top Search */}
      {mapModal.show && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-900 animate-in fade-in duration-200">
          
          {/* Top Bar with Header & Close */}
          <div className="bg-white px-4 py-3 flex justify-between items-center shadow-xs z-30 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => setMapModal({ show: false, targetField: '' })} 
                className="p-1 -ml-1 text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <ArrowLeft size={22} />
              </button>
              <div>
                <h2 className="font-black text-base text-slate-900 leading-tight">
                  Choose {mapModal.targetField === 'pickupAddress' ? 'Pickup' : 'Drop'} on Map
                </h2>
                <p className="text-[10px] text-slate-400 font-bold">Drag map to place the pin precisely</p>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setMapModal({ show: false, targetField: '' })} 
              className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 relative bg-slate-100">
            
            {/* Top Rapido-Style Floating Search Bar */}
            <div className="absolute top-3 left-3 right-3 z-30">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden">
                <div className="flex items-center px-3.5 py-3 gap-2.5">
                  <Search size={18} className="text-[#0052CC] shrink-0" />
                  <input 
                    type="text"
                    value={mapSearchQuery}
                    onChange={(e) => handleMapSearchChange(e.target.value)}
                    placeholder="Search area, street, or landmark..."
                    className="w-full text-xs font-bold text-slate-800 outline-none placeholder:text-slate-400"
                    autoFocus
                  />
                  {mapSearchQuery && (
                    <button 
                      type="button" 
                      onClick={() => { setMapSearchQuery(''); setSearchResults([]); }}
                      className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    >
                      <X size={15} />
                    </button>
                  )}
                  {isSearching && (
                    <div className="w-4 h-4 border-2 border-blue-200 border-t-[#0052CC] rounded-full animate-spin shrink-0"></div>
                  )}
                </div>

                {/* Autocomplete Suggestions List */}
                {searchResults.length > 0 && (
                  <div className="border-t border-slate-100 max-h-56 overflow-y-auto divide-y divide-slate-100 bg-white">
                    {searchResults.map((item, idx) => (
                      <div 
                        key={idx}
                        onClick={() => handleSelectSearchResult(item)}
                        className="p-3 hover:bg-blue-50/60 cursor-pointer flex items-center gap-3 transition-colors active:bg-blue-100/50"
                      >
                        <div className="w-7 h-7 rounded-full bg-blue-50 text-[#0052CC] flex items-center justify-center shrink-0">
                          <MapPin size={14} />
                        </div>
                        <div className="text-left overflow-hidden">
                          <p className="text-xs font-black text-slate-800 truncate">{item.mainText || item.text}</p>
                          {item.secondaryText && (
                            <p className="text-[10px] font-bold text-slate-400 truncate">{item.secondaryText}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Leaflet Map Canvas */}
            <MapContainer 
              center={userLocation} 
              zoom={15} 
              zoomControl={false}
              attributionControl={false}
              style={{ height: '100%', width: '100%', zIndex: 0 }}
            >
              <TileLayer 
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
              />
              <MapCenterTracker onMoveEnd={handleMapMoveEnd} />
              <MapFlyTo targetCoords={flyTarget} />
            </MapContainer>
            
            {/* Rapido-Style Floating Center Pin (Fixed to center of viewport) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-20 pointer-events-none flex flex-col items-center">
              <div className={`p-2.5 rounded-full shadow-2xl border-2 border-white transition-transform ${mapModal.targetField === 'pickupAddress' ? 'bg-[#0052CC]' : 'bg-[#FF6B00]'}`}>
                <MapPin size={22} className="text-white fill-white" />
              </div>
              <div className="w-2.5 h-1 bg-black/40 rounded-full blur-[1px] mt-0.5"></div>
            </div>

            {/* Recenter to GPS Floating Button */}
            <div className="absolute right-3 bottom-32 z-20">
              <button 
                type="button"
                onClick={handleRecenterToGPS}
                className="w-11 h-11 bg-white hover:bg-slate-50 text-[#0052CC] rounded-full shadow-xl border border-slate-200 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                title="Locate me"
              >
                <Navigation size={19} />
              </button>
            </div>

            {/* Bottom Address Confirmation Sheet (Rapido Style) */}
            <div className="absolute bottom-4 left-4 right-4 z-20">
              <div className="bg-white/95 backdrop-blur-md p-4 rounded-3xl shadow-2xl border border-slate-200 space-y-3">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${mapModal.targetField === 'pickupAddress' ? 'bg-blue-50 text-[#0052CC]' : 'bg-orange-50 text-[#FF6B00]'}`}>
                    <MapPin size={17} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      {mapModal.targetField === 'pickupAddress' ? 'PICKUP LOCATION' : 'DROP LOCATION'}
                    </p>
                    <p className="text-xs font-black text-slate-800 line-clamp-2 mt-0.5">
                      {isResolving ? 'Pinpointing exact address...' : (resolvedAddress || 'Move pin to select location')}
                    </p>
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={handleConfirmMapLocation}
                  disabled={isResolving || (!resolvedAddress && !tempLocation)}
                  className={`w-full text-white font-black py-3.5 rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${mapModal.targetField === 'pickupAddress' ? 'bg-[#0052CC] hover:bg-blue-700 shadow-blue-500/30' : 'bg-[#FF6B00] hover:bg-orange-600 shadow-orange-500/30'}`}
                >
                  <Check size={18} strokeWidth={2.5} />
                  <span>Confirm {mapModal.targetField === 'pickupAddress' ? 'Pickup' : 'Drop'} Location</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Vehicle Details Modal */}
      {vehicleDetailModal && (
        <div
          onClick={() => setVehicleDetailModal(null)}
          className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/50 backdrop-blur-sm animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl p-5 pb-8 shadow-2xl w-full max-w-lg mx-auto animate-in slide-in-from-bottom space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-16 h-14 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center p-1.5">
                  <img src={vehicleDetailModal.img} alt={vehicleDetailModal.displayName} className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">{vehicleDetailModal.displayName}</h3>
                    {vehicleDetailModal.isRecommended && (
                      <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">Recommended</span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-500">{vehicleDetailModal.weightLabel}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVehicleDetailModal(null)}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 bg-slate-50 rounded-2xl p-3 border border-slate-100 text-xs">
              <div>
                <p className="text-[9.5px] font-bold text-slate-400 uppercase">Cargo Dimensions</p>
                <p className="font-black text-slate-800 mt-0.5">{vehicleDetailModal.dimensions}</p>
              </div>
              <div>
                <p className="text-[9.5px] font-bold text-slate-400 uppercase">Estimated Pickup</p>
                <p className="font-black text-emerald-700 mt-0.5">{vehicleDetailModal.eta}</p>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-200/70">
                <p className="text-[9.5px] font-bold text-slate-400 uppercase">Ideal For</p>
                <p className="font-bold text-slate-700 mt-0.5">{vehicleDetailModal.bestFor}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Estimated Price</p>
                <p className="text-2xl font-black text-[#0052CC]">₹{vehicleDetailModal.price.toLocaleString('en-IN')}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, vehicle: vehicleDetailModal.id }));
                  setEstimatedFare(vehicleDetailModal.price);
                  setVehicleDetailModal(null);
                }}
                className="px-6 py-3 rounded-xl bg-[#0052CC] hover:bg-blue-700 text-white font-black text-xs shadow-md cursor-pointer"
              >
                Select {vehicleDetailModal.displayName}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Addresses Modal */}
      {savedAddressModal.show && (
        <div className="fixed inset-0 z-40 flex flex-col bg-slate-900/40 backdrop-blur-sm animate-in fade-in justify-end">
          <div className="bg-white rounded-t-3xl p-6 pb-24 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom max-h-[80vh] overflow-y-auto w-full">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-black text-xl text-slate-900">Saved Addresses</h2>
              <button onClick={() => setSavedAddressModal({ show: false, targetField: '' })} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"><X size={20}/></button>
            </div>
            
            {savedAddresses.length === 0 ? (
              <div className="py-8 text-center text-slate-500 font-bold text-sm">
                No saved addresses found. Please add them in the Address Book.
              </div>
            ) : (
              <div className="space-y-3">
                {savedAddresses.map(addr => (
                  <div 
                    key={addr._id} 
                    onClick={() => {
                      setFormData(prev => ({ ...prev, [savedAddressModal.targetField]: `${addr.street}, ${addr.city}, ${addr.state} ${addr.pincode}` }));
                      setSavedAddressModal({ show: false, targetField: '' });
                    }}
                    className="flex items-center gap-4 p-4 border border-slate-100 rounded-2xl active:scale-[0.98] transition-transform bg-slate-50 cursor-pointer"
                  >
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex justify-center items-center shrink-0">
                      {getIconForType(addr.type || addr.title)}
                    </div>
                    <div>
                       <p className="font-black text-slate-900 text-sm">{addr.title || addr.type}</p>
                       <p className="text-xs font-bold text-slate-500 line-clamp-1">{addr.street}, {addr.city}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (() => {
        const helperRate = (formData.helperWorkType === 'Both Load & Unload' || formData.helperWorkType === 'Load & Unload') ? 350 : 200;
        const calculatedHelperFee = formData.helpersNeeded ? (Number(formData.helperCount) || 1) * helperRate : 0;
        const totalBookingAmount = estimatedFare + calculatedHelperFee;

        return (
          <div className="fixed inset-0 z-40 flex flex-col bg-slate-900/40 backdrop-blur-sm animate-in fade-in justify-end">
            <div className="bg-white rounded-t-3xl p-6 pb-24 shadow-2xl flex flex-col gap-6 animate-in slide-in-from-bottom max-h-[90vh] overflow-y-auto w-full">
              <div className="flex justify-between items-center">
                <h2 className="font-black text-xl text-slate-900">Payment Gateway</h2>
                <button onClick={() => !isProcessingPayment && setShowPayment(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors cursor-pointer"><X size={20}/></button>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-center">
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Payable</p>
                 <h3 className="text-3xl font-black text-[#0052CC]">₹{totalBookingAmount}</h3>
                 {formData.helpersNeeded && (
                   <p className="text-[11px] font-bold text-amber-800 mt-1 bg-amber-100/70 inline-block px-3 py-0.5 rounded-full">
                     Vehicle: ₹{estimatedFare} • Labour: +₹{calculatedHelperFee} ({formData.helperCount} {formData.helperWorkType})
                   </p>
                 )}
              </div>

              <div className="space-y-3">
                {[
                  { id: 'UPI', badge: 'UPI', badgeClass: 'bg-blue-50 text-[#0052CC]', label: 'Pay via UPI (GPay / PhonePe / Paytm)' },
                  { id: 'Card', badge: 'CC', badgeClass: 'bg-blue-50 text-blue-600', label: 'Credit / Debit Card' },
                  { id: 'NetBanking', badge: 'NB', badgeClass: 'bg-emerald-50 text-emerald-700', label: 'NetBanking & Wallets (Razorpay)' }
                ].map((opt) => (
                  <label
                    key={opt.id}
                    onClick={() => !isProcessingPayment && setPaymentMethod(opt.id)}
                    className={`flex items-center justify-between p-4 border rounded-xl bg-white shadow-sm cursor-pointer transition-colors ${
                      paymentMethod === opt.id ? 'border-[#0052CC] ring-1 ring-[#0052CC]/20' : 'border-slate-200 hover:border-[#0052CC]/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${opt.badgeClass}`}>{opt.badge}</div>
                       <span className="font-bold text-slate-800 text-sm">{opt.label}</span>
                    </div>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === opt.id}
                      onChange={() => setPaymentMethod(opt.id)}
                      className="w-5 h-5 accent-[#0052CC]"
                    />
                  </label>
                ))}
              </div>

              {paymentError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-xs font-bold">
                  {paymentError}
                </div>
              )}

              <button 
                onClick={async () => {
                  setPaymentError('');
                  setIsProcessingPayment(true);
                  try {
                    const verified = await openRazorpayCheckout({
                      amount: totalBookingAmount,
                      name: 'ZyperGo Logistics',
                      description: `Parcel Booking (${formData.vehicle || 'Standard'})${formData.helpersNeeded ? ` + ${formData.helperCount} Helpers` : ''}`,
                      purpose: 'booking',
                      userId: currentUser._id || currentUser.id,
                      prefill: {
                        name: currentUser.name,
                        email: currentUser.email,
                        contact: currentUser.phone
                      },
                      notes: {
                        vehicle: formData.vehicle || 'Scooter',
                        serviceType: formData.serviceType || 'Within City',
                        deliveryMode: formData.serviceType === 'Outstation' ? (['Tata Ace', 'Pickup 8ft', 'Pickup 9ft', '14ft Truck', '17ft Truck'].includes(formData.vehicle) ? 'DIRECT_DEDICATED' : 'HUB_RELAY') : 'DIRECT_INTRACITY',
                        helpersNeeded: String(Boolean(formData.helpersNeeded)),
                        helperCount: String(formData.helpersNeeded ? (Number(formData.helperCount) || 1) : 0),
                        helperWorkType: formData.helpersNeeded ? formData.helperWorkType : 'None'
                      }
                    });
                    await submitBooking({ ...verified, mode: paymentMethod });
                    setShowPayment(false);
                  } catch (payErr) {
                    setPaymentError(payErr.message || 'Payment could not be completed.');
                  } finally {
                    setIsProcessingPayment(false);
                  }
                }}
                disabled={isProcessingPayment}
                className="w-full bg-[#0052CC] text-white font-black py-4 rounded-xl shadow-[0_8px_20px_-6px_rgba(0,82,204,0.5)] flex justify-center items-center gap-2 mt-4 transition-all active:scale-95 disabled:opacity-75 disabled:active:scale-100 cursor-pointer"
              >
                {isProcessingPayment ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Processing Securely...</>
                ) : (
                  <>Pay ₹{totalBookingAmount} Securely</>
                )}
              </button>
            </div>
          </div>
        );
      })()}

      </div>
    </div>
  );
}

function ToggleRow({ icon, label, name, checked, onChange }) {
  return (
    <label className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-white shadow-sm cursor-pointer active:scale-[0.98] transition-transform">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
           {icon}
        </div>
        <span className="text-sm font-bold text-slate-800">{label}</span>
      </div>
      <div className={`w-11 h-6 rounded-full transition-colors relative ${checked ? 'bg-[#0052CC]' : 'bg-slate-200'}`}>
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${checked ? 'left-6' : 'left-1'}`}></div>
      </div>
      <input type="checkbox" name={name} checked={checked} onChange={onChange} className="hidden" />
    </label>
  );
}

function VehicleOption({ vehicle, price, isRecommended, selected, onClick, onViewDetails }) {
  return (
    <div
      onClick={onClick}
      className={`relative rounded-2xl p-2.5 flex flex-col justify-between cursor-pointer transition-all active:scale-[0.98] bg-white ${
        selected
          ? 'border-2 border-[#0052CC] ring-2 ring-[#0052CC]/15 shadow-md bg-blue-50/20'
          : 'border border-slate-200 hover:border-blue-300 shadow-2xs'
      }`}
    >
      {/* Top Row: Recommended Tag + Selection Indicator */}
      <div className="flex items-center justify-between gap-1 min-h-[20px]">
        {isRecommended ? (
          <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md tracking-tight">
            Recommended
          </span>
        ) : (
          <span />
        )}
        <div
          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
            selected ? 'border-[#0052CC] bg-[#0052CC] text-white' : 'border-slate-300 bg-white'
          }`}
        >
          {selected && <Check size={11} strokeWidth={3.5} />}
        </div>
      </div>

      {/* Vehicle Photo */}
      <div className="h-16 flex items-center justify-center my-1.5">
        <img src={vehicle.img} alt={vehicle.displayName} className="max-h-full max-w-full object-contain drop-shadow-xs" />
      </div>

      {/* Vehicle Info */}
      <div className="space-y-1">
        <div>
          <h4 className="font-black text-slate-900 text-xs sm:text-sm leading-tight truncate">{vehicle.displayName}</h4>
          <p className="text-[10.5px] text-slate-500 font-bold">{vehicle.weightLabel}</p>
        </div>

        <div className="flex items-center gap-1 flex-wrap text-[9.5px] font-bold text-slate-500">
          <span>⚡ Est.</span>
          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md font-black">
            {vehicle.eta}
          </span>
        </div>

        {/* Bottom Divider: Price + View Details */}
        <div className="pt-2 mt-1 border-t border-slate-100 flex items-end justify-between gap-1">
          <div>
            <p className="text-[8.5px] font-bold text-slate-400 flex items-center gap-0.5">
              Est. price <Info size={8} />
            </p>
            <p className="text-base font-black text-[#0052CC] leading-none mt-0.5">
              ₹{price.toLocaleString('en-IN')}
            </p>
          </div>
          <button
            type="button"
            onClick={onViewDetails}
            className="text-[9.5px] font-black text-slate-600 hover:text-[#0052CC] flex items-center shrink-0 cursor-pointer"
          >
            Details <ChevronRight size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}
