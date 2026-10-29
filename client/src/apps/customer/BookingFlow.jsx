import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Package, CheckCircle2, ChevronDown, Check, Truck, Zap, 
  Calendar as CalendarIcon, FileText, AlertCircle, X, Bike, Car, CarFront, 
  Map, Bookmark, Home, Building2, Search, Navigation 
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
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

export default function BookingFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookingResult, setBookingResult] = useState(null);
  const [estimatedFare, setEstimatedFare] = useState(210);
  const [fareBreakdown, setFareBreakdown] = useState(null);
  
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

  const [showPayment, setShowPayment] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
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
    
    // Step 2: Vehicle
    vehicle: 'Auto',
    
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
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  useEffect(() => {
    // Fetch estimated fare from the backend pricing engine
    const fetchEstimate = async () => {
      try {
        const basePayload = {
          originCity: formData.pickupAddress.split(',')[0]?.trim() || 'Unknown',
          destCity: formData.dropAddress.split(',')[0]?.trim() || 'Unknown',
          actualWeight: parseInt(formData.weight) || 5,
          category: formData.parcelType || 'General Parcel',
          speed: 'Standard'
        };
        
        // Fetch for currently selected vehicle to get breakdown
        const res = await api.post('/bookings/estimate', { ...basePayload, vehicle: formData.vehicle });
        if (res.data.success && res.data.data) {
          setEstimatedFare(res.data.data.breakdown.totalCustomerPrice);
          setFareBreakdown(res.data.data.breakdown);
        }

      } catch (err) {
        console.error("Failed to estimate fare:", err);
      }
    };
    
    // Only fetch if we have a drop address (to avoid spamming API too early)
    if (formData.dropAddress) {
      fetchEstimate();
    }
  }, [formData.weight, formData.parcelType, formData.vehicle, formData.pickupAddress, formData.dropAddress]);

  const submitBooking = async () => {
    setError('');
    setLoading(true);

    try {
      const payload = {
        pickupLocation: { 
          address: formData.pickupAddress, 
          pincode: '560004'
        },
        dropLocation: { 
          address: formData.dropAddress || 'Mysore, Karnataka 570001', 
          pincode: '570001'
        },
        senderDetails: { 
          name: currentUser.name || 'John Doe', 
          phone: currentUser.phone || '9876543210'
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
          deliveryType: formData.serviceType === 'Outstation' ? 'Intercity Hub-and-Spoke' : 'Within City'
        },
        pricing: {
          total: estimatedFare
        },
        payment: { 
          mode: formData.cashOnDelivery ? 'Cash' : 'UPI', 
          payer: formData.cashOnDelivery ? 'Receiver' : 'Sender' 
        }
      };

      const response = await api.post('/bookings', payload);
      setBookingResult(response.data.data);
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
      return;
    }
    try {
      setIsResolving(true);
      const geo = await forwardGeocode(item.text);
      if (geo && geo.lat && geo.lng) {
        setFlyTarget([geo.lat, geo.lng]);
        setTempLocation({ lat: geo.lat, lng: geo.lng });
        setResolvedAddress(geo.formattedAddress || item.text);
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
    setMapModal({ show: false, targetField: '' });
  };

  const handleClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  const Header = ({ title }) => (
    <div className="sticky top-0 z-20 bg-white shadow-sm border-b border-slate-100 flex flex-col">
      <div className="flex items-center justify-center py-3 border-b border-slate-50 w-full">
        <img src="/images/logo.png" alt="ZyperGo" className="h-9 w-auto object-contain" />
      </div>
      <div className="px-4 py-3 flex items-center gap-4">
        <button 
          type="button"
          onClick={() => {
            if (step > 1 && step < 4) {
              setStep(step - 1);
            } else if (step === 1) {
              setStep(0);
            } else {
              handleClose();
            }
          }} 
          className="p-1 -ml-1 text-slate-700 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-black text-slate-900">{title}</h1>
      </div>
    </div>
  );

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
          <Header title={`Book Parcel ${formData.serviceType ? `(${formData.serviceType})` : ''}`} />
          
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
                  name="receiverPhone"
                  value={formData.receiverPhone}
                  onChange={handleChange}
                  placeholder="Phone Number"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 shadow-sm bg-slate-50 font-bold text-sm outline-none focus:border-[#0052CC]"
                />
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
                onClick={() => setStep(2)}
                disabled={!formData.dropAddress || !formData.receiverName || !formData.receiverPhone || !formData.weight || !formData.parcelType}
                className="w-full bg-[#0052CC] text-white font-black py-4 rounded-xl shadow-[0_8px_20px_-6px_rgba(0,82,204,0.5)] disabled:opacity-50 transition-all hover:bg-blue-700 active:scale-[0.98] cursor-pointer"
              >
               Continue
             </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
          <Header title="Select Vehicle / Service" />
          
          <div className="p-4 flex-1 overflow-y-auto pb-24 space-y-3">
             <VehicleOption 
                name="Scooter" weight="20 Kg" time="10 mins" 
                icon={<img src="/images/bike.png" alt="Scooter" className="w-20 h-20 object-contain drop-shadow-sm" />}
                selected={formData.vehicle === 'Scooter'} 
                onClick={() => setFormData({...formData, vehicle: 'Scooter'})} 
             />
             <VehicleOption 
                name="Mini 3W" weight="90 Kg" time="1 mins" 
                icon={<img src="/images/miniAuto.png" alt="Mini 3W" className="w-20 h-20 object-contain drop-shadow-sm" />}
                selected={formData.vehicle === 'Mini 3W'} 
                onClick={() => setFormData({...formData, vehicle: 'Mini 3W'})} 
             />
             <VehicleOption 
                name="3 Wheeler" weight="500 kg" time="3 mins" 
                icon={<img src="/images/3%20wheeler.png" alt="3 Wheeler" className="w-20 h-20 object-contain drop-shadow-sm" />}
                selected={formData.vehicle === '3 Wheeler'} 
                onClick={() => setFormData({...formData, vehicle: '3 Wheeler'})} 
             />
             <VehicleOption 
                name="Tata Ace" weight="750 kg" time="10 mins" 
                icon={<img src="/images/tataace.png" alt="Tata Ace" className="w-20 h-20 object-contain drop-shadow-sm" />}
                selected={formData.vehicle === 'Tata Ace'} 
                onClick={() => setFormData({...formData, vehicle: 'Tata Ace'})} 
             />
             <VehicleOption 
                name="Pickup 8ft" weight="1200 kg" time="10 mins" 
                icon={<img src="/images/pickup8ft.png" alt="Pickup 8ft" className="w-20 h-20 object-contain drop-shadow-sm" />}
                selected={formData.vehicle === 'Pickup 8ft'} 
                onClick={() => setFormData({...formData, vehicle: 'Pickup 8ft'})} 
             />
             <VehicleOption 
                name="Pickup 9ft" weight="1700 Kg" time="9 mins" 
                icon={<img src="/images/9ft.png" alt="Pickup 9ft" className="w-20 h-20 object-contain drop-shadow-sm" />}
                selected={formData.vehicle === 'Pickup 9ft'} 
                onClick={() => setFormData({...formData, vehicle: 'Pickup 9ft'})} 
             />
             <VehicleOption 
                name="14ft" weight="3500 Kg" time="20 mins" 
                icon={<img src="/images/14ft.png" alt="14ft" className="w-20 h-20 object-contain drop-shadow-sm" />}
                selected={formData.vehicle === '14ft'} 
                onClick={() => setFormData({...formData, vehicle: '14ft'})} 
             />
             <VehicleOption 
                name="17ft" weight="6000 Kg" time="25 mins" 
                icon={<img src="/images/17ft.png" alt="17ft" className="w-20 h-20 object-contain drop-shadow-sm" />}
                selected={formData.vehicle === '17ft'} 
                onClick={() => setFormData({...formData, vehicle: '17ft'})} 
             />
          </div>

          <div className="p-4 border-t border-slate-100 bg-white mt-auto">
             <button 
                onClick={() => setStep(3)}
                className="w-full bg-[#FFB703] text-slate-900 font-black py-4 rounded-xl shadow-[0_8px_20px_-6px_rgba(255,183,3,0.5)] active:scale-[0.98] hover:bg-amber-400 transition-all cursor-pointer"
              >
               Continue
             </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
          <Header title="Schedule Pickup" />
          
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
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 bg-white mt-auto">
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
               {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (formData.cashOnDelivery ? 'Confirm Booking' : 'Proceed to Payment')}
             </button>
          </div>
        </div>
      )}

      {step === 4 && bookingResult && (
        <div className="flex flex-col h-full animate-in zoom-in-95 duration-500 bg-white">
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center pt-20">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-inner border-[4px] border-white ring-1 ring-emerald-50">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Order Confirmed</h2>
            <p className="text-slate-500 text-sm font-medium mb-8">Your tracking ID is <br/><span className="font-mono font-black tracking-widest text-[#0052CC] text-lg mt-2 inline-block bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">{bookingResult.trackingId}</span></p>
            
            <div className="w-full md:max-w-md bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-8 text-left mx-auto">
               <div className="flex justify-between items-center mb-3">
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date</span>
                 <span className="text-sm font-bold text-slate-800">{formData.pickupDate}</span>
               </div>
               <div className="flex justify-between items-center mb-3">
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Time</span>
                 <span className="text-sm font-bold text-slate-800">{formData.pickupTimeSlot}</span>
               </div>
               <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Amount</span>
                 <span className="text-lg font-black text-slate-900">₹{estimatedFare}</span>
               </div>
            </div>
          </div>
          
          <div className="p-4 flex flex-col md:flex-row md:justify-center gap-3 mt-auto mb-10 md:mb-16">
            <button onClick={() => navigate(`/track/${bookingResult.trackingId}`)} className="w-full md:w-48 bg-[#0052CC] text-white font-black py-4 rounded-xl shadow-[0_8px_20px_-6px_rgba(0,82,204,0.5)] hover:bg-blue-700 transition-all">
              Track Order
            </button>
            <button onClick={() => navigate('/')} className="w-full md:w-48 bg-slate-100 text-slate-700 font-black py-4 rounded-xl hover:bg-slate-200 transition-colors">
              Back to Home
            </button>
            <button onClick={cancelBooking} disabled={loading} className="w-full md:w-48 bg-red-50 text-red-600 font-black py-4 rounded-xl hover:bg-red-100 transition-colors border border-red-200">
              {loading ? 'Cancelling...' : 'Cancel Order'}
            </button>
          </div>
        </div>
      )}

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
      {showPayment && (
        <div className="fixed inset-0 z-40 flex flex-col bg-slate-900/40 backdrop-blur-sm animate-in fade-in justify-end">
          <div className="bg-white rounded-t-3xl p-6 pb-24 shadow-2xl flex flex-col gap-6 animate-in slide-in-from-bottom max-h-[90vh] overflow-y-auto w-full">
            <div className="flex justify-between items-center">
              <h2 className="font-black text-xl text-slate-900">Payment Gateway</h2>
              <button onClick={() => !isProcessingPayment && setShowPayment(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"><X size={20}/></button>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-center">
               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Payable</p>
               <h3 className="text-3xl font-black text-[#0052CC]">₹{estimatedFare}</h3>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-white shadow-sm cursor-pointer hover:border-[#0052CC]/30 transition-colors">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-blue-50 text-[#0052CC] rounded-full flex items-center justify-center font-bold text-xs">UPI</div>
                   <span className="font-bold text-slate-800 text-sm">Pay via UPI</span>
                </div>
                <input type="radio" name="paymentMethod" defaultChecked className="w-5 h-5 accent-[#0052CC]" />
              </label>
              
              <label className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-white shadow-sm cursor-pointer hover:border-[#0052CC]/30 transition-colors">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">CC</div>
                   <span className="font-bold text-slate-800 text-sm">Credit / Debit Card</span>
                </div>
                <input type="radio" name="paymentMethod" className="w-5 h-5 accent-[#0052CC]" />
              </label>
            </div>

            <button 
              onClick={() => {
                setIsProcessingPayment(true);
                setTimeout(() => {
                  submitBooking();
                  setIsProcessingPayment(false);
                  setShowPayment(false);
                }, 2000);
              }}
              disabled={isProcessingPayment}
              className="w-full bg-[#0052CC] text-white font-black py-4 rounded-xl shadow-[0_8px_20px_-6px_rgba(0,82,204,0.5)] flex justify-center items-center gap-2 mt-4 transition-all active:scale-95 disabled:opacity-75 disabled:active:scale-100 cursor-pointer"
            >
              {isProcessingPayment ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Processing Securely...</>
              ) : (
                <>Pay ₹{estimatedFare} Securely</>
              )}
            </button>
          </div>
        </div>
      )}

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

function VehicleOption({ name, weight, time, icon, selected, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`border rounded-3xl p-6 flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] ${selected ? 'border-[#FFB703] bg-amber-50 shadow-md ring-4 ring-[#FFB703]/20' : 'border-slate-200 bg-white hover:border-[#FFB703]/50 hover:shadow-md'}`}
    >
      <div className="flex items-center gap-6">
         <div className="w-24 h-24 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center p-2">
            {icon}
         </div>
         <div>
            <h4 className="font-black text-slate-900 text-lg mb-1">{name}</h4>
            <p className="text-xs text-slate-500 font-bold mb-2">{weight}</p>
            <p className="text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 inline-block px-2.5 py-1 rounded-md">{time}</p>
         </div>
      </div>
      <div className="text-right flex flex-col items-end gap-2">
         <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${selected ? 'border-[#FFB703] bg-[#FFB703] text-white' : 'border-slate-300 bg-white'}`}>
            {selected && <Check size={16} strokeWidth={3.5} />}
         </div>
      </div>
    </div>
  );
}
