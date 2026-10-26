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
import { useLocation } from 'react-router-dom';
import api from '../api';

function AppRouter() {
  const [authChecked, setAuthChecked] = useState(false);
  const location = useLocation();


  useEffect(() => {
    const verifyAuth = async () => {
      // Check if there is a token passed from the portal login
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      if (token) {
        localStorage.setItem('zypergo_token', token);
        // Remove token from URL to keep it clean and secure
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      const currentToken = localStorage.getItem('zypergo_token');
      if (currentToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            localStorage.setItem('zypergo_user', JSON.stringify(res.data.data));
          }
        } catch (err) {
          localStorage.removeItem('zypergo_token');
          localStorage.removeItem('zypergo_user');
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

    // 2. Check path prefix directly (e.g. /admin, /customer, /rider, /hub)
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
