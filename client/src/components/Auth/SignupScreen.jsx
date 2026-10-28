import React, { useState, useRef } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  ArrowRight, 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  Camera, 
  Loader2, 
  Headphones, 
  Upload, 
  Truck, 
  Car, 
  Bike, 
  Edit3, 
  Image as ImageIcon 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import api from '../../api';
import { getImageUrl } from '../../utils/imageUrl';

export default function SignupScreen({ role = 'Customer', onLoginSuccess }) {
  const navigate = useNavigate();

  // Basic Info State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');

  // Rider Vehicle State
  const [vehicleType, setVehicleType] = useState('Bike');
  const [customVehicleType, setCustomVehicleType] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleImageUrl, setVehicleImageUrl] = useState('');

  // Rider Document State
  const [drivingLicenseUrl, setDrivingLicenseUrl] = useState('');
  const [aadhaarCardUrl, setAadhaarCardUrl] = useState('');

  // UI Loading & Error
  const [loading, setLoading] = useState(false);
  const [uploadingField, setUploadingField] = useState(null);
  const [error, setError] = useState('');

  // Refs for file inputs
  const photoInputRef = useRef(null);
  const vehiclePhotoInputRef = useRef(null);
  const licenseInputRef = useRef(null);
  const aadhaarInputRef = useRef(null);

  const signupWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError('');
      try {
        if (role === 'Customer') {
          const res = await api.post('/auth/google', {
            accessToken: tokenResponse.access_token,
            role: 'Customer',
            isSignup: true
          });
          const data = res.data;
          localStorage.setItem('zypergo_token', data.token);
          localStorage.setItem('zypergo_user', JSON.stringify(data.data));
          if (onLoginSuccess) onLoginSuccess(data.data);
          else navigate('/dashboard');
        } else {
          // For Rider: fetch Google profile details to auto-fill registration
          const gRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
          });
          const gData = await gRes.json();
          if (gData.name) setName(gData.name);
          if (gData.email) setEmail(gData.email);
          if (gData.picture) setProfilePhoto(gData.picture);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Google signup failed');
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Google sign-up was cancelled')
  });

  const isPrefixCustomer = window.location.pathname.startsWith('/customer');
  const isPrefixRider = window.location.pathname.startsWith('/rider');
  const loginUrl = role === 'Rider' 
    ? (isPrefixRider ? '/rider/login' : '/login') 
    : (isPrefixCustomer ? '/customer/login' : '/login');

  const vehicleOptions = [
    { id: 'Bike', label: 'Bike', icon: <Bike size={14} /> },
    { id: 'Scooter', label: 'Scooter', icon: <Bike size={14} /> },
    { id: 'Car', label: 'Car', icon: <Car size={14} /> },
    { id: 'Auto / Heavy Vehicle', label: 'Auto / Heavy Vehicle', icon: <Truck size={14} /> },
    { id: 'Trucks', label: 'Trucks', icon: <Truck size={14} /> },
    { id: 'Other', label: 'Manual Entry...', icon: <Edit3 size={14} /> }
  ];

  const handleFileUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Immediately create local preview so user sees their photo with zero delay
    const localPreview = URL.createObjectURL(file);
    if (field === 'profilePhoto') setProfilePhoto(localPreview);
    if (field === 'vehicleImage') setVehicleImageUrl(localPreview);
    if (field === 'drivingLicense') setDrivingLicenseUrl(localPreview);
    if (field === 'aadhaarCard') setAadhaarCardUrl(localPreview);

    setUploadingField(field);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/upload', formData);

      if (res.data?.success && res.data?.url) {
        const resolved = getImageUrl(res.data.url);
        if (field === 'profilePhoto') setProfilePhoto(resolved);
        if (field === 'vehicleImage') setVehicleImageUrl(resolved);
        if (field === 'drivingLicense') setDrivingLicenseUrl(resolved);
        if (field === 'aadhaarCard') setAadhaarCardUrl(resolved);
      }
    } catch (err) {
      console.warn("Upload fallback to local preview:", err.message);
      // Keep localPreview so user is never blocked
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

    const finalVehicleType = vehicleType === 'Other' ? (customVehicleType.trim() || 'Custom Vehicle') : vehicleType;

    if (role === 'Rider') {
      if (!vehicleNumber.trim()) {
        setError('Please enter your Vehicle Registration Number (e.g. TS 09 EA 1234)');
        return;
      }
      if (!drivingLicenseUrl || !aadhaarCardUrl) {
        setError('Please upload both Driving License and Aadhaar Card');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      if (role === 'Rider') {
        const res = await api.post('/auth/register-rider', {
          name,
          email,
          phone,
          profilePhoto,
          vehicleType: finalVehicleType,
          vehicleNumber: vehicleNumber.toUpperCase().trim(),
          vehicleRegistration: vehicleNumber.toUpperCase().trim(),
          vehicleImageUrl,
          drivingLicenseUrl,
          aadhaarCardUrl
        });

        const data = res.data;
        if (data.token) {
          localStorage.setItem('zypergo_token', data.token);
          const userData = {
            ...data.data,
            riderDetails: {
              ...(data.data?.riderDetails || {}),
              vehicleType: finalVehicleType,
              vehicleRegistration: vehicleNumber.toUpperCase().trim(),
              vehicleImageUrl
            }
          };
          localStorage.setItem('zypergo_user', JSON.stringify(userData));
          if (onLoginSuccess) onLoginSuccess(userData);
          else navigate('/dashboard');
        } else {
          navigate(loginUrl);
        }
      } else {
        // Customer Account Creation
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
      <div className="w-full max-w-md bg-white relative flex flex-col pt-3 pb-16 px-5">
        
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
              ? 'Complete onboarding with vehicle details to start accepting local missions.' 
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
            <div className="flex flex-col items-center justify-center py-1">
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
                  <img 
                    src={getImageUrl(profilePhoto)} 
                    alt="Profile" 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      e.target.onerror = null;
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center text-slate-400 group-hover:text-[#0052CC]">
                    <Camera size={22} />
                    <span className="text-[9px] font-bold mt-0.5">Photo</span>
                  </div>
                )}
                {uploadingField === 'profilePhoto' && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                    <Loader2 size={22} className="animate-spin text-white" />
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

            {/* Rider Specific: Vehicle Details & Photo */}
            {role === 'Rider' && (
              <div className="space-y-3.5 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 uppercase tracking-wider">
                  <Truck size={15} className="text-[#FF6B00]" />
                  <span>Vehicle Information</span>
                </div>

                {/* Vehicle Type Selection */}
                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5">
                    Vehicle Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {vehicleOptions.map((opt) => (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => setVehicleType(opt.id)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                          vehicleType === opt.id
                            ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {opt.icon}
                        <span className="truncate">{opt.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Manual Vehicle Entry if 'Other' chosen */}
                  {vehicleType === 'Other' && (
                    <div className="mt-2 animate-in fade-in">
                      <input 
                        type="text" 
                        value={customVehicleType} 
                        onChange={(e) => setCustomVehicleType(e.target.value)} 
                        placeholder="Enter custom vehicle type (e.g. EV Van, Bolero, 3-Wheeler)" 
                        className="w-full px-3.5 py-2 bg-amber-50/50 border border-amber-300 rounded-xl focus:bg-white focus:border-amber-500 outline-none font-bold text-xs text-slate-900"
                        required 
                      />
                    </div>
                  )}
                </div>

                {/* Vehicle Number Input */}
                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1">
                    Vehicle Number / Registration Plate
                  </label>
                  <input 
                    type="text" 
                    value={vehicleNumber} 
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())} 
                    placeholder="e.g. TS 09 EA 1234 / AP 21 BX 9876" 
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0052CC] outline-none font-black text-xs tracking-wider text-slate-900 uppercase"
                    required 
                  />
                  <p className="text-[10px] text-slate-400 font-medium mt-1">
                    Enter full registration number as shown on the vehicle RC.
                  </p>
                </div>

                {/* Vehicle Image Upload */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <ImageIcon size={15} className="text-amber-500" /> Vehicle Photo
                    </span>
                    {vehicleImageUrl ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 size={12} /> Uploaded
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400">Recommended</span>
                    )}
                  </div>

                  {vehicleImageUrl && (
                    <div className="mb-2 relative rounded-lg overflow-hidden border border-slate-200 max-h-28 flex items-center justify-center bg-slate-900">
                      <img src={getImageUrl(vehicleImageUrl)} alt="Vehicle Preview" className="w-full h-28 object-cover" />
                    </div>
                  )}

                  <input 
                    type="file" 
                    ref={vehiclePhotoInputRef} 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => handleFileUpload(e, 'vehicleImage')} 
                  />
                  <button 
                    type="button" 
                    onClick={() => vehiclePhotoInputRef.current?.click()} 
                    className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    {uploadingField === 'vehicleImage' ? (
                      <Loader2 size={14} className="animate-spin text-[#0052CC]" />
                    ) : (
                      <Camera size={14} className="text-slate-500" />
                    )}
                    <span>{vehicleImageUrl ? 'Change Vehicle Photo' : 'Upload Vehicle Photo'}</span>
                  </button>
                </div>

                {/* Required Partner Documents */}
                <div className="pt-2 border-t border-slate-100 space-y-2.5">
                  <span className="block text-xs font-black text-slate-800">
                    Required KYC Documents
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
                      className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
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
                      className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
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
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full font-black py-3.5 rounded-xl shadow-md active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm mt-3 cursor-pointer ${
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

            {/* Google Quick Sign-Up */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => signupWithGoogle()} 
                className="flex items-center justify-center gap-2.5 w-full py-2.5 px-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all bg-white shadow-2xs font-bold text-xs text-slate-800 active:scale-[0.98] cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>{role === 'Rider' ? 'Pre-fill with Google' : 'Sign up with Google'}</span>
              </button>
            </div>

          </form>

          {/* Bottom Login Link */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500 font-semibold">Already have an account?</p>
            <button
              type="button"
              onClick={() => navigate(loginUrl)}
              className="mt-1 text-xs font-black text-[#0052CC] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Log In to {role === 'Rider' ? 'Rider Partner Portal' : 'Customer Account'}</span>
              <ArrowRight size={13} />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
