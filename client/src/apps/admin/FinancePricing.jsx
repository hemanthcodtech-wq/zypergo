import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Calculator, DollarSign, Settings, Plus, Edit2, Trash2,
  CheckCircle, AlertTriangle, RefreshCcw, Loader2, ArrowRight, X,
  TrendingUp, Map, MapPin, Truck, ShieldAlert, Package, Percent
} from 'lucide-react';
import api from '../../api';

const TABS = [
  { id: 'vehicles', label: 'Vehicle Per-Km Pricing', icon: Truck },
  { id: 'rules', label: 'Pricing Rules', icon: Settings },
  { id: 'simulator', label: 'Price Simulator', icon: Calculator },
  { id: 'partner-costs', label: 'Partner Costs', icon: DollarSign }
];

export default function FinancePricing() {
  const [activeTab, setActiveTab] = useState('vehicles');

  // Vehicle Per-Km Pricing State
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [vehicleFormData, setVehicleFormData] = useState({
    baseFare: 50,
    baseKm: 3,
    perKm: 7,
    helperFee: 0,
    minimumCharge: 50,
    maxWeight: 20,
    isActive: true
  });
  const [savingVehicle, setSavingVehicle] = useState(false);

  // Rules Tab State
  const [rules, setRules] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    ruleName: '', ruleType: 'Base', movementType: 'Any', speed: 'Any', isSurcharge: false,
    conditions: { originCity: '', destCity: '', originPincode: '', destPincode: '', category: '', minWeight: 0, maxWeight: '' },
    rates: { basePrice: 0, perKgRate: 0, perKmRate: 0, handlingCost: 0, partnerCost: 0, riderCost: 0, minimumCharge: 0, marginPercentage: 0, discountPercentage: 0, gstPercentage: 18, insurancePercentage: 0 },
    isActive: true
  });

  // Simulator Tab State
  const [simParams, setSimParams] = useState({
    originCity: 'Hyderabad', destCity: 'Hyderabad', originPincode: '500001', destPincode: '500081',
    distanceKm: 15, actualWeight: 2, length: 20, width: 20, height: 20,
    category: 'General Parcel', speed: 'Standard', parcelValue: 5000
  });
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'vehicles') fetchVehicles();
    if (activeTab === 'rules') fetchRules();
    if (activeTab === 'simulator') handleSimulate();
  }, [activeTab]);

  const fetchVehicles = async () => {
    setVehiclesLoading(true);
    try {
      const res = await api.get('/pricing/vehicles');
      setVehicles(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch vehicle pricing:', err);
    } finally {
      setVehiclesLoading(false);
    }
  };

  const openVehicleModal = (veh) => {
    setEditingVehicle(veh);
    setVehicleFormData({
      baseFare: veh.baseFare ?? 50,
      baseKm: veh.baseKm ?? 3,
      perKm: veh.perKm ?? 7,
      helperFee: veh.helperFee ?? 0,
      minimumCharge: veh.minimumCharge ?? veh.baseFare ?? 50,
      maxWeight: veh.maxWeight ?? 20,
      isActive: veh.isActive !== false
    });
    setShowVehicleModal(true);
  };

  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    if (!editingVehicle) return;
    setSavingVehicle(true);
    try {
      const targetId = editingVehicle._id || editingVehicle.vehicleType;
      await api.put(`/pricing/vehicles/${targetId}`, vehicleFormData);
      setShowVehicleModal(false);
      fetchVehicles();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update vehicle pricing');
    } finally {
      setSavingVehicle(false);
    }
  };

  const fetchRules = async () => {
    setRulesLoading(true);
    try {
      const r = await api.get('/pricing/rules');
      setRules(r.data.data || []);
    } catch {} finally { setRulesLoading(false); }
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    try {
      // Clean up empty strings to undefined
      const payload = { ...formData };
      ['originCity', 'destCity', 'originPincode', 'destPincode', 'category', 'maxWeight'].forEach(k => {
        if (payload.conditions[k] === '') delete payload.conditions[k];
      });

      if (editingRule) {
        await api.put(`/pricing/rules/${editingRule._id}`, payload);
      } else {
        await api.post('/pricing/rules', payload);
      }
      setShowRuleModal(false);
      fetchRules();
    } catch (err) { alert(err.response?.data?.error || 'Failed to save rule'); }
  };

  const handleDeleteRule = async (id) => {
    if (!window.confirm('Delete this rule permanently?')) return;
    try {
      await api.delete(`/pricing/rules/${id}`);
      fetchRules();
    } catch (err) { alert('Delete failed'); }
  };

  const handleSimulate = async () => {
    setSimLoading(true);
    setSimResult(null);
    try {
      const r = await api.post('/pricing/preview', simParams);
      setSimResult(r.data.data);
    } catch (err) { alert('Simulation failed'); }
    finally { setSimLoading(false); }
  };

  const openModal = (rule = null) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        ruleName: rule.ruleName, ruleType: rule.ruleType, movementType: rule.movementType, speed: rule.speed, isSurcharge: rule.isSurcharge,
        conditions: { ...rule.conditions, minWeight: rule.conditions.minWeight || 0, maxWeight: rule.conditions.maxWeight || '' },
        rates: { ...rule.rates },
        isActive: rule.isActive
      });
    } else {
      setEditingRule(null);
      setFormData({
        ruleName: '', ruleType: 'Base', movementType: 'Any', speed: 'Any', isSurcharge: false,
        conditions: { originCity: '', destCity: '', originPincode: '', destPincode: '', category: '', minWeight: 0, maxWeight: '' },
        rates: { basePrice: 0, perKgRate: 0, perKmRate: 0, handlingCost: 0, partnerCost: 0, riderCost: 0, minimumCharge: 0, marginPercentage: 0, discountPercentage: 0, gstPercentage: 18, insurancePercentage: 0 },
        isActive: true
      });
    }
    setShowRuleModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Finance & Pricing Engine</h1>
          <p className="text-slate-500 text-sm mt-1">Manage dynamic rates, slab pricing, and calculate margins.</p>
        </div>
        <div className="flex bg-slate-200/60 p-1 rounded-xl flex-wrap gap-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-lg transition ${activeTab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ TAB: VEHICLE PER-KM PRICING ═══ */}
      {activeTab === 'vehicles' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-200 gap-3">
            <div>
              <h2 className="font-black text-slate-900 text-lg flex items-center gap-2">
                <Truck size={20} className="text-[#0052CC]" /> Vehicle Per-KM Pricing &amp; Base Rates
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Set base fare, free included distance, per-km rate, and helper fees. Changes reflect instantly on customer ride booking and estimation.
              </p>
            </div>
            <button 
              onClick={fetchVehicles} 
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <RefreshCcw size={14} className={vehiclesLoading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>

          {vehiclesLoading ? (
            <div className="py-16 flex justify-center"><Loader2 className="animate-spin text-slate-400" size={32} /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {vehicles.map(veh => {
                const isBike = veh.vehicleType === 'Scooter';
                const isAuto = veh.vehicleType.includes('3W') || veh.vehicleType.includes('3 Wheeler');
                const isTruck = veh.vehicleType.includes('14ft') || veh.vehicleType.includes('17ft');
                const emoji = isBike ? '🛵' : isAuto ? '🛺' : isTruck ? '🚚' : '🛻';
                const badgeColor = isBike ? 'bg-amber-50 text-amber-700 border-amber-200' : isAuto ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : isTruck ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200';

                return (
                  <div key={veh._id || veh.vehicleType} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition">
                    <div className="p-4 border-b border-slate-100 flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="text-2xl p-2 rounded-xl bg-slate-50 border border-slate-100">
                          {emoji}
                        </div>
                        <div>
                          <h3 className="font-black text-slate-900 text-sm">{veh.displayName || veh.vehicleType}</h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                            Max {veh.maxWeight} kg
                          </span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${veh.isActive !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {veh.isActive !== false ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <div className="p-4 space-y-3 flex-1">
                      <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-100 text-center">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <p className="text-[10px] uppercase font-bold text-slate-400">Base Fare</p>
                          <p className="text-lg font-black text-slate-900">₹{veh.baseFare ?? 50}</p>
                          <p className="text-[9px] text-slate-500 font-medium">first {veh.baseKm ?? 3} km included</p>
                        </div>
                        <div className="bg-blue-50/60 p-2.5 rounded-xl border border-blue-100">
                          <p className="text-[10px] uppercase font-bold text-[#0052CC]">Per Extra KM</p>
                          <p className="text-lg font-black text-[#0052CC]">₹{veh.perKm ?? 7} <span className="text-[10px] font-normal">/km</span></p>
                          <p className="text-[9px] text-blue-600 font-medium">after {veh.baseKm ?? 3} km</p>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold">Helper / Labour:</span>
                          <span className="font-bold text-slate-800">{veh.helperFee ? `₹${veh.helperFee}` : isBike ? 'N/A (2W)' : '₹0 (Free)'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold">Minimum Charge:</span>
                          <span className="font-bold text-slate-800">₹{veh.minimumCharge || veh.baseFare || 50}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold">Avg Arrival ETA:</span>
                          <span className="font-bold text-slate-800">{veh.etaText || '10 mins'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50/80 border-t border-slate-100">
                      <button 
                        onClick={() => openVehicleModal(veh)} 
                        className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-98 shadow-2xs cursor-pointer"
                      >
                        <Edit2 size={13} className="text-[#0052CC]" /> Edit Rates
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: RULES ═══ */}
      {activeTab === 'rules' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <Settings size={18} className="text-[#006D77]" /> Active Pricing Rules
            </h2>
            <button onClick={() => openModal()} className="px-4 py-2 bg-[#006D77] hover:bg-[#005f6a] text-white font-bold text-sm rounded-lg flex items-center gap-2">
              <Plus size={16} /> New Rule
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {rulesLoading ? (
              <div className="col-span-full py-12 flex justify-center"><Loader2 className="animate-spin text-slate-400" size={24} /></div>
            ) : rules.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200 border-dashed">
                No rules found. Create a base rule to get started.
              </div>
            ) : (
              rules.map(rule => (
                <div key={rule._id} className={`bg-white rounded-xl shadow-sm border-2 ${rule.isSurcharge ? 'border-amber-200' : 'border-slate-200'} overflow-hidden flex flex-col`}>
                  <div className={`px-4 py-3 border-b flex justify-between items-start ${rule.isSurcharge ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-50/50 border-slate-100'}`}>
                    <div>
                      <div className="font-bold text-slate-900">{rule.ruleName}</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mt-1 flex gap-2">
                        <span>{rule.ruleType}</span>
                        {rule.isSurcharge && <span className="text-amber-600">(Surcharge)</span>}
                        {!rule.isActive && <span className="text-red-500">(Inactive)</span>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openModal(rule)} className="p-1.5 text-slate-400 hover:text-[#006D77] rounded bg-white border border-slate-200"><Edit2 size={14} /></button>
                      <button onClick={() => handleDeleteRule(rule._id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded bg-white border border-slate-200"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="p-4 flex-1 space-y-3">
                    <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Base Price</div>
                        <div className="font-black text-slate-700">₹{rule.rates.basePrice}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Per Kg</div>
                        <div className="font-black text-slate-700">₹{rule.rates.perKgRate}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Per Km</div>
                        <div className="font-black text-slate-700">₹{rule.rates.perKmRate}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Applies When:</div>
                      {rule.movementType !== 'Any' && <div className="text-xs text-slate-600 flex items-center gap-1"><Map size={12} /> {rule.movementType}</div>}
                      {rule.speed !== 'Any' && <div className="text-xs text-slate-600 flex items-center gap-1"><TrendingUp size={12} /> {rule.speed}</div>}
                      {rule.conditions.minWeight > 0 && <div className="text-xs text-slate-600 flex items-center gap-1"><Package size={12} /> Min Wt: {rule.conditions.minWeight}kg</div>}
                      {rule.conditions.maxWeight && <div className="text-xs text-slate-600 flex items-center gap-1"><Package size={12} /> Max Wt: {rule.conditions.maxWeight}kg</div>}
                      {rule.conditions.originCity && <div className="text-xs text-slate-600 flex items-center gap-1"><MapPin size={12} /> Orig: {rule.conditions.originCity}</div>}
                      {rule.conditions.destCity && <div className="text-xs text-slate-600 flex items-center gap-1"><MapPin size={12} /> Dest: {rule.conditions.destCity}</div>}
                      {rule.conditions.originPincode && <div className="text-xs text-slate-600 flex items-center gap-1"><MapPin size={12} /> Orig Pin: {rule.conditions.originPincode}</div>}
                      {rule.conditions.destPincode && <div className="text-xs text-slate-600 flex items-center gap-1"><MapPin size={12} /> Dest Pin: {rule.conditions.destPincode}</div>}
                      {rule.conditions.category && <div className="text-xs text-slate-600 flex items-center gap-1"><ShieldAlert size={12} /> Cat: {rule.conditions.category}</div>}
                      {Object.keys(rule.conditions).length === 0 && rule.movementType === 'Any' && rule.speed === 'Any' && (
                        <div className="text-xs text-slate-400 italic">Applies to all bookings if no specific rule matched.</div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ═══ TAB: SIMULATOR ═══ */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
          
          {/* Inputs */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h2 className="font-bold text-slate-900 flex items-center gap-2"><Calculator size={18} className="text-[#006D77]" /> Cargo Details</h2>
              <button onClick={handleSimulate} className="px-3 py-1.5 bg-[#006D77] text-white text-xs font-bold rounded flex items-center gap-1">
                {simLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCcw size={12} />} Recalculate
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Origin City</label>
                  <input type="text" value={simParams.originCity} onChange={e => setSimParams({...simParams, originCity: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Dest City</label>
                  <input type="text" value={simParams.destCity} onChange={e => setSimParams({...simParams, destCity: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Distance (km)</label>
                  <input type="number" value={simParams.distanceKm} onChange={e => setSimParams({...simParams, distanceKm: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Act. Weight (kg)</label>
                  <input type="number" value={simParams.actualWeight} onChange={e => setSimParams({...simParams, actualWeight: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Value (₹)</label>
                  <input type="number" value={simParams.parcelValue} onChange={e => setSimParams({...simParams, parcelValue: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Length (cm)</label>
                  <input type="number" value={simParams.length} onChange={e => setSimParams({...simParams, length: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Width (cm)</label>
                  <input type="number" value={simParams.width} onChange={e => setSimParams({...simParams, width: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Height (cm)</label>
                  <input type="number" value={simParams.height} onChange={e => setSimParams({...simParams, height: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Category</label>
                  <select value={simParams.category} onChange={e => setSimParams({...simParams, category: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option>General Parcel</option><option>Document</option><option>Fragile Item</option><option>Electronics</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Speed</label>
                  <select value={simParams.speed} onChange={e => setSimParams({...simParams, speed: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option>Standard</option><option>Express</option><option>Same-Day</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Results Output */}
          <div className="bg-gradient-to-b from-[#0F172A] to-[#1e293b] text-white rounded-xl shadow-lg border border-slate-700 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <DollarSign size={120} />
            </div>
            
            <div className="p-5 border-b border-white/10 relative z-10">
              <h2 className="font-bold flex items-center gap-2"><DollarSign size={18} className="text-[#FFB703]" /> Price Breakdown (Simulation)</h2>
            </div>

            {simLoading || !simResult ? (
              <div className="p-12 flex justify-center"><Loader2 size={32} className="animate-spin text-white/30" /></div>
            ) : (
              <div className="p-5 relative z-10 space-y-6">
                
                <div className="flex gap-4 p-3 bg-white/5 rounded-lg border border-white/10">
                  <div>
                    <div className="text-[10px] text-white/50 uppercase font-bold">Chargeable Wt</div>
                    <div className="font-black text-lg text-white">{simResult.chargeableWeight} kg</div>
                  </div>
                  <div className="text-white/30">|</div>
                  <div>
                    <div className="text-[10px] text-white/50 uppercase font-bold">Movement</div>
                    <div className="font-black text-lg text-white">{simResult.movementType}</div>
                  </div>
                  <div className="text-white/30">|</div>
                  <div>
                    <div className="text-[10px] text-white/50 uppercase font-bold">Vol Wt.</div>
                    <div className="font-black text-lg text-white">{simResult.volumetricWeight} kg</div>
                  </div>
                </div>

                <div className="space-y-2 text-sm font-medium font-mono text-white/80">
                  <div className="flex justify-between pb-1 border-b border-white/5"><span>Base Cost</span> <span>₹{simResult.breakdown.baseCost}</span></div>
                  <div className="flex justify-between pb-1 border-b border-white/5"><span>Handling</span> <span>₹{simResult.breakdown.handlingFee}</span></div>
                  <div className="flex justify-between pb-1 border-b border-white/5"><span>Surcharges</span> <span className="text-[#FFB703]">+ ₹{simResult.breakdown.surcharges}</span></div>
                  <div className="flex justify-between pb-1 border-b border-white/5"><span>Insurance</span> <span>₹{simResult.breakdown.insurance}</span></div>
                  {simResult.breakdown.discount > 0 && <div className="flex justify-between pb-1 border-b border-white/5 text-green-300"><span>Discount</span> <span>- ₹{simResult.breakdown.discount}</span></div>}
                  
                  <div className="flex justify-between pt-2 pb-1 text-white font-bold"><span>Subtotal (Pre-tax)</span> <span>₹{simResult.breakdown.subtotal}</span></div>
                  <div className="flex justify-between pb-1 border-b border-white/10 text-xs text-white/50"><span>GST (Tax)</span> <span>₹{simResult.breakdown.gst}</span></div>
                  
                  <div className="flex justify-between pt-3 text-2xl font-black text-white">
                    <span>Final Price to Customer</span> 
                    <span className="text-green-400">₹{simResult.breakdown.totalCustomerPrice}</span>
                  </div>
                </div>

                <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                  <h3 className="text-xs font-bold text-white/50 uppercase tracking-wide mb-3">Profitability Analysis</h3>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-[10px] text-white/60 mb-0.5">Est. Internal Cost</div>
                      <div className="font-bold">₹{simResult.profitability.totalInternalCost}</div>
                    </div>
                    <div className="border-l border-r border-white/10">
                      <div className="text-[10px] text-white/60 mb-0.5">Gross Margin</div>
                      <div className="font-bold text-green-300">₹{simResult.profitability.grossMargin}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/60 mb-0.5">Margin %</div>
                      <div className="font-bold text-[#FFB703]">{simResult.profitability.marginPercentage}%</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-bold text-white/50 uppercase mb-1.5">Rules Applied</h3>
                  <div className="flex flex-wrap gap-1">
                    {simResult.appliedRules.map((r, i) => (
                      <span key={i} className="bg-[#006D77]/50 text-white text-[10px] px-2 py-0.5 rounded border border-[#006D77]">{r}</span>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ TAB: PARTNER COSTS (Future) ═══ */}
      {activeTab === 'partner-costs' && (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center animate-in fade-in">
          <DollarSign size={48} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Partner Rate Sheets</h2>
          <p className="text-slate-500 max-w-md mx-auto">Future integration: Upload Excel sheets of 3PL partner rates here to automatically update internal cost bases.</p>
        </div>
      )}

      {/* ═══ MODAL: EDIT VEHICLE PRICING ═══ */}
      {showVehicleModal && editingVehicle && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 mt-0 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
              <div className="flex items-center gap-2">
                <Truck size={18} className="text-[#0052CC]" />
                <h3 className="font-black text-slate-900 text-base">Edit {editingVehicle.displayName || editingVehicle.vehicleType} Rates</h3>
              </div>
              <button onClick={() => setShowVehicleModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Base Fare (₹)</label>
                  <input 
                    type="number" 
                    min="0"
                    required
                    value={vehicleFormData.baseFare} 
                    onChange={e => setVehicleFormData({ ...vehicleFormData, baseFare: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] outline-none"
                  />
                  <span className="text-[10px] text-slate-400 font-medium">Minimum base rate</span>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Included Base KMs</label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    value={vehicleFormData.baseKm} 
                    onChange={e => setVehicleFormData({ ...vehicleFormData, baseKm: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] outline-none"
                  />
                  <span className="text-[10px] text-slate-400 font-medium">Covered in Base Fare</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Rate Per Extra KM (₹)</label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    value={vehicleFormData.perKm} 
                    onChange={e => setVehicleFormData({ ...vehicleFormData, perKm: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] outline-none"
                  />
                  <span className="text-[10px] text-slate-400 font-medium">Charged after base kms</span>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Helper / Labour Fee (₹)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={vehicleFormData.helperFee} 
                    onChange={e => setVehicleFormData({ ...vehicleFormData, helperFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] outline-none"
                  />
                  <span className="text-[10px] text-slate-400 font-medium">Loading/unloading fee</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Minimum Total Trip (₹)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={vehicleFormData.minimumCharge} 
                    onChange={e => setVehicleFormData({ ...vehicleFormData, minimumCharge: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] outline-none"
                  />
                  <span className="text-[10px] text-slate-400 font-medium">Floor price</span>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Max Payload (KG)</label>
                  <input 
                    type="number" 
                    min="1"
                    value={vehicleFormData.maxWeight} 
                    onChange={e => setVehicleFormData({ ...vehicleFormData, maxWeight: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] outline-none"
                  />
                  <span className="text-[10px] text-slate-400 font-medium">Weight limit</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <input 
                  type="checkbox" 
                  id="vehActive"
                  checked={vehicleFormData.isActive} 
                  onChange={e => setVehicleFormData({ ...vehicleFormData, isActive: e.target.checked })} 
                  className="w-4 h-4 accent-[#0052CC] rounded cursor-pointer"
                />
                <label htmlFor="vehActive" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Vehicle Available for Customer Booking
                </label>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button 
                  type="button" 
                  onClick={() => setShowVehicleModal(false)} 
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={savingVehicle}
                  className="flex-1 py-2.5 text-xs font-black text-white bg-[#0052CC] hover:bg-blue-700 rounded-xl transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {savingVehicle ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  <span>Save Rates</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Rule Editor */}
      {showRuleModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 mt-0">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-slate-900">{editingRule ? 'Edit Pricing Rule' : 'New Pricing Rule'}</h2>
              <button onClick={() => setShowRuleModal(false)} className="text-slate-400 hover:text-slate-700"><X size={22} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
              <form id="ruleForm" onSubmit={handleSaveRule} className="space-y-6">
                
                {/* Basic Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Rule Name</label>
                    <input required type="text" value={formData.ruleName} onChange={e => setFormData({...formData, ruleName: e.target.value})} className="w-full px-3 py-2 border rounded-lg font-bold" placeholder="e.g. Standard Local Base" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Rule Type</label>
                    <select value={formData.ruleType} onChange={e => setFormData({...formData, ruleType: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                      <option>Base</option><option>Slab</option><option>Route</option><option>Pincode</option><option>Surcharge</option>
                    </select>
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.isSurcharge} onChange={e => setFormData({...formData, isSurcharge: e.target.checked})} className="w-4 h-4 accent-[#006D77]" />
                      <span className="text-sm font-bold text-slate-700">Is this an additive Surcharge?</span>
                    </label>
                  </div>
                </div>

                {/* Rates */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 border-b pb-2">Rate Configuration (₹)</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {/* Internal Costs row */}
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 col-span-3 mb-2">
                       <h4 className="text-xs font-bold text-slate-700 mb-2">Internal Cost (₹)</h4>
                       <div className="grid grid-cols-3 gap-4">
                         <div>
                           <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Partner Cost</label>
                           <input type="number" value={formData.rates.partnerCost} onChange={e => setFormData({...formData, rates: {...formData.rates, partnerCost: Number(e.target.value)}})} className="w-full px-3 py-1.5 border rounded-lg font-mono text-sm bg-white" />
                         </div>
                         <div>
                           <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Rider Cost</label>
                           <input type="number" value={formData.rates.riderCost} onChange={e => setFormData({...formData, rates: {...formData.rates, riderCost: Number(e.target.value)}})} className="w-full px-3 py-1.5 border rounded-lg font-mono text-sm bg-white" />
                         </div>
                         <div>
                           <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Handling Cost</label>
                           <input type="number" value={formData.rates.handlingCost} onChange={e => setFormData({...formData, rates: {...formData.rates, handlingCost: Number(e.target.value)}})} className="w-full px-3 py-1.5 border rounded-lg font-mono text-sm bg-white" />
                         </div>
                       </div>
                    </div>

                    {/* Customer Pricing row */}
                    <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 col-span-3 mb-2">
                       <h4 className="text-xs font-bold text-blue-700 mb-3">Customer Pricing (₹)</h4>
                       <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                         <div>
                           <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Base/Fixed</label>
                           <input type="number" value={formData.rates.basePrice} onChange={e => setFormData({...formData, rates: {...formData.rates, basePrice: Number(e.target.value)}})} className="w-full px-3 py-2 border rounded-lg font-mono text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
                         </div>
                         <div>
                           <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Per Kg</label>
                           <input type="number" value={formData.rates.perKgRate} onChange={e => setFormData({...formData, rates: {...formData.rates, perKgRate: Number(e.target.value)}})} className="w-full px-3 py-2 border rounded-lg font-mono text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
                         </div>
                         <div>
                           <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Per Km</label>
                           <input type="number" value={formData.rates.perKmRate} onChange={e => setFormData({...formData, rates: {...formData.rates, perKmRate: Number(e.target.value)}})} className="w-full px-3 py-2 border rounded-lg font-mono text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
                         </div>
                         <div>
                           <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Min Charge</label>
                           <input type="number" value={formData.rates.minimumCharge} onChange={e => setFormData({...formData, rates: {...formData.rates, minimumCharge: Number(e.target.value)}})} className="w-full px-3 py-2 border rounded-lg font-mono text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
                         </div>
                       </div>
                    </div>
                    
                    {/* Margins & Taxes row */}
                    <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 col-span-3">
                       <h4 className="text-xs font-bold text-emerald-700 mb-3">Margins & Taxes (%)</h4>
                       <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                         <div>
                           <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Target Margin %</label>
                           <input type="number" value={formData.rates.marginPercentage} onChange={e => setFormData({...formData, rates: {...formData.rates, marginPercentage: Number(e.target.value)}})} className="w-full px-3 py-2 border rounded-lg font-mono text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none" />
                         </div>
                         <div>
                           <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Discount %</label>
                           <input type="number" value={formData.rates.discountPercentage} onChange={e => setFormData({...formData, rates: {...formData.rates, discountPercentage: Number(e.target.value)}})} className="w-full px-3 py-2 border rounded-lg font-mono text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none" />
                         </div>
                         <div>
                           <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">GST %</label>
                           <input type="number" value={formData.rates.gstPercentage} onChange={e => setFormData({...formData, rates: {...formData.rates, gstPercentage: Number(e.target.value)}})} className="w-full px-3 py-2 border rounded-lg font-mono text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none" />
                         </div>
                         <div>
                           <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Insurance %</label>
                           <input type="number" step="0.1" value={formData.rates.insurancePercentage} onChange={e => setFormData({...formData, rates: {...formData.rates, insurancePercentage: Number(e.target.value)}})} className="w-full px-3 py-2 border rounded-lg font-mono text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none" />
                         </div>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Conditions */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 border-b pb-2">Application Conditions (Applies when)</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Movement Type</label>
                      <select value={formData.movementType} onChange={e => setFormData({...formData, movementType: e.target.value})} className="w-full px-3 py-1.5 border rounded-lg text-sm">
                        <option>Any</option><option>Intracity</option><option>Intercity</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Speed Type</label>
                      <select value={formData.speed} onChange={e => setFormData({...formData, speed: e.target.value})} className="w-full px-3 py-1.5 border rounded-lg text-sm">
                        <option>Any</option><option>Standard</option><option>Express</option><option>Same-Day</option>
                      </select>
                    </div>
                  </div>

                  <div className={`grid grid-cols-2 gap-4 ${formData.ruleType === 'Route' ? 'p-3 bg-blue-50/50 rounded-lg border border-blue-200 shadow-sm' : ''}`}>
                    <div>
                      <label className={`text-[10px] font-bold uppercase block mb-1 ${formData.ruleType === 'Route' ? 'text-blue-700' : 'text-slate-500'}`}>Origin City {formData.ruleType === 'Route' ? '*' : '(Optional)'}</label>
                      <input type="text" value={formData.conditions.originCity || ''} onChange={e => setFormData({...formData, conditions: {...formData.conditions, originCity: e.target.value}})} className={`w-full px-3 py-1.5 border rounded-lg text-sm ${formData.ruleType === 'Route' ? 'border-blue-300 focus:ring-blue-500 bg-white' : ''}`} placeholder="e.g. Hyderabad" />
                    </div>
                    <div>
                      <label className={`text-[10px] font-bold uppercase block mb-1 ${formData.ruleType === 'Route' ? 'text-blue-700' : 'text-slate-500'}`}>Dest City {formData.ruleType === 'Route' ? '*' : '(Optional)'}</label>
                      <input type="text" value={formData.conditions.destCity || ''} onChange={e => setFormData({...formData, conditions: {...formData.conditions, destCity: e.target.value}})} className={`w-full px-3 py-1.5 border rounded-lg text-sm ${formData.ruleType === 'Route' ? 'border-blue-300 focus:ring-blue-500 bg-white' : ''}`} placeholder="e.g. Bangalore" />
                    </div>
                  </div>

                  <div className={`grid grid-cols-2 gap-4 ${formData.ruleType === 'Pincode' ? 'p-3 bg-blue-50/50 rounded-lg border border-blue-200 shadow-sm' : ''}`}>
                    <div>
                      <label className={`text-[10px] font-bold uppercase block mb-1 ${formData.ruleType === 'Pincode' ? 'text-blue-700' : 'text-slate-500'}`}>Origin Pincode {formData.ruleType === 'Pincode' ? '*' : '(Optional)'}</label>
                      <input type="text" value={formData.conditions.originPincode || ''} onChange={e => setFormData({...formData, conditions: {...formData.conditions, originPincode: e.target.value}})} className={`w-full px-3 py-1.5 border rounded-lg text-sm ${formData.ruleType === 'Pincode' ? 'border-blue-300 focus:ring-blue-500 bg-white' : ''}`} placeholder="e.g. 500001" />
                    </div>
                    <div>
                      <label className={`text-[10px] font-bold uppercase block mb-1 ${formData.ruleType === 'Pincode' ? 'text-blue-700' : 'text-slate-500'}`}>Dest Pincode {formData.ruleType === 'Pincode' ? '*' : '(Optional)'}</label>
                      <input type="text" value={formData.conditions.destPincode || ''} onChange={e => setFormData({...formData, conditions: {...formData.conditions, destPincode: e.target.value}})} className={`w-full px-3 py-1.5 border rounded-lg text-sm ${formData.ruleType === 'Pincode' ? 'border-blue-300 focus:ring-blue-500 bg-white' : ''}`} placeholder="e.g. 500081" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Category (Optional)</label>
                      <select value={formData.conditions.category} onChange={e => setFormData({...formData, conditions: {...formData.conditions, category: e.target.value}})} className="w-full px-3 py-1.5 border rounded-lg text-sm">
                        <option value="">Any</option><option>General Parcel</option><option>Fragile Item</option><option>Electronics</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Min Wt (kg)</label>
                      <input type="number" value={formData.conditions.minWeight} onChange={e => setFormData({...formData, conditions: {...formData.conditions, minWeight: Number(e.target.value)}})} className="w-full px-3 py-1.5 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Max Wt (kg)</label>
                      <input type="number" value={formData.conditions.maxWeight} onChange={e => setFormData({...formData, conditions: {...formData.conditions, maxWeight: Number(e.target.value)}})} className="w-full px-3 py-1.5 border rounded-lg text-sm" placeholder="No Limit" />
                    </div>
                  </div>

                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 accent-[#006D77]" />
                  <span className="text-sm font-bold text-slate-700">Rule is Active</span>
                </div>

              </form>
            </div>
            
            <div className="p-4 border-t border-slate-100 flex gap-3 shrink-0 bg-white">
              <button type="button" onClick={() => setShowRuleModal(false)} className="flex-1 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
              <button type="submit" form="ruleForm" className="flex-1 py-2.5 text-sm font-bold text-white bg-[#006D77] hover:bg-[#005f6a] rounded-lg transition">Save Rule</button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
