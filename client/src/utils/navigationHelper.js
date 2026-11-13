/**
 * Universal Turn-by-Turn Navigation Dispatcher for ZyperGo Captain App
 * Prioritizes native Android Google Maps navigation (google.navigation:q=...)
 * avoiding intermediate web browser pages.
 */
export const openTurnByTurnNavigation = ({ lat, lng, address }) => {
  const hasCoords = lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng));
  const target = hasCoords ? `${Number(lat)},${Number(lng)}` : encodeURIComponent(address || '');

  // 1. Prioritize React Native WebView wrapper (Native Android Linking.openURL)
  if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'OPEN_NAVIGATION',
        lat: hasCoords ? Number(lat) : null,
        lng: hasCoords ? Number(lng) : null,
        address: address || ''
      }));
      return;
    } catch (err) {
      console.warn('ReactNativeWebView postMessage failed, falling back:', err);
    }
  }

  // 2. Android device native intent (Directly triggers installed Google Maps app turn-by-turn navigation)
  const isAndroid = /android/i.test(navigator.userAgent || '');
  if (isAndroid) {
    const navIntent = `google.navigation:q=${target}&mode=d`;
    window.location.href = navIntent;
    
    // Safety fallback if intent fails to invoke
    setTimeout(() => {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${target}&travelmode=driving`, '_system');
    }, 1800);
    return;
  }

  // 3. Desktop / iOS fallback
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${target}&travelmode=driving`, '_blank');
};
