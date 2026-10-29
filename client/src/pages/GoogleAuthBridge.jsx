import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import api from '../api';

export default function GoogleAuthBridge() {
  const [status, setStatus] = useState('processing');
  const [errorMessage, setErrorMessage] = useState('');
  const [targetRole, setTargetRole] = useState('Customer');
  const [deepLinkUrl, setDeepLinkUrl] = useState('');
  const [isNotRegistered, setIsNotRegistered] = useState(false);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

        const accessToken = hashParams.get('access_token') || urlParams.get('access_token');
        const idToken = hashParams.get('id_token') || urlParams.get('id_token');
        const token = idToken || accessToken || urlParams.get('token') || hashParams.get('token');
        const error = urlParams.get('error') || hashParams.get('error');
        const stateStr = urlParams.get('state') || hashParams.get('state');

        let parsedState = {};
        if (stateStr) {
          try {
            parsedState = JSON.parse(decodeURIComponent(stateStr));
          } catch (e) {
            parsedState = {};
          }
        }

        const role = parsedState.role || 'Customer';
        const isSignup = !!parsedState.isSignup;
        setTargetRole(role);

        if (error) {
          throw new Error(error || 'Google authentication was cancelled.');
        }

        if (!token && !accessToken) {
          throw new Error('No authentication token received from Google.');
        }

        // Verify with backend (send token and accessToken)
        const res = await api.post('/auth/google', { 
          token: idToken || token, 
          accessToken: accessToken || token,
          role, 
          isSignup 
        });

        if (res.data?.success && res.data?.token) {
          const authToken = res.data.token;
          const userObj = res.data.data;

          localStorage.setItem('zypergo_token', authToken);
          localStorage.setItem('zypergo_user', JSON.stringify(userObj));
          sessionStorage.setItem('zypergo_portal', role.toLowerCase());

          // Deep link to return to mobile app
          const isRider = role === 'Rider';
          const scheme = isRider ? 'zypergorider' : 'zypergocustomer';
          const deepLink = `${scheme}://login?token=${encodeURIComponent(authToken)}&user=${encodeURIComponent(JSON.stringify(userObj))}`;
          setDeepLinkUrl(deepLink);
          setStatus('success');

          // Attempt deep link redirect
          setTimeout(() => {
            window.location.href = deepLink;
          }, 300);

          // Web fallback redirect
          setTimeout(() => {
            const fallbackPath = isRider ? '/rider/dashboard' : '/customer/dashboard';
            window.location.href = fallbackPath;
          }, 1800);
          return;
        }

        throw new Error('Authentication succeeded but session could not be established.');
      } catch (err) {
        console.error('Auth bridge error:', err);
        setStatus('error');
        const backendError = err.response?.data?.error || err.message || 'Authentication failed. Please try again.';
        setErrorMessage(backendError);
        if (err.response?.data?.notRegistered) {
          setIsNotRegistered(true);
        }
      }
    };

    handleAuth();
  }, []);

  const isRider = targetRole === 'Rider';
  const registerPath = isRider ? '/rider/signup' : '/customer/signup';
  const loginPath = isRider ? '/rider/login' : '/customer/login';

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 font-sans">
      <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4 border border-white/10">
          <img src="/images/logo.png" alt="ZyperGo" className="h-8 w-auto object-contain" />
        </div>

        {status === 'processing' && (
          <div className="flex flex-col items-center space-y-3">
            <Loader2 size={32} className="animate-spin text-[#0052CC]" />
            <h2 className="text-lg font-black text-white">Verifying Google Account</h2>
            <p className="text-xs text-slate-400 font-medium">Checking registration status with ZyperGo...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center space-y-3 animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 size={28} />
            </div>
            <h2 className="text-lg font-black text-white">Login Successful!</h2>
            <p className="text-xs text-slate-400 font-medium">Opening your {targetRole} App...</p>
            {deepLinkUrl && (
              <a
                href={deepLinkUrl}
                className="mt-4 px-6 py-2.5 rounded-xl bg-[#0052CC] hover:bg-blue-600 text-white font-black text-xs inline-flex items-center gap-1.5 transition-colors shadow-lg"
              >
                <span>Tap to Open App</span>
                <ArrowRight size={14} />
              </a>
            )}
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center space-y-3 animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <AlertCircle size={28} />
            </div>
            <h2 className="text-lg font-black text-rose-400">
              {isNotRegistered ? 'Account Not Registered' : 'Authentication Failed'}
            </h2>
            <p className="text-xs text-slate-300 font-medium px-2 leading-relaxed">{errorMessage}</p>

            <div className="pt-2 w-full flex flex-col gap-2">
              {isNotRegistered ? (
                <button
                  onClick={() => { window.location.href = registerPath; }}
                  className="w-full px-5 py-3 rounded-xl bg-[#0052CC] hover:bg-blue-600 text-white font-black text-xs transition-colors shadow-lg cursor-pointer"
                >
                  Create {targetRole} Account
                </button>
              ) : null}

              <button
                onClick={() => { window.location.href = loginPath; }}
                className="w-full px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
              >
                Back to Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
