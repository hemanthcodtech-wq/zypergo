import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, Edit2, UserPlus, FileText, X, Package, Clock, Truck, MapPin, Navigation } from 'lucide-react';
import api from '../../api';

export default function BookingManagement() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [deliveryType, setDeliveryType] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Detail Panel
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [availableRiders, setAvailableRiders] = useState([]);
  
  // Transit Form
  const [transitData, setTransitData] = useState({ carrierName: '', vehicleNumber: '', dispatchTime: '', arrivalTime: '' });

  // Pricing & Helper Payout Edit State
  const [isEditingPricing, setIsEditingPricing] = useState(false);
  const [pricingFormData, setPricingFormData] = useState({
    totalPrice: 0,
    riderPayout: 0,
    helperPayout: 0,
    paymentStatus: 'Completed'
  });
  const [savingPricing, setSavingPricing] = useState(false);

  useEffect(() => {
    if (selectedBooking) {
      setPricingFormData({
        totalPrice: selectedBooking.pricing?.total || 0,
        riderPayout: selectedBooking.pricing?.riderPayout || Math.round((selectedBooking.pricing?.total || 0) * 0.7),
        helperPayout: selectedBooking.helpers?.helperPayout || selectedBooking.pricing?.helperPayout || selectedBooking.helpers?.totalFee || 0,
        paymentStatus: selectedBooking.payment?.status || 'Completed'
      });
      setIsEditingPricing(false);
    }
  }, [selectedBooking]);

  const handleSavePricing = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setSavingPricing(true);
    try {
      const res = await api.put(`/admin/bookings/${selectedBooking._id}`, {
        totalPrice: Number(pricingFormData.totalPrice),
        riderPayout: Number(pricingFormData.riderPayout),
        helperPayout: Number(pricingFormData.helperPayout),
        paymentStatus: pricingFormData.paymentStatus
      });
      if (res.data?.success) {
        setSelectedBooking(res.data.data);
        fetchBookings();
        setIsEditingPricing(false);
        alert('Pricing and Helper Payout updated successfully!');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update pricing');
    } finally {
      setSavingPricing(false);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      let query = `?status=${filterStatus}`;
      if (searchQuery) query += `&search=${searchQuery}`;
      if (deliveryType) query += `&deliveryType=${deliveryType}`;
      if (dateRange.start && dateRange.end) query += `&startDate=${dateRange.start}&endDate=${dateRange.end}`;
      
      const res = await api.get(`/admin/bookings${query}`);
      setBookings(res.data.data);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [filterStatus, deliveryType, dateRange]);

  // Debounced Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchBookings();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchRiders = async () => {
    try {
      const res = await api.get('/admin/riders/available');
      setAvailableRiders(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignRider = async (riderId) => {
    if (!selectedBooking) return;
    try {
      const res = await api.put(`/admin/bookings/${selectedBooking._id}/assign-rider`, { riderId });
      if (res.data.success) {
        setSelectedBooking(res.data.data);
        fetchBookings();
      }
    } catch (err) {
      alert('Failed to assign rider');
    }
  };

  const handleTransitSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    try {
      const res = await api.put(`/admin/bookings/${selectedBooking._id}/transit-log`, transitData);
      if (res.data.success) {
        setSelectedBooking(res.data.data);
        fetchBookings();
        setTransitData({ carrierName: '', vehicleNumber: '', dispatchTime: '', arrivalTime: '' });
      }
    } catch (err) {
      alert('Failed to log transit data');
    }
  };

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col relative">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Booking Management</h1>
          <p className="text-slate-500 text-sm mt-1">Manage all active and past shipments.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search ID, name, phone..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-[#006D77] outline-none w-64"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 items-center bg-slate-50 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto border-r border-slate-200 pr-4">
            {['All', 'Pending', 'Booking Confirmed', 'Rider Assigned', 'Picked Up', 'In Transit', 'Delivered'].map(f => (
              <button 
                key={f}
                onClick={() => setFilterStatus(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${filterStatus === f ? 'bg-[#006D77] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
              >
                {f}
              </button>
            ))}
          </div>
          
          <select 
            value={deliveryType} 
            onChange={(e) => setDeliveryType(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 outline-none"
          >
            <option value="">All Delivery Types</option>
            <option value="Local Direct">Local Direct</option>
            <option value="Intercity Hub-and-Spoke">Intercity</option>
          </select>

          <div className="flex items-center gap-2 ml-auto">
            <input 
              type="date" 
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="px-2 py-1.5 rounded-lg text-xs border border-slate-200 outline-none"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input 
              type="date" 
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="px-2 py-1.5 rounded-lg text-xs border border-slate-200 outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="p-4">Tracking ID</th>
                <th className="p-4">Route Info</th>
                <th className="p-4">Delivery Type</th>
                <th className="p-4">Current Status</th>
                <th className="p-4">Price</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-500">Loading bookings...</td></tr>
              ) : bookings.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-500">No bookings found for this filter.</td></tr>
              ) : (
                bookings.map(b => (
                  <tr key={b._id} className="hover:bg-slate-50 transition cursor-pointer" onClick={() => { setSelectedBooking(b); fetchRiders(); }}>
                    <td className="p-4 font-mono font-bold text-[#006D77]">{b.trackingId}</td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800 flex items-center gap-1"><MapPin size={12}/> {b.pickupLocation.pincode} &rarr; {b.dropLocation.pincode}</p>
                      <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">{b.receiver?.name}</p>
                    </td>
                    <td className="p-4">
                      <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-600">{b.metadata?.deliveryType || 'Standard'}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                        b.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' :
                        b.status === 'Delayed' || b.status === 'Failed' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-900">₹{b.pricing?.total}</td>
                    <td className="p-4 text-center">
                      <button className="text-[#006D77] bg-[#006D77]/10 px-3 py-1 rounded text-xs font-bold hover:bg-[#006D77]/20">Details</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-out Panel for Details */}
      {selectedBooking && (
        <div className="absolute inset-y-0 right-0 w-[500px] bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col transform transition-transform animate-in slide-in-from-right duration-300">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-[#006D77] text-white">
            <h3 className="font-black text-lg flex items-center gap-2">
              <Package size={20} /> {selectedBooking.trackingId}
            </h3>
            <button onClick={() => setSelectedBooking(null)} className="text-white/70 hover:text-white transition">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50">
            
            {/* Status Timeline */}
            <div>
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Status Timeline</h4>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative">
                <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-100"></div>
                <div className="space-y-4">
                  {selectedBooking.trackingHistory?.map((th, idx) => (
                    <div key={idx} className="flex gap-4 relative z-10">
                      <div className="w-4 h-4 rounded-full bg-[#006D77] border-2 border-white shrink-0 mt-1"></div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{th.status}</p>
                        <p className="text-xs text-slate-500">{th.description}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{new Date(th.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                  {(!selectedBooking.trackingHistory || selectedBooking.trackingHistory.length === 0) && (
                     <p className="text-sm text-slate-500 pl-8">No timeline events yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Manual Assignment */}
            {['Pending', 'Booking Confirmed'].includes(selectedBooking.status) && (
              <div>
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Assign Rider</h4>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <select 
                    className="w-full p-2 text-sm border border-slate-200 rounded-lg outline-none mb-3"
                    onChange={(e) => handleAssignRider(e.target.value)}
                    defaultValue=""
                  >
                    <option value="" disabled>Select an active Rider...</option>
                    {availableRiders.map(r => (
                      <option key={r._id} value={r._id}>{r.name} - {r.phone} ({r.riderDetails?.vehicleType})</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Intercity Logging */}
            {selectedBooking.metadata?.deliveryType === 'Intercity Hub-and-Spoke' && (
              <div>
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2">
                  <Truck size={14}/> Intercity Transit Log
                </h4>
                <form onSubmit={handleTransitSubmit} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Carrier Name</label>
                      <input type="text" value={transitData.carrierName} onChange={e => setTransitData({...transitData, carrierName: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" required/>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Vehicle / Bus No.</label>
                      <input type="text" value={transitData.vehicleNumber} onChange={e => setTransitData({...transitData, vehicleNumber: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" required/>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dispatch Time</label>
                      <input type="datetime-local" value={transitData.dispatchTime} onChange={e => setTransitData({...transitData, dispatchTime: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Arrival Time</label>
                      <input type="datetime-local" value={transitData.arrivalTime} onChange={e => setTransitData({...transitData, arrivalTime: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-slate-900 text-white font-bold text-xs py-2 rounded mt-2 hover:bg-slate-800">
                    Save Transit Log
                  </button>
                </form>
                
                {selectedBooking.intercityTransitLog?.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {selectedBooking.intercityTransitLog.map((log, i) => (
                      <div key={i} className="bg-white p-3 rounded border border-slate-100 text-xs text-slate-600">
                        <span className="font-bold text-slate-900">{log.carrierName} ({log.vehicleNumber})</span>
                        <br/>Dispatch: {log.dispatchTime ? new Date(log.dispatchTime).toLocaleString() : 'N/A'}
                        <br/>Arrival: {log.arrivalTime ? new Date(log.arrivalTime).toLocaleString() : 'N/A'}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Pricing & Payouts Management (Rider & Helper) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                  <FileText size={14} className="text-[#006D77]" /> Pricing &amp; Payouts (Rider &amp; Helper)
                </h4>
                <button
                  type="button"
                  onClick={() => setIsEditingPricing(!isEditingPricing)}
                  className="px-2.5 py-1 text-xs font-black rounded-lg border border-[#006D77] text-[#006D77] hover:bg-[#006D77]/10 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Edit2 size={12} />
                  <span>{isEditingPricing ? 'Cancel' : 'Edit Payouts'}</span>
                </button>
              </div>

              {isEditingPricing ? (
                <form onSubmit={handleSavePricing} className="bg-white p-4 rounded-xl border border-amber-300 shadow-sm space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                        Total Order Price (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={pricingFormData.totalPrice}
                        onChange={(e) => setPricingFormData({ ...pricingFormData, totalPrice: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-black text-slate-900 outline-none focus:border-[#006D77]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                        Rider Payout (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={pricingFormData.riderPayout}
                        onChange={(e) => setPricingFormData({ ...pricingFormData, riderPayout: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-black text-slate-900 outline-none focus:border-[#006D77]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                        Helper Payout (Hamali ₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={pricingFormData.helperPayout}
                        onChange={(e) => setPricingFormData({ ...pricingFormData, helperPayout: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-black text-slate-900 outline-none focus:border-[#006D77]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                        Payment Status
                      </label>
                      <select
                        value={pricingFormData.paymentStatus}
                        onChange={(e) => setPricingFormData({ ...pricingFormData, paymentStatus: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-[#006D77] cursor-pointer"
                      >
                        <option value="Completed">Completed (Paid)</option>
                        <option value="Pending">Pending (COD Unpaid)</option>
                        <option value="Cash Collected">Cash Collected</option>
                        <option value="Failed">Failed</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingPricing(false)}
                      className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingPricing}
                      className="flex-1 py-2 rounded-lg bg-[#006D77] hover:bg-[#00555d] text-white text-xs font-black cursor-pointer disabled:opacity-50 shadow-xs"
                    >
                      {savingPricing ? 'Saving...' : 'Save Pricing & Payout'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2.5 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-slate-500 font-bold">Total Customer Price:</span>
                    <span className="font-black text-slate-900 text-sm">₹{selectedBooking.pricing?.total || 0}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-slate-500 font-bold">Rider Payout:</span>
                    <span className="font-black text-emerald-700">₹{selectedBooking.pricing?.riderPayout || Math.round((selectedBooking.pricing?.total || 0) * 0.7)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <div>
                      <span className="text-slate-500 font-bold">Helper Payout (Hamali):</span>
                      {selectedBooking.helpers?.needed && (
                        <p className="text-[10px] text-slate-400 font-semibold">{selectedBooking.helpers?.count} helper(s) · {selectedBooking.helpers?.workType}</p>
                      )}
                    </div>
                    <span className="font-black text-amber-700">₹{selectedBooking.helpers?.helperPayout || selectedBooking.pricing?.helperPayout || selectedBooking.helpers?.totalFee || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Payment Mode / Status:</span>
                    <span className="font-bold text-slate-800">
                      {selectedBooking.payment?.mode || 'UPI'} · <span className={selectedBooking.payment?.status === 'Completed' ? 'text-emerald-600 font-black' : 'text-amber-600 font-black'}>{selectedBooking.payment?.status || 'Pending'}</span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Package Details */}
            <div>
               <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Package Details</h4>
               <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-2 gap-y-4">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Category</p>
                    <p className="text-sm font-medium text-slate-900">{selectedBooking.packageDetails?.category}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Weight</p>
                    <p className="text-sm font-medium text-slate-900">{selectedBooking.packageDetails?.weight} kg</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Description</p>
                    <p className="text-sm font-medium text-slate-900">{selectedBooking.packageDetails?.description || 'N/A'}</p>
                  </div>
               </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
