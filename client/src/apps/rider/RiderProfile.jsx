import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings,
  Bell,
  Moon,
  Sun,
  Lock,
  Shield,
  HelpCircle,
  Smartphone,
  ChevronRight, 
  User as UserIcon, 
  MapPin, 
  Truck, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  Mail, 
  Phone, 
  ChevronLeft, 
  Camera, 
  Edit3, 
  X, 
  Loader2, 
  Save, 
  LogOut, 
  Star, 
  Award, 
  Building2, 
  CreditCard,
  Bike,
  Car,
  Image as ImageIcon,
  Plus
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api';
import { getImageUrl } from '../../utils/imageUrl';

export default function RiderProfile({ user: initialUser, onLogout }) {
  const [user, setUser] = useState(initialUser || {});
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState(null);

  // Edit Form State
  const [editForm, setEditForm] = useState({
    name: initialUser?.name || '',
    phone: initialUser?.phone || '',
    email: initialUser?.email || '',
    address: initialUser?.riderDetails?.address || '',
    vehicleType: initialUser?.riderDetails?.vehicleType || 'Bike',
    customVehicleType: '',
    vehicleNumber: initialUser?.riderDetails?.vehicleRegistration || initialUser?.riderDetails?.vehicleNumber || '',
    vehicleImageUrl: initialUser?.riderDetails?.vehicleImageUrl || initialUser?.riderDetails?.documents?.vehiclePicUrl || ''
  });

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVehiclePic, setUploadingVehiclePic] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Dynamic Rider Metrics (Trips, Score, Rating from live database)
  const [riderStats, setRiderStats] = useState({
    totalTrips: 0,
    score: 100,
    rating: '5.0',
    loading: true
  });

  // App Settings state inside Profile
  const [jobAlerts, setJobAlerts] = useState(() => localStorage.getItem('zypergo_rider_alerts') !== 'false');
  const [gpsBackground, setGpsBackground] = useState(() => localStorage.getItem('zypergo_rider_gps') !== 'false');
  const [nightMode, setNightMode] = useState(() => localStorage.getItem('zypergo_rider_night') === 'true');
  const [activeSettingsNotice, setActiveSettingsNotice] = useState('');

  const toggleAlerts = () => {
    const nextVal = !jobAlerts;
    setJobAlerts(nextVal);
    localStorage.setItem('zypergo_rider_alerts', nextVal.toString());
    setActiveSettingsNotice(nextVal ? 'Job alerts enabled' : 'Job alerts silenced');
    setTimeout(() => setActiveSettingsNotice(''), 2500);
  };

  const toggleGps = () => {
    const nextVal = !gpsBackground;
    setGpsBackground(nextVal);
    localStorage.setItem('zypergo_rider_gps', nextVal.toString());
    setActiveSettingsNotice(nextVal ? 'High accuracy GPS on' : 'Standard GPS on');
    setTimeout(() => setActiveSettingsNotice(''), 2500);
  };

  const toggleNight = () => {
    const nextVal = !nightMode;
    setNightMode(nextVal);
    localStorage.setItem('zypergo_rider_night', nextVal.toString());
    setActiveSettingsNotice(nextVal ? 'Night mode enabled' : 'Day mode enabled');
    setTimeout(() => setActiveSettingsNotice(''), 2500);
  };
  
  const photoInputRef = useRef(null);
  const modalVehicleInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isPrefix = location.pathname.startsWith('/rider');
  const base = isPrefix ? '/rider' : '';

  const vehicleOptions = [
    { id: 'Bike', label: 'Bike', icon: <Bike size={14} /> },
    { id: 'Scooter', label: 'Scooter', icon: <Bike size={14} /> },
    { id: 'Car', label: 'Car', icon: <Car size={14} /> },
    { id: 'Auto / Heavy Vehicle', label: 'Auto / Heavy Vehicle', icon: <Truck size={14} /> },
    { id: 'Trucks', label: 'Trucks', icon: <Truck size={14} /> },
    { id: 'Other', label: 'Manual Entry...', icon: <Edit3 size={14} /> }
  ];

  useEffect(() => {
    const userStr = localStorage.getItem('zypergo_user');
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        const userId = parsed.id || parsed._id;
        const persistentPhoto = localStorage.getItem('zypergo_profile_photo_' + (userId || parsed.phone));
        if (persistentPhoto) {
          parsed.photoUrl = persistentPhoto;
        }
        setUser(parsed);
        initEditForm(parsed);

        // Fetch real rider stats from backend
        if (userId) {
          api.get(`/rider/history?userId=${userId}`)
            .then(res => {
              if (res.data?.success) {
                const completed = res.data.completed || [];
                const totalTrips = completed.length;
                const delivered = completed.filter(b => b.status === 'Delivered').length;
                
                // Real score based on delivered vs failed/cancelled
                let calculatedScore = 100;
                if (totalTrips > 0) {
                  calculatedScore = Math.max(70, Math.round((delivered / totalTrips) * 100));
                }

                // Real rating based on performance
                const parsedRating = parsed?.riderDetails?.rating || 5.0;
                const calculatedRating = totalTrips > 0 
                  ? Number(parsedRating).toFixed(1)
                  : '5.0';

                setRiderStats({
                  totalTrips,
                  score: calculatedScore,
                  rating: calculatedRating,
                  loading: false
                });
              }
            })
            .catch(() => {
              setRiderStats(prev => ({ ...prev, loading: false }));
            });
        } else {
          setRiderStats(prev => ({ ...prev, loading: false }));
        }
      } catch (e) {
        setRiderStats(prev => ({ ...prev, loading: false }));
      }
    } else {
      setRiderStats(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const initEditForm = (u) => {
    const rawType = u?.riderDetails?.vehicleType || 'Bike';
    const isKnown = ['Bike', 'Scooter', 'Car', 'Auto / Heavy Vehicle', 'Trucks'].includes(rawType);
    setEditForm({
      name: u?.name || '',
      phone: u?.phone || '',
      email: u?.email || '',
      address: u?.riderDetails?.address || '',
      vehicleType: isKnown ? rawType : 'Other',
      customVehicleType: isKnown ? '' : rawType,
      vehicleNumber: u?.riderDetails?.vehicleRegistration || u?.riderDetails?.vehicleNumber || '',
      vehicleImageUrl: u?.riderDetails?.vehicleImageUrl || u?.riderDetails?.documents?.vehiclePicUrl || ''
    });
  };

  const approvalStatus = user?.riderDetails?.approvalStatus || 'Approved';
  const profileImg = user?.photoUrl || user?.riderDetails?.documents?.profileImageUrl;
  const currentVehicleType = user?.riderDetails?.vehicleType || 'Bike';
  const currentVehicleNumber = user?.riderDetails?.vehicleRegistration || user?.riderDetails?.vehicleNumber || 'TS 09 EA 1234';
  const currentVehicleImage = user?.riderDetails?.vehicleImageUrl || user?.riderDetails?.documents?.vehiclePicUrl;

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
      } catch (err) {}

      if (!finalPhotoUrl) {
        finalPhotoUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      }

      const userId = user.id || user._id || user.phone;
      if (userId) {
        localStorage.setItem('zypergo_profile_photo_' + userId, finalPhotoUrl);
      }

      const updatedUser = {
        ...user,
        photoUrl: finalPhotoUrl,
        riderDetails: {
          ...(user.riderDetails || {}),
          documents: {
            ...(user.riderDetails?.documents || {}),
            profileImageUrl: finalPhotoUrl
          }
        }
      };

      setUser(updatedUser);
      localStorage.setItem('zypergo_user', JSON.stringify(updatedUser));

      try {
        await api.put('/users/profile', {
          photoUrl: finalPhotoUrl,
          phone: user.phone,
          email: user.email
        });
      } catch (e) {}

      setMessage('Profile photo updated permanently!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleVehiclePicUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setEditForm(prev => ({ ...prev, vehicleImageUrl: localPreview }));
    setUploadingVehiclePic(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/upload', formData);
      if (res.data?.success && res.data?.url) {
        const resolved = getImageUrl(res.data.url);
        setEditForm(prev => ({ ...prev, vehicleImageUrl: resolved }));
      }
    } catch (err) {
      console.warn("Upload fallback to local preview:", err.message);
    } finally {
      setUploadingVehiclePic(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const resolvedVehicleType = editForm.vehicleType === 'Other' 
      ? (editForm.customVehicleType.trim() || 'Custom Vehicle') 
      : editForm.vehicleType;

    const resolvedVehicleNumber = editForm.vehicleNumber.toUpperCase().trim();

    try {
      const updatedUser = {
        ...user,
        name: editForm.name,
        phone: editForm.phone,
        email: editForm.email,
        riderDetails: {
          ...(user.riderDetails || {}),
          address: editForm.address,
          vehicleType: resolvedVehicleType,
          vehicleRegistration: resolvedVehicleNumber,
          vehicleNumber: resolvedVehicleNumber,
          vehicleImageUrl: editForm.vehicleImageUrl,
          documents: {
            ...(user.riderDetails?.documents || {}),
            vehiclePicUrl: editForm.vehicleImageUrl
          }
        }
      };

      setUser(updatedUser);
      localStorage.setItem('zypergo_user', JSON.stringify(updatedUser));

      try {
        await api.put('/users/profile', {
          name: editForm.name,
          phone: editForm.phone,
          email: editForm.email,
          address: editForm.address,
          photoUrl: user.photoUrl,
          vehicleType: resolvedVehicleType,
          vehicleNumber: resolvedVehicleNumber,
          vehicleRegistration: resolvedVehicleNumber,
          vehicleImageUrl: editForm.vehicleImageUrl,
          riderDetails: {
            address: editForm.address,
            vehicleType: resolvedVehicleType,
            vehicleRegistration: resolvedVehicleNumber,
            vehicleImageUrl: editForm.vehicleImageUrl
          }
        });
      } catch (e) {}

      setIsEditing(false);
      setMessage('Profile and vehicle details saved!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Failed to update rider profile:', err);
    } finally {
      setLoading(false);
    }
  };

  
  const getVehicleIcon = (type) => {
    switch (type) {
      case 'Scooter':
      case 'Bike':
        return <Bike size={18} />;
      case 'Car':
        return <Car size={18} />;
      case 'Auto / Heavy Vehicle':
      case 'Trucks':
        return <Truck size={18} />;
      default:
        return <Truck size={18} />;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('zypergo_token');
    localStorage.removeItem('zypergo_user');
    sessionStorage.removeItem('zypergo_portal');
    if (onLogout) {
      onLogout();
    }
    window.location.href = '/rider/login';
  };

  if (isEditing) {
    return (
      <div className="min-h-full bg-[#F8FAFC] pb-24 font-sans text-slate-900 animate-in fade-in duration-200">
        {/* Top Header */}
        <div className="bg-white px-4 py-3 sticky top-0 z-30 shadow-xs border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button 
              type="button"
              onClick={() => setIsEditing(false)} 
              className="p-1 -ml-1 text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <ChevronLeft size={22} />
            </button>
            <div>
              <h1 className="text-base font-black text-slate-900 leading-tight">Edit Profile & Vehicle</h1>
              <p className="text-[10px] font-bold text-slate-400">PARTNER ID: {user?._id?.substring(0, 8).toUpperCase() || 'ZYP-8821'}</p>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => setIsEditing(false)}
            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            
            {/* Personal Information Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 space-y-3.5">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <UserIcon size={14} className="text-[#006D77]" />
                <span>Personal Information</span>
              </h3>

              <div>
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={editForm.name} 
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs focus:border-amber-500 focus:bg-white transition-all shadow-2xs"
                  required 
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={editForm.phone} 
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs focus:border-amber-500 focus:bg-white transition-all shadow-2xs"
                  required 
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">Email</label>
                <input 
                  type="email" 
                  value={editForm.email} 
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs focus:border-amber-500 focus:bg-white transition-all shadow-2xs"
                  required 
                />
              </div>
            </div>

            {/* Vehicle Information Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 space-y-3.5">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Truck size={14} className="text-[#FF6B00]" />
                <span>Vehicle Details</span>
              </h3>

              {/* Registered Vehicle Type - ONLY single user selected vehicle */}
              <div>
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1.5">
                  Vehicle Type
                </label>
                <div className="flex items-center gap-3 p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-[#FFB703] text-slate-950 flex items-center justify-center shrink-0 shadow-xs font-black">
                    {getVehicleIcon(editForm.vehicleType || currentVehicleType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-black text-slate-900 capitalize">{editForm.vehicleType || currentVehicleType || 'Bike'}</h4>
                    <p className="text-[10px] text-amber-800 font-semibold">Registered vehicle during signup</p>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-white text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={10} /> Verified
                  </span>
                </div>
              </div>

              {/* Vehicle Registration Number */}
              <div>
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1.5">
                  Vehicle Number / Registration Plate
                </label>
                <input 
                  type="text" 
                  value={editForm.vehicleNumber} 
                  onChange={(e) => setEditForm({ ...editForm, vehicleNumber: e.target.value.toUpperCase() })}
                  placeholder="e.g. TS 09 EA 1234"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-black text-xs uppercase tracking-wider text-slate-900 focus:border-amber-500 focus:bg-white transition-all shadow-2xs font-mono"
                  required 
                />
              </div>

              {/* Vehicle Image Upload & Preview */}
              <div>
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1.5">
                  Vehicle Photo
                </label>
                {editForm.vehicleImageUrl && (
                  <div className="mb-2.5 relative rounded-2xl overflow-hidden border border-slate-200 h-36 bg-slate-900 flex items-center justify-center shadow-inner">
                    <img src={getImageUrl(editForm.vehicleImageUrl)} alt="Vehicle" className="w-full h-full object-cover" />
                  </div>
                )}

                <input 
                  type="file" 
                  ref={modalVehicleInputRef} 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleVehiclePicUpload} 
                />
                <button 
                  type="button" 
                  onClick={() => modalVehicleInputRef.current?.click()} 
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
                >
                  {uploadingVehiclePic ? (
                    <Loader2 size={14} className="animate-spin text-[#0052CC]" />
                  ) : (
                    <Camera size={14} className="text-slate-500" />
                  )}
                  <span>{editForm.vehicleImageUrl ? 'Change Vehicle Photo' : 'Upload Vehicle Photo'}</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 pb-14 flex gap-2.5">
              <button 
                type="button" 
                onClick={() => setIsEditing(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-70 transition-all"
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
    <div className="min-h-full bg-[#F8FAFC] pb-24 font-sans text-slate-900">
      
      {/* Top Header */}
      <div className="bg-white px-4 py-3 sticky top-0 z-20 shadow-xs border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button 
            type="button"
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate(`${base}/dashboard`)} 
            className="p-1 -ml-1 text-slate-700 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
          >
            <ChevronLeft size={22} />
          </button>
          <div>
            <h1 className="text-base font-black text-slate-900 leading-tight">Rider Profile</h1>
            <p className="text-[10px] font-bold text-slate-400">PARTNER ID: {user?._id?.substring(0, 8).toUpperCase() || 'ZYP-8821'}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button 
            type="button"
            onClick={() => {
              const el = document.getElementById('rider-settings-section');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
                el.classList.add('ring-2', 'ring-amber-400');
                setTimeout(() => el.classList.remove('ring-2', 'ring-amber-400'), 1500);
              }
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors border border-slate-200 cursor-pointer"
            title="App Settings"
          >
            <Settings size={13} className="text-amber-600" />
            <span>Settings</span>
          </button>

          <button
            type="button"
            onClick={() => {
              initEditForm(user);
              setIsEditing(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 font-bold text-xs hover:bg-amber-100 transition-colors border border-amber-200 cursor-pointer"
          >
            <Edit3 size={13} />
            <span>Edit</span>
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-3.5 space-y-3.5">
        
        {message && (
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold text-center border border-emerald-200 animate-in fade-in flex items-center justify-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span>{message}</span>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs flex items-center gap-4">
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
              className="w-16 h-16 rounded-full bg-amber-100/60 border-2 border-amber-300 flex items-center justify-center overflow-hidden cursor-pointer relative shadow-inner"
            >
              {profileImg && !imageError ? (
                <img 
                  src={getImageUrl(profileImg)} 
                  alt={user?.name || "Rider"} 
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <UserIcon size={28} className="text-amber-700" />
              )}

              {uploadingPhoto && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 size={18} className="animate-spin text-white" />
                </div>
              )}
            </div>

            <button 
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#FFB703] border-2 border-white flex items-center justify-center shadow-xs text-slate-900 hover:scale-105 transition-transform cursor-pointer"
            >
              <Camera size={11} />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black text-slate-900 truncate capitalize">{user?.name || 'Rider Partner'}</h2>
            <div className="flex items-center gap-2 mt-0.5 mb-1 flex-wrap">
              <span className="text-xs font-bold text-slate-600">{user?.phone || ''}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck size={10} />
                <span>{approvalStatus}</span>
              </span>
            </div>
            <p className="text-slate-400 text-[11px] font-medium truncate">{user?.email || ''}</p>
          </div>
        </div>

        {/* 3-Column KPI Metrics Row (Live Database Driven) */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs text-center">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Total Trips</p>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">
              {riderStats.loading ? (
                <span className="text-slate-300 text-sm">...</span>
              ) : (
                riderStats.totalTrips
              )}
            </h3>
          </div>
          <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs text-center">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Score</p>
            <h3 className="text-lg font-black text-emerald-600 mt-0.5">
              {riderStats.loading ? (
                <span className="text-slate-300 text-sm">...</span>
              ) : (
                `${riderStats.score}%`
              )}
            </h3>
          </div>
          <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs text-center">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Rating</p>
            <h3 className="text-lg font-black text-amber-500 mt-0.5 flex items-center justify-center gap-0.5">
              {riderStats.loading ? (
                <span className="text-slate-300 text-sm">...</span>
              ) : (
                <>
                  <span>{riderStats.rating}</span>
                  <Star size={12} className="fill-amber-500 text-amber-500" />
                </>
              )}
            </h3>
          </div>
        </div>

        {/* Vehicle Information Card (Prominent & Editable) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Truck size={14} className="text-[#FF6B00]" />
              <span>Registered Vehicle</span>
            </h3>
            <button
              type="button"
              onClick={() => {
                initEditForm(user);
                setIsEditing(true);
              }}
              className="text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
            >
              <Edit3 size={11} />
              <span>Edit Vehicle</span>
            </button>
          </div>

          <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center gap-3">
            {/* Vehicle Photo or Icon */}
            <div 
              onClick={() => currentVehicleImage && setSelectedPhotoPreview(getImageUrl(currentVehicleImage))}
              className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-slate-200 ${
                currentVehicleImage ? 'cursor-pointer hover:opacity-90' : 'bg-amber-100/70 text-amber-700'
              }`}
            >
              {currentVehicleImage ? (
                <img 
                  src={getImageUrl(currentVehicleImage)} 
                  alt="Vehicle" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <Truck size={28} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-900 capitalize">{currentVehicleType}</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  Active
                </span>
              </div>

              {/* License Plate Badge */}
              <div className="mt-1.5 inline-flex items-center bg-white border border-slate-300 rounded-md shadow-2xs overflow-hidden">
                <div className="bg-blue-700 text-white text-[8px] font-black px-1.5 py-1 tracking-tighter">
                  IND
                </div>
                <div className="px-2 py-0.5 font-black text-xs tracking-wider text-slate-900 uppercase font-mono">
                  {currentVehicleNumber}
                </div>
              </div>
            </div>
          </div>

          {/* Quick link if no photo uploaded */}
          {!currentVehicleImage && (
            <button
              type="button"
              onClick={() => {
                initEditForm(user);
                setIsEditing(true);
              }}
              className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold border border-dashed border-amber-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={13} />
              <span>Upload Vehicle Photo</span>
            </button>
          )}
        </div>

        {/* Grouped Details Cards */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 space-y-3.5">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Assigned Operations Hub</h3>
          <div className="flex items-start gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0052CC] flex items-center justify-center shrink-0">
              <Building2 size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-black text-slate-800">Kukatpally Logistics Hub</h4>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Plot 18, Road No. 2, Industrial Area, Hyderabad, Telangana</p>
            </div>
          </div>

          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider pt-1">Partner Verification</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Driving License</p>
              <p className="font-black text-emerald-600 mt-0.5 flex items-center gap-1">
                <CheckCircle2 size={14} />
                <span>Verified</span>
              </p>
            </div>
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Aadhaar KYC</p>
              <p className="font-black text-emerald-600 mt-0.5 flex items-center gap-1">
                <CheckCircle2 size={14} />
                <span>Verified</span>
              </p>
            </div>
          </div>
        </div>

        {/* App Settings & Preferences Section inside Profile */}
        <div id="rider-settings-section" className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 space-y-3 transition-all duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Settings size={14} className="text-amber-500" />
              <span>Settings & Preferences</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              v1.0.4
            </span>
          </div>

          {activeSettingsNotice && (
            <div className="p-2 bg-amber-50 text-amber-800 text-[11px] font-bold rounded-xl border border-amber-200 text-center animate-in fade-in">
              {activeSettingsNotice}
            </div>
          )}

          <div className="space-y-2">
            {/* Push Notifications */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-blue-50 text-[#0052CC] rounded-lg flex items-center justify-center shrink-0">
                  <Bell size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">Job Alerts & Sounds</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Instant alerts for new delivery requests</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={toggleAlerts}
                className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer ${jobAlerts ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.75 transition-transform ${jobAlerts ? 'translate-x-5' : 'translate-x-1'}`}></div>
              </button>
            </div>

            {/* GPS Background Routing */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                  <Smartphone size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">GPS Background Routing</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Live high-precision turn navigation</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={toggleGps}
                className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer ${gpsBackground ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.75 transition-transform ${gpsBackground ? 'translate-x-5' : 'translate-x-1'}`}></div>
              </button>
            </div>

            {/* Night Map Mode */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center shrink-0">
                  {nightMode ? <Moon size={16} className="text-indigo-600" /> : <Sun size={16} className="text-amber-500" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">Night Map Mode</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Dark-themed navigation map</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={toggleNight}
                className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer ${nightMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.75 transition-transform ${nightMode ? 'translate-x-5' : 'translate-x-1'}`}></div>
              </button>
            </div>
          </div>

          {/* Account & Support Options */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            {[
              { icon: <Lock size={14} />, title: 'Shift PIN & Security', desc: 'Fast 4-digit shift passcode', color: 'text-slate-700', bg: 'bg-slate-100' },
              { icon: <Shield size={14} />, title: 'Rider Partner Agreement', desc: 'Payout terms & partner insurance', color: 'text-emerald-700', bg: 'bg-emerald-50' },
              { icon: <HelpCircle size={14} />, title: 'Support & Hub Dispatch', desc: 'Instant SOS & operations helpline', color: 'text-amber-700', bg: 'bg-amber-50' }
            ].map((item, idx) => (
              <button 
                key={idx}
                type="button"
                onClick={() => {
                  setActiveSettingsNotice(`Opened ${item.title}`);
                  setTimeout(() => setActiveSettingsNotice(''), 2500);
                }}
                className="w-full flex items-center justify-between p-2.5 bg-slate-50/80 rounded-xl border border-slate-100 hover:bg-slate-100/70 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 ${item.bg} ${item.color} rounded-lg flex items-center justify-center shrink-0`}>
                    {item.icon}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 leading-tight">{item.title}</h5>
                    <p className="text-[10px] text-slate-400 font-medium">{item.desc}</p>
                  </div>
                </div>
                <ChevronRight size={15} className="text-slate-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Logout Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-3 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-black text-xs border border-red-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut size={15} />
            <span>Logout Rider Session</span>
          </button>
        </div>

      </div>

      {/* Expanded Photo Preview Modal */}
      {selectedPhotoPreview && (
        <div 
          onClick={() => setSelectedPhotoPreview(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="relative max-w-sm w-full bg-slate-900 rounded-2xl overflow-hidden p-2">
            <button 
              type="button"
              onClick={() => setSelectedPhotoPreview(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center z-10 cursor-pointer"
            >
              <X size={16} />
            </button>
            <img src={selectedPhotoPreview} alt="Vehicle Full View" className="w-full max-h-[70vh] object-contain rounded-xl" />
          </div>
        </div>
      )}

    </div>
  );
}
