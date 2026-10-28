const https = require('https');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyC6rEOoYoGpWqOFzSNcWNqjtthNOznD2_k';

const fetchJson = (url) => {
  return new Promise((resolve, reject) => {
    const headers = { 'User-Agent': 'ZyperGo-Backend/1.0' };
    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', err => reject(err));
  });
};

/**
 * Reverse geocode latitude and longitude to address
 */
exports.reverseGeocode = async (lat, lng) => {
  if (!lat || !lng) return null;

  // 1. Google Maps Geocoding API
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
    const data = await fetchJson(url);
    if (data && data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        formattedAddress: result.formatted_address,
        lat,
        lng,
        source: 'google'
      };
    }
  } catch (err) {
    console.warn('Google Maps backend geocode warning:', err.message);
  }

  // 2. High-speed Fallback to Nominatim
  try {
    const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const osmData = await fetchJson(osmUrl);
    if (osmData && osmData.display_name) {
      return {
        formattedAddress: osmData.display_name,
        lat,
        lng,
        source: 'nominatim'
      };
    }
  } catch (err) {
    console.error('OSM backend geocode error:', err.message);
  }

  return {
    formattedAddress: `${lat}, ${lng}`,
    lat,
    lng,
    source: 'coords'
  };
};

/**
 * Distance Calculation (Haversine Formula) in Kilometers
 */
exports.calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
};
