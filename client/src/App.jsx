import React, { useEffect } from 'react';
import AppRouter from './routes/AppRouter';

function App() {
  useEffect(() => {
    const handlePipResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const root = document.getElementById('root');
      if (!root) return;

      // When in PiP mode (Android Picture-in-Picture floating window, typically width < 340px)
      if (width < 340 && width > 40) {
        const baseWidth = 380;
        const scale = width / baseWidth;
        root.style.width = `${baseWidth}px`;
        root.style.height = `${Math.round(height / scale)}px`;
        root.style.transform = `scale(${scale})`;
        root.style.transformOrigin = 'top left';
        root.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        document.body.classList.add('pip-mode-active');
      } else {
        root.style.width = '';
        root.style.height = '';
        root.style.transform = '';
        root.style.transformOrigin = '';
        root.style.overflow = '';
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        document.body.classList.remove('pip-mode-active');
      }
    };

    handlePipResize();
    window.addEventListener('resize', handlePipResize);
    window.addEventListener('orientationchange', handlePipResize);
    return () => {
      window.removeEventListener('resize', handlePipResize);
      window.removeEventListener('orientationchange', handlePipResize);
    };
  }, []);

  return <AppRouter />;
}

export default App;
