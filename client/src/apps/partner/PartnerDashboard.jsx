import React, { useState, useEffect } from 'react';
import { Package, Truck, Scan, CheckCircle2, AlertTriangle, User, RefreshCcw } from 'lucide-react';
import api from '../../api';

export default function PartnerDashboard() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanId, setScanId] = useState('');
  const [scanResult, setScanResult] = useState(null);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/partner/shipments');
      if (res.data && res.data.data) {
        setShipments(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!scanId) return;
    
    try {
      const res = await api.post('/partner/shipments/scan', { trackingId: scanId });
      setScanResult({ success: true, message: 'Shipment Found!', data: res.data.data });
    } catch (err) {
      setScanResult({ success: false, message: err.response?.data?.error || 'Shipment not found in your network.' });
    }
  };

  const updateStatus = async (trackingId, newStatus) => {
    try {
      await api.post('/partner/shipments/update-status', { trackingId, status: newStatus });
      fetchShipments();
      setScanResult(null); // Close scan result
      setScanId('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-[#1e1e1e] text-white p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div>
            <img src="/images/logo.png" alt="ZyperGo Logo" className="h-8" />
            <p className="text-[10px] text-slate-400 font-mono">VRL Logistics (HYD Branch)</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={fetchShipments} className="text-slate-400 hover:text-white transition">
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
            <User size={16} />
          </div>
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Scanning Interface */}
          <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Scan size={20} className="text-[#006D77]"/> Scan & Receive
            </h2>
            <form onSubmit={handleScan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tracking ID / AWB</label>
                <input 
                  type="text" 
                  value={scanId} 
                  onChange={e => setScanId(e.target.value)}
                  placeholder="e.g. ZYP12345678" 
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#006D77] outline-none font-mono uppercase"
                />
              </div>
              <button type="submit" className="w-full bg-[#006D77] text-white font-bold py-3 rounded-lg hover:bg-[#00585f] shadow-sm">
                Lookup Parcel
              </button>
            </form>

            {scanResult && (
              <div className={`mt-6 p-4 rounded-lg border ${scanResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                {scanResult.success ? (
                  <>
                    <p className="font-bold text-green-800 flex items-center gap-2 mb-2"><CheckCircle2 size={16}/> {scanResult.message}</p>
                    <div className="text-sm text-green-900 space-y-1 mb-4">
                      <p><strong>AWB:</strong> {scanResult.data.trackingId}</p>
                      <p><strong>Status:</strong> {scanResult.data.status}</p>
                      <p><strong>Route:</strong> {scanResult.data.pickupLocation?.pincode} &rarr; {scanResult.data.dropLocation?.pincode}</p>
                    </div>
                    {scanResult.data.status === 'Sorted' || scanResult.data.status === 'Source Hub Received' ? (
                      <button onClick={() => updateStatus(scanResult.data.trackingId, 'Partner Handover')} className="w-full bg-green-600 text-white font-bold py-2 rounded">
                        Accept Handover
                      </button>
                    ) : (
                      <p className="text-xs text-green-700 italic">This parcel has already been accepted into your network.</p>
                    )}
                  </>
                ) : (
                  <p className="font-bold text-red-800 flex items-center gap-2"><AlertTriangle size={16}/> {scanResult.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Assigned Shipments */}
          <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-[600px]">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Package size={20} className="text-[#006D77]"/> Active Network Shipments
            </h2>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {loading ? (
                <p className="text-center py-12 text-slate-500">Loading assigned shipments...</p>
              ) : shipments.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Truck size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="font-bold text-slate-900">No active shipments.</p>
                  <p className="text-sm">You have no pending intercity shipments right now.</p>
                </div>
              ) : (
                shipments.map(s => (
                  <div key={s._id} className="border border-slate-200 rounded-xl p-4 hover:border-[#006D77]/30 transition">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-mono font-bold text-[#006D77]">{s.trackingId}</span>
                        <p className="text-sm font-bold text-slate-800 mt-1">{s.pickupLocation?.city || s.pickupLocation?.pincode} &rarr; {s.dropLocation?.city || s.dropLocation?.pincode}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                        s.status === 'Partner Handover' ? 'bg-blue-100 text-blue-700' :
                        s.status === 'In Transit' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {s.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-end mt-4 pt-4 border-t border-slate-100">
                      <p className="text-xs text-slate-500 font-bold">W: {s.packageDetails?.weight}kg</p>
                      <div className="flex gap-2">
                        {s.status === 'Partner Handover' && (
                          <button onClick={() => updateStatus(s.trackingId, 'In Transit')} className="text-xs font-bold bg-[#0F172A] text-white px-4 py-2 rounded-lg">
                            Dispatch (In Transit)
                          </button>
                        )}
                        {s.status === 'In Transit' && (
                          <button onClick={() => updateStatus(s.trackingId, 'Destination Hub Received')} className="text-xs font-bold bg-green-600 text-white px-4 py-2 rounded-lg">
                            Arrived at Dest Hub
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
