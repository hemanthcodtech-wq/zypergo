import React, { useEffect, useState } from 'react';
import AppRouter from './routes/AppRouter';

function App() {
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  useEffect(() => {
    // 1. Override window.alert globally across the entire SPA to prevent native browser
    // "The page at https://zypergo.com says:" alert dialogs in Android WebViews
    if (typeof window !== 'undefined') {
      window.__nativeAlert = window.alert;
      window.alert = function (message) {
        if (!message) return;
        const msgStr = typeof message === 'string' ? message : JSON.stringify(message);
        console.warn('[WebView Alert Intercepted & Displayed In-App]:', msgStr);
        setToast({ show: true, message: msgStr, type: 'error' });
      };

      // Custom toast event listener for decoupled component alerts
      const handleCustomToast = (e) => {
        if (e.detail?.message) {
          setToast({
            show: true,
            message: e.detail.message,
            type: e.detail.type || 'info'
          });
        }
      };
      window.addEventListener('zypergo_toast', handleCustomToast);

      // Auto dismiss toast after 4 seconds
      let toastTimer = null;
      if (toast.show) {
        toastTimer = setTimeout(() => {
          setToast(prev => ({ ...prev, show: false }));
        }, 4000);
      }

      return () => {
        window.removeEventListener('zypergo_toast', handleCustomToast);
        if (toastTimer) clearTimeout(toastTimer);
      };
    }
  }, [toast.show]);

  // 2. High-Fidelity Android Picture-in-Picture (PiP) Miniature Screen Scaler
  // Scales the full 390px smartphone canvas down into the tiny PiP window without cropping
  useEffect(() => {
    let currentPip = false;

    const applyPipTransform = (forcedPip, forcedW, forcedH) => {
      const root = document.getElementById('root');
      if (!root) return;

      const vv = window.visualViewport;
      const isVisualSmall = vv && (vv.width < 320 || vv.width < window.innerWidth * 0.82);
      const isOuterSmall = (window.outerWidth > 50 && window.outerWidth < 320) || (window.outerHeight > 50 && window.outerHeight < 520);
      const isInnerSmall = (window.innerWidth <= 320 && window.innerHeight <= 520 && window.innerWidth > 50);

      const isPip = forcedPip !== undefined ? forcedPip : (isVisualSmall || isOuterSmall || isInnerSmall);
      currentPip = isPip;

      if (isPip) {
        document.body.classList.add('pip-mode-active');
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';

        const baseWidth = 390;
        const w = forcedW || (vv ? vv.width : window.innerWidth);
        const scale = (w > 50 && w < 320) ? (w / baseWidth) : 0.46;
        root.style.zoom = scale;
        root.style.width = `${baseWidth}px`;
        root.style.minWidth = `${baseWidth}px`;
        root.style.maxWidth = `${baseWidth}px`;
        root.style.overflow = 'hidden';
      } else {
        document.body.classList.remove('pip-mode-active');
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';

        root.style.position = '';
        root.style.top = '';
        root.style.left = '';
        root.style.width = '';
        root.style.height = '';
        root.style.minWidth = '';
        root.style.minHeight = '';
        root.style.maxWidth = '';
        root.style.maxHeight = '';
        root.style.zoom = '';
        root.style.transform = '';
        root.style.transformOrigin = '';
        root.style.overflow = '';
      }
    };

    window.__setPipState = (isPip, w, h) => {
      applyPipTransform(isPip, w, h);
    };

    const handleResize = () => {
      applyPipTransform();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    const interval = setInterval(() => {
      const vv = window.visualViewport;
      if (vv) {
        const detected = vv.width < window.innerWidth * 0.82 || vv.width < 320;
        if (detected !== currentPip) {
          applyPipTransform(detected);
        }
      }
    }, 400);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
      clearInterval(interval);
      delete window.__setPipState;
    };
  }, []);

  return (
    <>
      {/* Sleek In-App Toast Notification (Replaces unsightly browser window.alert popups) */}
      {toast.show && (
        <div className="fixed top-5 left-4 right-4 z-[999999] max-w-sm mx-auto animate-in slide-in-from-top duration-300 pointer-events-auto">
          <div className={`p-4 rounded-2xl shadow-2xl border flex items-center justify-between gap-3 ${
            toast.type === 'error' 
              ? 'bg-slate-950 text-white border-red-500/40 shadow-red-950/30' 
              : 'bg-slate-900 text-white border-amber-400/40 shadow-amber-950/20'
          }`}>
            <div className="flex items-center gap-3">
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                toast.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-amber-400/20 text-amber-400'
              }`}>
                {toast.type === 'error' ? '!' : 'i'}
              </span>
              <p className="text-xs font-semibold leading-snug">{toast.message}</p>
            </div>
            <button 
              type="button"
              onClick={() => setToast(prev => ({ ...prev, show: false }))}
              className="text-slate-400 hover:text-white p-1 text-xs shrink-0 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      <AppRouter />
    </>
  );
}

export default App;
