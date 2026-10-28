/**
 * ZyperGo High-Performance Location & Geocoding Service
 * Powered by Google Maps Platform API Key: AIzaSyC6rEOoYoGpWqOFzSNcWNqjtthNOznD2_k
 * With automatic fallback to OpenStreetMap Nominatim to ensure 100% uptime.
 */

export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyC6rEOoYoGpWqOFzSNcWNqjtthNOznD2_k';

let isScriptLoading = false;
let isScriptLoaded = false;

/**
 * Loads the Google Maps JavaScript API SDK dynamically
 */
export const loadGoogleMapsScript = () => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      isScriptLoaded = true;
      return resolve(window.google.maps);
    }

    if (isScriptLoaded) return resolve(window.google.maps);
    if (isScriptLoading) {
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkInterval);
          resolve(window.google.maps);
        }
      }, 100);
      return;
    }

    isScriptLoading = true;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      isScriptLoaded = true;
      isScriptLoading = false;
      resolve(window.google?.maps);
    };
    script.onerror = (err) => {
      isScriptLoading = false;
      console.warn('Google Maps Script load notice:', err);
      resolve(null); // soft fallback
    };
    document.head.appendChild(script);
  });
};

/**
 * High-precision reverse geocode lat/lng to detailed address components
 * Extracts exact Plot/Door No, Colony/Society, Road, Landmark, City, State, and Pincode
 */
export const reverseGeocode = async (lat, lng) => {
  if (!lat || !lng) return null;

  let plotNumber = '';
  let colony = '';
  let road = '';
  let landmark = '';
  let city = '';
  let state = '';
  let pincode = '';
  let formattedAddress = '';
  let area = '';

  // 1. Try Google Maps Geocoding API
  try {
    const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(googleUrl);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      formattedAddress = data.results[0].formatted_address;

      for (const res of data.results) {
        for (const comp of res.address_components) {
          const types = comp.types;
          if (!plotNumber && (types.includes('street_number') || types.includes('premise') || types.includes('subpremise'))) {
            plotNumber = comp.long_name;
          }
          if (!road && (types.includes('route') || types.includes('street_address'))) {
            road = comp.long_name;
          }
          if (!colony && (types.includes('sublocality_level_2') || types.includes('sublocality_level_1') || types.includes('neighborhood') || types.includes('sublocality'))) {
            colony = comp.long_name;
          }
          if (!landmark && (types.includes('point_of_interest') || types.includes('establishment'))) {
            landmark = comp.long_name;
          }
          if (!city && (types.includes('locality') || types.includes('administrative_area_level_2'))) {
            city = comp.long_name;
          }
          if (!state && types.includes('administrative_area_level_1')) {
            state = comp.long_name;
          }
          if (!pincode && types.includes('postal_code')) {
            pincode = comp.long_name;
          }
        }
      }

      area = colony || road || city || 'Current Location';

      return {
        formattedAddress,
        plotNumber: plotNumber ? (plotNumber.toLowerCase().includes('plot') || plotNumber.toLowerCase().includes('flat') || plotNumber.toLowerCase().includes('no') ? plotNumber : `Plot #${plotNumber}`) : '',
        colony: colony || '',
        road: road || '',
        landmark: landmark || '',
        area,
        city: city || 'Hyderabad',
        state: state || 'Telangana',
        pincode: pincode || '',
        lat,
        lng,
        source: 'google'
      };
    } else if (data.status === 'REQUEST_DENIED') {
      console.info('Google Geocoding API fallback to OSM with addressdetails.');
    }
  } catch (err) {
    console.warn('Google Geocode fetch notice:', err);
  }

  // 2. High-speed Fallback to OpenStreetMap Nominatim with addressdetails=1
  try {
    const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
    const osmRes = await fetch(osmUrl, {
      headers: { 'Accept-Language': 'en' }
    });
    const osmData = await osmRes.json();

    if (osmData && osmData.address) {
      const addr = osmData.address;
      plotNumber = addr.house_number || addr.building || '';
      road = addr.road || addr.street || addr.pedestrian || addr.footway || '';
      colony = addr.suburb || addr.neighbourhood || addr.residential || addr.subdivision || addr.quarter || addr.city_district || '';
      landmark = addr.amenity || addr.landmark || addr.shop || addr.commercial || addr.leisure || '';
      city = addr.city || addr.town || addr.village || addr.municipality || addr.county || 'Hyderabad';
      state = addr.state || 'Telangana';
      pincode = addr.postcode || '';
      area = colony || road || city;

      return {
        formattedAddress: osmData.display_name || `${plotNumber ? plotNumber + ', ' : ''}${road ? road + ', ' : ''}${colony ? colony + ', ' : ''}${city}, ${state} ${pincode}`,
        plotNumber: plotNumber ? (plotNumber.toLowerCase().includes('plot') || plotNumber.toLowerCase().includes('flat') || plotNumber.toLowerCase().includes('no') ? plotNumber : `Plot #${plotNumber}`) : '',
        colony: colony || '',
        road: road || '',
        landmark: landmark || '',
        area,
        city,
        state,
        pincode,
        lat,
        lng,
        source: 'nominatim'
      };
    }
  } catch (osmErr) {
    console.error('Reverse geocode fallback error:', osmErr);
  }

  // 3. Fallback coordinates
  return {
    formattedAddress: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    plotNumber: '',
    colony: 'Current Area',
    road: '',
    landmark: '',
    area: 'Current Location',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '',
    lat,
    lng,
    source: 'coords'
  };
};

/**
 * Forward geocode address text or pincode to coordinates
 */
export const forwardGeocode = async (addressQuery) => {
  if (!addressQuery) return null;

  // 1. Try Google Maps Geocoding API
  try {
    const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressQuery)}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(googleUrl);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0];
      const loc = result.geometry.location;
      return {
        lat: loc.lat,
        lng: loc.lng,
        formattedAddress: result.formatted_address,
        source: 'google'
      };
    }
  } catch (err) {
    console.warn('Google Forward Geocode notice:', err);
  }

  // 2. Fallback to Nominatim
  try {
    const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}`;
    const osmRes = await fetch(osmUrl);
    const osmData = await osmRes.json();

    if (osmData && osmData.length > 0) {
      return {
        lat: parseFloat(osmData[0].lat),
        lng: parseFloat(osmData[0].lon),
        formattedAddress: osmData[0].display_name,
        source: 'nominatim'
      };
    }
  } catch (e) {
    console.error('Forward geocode fallback error:', e);
  }

  return null;
};

/**
 * Calculates distance between two coordinates in kilometers using Haversine formula
 */
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
};

/**
 * Search places and addresses with Google Places API (New)
 */
export const searchPlaces = async (input) => {
  if (!input || input.trim().length < 2) return [];

  try {
    const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY
      },
      body: JSON.stringify({
        input: input.trim(),
        includedRegionCodes: ['in']
      })
    });
    const data = await res.json();
    if (data.suggestions && data.suggestions.length > 0) {
      return data.suggestions.map(s => ({
        text: s.placePrediction?.text?.text || '',
        mainText: s.placePrediction?.structuredFormat?.mainText?.text || '',
        secondaryText: s.placePrediction?.structuredFormat?.secondaryText?.text || '',
        placeId: s.placePrediction?.placeId
      }));
    }
  } catch (err) {
    console.warn('Google Places API search error:', err);
  }

  // Fallback to Nominatim search
  try {
    const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&q=${encodeURIComponent(input)}`;
    const osmRes = await fetch(osmUrl);
    const osmData = await osmRes.json();
    if (Array.isArray(osmData)) {
      return osmData.slice(0, 5).map(item => ({
        text: item.display_name,
        mainText: item.name || item.display_name.split(',')[0],
        secondaryText: item.display_name.split(',').slice(1).join(',').trim(),
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon)
      }));
    }
  } catch (e) {
    // ignore
  }

  return [];
};

