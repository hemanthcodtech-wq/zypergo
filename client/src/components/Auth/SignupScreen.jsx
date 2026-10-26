import React, { useState, useRef } from 'react';
import { User, UserPlus, Mail, Phone, KeyRound, ArrowRight, ShieldCheck, Truck, FileText, CheckCircle2, Camera, Loader2, AlertTriangle, Eye, EyeOff, Headphones, Shield, Zap, Star, Compass } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import CameraModal from '../common/CameraModal';

export default function SignupScreen({ role = 'Customer', onLoginSuccess }) {
  const navigate = useNavigate();

  const handleSwitchRole = () => {
    sessionStorage.removeItem('zypergo_portal');
    window.location.href = '/login?select=true';
  };
  // Common details
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // OTP state
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('details'); // details -> vehicle (Rider) -> documents (Rider) -> otp/success
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(null);

  // Rider Specific State
  const licenseInputRef = useRef(null);
  const rcInputRef = useRef(null);
  const [riderData, setRiderData] = useState({
    vehicleType: 'Bike',
    vehicleRegistration: '',
    vehicleMake: '',
    vehicleModel: '',
    rcNumber: '',
    address: '',
    bankDetails: { accountNumber: '', ifscCode: '' },
    emergencyContact: { name: '', phone: '' },
    documents: { drivingLicenseUrl: '', rcUrl: '', aadhaarUrl: '', panUrl: '', vehiclePicUrl: '', profileImageUrl: '' }
  });
  const [cameraConfig, setCameraConfig] = useState({ isOpen: false, field: null });

  const handleFileUpload = async (e, field) => {
    const file = e.target ? e.target.files[0] : e;
    if (!file) return;

    setUploadingDoc(field);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const data = res.data;
      if (data.success) {
        setRiderData(prev => ({
          ...prev,
          documents: { ...prev.documents, [field]: data.url }
        }));
      } else {
        setError(data.message || 'File upload failed');
      }
    } catch (err) {
      console.error(err);
      setError('Error uploading file');
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleDetailsNext = (e) => {
    e.preventDefault();
    if (role !== 'Rider' && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');

    if (role === 'Rider') {
      setStep('vehicle');
    } else {
      handleFinalCustomerSignup();
    }
  };

  const handleVehicleNext = (e) => {
    e.preventDefault();
    setStep('documents');
  };

  const handleFinalCustomerSignup = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/register', {
        name,
        email,
        phone,
        password,
        role
      });
      const data = res.data;
      localStorage.setItem('zypergo_token', data.token);
      localStorage.setItem('zypergo_user', JSON.stringify(data.data));
      if (onLoginSuccess) {
        onLoginSuccess(data.data);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRiderFinalSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/register-rider', {
        name,
        email,
        phone,
        ...riderData
      });
      if (res.data.success) {
        setStep('success');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Rider application failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#F8FAFC] flex justify-center font-sans antialiased text-slate-900">
      {/* Mobile-first Constrained App Container */}
      <div className="w-full max-w-md bg-white min-h-[100dvh] relative shadow-2xl flex flex-col pt-5 pb-8 px-5 overflow-y-auto">
        
        {/* Top Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/images/logo.png" alt="ZyperGo" className="h-8 w-auto object-contain" />
          </div>
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={handleSwitchRole}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-xs text-xs font-bold"
              title="Select another portal or role"
            >
              <Compass size={14} className="text-slate-500" />
              <span>Switch Role</span>
            </button>
            <button 
              type="button"
              onClick={() => navigate('/support')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Headphones size={15} className="text-slate-600" />
              <span className="text-xs font-bold">Help</span>
            </button>
          </div>
        </div>

        {/* Header Text */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border text-[11px] font-black tracking-wide bg-blue-50 text-[#0052CC] border-blue-200 mb-2">
            <span>{role === 'Rider' ? 'Rider Partner Onboarding' : (role === 'Partner' ? 'Hauler / Partner Registration' : 'Customer Account Creation')}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">
            {role === 'Rider' ? 'Become a Rider Partner.' : (role === 'Partner' ? 'Register Your Fleet.' : 'Create Customer Account.')}<br />
            <span className="text-[#FF6B00]">{role === 'Rider' ? 'Deliver & Earn Daily.' : 'Ship Smarter Today.'}</span>
          </h1>
          <p className="text-slate-500 text-[11px] font-semibold mt-1">
            {role === 'Rider' ? 'Partner with ZyperGo to deliver packages with zero deposit & instant payout' : 'Fast, secure parcel delivery at your fingertips across all cities'}
          </p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 mt-1">
          
          {/* Segmented Pill Tabs */}
          {step === 'details' && (
            <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="flex-1 py-2.5 text-xs font-black rounded-lg flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900 transition-all"
              >
                <User size={15} /> Login
              </button>
              <button
                type="button"
                className="flex-1 py-2.5 text-xs font-black rounded-lg flex items-center justify-center gap-1.5 bg-[#0052CC] text-white shadow-xs"
              >
                <UserPlus size={15} /> Register
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-2.5 rounded-xl text-xs font-bold text-center mb-3 border border-red-200 animate-in fade-in">
              {error}
            </div>
          )}

          {/* Rider Progress Tracker */}
          {role === 'Rider' && step !== 'success' && (
            <div className="flex justify-between border-b border-slate-100 pb-3 mb-4">
              {['details', 'vehicle', 'documents'].map((s, i) => {
                const isActive = step === s;
                const isPast = ['details', 'vehicle', 'documents'].indexOf(step) > i;
                return (
                  <div key={s} className={`flex items-center gap-1.5 ${isActive || isPast ? 'text-[#0052CC]' : 'text-slate-400'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black border ${isActive || isPast ? 'bg-[#0052CC] text-white border-[#0052CC]' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                      {i + 1}
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider">{s}</span>
                  </div>
                );
              })}
            </div>
          )}

          {step === 'details' && (
            <form onSubmit={handleDetailsNext} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input required type="text" placeholder="John Doe" className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20 outline-none text-xs font-semibold text-slate-900 transition-all" value={name} onChange={e => setName(e.target.value)} />
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input required type="email" placeholder="name@example.com" className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20 outline-none text-xs font-semibold text-slate-900 transition-all" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input required type="tel" placeholder="9876543210" className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20 outline-none text-xs font-semibold text-slate-900 transition-all" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} />
                </div>
              </div>
              
              {role !== 'Rider' && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Password</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                      <input required type={showPassword ? "text" : "password"} placeholder="••••••" className="w-full pl-8 pr-7 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0052CC] outline-none text-xs font-semibold text-slate-900" value={password} onChange={e => setPassword(e.target.value)} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Confirm</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                      <input required type={showConfirmPassword ? "text" : "password"} placeholder="••••••" className="w-full pl-8 pr-7 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0052CC] outline-none text-xs font-semibold text-slate-900" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                        {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#0052CC] hover:bg-[#0047cc] text-white font-black py-3 rounded-xl shadow-md active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm mt-3"
              >
                {loading ? 'Creating...' : (role === 'Rider' ? 'Next: Vehicle Details' : 'Register Securely')}
                <ArrowRight size={17} />
              </button>
            </form>
          )}

          {step === 'vehicle' && (
            <form onSubmit={handleVehicleNext} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Vehicle Type</label>
                <select 
                  value={riderData.vehicleType} 
                  onChange={e => setRiderData({ ...riderData, vehicleType: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900"
                >
                  <option value="Bike">2-Wheeler (Bike / Scooter)</option>
                  <option value="3Wheeler">3-Wheeler (Auto / Cargo)</option>
                  <option value="TataAce">Tata Ace / 7ft</option>
                  <option value="8ft">Pickup 8ft</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Registration Number</label>
                <input required type="text" placeholder="AP 04 AB 1234" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold" value={riderData.vehicleRegistration} onChange={e => setRiderData({ ...riderData, vehicleRegistration: e.target.value })} />
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => setStep('details')} className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl">Back</button>
                <button type="submit" className="flex-1 bg-[#0052CC] text-white font-black text-xs py-3 rounded-xl shadow-md">Next: Documents</button>
              </div>
            </form>
          )}

          {step === 'documents' && (
            <div className="space-y-3">
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-800">Driving License</span>
                  {riderData.documents.drivingLicenseUrl && <CheckCircle2 size={16} className="text-emerald-500" />}
                </div>
                <input type="file" ref={licenseInputRef} className="hidden" onChange={e => handleFileUpload(e, 'drivingLicenseUrl')} />
                <button type="button" onClick={() => licenseInputRef.current?.click()} className="w-full py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-1.5">
                  <FileText size={14} /> {riderData.documents.drivingLicenseUrl ? 'Change License' : 'Upload License'}
                </button>
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => setStep('vehicle')} className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl">Back</button>
                <button type="button" onClick={handleRiderFinalSubmit} disabled={loading} className="flex-1 bg-[#0052CC] text-white font-black text-xs py-3 rounded-xl shadow-md">
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-base font-black text-slate-900">Application Submitted!</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">Our team will verify your documents and send you approval details via email/SMS.</p>
              <button onClick={() => navigate('/login')} className="mt-4 px-6 py-2.5 bg-[#0052CC] text-white text-xs font-bold rounded-xl shadow-md">
                Go to Login
              </button>
            </div>
          )}

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
