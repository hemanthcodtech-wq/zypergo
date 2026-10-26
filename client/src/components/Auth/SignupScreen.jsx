import React, { useState, useRef } from 'react';
import { User, Mail, Phone, ArrowRight, ShieldCheck, FileText, CheckCircle2, Camera, Loader2, Headphones, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

export default function SignupScreen({ role = 'Customer', onLoginSuccess }) {
  const navigate = useNavigate();

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  
  // Rider Document State
  const [drivingLicenseUrl, setDrivingLicenseUrl] = useState('');
  const [aadhaarCardUrl, setAadhaarCardUrl] = useState('');
  
  // UI Loading & Error
  const [loading, setLoading] = useState(false);
  const [uploadingField, setUploadingField] = useState(null);
  const [error, setError] = useState('');

  // Refs for file inputs
  const photoInputRef = useRef(null);
  const licenseInputRef = useRef(null);
  const aadhaarInputRef = useRef(null);

  const isPrefixCustomer = window.location.pathname.startsWith('/customer');
  const isPrefixRider = window.location.pathname.startsWith('/rider');
  const loginUrl = role === 'Rider' 
    ? (isPrefixRider ? '/rider/login' : '/login') 
    : (isPrefixCustomer ? '/customer/login' : '/login');

  const handleFileUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(field);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success && res.data?.url) {
        if (field === 'profilePhoto') setProfilePhoto(res.data.url);
        if (field === 'drivingLicense') setDrivingLicenseUrl(res.data.url);
        if (field === 'aadhaarCard') setAadhaarCardUrl(res.data.url);
      } else {
        // Fallback preview if upload endpoint doesn't return URL
        const reader = new FileReader();
        reader.onloadend = () => {
          if (field === 'profilePhoto') setProfilePhoto(reader.result);
          if (field === 'drivingLicense') setDrivingLicenseUrl(reader.result);
          if (field === 'aadhaarCard') setAadhaarCardUrl(reader.result);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      // Create local object URL as fallback for smooth user flow
      const fallbackUrl = URL.createObjectURL(file);
      if (field === 'profilePhoto') setProfilePhoto(fallbackUrl);
      if (field === 'drivingLicense') setDrivingLicenseUrl(fallbackUrl);
      if (field === 'aadhaarCard') setAadhaarCardUrl(fallbackUrl);
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || (!email && !phone)) {
      setError('Please provide your Name and Mobile Number or Email');
      return;
    }

    if (role === 'Rider' && (!drivingLicenseUrl || !aadhaarCardUrl)) {
      setError('Please upload both Driving License and Aadhaar Card');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (role === 'Rider') {
        // Instant Rider Registration (no admin approval required)
        const res = await api.post('/auth/register-rider', {
          name,
          email,
          phone,
          profilePhoto,
          drivingLicenseUrl,
          aadhaarCardUrl
        });

        const data = res.data;
        if (data.token) {
          localStorage.setItem('zypergo_token', data.token);
          localStorage.setItem('zypergo_user', JSON.stringify(data.data));
          if (onLoginSuccess) onLoginSuccess(data.data);
          else navigate('/dashboard');
        } else {
          navigate(loginUrl);
        }
      } else {
        // Instant Customer Account Creation
        const res = await api.post('/auth/register', {
          name,
          email,
          phone,
          profilePhoto,
          role: 'Customer'
        });

        const data = res.data;
        if (data.token) {
          localStorage.setItem('zypergo_token', data.token);
          localStorage.setItem('zypergo_user', JSON.stringify(data.data));
          if (onLoginSuccess) onLoginSuccess(data.data);
          else navigate('/dashboard');
        } else {
          navigate(loginUrl);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-full flex justify-center font-sans antialiased text-slate-900">
      <div className="w-full max-w-md bg-white relative flex flex-col pt-3 pb-8 px-5">
        
        {/* Top Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/images/logo.png" alt="ZyperGo" className="h-8 w-auto object-contain" />
          </div>
          <button 
            type="button"
            onClick={() => navigate('/support')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs text-xs font-bold"
          >
            <Headphones size={14} className="text-slate-600" />
            <span>Help</span>
          </button>
        </div>

        {/* Role Badge & Title */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border text-[11px] font-black tracking-wide bg-blue-50 text-[#0052CC] border-blue-200 mb-2">
            <span>{role === 'Rider' ? 'Rider Partner Onboarding' : 'Customer Account Creation'}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">
            {role === 'Rider' ? 'Drive & Earn with' : 'Create Account on'}<br />
            <span className="text-[#FF6B00]">ZyperGo Logistics.</span>
          </h1>
          <p className="text-slate-500 text-[11px] font-semibold mt-1">
            {role === 'Rider' 
              ? 'Complete instant registration to start receiving local delivery trips immediately.' 
              : 'Enter your details below to create your account and book shipments.'}
          </p>
        </div>

        {/* Main Registration Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          
          {error && (
            <div className="bg-red-50 text-red-600 p-2.5 rounded-xl text-xs font-bold text-center mb-4 border border-red-200 animate-in fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Profile Photo Upload */}
            <div className="flex flex-col items-center justify-center py-2">
              <input 
                type="file" 
                ref={photoInputRef} 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => handleFileUpload(e, 'profilePhoto')} 
              />
              <div 
                onClick={() => photoInputRef.current?.click()}
                className="relative w-20 h-20 rounded-full border-2 border-dashed border-slate-300 hover:border-[#0052CC] bg-slate-50 flex items-center justify-center cursor-pointer transition-all overflow-hidden group shadow-xs"
              >
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-slate-400 group-hover:text-[#0052CC]">
                    {uploadingField === 'profilePhoto' ? (
                      <Loader2 size={22} className="animate-spin text-[#0052CC]" />
                    ) : (
                      <>
                        <Camera size={22} />
                        <span className="text-[9px] font-bold mt-0.5">Photo</span>
                      </>
                    )}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold">
                  Change
                </div>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 mt-1.5">
                Upload Profile Photo
              </span>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Enter full name" 
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0052CC] outline-none font-semibold text-xs text-slate-900 transition-all"
                  required 
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  placeholder="Enter 10-digit mobile number" 
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0052CC] outline-none font-semibold text-xs text-slate-900 transition-all"
                  required 
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="name@example.com" 
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0052CC] outline-none font-semibold text-xs text-slate-900 transition-all"
                  required 
                />
              </div>
            </div>

            {/* Rider Specific: Driving License & Aadhaar Card Documents */}
            {role === 'Rider' && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="block text-xs font-black text-slate-800">
                  Required Partner Documents
                </span>

                {/* Driving License */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <FileText size={15} className="text-[#0052CC]" /> Driving License
                    </span>
                    {drivingLicenseUrl ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 size={12} /> Uploaded
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400">Required</span>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={licenseInputRef} 
                    accept="image/*,.pdf" 
                    className="hidden" 
                    onChange={(e) => handleFileUpload(e, 'drivingLicense')} 
                  />
                  <button 
                    type="button" 
                    onClick={() => licenseInputRef.current?.click()} 
                    className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                  >
                    {uploadingField === 'drivingLicense' ? (
                      <Loader2 size={14} className="animate-spin text-[#0052CC]" />
                    ) : (
                      <Upload size={14} className="text-slate-500" />
                    )}
                    <span>{drivingLicenseUrl ? 'Change License Document' : 'Upload Driving License'}</span>
                  </button>
                </div>

                {/* Aadhaar Card */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <FileText size={15} className="text-[#FF6B00]" /> Aadhaar Card
                    </span>
                    {aadhaarCardUrl ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 size={12} /> Uploaded
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400">Required</span>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={aadhaarInputRef} 
                    accept="image/*,.pdf" 
                    className="hidden" 
                    onChange={(e) => handleFileUpload(e, 'aadhaarCard')} 
                  />
                  <button 
                    type="button" 
                    onClick={() => aadhaarInputRef.current?.click()} 
                    className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                  >
                    {uploadingField === 'aadhaarCard' ? (
                      <Loader2 size={14} className="animate-spin text-[#FF6B00]" />
                    ) : (
                      <Upload size={14} className="text-slate-500" />
                    )}
                    <span>{aadhaarCardUrl ? 'Change Aadhaar Document' : 'Upload Aadhaar Card'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full font-black py-3.5 rounded-xl shadow-md active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm mt-3 ${
                role === 'Rider' 
                  ? 'bg-black hover:bg-slate-800 text-[#FFB703]' 
                  : 'bg-[#0052CC] hover:bg-[#0047cc] text-white'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>{role === 'Rider' ? 'Submit & Create Rider Account' : 'Create Customer Account'}</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>

          </form>

          {/* Bottom Login Link */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500 font-semibold">Already have an account?</p>
            <button
              type="button"
              onClick={() => navigate(loginUrl)}
              className="mt-1 text-xs font-black text-[#0052CC] hover:underline inline-flex items-center gap-1"
            >
              <span>Log In to {role === 'Rider' ? 'Rider Partner Portal' : 'Customer Account'}</span>
              <ArrowRight size={13} />
            </button>
          </div>

        </div>

        {/* Bottom Tagline */}
        <div className="text-center mt-4">
          <p className="text-xs font-black text-slate-800">Trusted logistics made simple.</p>
          <p className="text-[10px] font-bold text-slate-500 mt-0.5">Fast • Secure • Reliable</p>
        </div>

      </div>
    </div>
  );
}
