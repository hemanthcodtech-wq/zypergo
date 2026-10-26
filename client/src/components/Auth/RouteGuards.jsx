import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

export function ProtectedRoute({ requiredRole, children }) {
  const [isAuth, setIsAuth] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('zypergo_token');
      const userStr = localStorage.getItem('zypergo_user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const hasToken = !!token;
      const hasRole = requiredRole ? user?.role === requiredRole : true;
      
      setIsAuth(hasToken && hasRole);
      setIsChecking(false);
    };

    checkAuth();
    window.addEventListener('focus', checkAuth);
    window.addEventListener('pageshow', checkAuth);

    return () => {
      window.removeEventListener('focus', checkAuth);
      window.removeEventListener('pageshow', checkAuth);
    };
  }, [location.pathname, requiredRole]);

  if (isChecking) return null;

  if (!isAuth) {
    const p = location.pathname.toLowerCase();
    if (p.startsWith('/admin')) return <Navigate to="/admin/login" replace />;
    if (p.startsWith('/customer')) return <Navigate to="/customer/login" replace />;
    if (p.startsWith('/rider')) return <Navigate to="/rider/login" replace />;
    if (p.startsWith('/hub')) return <Navigate to="/hub/login" replace />;
    return <Navigate to="/login" replace />;
  }
  return children ? children : <Outlet />;
}

export function PublicRoute({ requiredRole, children }) {
  const [isAuth, setIsAuth] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('zypergo_token');
      const userStr = localStorage.getItem('zypergo_user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const hasToken = !!token;
      const hasRole = requiredRole ? user?.role === requiredRole : true;
      
      setIsAuth(hasToken && hasRole);
      setIsChecking(false);
    };

    checkAuth();
    window.addEventListener('focus', checkAuth);
    window.addEventListener('pageshow', checkAuth);

    return () => {
      window.removeEventListener('focus', checkAuth);
      window.removeEventListener('pageshow', checkAuth);
    };
  }, [location.pathname, requiredRole]);

  if (isChecking) return null;

  if (isAuth) {
    const p = location.pathname.toLowerCase();
    if (p.startsWith('/admin')) return <Navigate to="/admin" replace />;
    if (p.startsWith('/customer')) return <Navigate to="/customer/dashboard" replace />;
    if (p.startsWith('/rider')) return <Navigate to="/rider/dashboard" replace />;
    if (p.startsWith('/hub')) return <Navigate to="/hub/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children ? children : <Outlet />;
}
