import React, { useState, useEffect } from 'react';
import { 
  Package, User, MapPin, Phone, Mail, FileText, CheckCircle2, 
  Printer, ArrowRight, RefreshCw, AlertCircle, DollarSign, 
  Send, Sparkles, ShieldCheck, Scale, QrCode 
} from 'lucide-react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import api from '../../api';

export default function HubBookOrder() {
  const { user, selectedHub, hubs } = useOutletContext();
  const navigate = useNavigate();

  // Form State
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderAddress, setSenderAddress] = useState('');
  const [isWalkInAtHub, setIsWalkInAtHub] = useState(true);

  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverEmail, setReceiverEmail] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [receiverCity, setReceiverCity] = useState('Sindhanur');
  const [receiverState, setReceiverState] = useState('Karnataka');
  const [receiverPincode, setReceiverPincode] = useState('584128');

  const [category, setCategory] = useState('General Goods');
  const [weight, setWeight] = useState('2.0');
  const [length, setLength] = useState('20');
  const [width, setWidth] = useState('15');
  const [height, setHeight] = useState('10');
  const [declaredValue, setDeclaredValue] = useState('1000');
  const [speed, setSpeed] = useState('Standard');
  const [paymentMode, setPaymentMode] = useState('UPI / QR at Hub');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Initialize sender address to Hub Address if walk-in
  useEffect(() => {
    if (isWalkInAtHub && selectedHub) {
      setSenderAddress(`${selectedHub.name}, ${selectedHub.address || selectedHub.city || 'Hub Counter'}`);
    }
  }, [isWalkInAtHub, selectedHub]);

  // Live Pricing Calculation
  const parsedWeight = parseFloat(weight) || 1;
  const volWeight = ((parseFloat(length) || 10) * (parseFloat(width) || 10) * (parseFloat(height) || 10)) / 5000;
  const chargeableWeight = Math.max(parsedWeight, volWeight);
  const baseRate = 80;
  const weightCharge = Math.round(chargeableWeight * 25);
  const speedModifier = speed === 'Express' ? 1.4 : 1.0;
  const calculatedTotal = Math.round((baseRate + weightCharge) * speedModifier);

  const handleCreateHubBooking = async (e) => {
    e.preventDefault();
    if (!senderName || !senderPhone || !receiverName || !receiverPhone || !receiverAddress) {
      setError('Please fill in all mandatory customer and destination fields.');
      return;
    }

    setLoading(true);
    setError('');

    const originPin = selectedHub?.pincode || '518301';

    const payload = {
      senderDetails: {
        name: senderName,
        phone: senderPhone,
        email: senderEmail || undefined
      },
      receiver: {
        name: receiverName,
        phone: receiverPhone,
        email: receiverEmail || undefined
      },
      pickupLocation: {
        address: senderAddress || `${selectedHub?.name} Counter`,
        city: selectedHub?.city || 'Origin City',
        pincode: originPin
      },
      dropLocation: {
        address: receiverAddress,
        city: receiverCity,
        state: receiverState,
        pincode: receiverPincode
      },
      packageDetails: {
        category,
        weight: parsedWeight,
        dimensions: {
          length: parseFloat(length) || 10,
          width: parseFloat(width) || 10,
          height: parseFloat(height) || 10
        },
        declaredValue: parseFloat(declaredValue) || 500
      },
      preferences: {
        speed
      },
      pricing: {
        total: calculatedTotal
      },
      payment: {
        mode: paymentMode,
        status: paymentMode.includes('COD') ? 'Pending' : 'Completed'
      },
      bookingOrigin: 'Hub_Counter',
      bookedByHubManager: {
        managerId: user._id || user.id,
        managerName: user.name,
        hubId: selectedHub?._id,
        hubName: selectedHub?.name
      }
    };

    try {
      const res = await api.post('/bookings', payload);
      if (res.data.success) {
        setConfirmedBooking(res.data.data);
      } else {
        setError(res.data.error || 'Failed to create booking.');
      }
    } catch (err) {
      console.error('Hub booking error:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Server error creating booking.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintAWB = () => {
    window.print();
  };

  const resetForm = () => {
    setConfirmedBooking(null);
    setSenderName('');
    setSenderPhone('');
    setSenderEmail('');
    setReceiverName('');
    setReceiverPhone('');
    setReceiverEmail('');
    setReceiverAddress('');
    setWeight('2.0');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in pb-16 font-sans">
      
      {/* Top Title Banner */}
      <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-[#0052CC]/10 text-[#0052CC] text-xs font-black rounded-full uppercase tracking-wider">
              Walk-in & Counter Booking
            </span>
            <span className="text-xs font-bold text-slate-500">
              Active Hub: <strong className="text-slate-800">{selectedHub?.name || 'Main Hub'}</strong>
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">Create Hub Parcel Order</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Book customer parcel, send instant SMS & Email invoice, and generate shipping barcode label.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={resetForm}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
          >
            Clear Form
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form & Pricing Split */}
      <form onSubmit={handleCreateHubBooking} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Customer & Package Inputs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Customer / Sender Information */}
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-white/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <User size={18} className="text-[#0052CC]" /> 1. Customer (Sender) Details
              </h2>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isWalkInAtHub} 
                  onChange={(e) => setIsWalkInAtHub(e.target.checked)}
                  className="rounded text-[#0052CC] focus:ring-[#0052CC]"
                />
                <span>Walk-in Customer at Hub</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10.5px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Customer Full Name *
                </label>
                <input 
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="e.g. Rajesh Sharma"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#0052CC] outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Mobile Number (for SMS & Tracking) *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input 
                    type="tel"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#0052CC] outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10.5px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Email Address (for Instant E-Invoice & PDF Receipt)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input 
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="customer@email.com"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#0052CC] outline-none transition-all"
                  />
                </div>
              </div>

              {!isWalkInAtHub && (
                <div className="sm:col-span-2">
                  <label className="block text-[10.5px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Pickup Street Address
                  </label>
                  <input 
                    type="text"
                    value={senderAddress}
                    onChange={(e) => setSenderAddress(e.target.value)}
                    placeholder="House/Shop no, Street, Landmark"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#0052CC] outline-none transition-all"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Receiver & Destination Details */}
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-white/80 shadow-xs space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <MapPin size={18} className="text-[#FF6B00]" /> 2. Receiver & Destination Address
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10.5px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Receiver Name *
                </label>
                <input 
                  type="text"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="e.g. Vikram Verma"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#0052CC] outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Receiver Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input 
                    type="tel"
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#0052CC] outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10.5px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Destination Delivery Address *
                </label>
                <input 
                  type="text"
                  value={receiverAddress}
                  onChange={(e) => setReceiverAddress(e.target.value)}
                  placeholder="Door No, Street Name, Landmark"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#0052CC] outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  City *
                </label>
                <input 
                  type="text"
                  value={receiverCity}
                  onChange={(e) => setReceiverCity(e.target.value)}
                  placeholder="e.g. Sindhanur"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#0052CC] outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Pincode *
                </label>
                <input 
                  type="text"
                  value={receiverPincode}
                  onChange={(e) => setReceiverPincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="584128"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#0052CC] outline-none transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 3: Package & Cargo Specifications */}
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-white/80 shadow-xs space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Package size={18} className="text-emerald-600" /> 3. Package & Weight Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10.5px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#0052CC] outline-none"
                >
                  <option>General Goods</option>
                  <option>Documents & Paper</option>
                  <option>Electronics</option>
                  <option>Apparel & Textiles</option>
                  <option>Spare Parts & Industrial</option>
                  <option>Fragile Parcel</option>
                </select>
              </div>

              <div>
                <label className="block text-[10.5px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Actual Weight (kg) *
                </label>
                <input 
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#0052CC] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Declared Value (₹)
                </label>
                <input 
                  type="number"
                  value={declaredValue}
                  onChange={(e) => setDeclaredValue(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#0052CC] outline-none"
                />
              </div>

              <div className="sm:col-span-3 grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div>
                  <label className="block text-[9.5px] font-black text-slate-400 uppercase tracking-wider mb-1">Length (cm)</label>
                  <input type="number" value={length} onChange={e => setLength(e.target.value)} className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800" />
                </div>
                <div>
                  <label className="block text-[9.5px] font-black text-slate-400 uppercase tracking-wider mb-1">Width (cm)</label>
                  <input type="number" value={width} onChange={e => setWidth(e.target.value)} className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800" />
                </div>
                <div>
                  <label className="block text-[9.5px] font-black text-slate-400 uppercase tracking-wider mb-1">Height (cm)</label>
                  <input type="number" value={height} onChange={e => setHeight(e.target.value)} className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800" />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right 1 Column: Live Rate Card & Confirmation */}
        <div className="space-y-6">
          
          {/* Service Speed & Payment Mode */}
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-white/80 shadow-xs space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Service & Payment
            </h2>

            <div>
              <label className="block text-[10.5px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                Delivery Priority
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSpeed('Standard')}
                  className={`p-2.5 rounded-xl border text-xs font-black transition-all ${
                    speed === 'Standard' 
                      ? 'bg-[#0052CC] text-white border-[#0052CC] shadow-xs' 
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Standard Hub
                </button>
                <button
                  type="button"
                  onClick={() => setSpeed('Express')}
                  className={`p-2.5 rounded-xl border text-xs font-black transition-all ${
                    speed === 'Express' 
                      ? 'bg-[#FF6B00] text-white border-[#FF6B00] shadow-xs' 
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  ⚡ Express
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                Payment Collection Mode
              </label>
              <select 
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#0052CC] outline-none"
              >
                <option>UPI / QR at Hub</option>
                <option>Cash Collected at Hub</option>
                <option>Card Swiped at Hub</option>
                <option>Cash on Delivery (COD)</option>
              </select>
            </div>
          </div>

          {/* Invoice Summary Box */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-lg space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-300">Live Invoice</span>
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={13} /> Auto Calculated
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Base Hub Handling</span>
                <span>₹{baseRate}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Weight Charge ({chargeableWeight.toFixed(1)} kg)</span>
                <span>₹{weightCharge}</span>
              </div>
              {speed === 'Express' && (
                <div className="flex justify-between text-[#FF7A00] font-bold">
                  <span>Express Speed Surcharge</span>
                  <span>+40%</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Taxes & GST</span>
                <span>Included</span>
              </div>

              <div className="pt-3 border-t border-slate-700 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Amount</p>
                  <p className="text-2xl font-black text-emerald-400">₹{calculatedTotal}</p>
                </div>
                <span className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-bold text-slate-300">
                  {paymentMode}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0052CC] hover:bg-[#0047cc] text-white py-3.5 rounded-2xl font-black text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <>
                  <span>Confirm & Book Parcel</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
            <p className="text-[10px] text-center text-slate-400">
              Dispatches real-time SMS & E-Invoice immediately
            </p>
          </div>

        </div>

      </form>

      {/* Confirmation & Printable Shipping Label Modal */}
      {confirmedBooking && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Booking Confirmed!</h3>
                  <p className="text-xs text-slate-500">Tracking: #{confirmedBooking.trackingId}</p>
                </div>
              </div>

              <button 
                onClick={resetForm}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Done
              </button>
            </div>

            {/* Notification Dispatch Status */}
            <div className="bg-blue-50/80 border border-blue-100 p-3.5 rounded-2xl space-y-1.5 text-xs text-[#0052CC] font-bold">
              <p className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600" />
                <span>SMS Notification sent to Customer ({senderPhone})</span>
              </p>
              {senderEmail && (
                <p className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600" />
                  <span>Invoice & Tracking receipt emailed to ({senderEmail})</span>
                </p>
              )}
              <p className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600" />
                <span>Receiver ({receiverPhone}) notified with live tracking link</span>
              </p>
            </div>

            {/* Printable Air Waybill Label Preview */}
            <div className="bg-white border-2 border-dashed border-slate-300 p-4 rounded-2xl space-y-3 font-mono text-slate-900" id="printable-awb">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-black text-base text-[#0052CC]">ZyperGo Logistics</span>
                <span className="text-xs font-bold bg-slate-100 px-2 py-0.5 rounded">AWB / Waybill</span>
              </div>

              <div className="text-center py-2 bg-slate-50 rounded-lg">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-sans font-bold">TRACKING BARCODE ID</p>
                <p className="text-xl font-black tracking-widest text-slate-900">#{confirmedBooking.trackingId}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs border-b pb-2">
                <div>
                  <p className="text-[9px] text-slate-400 font-sans font-bold uppercase">From (Sender)</p>
                  <p className="font-bold">{senderName}</p>
                  <p className="text-[10px] text-slate-600">{senderPhone}</p>
                  <p className="text-[10px] text-slate-500 truncate">{selectedHub?.name}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-sans font-bold uppercase">To (Receiver)</p>
                  <p className="font-bold">{receiverName}</p>
                  <p className="text-[10px] text-slate-600">{receiverPhone}</p>
                  <p className="text-[10px] text-slate-500 truncate">{receiverCity}, {receiverPincode}</p>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs">
                <div>
                  <p className="text-[9px] text-slate-400 font-sans font-bold uppercase">Weight</p>
                  <p className="font-bold">{weight} kg</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-sans font-bold uppercase">Total Amount</p>
                  <p className="font-bold text-emerald-600">₹{calculatedTotal} ({paymentMode})</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-sans font-bold uppercase">Service</p>
                  <p className="font-bold text-[#0052CC]">{speed}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button 
                onClick={handlePrintAWB}
                className="flex-1 bg-slate-900 hover:bg-black text-white py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-sm"
              >
                <Printer size={16} /> Print Shipping Label
              </button>
              <button 
                onClick={resetForm}
                className="flex-1 bg-[#0052CC] hover:bg-[#0047cc] text-white py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-sm"
              >
                <span>+ Book Next Parcel</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
