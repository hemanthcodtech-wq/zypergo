import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, History, ArrowRightLeft, CheckCircle2, ChevronRight, Banknote, RefreshCw, ChevronLeft, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

export default function RiderEarnings({ user, onLogout }) {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [history, setHistory] = useState([]);
  const [showWithdrawInput, setShowWithdrawInput] = useState(false);
  const navigate = useNavigate();
  
  const walletBalance = user?.riderDetails?.earnings?.walletBalance || 0;
  const totalEarnings = user?.riderDetails?.earnings?.totalEarnings || 0;
  const cashCollected = user?.riderDetails?.earnings?.cashCollected || 0;

  const handleWithdraw = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      alert("Please enter a valid amount to withdraw.");
      return;
    }
    if (Number(amount) > walletBalance) {
      alert("Amount exceeds your available wallet balance.");
      return;
    }
    
    setLoading(true);
    try {
      const res = await api.post('/rider/withdraw', { userId: user?._id, amount: Number(amount) });
      if (res.data?.success) {
        alert(res.data.message || "Withdrawal request submitted successfully!");
        setAmount('');
        setShowWithdrawInput(false);
        window.location.reload(); 
      }
    } catch (err) {
      alert(err.response?.data?.error || "Failed to process withdrawal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      api.get(`/rider/history?userId=${user._id}`)
        .then(res => {
          if (res.data?.success) {
             setHistory(res.data.data || []);
          }
        })
        .catch(err => console.error("Failed to fetch history", err));
    }
  }, [user?._id]);

  return (
    <div className="min-h-full bg-slate-50 flex flex-col font-sans select-none text-slate-900 pb-28">
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shadow-xs">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="w-9 h-9 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 active:scale-95 transition"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-sm font-black text-slate-900 tracking-tight">Earnings & Wallet</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Manage your payouts</p>
        </div>
        <div className="w-9 h-9 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
          <Wallet size={18} />
        </div>
      </header>

      {/* Main Container */}
      <div className="p-4 space-y-4">
        
        {/* Main Available Balance Card */}
        <div className="w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-5 shadow-lg text-white border border-slate-700 relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Available to Cash Out
              </span>
              <h2 className="text-4xl font-black mt-2 tracking-tight">
                ₹{walletBalance.toLocaleString()}
              </h2>
            </div>
            <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
              <Wallet size={20} className="text-emerald-400" />
            </div>
          </div>

          {/* Quick Action Toggle Button */}
          {!showWithdrawInput ? (
            <button
              onClick={() => setShowWithdrawInput(true)}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-1.5"
            >
              <ArrowDownCircle size={16} />
              <span>Withdraw to Bank</span>
            </button>
          ) : (
            <div className="space-y-2 mt-3 pt-3 border-t border-white/10 animate-in fade-in duration-200">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50 font-black text-sm">₹</span>
                <input 
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full bg-white/10 border border-white/20 rounded-xl py-2.5 pl-8 pr-3 text-sm text-white font-bold placeholder:text-white/40 focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowWithdrawInput(false); setAmount(''); }}
                  className="w-1/3 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-white transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={loading || !amount || Number(amount) <= 0}
                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 2-Column Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Lifetime Earnings */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
              <TrendingUp size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lifetime</p>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">₹{totalEarnings.toLocaleString()}</h3>
            </div>
          </div>

          {/* Cash Collected (COD) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
              <Banknote size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cash Collected (COD)</p>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">₹{cashCollected.toLocaleString()}</h3>
              <p className="text-[9px] font-bold text-amber-600 mt-1">Deposit at Hub</p>
            </div>
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <History size={14} /> Recent Missions
            </h3>
            <span className="text-[10px] font-bold text-slate-400">{history.length} records</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
            {history.length > 0 ? (
              history.map((job) => {
                const payout = Math.floor((job.pricing?.total || 800) * 0.15);
                return (
                  <div key={job._id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={18} />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-extrabold text-slate-900 leading-tight">Trip Completed</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {job.updatedAt ? new Date(job.updatedAt).toLocaleDateString() : 'Recent'} • ID: {job.trackingId || job._id?.substring(0, 6)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-emerald-600">+₹{payout}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center">
                <RefreshCw size={24} className="mb-2 opacity-30" />
                <p className="text-xs font-medium">No transactions yet.</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Complete deliveries to see payouts here.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
