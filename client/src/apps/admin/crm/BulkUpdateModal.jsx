import React, { useState } from 'react';
import { Megaphone, X, Send } from 'lucide-react';
import api from '../../../api';

export default function BulkUpdateModal({ onClose }) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [resultMsg, setResultMsg] = useState('');

  const handleSend = async () => {
    if (!origin || !destination || !message) return;
    setStatus('loading');
    try {
      const res = await api.post('/support/admin/bulk-update', {
        originCity: origin,
        destinationCity: destination,
        message
      });
      if (res.data.success) {
        setStatus('success');
        setResultMsg(res.data.message);
      } else {
        setStatus('error');
        setResultMsg(res.data.message || 'Failed to send bulk update.');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setResultMsg(err.response?.data?.message || 'Failed to send bulk update.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="font-extrabold text-slate-900 flex items-center gap-2">
            <Megaphone size={18} className="text-[#FFB703]" /> Send Bulk Notification
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {status === 'success' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Notification Sent!</h3>
              <p className="text-slate-500">{resultMsg}</p>
              <button 
                onClick={onClose}
                className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500">Notify all customers with active shipments on a specific route about delays or disruptions.</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Origin City</label>
                  <input 
                    type="text" 
                    value={origin}
                    onChange={e => setOrigin(e.target.value)}
                    placeholder="e.g. Mumbai"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#006D77]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Destination City</label>
                  <input 
                    type="text" 
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    placeholder="e.g. Pune"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#006D77]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Message (SMS/WhatsApp)</label>
                <textarea 
                  rows="4"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#006D77] resize-none"
                ></textarea>
                <p className="text-[10px] text-slate-400 mt-1 flex justify-end">{message.length}/160 characters</p>
              </div>

              {status === 'error' && <p className="text-sm text-red-500 font-bold">{resultMsg}</p>}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSend}
                  disabled={status === 'loading'}
                  className="px-6 py-2 bg-[#006D77] text-white rounded-lg font-bold hover:bg-[#00585f] transition disabled:opacity-50 flex items-center gap-2"
                >
                  {status === 'loading' ? 'Sending...' : <><Send size={16} /> Send Alert</>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
