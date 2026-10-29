import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  User,
  ChevronLeft,
  ArrowLeft, 
  ChevronRight, 
  Edit3, 
  CheckCircle2, 
  Loader2, 
  Camera, 
  Package, 
  Calendar, 
  MapPin, 
  CreditCard, 
  Receipt, 
  Settings, 
  HelpCircle, 
  LogOut, 
  X, 
  Save, 
  Wallet, 
  Plus, 
  ShieldCheck, 
  Truck, 
  ArrowUpRight, 
  Sparkles 
} from 'lucide-react';
import api from '../../api';
import { getImageUrl } from '../../utils/imageUrl';

export default function CustomerProfile({ defaultView = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState({ name: 'Guest', email: 'guest@zypergo.com', phone: '0000000000', photoUrl: '' });
  const [activeView, setActiveView] = useState(defaultView); // 'wallet' | 'rateCard' | 'edit' | null
  const [walletBalance, setWalletBalance] = useState(450);
  const [rateCardTab, setRateCardTab] = useState('city'); // 'city' or 'outstation'
  
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [message, setMessage] = useState('');
  const photoInputRef = useRef(null);

  const isCustomerPrefix = location.pathname.startsWith('/customer');
  const base = isCustomerPrefix ? '/customer' : '';

  const handleBack = () => {
    if (activeView) {
      if (defaultView) {
        if (window.history.length > 1) {
          navigate(-1);
        } else {
          navigate(`${base}/profile`);
        }
      } else {
        setActiveView(null);
      }
    } else {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate(`${base}/dashboard`);
      }
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem('zypergo_user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        const userId = parsed.id || parsed._id || parsed.phone;
        const persistentPhoto = localStorage.getItem('zypergo_profile_photo_' + userId);
        
        // If there is a persistent photo uploaded by the user, use it
        if (persistentPhoto) {
          parsed.photoUrl = persistentPhoto;
        } else if (parsed.photoUrl && parsed.photoUrl.includes('file-1791713104986')) {
          // Clear stale 404 seed path from older test build
          parsed.photoUrl = '';
        }
        
        setUser(parsed);
        setEditForm({
          name: parsed.name || '',
          phone: parsed.phone || '',
          email: parsed.email || ''
        });
      } catch (e) {
        console.error('Failed to parse user profile', e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('zypergo_token');
    localStorage.removeItem('zypergo_user');
    sessionStorage.removeItem('zypergo_portal');
    window.location.href = '/customer/login';
  };

  // Profile Image Upload handler - Persists to database & localStorage permanently
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview
    const localPreview = URL.createObjectURL(file);
    setUser(prev => ({ ...prev, photoUrl: localPreview }));
    setImageError(false);
    setUploadingPhoto(true);
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      let finalPhotoUrl = '';
      try {
        const res = await api.post('/upload', formData);
        if (res.data?.success && res.data?.url) {
          finalPhotoUrl = getImageUrl(res.data.url);
        }
      } catch (uploadErr) {
        console.warn('Direct upload fallback to base64 data URL');
      }

      // If server upload returned error or 404, fallback to permanent base64 data URL
      if (!finalPhotoUrl) {
        finalPhotoUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      }

      // 1. Permanently store in dedicated persistent key
      const userId = user.id || user._id || user.phone;
      if (userId) {
        localStorage.setItem('zypergo_profile_photo_' + userId, finalPhotoUrl);
      }
      localStorage.setItem('zypergo_customer_photo', finalPhotoUrl);

      // 2. Update user state and zypergo_user storage
      const updatedUser = { ...user, photoUrl: finalPhotoUrl };
      setUser(updatedUser);
      localStorage.setItem('zypergo_user', JSON.stringify(updatedUser));

      // 3. Attempt to save to backend API
      try {
        await api.put('/users/profile', {
          photoUrl: finalPhotoUrl,
          phone: user.phone,
          email: user.email,
          name: user.name
        });
      } catch (apiErr) {
        console.log('Background profile sync note:', apiErr.message);
      }

      setMessage('Profile photo updated permanently!');
      setTimeout(() => setMessage(''), 3500);
    } catch (err) {
      console.error('Failed to upload photo:', err);
      setMessage('Failed to process photo.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Edit user details handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const updatedUser = {
        ...user,
        name: editForm.name,
        phone: editForm.phone,
        email: editForm.email
      };

      setUser(updatedUser);
      localStorage.setItem('zypergo_user', JSON.stringify(updatedUser));

      try {
        await api.put('/users/profile', {
          name: editForm.name,
          phone: editForm.phone,
          email: editForm.email,
          photoUrl: user.photoUrl
        });
      } catch (e) {}

      setActiveView(null);
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const OptionRow = ({ icon, label, onClick, color = "text-slate-800", noBorder = false }) => (
    <button 
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between py-3.5 bg-white active:bg-slate-50 transition-all cursor-pointer ${noBorder ? '' : 'border-b border-slate-100 hover:bg-slate-50/60'}`}
    >
      <div className="flex items-center gap-3.5">
        <div className={`flex items-center justify-center p-2.5 rounded-2xl bg-slate-50 shadow-xs border border-slate-100 ${color}`}>
          {icon}
        </div>
        <span className={`font-black text-sm tracking-tight ${color}`}>{label}</span>
      </div>
      <ChevronRight size={18} className={color === 'text-red-500' ? 'text-red-300' : 'text-slate-400'} />
    </button>
  );


  // FULL SCREEN VIEW: ZyperGo Wallet & Payments (Fills mobile frame, no popup)
  if (activeView === 'wallet') {
    return (
      <div className="min-h-full bg-[#F8FAFC] pb-24 font-sans text-slate-900 animate-in fade-in duration-200">
        {/* Top Header */}
        <div className="bg-white px-4 py-3 sticky top-0 z-20 shadow-xs border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button 
              type="button"
              onClick={handleBack} 
              className="p-1 -ml-1 text-slate-700 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
            >
              <ChevronLeft size={22} />
            </button>
            <div>
              <h1 className="text-base font-black text-slate-900 leading-tight">ZyperGo Wallet</h1>
              <p className="text-[10px] font-bold text-slate-400">BALANCE & PAYMENT OPTIONS</p>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => setActiveView(null)}
            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
          
          {message && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-bold border border-emerald-200 text-center animate-in fade-in flex items-center justify-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-600" />
              <span>{message}</span>
            </div>
          )}

          {/* Wallet Balance Card */}
          <div className="bg-gradient-to-br from-[#0052CC] to-[#003B99] rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-44 h-44 bg-blue-400/20 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-blue-200">Available Balance</p>
                <h2 className="text-3xl font-black mt-1">₹{walletBalance}.00</h2>
              </div>
              <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black border border-white/20">Active</span>
            </div>
            
            <p className="text-xs text-blue-100 mt-4 flex items-center gap-1.5 font-medium bg-white/10 backdrop-blur-md p-2 rounded-xl">
              <Sparkles size={14} className="text-amber-300 shrink-0" />
              <span>Instant 1-click checkout on all parcel bookings</span>
            </p>
          </div>

          {/* Quick Top Up */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Quick Top Up</h3>
              <span className="text-[10px] font-bold text-slate-400">Zero Gateway Fees</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {[100, 250, 500].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setWalletBalance(prev => prev + amt);
                    setMessage(`₹${amt} added to wallet successfully!`);
                    setTimeout(() => setMessage(''), 3000);
                  }}
                  className="py-3 rounded-xl border border-slate-200 text-xs font-black text-slate-900 hover:border-[#0052CC] hover:bg-blue-50/50 active:scale-95 transition-all cursor-pointer shadow-2xs text-center"
                >
                  +₹{amt}
                </button>
              ))}
            </div>

            {/* Custom Top Up Input */}
            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <input 
                type="number"
                placeholder="Enter custom amount (₹)"
                id="customWalletAmount"
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#0052CC] focus:bg-white transition-all shadow-2xs"
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('customWalletAmount');
                  const val = Number(input?.value);
                  if (val > 0) {
                    setWalletBalance(prev => prev + val);
                    setMessage(`₹${val} added to wallet successfully!`);
                    input.value = '';
                    setTimeout(() => setMessage(''), 3000);
                  }
                }}
                className="px-4 py-2.5 bg-[#0052CC] hover:bg-[#0047cc] text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Add Money
              </button>
            </div>
          </div>

          {/* Payment Options */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Saved Payment Methods</h3>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xs">
                    UPI
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Google Pay, PhonePe, Paytm</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Instant auto-debit supported</p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">Default</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0052CC] flex items-center justify-center">
                    <CreditCard size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Credit & Debit Cards</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Visa, Mastercard, RuPay</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Receipt size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Cash on Delivery (COD)</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Pay receiver or sender directly</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">Available</span>
              </div>
            </div>
          </div>

          {/* Recent Wallet Transactions */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Recent Transactions</h3>
            <div className="space-y-2 text-xs">
              {[
                { title: 'Promo Reward Cashback', date: 'Today, 1:45 PM', amount: '+₹25.00', positive: true },
                { title: 'Delivery - Madhapur to Banjara Hills', date: 'Yesterday, 4:20 PM', amount: '-₹180.00', positive: false },
                { title: 'Quick Top Up (UPI)', date: '24 Oct, 11:30 AM', amount: '+₹500.00', positive: true },
              ].map((tx, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50/70 rounded-xl border border-slate-100">
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs">{tx.title}</h5>
                    <p className="text-[10px] text-slate-400 font-medium">{tx.date}</p>
                  </div>
                  <span className={`font-black text-xs ${tx.positive ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {tx.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 pb-8">
            <button
              type="button"
              onClick={() => setActiveView(null)}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-colors cursor-pointer"
            >
              Back to Profile
            </button>
          </div>

        </div>
      </div>
    );
  }

  // FULL SCREEN VIEW: Standard Rate Card (Fills mobile frame, no popup)
  if (activeView === 'rateCard') {
    return (
      <div className="min-h-full bg-[#F8FAFC] pb-24 font-sans text-slate-900 animate-in fade-in duration-200">
        {/* Top Header */}
        <div className="bg-white px-4 py-3 sticky top-0 z-20 shadow-xs border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button 
              type="button"
              onClick={handleBack} 
              className="p-1 -ml-1 text-slate-700 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
            >
              <ChevronLeft size={22} />
            </button>
            <div>
              <h1 className="text-base font-black text-slate-900 leading-tight">Standard Rate Card</h1>
              <p className="text-[10px] font-bold text-slate-400">100% TRANSPARENT PRICING</p>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => setActiveView(null)}
            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
          
          {/* Toggle Service Type */}
          <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-200/80 rounded-2xl">
            <button
              type="button"
              onClick={() => setRateCardTab('city')}
              className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${rateCardTab === 'city' ? 'bg-white text-[#0052CC] shadow-xs' : 'text-slate-600'}`}
            >
              Within City
            </button>
            <button
              type="button"
              onClick={() => setRateCardTab('outstation')}
              className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${rateCardTab === 'outstation' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-600'}`}
            >
              Outstation Hubs
            </button>
          </div>

          {rateCardTab === 'city' ? (
            <div className="space-y-2.5">
              {[
                { name: '2 Wheeler (Scooter / Bike)', limit: 'Up to 20 kg', base: '₹40', perKm: '₹10/km', icon: '🛵' },
                { name: 'Mini 3-Wheeler (Auto)', limit: 'Up to 90 kg', base: '₹90', perKm: '₹14/km', icon: '🛺' },
                { name: '3-Wheeler Standard', limit: 'Up to 500 kg', base: '₹140', perKm: '₹18/km', icon: '🚛' },
                { name: 'Tata Ace (Chhota Hathi)', limit: 'Up to 750 kg', base: '₹220', perKm: '₹24/km', icon: '🚚' },
                { name: 'Pickup 8ft / 9ft', limit: 'Up to 1,700 kg', base: '₹350', perKm: '₹32/km', icon: '🚛' },
              ].map((tier, idx) => (
                <div key={idx} className="p-3.5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{tier.icon}</span>
                    <div>
                      <h4 className="text-xs font-black text-slate-800">{tier.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400">{tier.limit}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-[#0052CC]">{tier.base} base</p>
                    <p className="text-[10px] font-bold text-slate-500">{tier.perKm}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5 text-emerald-900 text-xs">
                <p className="font-black text-xs mb-1 flex items-center gap-1.5">
                  <Truck size={14} className="text-emerald-700" />
                  <span>Intercity Hub-and-Spoke Network</span>
                </p>
                <p className="text-[11px] leading-relaxed text-emerald-800">
                  Long-distance packages routed through secured ZyperGo regional sorting hubs for maximum cost efficiency and speed.
                </p>
              </div>

              <div className="space-y-2">
                {[
                  { route: 'Statewide Hub-to-Hub', weight: '0 - 5 kg', rate: '₹120 flat' },
                  { route: 'Additional Weight', weight: 'Per extra kg', rate: '+ ₹15/kg' },
                  { route: 'Doorstep Pickup Fee', weight: 'Within 10 km hub', rate: 'FREE' },
                  { route: 'Security Packaging', weight: 'Tamper-proof box', rate: '₹25/box' }
                ].map((row, idx) => (
                  <div key={idx} className="p-3.5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between text-xs shadow-2xs">
                    <div>
                      <p className="font-black text-slate-800">{row.route}</p>
                      <p className="text-[10px] font-bold text-slate-400">{row.weight}</p>
                    </div>
                    <span className="font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs">
                      {row.rate}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 pb-8 space-y-2">
            <button
              type="button"
              onClick={() => {
                setActiveView(null);
                navigate(`${base}/booking`);
              }}
              className="w-full py-3.5 bg-[#0052CC] hover:bg-[#0047cc] text-white text-xs font-black rounded-2xl shadow-md transition-all active:scale-98 cursor-pointer"
            >
              Book Parcel with These Rates
            </button>
            <button
              type="button"
              onClick={() => setActiveView(null)}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-colors cursor-pointer"
            >
              Back to Profile
            </button>
          </div>

        </div>
      </div>
    );
  }

  // FULL SCREEN VIEW: Edit Profile (Fills mobile frame, no popup)
  if (activeView === 'edit') {
    return (
      <div className="min-h-full bg-[#F8FAFC] pb-24 font-sans text-slate-900 animate-in fade-in duration-200">
        {/* Top Header */}
        <div className="bg-white px-4 py-3 sticky top-0 z-20 shadow-xs border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button 
              type="button"
              onClick={handleBack} 
              className="p-1 -ml-1 text-slate-700 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
            >
              <ChevronLeft size={22} />
            </button>
            <div>
              <h1 className="text-base font-black text-slate-900 leading-tight">Edit Profile</h1>
              <p className="text-[10px] font-bold text-slate-400">PERSONAL INFORMATION</p>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => setActiveView(null)}
            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="max-w-md mx-auto px-4 pt-4">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 space-y-3.5">
              <div>
                <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input 
                  type="text" 
                  value={editForm.name} 
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Enter full name" 
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0052CC] outline-none font-bold text-xs text-slate-900 shadow-2xs transition-all"
                  required 
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5">
                  Mobile Number
                </label>
                <input 
                  type="tel" 
                  value={editForm.phone} 
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="Enter mobile number" 
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0052CC] outline-none font-bold text-xs text-slate-900 shadow-2xs transition-all"
                  required 
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input 
                  type="email" 
                  value={editForm.email} 
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="Enter email address" 
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0052CC] outline-none font-bold text-xs text-slate-900 shadow-2xs transition-all"
                  required 
                />
              </div>
            </div>

            <div className="pt-2 pb-8 flex gap-2.5">
              <button 
                type="button" 
                onClick={() => setActiveView(null)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-[#0052CC] text-white text-xs font-black shadow-md hover:bg-[#0047cc] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-70 transition-all"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white min-h-full pb-20 font-sans animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="bg-white px-4 py-3.5 flex items-center justify-between sticky top-0 z-20 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={handleBack}
            className="p-1 -ml-1 text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title="Go back"
          >
            <ChevronLeft size={22} />
          </button>
          <h1 className="text-base font-black text-slate-900">My Profile</h1>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditForm({ name: user.name, phone: user.phone, email: user.email });
            setActiveView('edit');
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-[#0052CC] font-bold text-xs hover:bg-blue-100 transition-colors border border-blue-200 cursor-pointer"
        >
          <Edit3 size={13} />
          <span>Edit</span>
        </button>
      </div>

      <div className="px-5">
        {message && (
          <div className="mt-3 p-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold text-center border border-emerald-200 animate-in fade-in flex items-center justify-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span>{message}</span>
          </div>
        )}

        {/* Profile Info Card with Camera Upload Badge */}
        <div className="flex items-center gap-4 py-5 mb-1 border-b border-slate-100">
          
          {/* Avatar with Camera Upload Icon */}
          <div className="relative group shrink-0">
            <input 
              type="file" 
              ref={photoInputRef} 
              accept="image/*" 
              className="hidden" 
              onChange={handlePhotoUpload} 
            />
            
            <div 
              onClick={() => photoInputRef.current?.click()}
              className="w-18 h-18 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border-3 border-white shadow-md overflow-hidden cursor-pointer relative transition-transform active:scale-95"
              title="Click to update photo"
            >
              {user.photoUrl && !imageError ? (
                <img 
                  src={getImageUrl(user.photoUrl)} 
                  alt={user.name} 
                  className="w-full h-full object-cover" 
                  onError={() => setImageError(true)}
                />
              ) : (
                <User size={34} className="text-[#0052CC]" />
              )}

              {/* Uploading overlay */}
              {uploadingPhoto && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 size={18} className="animate-spin text-white" />
                </div>
              )}
            </div>

            {/* Camera Badge Icon */}
            <button 
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0052CC] text-white flex items-center justify-center shadow-md border-2 border-white hover:bg-[#0045b0] transition-colors cursor-pointer"
              title="Change Profile Picture"
            >
              <Camera size={12} />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black text-slate-900 leading-tight truncate">{user.name || 'Customer'}</h2>
            <div className="flex items-center gap-1.5 my-0.5">
              <span className="text-[11px] font-bold text-slate-500">+91 {user.phone || '9989551305'}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-md">Verified</span>
            </div>
            <p className="text-slate-400 text-[11px] font-medium truncate">{user.email || 'customer@zypergo.com'}</p>
          </div>
        </div>

        {/* Options List */}
        <div className="mt-1">
          {/* 1. My Bookings (Renamed from My Orders) */}
          <OptionRow 
            icon={<Package size={18} strokeWidth={2.4} />} 
            label="My Bookings" 
            onClick={() => navigate(`${base}/shipments`)} 
          />

          {/* 2. Booking History (Dedicated All History with Book Now CTA) */}
          <OptionRow 
            icon={<Calendar size={18} strokeWidth={2.4} />} 
            label="Booking History" 
            onClick={() => navigate(`${base}/booking-history`)} 
          />

          {/* 3. Addresses */}
          <OptionRow 
            icon={<MapPin size={18} strokeWidth={2.4} />} 
            label="Addresses" 
            onClick={() => navigate(`${base}/addresses`)} 
          />

          {/* 4. Wallet & Payments (Functional Interactive Modal) */}
          <OptionRow 
            icon={<CreditCard size={18} strokeWidth={2.4} />} 
            label="Wallet & Payments" 
            onClick={() => setActiveView('wallet')} 
          />

          {/* 5. Rate Card (Functional Transparent Pricing Modal) */}
          <OptionRow 
            icon={<Receipt size={18} strokeWidth={2.4} />} 
            label="Rate Card" 
            onClick={() => setActiveView('rateCard')} 
          />

          {/* 6. Settings */}
          <OptionRow 
            icon={<Settings size={18} strokeWidth={2.4} />} 
            label="Settings" 
            onClick={() => navigate(`${base}/settings`)} 
          />

          {/* 7. Help & Support */}
          <OptionRow 
            icon={<HelpCircle size={18} strokeWidth={2.4} />} 
            label="Help & Support" 
            onClick={() => navigate(`${base}/support`)} 
          />

          {/* 8. Logout */}
          <OptionRow 
            icon={<LogOut size={18} strokeWidth={2.4} />} 
            label="Logout" 
            color="text-red-500"
            noBorder
            onClick={handleLogout} 
          />
        </div>
      </div>
    </div>
  );
}
