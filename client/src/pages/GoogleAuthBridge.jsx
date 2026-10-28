import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../api';

export default function GoogleAuthBridge() {
  const [status, setStatus] = useState('processing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Extract params from search (?code=... or ?token=...) and hash (#access_token=...)
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

        const code = urlParams.get('code') || hashParams.get('code');
        const token = urlParams.get('token') || hashParams.get('token') || hashParams.get('access_token') || hashParams.get('id_token');
        const error = urlParams.get('error') || hashParams.get('error');

        if (error) {
          throw new Error(error || 'Google authentication was cancelled or failed.');
        }

        // If in a popup, broadcast to parent window
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(
            {
              type: 'GOOGLE_AUTH_SUCCESS',
              code,
              token,
              url: window.location.href
            },
            '*'
          );
          setStatus('success');
          setTimeout(() => {
            window.close();
          }, 800);
          return;
        }

        // Direct navigation flow: exchange token / log in
        if (token) {
          const res = await api.post('/auth/google', { token });
          if (res.data?.token) {
            localStorage.setItem('zypergo_token', res.data.token);
            localStorage.setItem('zypergo_user', JSON.stringify(res.data.data));
            setStatus('success');
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 600);
            return;
          }
        }

        // If no token direct, redirect to portal home
        setStatus('success');
        setTimeout(() => {
          window.location.href = '/';
        }, 800);
      } catch (err) {
        console.error('Auth bridge error:', err);
        setStatus('error');
        setErrorMessage(err.message || 'Authentication failed. Please try again.');
      }
    };

    handleAuth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 font-sans">
      <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4 border border-white/10">
          <img src="/images/logo.png" alt="ZyperGo" className="h-8 w-auto object-contain" />
        </div>

        {status === 'processing' && (
          <div className="flex flex-col items-center space-y-3">
            <Loader2 size={32} className="animate-spin text-[#FFB703]" />
            <h2 className="text-lg font-black text-white">Connecting Google Account</h2>
            <p className="text-xs text-slate-400 font-medium">Please wait while we authenticate your ZyperGo session...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center space-y-3 animate-in fade-in">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 size={24} />
            </div>
            <h2 className="text-lg font-black text-white">Authenticated!</h2>
            <p className="text-xs text-slate-400 font-medium">Redirecting you to your account...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center space-y-3 animate-in fade-in">
            <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <AlertCircle size={24} />
            </div>
            <h2 className="text-lg font-black text-rose-400">Authentication Failed</h2>
            <p className="text-xs text-slate-400 font-medium">{errorMessage}</p>
            <button
              onClick={() => { window.location.href = '/login'; }}
              className="mt-3 px-5 py-2 rounded-xl bg-[#FFB703] hover:bg-[#e5a400] text-slate-950 font-black text-xs transition-colors"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
