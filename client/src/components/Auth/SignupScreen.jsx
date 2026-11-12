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
  Image as ImageIcon,
  Plus,
  Trash2,
  Users,
  Package
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api';
import { getImageUrl } from '../../utils/imageUrl';
import { sanitizeDigits, handleNumericKeyDown } from '../../utils/inputValidation';

export default function SignupScreen({ role = 'Customer', initialMode = null, onLoginSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();
  const urlMode = new URLSearchParams(location.search).get('mode');
  const resolvedDefaultMode =
    initialMode === 'Helper' || (urlMode || '').toLowerCase() === 'helper' || location.pathname.includes('/helper/')
      ? 'Helper'
      : 'Captain';

  // Basic Info State
  const [partnerMode, setPartnerMode] = useState(resolvedDefaultMode);
  const [helperWorkType, setHelperWorkType] = useState('Load & Unload');
  const [captainPhone, setCaptainPhone] = useState('');
  const [helpers, setHelpers] = useState([]);
  const [uploadingHelperIdx, setUploadingHelperIdx] = useState(null);

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

  const isPrefixCustomer = window.location.pathname.startsWith('/customer');
  const isPrefixRider = window.location.pathname.startsWith('/rider');
  const loginModeQuery = partnerMode === 'Helper' ? 'helper' : 'captain';
  const loginUrl = role === 'Rider' 
    ? `${isPrefixRider ? '/rider/login' : '/login'}?mode=${loginModeQuery}` 
    : (isPrefixCustomer ? '/customer/login' : '/login');

  const handleHelperPhotoUpload = async (e, idx) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localPreview = URL.createObjectURL(file);
    setHelpers((prev) => prev.map((h, i) => (i === idx ? { ...h, profilePhoto: localPreview } : h)));
    setUploadingHelperIdx(idx);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post('/upload', fd);
      if (res.data?.success && res.data?.url) {
        const resolved = getImageUrl(res.data.url);
        setHelpers((prev) => prev.map((h, i) => (i === idx ? { ...h, profilePhoto: resolved } : h)));
      }
    } catch (err) {
      console.warn('Helper photo fallback to local preview:', err.message);
    } finally {
      setUploadingHelperIdx(null);
    }
  };

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
    const validHelpers = helpers.filter((h) => h.name.trim() || h.phone.trim() || h.email.trim());

    if (role === 'Rider') {
      if (partnerMode === 'Helper') {
        if (captainPhone && captainPhone.length !== 10) {
          setError('Captain mobile number must be 10 digits (or leave blank).');
          return;
        }
        if (!aadhaarCardUrl) {
          setError('Please upload your Aadhaar Card');
          return;
        }
      } else {
        if (!vehicleNumber.trim()) {
          setError('Please enter your Vehicle Registration Number (e.g. TS 09 EA 1234)');
          return;
        }
        if (!drivingLicenseUrl || !aadhaarCardUrl) {
          setError('Please upload both Driving License and Aadhaar Card');
          return;
        }
        for (let i = 0; i < validHelpers.length; i += 1) {
          const h = validHelpers[i];
          if (!h.name.trim() || sanitizeDigits(h.phone, 10).length !== 10) {
            setError(`Please enter a valid Name and 10-digit Mobile Number for Helper #${i + 1}`);
            return;
          }
        }
      }
    }

    setLoading(true);
    setError('');

    try {
      if (role === 'Rider') {
        const res = await api.post('/auth/register-rider', partnerMode === 'Helper'
          ? {
              name,
              email,
              phone,
              profilePhoto,
              partnerMode: 'Helper',
              helperWorkType,
              captainPhone: captainPhone ? sanitizeDigits(captainPhone, 10) : undefined,
              aadhaarCardUrl
            }
          : {
              name,
              email,
              phone,
              profilePhoto,
              partnerMode: 'Captain',
              vehicleType: finalVehicleType,
              vehicleNumber: vehicleNumber.toUpperCase().trim(),
              vehicleRegistration: vehicleNumber.toUpperCase().trim(),
              vehicleImageUrl,
              drivingLicenseUrl,
              aadhaarCardUrl,
              helpers: validHelpers.map((h) => ({
                name: h.name.trim(),
                phone: sanitizeDigits(h.phone, 10),
                email: h.email.trim(),
                helperWorkType: h.helperWorkType || 'Load & Unload',
                profilePhoto: h.profilePhoto || ''
              }))
            });

        const data = res.data;
        if (data.token) {
          localStorage.setItem('zypergo_token', data.token);
          const userData = partnerMode === 'Helper'
            ? data.data
            : {
                ...data.data,
                riderDetails: {
                  ...(data.data?.riderDetails || {}),
                  partnerMode: 'Captain',
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
          <div className="flex items-center gap-2" />
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
          <div className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border text-[11px] font-black tracking-wide mb-2 ${
            role === 'Rider' && partnerMode === 'Helper'
              ? 'bg-teal-50 text-[#006D77] border-teal-200'
              : 'bg-blue-50 text-[#0052CC] border-blue-200'
          }`}>
            <span>
              {role === 'Rider'
                ? (partnerMode === 'Helper' ? 'Helper Partner Onboarding' : 'Captain Partner Onboarding')
                : 'Customer Account Creation'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">
            {role === 'Rider'
              ? (partnerMode === 'Helper' ? 'Join as Helper with' : 'Drive & Earn with')
              : 'Create Account on'}<br />
            <span className="text-[#FF6B00]">ZyperGo Logistics.</span>
          </h1>
          <p className="text-slate-500 text-[11px] font-semibold mt-1">
            {role === 'Rider' 
              ? (partnerMode === 'Helper'
                  ? 'Register for parcel loading and unloading work and access your dedicated Helper panel.'
                  : 'Complete onboarding with vehicle details and optionally register helpers under you.')
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

            {/* Select Mode Dropdown (Captain vs Helper) */}
            {role === 'Rider' && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Mode
                </label>
                <select
                  value={partnerMode}
                  onChange={(e) => {
                    setPartnerMode(e.target.value);
                    setError('');
                  }}
                  className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl focus:border-[#006D77] outline-none font-black text-xs text-slate-900 cursor-pointer shadow-2xs"
                >
                  <option value="Captain">Captain (Driver &amp; Vehicle Partner)</option>
                  <option value="Helper">Helper (Load &amp; Unload Partner)</option>
                </select>
                <p className="text-[10px] text-slate-500 font-medium mt-1.5">
                  {partnerMode === 'Captain'
                    ? 'Register with your vehicle and optionally add Helpers under your account.'
                    : 'Choose Helper mode if you handle parcel loading and/or unloading.'}
                </p>
              </div>
            )}

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
                {role === 'Rider' && partnerMode === 'Helper' ? 'Upload Helper Profile Photo' : 'Upload Profile Photo'}
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
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  value={phone} 
                  onChange={(e) => setPhone(sanitizeDigits(e.target.value, 10))} 
                  onKeyDown={(e) => handleNumericKeyDown(e, phone, 10)}
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

            {/* Helper Specific Fields */}
            {role === 'Rider' && partnerMode === 'Helper' && (
              <div className="space-y-3.5 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 uppercase tracking-wider">
                  <Package size={15} className="text-[#006D77]" />
                  <span>Helper Work Details</span>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1">
                    Select Work Type
                  </label>
                  <select
                    value={helperWorkType}
                    onChange={(e) => setHelperWorkType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#006D77] outline-none font-bold text-xs text-slate-900 cursor-pointer"
                  >
                    <option value="Load & Unload">Load &amp; Unload Both</option>
                    <option value="Load Only">Load Only</option>
                    <option value="Unload Only">Unload Only</option>
                  </select>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">
                    Choose whether you do Loading only, Unloading only, or both.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1">
                    Captain Mobile Number (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={captainPhone}
                      onChange={(e) => setCaptainPhone(sanitizeDigits(e.target.value, 10))}
                      onKeyDown={(e) => handleNumericKeyDown(e, captainPhone, 10)}
                      placeholder="Link under Captain's 10-digit phone (if any)"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#006D77] outline-none font-semibold text-xs text-slate-900 transition-all"
                    />
                  </div>
                </div>

                {/* Aadhaar Card Upload for Helper */}
                <div className="pt-2 border-t border-slate-100 space-y-2.5">
                  <span className="block text-xs font-black text-slate-800">
                    Required KYC Document
                  </span>
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

            {/* Captain Specific: Vehicle Details, Photo & Optional Helpers */}
            {role === 'Rider' && partnerMode === 'Captain' && (
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

                {/* Register Helpers Under Captain (Optional) */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 uppercase tracking-wider">
                      <Users size={15} className="text-[#006D77]" />
                      <span>Helpers Under You (Optional)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHelpers((prev) => [
                        ...prev,
                        { id: Date.now() + Math.random(), name: '', phone: '', email: '', helperWorkType: 'Load & Unload', profilePhoto: '' }
                      ])}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-[#006D77] border border-teal-200 text-[11px] font-black cursor-pointer transition-colors"
                    >
                      <Plus size={13} />
                      <span>Add Helper</span>
                    </button>
                  </div>

                  {helpers.length === 0 ? (
                    <p className="text-[11px] text-slate-400 font-medium bg-slate-50 border border-dashed border-slate-200 rounded-xl p-3">
                      You can register loading/unloading Helpers now or later from your Captain Profile. They can sign in using &ldquo;Login as Helper&rdquo;.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {helpers.map((helper, idx) => (
                        <div key={helper.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                              Helper #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => setHelpers((prev) => prev.filter((_, i) => i !== idx))}
                              className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 cursor-pointer"
                              title="Remove Helper"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          {/* Helper Photo Upload */}
                          <div className="flex items-center gap-3">
                            <label className="w-12 h-12 rounded-full bg-white border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden cursor-pointer shrink-0 relative">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleHelperPhotoUpload(e, idx)}
                              />
                              {helper.profilePhoto ? (
                                <img src={getImageUrl(helper.profilePhoto)} alt="Helper" className="w-full h-full object-cover" />
                              ) : uploadingHelperIdx === idx ? (
                                <Loader2 size={16} className="animate-spin text-[#006D77]" />
                              ) : (
                                <Camera size={16} className="text-slate-400" />
                              )}
                            </label>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-slate-700">Helper Profile Photo</p>
                              <p className="text-[10px] text-slate-400">Tap camera circle to upload helper photo</p>
                            </div>
                          </div>

                          <input
                            type="text"
                            value={helper.name}
                            onChange={(e) => setHelpers((prev) => prev.map((h, i) => (i === idx ? { ...h, name: e.target.value } : h)))}
                            placeholder="Helper Full Name"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-[#006D77]"
                          />

                          <input
                            type="tel"
                            inputMode="numeric"
                            maxLength={10}
                            value={helper.phone}
                            onChange={(e) => {
                              const cleaned = sanitizeDigits(e.target.value, 10);
                              setHelpers((prev) => prev.map((h, i) => (i === idx ? { ...h, phone: cleaned } : h)));
                            }}
                            onKeyDown={(e) => handleNumericKeyDown(e, helper.phone, 10)}
                            placeholder="Helper 10-digit Mobile Number"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-[#006D77]"
                          />

                          <input
                            type="email"
                            value={helper.email}
                            onChange={(e) => setHelpers((prev) => prev.map((h, i) => (i === idx ? { ...h, email: e.target.value } : h)))}
                            placeholder="Helper Email (Optional)"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-[#006D77]"
                          />

                          <div>
                            <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                              Helper Work Type
                            </label>
                            <select
                              value={helper.helperWorkType}
                              onChange={(e) => setHelpers((prev) => prev.map((h, i) => (i === idx ? { ...h, helperWorkType: e.target.value } : h)))}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-[#006D77] cursor-pointer"
                            >
                              <option value="Load & Unload">Load &amp; Unload Both</option>
                              <option value="Load Only">Load Only</option>
                              <option value="Unload Only">Unload Only</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full font-black py-3.5 rounded-xl shadow-md active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm mt-3 cursor-pointer ${
                role === 'Rider' 
                  ? (partnerMode === 'Helper' ? 'bg-[#006D77] hover:bg-[#00555d] text-white' : 'bg-black hover:bg-slate-800 text-[#FFB703]')
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
                  <span>
                    {role === 'Rider'
                      ? (partnerMode === 'Helper' ? 'Create Helper Account' : 'Submit & Create Captain Account')
                      : 'Create Customer Account'}
                  </span>
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
              className="mt-1 text-xs font-black text-[#0052CC] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>
                Log In to {role === 'Rider'
                  ? (partnerMode === 'Helper' ? 'Helper Partner Portal' : 'Captain Partner Portal')
                  : 'Customer Account'}
              </span>
              <ArrowRight size={13} />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
