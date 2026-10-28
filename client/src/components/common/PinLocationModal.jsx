import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Navigation, 
  Search, 
  CheckCircle2, 
  X, 
  Loader2, 
  Building2, 
  Home, 
  Compass, 
  Sparkles,
  ArrowRight,
  AlertCircle,
  ChevronLeft
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { reverseGeocode, searchPlaces } from '../../utils/locationService';

// Custom Map Marker Icon for Pinning
const pinIcon = L.divIcon({
  className: 'custom-pin-marker',
  html: `
    <div style="position: relative; display: flex; flex-direction: column; items: center; transform: translate(-50%, -100%);">
      <div style="width: 36px; height: 36px; background: #0052CC; border: 3px solid #FFFFFF; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 8px 18px rgba(0,82,204,0.45); display: flex; align-items: center; justify-content: center;">
        <div style="width: 12px; height: 12px; background: #FFB703; border-radius: 50%; transform: rotate(45deg);"></div>
      </div>
      <div style="width: 14px; height: 5px; background: rgba(0,0,0,0.25); border-radius: 50%; filter: blur(1.5px); margin: 3px auto 0;"></div>
    </div>
  `,
  iconSize: [36, 46],
  iconAnchor: [18, 46]
});

// Map Controller for programmatically animating to center
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, Math.max(map.getZoom(), 16), { duration: 1.2 });
    }
  }, [center, map]);
  return null;
}

// Map Click & Drag event handler
function MapEventHandler({ onLocationChange }) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
    dragend(e) {
      const center = e.target.getCenter();
      onLocationChange(center.lat, center.lng);
    }
  });
  return null;
}

export default function PinLocationModal({ isOpen, onClose, onConfirm, initialLocation = null }) {
  // Default coordinates (Kosgi / Hyderabad regional center)
  const [coords, setCoords] = useState(
    initialLocation?.lat && initialLocation?.lng 
      ? [initialLocation.lat, initialLocation.lng] 
      : [16.9744, 77.2917]
  );
  
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Address details state
  const [addressDetails, setAddressDetails] = useState({
    plotNumber: initialLocation?.plotNumber || '',
    colony: initialLocation?.colony || '',
    road: initialLocation?.road || '',
    landmark: initialLocation?.landmark || '',
    city: initialLocation?.city || 'Kosgi',
    state: initialLocation?.state || 'Telangana',
    pincode: initialLocation?.pincode || '',
    formattedAddress: initialLocation?.formattedAddress || ''
  });

  // Auto-fetch GPS on initial open if no initial location was pinned
  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('zypergo_customer_location');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.lat && parsed.lng) {
            setCoords([parsed.lat, parsed.lng]);
            setAddressDetails({
              plotNumber: parsed.plotNumber || '',
              colony: parsed.colony || '',
              road: parsed.road || '',
              landmark: parsed.landmark || '',
              city: parsed.city || '',
              state: parsed.state || '',
              pincode: parsed.pincode || '',
              formattedAddress: parsed.formattedAddress || ''
            });
            return;
          }
        } catch (e) {}
      }
      // If no saved location, auto-request GPS
      handleDetectGPS();
    }
  }, [isOpen]);

  const handleLocationUpdate = async (lat, lng) => {
    setCoords([lat, lng]);
    setIsGeocoding(true);
    try {
      const geo = await reverseGeocode(lat, lng);
      if (geo) {
        setAddressDetails(prev => ({
          plotNumber: geo.plotNumber || prev.plotNumber,
          colony: geo.colony || prev.colony,
          road: geo.road || prev.road,
          landmark: geo.landmark || prev.landmark,
          city: geo.city || prev.city,
          state: geo.state || prev.state,
          pincode: geo.pincode || prev.pincode,
          formattedAddress: geo.formattedAddress || prev.formattedAddress
        }));
      }
    } catch (err) {
      console.warn("Geocode error:", err);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsDetectingGPS(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        await handleLocationUpdate(latitude, longitude);
        setIsDetectingGPS(false);
      },
      (err) => {
        console.warn("GPS Permission or Detection error:", err.message);
        setIsDetectingGPS(false);
        // Fallback to current coords reverse geocode
        handleLocationUpdate(coords[0], coords[1]);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // Search places handler
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchPlaces(searchQuery);
        setSearchResults(results || []);
      } catch (err) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectPlace = (place) => {
    if (place.lat && place.lng) {
      handleLocationUpdate(place.lat, place.lng);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleConfirmLocation = () => {
    const combinedAddress = [
      addressDetails.plotNumber,
      addressDetails.road,
      addressDetails.colony,
      addressDetails.landmark ? `(Near ${addressDetails.landmark})` : '',
      addressDetails.city,
      addressDetails.state ? `${addressDetails.state} ${addressDetails.pincode}` : addressDetails.pincode
    ].filter(Boolean).join(', ');

    const finalLocation = {
      lat: coords[0],
      lng: coords[1],
      plotNumber: addressDetails.plotNumber,
      colony: addressDetails.colony,
      road: addressDetails.road,
      landmark: addressDetails.landmark,
      city: addressDetails.city,
      state: addressDetails.state,
      pincode: addressDetails.pincode,
      formattedAddress: combinedAddress || addressDetails.formattedAddress,
      pinnedAt: new Date().toISOString()
    };

    localStorage.setItem('zypergo_customer_location', JSON.stringify(finalLocation));
    if (onConfirm) {
      onConfirm(finalLocation);
    }
    if (onClose) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#F8FAFC] flex flex-col w-full h-full animate-in fade-in duration-200">
      <div className="flex-1 flex flex-col h-full w-full max-w-md mx-auto bg-[#F8FAFC] overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between shrink-0 shadow-2xs z-30">
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={onClose}
              className="p-1 -ml-1 text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              title="Close"
            >
              <ChevronLeft size={22} />
            </button>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0052CC] flex items-center justify-center shadow-xs shrink-0">
              <MapPin size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight leading-tight">
                Pin Your Current Location
              </h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                Exact Doorstep Pickup & Delivery
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Modal Body: Scrollable */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 min-h-0">
          
          {/* Search Box */}
          <div className="relative">
            <div className="relative flex items-center">
              <Search size={16} className="absolute left-3.5 text-slate-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search colony, area, street, or landmark..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#0052CC] outline-none transition-all shadow-2xs"
              />
              {isSearching && (
                <Loader2 size={16} className="absolute right-3.5 animate-spin text-[#0052CC]" />
              )}
              {searchQuery && !isSearching && (
                <button 
                  type="button" 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-slate-400 hover:text-slate-600"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Autocomplete Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-xl border border-slate-100 z-40 max-h-48 overflow-y-auto p-1 divide-y divide-slate-50">
                {searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPlace(item)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50/60 rounded-xl transition-colors flex items-center gap-2.5 text-xs cursor-pointer"
                  >
                    <MapPin size={14} className="text-[#0052CC] shrink-0" />
                    <div className="truncate">
                      <div className="font-bold text-slate-800 truncate">{item.mainText || item.text}</div>
                      {item.secondaryText && (
                        <div className="text-[10px] text-slate-400 truncate">{item.secondaryText}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Map Frame with Pin */}
          <div className="relative h-44 sm:h-48 w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
            <MapContainer
              center={coords}
              zoom={16}
              scrollWheelZoom={false}
              className="h-full w-full z-10"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={coords} icon={pinIcon} />
              <MapController center={coords} />
              <MapEventHandler onLocationChange={handleLocationUpdate} />
            </MapContainer>

            {/* GPS Locate Button floating on map */}
            <button
              type="button"
              onClick={handleDetectGPS}
              disabled={isDetectingGPS}
              className="absolute top-3 right-3 z-20 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border border-slate-200 text-[#0052CC] hover:bg-blue-50 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-black cursor-pointer"
            >
              {isDetectingGPS ? (
                <>
                  <Loader2 size={15} className="animate-spin text-[#0052CC]" />
                  <span>Locating GPS...</span>
                </>
              ) : (
                <>
                  <Navigation size={15} className="fill-[#0052CC]" />
                  <span>Use Current GPS</span>
                </>
              )}
            </button>

            {/* Instruction tooltip badge */}
            <div className="absolute bottom-2 left-3 right-3 z-20 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-lg text-center pointer-events-none flex items-center justify-center gap-1.5">
              <span>📍 Drag map or tap anywhere to reposition exact doorstep pin</span>
              {isGeocoding && <Loader2 size={12} className="animate-spin text-amber-300 ml-1" />}
            </div>
          </div>

          {/* Detailed Address Breakdown Fields (Plot No, Colony, Landmark, Road, City) */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Sparkles size={12} className="text-[#0052CC]" />
                Detailed Location Breakdown
              </span>
              {isGeocoding && (
                <span className="text-[10px] font-bold text-[#0052CC] flex items-center gap-1">
                  <Loader2 size={11} className="animate-spin" />
                  Auto-detecting details...
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* House / Plot / Flat No */}
              <div>
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                  Door / Plot / Flat No. *
                </label>
                <input 
                  type="text"
                  value={addressDetails.plotNumber}
                  onChange={(e) => setAddressDetails({ ...addressDetails, plotNumber: e.target.value })}
                  placeholder="e.g. Plot #42, Flat 301"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#0052CC] transition-all"
                />
              </div>

              {/* Colony / Layout / Society */}
              <div>
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                  Colony / Layout Name *
                </label>
                <input 
                  type="text"
                  value={addressDetails.colony}
                  onChange={(e) => setAddressDetails({ ...addressDetails, colony: e.target.value })}
                  placeholder="e.g. Vijayashree Colony"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#0052CC] transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Road / Street */}
              <div>
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                  Road / Street Name
                </label>
                <input 
                  type="text"
                  value={addressDetails.road}
                  onChange={(e) => setAddressDetails({ ...addressDetails, road: e.target.value })}
                  placeholder="e.g. Main Road, Street 4"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#0052CC] transition-all"
                />
              </div>

              {/* Landmark */}
              <div>
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                  Nearby Landmark
                </label>
                <input 
                  type="text"
                  value={addressDetails.landmark}
                  onChange={(e) => setAddressDetails({ ...addressDetails, landmark: e.target.value })}
                  placeholder="e.g. Near Water Tank / SBI"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#0052CC] transition-all"
                />
              </div>
            </div>

            {/* City & State & Pincode */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                  City / Town
                </label>
                <input 
                  type="text"
                  value={addressDetails.city}
                  onChange={(e) => setAddressDetails({ ...addressDetails, city: e.target.value })}
                  placeholder="City"
                  className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#0052CC]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                  State
                </label>
                <input 
                  type="text"
                  value={addressDetails.state}
                  onChange={(e) => setAddressDetails({ ...addressDetails, state: e.target.value })}
                  placeholder="State"
                  className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#0052CC]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                  Pincode
                </label>
                <input 
                  type="text"
                  value={addressDetails.pincode}
                  onChange={(e) => setAddressDetails({ ...addressDetails, pincode: e.target.value })}
                  placeholder="Pincode"
                  className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#0052CC]"
                />
              </div>
            </div>

            {/* Full Address Preview */}
            <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-600 font-medium">
              <span className="font-bold text-slate-800">Preview: </span>
              {[
                addressDetails.plotNumber,
                addressDetails.road,
                addressDetails.colony,
                addressDetails.landmark ? `(Near ${addressDetails.landmark})` : '',
                addressDetails.city,
                addressDetails.state ? `${addressDetails.state} ${addressDetails.pincode}` : addressDetails.pincode
              ].filter(Boolean).join(', ') || addressDetails.formattedAddress || 'Locating address...'}
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2.5 shrink-0 z-30 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Cancel / Later
          </button>
          
          <button
            type="button"
            onClick={handleConfirmLocation}
            className="flex-2 py-2.5 bg-[#0052CC] hover:bg-[#0047cc] text-white text-xs font-black rounded-xl shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 size={15} />
            <span>Confirm & Pin Location</span>
          </button>
        </div>

      </div>
    </div>
  );
}
