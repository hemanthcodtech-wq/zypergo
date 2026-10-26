import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Package, CheckCircle2, ChevronDown, Check, Truck, Zap, Calendar as CalendarIcon, FileText, AlertCircle, X, Bike, Car, CarFront, Map, Bookmark, Home, Building2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
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

export default function BookingFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookingResult, setBookingResult] = useState(null);
  const [estimatedFare, setEstimatedFare] = useState(210);
  const [fareBreakdown, setFareBreakdown] = useState(null);
  
  // Map Modal State
  const [mapModal, setMapModal] = useState({ show: false, targetField: '' });
  const [showPayment, setShowPayment] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [tempLocation, setTempLocation] = useState(null);
  const [userLocation, setUserLocation] = useState([12.9716, 77.5946]);
  
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
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          setFormData(prev => ({
            ...prev,
            pickupAddress: data.display_name || `${latitude}, ${longitude}`
          }));
        } catch (error) {
          setFormData(prev => ({ ...prev, pickupAddress: 'Location Unavailable' }));
        }
      }, () => {
        setFormData(prev => ({ ...prev, pickupAddress: 'Location Access Denied' }));
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

  const handleMapConfirm = async () => {
    if (!tempLocation) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${tempLocation.lat}&lon=${tempLocation.lng}`);
      const data = await res.json();
      const address = data.display_name || `${tempLocation.lat.toFixed(4)}, ${tempLocation.lng.toFixed(4)}`;
      
      setFormData(prev => ({ ...prev, [mapModal.targetField]: address }));
      setMapModal({ show: false, targetField: '' });
    } catch (err) {
      setFormData(prev => ({ ...prev, [mapModal.targetField]: `${tempLocation.lat.toFixed(4)}, ${tempLocation.lng.toFixed(4)}` }));
      setMapModal({ show: false, targetField: '' });
    }
  };

  function MapClickHandler() {
    useMapEvents({
      click(e) {
        setTempLocation(e.latlng);
      },
    });
    return null;
  }

  const Header = ({ title }) => (
    <div className="sticky top-0 z-20 bg-white shadow-sm border-b border-slate-100 flex flex-col">
      <div className="flex items-center justify-center py-4 border-b border-slate-50 w-full">
        <img src="/images/logo.png" alt="ZyperGo" className="h-8 w-auto object-contain" />
      </div>
      <div className="px-4 py-4 flex items-center gap-4">
        <button onClick={() => step > 1 && step < 4 ? setStep(step - 1) : navigate('/')} className="p-1 -ml-1 text-slate-700 hover:bg-slate-50 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-black text-slate-900">{title}</h1>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-full flex flex-col font-sans md:p-8 md:items-center">
      <div className="w-full h-full md:h-auto md:min-h-[80vh] md:max-w-4xl bg-white flex flex-col md:rounded-3xl md:shadow-2xl md:border border-slate-100 overflow-hidden relative mx-auto">
      
      {step === 0 && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex flex-col justify-end pb-[70px] sm:pb-24 md:px-4 animate-in fade-in">
          <div className="bg-white rounded-t-[2.5rem] md:rounded-[2rem] w-full md:max-w-md mx-auto p-6 sm:p-8 shadow-2xl relative md:mb-4">
            <button onClick={() => navigate('/')} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full transition-colors">
              <X size={18} strokeWidth={2.5} />
            </button>
            <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Choose your service</h2>
            
            <div className="space-y-4">
              <button 
                onClick={() => { setFormData(prev => ({...prev, serviceType: 'Within City'})); setStep(1); }}
                className="w-full bg-white border border-slate-100 hover:border-blue-100 hover:shadow-md rounded-[1.5rem] p-3 flex items-center justify-between transition-all group active:scale-[0.98]"
              >
                <div className="flex items-center gap-5">
                  <div className="w-16 h-14 bg-[#F0F5FF] rounded-2xl flex items-center justify-center shrink-0">
                     <Truck size={24} className="text-blue-500" strokeWidth={2} />
                  </div>
                  <span className="font-black text-[17px] text-slate-800 tracking-tight">Within City</span>
                </div>
                <ChevronDown size={18} className="text-slate-400 group-hover:text-blue-500 -rotate-90 transition-colors mr-3" />
              </button>

              <button 
                onClick={() => { setFormData(prev => ({...prev, serviceType: 'Outstation'})); setStep(1); }}
                className="w-full bg-white border border-slate-100 hover:border-green-100 hover:shadow-md rounded-[1.5rem] p-3 flex items-center justify-between transition-all group active:scale-[0.98]"
              >
                <div className="flex items-center gap-5">
                  <div className="w-16 h-14 bg-[#F0FDF4] rounded-2xl flex items-center justify-center shrink-0">
                     <Map size={24} className="text-green-600" strokeWidth={2} />
                  </div>
                  <span className="font-black text-[17px] text-slate-800 tracking-tight">Outstation</span>
                </div>
                <ChevronDown size={18} className="text-slate-400 group-hover:text-green-600 -rotate-90 transition-colors mr-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {(step === 0 || step === 1) && (
        <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-300">
          <Header title={`Book Parcel ${formData.serviceType ? `(${formData.serviceType})` : ''}`} />
          
          <div className="p-4 flex-1 overflow-y-auto pb-24 md:p-8 md:grid md:grid-cols-2 md:gap-8">
            <div className="md:col-span-1">
              {/* From/To Box */}
              <div className="border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm">
                <div className="relative pl-8 pb-6 border-b border-slate-100">
                  <div className="absolute left-0 top-1 w-6 h-6 flex items-center justify-center">
                    <MapPin size={16} className="text-[#006D77]" />
                  </div>
                  <div className="absolute left-3 top-7 bottom-3 w-px bg-slate-200 border-dashed border-l-2"></div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">From</p>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      name="pickupAddress"
                      value={formData.pickupAddress}
                      onChange={handleChange}
                      className="w-full font-bold text-sm text-slate-800 outline-none" 
                      placeholder="Pickup address..."
                    />
                    <button onClick={() => { setSavedAddressModal({ show: true, targetField: 'pickupAddress' }); }} className="text-[#FFB703] p-1.5 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors shrink-0" title="Saved Addresses"><Bookmark size={16}/></button>
                    <button onClick={() => { setTempLocation(null); setMapModal({ show: true, targetField: 'pickupAddress' }); }} className="text-[#006D77] p-1.5 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors shrink-0" title="Map"><Map size={16}/></button>
                  </div>
                </div>
                <div className="relative pl-8 pt-4">
                  <div className="absolute left-0 top-5 w-6 h-6 flex items-center justify-center">
                     <div className="w-2 h-2 bg-[#FFB703] rounded-full"></div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">To</p>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      name="dropAddress"
                      value={formData.dropAddress}
                      onChange={handleChange}
                      className="w-full font-bold text-sm text-slate-800 outline-none placeholder:text-slate-300" 
                      placeholder="Drop address..."
                    />
                    <button onClick={() => { setSavedAddressModal({ show: true, targetField: 'dropAddress' }); }} className="text-[#FFB703] p-1.5 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors shrink-0" title="Saved Addresses"><Bookmark size={16}/></button>
                    <button onClick={() => { setTempLocation(null); setMapModal({ show: true, targetField: 'dropAddress' }); }} className="text-[#006D77] p-1.5 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors shrink-0" title="Map"><Map size={16}/></button>
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
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 shadow-sm bg-slate-50 font-bold text-sm outline-none focus:border-[#006D77]"
                />
              </div>
              <div className="flex-1">
                <input 
                  type="tel" 
                  name="receiverPhone"
                  value={formData.receiverPhone}
                  onChange={handleChange}
                  placeholder="Phone Number"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 shadow-sm bg-slate-50 font-bold text-sm outline-none focus:border-[#006D77]"
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
              <ToggleRow icon={<Package size={18} className="text-[#006D77]" />} label="Secure Packaging" name="securePackaging" checked={formData.securePackaging} onChange={handleChange} />
              <ToggleRow icon={<FileText size={18} className="text-emerald-500" />} label="Cash on Delivery" name="cashOnDelivery" checked={formData.cashOnDelivery} onChange={handleChange} />
            </div>

            </div>
          </div>
          
          <div className="p-4 border-t border-slate-100 bg-white mt-auto md:px-8 md:py-6 md:flex md:justify-end">
             <button 
                onClick={() => setStep(2)}
                disabled={!formData.dropAddress || !formData.receiverName || !formData.receiverPhone || !formData.weight || !formData.parcelType}
                className="w-full md:w-1/3 lg:w-1/4 bg-[#006D77] text-white font-black py-4 rounded-xl shadow-[0_8px_20px_-6px_rgba(0,109,119,0.5)] disabled:opacity-50 transition-all hover:bg-[#00585f]"
              >
               Continue
             </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
          <Header title="Select Vehicle / Service" />
          
          <div className="p-4 flex-1 overflow-y-auto pb-24 md:p-8 space-y-3 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 lg:gap-6">
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

          <div className="p-4 border-t border-slate-100 bg-white mt-auto md:px-8 md:py-6 md:flex md:justify-end">
             <button 
                onClick={() => setStep(3)}
                className="w-full md:w-1/3 lg:w-1/4 bg-[#FFB703] text-slate-900 font-black py-4 rounded-xl shadow-[0_8px_20px_-6px_rgba(255,183,3,0.5)] active:scale-95 hover:bg-amber-400 transition-all"
              >
               Continue
             </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
          <Header title="Schedule Pickup" />
          
          <div className="p-4 flex-1 overflow-y-auto pb-24 md:p-8 md:grid md:grid-cols-2 md:gap-12">
            <div>
               {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-bold mb-4 border border-red-100">
                  {error}
                </div>
               )}

               <h3 className="text-sm font-black text-slate-900 mb-2">Pickup Address</h3>
               <div className="border border-slate-200 rounded-xl p-4 mb-6 flex justify-between items-start bg-slate-50">
                 <div>
                   <p className="font-bold text-sm text-slate-800">{formData.pickupAddress.split(',')[0]}</p>
                   <p className="text-xs text-slate-500 font-medium">{formData.pickupAddress.split(',').slice(1).join(',')}</p>
                 </div>
                 <button className="text-[#006D77] font-bold text-xs uppercase tracking-wider hover:underline">Edit</button>
               </div>

               <h3 className="text-sm font-black text-slate-900 mb-2">Pickup Date</h3>
               <div className="flex gap-3 overflow-x-auto pb-2 mb-6 md:mb-0 scrollbar-hide whitespace-nowrap">
                  {[
                    { label: 'Today', value: 'Today' },
                    { label: 'Tomorrow', value: 'Tomorrow' },
                    { label: new Date(Date.now() + 86400000 * 2).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), value: new Date(Date.now() + 86400000 * 2).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) },
                    { label: new Date(Date.now() + 86400000 * 3).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), value: new Date(Date.now() + 86400000 * 3).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }
                  ].map(date => (
                    <button 
                      key={date.value}
                      onClick={() => setFormData({...formData, pickupDate: date.value})}
                      className={`shrink-0 py-3 px-6 rounded-xl border text-xs font-bold transition-colors ${formData.pickupDate === date.value ? 'bg-[#006D77] border-[#006D77] text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-[#006D77]/50'}`}
                    >
                      {date.label}
                    </button>
                  ))}
               </div>
            </div>

            <div>
               <h3 className="text-sm font-black text-slate-900 mb-2">Pickup Time Slot</h3>
               <div className="grid grid-cols-2 gap-3 mb-6">
                  {['9 AM - 12 PM', '12 PM - 3 PM', '3 PM - 6 PM', '6 PM - 9 PM'].map(slot => (
                    <button 
                      key={slot}
                      onClick={() => setFormData({...formData, pickupTimeSlot: slot})}
                      className={`py-3 rounded-xl border text-xs font-bold transition-colors ${formData.pickupTimeSlot === slot ? 'bg-[#006D77] border-[#006D77] text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-[#006D77]/50'}`}
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
                 className="w-full border border-slate-200 rounded-xl p-4 bg-slate-50 text-sm font-medium outline-none focus:border-[#006D77] focus:ring-1 focus:ring-[#006D77] min-h-[100px]"
               />
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 bg-white mt-auto md:px-8 md:py-6 md:flex md:justify-end">
             <button 
                onClick={() => {
                  if (formData.cashOnDelivery) {
                    submitBooking();
                  } else {
                    setShowPayment(true);
                  }
                }}
                disabled={loading}
                className="w-full md:w-1/3 lg:w-1/4 bg-[#006D77] text-white font-black py-4 rounded-xl shadow-[0_8px_20px_-6px_rgba(0,109,119,0.5)] disabled:opacity-50 flex justify-center items-center hover:bg-[#00585f] transition-all"
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
            <p className="text-slate-500 text-sm font-medium mb-8">Your tracking ID is <br/><span className="font-mono font-black tracking-widest text-[#006D77] text-lg mt-2 inline-block bg-teal-50 px-4 py-2 rounded-lg border border-teal-100">{bookingResult.trackingId}</span></p>
            
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
            <button onClick={() => navigate(`/track/${bookingResult.trackingId}`)} className="w-full md:w-48 bg-[#006D77] text-white font-black py-4 rounded-xl shadow-[0_8px_20px_-6px_rgba(0,109,119,0.5)] hover:bg-[#00585f] transition-all">
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

      {/* Map Modal */}
      {mapModal.show && (
        <div className="fixed inset-0 z-40 flex flex-col bg-slate-50 animate-in slide-in-from-bottom">
          <div className="bg-white px-4 py-4 flex justify-between items-center shadow-sm z-10">
            <h2 className="font-black text-lg">Select Location on Map</h2>
            <button onClick={() => setMapModal({ show: false, targetField: '' })} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"><X size={20}/></button>
          </div>
          <div className="flex-1 relative bg-slate-200">
            <MapContainer center={userLocation} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }}>
              <TileLayer 
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <MapClickHandler />
              {tempLocation && <Marker position={tempLocation} />}
            </MapContainer>
            
            <div className="absolute top-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-md border border-slate-200 z-10 text-center font-bold text-sm text-slate-800">
              Tap anywhere on the map to place a pin
            </div>

            <div className="absolute bottom-24 left-4 right-4 z-10">
              <button 
                onClick={handleMapConfirm}
                disabled={!tempLocation}
                className="w-full bg-[#006D77] text-white font-black py-4 rounded-xl shadow-lg disabled:opacity-50 disabled:bg-slate-400 flex items-center justify-center gap-2"
              >
                <MapPin size={20}/> Confirm Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Addresses Modal */}
      {savedAddressModal.show && (
        <div className="fixed inset-0 z-40 flex flex-col bg-slate-900/40 backdrop-blur-sm animate-in fade-in justify-end">
          <div className="bg-white rounded-t-3xl p-6 pb-24 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom max-h-[80vh] overflow-y-auto w-full max-w-md mx-auto">
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
                    <div className="w-10 h-10 bg-teal-50 rounded-xl flex justify-center items-center shrink-0">
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
          <div className="bg-white rounded-t-3xl p-6 pb-24 shadow-2xl flex flex-col gap-6 animate-in slide-in-from-bottom max-h-[90vh] overflow-y-auto w-full max-w-md mx-auto">
            <div className="flex justify-between items-center">
              <h2 className="font-black text-xl text-slate-900">Payment Gateway</h2>
              <button onClick={() => !isProcessingPayment && setShowPayment(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"><X size={20}/></button>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-center">
               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Payable</p>
               <h3 className="text-3xl font-black text-[#006D77]">₹{estimatedFare}</h3>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-white shadow-sm cursor-pointer hover:border-[#006D77]/30 transition-colors">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-teal-50 text-[#006D77] rounded-full flex items-center justify-center font-bold text-xs">UPI</div>
                   <span className="font-bold text-slate-800 text-sm">Pay via UPI</span>
                </div>
                <input type="radio" name="paymentMethod" defaultChecked className="w-5 h-5 accent-[#006D77]" />
              </label>
              
              <label className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-white shadow-sm cursor-pointer hover:border-[#006D77]/30 transition-colors">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">CC</div>
                   <span className="font-bold text-slate-800 text-sm">Credit / Debit Card</span>
                </div>
                <input type="radio" name="paymentMethod" className="w-5 h-5 accent-[#006D77]" />
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
              className="w-full bg-[#006D77] text-white font-black py-4 rounded-xl shadow-[0_8px_20px_-6px_rgba(0,109,119,0.5)] flex justify-center items-center gap-2 mt-4 transition-all active:scale-95 disabled:opacity-75 disabled:active:scale-100"
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
      <div className={`w-11 h-6 rounded-full transition-colors relative ${checked ? 'bg-[#006D77]' : 'bg-slate-200'}`}>
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
