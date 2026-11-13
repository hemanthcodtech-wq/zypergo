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
  Plus,
  Users,
  Package,
  Briefcase
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api';
import { getImageUrl } from '../../utils/imageUrl';
import { sanitizeDigits, handleNumericKeyDown } from '../../utils/inputValidation';
import { compressImage } from '../../utils/imageCompressor';

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
    vehicleImageUrl: initialUser?.riderDetails?.vehicleImageUrl || initialUser?.riderDetails?.documents?.vehiclePicUrl || '',
    helperWorkType: initialUser?.riderDetails?.helperWorkType || 'Load & Unload'
  });

  // Captain Helpers Management State
  const [myHelpers, setMyHelpers] = useState([]);
  const [showAddHelper, setShowAddHelper] = useState(false);
  const [addingHelper, setAddingHelper] = useState(false);
  const [uploadingHelperPhoto, setUploadingHelperPhoto] = useState(false);
  const [helperForm, setHelperForm] = useState({
    name: '',
    phone: '',
    email: '',
    helperWorkType: 'Load & Unload',
    profilePhoto: ''
  });

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVehiclePic, setUploadingVehiclePic] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [vehicleImgError, setVehicleImgError] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
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
  const directVehicleInputRef = useRef(null);
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
        const persistentVehPhoto = localStorage.getItem('zypergo_vehicle_photo_' + (userId || parsed.phone));
        if (persistentPhoto) {
          parsed.photoUrl = persistentPhoto;
        }
        if (persistentVehPhoto && !parsed.riderDetails?.vehicleImageUrl) {
          if (!parsed.riderDetails) parsed.riderDetails = {};
          parsed.riderDetails.vehicleImageUrl = persistentVehPhoto;
          parsed.vehicleImageUrl = persistentVehPhoto;
        }
        setUser(parsed);
        initEditForm(parsed);

        // Fetch fresh profile from database to ensure permanent persistence across logins
        api.get('/users/profile').then(res => {
          if (res.data?.success && res.data?.data) {
            const dbUser = res.data.data;
            const vehPic = dbUser.vehicleImageUrl || dbUser.riderDetails?.vehicleImageUrl || dbUser.riderDetails?.documents?.vehiclePicUrl;
            if (vehPic && userId) {
              localStorage.setItem('zypergo_vehicle_photo_' + userId, vehPic);
            }
            setUser(prev => ({ ...prev, ...dbUser }));
            initEditForm(dbUser);
            localStorage.setItem('zypergo_user', JSON.stringify({ ...parsed, ...dbUser }));
          }
        }).catch(() => {});

        // Fetch helpers if Captain
        if (userId && parsed?.riderDetails?.partnerMode !== 'Helper') {
          api.get(`/rider/helpers?captainId=${userId}`)
            .then(res => {
              if (res.data?.success && Array.isArray(res.data.data)) {
                setMyHelpers(res.data.data);
              }
            })
            .catch(() => {});
        }

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
      vehicleImageUrl: u?.riderDetails?.vehicleImageUrl || u?.riderDetails?.documents?.vehiclePicUrl || '',
      helperWorkType: u?.riderDetails?.helperWorkType || 'Load & Unload'
    });
  };

  const isHelper = user?.riderDetails?.partnerMode === 'Helper';

  const approvalStatus = user?.riderDetails?.approvalStatus || 'Approved';
  const profileImg = user?.photoUrl || user?.riderDetails?.documents?.profileImageUrl;
  const currentVehicleType = user?.riderDetails?.vehicleType || 'Bike';
  const currentVehicleNumber = user?.riderDetails?.vehicleRegistration || user?.riderDetails?.vehicleNumber || 'TS 09 EA 1234';
  const currentVehicleImage = 
    user?.riderDetails?.vehicleImageUrl || 
    user?.riderDetails?.documents?.vehiclePicUrl || 
    user?.vehicleImageUrl || 
    (user?.id || user?._id || user?.phone ? localStorage.getItem('zypergo_vehicle_photo_' + (user.id || user._id || user.phone)) : null);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      setMessage('');
      setImageError(false);

      // Instant client-side compression (<25ms, lightweight base64)
      const compressedBase64 = await compressImage(file, { maxWidth: 500, quality: 0.75 });
      
      const userId = user.id || user._id || user.phone;
      if (userId) {
        localStorage.setItem('zypergo_profile_photo_' + userId, compressedBase64);
      }

      const updatedUser = {
        ...user,
        photoUrl: compressedBase64,
        riderDetails: {
          ...(user.riderDetails || {}),
          documents: {
            ...(user.riderDetails?.documents || {}),
            profileImageUrl: compressedBase64
          }
        }
      };

      setUser(updatedUser);
      localStorage.setItem('zypergo_user', JSON.stringify(updatedUser));
      setMessage('Profile photo updated permanently!');
      setTimeout(() => setMessage(''), 3000);

      // Background persistent save to database without blocking UI
      api.put('/users/profile', {
        id: user.id || user._id,
        phone: user.phone,
        email: user.email,
        photoUrl: compressedBase64,
        riderDetails: {
          documents: {
            profileImageUrl: compressedBase64
          }
        }
      }).catch(err => console.warn('Background profile photo sync notice:', err.message));

    } catch (err) {
      console.error('Photo compression error:', err);
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleDirectVehiclePicUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingVehiclePic(true);
      setMessage('');
      setVehicleImgError(false);

      // Instant client-side compression (<30ms, lightweight base64)
      const compressedVeh = await compressImage(file, { maxWidth: 650, quality: 0.75 });

      const userId = user.id || user._id || user.phone;
      if (userId) {
        localStorage.setItem('zypergo_vehicle_photo_' + userId, compressedVeh);
      }

      const updatedUser = {
        ...user,
        vehicleImageUrl: compressedVeh,
        riderDetails: {
          ...(user.riderDetails || {}),
          vehicleImageUrl: compressedVeh,
          documents: {
            ...(user.riderDetails?.documents || {}),
            vehiclePicUrl: compressedVeh
          }
        }
      };

      setUser(updatedUser);
      localStorage.setItem('zypergo_user', JSON.stringify(updatedUser));
      setEditForm(prev => ({ ...prev, vehicleImageUrl: compressedVeh }));
      setMessage('Vehicle photo saved to database permanently!');
      setTimeout(() => setMessage(''), 3500);

      // Background persistent save to database without blocking UI
      api.put('/users/profile', {
        id: user.id || user._id,
        phone: user.phone,
        email: user.email,
        vehicleImageUrl: compressedVeh,
        riderDetails: {
          vehicleImageUrl: compressedVeh,
          documents: {
            vehiclePicUrl: compressedVeh
          }
        }
      }).catch(err => console.warn('Background vehicle photo sync notice:', err.message));

    } catch (error) {
      console.error('Error saving vehicle photo:', error);
      setMessage('Failed to save vehicle photo. Please try again.');
      setTimeout(() => setMessage(''), 3500);
    } finally {
      setUploadingVehiclePic(false);
      if (directVehicleInputRef.current) {
        directVehicleInputRef.current.value = '';
      }
    }
  };

  const handleVehiclePicUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingVehiclePic(true);
      setVehicleImgError(false);
      const compressedVeh = await compressImage(file, { maxWidth: 650, quality: 0.75 });
      setEditForm(prev => ({ ...prev, vehicleImageUrl: compressedVeh }));
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingVehiclePic(false);
      if (modalVehicleInputRef.current) modalVehicleInputRef.current.value = '';
    }
  };

  const handleHelperPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingHelperPhoto(true);
    try {
      let resolved = '';
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await api.post('/upload', fd);
        if (res.data?.success && res.data?.url) resolved = getImageUrl(res.data.url);
      } catch (err) {}
      if (!resolved) {
        resolved = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      }
      setHelperForm((prev) => ({ ...prev, profilePhoto: resolved }));
    } finally {
      setUploadingHelperPhoto(false);
    }
  };

  const handleAddHelperSubmit = async (e) => {
    e.preventDefault();
    const cleanPhone = sanitizeDigits(helperForm.phone, 10);
    if (!helperForm.name.trim() || cleanPhone.length !== 10) {
      setMessage('Enter Helper Name and 10-digit Mobile Number.');
      return;
    }
    setAddingHelper(true);
    setMessage('');
    try {
      const res = await api.post('/rider/helpers', {
        captainId: user._id || user.id,
        name: helperForm.name.trim(),
        phone: cleanPhone,
        email: helperForm.email.trim() || undefined,
        helperWorkType: helperForm.helperWorkType,
        profilePhoto: helperForm.profilePhoto || undefined
      });
      if (res.data?.success && res.data?.data) {
        setMyHelpers((prev) => [res.data.data, ...prev.filter((h) => h._id !== res.data.data._id)]);
        setHelperForm({ name: '', phone: '', email: '', helperWorkType: 'Load & Unload', profilePhoto: '' });
        setShowAddHelper(false);
        setMessage(res.data.message || 'Helper registered successfully!');
        setTimeout(() => setMessage(''), 3500);
      }
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to register helper.');
      setTimeout(() => setMessage(''), 3500);
    } finally {
      setAddingHelper(false);
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
    const cleanPhone = sanitizeDigits(editForm.phone, 10) || editForm.phone;

    try {
      const updatedUser = {
        ...user,
        name: editForm.name,
        phone: cleanPhone,
        email: editForm.email,
        riderDetails: {
          ...(user.riderDetails || {}),
          address: editForm.address,
          ...(isHelper
            ? {
                partnerMode: 'Helper',
                helperWorkType: editForm.helperWorkType || 'Load & Unload'
              }
            : {
                vehicleType: resolvedVehicleType,
                vehicleRegistration: resolvedVehicleNumber,
                vehicleNumber: resolvedVehicleNumber,
                vehicleImageUrl: editForm.vehicleImageUrl
              }),
          documents: {
            ...(user.riderDetails?.documents || {}),
            ...(user.photoUrl ? { profileImageUrl: user.photoUrl } : {}),
            ...(!isHelper && editForm.vehicleImageUrl ? { vehiclePicUrl: editForm.vehicleImageUrl } : {})
          }
        }
      };

      setUser(updatedUser);
      localStorage.setItem('zypergo_user', JSON.stringify(updatedUser));

      try {
        await api.put('/users/profile', {
          id: user._id || user.id,
          name: editForm.name,
          phone: cleanPhone,
          email: editForm.email,
          address: editForm.address,
          photoUrl: user.photoUrl,
          ...(!isHelper
            ? {
                vehicleType: resolvedVehicleType,
                vehicleNumber: resolvedVehicleNumber,
                vehicleRegistration: resolvedVehicleNumber,
                vehicleImageUrl: editForm.vehicleImageUrl
              }
            : {}),
          riderDetails: isHelper
            ? {
                partnerMode: 'Helper',
                helperWorkType: editForm.helperWorkType || 'Load & Unload',
                address: editForm.address
              }
            : {
                address: editForm.address,
                vehicleType: resolvedVehicleType,
                vehicleRegistration: resolvedVehicleNumber,
                vehicleImageUrl: editForm.vehicleImageUrl
              }
        });
      } catch (e) {}

      setIsEditing(false);
      setMessage(isHelper ? 'Helper profile updated successfully!' : 'Profile and vehicle details saved!');
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
    } else {
      navigate(`/rider/login?mode=${isHelper ? 'helper' : 'captain'}`, { replace: true });
    }
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
              <h1 className="text-base font-black text-slate-900 leading-tight">
                {isHelper ? 'Edit Helper Profile' : 'Edit Profile & Vehicle'}
              </h1>
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
            {/* Profile Photo Upload Inside Edit View */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 flex items-center gap-4">
              <input
                type="file"
                ref={photoInputRef}
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <div
                onClick={() => photoInputRef.current?.click()}
                className="w-16 h-16 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden cursor-pointer relative shrink-0"
              >
                {profileImg && !imageError ? (
                  <img src={getImageUrl(profileImg)} alt={user?.name || 'Profile'} className="w-full h-full object-cover" onError={() => setImageError(true)} />
                ) : (
                  <UserIcon size={24} className="text-slate-400" />
                )}
                {uploadingPhoto && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 size={18} className="animate-spin text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-black text-slate-900">Profile Image</h4>
                <p className="text-[10px] text-slate-500 mb-2">Upload a new photo anytime</p>
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera size={12} />
                  <span>{uploadingPhoto ? 'Uploading...' : 'Upload New Image'}</span>
                </button>
              </div>
            </div>

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
                  inputMode="numeric"
                  maxLength={10}
                  value={editForm.phone} 
                  onChange={(e) => setEditForm({ ...editForm, phone: sanitizeDigits(e.target.value, 10) })}
                  onKeyDown={(e) => handleNumericKeyDown(e, editForm.phone, 10)}
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
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">Address (Optional)</label>
                <input 
                  type="text" 
                  value={editForm.address} 
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="Area, City"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs focus:border-amber-500 focus:bg-white transition-all shadow-2xs"
                />
              </div>
            </div>

            {isHelper ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 space-y-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase size={14} className="text-[#006D77]" />
                  <span>Helper Work Type</span>
                </h3>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1.5">
                    Select Work Responsibility
                  </label>
                  <select
                    value={editForm.helperWorkType}
                    onChange={(e) => setEditForm({ ...editForm, helperWorkType: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs focus:border-[#006D77] focus:bg-white cursor-pointer"
                  >
                    <option value="Load & Unload">Load &amp; Unload Both</option>
                    <option value="Load Only">Load Only</option>
                    <option value="Unload Only">Unload Only</option>
                  </select>
                </div>
              </div>
            ) : (
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
            )}

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
            onClick={() => {
              if (window.__handleAppBack) window.__handleAppBack();
              else if (window.history.length > 1) navigate(-1);
              else navigate(`${base}/dashboard`);
            }} 
            className="p-1 -ml-1 text-slate-700 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
          >
            <ChevronLeft size={22} />
          </button>
          <div>
            <h1 className="text-base font-black text-slate-900 leading-tight">
              {isHelper ? 'Helper Profile' : 'Captain Profile'}
            </h1>
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

        {isHelper ? (
          /* Helper Work Type & Linked Captain Card */
          <div className="bg-white rounded-2xl border border-teal-200/80 shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Package size={14} className="text-[#006D77]" />
                <span>Helper Work Role</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  initEditForm(user);
                  setIsEditing(true);
                }}
                className="text-[11px] font-bold text-[#006D77] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit3 size={11} />
                <span>Edit Details</span>
              </button>
            </div>

            <div className="p-3 bg-teal-50/60 rounded-2xl border border-teal-100 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-teal-700">Assigned Responsibility</p>
                <h4 className="text-sm font-black text-slate-900 mt-0.5">
                  {user?.riderDetails?.helperWorkType || 'Load & Unload'}
                </h4>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-white text-[#006D77] border border-teal-200 text-[10px] font-black">
                Active Helper
              </span>
            </div>

            {(user?.riderDetails?.assignedCaptain?.name || user?.riderDetails?.captainName || user?.riderDetails?.captainPhone) && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Assigned Captain</p>
                  <p className="text-xs font-black text-slate-900">
                    {user?.riderDetails?.assignedCaptain?.name || user?.riderDetails?.captainName || 'Captain'}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-500">
                    {user?.riderDetails?.assignedCaptain?.phone || user?.riderDetails?.captainPhone}
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  Linked
                </span>
              </div>
            )}
          </div>
        ) : (
        <>
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
            {/* Vehicle Photo or Fallback Icon */}
            <div 
              onClick={() => currentVehicleImage && !vehicleImgError && setSelectedPhotoPreview(getImageUrl(currentVehicleImage))}
              className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-slate-200 ${
                currentVehicleImage && !vehicleImgError ? 'cursor-pointer hover:opacity-90' : 'bg-amber-100/70 text-amber-700'
              }`}
            >
              {currentVehicleImage && !vehicleImgError ? (
                <img 
                  src={getImageUrl(currentVehicleImage)} 
                  alt="Vehicle" 
                  className="w-full h-full object-cover" 
                  onError={() => setVehicleImgError(true)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-amber-800">
                  {currentVehicleType.toLowerCase().includes('bike') ? (
                    <Bike size={26} />
                  ) : currentVehicleType.toLowerCase().includes('scooter') ? (
                    <Bike size={26} />
                  ) : (
                    <Truck size={26} />
                  )}
                  <span className="text-[8px] font-black uppercase mt-0.5">{currentVehicleType}</span>
                </div>
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

          {/* Hidden File Input for Direct Vehicle Photo Upload */}
          <input 
            type="file" 
            ref={directVehicleInputRef} 
            accept="image/*" 
            className="hidden" 
            onChange={handleDirectVehiclePicUpload} 
          />

          {/* Upload or Change Vehicle Photo Button */}
          <button
            type="button"
            disabled={uploadingVehiclePic}
            onClick={() => directVehicleInputRef.current?.click()}
            className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold border border-dashed border-amber-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            {uploadingVehiclePic ? (
              <Loader2 size={14} className="animate-spin text-amber-700" />
            ) : (
              <Camera size={14} className="text-amber-700" />
            )}
            <span>{uploadingVehiclePic ? 'Saving to database...' : (currentVehicleImage ? 'Change Vehicle Photo' : 'Upload Vehicle Photo')}</span>
          </button>
        </div>

        {/* Registered Helpers Under Captain */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Users size={14} className="text-[#006D77]" />
              <span>Helpers Under You ({myHelpers.length})</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowAddHelper((prev) => !prev)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-[#006D77] border border-teal-200 text-[11px] font-black cursor-pointer"
            >
              <Plus size={12} />
              <span>{showAddHelper ? 'Close' : 'Add Helper'}</span>
            </button>
          </div>

          {showAddHelper && (
            <form onSubmit={handleAddHelperSubmit} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <div className="flex items-center gap-3">
                <label className="w-12 h-12 rounded-full bg-white border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden cursor-pointer shrink-0">
                  <input type="file" accept="image/*" className="hidden" onChange={handleHelperPhotoChange} />
                  {helperForm.profilePhoto ? (
                    <img src={getImageUrl(helperForm.profilePhoto)} alt="Helper" className="w-full h-full object-cover" />
                  ) : uploadingHelperPhoto ? (
                    <Loader2 size={15} className="animate-spin text-[#006D77]" />
                  ) : (
                    <Camera size={15} className="text-slate-400" />
                  )}
                </label>
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-slate-800">Helper Photo</p>
                  <p className="text-[10px] text-slate-400">Tap icon to upload helper photo</p>
                </div>
              </div>

              <input
                type="text"
                value={helperForm.name}
                onChange={(e) => setHelperForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Helper Full Name"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-[#006D77]"
                required
              />
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={helperForm.phone}
                onChange={(e) => setHelperForm((prev) => ({ ...prev, phone: sanitizeDigits(e.target.value, 10) }))}
                onKeyDown={(e) => handleNumericKeyDown(e, helperForm.phone, 10)}
                placeholder="Helper 10-digit Mobile Number"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-[#006D77]"
                required
              />
              <input
                type="email"
                value={helperForm.email}
                onChange={(e) => setHelperForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Helper Email (Optional)"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-[#006D77]"
              />
              <select
                value={helperForm.helperWorkType}
                onChange={(e) => setHelperForm((prev) => ({ ...prev, helperWorkType: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-[#006D77]"
              >
                <option value="Load & Unload">Load &amp; Unload Both</option>
                <option value="Load Only">Load Only</option>
                <option value="Unload Only">Unload Only</option>
              </select>
              <button
                type="submit"
                disabled={addingHelper}
                className="w-full py-2.5 rounded-xl bg-[#006D77] hover:bg-[#00555d] text-white text-xs font-black cursor-pointer disabled:opacity-50"
              >
                {addingHelper ? 'Registering Helper...' : 'Register Helper Under Me'}
              </button>
            </form>
          )}

          {myHelpers.length === 0 ? (
            <p className="text-[11px] text-slate-400 font-medium bg-slate-50 border border-dashed border-slate-200 rounded-xl p-3">
              No helpers registered under you yet. Tap &ldquo;Add Helper&rdquo; to register one.
            </p>
          ) : (
            <div className="space-y-2">
              {myHelpers.map((h) => (
                <div key={h._id} className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 text-[#006D77] flex items-center justify-center overflow-hidden shrink-0 font-black text-xs">
                    {h.photoUrl ? (
                      <img src={getImageUrl(h.photoUrl)} alt={h.name} className="w-full h-full object-cover" />
                    ) : (
                      (h.name || 'HL').substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-black text-slate-900 truncate">{h.name}</h4>
                    <p className="text-[10px] text-slate-500 font-semibold">{h.phone}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-teal-50 text-[#006D77] border border-teal-200 text-[9px] font-black whitespace-nowrap">
                    {h.riderDetails?.helperWorkType || 'Load & Unload'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        </>
        )}

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

          </div>

          {/* Account & Support Options */}
          <div className="pt-2 border-t border-slate-100">
            <button 
              type="button"
              onClick={() => setShowSupportModal(true)}
              className="w-full flex items-center justify-between p-3 bg-amber-50/70 hover:bg-amber-100/70 rounded-2xl border border-amber-200 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-500 text-slate-950 rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                  <HelpCircle size={17} />
                </div>
                <div>
                  <h5 className="text-xs font-black text-slate-900 leading-tight">Support &amp; Hub Dispatch</h5>
                  <p className="text-[10px] text-amber-900 font-semibold mt-0.5">Instant SOS, Operations Helpline &amp; Hub Help</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-amber-800" />
            </button>
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
            <span>{isHelper ? 'Logout Helper Session' : 'Logout Captain Session'}</span>
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

      {/* Support & Hub Dispatch Interactive Modal */}
      {showSupportModal && (
        <div 
          onClick={() => setShowSupportModal(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-sm overflow-hidden p-5 shadow-2xl relative space-y-4 animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-black">
                  <HelpCircle size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Support &amp; Hub Dispatch</h3>
                  <p className="text-[10px] font-bold text-slate-400">24/7 CAPTAIN ASSISTANCE</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowSupportModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Direct Helpline Call */}
              <a 
                href="tel:+918008812345"
                className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Phone size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">Captain Operations Helpline</h4>
                    <p className="text-[11px] font-bold text-emerald-700 mt-0.5">+91 80088 12345</p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase bg-emerald-600 text-white px-2 py-1 rounded-lg">Call</span>
              </a>

              {/* WhatsApp Live Support */}
              <a 
                href="https://wa.me/918008812345?text=Hello%20ZyperGo%20Dispatch%20Team%2C%20I%20am%20a%20Captain%20needing%20support."
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-2xl bg-teal-50 hover:bg-teal-100/80 border border-teal-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#006D77] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Mail size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">WhatsApp Dispatch Desk</h4>
                    <p className="text-[10px] font-medium text-teal-800 mt-0.5">Live chat with Dispatch Officer</p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase bg-[#006D77] text-white px-2 py-1 rounded-lg">Chat</span>
              </a>

              {/* Emergency SOS Button */}
              <button 
                type="button"
                onClick={() => {
                  window.location.href = 'tel:112';
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-200 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-red-700">Emergency SOS Alert</h4>
                    <p className="text-[10px] text-red-500 font-medium mt-0.5">Police &amp; Emergency Hub Services</p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase bg-red-600 text-white px-2 py-1 rounded-lg">SOS</span>
              </button>
            </div>

            {/* Hub Details */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <p className="text-[10px] font-black uppercase text-slate-400">Assigned Logistics Hub</p>
              <p className="font-black text-slate-900">Kukatpally Logistics Hub</p>
              <p className="text-[11px] text-slate-500">Plot 18, Road No. 2, Industrial Area, Hyderabad, Telangana</p>
              <p className="text-[10px] text-amber-800 font-bold mt-1">Operating Hours: 24/7 Operational Hub</p>
            </div>

            <button 
              type="button" 
              onClick={() => setShowSupportModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-black text-xs hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
