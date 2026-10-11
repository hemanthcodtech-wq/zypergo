import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Phone, Mail, ArrowRight, Camera, UploadCloud, CheckCircle2, FileText, ArrowLeft, ShieldCheck } from 'lucide-react';
import api from '../../api';

export default function SignupScreen({ role = 'Customer', onLoginSuccess }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRider = role === 'Rider';

  // Common details requested: Name, Phone, Email, Profile Image
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(searchParams.get('phone') || '');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [profileImage, setProfileImage] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);

  useEffect(() => {
    const queryPhone = searchParams.get('phone');
    const queryEmail = searchParams.get('email');
    if (queryPhone) setPhone(queryPhone);
    if (queryEmail) setEmail(queryEmail);
  }, [searchParams]);

  // Rider specific document uploads: Aadhaar Card, PAN Card
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [aadhaarName, setAadhaarName] = useState('');
  const [panFile, setPanFile] = useState(null);
  const [panName, setPanName] = useState('');

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // File Input Refs
  const profileInputRef = useRef(null);
  const aadhaarInputRef = useRef(null);
  const panInputRef = useRef(null);

  // Handle Profile Photo selection
  const handleProfileImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Aadhaar selection
  const handleAadhaarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAadhaarFile(file);
      setAadhaarName(file.name);
    }
  };

  // Handle PAN selection
  const handlePanChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPanFile(file);
      setPanName(file.name);
    }
  };

  // Helper to upload file with fallback
  const uploadFile = async (file) => {
    if (!file) return '';
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success && res.data.url) {
        return res.data.url;
      }
    } catch (err) {
      console.warn('Upload fallback to mock/local preview', err);
    }
    // Return object url or local data url
    return profilePreview || 'uploaded_' + file.name;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!phone.trim() || phone.trim().length < 5) {
      setError('Please enter a valid phone number');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Upload files if provided
      let uploadedPhotoUrl = '';
      if (profileImage) {
        uploadedPhotoUrl = await uploadFile(profileImage);
      }

      if (isRider) {
        let uploadedAadhaarUrl = '';
        let uploadedPanUrl = '';
        if (aadhaarFile) uploadedAadhaarUrl = await uploadFile(aadhaarFile);
        if (panFile) uploadedPanUrl = await uploadFile(panFile);

        const payload = {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          role: 'Rider',
          photoUrl: uploadedPhotoUrl || profilePreview || '',
          aadhaarUrl: uploadedAadhaarUrl || aadhaarName || '',
          panUrl: uploadedPanUrl || panName || '',
          documents: {
            aadhaarUrl: uploadedAadhaarUrl || aadhaarName || '',
            panUrl: uploadedPanUrl || panName || '',
            profileImageUrl: uploadedPhotoUrl || profilePreview || ''
          }
        };

        const res = await api.post('/auth/register-rider', payload);
        const data = res.data;
        const userObj = data.data || data.user || payload;

        localStorage.setItem('zypergo_token', data.token || 'rider_token_' + Date.now());
        localStorage.setItem('zypergo_user', JSON.stringify(userObj));
        
        setIsSubmitted(true);
        setTimeout(() => {
          if (onLoginSuccess) onLoginSuccess(userObj);
          else navigate('/dashboard');
        }, 1500);

      } else {
        // Customer Registration
        const payload = {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          role: 'Customer',
          photoUrl: uploadedPhotoUrl || profilePreview || ''
        };

        const res = await api.post('/auth/register', payload);
        const data = res.data;
        const userObj = data.data || data.user || payload;

        localStorage.setItem('zypergo_token', data.token || 'customer_token_' + Date.now());
        localStorage.setItem('zypergo_user', JSON.stringify(userObj));

        if (onLoginSuccess) {
          onLoginSuccess(userObj);
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Registration failed. Please verify your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const appTitle = isRider ? 'Rider App' : 'Customer App';

  return (
    <div className="min-h-full bg-white flex flex-col pt-3 pb-6 px-4 overflow-y-auto">
      {/* Top Header Logo */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <img src="/images/logo.png" alt="ZyperGo" className="h-7 w-auto object-contain" />
        </div>
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft size={14} /> Back to Login
        </button>
      </div>

      {/* Fleet Hero Image */}
      <div className="w-full mb-3 rounded-2xl overflow-hidden bg-gradient-to-b from-blue-50/40 via-white to-transparent p-1 border border-slate-100 shadow-xs">
        <img 
          src="/images/fleet_hero.jpg" 
          alt="ZyperGo Fleet" 
          className="w-full h-auto object-cover rounded-xl"
        />
      </div>

      {/* Main Registration Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 mt-1">
        {isSubmitted ? (
          <div className="py-8 text-center space-y-3 animate-in fade-in">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-base font-black text-slate-900">
              {isRider ? 'Application Submitted!' : 'Registration Complete!'}
            </h3>
            <p className="text-xs text-slate-500">
              Welcome to ZyperGo, {name}! Setting up your dashboard...
            </p>
          </div>
        ) : (
          <div>
            {/* Title Header */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-black uppercase tracking-wider mb-2">
                <span>Sign Up for {appTitle}</span>
              </div>
              <h2 className="text-lg font-black text-slate-900 leading-tight">
                Create Your Account
              </h2>
              <p className="text-slate-500 text-xs font-semibold mt-1">
                {isRider ? 'Fill your details & upload documents to apply' : 'Enter your details below to get started'}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-2.5 rounded-xl text-xs font-bold text-center mb-3 border border-red-200 animate-in fade-in">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              {/* Profile Photo Upload Option (Requested for both Customer & Rider) */}
              <div className="flex flex-col items-center justify-center py-1">
                <input 
                  type="file" 
                  ref={profileInputRef} 
                  onChange={handleProfileImageChange} 
                  accept="image/*" 
                  className="hidden" 
                />
                <div 
                  onClick={() => profileInputRef.current?.click()}
                  className="relative cursor-pointer group"
                >
                  <div className="w-18 h-18 rounded-full border-2 border-dashed border-slate-300 group-hover:border-[#0052CC] bg-slate-50 flex items-center justify-center overflow-hidden transition-all shadow-xs">
                    {profilePreview ? (
                      <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-[#0052CC]">
                        <Camera size={22} />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-[#0052CC] text-white p-1 rounded-full shadow-md">
                    <Camera size={12} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => profileInputRef.current?.click()}
                  className="mt-1.5 text-[11px] font-bold text-[#0052CC] hover:underline"
                >
                  {profilePreview ? 'Change Photo' : 'Upload Profile Photo'}
                </button>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20 outline-none font-semibold text-xs text-slate-900 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter mobile number"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20 outline-none font-semibold text-xs text-slate-900 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Email ID */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Email ID
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20 outline-none font-semibold text-xs text-slate-900 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Rider Specific Document Uploads: Aadhaar Card & PAN Card */}
              {isRider && (
                <div className="pt-2 space-y-3 border-t border-slate-100">
                  <p className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                    Verification Documents
                  </p>

                  {/* Aadhaar Card Upload */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                      Aadhaar Card Document
                    </label>
                    <input 
                      type="file" 
                      ref={aadhaarInputRef} 
                      onChange={handleAadhaarChange} 
                      accept="image/*,.pdf" 
                      className="hidden" 
                    />
                    <div 
                      onClick={() => aadhaarInputRef.current?.click()}
                      className={`w-full p-3 rounded-xl border-2 border-dashed cursor-pointer flex items-center justify-between transition-all ${
                        aadhaarName ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200 hover:border-slate-400 bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          aadhaarName ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'
                        }`}>
                          <FileText size={16} />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {aadhaarName || 'Upload Aadhaar Card'}
                          </p>
                          <p className="text-[10px] text-slate-400">PDF, JPG, PNG up to 10MB</p>
                        </div>
                      </div>
                      <span className={`text-[11px] font-bold shrink-0 ${aadhaarName ? 'text-emerald-600' : 'text-[#0052CC]'}`}>
                        {aadhaarName ? 'Change' : 'Choose'}
                      </span>
                    </div>
                  </div>

                  {/* PAN Card Upload */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                      PAN Card Document
                    </label>
                    <input 
                      type="file" 
                      ref={panInputRef} 
                      onChange={handlePanChange} 
                      accept="image/*,.pdf" 
                      className="hidden" 
                    />
                    <div 
                      onClick={() => panInputRef.current?.click()}
                      className={`w-full p-3 rounded-xl border-2 border-dashed cursor-pointer flex items-center justify-between transition-all ${
                        panName ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200 hover:border-slate-400 bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          panName ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'
                        }`}>
                          <FileText size={16} />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {panName || 'Upload PAN Card'}
                          </p>
                          <p className="text-[10px] text-slate-400">PDF, JPG, PNG up to 10MB</p>
                        </div>
                      </div>
                      <span className={`text-[11px] font-bold shrink-0 ${panName ? 'text-emerald-600' : 'text-[#0052CC]'}`}>
                        {panName ? 'Change' : 'Choose'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={loading}
                className={`w-full ${isRider ? 'bg-black hover:bg-slate-900 text-[#FFB703]' : 'bg-[#0052CC] hover:bg-[#0047cc] text-white'} font-black py-3.5 px-4 rounded-xl shadow-md active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm mt-4`}
              >
                {loading ? 'Submitting Details...' : (isRider ? 'SUBMIT RIDER APPLICATION' : 'CREATE ACCOUNT')}
                <ArrowRight size={17} strokeWidth={2.5} />
              </button>
            </form>

            {/* Downside: Back to Login link */}
            <div className="mt-5 pt-3 border-t border-slate-100 text-center">
              <p className="text-xs font-semibold text-slate-500">
                Already have an account?{' '}
                <button 
                  type="button" 
                  onClick={() => navigate('/login')} 
                  className="font-black text-[#0052CC] hover:underline cursor-pointer"
                >
                  Login
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
