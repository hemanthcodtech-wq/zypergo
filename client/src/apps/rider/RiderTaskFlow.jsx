import React, { useState } from 'react';
import { Navigation, MapPin, Camera, Key, CheckCircle, Package, ArrowRight, Upload, XCircle, ScanBarcode, Banknote, Phone, CreditCard, FileText } from 'lucide-react';
import api from '../../api';

export default function RiderTaskFlow({ activeJob, onCompleteJob }) {
  const [taskStep, setTaskStep] = useState(() => {
    if (!activeJob) return 1;
    if (activeJob.status === 'Arrived at Pickup') return 2;
    if (['Picked Up', 'In Transit'].includes(activeJob.status)) return 4;
    if (activeJob.status === 'Out for Delivery') return 5;
    return 1;
  });
  const [otp, setOtp] = useState('');
  const [cash, setCash] = useState('');
  const [loading, setLoading] = useState(false);
  const [transhipmentMode, setTranshipmentMode] = useState(false);
  const [scannedRiderId, setScannedRiderId] = useState('');
  const [generatedHandoverOtp, setGeneratedHandoverOtp] = useState('');
  
  // NDR (Exception Handling) State
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [exceptionType, setExceptionType] = useState('Failed'); // 'Failed' or 'Cancelled'
  const [exceptionReason, setExceptionReason] = useState('');
  const [parcelCondition, setParcelCondition] = useState('Good');
  
  // UX State
  const [barcodeScanned, setBarcodeScanned] = useState(false);
  const [photoCaptured, setPhotoCaptured] = useState(false);
  
  const updateStatus = async (status, isComplete = false) => {
    setLoading(true);
    try {
      const userStr = localStorage.getItem('zypergo_user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const payload = { 
        status, 
        reason: exceptionReason || 'Rider action',
        cashCollected: cash || 0,
        parcelCondition,
        userId: user?._id
      };
      
      if (status === 'Picked Up' || status === 'Delivered' || status === 'Source Hub Received' || status === 'Destination Hub Received' || status === 'Failed') {
        payload.otp = otp || '1234'; 
        payload.photoUrl = 'mock-url.jpg'; // Mock photo upload for both success and exceptions
      }

      if (isComplete || status.includes('Hub Received') || status === 'Failed') {
        // Mock GPS capture
        payload.gpsLocation = { lat: 17.4401, lng: 78.3489 };
      }

      const res = await api.post(`/rider/jobs/${activeJob._id}/update-status`, payload);
      
      if (res.data.success) {
        if (isComplete || status === 'Failed' || status === 'Cancelled') {
          onCompleteJob();
        } else {
          // Progress task step based on standard flow
          if (status === 'Arrived at Pickup') setTaskStep(2);
          if (status === 'Picked Up') setTaskStep(4);
          if (status === 'In Transit' || status === 'Out for Delivery') setTaskStep(5);
          setOtp(''); // reset OTP for drop
          setCash(''); // reset cash
          setShowExceptionModal(false);
        }
      } else {
        alert(res.data.error || 'Failed to update status.');
      }
    } catch (err) {
      alert(err.response?.data?.details || err.response?.data?.error || 'Network Error');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (nextStep) => {
    setLoading(true);
    try {
      const res = await api.post(`/rider/jobs/${activeJob._id}/verify-otp`, { otp });
      if (res.data.success) {
        setTaskStep(nextStep);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleTranshipment = async () => {
    setLoading(true);
    try {
      const userStr = localStorage.getItem('zypergo_user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const res = await api.post(`/rider/jobs/${activeJob._id}/transhipment`, { currentRiderId: user?._id });
      if (res.data.success) {
        setGeneratedHandoverOtp(res.data.handoverOtp);
      } else {
        alert('Failed to initiate handover.');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  const pickupPincode = activeJob.pickupLocation?.pincode;
  const dropPincode = activeJob.dropLocation?.pincode;
  
  const pickupParts = (activeJob.pickupLocation?.address || '').toLowerCase().split(',').map(s => s.trim());
  const dropParts = (activeJob.dropLocation?.address || '').toLowerCase().split(',').map(s => s.trim());
  
  // Find common localities/cities (ignoring country, states, and numbers)
  const ignoreList = ['india', 'andhra pradesh', 'telangana', 'karnataka', 'tamil nadu', 'maharashtra'];
  const commonLocalities = pickupParts.filter(part => 
    dropParts.includes(part) && 
    part.length > 3 && 
    isNaN(part) &&
    !ignoreList.includes(part)
  );

  // Consider it the "same region" if pincodes match OR they share a city/locality name
  const isSameRegion = (pickupPincode && dropPincode && pickupPincode === dropPincode) || commonLocalities.length > 0;
  
  // Routing Algorithm: 
  // Deliver directly to the customer if they are in the same region (isSameRegion = true)
  // Drop at the Hub ONLY if they are different regions AND it's an Intercity delivery.
  const isHubDrop = activeJob.metadata?.deliveryType === 'Intercity Hub-and-Spoke' && !isSameRegion;

  return (
    <div className="h-full bg-transparent font-sans flex flex-col relative rounded-[2rem]">
      {/* Fixed Header */}
      <header className="bg-white/40 backdrop-blur-md border-b border-white/60 p-5 z-10 sticky top-0 rounded-t-[2rem]">
        <div className="flex justify-between items-center mb-2">
          <span className="bg-gradient-to-r from-[#FFB703] to-amber-500 text-white shadow-sm text-[10px] font-black px-2.5 py-1 rounded-lg tracking-widest uppercase">
            Active Job
          </span>
          <div className="text-right">
            <span className="text-2xl text-[#006D77] font-black tracking-tight">₹{Math.floor((activeJob.pricing?.total || 800) * 0.15)}</span>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Est. Payout</p>
          </div>
        </div>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">ID: <span className="font-mono text-slate-700">{activeJob.trackingId}</span></p>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-6 pb-32">

          {/* Job Details Card (Always visible) */}
          <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] p-5 border border-white/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#006D77]/5 to-transparent rounded-bl-full -z-10"></div>
            <h3 className="font-black text-slate-900 border-b border-white/60 pb-3 mb-4 text-lg">Job Details</h3>
            <div className="space-y-4 text-sm">
              <div className="flex gap-3">
                <div className="w-6 flex flex-col items-center">
                  <MapPin size={16} className="text-[#006D77]" />
                  <div className="w-0.5 h-full bg-slate-200 my-1"></div>
                </div>
                <div className="pb-4">
                  <p className="text-xs font-bold text-slate-400 uppercase">Pickup Location</p>
                  <p className="font-bold text-slate-800">{activeJob.pickupLocation?.address}</p>
                  <p className="text-slate-500 flex items-center gap-1 mt-1 mb-2"><Phone size={14}/> {activeJob.sender?.phone || 'Customer Phone'}</p>
                  {taskStep <= 2 && (
                    <button 
                      onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activeJob.pickupLocation?.address || '')}`, '_blank')}
                      className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-black flex items-center gap-1 w-fit transition-colors"
                    >
                      <Navigation size={14}/> Get Directions
                    </button>
                  )}
                  {activeJob.preferences?.handlingNotes && (
                    <p className="text-slate-500 flex items-center gap-1 mt-1 text-xs italic"><FileText size={14}/> {activeJob.preferences.handlingNotes}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 flex flex-col items-center">
                  <MapPin size={16} className={isHubDrop ? "text-[#FFB703]" : "text-green-600"} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">{isHubDrop ? 'Drop to Source Hub' : 'Delivery Location'}</p>
                  <p className="font-bold text-slate-800">{isHubDrop ? (activeJob.metadata?.sourceHub?.name || 'Nearest ZyperGo Hub') + (activeJob.metadata?.sourceHub?.city ? `, ${activeJob.metadata.sourceHub.city}` : '') : activeJob.dropLocation?.address}</p>
                  <p className="text-slate-500 flex items-center gap-1 mt-1"><Phone size={14}/> {isHubDrop ? (activeJob.metadata?.sourceHub?.managerPhone || 'Hub Manager') : activeJob.receiver?.phone}</p>
                  <p className="text-slate-500 flex items-center gap-1 mt-1 mb-2 text-xs font-bold"><CreditCard size={14}/> Pay Mode: {activeJob.payment?.mode}</p>
                  {taskStep >= 4 && (
                    <button 
                      onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(isHubDrop ? (activeJob.metadata?.sourceHub?.lat ? `${activeJob.metadata.sourceHub.lat},${activeJob.metadata.sourceHub.lng}` : activeJob.metadata?.sourceHub?.addressLine1 || 'ZyperGo Hub') : activeJob.dropLocation?.address || '')}`, '_blank')}
                      className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-black flex items-center gap-1 w-fit transition-colors"
                    >
                      <Navigation size={14}/> Get Directions
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-5 p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/60 grid grid-cols-2 gap-4 shadow-sm">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Category</p>
                <p className="font-black text-slate-800 text-base">{activeJob.packageDetails?.category}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Weight</p>
                <p className="font-black text-slate-800 text-base">{activeJob.packageDetails?.weight} kg</p>
              </div>
            </div>
          </div>

          {/* Dynamic Task Action Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-white/60 p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#006D77]/10 to-transparent rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3"></div>

            {taskStep === 1 && (
              <div className="text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner border border-blue-100">
                  <Navigation size={36} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Pickup Journey</h2>
                <p className="text-slate-500 text-sm mb-8 font-medium">Head to the sender's location.</p>
                <button 
                  onClick={() => updateStatus('Arrived at Pickup')} 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#0F172A] to-slate-800 text-white font-black py-4.5 rounded-2xl text-lg flex justify-center items-center gap-2 shadow-[0_8px_20px_-6px_rgba(15,23,42,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(15,23,42,0.6)] hover:-translate-y-1 transition-all disabled:opacity-50"
                >
                  Mark 'Arrived at Pickup' <ArrowRight size={20}/>
                </button>

                <button 
                  onClick={() => { setExceptionType('Cancelled'); setShowExceptionModal(true); }} 
                  className="mt-6 text-red-500 font-bold text-sm hover:text-red-600 transition-colors bg-red-50 px-4 py-2 rounded-lg"
                >
                  Cancel Job
                </button>
              </div>
            )}

            {taskStep === 2 && (
              <div className="text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner border border-amber-100">
                  <Key size={36} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Pickup Verification</h2>
                <p className="text-slate-500 text-sm mb-8 font-medium">Ask the sender for the 4-digit OTP.</p>
                
                <input 
                  type="number" 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value)} 
                  placeholder="----" 
                  className="w-full text-center text-4xl tracking-[1em] font-black py-6 px-4 bg-white/60 backdrop-blur-sm border border-white/60 shadow-inner rounded-2xl focus:border-[#006D77] focus:ring-4 focus:ring-[#006D77]/10 focus:bg-white outline-none mb-6 transition-all"
                />
                
                <button 
                  onClick={() => verifyOtp(3)} 
                  disabled={otp.length !== 4 || loading}
                  className="w-full bg-gradient-to-r from-[#006D77] to-teal-700 text-white font-black py-4.5 rounded-2xl text-lg shadow-[0_8px_20px_-6px_rgba(0,109,119,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(0,109,119,0.6)] hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-y-0 mb-4"
                >
                  Verify OTP
                </button>

                <button 
                  onClick={() => { setExceptionType('Failed'); setShowExceptionModal(true); }} 
                  className="text-red-500 font-bold text-sm hover:text-red-600 transition-colors bg-red-50 px-4 py-2 rounded-lg"
                >
                  Report Issue (Pickup Failed)
                </button>
              </div>
            )}

            {taskStep === 3 && (
              <div className="text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-white text-slate-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner border border-slate-100">
                  <ScanBarcode size={36} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Package Intake</h2>
                <p className="text-slate-500 text-sm mb-8 font-medium">Scan the barcode and take a photo of the package.</p>
                
                <button 
                  onClick={() => setBarcodeScanned(true)}
                  className={`w-full ${barcodeScanned ? 'border border-emerald-500 bg-emerald-50 text-emerald-700 shadow-inner' : 'border border-white/60 bg-white/60 backdrop-blur-sm shadow-sm hover:shadow-md hover:bg-white text-slate-600'} rounded-2xl p-5 mb-4 transition-all flex items-center justify-center gap-3 font-bold`}
                >
                   {barcodeScanned ? <CheckCircle size={24} /> : <ScanBarcode size={24} />}
                   {barcodeScanned ? 'Barcode Scanned ✓' : 'Scan Package Barcode'}
                </button>

                <button 
                  onClick={() => setPhotoCaptured(true)}
                  className={`w-full ${photoCaptured ? 'border border-emerald-500 bg-emerald-50 text-emerald-700 shadow-inner' : 'border border-white/60 bg-white/60 backdrop-blur-sm shadow-sm hover:shadow-md hover:bg-white text-slate-600'} rounded-2xl p-5 mb-6 transition-all flex items-center justify-center gap-3 font-bold`}
                >
                   {photoCaptured ? <CheckCircle size={24} /> : <Camera size={24} />}
                   {photoCaptured ? 'Proof Photo Captured ✓' : 'Capture Proof Photo'}
                </button>
                
                <div className="mb-8 text-left bg-white/50 backdrop-blur-sm border border-white/60 p-4 rounded-2xl shadow-sm">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Package Condition Verification</p>
                  <select 
                    value={parcelCondition}
                    onChange={(e) => setParcelCondition(e.target.value)}
                    className="w-full p-4 border border-white/60 bg-white/80 rounded-xl focus:outline-none focus:border-[#006D77] focus:ring-4 focus:ring-[#006D77]/10 font-bold text-slate-700 shadow-inner transition-all appearance-none"
                  >
                    <option value="Good">Good (Intact)</option>
                    <option value="Damaged">Damaged / Torn</option>
                    <option value="Poor Packaging">Poorly Packaged / Loose</option>
                  </select>
                </div>

                {activeJob.payment?.payer === 'Sender' && (
                  <div className="mb-8 p-5 bg-gradient-to-br from-emerald-50 to-green-50/30 border border-emerald-100 rounded-2xl shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full -z-10"></div>
                    <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-2">Collect Payment</p>
                    <p className="text-3xl font-black text-emerald-600 mb-4 tracking-tight">₹{activeJob.pricing?.total}</p>
                    <div className="flex items-center shadow-sm rounded-xl overflow-hidden">
                      <div className="w-12 h-12 bg-white flex items-center justify-center text-slate-400 border border-r-0 border-white/60"><Banknote size={20}/></div>
                      <input type="number" placeholder="Amount collected" value={cash} onChange={(e) => setCash(e.target.value)} className="w-full h-12 px-3 bg-white/80 border border-white/60 focus:ring-2 focus:ring-emerald-500 outline-none text-base font-black text-slate-800" />
                    </div>
                  </div>
                )}

                <button 
                  onClick={() => updateStatus('Picked Up')} 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#006D77] to-teal-700 text-white font-black py-4.5 rounded-2xl text-lg shadow-[0_8px_20px_-6px_rgba(0,109,119,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(0,109,119,0.6)] hover:-translate-y-1 transition-all disabled:opacity-50"
                >
                  Confirm Pickup & Start Trip
                </button>
              </div>
            )}

            {taskStep === 4 && (
              <div className="text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-fuchsia-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner border border-purple-100">
                  <Package size={36} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Drop Journey</h2>
                <p className="text-slate-500 text-sm mb-8 font-medium">Head to the {isHubDrop ? 'Source Hub' : 'Delivery Address'}.</p>
                
                <div className="bg-white/60 backdrop-blur-sm border border-white/60 p-5 rounded-2xl mb-8 shadow-sm">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Payment Collection Info</p>
                  <p className="text-3xl font-black text-[#006D77] tracking-tight">₹{activeJob.pricing?.total}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-2 bg-slate-100 inline-block px-3 py-1 rounded-lg">Status: {activeJob.payment?.status}</p>
                </div>

                <button 
                  onClick={() => updateStatus('Out for Delivery')} 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#0F172A] to-slate-800 text-white font-black py-4.5 rounded-2xl text-lg flex justify-center items-center gap-2 mb-6 shadow-[0_8px_20px_-6px_rgba(15,23,42,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(15,23,42,0.6)] hover:-translate-y-1 transition-all disabled:opacity-50"
                >
                  Mark 'Arrived at Drop' <ArrowRight size={20}/>
                </button>
                
                <button 
                  onClick={() => { setTaskStep(7); setTranshipmentMode(true); }}
                  disabled={loading}
                  className="w-full bg-transparent border border-slate-300 text-slate-600 font-bold py-3.5 rounded-2xl text-sm flex justify-center items-center gap-2 hover:bg-slate-50 transition-colors"
                >
                  Initiate Transhipment Handover
                </button>
              </div>
            )}

            {taskStep === 5 && (
              <div className="text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner border border-amber-100">
                  <Key size={36} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Delivery Verification</h2>
                <p className="text-slate-500 text-sm mb-8 font-medium">Ask the {isHubDrop ? 'Hub Staff' : 'Receiver'} for the 4-digit OTP.</p>
                
                <input 
                  type="number" 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value)} 
                  placeholder="----" 
                  className="w-full text-center text-4xl tracking-[1em] font-black py-6 px-4 bg-white/60 backdrop-blur-sm border border-white/60 shadow-inner rounded-2xl focus:border-[#006D77] focus:ring-4 focus:ring-[#006D77]/10 focus:bg-white outline-none mb-6 transition-all"
                />
                
                <button 
                  onClick={() => verifyOtp(6)} 
                  disabled={otp.length !== 4 || loading}
                  className="w-full bg-gradient-to-r from-[#006D77] to-teal-700 text-white font-black py-4.5 rounded-2xl text-lg shadow-[0_8px_20px_-6px_rgba(0,109,119,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(0,109,119,0.6)] hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-y-0 mb-4"
                >
                  Verify OTP
                </button>

                <button 
                  onClick={() => { setExceptionType('Failed'); setShowExceptionModal(true); }} 
                  className="text-red-500 font-bold text-sm hover:text-red-600 transition-colors bg-red-50 px-4 py-2 rounded-lg"
                >
                  Report Issue (Delivery Failed)
                </button>
              </div>
            )}

            {taskStep === 6 && (
              <div className="text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-white text-slate-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner border border-slate-100">
                  <Camera size={36} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Capture Signature & Photo</h2>
                <p className="text-slate-500 text-sm mb-8 font-medium">Take a clear photo of the delivered package and capture receiver signature. GPS location is captured automatically.</p>
                
                <button 
                  onClick={() => setPhotoCaptured(true)}
                  className={`w-full ${photoCaptured ? 'border border-emerald-500 bg-emerald-50 text-emerald-700 shadow-inner' : 'border border-white/60 bg-white/60 backdrop-blur-sm shadow-sm hover:shadow-md hover:bg-white text-slate-600'} rounded-2xl p-6 mb-8 transition-all flex items-center justify-center gap-3 font-bold`}
                >
                   {photoCaptured ? <CheckCircle size={24} /> : <Upload size={24} />}
                   {photoCaptured ? 'Proof Uploaded ✓' : 'Capture Proof Photo / Signature'}
                </button>

                {activeJob.payment?.payer === 'Receiver' && (
                  <div className="mb-8 p-5 bg-gradient-to-br from-emerald-50 to-green-50/30 border border-emerald-100 rounded-2xl shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full -z-10"></div>
                    <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-2">Collect Payment</p>
                    <p className="text-3xl font-black text-emerald-600 mb-4 tracking-tight">₹{activeJob.pricing?.total}</p>
                    <div className="flex items-center shadow-sm rounded-xl overflow-hidden">
                      <div className="w-12 h-12 bg-white flex items-center justify-center text-slate-400 border border-r-0 border-white/60"><Banknote size={20}/></div>
                      <input type="number" placeholder="Amount collected" value={cash} onChange={(e) => setCash(e.target.value)} className="w-full h-12 px-3 bg-white/80 border border-white/60 focus:ring-2 focus:ring-emerald-500 outline-none text-base font-black text-slate-800" />
                    </div>
                  </div>
                )}

                <button 
                  onClick={() => updateStatus(isHubDrop ? 'Source Hub Received' : 'Delivered', true)} 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-black py-4.5 rounded-2xl text-lg flex justify-center items-center gap-2 shadow-[0_8px_20px_-6px_rgba(16,185,129,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(16,185,129,0.6)] hover:-translate-y-1 transition-all disabled:opacity-50"
                >
                  Complete Job <CheckCircle size={20}/>
                </button>
              </div>
            )}

            {taskStep === 7 && transhipmentMode && (
              <div className="text-center animate-in fade-in zoom-in-95">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Transhipment Handover</h2>
                
                {generatedHandoverOtp ? (
                  <div className="mb-6">
                    <p className="text-slate-500 text-sm mb-4">Show this OTP to the new Rider to securely transfer custody.</p>
                    <div className="text-5xl font-black text-[#006D77] tracking-[0.5em] text-center bg-teal-50 border border-teal-200 py-6 rounded-2xl shadow-inner mb-6">
                      {generatedHandoverOtp}
                    </div>
                    <button 
                      onClick={() => onCompleteJob()} 
                      className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl text-lg mb-4 hover:bg-slate-800 transition-colors"
                    >
                      Close and wait for Acceptance
                    </button>
                  </div>
                ) : (
                  <div className="mb-6">
                    <p className="text-slate-500 text-sm mb-6">Initiate a secure handover to another Rider.</p>
                    <button 
                      onClick={handleTranshipment} 
                      disabled={loading}
                      className="w-full bg-[#006D77] text-white font-bold py-4 rounded-xl text-lg mb-4"
                    >
                      Generate Handover OTP
                    </button>
                  </div>
                )}
                
                {!generatedHandoverOtp && (
                  <button onClick={() => { setTaskStep(4); setTranshipmentMode(false); }} className="text-slate-500 font-bold text-sm hover:underline">
                    Cancel Transhipment
                  </button>
                )}
              </div>
            )}

          </div>

        </div>
      </main>

      {/* Exception (NDR) Modal */}
      {showExceptionModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-xl border border-white/60 rounded-[2rem] shadow-2xl p-5 w-full animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight flex items-center gap-2">
              <XCircle className="text-red-500" /> Report Issue
            </h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">Please select the reason why this task cannot be completed. This will be logged for operations.</p>
            
            <div className="space-y-3 mb-6">
              {['Customer Unavailable', 'Parcel Not Ready / Unpacked', 'Prohibited Item Detected', 'Wrong Address Provided', 'Payment Not Ready', 'Customer Cancelled'].map(reason => (
                <button 
                  key={reason}
                  onClick={() => setExceptionReason(reason)}
                  className={`w-full text-left p-4 rounded-2xl border ${exceptionReason === reason ? 'border-red-500 bg-red-50 text-red-700 shadow-inner' : 'border-white/60 bg-white/60 shadow-sm text-slate-700 hover:bg-white'} font-bold text-sm transition-all`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="border border-white/60 shadow-sm rounded-2xl p-4 mb-8 bg-white/60 backdrop-blur-sm cursor-pointer flex items-center gap-3 hover:bg-white transition-colors">
                <Camera size={20} className="text-slate-400" />
                <span className="font-bold text-slate-600 text-sm">Upload Proof (Mandatory)</span>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setShowExceptionModal(false)} className="flex-1 py-4 bg-white/60 border border-white/60 shadow-sm text-slate-700 font-black rounded-2xl hover:bg-white transition-colors">Cancel</button>
              <button 
                onClick={() => updateStatus(exceptionType, true)} 
                disabled={!exceptionReason || loading}
                className="flex-[2] py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-black rounded-2xl shadow-[0_8px_20px_-6px_rgba(239,68,68,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(239,68,68,0.6)] disabled:opacity-50 transition-all hover:-translate-y-1"
              >
                Submit & {exceptionType === 'Cancelled' ? 'Cancel Job' : 'Mark Failed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
