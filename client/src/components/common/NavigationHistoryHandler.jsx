import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Global Navigation History & Android Back Button / Gesture Handler
 * Tracks visited tabs & routes and provides seamless back navigation across all apps.
 */
export default function NavigationHistoryHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const historyStack = useRef([]);
  const isNavigatingBack = useRef(false);

  // Keep track of visited paths in the session
  useEffect(() => {
    const current = location.pathname;
    const stack = historyStack.current;

    if (isNavigatingBack.current) {
      isNavigatingBack.current = false;
      return;
    }

    if (stack.length === 0 || stack[stack.length - 1] !== current) {
      stack.push(current);
    }
  }, [location.pathname]);

  // Expose global window.__handleAppBack for Native BackHandler & in-app back buttons
  useEffect(() => {
    window.__handleAppBack = () => {
      const stack = historyStack.current;
      const current = location.pathname.toLowerCase();

      // Check if current page is the root page
      const isRoot = 
        current === '/' || 
        current === '/customer' || 
        current === '/customer/' || 
        current === '/customer/dashboard' || 
        current === '/rider' || 
        current === '/rider/' || 
        current === '/rider/dashboard' ||
        current === '/dashboard';

      // If user visited previous tabs/screens in this session
      if (stack.length > 1) {
        stack.pop(); // Remove current
        const prev = stack.pop(); // Pop previous destination
        if (prev && prev.toLowerCase() !== current) {
          isNavigatingBack.current = true;
          navigate(prev);
          return true;
        }
      }

      // Fallback to browser history if not on root
      if (!isRoot && window.history.length > 1) {
        isNavigatingBack.current = true;
        navigate(-1);
        return true;
      }

      // User is on root home tab -> tell native shell to handle double-tap exit
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'EXIT_APP' }));
      }
      return false;
    };
  }, [location.pathname, navigate]);

  return null;
}
