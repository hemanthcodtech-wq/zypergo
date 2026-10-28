import React, { useEffect, useState, useMemo } from 'react';
import { BrowserRouter } from 'react-router-dom';
import PortalApp from '../apps/PortalApp';
import AdminApp from '../apps/AdminApp';
import CustomerApp from '../apps/CustomerApp';
import RiderApp from '../apps/RiderApp';
import HamaliApp from '../apps/HamaliApp';
import PartnerApp from '../apps/PartnerApp';
import HubApp from '../apps/HubApp';
import ResetPasswordScreen from '../components/Auth/ResetPasswordScreen';
import GoogleAuthBridge from '../pages/GoogleAuthBridge';
import { useLocation } from 'react-router-dom';
import api from '../api';

function AppRouter() {
  const [authChecked, setAuthChecked] = useState(false);
  const location = useLocation();


  useEffect(() => {
    // Zero-latency instant unblock: if no token or cached user exists, render immediately!
    const token = new URLSearchParams(window.location.search).get('token') || localStorage.getItem('zypergo_token');
    const cachedUser = localStorage.getItem('zypergo_user');
    if (!token || cachedUser) {
      setAuthChecked(true);
    }

    const verifyAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      if (urlToken) {
        localStorage.setItem('zypergo_token', urlToken);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      const currentToken = localStorage.getItem('zypergo_token');
      if (currentToken) {
        try {
          const res = await api.get('/auth/me', { timeout: 6000 });
          if (res.data.success) {
            const userId = res.data.data._id || res.data.data.id || res.data.data.phone;
            const savedPhoto = localStorage.getItem('zypergo_profile_photo_' + userId);
            const userWithPhoto = {
              ...res.data.data,
              photoUrl: savedPhoto || res.data.data.photoUrl || ''
            };
            localStorage.setItem('zypergo_user', JSON.stringify(userWithPhoto));
          }
        } catch (err) {
          if (err.response && err.response.status === 401) {
            localStorage.removeItem('zypergo_token');
            localStorage.removeItem('zypergo_user');
          }
        }
      }
      setAuthChecked(true);
    };
    
    verifyAuth();
  }, []);

  const subdomain = useMemo(() => {
    const validPortals = ['admin', 'customer', 'rider', 'hub', 'hamali', 'partner'];
    const pathname = window.location.pathname.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    const portalParam = params.get('portal') || params.get('role');

    // 1. Explicit request to switch/select portal
    if (params.get('select') === 'true' || portalParam === 'select') {
      sessionStorage.removeItem('zypergo_portal');
      return 'portal';
    }

    // 2. Port-based detection (e.g. localhost:8081 -> customer, 8082 -> rider, 8080 -> admin, 8083 -> hub)
    const port = window.location.port;
    if (port === '8081' || port === '8001' || navigator.userAgent.includes('ZyperGoCustomer')) {
      sessionStorage.setItem('zypergo_portal', 'customer');
      return 'customer';
    }
    if (port === '8082' || port === '8002' || navigator.userAgent.includes('ZyperGoRider')) {
      sessionStorage.setItem('zypergo_portal', 'rider');
      return 'rider';
    }
    if (port === '8080' || port === '8000') {
      sessionStorage.setItem('zypergo_portal', 'admin');
      return 'admin';
    }
    if (port === '8083' || port === '8003') {
      sessionStorage.setItem('zypergo_portal', 'hub');
      return 'hub';
    }

    // 3. Check path prefix directly (e.g. /admin, /customer, /rider, /hub)
    for (const portal of validPortals) {
      if (pathname === `/${portal}` || pathname.startsWith(`/${portal}/`)) {
        sessionStorage.setItem('zypergo_portal', portal);
        return portal;
      }
    }

    // 3. Check URL query parameter (e.g. ?portal=admin)
    if (portalParam) {
      const p = portalParam.toLowerCase();
      if (p === 'portal' || p === 'main') {
        sessionStorage.removeItem('zypergo_portal');
        return 'portal';
      }
      if (validPortals.includes(p)) {
        sessionStorage.setItem('zypergo_portal', p);
        return p;
      }
    }

    // 4. If visiting root or public landing pages, default to public portal
    const isPublicPath = ['/', '/login', '/signup', '/about', '/track', '/contact', '/features', '/cities', '/faq', '/calculate', '/intracity-delivery', '/intercity-delivery', '/how-it-works'].includes(pathname);
    if (isPublicPath) {
      return 'portal';
    }

    // 5. Fallback to session active portal
    const storedPortal = sessionStorage.getItem('zypergo_portal');
    if (storedPortal && validPortals.includes(storedPortal)) {
      return storedPortal;
    }

    return 'portal';
  }, [location]);

  if (!authChecked) return null;

  if (location.pathname === '/reset-password') {
    return <ResetPasswordScreen />;
  }

  if (location.pathname === '/google-auth-bridge') {
    return <GoogleAuthBridge />;
  }

  if (subdomain === 'admin') {
    return <AdminApp />;
  }

  if (subdomain === 'customer') {
    return <CustomerApp />;
  }

  if (subdomain === 'rider') {
    return <RiderApp />;
  }

  if (subdomain === 'hamali') {
    return <HamaliApp />;
  }

  if (subdomain === 'partner') {
    return <PartnerApp />;
  }

  if (subdomain === 'hub') {
    return <HubApp />;
  }

  return <PortalApp />;
}

export default AppRouter;
