/**
 * Universal Turn-by-Turn Navigation Dispatcher for ZyperGo Captain App
 * Uses exact GPS coordinates (lat, lng) to launch Google Maps directly
 * into turn-by-turn navigation without search ambiguity.
 */
export const openTurnByTurnNavigation = ({ lat, lng, address }) => {
  const hasCoords = lat !== null && lng !== null && lat !== undefined && lng !== undefined && !isNaN(Number(lat)) && !isNaN(Number(lng)) && Number(lat) !== 0 && Number(lng) !== 0;
  const numLat = hasCoords ? Number(lat) : null;
  const numLng = hasCoords ? Number(lng) : null;
  const coordsTarget = hasCoords ? `${numLat},${numLng}` : null;
  const cleanAddress = (address || '').trim();

  // 1. Prioritize React Native WebView wrapper (Native Android Linking.openURL)
  if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'OPEN_NAVIGATION',
        lat: numLat,
        lng: numLng,
        address: cleanAddress
      }));
      return;
    } catch (err) {
      console.warn('ReactNativeWebView postMessage failed, falling back:', err);
    }
  }

  // 2. Android device native intent
  const isAndroid = /android/i.test(navigator.userAgent || '');
  if (isAndroid) {
    if (coordsTarget) {
      // Direct Turn-by-Turn Navigation with exact GPS numbers
      const navIntent = `google.navigation:q=${coordsTarget}&mode=d`;
      window.location.href = navIntent;
      
      setTimeout(() => {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${coordsTarget}&travelmode=driving`, '_system');
      }, 1500);
      return;
    }

    // Fallback if coordinates missing: Google Maps Directions URL (doesn't trigger "can't find a way there" text error)
    if (cleanAddress) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(cleanAddress)}&travelmode=driving`, '_system');
      return;
    }
  }

  // 3. Desktop / Browser fallback
  const dest = coordsTarget || encodeURIComponent(cleanAddress || 'Hyderabad');
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`, '_blank');
};

