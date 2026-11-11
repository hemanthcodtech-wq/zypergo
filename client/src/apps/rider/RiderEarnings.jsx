import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  History, 
  CheckCircle2, 
  ChevronRight, 
  Banknote, 
  RefreshCw, 
  ChevronLeft, 
  ArrowUpRight, 
  CreditCard,
  Building2
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api';
import { getImageUrl } from '../../utils/imageUrl';

export default function RiderEarnings({ user, onLogout }) {
  const [loading, setLoading] = useState(false);
  const getResolvedPhoto = () => {
    const userId = user?.id || user?._id || user?.phone;
    let photo = user?.photoUrl || user?.riderDetails?.documents?.profileImageUrl;
    if (!photo && userId) {
      photo = localStorage.getItem('zypergo_profile_photo_' + userId);
    }
    if (!photo) {
      const stored = localStorage.getItem('zypergo_user');
      if (stored) {
        try {
          const u = JSON.parse(stored);
          const uId = u.id || u._id || u.phone;
          photo = u.photoUrl || u.riderDetails?.documents?.profileImageUrl || (uId ? localStorage.getItem('zypergo_profile_photo_' + uId) : null);
        } catch (e) {}
      }
    }
    return photo;
  };

  const [profilePhoto, setProfilePhoto] = useState(getResolvedPhoto());
  const [photoError, setPhotoError] = useState(false);

  useEffect(() => {
    setProfilePhoto(getResolvedPhoto());
    setPhotoError(false);
  }, [user]);
  const [amount, setAmount] = useState('');
  const [vpa, setVpa] = useState('');
  const [localBalance, setLocalBalance] = useState(null);
  const [payoutNotice, setPayoutNotice] = useState(null);
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  const isPrefix = location.pathname.startsWith('/rider');
  const base = isPrefix ? '/rider' : '';
  
  const walletBalance = localBalance !== null ? localBalance : (user?.riderDetails?.earnings?.walletBalance ?? 0);
  const totalEarnings = user?.riderDetails?.earnings?.totalEarnings ?? 0;
  const cashCollected = user?.riderDetails?.earnings?.cashCollected ?? 0;

  const handleWithdraw = async () => {
    const withdrawAmt = Number(amount);
    if (!amount || Number.isNaN(withdrawAmt) || withdrawAmt <= 0) {
      setPayoutNotice({ type: 'error', text: 'Please enter a valid withdrawal amount.' });
      return;
    }
    if (withdrawAmt > walletBalance) {
      setPayoutNotice({ type: 'error', text: 'Amount exceeds your available balance.' });
      return;
    }
    
    setLoading(true);
    setPayoutNotice(null);
    try {
      const res = await api.post('/rider/withdraw', {
        userId: user?._id || user?.id,
        amount: withdrawAmt,
        ...(vpa.trim() ? { vpa: vpa.trim() } : {})
      });
      if (res.data.success) {
        const nextBal = res.data.data?.newBalance ?? Math.max(0, walletBalance - withdrawAmt);
        setLocalBalance(nextBal);
        setAmount('');
        setPayoutNotice({
          type: 'success',
          text: res.data.message || `Withdrawal of ₹${withdrawAmt} initiated via Razorpay X.`
        });
      }
    } catch (err) {
      setPayoutNotice({
        type: 'error',
        text: err.response?.data?.error || 'Failed to initiate Razorpay X withdrawal.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      api.get(`/rider/history?userId=${user._id}`)
        .then(res => {
          if (res.data.success && Array.isArray(res.data.data)) {
            setHistory(res.data.data);
          }
        })
        .catch(err => console.error("Failed to fetch history", err));
    }
  }, [user?._id]);

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
            <h1 className="text-base font-black text-slate-900 leading-tight">Earnings & Payouts</h1>
            <p className="text-[10px] font-bold text-slate-400">Rider Partner Wallet</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`${base}/profile`)}
            className="w-8 h-8 rounded-full overflow-hidden border-2 border-white ring-2 ring-amber-400 shadow-xs flex items-center justify-center bg-amber-100 hover:scale-105 transition-transform cursor-pointer"
            title="My Profile"
          >
            {profilePhoto && !photoError ? (
              <img src={getImageUrl(profilePhoto)} alt="Profile" className="w-full h-full object-cover" onError={() => setPhotoError(true)} />
            ) : (
              <span className="text-xs font-black text-amber-800 uppercase">{user?.name ? user.name.substring(0, 2) : 'RD'}</span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-3.5 space-y-3.5">
        
        {/* Main Wallet Card (Full Width, Sleek Dark Gradient) */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Available Balance</p>
              <h2 className="text-3xl font-black text-white tracking-tight mt-0.5">₹{walletBalance.toLocaleString()}</h2>
            </div>
            <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
              <Wallet size={20} className="text-amber-400" />
            </div>
          </div>

          {/* Compact Cashout Input & Button */}
          <div className="space-y-2">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-2 flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-xs font-bold">₹</span>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Amount to withdraw" 
                  className="w-full bg-transparent text-white font-bold text-xs py-2 pl-7 pr-2 outline-none placeholder:text-white/40"
                />
              </div>
              <button 
                type="button"
                onClick={handleWithdraw}
                disabled={loading || !amount || walletBalance <= 0}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-40 whitespace-nowrap cursor-pointer"
              >
                {loading ? 'Processing...' : 'Cash Out'}
              </button>
            </div>
            <input
              type="text"
              value={vpa}
              onChange={(e) => setVpa(e.target.value)}
              placeholder="Optional UPI ID (e.g. captain@upi) — uses bank if blank"
              className="w-full bg-white/10 backdrop-blur-md border border-white/15 rounded-xl px-3 py-2 text-white font-semibold text-[11px] outline-none placeholder:text-white/40"
            />
            {payoutNotice && (
              <div className={`px-3 py-2 rounded-xl text-[11px] font-bold ${
                payoutNotice.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30'
                  : 'bg-red-500/20 text-red-200 border border-red-400/30'
              }`}>
                {payoutNotice.text}
              </div>
            )}
          </div>
        </div>

        {/* 2-Column Stats Row */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs">
            <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-2">
              <TrendingUp size={16} />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lifetime Pay</p>
            <h3 className="text-lg font-black text-slate-900 leading-tight">₹{totalEarnings.toLocaleString()}</h3>
          </div>

          <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs">
            <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-2">
              <Banknote size={16} />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cash to Deposit</p>
            <h3 className="text-lg font-black text-slate-900 leading-tight">₹{cashCollected.toLocaleString()}</h3>
          </div>
        </div>

        {/* Payout Info Banner */}
        <div className="bg-blue-50/80 border border-blue-100 rounded-2xl p-3 flex items-center gap-2.5 text-xs text-blue-900">
          <Building2 size={18} className="text-[#0052CC] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-black text-[11px] leading-tight">Automatic Daily Bank Settlement</p>
            <p className="text-[10px] text-blue-700 font-medium">Earnings are credited daily at 11:59 PM to your registered bank account.</p>
          </div>
        </div>

        {/* Transaction History Section */}
        <div className="pt-1">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <History size={14} className="text-slate-400" />
            <span>Recent Completed Deliveries</span>
          </h3>
          
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden divide-y divide-slate-100">
            {history.length > 0 ? (
              history.map((job) => {
                const payout = Math.floor((job.pricing?.total || 350) * 0.2);
                return (
                  <div key={job._id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                        <CheckCircle2 size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">Trip Completed</h4>
                        <p className="text-[10px] text-slate-400 font-medium">{new Date(job.updatedAt || Date.now()).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-emerald-600 text-xs">+₹{payout}</span>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Credited</p>
                    </div>
                  </div>
                );
              })
            ) : (
              [
                { id: '1', title: 'Door Delivery - Madhapur', time: 'Today, 2:30 PM', amt: 120 },
                { id: '2', title: 'Parcel Pickup - Banjara Hills', time: 'Today, 11:15 AM', amt: 95 },
                { id: '3', title: 'Express Delivery - Kukatpally', time: 'Yesterday', amt: 160 },
              ].map((item) => (
                <div key={item.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">{item.title}</h4>
                      <p className="text-[10px] text-slate-400 font-medium">{item.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-emerald-600 text-xs">+₹{item.amt}</span>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Credited</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
