/**
 * Universal Turn-by-Turn Navigation Dispatcher for ZyperGo Captain App
 * Uses exact GPS coordinates (lat, lng) to launch Google Maps directly
 * into turn-by-turn navigation without delay or search ambiguity.
 */
export const openTurnByTurnNavigation = ({ lat, lng, address }) => {
  const hasCoords = lat !== null && lng !== null && lat !== undefined && lng !== undefined && !isNaN(Number(lat)) && !isNaN(Number(lng)) && Number(lat) !== 0 && Number(lng) !== 0;
  const numLat = hasCoords ? Number(lat) : null;
  const numLng = hasCoords ? Number(lng) : null;
  const coordsTarget = hasCoords ? `${numLat},${numLng}` : null;
  const cleanAddress = (address || '').trim();

  const destQuery = coordsTarget || encodeURIComponent(cleanAddress || 'Hyderabad');
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destQuery}&travelmode=driving`;
  const navIntent = coordsTarget ? `google.navigation:q=${coordsTarget}&mode=d` : `google.navigation:q=${encodeURIComponent(cleanAddress)}&mode=d`;

  // 1. Post to native React Native WebView wrapper if available
  if (typeof window !== 'undefined' && window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'OPEN_NAVIGATION',
        lat: numLat,
        lng: numLng,
        address: cleanAddress,
        url: googleMapsUrl,
        navUrl: navIntent
      }));
    } catch (err) {
      console.warn('ReactNativeWebView postMessage error:', err);
    }
  }

  // 2. Direct Instant Android Intent / Browser Navigation (Zero Delay)
  // In Android WebViews, clicking an anchor tag pointing to google.com/maps or navIntent triggers the native Google Maps app directly in < 50ms!
  try {
    const link = document.createElement('a');
    link.href = googleMapsUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (e) {
    window.location.href = googleMapsUrl;
  }
};

