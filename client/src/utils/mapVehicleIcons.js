import L from 'leaflet';

/**
 * Normalizes vehicle type string and returns appropriate SVG, styling, and metadata
 */
export const getVehicleConfig = (vehicleType = '') => {
  const norm = String(vehicleType || '').toLowerCase().trim();

  // 1. Heavy Truck / 14ft / 17ft / 19ft / 22ft / 32ft / Lorry / Container
  if (
    norm.includes('14ft') ||
    norm.includes('17ft') ||
    norm.includes('19ft') ||
    norm.includes('22ft') ||
    norm.includes('32ft') ||
    norm.includes('lorry') ||
    norm.includes('heavy') ||
    norm.includes('container')
  ) {
    return {
      category: 'heavy_truck',
      displayName: 'Heavy Truck (Lorry)',
      emoji: '🚚',
      bgGradient: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
      primaryColor: '#7C3AED',
      ringColor: 'rgba(124, 58, 237, 0.35)',
      svg: `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="1" y="4" width="13" height="12" rx="1.5"/>
          <path d="M14 8h4.5a1.5 1.5 0 0 1 1.2.6l2.3 3.4"/>
          <path d="M22 14v2a1 1 0 0 1-1 1h-2"/>
          <circle cx="5.5" cy="18.5" r="2.5"/>
          <circle cx="10" cy="18.5" r="2.5"/>
          <circle cx="17.5" cy="18.5" r="2.5"/>
          <path d="M1 9h13"/>
        </svg>
      `
    };
  }

  // 2. Mini Truck / Tata Ace / Pickup 8ft / 9ft / Bolero
  if (
    norm.includes('tata ace') ||
    norm.includes('ace') ||
    norm.includes('pickup') ||
    norm.includes('8ft') ||
    norm.includes('9ft') ||
    norm.includes('bolero') ||
    norm.includes('truck')
  ) {
    return {
      category: 'mini_truck',
      displayName: 'Tata Ace / Pickup',
      emoji: '🛻',
      bgGradient: 'linear-gradient(135deg, #0052CC, #1D4ED8)',
      primaryColor: '#0052CC',
      ringColor: 'rgba(0, 82, 204, 0.35)',
      svg: `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
          <path d="M14 8h4.5a1.5 1.5 0 0 1 1.2.6l2.3 3.4"/>
          <path d="M22 14v4a1 1 0 0 1-1 1h-2"/>
          <circle cx="7" cy="18" r="2.5"/>
          <circle cx="17" cy="18" r="2.5"/>
        </svg>
      `
    };
  }

  // 3. 3-Wheeler / Auto / Mini 3W
  if (
    norm.includes('3 wheeler') ||
    norm.includes('mini 3w') ||
    norm.includes('3w') ||
    norm.includes('auto') ||
    norm.includes('rickshaw')
  ) {
    return {
      category: 'three_wheeler',
      displayName: '3 Wheeler (Auto)',
      emoji: '🛺',
      bgGradient: 'linear-gradient(135deg, #059669, #10B981)',
      primaryColor: '#059669',
      ringColor: 'rgba(16, 185, 129, 0.35)',
      svg: `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="6" cy="18" r="2.5"/>
          <circle cx="18" cy="18" r="2.5"/>
          <path d="M4 11V6a2 2 0 0 1 2-2h8l4 5v5"/>
          <path d="M2 15h20"/>
          <path d="M10 6v5"/>
        </svg>
      `
    };
  }

  // 4. Bike / Scooter / 2-Wheeler (Default)
  return {
    category: 'bike',
    displayName: 'Bike / Scooter',
    emoji: '🛵',
    bgGradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
    primaryColor: '#F59E0B',
    ringColor: 'rgba(245, 158, 11, 0.35)',
    svg: `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="18.5" cy="17.5" r="3.5"/>
        <circle cx="5.5" cy="17.5" r="3.5"/>
        <circle cx="15" cy="5" r="1"/>
        <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
      </svg>
    `
  };
};

/**
 * Creates dynamic Leaflet divIcon with live pulsing radar ring and vehicle SVG
 */
export const createLiveVehicleMarkerIcon = (vehicleType = 'Bike', heading = 0, size = 46) => {
  const conf = getVehicleConfig(vehicleType);
  return L.divIcon({
    className: `live-vehicle-marker marker-${conf.category}`,
    html: `
      <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center;">
        <!-- Pulsating Radar Ring -->
        <div style="
          position: absolute;
          width: ${size - 2}px;
          height: ${size - 2}px;
          border-radius: 50%;
          background: ${conf.ringColor};
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>

        <!-- Vehicle Badge Circle -->
        <div style="
          position: relative;
          width: ${size - 8}px;
          height: ${size - 8}px;
          border-radius: 50%;
          background: ${conf.bgGradient};
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
          border: 2.5px solid white;
          transform: rotate(${heading}deg);
          transition: transform 0.4s ease;
        ">
          ${conf.svg}

          <!-- Live Online Green Status Dot -->
          <span style="
            position: absolute;
            top: -2px;
            right: -2px;
            width: 10px;
            height: 10px;
            background: #22C55E;
            border-radius: 50%;
            border: 2px solid white;
          "></span>
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};
