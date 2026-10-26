import React, { useState } from 'react';
import { Wallet, TrendingUp, History, ArrowRightLeft, CheckCircle2, ChevronRight, Banknote, RefreshCw, ChevronLeft, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

export default function RiderEarnings({ user, onLogout }) {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();
  
  const walletBalance = user?.riderDetails?.earnings?.walletBalance || 0;
  const totalEarnings = user?.riderDetails?.earnings?.totalEarnings || 0;
  const cashCollected = user?.riderDetails?.earnings?.cashCollected || 0;

  const handleWithdraw = async () => {
    if (!amount || isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    if (amount > walletBalance) {
      alert("Amount exceeds your wallet balance.");
      return;
    }
    
    setLoading(true);
    try {
      const res = await api.post('/rider/withdraw', { userId: user?._id, amount: Number(amount) });
      if (res.data.success) {
        alert(res.data.message);
        setAmount('');
        // Trigger a reload or update user state here in a real app
        window.location.reload(); 
      }
    } catch (err) {
      alert(err.response?.data?.error || "Failed to process withdrawal.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (user?._id) {
      api.get(`/rider/history?userId=${user._id}`)
        .then(res => {
          if (res.data.success) {
             setHistory(res.data.data);
          }
        })
        .catch(err => console.error("Failed to fetch history", err));
    }
  }, [user?._id]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans p-4 md:p-6 lg:p-8">
      <header className="sticky top-0 z-50 bg-[#F8FAFC]/90 backdrop-blur-xl mb-8 pb-4 pt-4 -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 border-b border-slate-200/50 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div className="flex items-center justify-center">
            <img src="/images/logo.png" alt="ZyperGo Logo" className="h-8 object-contain" />
          </div>
          <div className="w-10 h-10"></div> {/* Spacer for centering */}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-sm shrink-0">
            <Wallet size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Earnings</h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Manage your payouts</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 max-w-6xl mx-auto w-full">
        {/* Main Wallet Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden border border-slate-700">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FFB703]/10 rounded-full blur-3xl -z-10 -translate-x-1/3 translate-y-1/3"></div>
          
          <div className="flex justify-between items-start mb-10">
            <div>
              <p className="text-[10px] font-black text-[#FFB703] uppercase tracking-widest mb-2">Available Balance</p>
              <h2 className="text-5xl md:text-6xl font-black text-white tracking-tighter">₹{walletBalance.toLocaleString()}</h2>
            </div>
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
              <Wallet size={24} className="text-[#FFB703]" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-white/60 font-black">₹</span>
              </div>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount to withdraw" 
                className="w-full bg-white/5 border border-white/10 text-white font-bold py-3 pl-10 pr-4 rounded-xl focus:outline-none focus:border-[#FFB703] focus:ring-2 focus:ring-[#FFB703]/50 transition-all placeholder:text-white/30"
              />
            </div>
            <button 
              onClick={handleWithdraw}
              disabled={loading || !amount || walletBalance <= 0}
              className="w-full sm:w-auto px-8 py-3 bg-[#FFB703] text-black font-black uppercase tracking-widest rounded-xl hover:bg-[#e5a400] transition-colors disabled:opacity-50 whitespace-nowrap shadow-lg shadow-[#FFB703]/20"
            >
              {loading ? 'Processing...' : 'Cash Out'}
            </button>
          </div>
        </div>

        {/* Stats Column */}
        <div className="flex flex-col gap-6">
          <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white/60 flex-1 flex flex-col justify-center">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp size={20} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lifetime Earnings</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">₹{totalEarnings.toLocaleString()}</h3>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white/60 flex-1 flex flex-col justify-center">
            <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center mb-4">
              <Banknote size={20} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cash Collected (COD)</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">₹{cashCollected.toLocaleString()}</h3>
            <p className="text-xs text-slate-500 font-bold mt-2">Needs to be deposited at Hub</p>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="max-w-6xl mx-auto w-full pb-24">
        <h3 className="text-lg font-black text-slate-900 mb-6 tracking-tight flex items-center gap-2">
          <History size={20} className="text-slate-400" /> Recent Transactions
        </h3>
        
        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white/60 overflow-hidden">
          {history.length > 0 ? (
            history.map((job, i) => {
              const payout = Math.floor((job.pricing?.total || 800) * 0.15);
              return (
                <div key={job._id} className={`p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors ${i !== history.length - 1 ? 'border-b border-slate-100' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200">
                      <CheckCircle2 size={24} className="text-emerald-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Trip Completed</h4>
                      <p className="text-xs text-slate-500 font-medium">{new Date(job.updatedAt).toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">ID: {job.trackingId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-emerald-600 text-lg">+₹{payout}</span>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Added to Wallet</p>
                  </div>
                </div>
              );
            })
          ) : (
             <div className="p-10 text-center text-slate-400 font-bold flex flex-col items-center">
                <RefreshCw size={40} className="mb-4 opacity-20" />
                <p>Complete trips to see your earnings history here.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
