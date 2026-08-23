import React, { useState } from 'react';
import { Calculator, ArrowRight, IndianRupee } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function RateCalculator() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  const [formData, setFormData] = useState({
    pickupPin: queryParams.get('pickup') || '',
    dropPin: queryParams.get('drop') || '',
    weight: queryParams.get('weight') || '1',
    category: 'General'
  });
  const [estimate, setEstimate] = useState(null);

  const calculateRate = (e) => {
    e.preventDefault();
    // Super basic mock calculation for the estimator
    const base = 50;
    const isIntercity = Math.abs(parseInt(formData.pickupPin) - parseInt(formData.dropPin)) > 1000;
    const distFactor = isIntercity ? 200 : 20;
    const weightFactor = parseInt(formData.weight) * 15;
    
    setEstimate({
      total: base + distFactor + weightFactor,
      type: isIntercity ? 'Intercity Standard' : 'Local Direct',
      eta: isIntercity ? '2-3 Business Days' : 'Same Day (Within 4 hrs)'
    });
  };

  return (
    <div className="flex-1 bg-white py-16">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row gap-12 items-center">
        
        {/* Left Side: Content */}
        <div className="md:w-1/2 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
            <Calculator size={14}/> Transparent Pricing
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
            Know your shipping costs <span className="text-[#006D77]">upfront.</span>
          </h1>
          <p className="text-lg text-slate-600">
            No hidden fees. No surprise charges. Use our rate calculator to get an instant estimate for your intracity or intercity parcels.
          </p>
          <ul className="space-y-3 pt-4">
            <li className="flex gap-3 text-slate-700 font-medium"><span className="text-[#00BCD4] font-black">✓</span> Includes door-to-door pickup and delivery.</li>
            <li className="flex gap-3 text-slate-700 font-medium"><span className="text-[#00BCD4] font-black">✓</span> Basic insurance coverage included.</li>
            <li className="flex gap-3 text-slate-700 font-medium"><span className="text-[#00BCD4] font-black">✓</span> Live tracking link provided.</li>
          </ul>
        </div>

        {/* Right Side: Calculator Card */}
        <div className="md:w-1/2 w-full max-w-md mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl shadow-[#006D77]/10 p-8 border border-slate-100">
            <form onSubmit={calculateRate} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Pickup Pincode</label>
                  <input type="text" maxLength="6" required value={formData.pickupPin} onChange={e=>setFormData({...formData, pickupPin: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#006D77] outline-none font-bold bg-slate-50"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Drop Pincode</label>
                  <input type="text" maxLength="6" required value={formData.dropPin} onChange={e=>setFormData({...formData, dropPin: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#006D77] outline-none font-bold bg-slate-50"/>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Weight (KG)</label>
                  <input type="number" min="1" required value={formData.weight} onChange={e=>setFormData({...formData, weight: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#006D77] outline-none font-bold bg-slate-50"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Category</label>
                  <select value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#006D77] outline-none font-bold bg-slate-50">
                    <option>General</option>
                    <option>Documents</option>
                    <option>Fragile</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full bg-[#006D77] text-white font-bold py-4 rounded-xl hover:bg-[#00585f] shadow-lg transition">
                Get Estimate
              </button>
            </form>

            {estimate && (
              <div className="mt-8 bg-slate-50 border border-slate-200 p-6 rounded-2xl animate-in fade-in slide-in-from-top-4">
                <div className="text-center mb-6">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Estimated Cost</p>
                  <p className="text-4xl font-black text-slate-900 flex items-center justify-center"><IndianRupee size={28}/> {estimate.total}</p>
                </div>
                <div className="space-y-2 text-sm border-t border-slate-200 pt-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Service Type</span>
                    <span className="font-bold text-[#006D77]">{estimate.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Expected ETA</span>
                    <span className="font-bold text-slate-900">{estimate.eta}</span>
                  </div>
                </div>
                <Link to="/booking" className="w-full block text-center bg-[#0052CC] text-white font-black py-3.5 rounded-xl shadow-lg hover:bg-[#0047cc] active:scale-95 transition-all">
                  Proceed to Book
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
