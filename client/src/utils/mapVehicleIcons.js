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

  // 4. Bike / Scooter / 2-Wheeler (Default) - Ultra-Realistic Delivery Motorcycle
  return {
    category: 'bike',
    displayName: 'Bike / Scooter',
    emoji: '🏍️',
    bgGradient: 'linear-gradient(135deg, #1E293B, #0F172A)',
    primaryColor: '#FFB703',
    ringColor: 'rgba(255, 183, 3, 0.45)',
    svg: `
      <svg width="28" height="28" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Rear Tire & Alloy Rim -->
        <circle cx="10" cy="33" r="7.5" fill="#090D16" stroke="#94A3B8" stroke-width="1.8"/>
        <circle cx="10" cy="33" r="4.2" fill="#334155" stroke="#CBD5E1" stroke-width="1.2"/>
        <circle cx="10" cy="33" r="1.5" fill="#F8FAFC"/>
        
        <!-- Front Tire & Alloy Rim -->
        <circle cx="37" cy="33" r="7.5" fill="#090D16" stroke="#94A3B8" stroke-width="1.8"/>
        <circle cx="37" cy="33" r="4.2" fill="#334155" stroke="#CBD5E1" stroke-width="1.2"/>
        <circle cx="37" cy="33" r="1.5" fill="#F8FAFC"/>

        <!-- Chrome Exhaust Pipe -->
        <path d="M12 34.5h11l4.5-3" stroke="#E2E8F0" stroke-width="2.4" stroke-linecap="round"/>
        
        <!-- Swingarm, Chassis & Chain Frame -->
        <path d="M10 33l10-8h7l10 8" stroke="#475569" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
        
        <!-- Engine Block with Cooling Ribs -->
        <rect x="17" y="27" width="9.5" height="7.5" rx="1.8" fill="#1E293B" stroke="#64748B" stroke-width="1"/>
        <line x1="18.5" y1="29.5" x2="25" y2="29.5" stroke="#94A3B8" stroke-width="0.9"/>
        <line x1="18.5" y1="31.8" x2="25" y2="31.8" stroke="#94A3B8" stroke-width="0.9"/>

        <!-- Front Telescopic Hydraulic Forks -->
        <path d="M37 33L31 16" stroke="#CBD5E1" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M36 29L31.5 17.5" stroke="#94A3B8" stroke-width="1.2" stroke-linecap="round"/>
        
        <!-- Aerodynamic Fuel Tank (ZyperGo Gold) -->
        <path d="M20 21c2-5.5 7-6.5 11-4.2l2.2 3.2-8.2 3.2h-5z" fill="#FFB703" stroke="#F59E0B" stroke-width="1.2"/>
        
        <!-- Rider Leather Seat -->
        <path d="M12 22c3.5-1.2 6.5-0.2 9.5 2.2l-2 3.2h-6.5c-1.5 0-2-3.8-1-5.4z" fill="#020617"/>
        
        <!-- Handlebars & View Mirror -->
        <path d="M29 15h4.5" stroke="#F8FAFC" stroke-width="2.2" stroke-linecap="round"/>
        <circle cx="33.5" cy="13" r="1.4" fill="#38BDF8"/>
        
        <!-- Bright LED Headlight -->
        <path d="M34.5 17.5l3.5 1.2-1.2 3.2" stroke="#FEF08A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="37" cy="19.2" r="1.3" fill="#FEF08A"/>

        <!-- ZyperGo Courier Delivery Box -->
        <rect x="7.5" y="15.5" width="9" height="8.5" rx="2" fill="#FB5C00" stroke="#FFFFFF" stroke-width="1.1"/>
        <path d="M9.5 19.5h5" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round"/>
      </svg>
    `
  };
};

/**
 * Creates dynamic Leaflet divIcon with live pulsing radar ring and vehicle SVG
 */
export const createLiveVehicleMarkerIcon = (vehicleType = 'Bike', heading = 0, size = 46) => {
  const conf = getVehicleConfig(vehicleType);
  const flipX = (heading > 90 && heading < 270) ? -1 : 1;
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
          animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>

        <!-- Vehicle Badge Circle -->
        <div style="
          position: relative;
          width: ${size - 6}px;
          height: ${size - 6}px;
          border-radius: 50%;
          background: ${conf.bgGradient};
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
          border: 2.5px solid white;
          transform: scaleX(${flipX});
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
            box-shadow: 0 0 6px rgba(34, 197, 94, 0.8);
          "></span>
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};
