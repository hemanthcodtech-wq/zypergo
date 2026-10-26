import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Phone, KeyRound, ArrowRight, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../api';

export default function AdminLoginScreen({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [method, setMethod] = useState('otp'); // 'otp' or 'password'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('input'); // 'input' or 'otp'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isEmail = identifier.includes('@');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (identifier.trim().length < 5) {
      setError('Please enter a valid Admin Email or Mobile Number');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const payload = { role: 'SuperAdmin' };
      if (isEmail) payload.email = identifier.trim();
      else payload.phone = identifier.trim();

      await api.post('/auth/send-otp', payload);
      setStep('otp');
      setSuccessMsg(`OTP sent successfully to ${identifier}`);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to send OTP. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.trim().length < 4) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = { role: 'SuperAdmin', otp: otp.trim() };
      if (isEmail) payload.email = identifier.trim();
      else payload.phone = identifier.trim();

      const res = await api.post('/auth/verify-otp', payload);
      const data = res.data;

      localStorage.setItem('zypergo_token', data.token);
      localStorage.setItem('zypergo_user', JSON.stringify(data.data));

      if (onLoginSuccess) {
        onLoginSuccess(data.data);
      } else {
        navigate('/admin', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (identifier.trim().length < 4 || !password) {
      setError('Please enter both Admin Email/Phone and Password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = { identifier: identifier.trim(), password, role: 'SuperAdmin' };
      const res = await api.post('/auth/login-password', payload);
      const data = res.data;

      localStorage.setItem('zypergo_token', data.token);
      localStorage.setItem('zypergo_user', JSON.stringify(data.data));

      if (onLoginSuccess) {
        onLoginSuccess(data.data);
      } else {
        navigate('/admin', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Invalid Admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col justify-center items-center p-4 selection:bg-purple-500 selection:text-white font-sans relative overflow-hidden">
      {/* Subtle modern background glow */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Admin Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative z-10">
        
        {/* Header with Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <img src="/images/logo.png" alt="ZyperGo" className="h-10 w-auto object-contain mb-4" />
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold mb-3">
            <ShieldCheck size={14} className="text-purple-400" />
            <span>Admin Portal</span>
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight">Admin Portal Login</h1>
          <p className="text-slate-400 text-xs mt-1">Authorized personnel only • Secure Control Center</p>
        </div>

        {/* Error / Success Notifications */}
        {error && (
          <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-2.5 text-red-400 text-xs font-medium animate-in fade-in">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-2.5 text-emerald-400 text-xs font-medium animate-in fade-in">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab switch between OTP & Password */}
        <div className="flex bg-slate-800/80 p-1 rounded-xl mb-6 border border-slate-700/60">
          <button
            type="button"
            onClick={() => { setMethod('otp'); setStep('input'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              method === 'otp' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            OTP Login
          </button>
          <button
            type="button"
            onClick={() => { setMethod('password'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              method === 'password' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Password Login
          </button>
        </div>

        {/* Method 1: OTP Login Form */}
        {method === 'otp' && (
          <>
            {step === 'input' ? (
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Email or Mobile Number
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                      {isEmail ? <Mail size={18} /> : <Phone size={18} />}
                    </div>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="admin@zypergo.com or mobile"
                      className="w-full bg-slate-800/70 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 font-medium placeholder:text-slate-500 transition-all"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-500 active:scale-[0.99] text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Sending OTP...' : (
                    <>
                      <span>Send OTP</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5 animate-in fade-in">
                <div className="text-center pb-1">
                  <p className="text-xs text-slate-400">
                    Enter the code sent to <span className="font-bold text-white">{identifier}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 text-center">
                    Enter Verification OTP
                  </label>
                  <div className="relative">
                    <KeyRound size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full bg-slate-800/70 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-center text-white text-lg tracking-widest font-mono font-bold outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length < 4}
                  className="w-full bg-purple-600 hover:bg-purple-500 active:scale-[0.99] text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify & Access Admin Portal'}
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => { setStep('input'); setOtp(''); }}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    Change Number / Email
                  </button>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-purple-400 hover:underline font-bold"
                  >
                    Resend OTP
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* Method 2: Password Login Form */}
        {method === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4 animate-in fade-in">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Admin Email / Username
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@zypergo.com"
                  className="w-full bg-slate-800/70 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 font-medium placeholder:text-slate-500 transition-all"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800/70 border border-slate-700 rounded-xl py-3 pl-11 pr-11 text-white text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 font-medium placeholder:text-slate-500 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 active:scale-[0.99] text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In to Control Center'}
            </button>
          </form>
        )}

        {/* Security Footer */}
        <div className="mt-8 pt-4 border-t border-slate-800/80 text-center text-[11px] text-slate-500 flex items-center justify-center gap-2">
          <Lock size={12} className="text-slate-600" />
          <span>256-Bit SSL Encrypted Admin Session</span>
        </div>

      </div>
    </div>
  );
}
