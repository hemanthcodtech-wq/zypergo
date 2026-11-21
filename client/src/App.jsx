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
  // Transforms the full 390x693 mobile smartphone viewport into the PiP window without cropping
  // Strictly triggers ONLY when in floating PiP mode (w <= 260 && h <= 460) or when forcedPip is true
  useEffect(() => {
    const applyPipTransform = (forcedPip, forcedW, forcedH) => {
      const root = document.getElementById('root');
      if (!root) return;

      const w = forcedW || window.innerWidth;
      const h = forcedH || window.innerHeight;

      // PiP condition: Android PiP windows are small floating windows (width <= 260px, height <= 460px).
      // Normal phone screens are NEVER <= 260px wide (minimum phone width is 360px).
      const isPip = forcedPip === true || (forcedPip !== false && w <= 260 && h <= 460 && w > 40 && h > 40);

      if (isPip) {
        // Standard smartphone canvas (390 x 693, ~9:16 aspect ratio)
        const baseWidth = 390;
        const baseHeight = 693;
        const scaleX = w / baseWidth;
        const scaleY = h / baseHeight;
        // Use uniform scale to preserve full visual UI fidelity without distortion
        const scale = Math.min(scaleX, scaleY);

        root.style.position = 'fixed';
        root.style.top = '0';
        root.style.left = '0';
        root.style.width = `${baseWidth}px`;
        root.style.height = `${baseHeight}px`;
        root.style.minWidth = `${baseWidth}px`;
        root.style.minHeight = `${baseHeight}px`;
        root.style.maxWidth = `${baseWidth}px`;
        root.style.maxHeight = `${baseHeight}px`;
        root.style.zoom = '';
        root.style.transform = `scale(${scale})`;
        root.style.transformOrigin = 'top left';
        root.style.overflow = 'hidden';

        document.documentElement.style.overflow = 'hidden';
        document.documentElement.style.width = '100%';
        document.documentElement.style.height = '100%';
        document.body.style.overflow = 'hidden';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
        document.body.classList.add('pip-mode-active');
      } else {
        // Fullscreen normal smartphone view: reset ALL styles completely
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

        document.documentElement.style.overflow = '';
        document.documentElement.style.width = '';
        document.documentElement.style.height = '';
        document.body.style.overflow = '';
        document.body.style.width = '';
        document.body.style.height = '';
        document.body.classList.remove('pip-mode-active');
      }
    };

    // Global bridge function callable from React Native WebView on PiP transition
    window.__setPipState = (isPip, w, h) => {
      applyPipTransform(isPip, w, h);
    };

    const handleResize = () => {
      applyPipTransform();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
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
