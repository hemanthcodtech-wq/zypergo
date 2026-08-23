import React, { useState, useEffect, useRef } from 'react';
import { User, Truck, FileText, CheckCircle2, AlertTriangle, ArrowRight, Camera, Clock, Loader2 } from 'lucide-react';
import api from '../../api';

export default function RiderOnboarding({ user, onComplete }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(null);
  
  const licenseInputRef = useRef(null);
  const rcInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    vehicleType: 'Bike',
    vehicleRegistration: '',
    roleFlexibility: 'Both',
    address: '',
    bankDetails: { accountNumber: '', ifscCode: '' },
    emergencyContact: { name: '', phone: '' },
    documents: { drivingLicenseUrl: '', rcUrl: '', idProofUrl: '' }
  });

  // If the user's status is already Pending, show the waiting screen
  if (user?.riderDetails?.approvalStatus === 'Pending') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Pending</h2>
          <p className="text-slate-500 mb-6">Your application is currently under review by our operations team. We will notify you once you are approved to start accepting trips.</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200">
            Check Status
          </button>
        </div>
      </div>
    );
  }

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await api.post('/rider/onboard', {
        userId: user?._id || user?.id,
        ...formData
      });
      if (res.data.success) {
        onComplete(res.data.data);
      }
    } catch (err) {
      alert("Failed to submit onboarding data");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingDoc(field);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // In a real scenario we'd use the configured api wrapper, but let's just use fetch for multipart
      const token = localStorage.getItem('zypergo_token');
      const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');
      const res = await fetch(`${apiBase}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      const data = await res.json();
      if (data.success) {
        setFormData(prev => ({
          ...prev,
          documents: { ...prev.documents, [field]: data.url }
        }));
      } else {
        alert(data.error || "Failed to upload document");
      }
    } catch (err) {
      alert("Error uploading document");
    } finally {
      setUploadingDoc(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center py-12 px-4">
      <div className="mb-8 text-center">
        <img src="/images/logo.png" alt="ZyperGo" className="h-10 mx-auto mb-4" />
        <h1 className="text-2xl font-extrabold text-slate-900">Partner With Us</h1>
        <p className="text-slate-500 mt-1">Complete your profile to start earning</p>
      </div>

      <div className="w-full max-w-xl bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Progress Tracker */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-4">
          {[1, 2, 3].map(i => (
            <div key={i} className={`flex-1 flex flex-col items-center ${step >= i ? 'text-[#006D77]' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 transition ${step >= i ? 'bg-[#006D77] text-white shadow-md' : 'bg-slate-200 text-slate-500'}`}>
                {i}
              </div>
              <span className="text-xs font-bold">{i === 1 ? 'Profile' : i === 2 ? 'Vehicle' : 'Documents'}</span>
            </div>
          ))}
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><User size={20} className="text-[#006D77]"/> Personal Details</h3>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Residential Address</label>
                <textarea 
                  rows="3"
                  className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-[#006D77] text-sm resize-none"
                  placeholder="Enter your full address"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                ></textarea>
              </div>
              
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
                <h4 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2"><AlertTriangle size={16}/> Emergency Contact</h4>
                <div className="space-y-3">
                  <input type="text" placeholder="Contact Name" className="w-full p-2.5 text-sm border border-amber-200 rounded-lg" value={formData.emergencyContact.name} onChange={e => setFormData({...formData, emergencyContact: {...formData.emergencyContact, name: e.target.value}})} />
                  <input type="text" placeholder="Phone Number" className="w-full p-2.5 text-sm border border-amber-200 rounded-lg" value={formData.emergencyContact.phone} onChange={e => setFormData({...formData, emergencyContact: {...formData.emergencyContact, phone: e.target.value}})} />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Truck size={20} className="text-[#006D77]"/> Vehicle & Role Options</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Vehicle Type</label>
                  <select className="w-full p-3 border border-slate-200 rounded-lg text-sm bg-white" value={formData.vehicleType} onChange={e => setFormData({...formData, vehicleType: e.target.value})}>
                    <option>Bike</option>
                    <option>Auto</option>
                    <option>Mini Truck</option>
                    <option>Heavy Vehicle</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Registration No.</label>
                  <input type="text" placeholder="e.g. MH 12 AB 1234" className="w-full p-3 border border-slate-200 rounded-lg text-sm" value={formData.vehicleRegistration} onChange={e => setFormData({...formData, vehicleRegistration: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Preferred Role (Flexibility)</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Pickup Only', 'Delivery Only', 'Both'].map(role => (
                    <button 
                      key={role} 
                      onClick={() => setFormData({...formData, roleFlexibility: role})}
                      className={`py-3 px-2 rounded-xl text-sm font-bold border-2 transition ${formData.roleFlexibility === role ? 'border-[#006D77] bg-[#006D77]/5 text-[#006D77]' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><FileText size={20} className="text-[#006D77]"/> Verification Documents</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Driving License</p>
                    <p className="text-xs text-slate-500">Upload clear front & back</p>
                  </div>
                  <input type="file" ref={licenseInputRef} className="hidden" accept="image/*,.pdf" onChange={(e) => handleFileUpload(e, 'drivingLicenseUrl')} />
                  <button onClick={() => licenseInputRef.current.click()} disabled={uploadingDoc === 'drivingLicenseUrl'} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${formData.documents.drivingLicenseUrl ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                    {uploadingDoc === 'drivingLicenseUrl' ? <Loader2 size={16} className="animate-spin"/> : formData.documents.drivingLicenseUrl ? <CheckCircle2 size={16}/> : <Camera size={16}/>}
                    {uploadingDoc === 'drivingLicenseUrl' ? 'Uploading...' : formData.documents.drivingLicenseUrl ? 'Uploaded' : 'Upload'}
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Vehicle RC</p>
                    <p className="text-xs text-slate-500">Registration Certificate</p>
                  </div>
                  <input type="file" ref={rcInputRef} className="hidden" accept="image/*,.pdf" onChange={(e) => handleFileUpload(e, 'rcUrl')} />
                  <button onClick={() => rcInputRef.current.click()} disabled={uploadingDoc === 'rcUrl'} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${formData.documents.rcUrl ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                    {uploadingDoc === 'rcUrl' ? <Loader2 size={16} className="animate-spin"/> : formData.documents.rcUrl ? <CheckCircle2 size={16}/> : <Camera size={16}/>}
                    {uploadingDoc === 'rcUrl' ? 'Uploading...' : formData.documents.rcUrl ? 'Uploaded' : 'Upload'}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-800 mb-3">Bank Details (For Payouts)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Account Number" className="w-full p-3 border border-slate-200 rounded-lg text-sm" value={formData.bankDetails.accountNumber} onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails, accountNumber: e.target.value}})} />
                  <input type="text" placeholder="IFSC Code" className="w-full p-3 border border-slate-200 rounded-lg text-sm" value={formData.bankDetails.ifscCode} onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails, ifscCode: e.target.value}})} />
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          {step > 1 ? (
            <button onClick={handlePrev} className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition">Back</button>
          ) : <div></div>}
          
          {step < 3 ? (
            <button onClick={handleNext} className="px-6 py-2.5 bg-[#006D77] text-white font-bold rounded-lg shadow-md hover:bg-[#00585f] transition flex items-center gap-2">Next <ArrowRight size={16}/></button>
          ) : (
            <button 
              onClick={handleSubmit} 
              disabled={loading}
              className="px-6 py-2.5 bg-[#FFB703] text-slate-900 font-bold rounded-lg shadow-md hover:bg-[#e5a400] transition flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
