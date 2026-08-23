import React, { useState, useEffect } from 'react';
import { LifeBuoy, AlertCircle, MessageSquare, PhoneCall, CheckCircle, PackageX, UserX, Clock, Send, FileText, Plus, X, Megaphone } from 'lucide-react';
import CRMProfilePanel from './crm/CRMProfilePanel';
import BulkUpdateModal from './crm/BulkUpdateModal';
import api from '../../api';

export default function SupportTickets() {
  const [activeQueue, setActiveQueue] = useState('open');
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [showCRM, setShowCRM] = useState(false);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [activeQueue]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const statusFilter = activeQueue === 'open' ? 'Open' : 'Resolved';
      const res = await api.get(`/support/admin/tickets?status=${statusFilter}`);
      if (res.data.success) {
        setTickets(res.data.data);
        if (res.data.data.length > 0 && !selectedTicket) {
          setSelectedTicket(res.data.data[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNote = async () => {
    if (!newNote.trim() || !selectedTicket) return;
    try {
      const res = await api.put(`/support/admin/tickets/${selectedTicket._id}`, { internalNote: newNote });
      if (res.data.success) {
        setSelectedTicket(res.data.data);
        setNewNote('');
        fetchTickets(); // Refresh list to get updated notes
      }
    } catch (err) {
      console.error("Error adding note:", err);
    }
  };

  const updateStatus = async (newStatus) => {
    if (!selectedTicket) return;
    try {
      const res = await api.put(`/support/admin/tickets/${selectedTicket._id}`, { status: newStatus });
      if (res.data.success) {
        setSelectedTicket(res.data.data);
        fetchTickets();
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-100px)] relative">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Support & Escalations</h1>
          <p className="text-slate-500 text-sm mt-1">Manage NDRs, exceptions, and customer tickets.</p>
        </div>
        <div className="flex bg-slate-200 p-1 rounded-lg">
          <button 
            onClick={() => setShowBulkUpdate(true)}
            className="px-4 py-1.5 mr-2 rounded-md text-sm font-bold transition flex items-center gap-2 text-amber-700 bg-amber-100 hover:bg-amber-200 shadow-sm"
          >
            <Megaphone size={16} /> Bulk Alert
          </button>
          <button 
            onClick={() => setActiveQueue('open')}
            className={`px-4 py-1.5 rounded-md text-sm font-bold transition flex items-center gap-2 ${activeQueue === 'open' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <AlertCircle size={16} /> Open
          </button>
          <button 
            onClick={() => setActiveQueue('resolved')}
            className={`px-4 py-1.5 rounded-md text-sm font-bold transition flex items-center gap-2 ${activeQueue === 'resolved' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <CheckCircle size={16} /> Resolved
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Ticket List */}
        <div className="w-1/3 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden shrink-0">
          <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-900 flex justify-between items-center">
            Queue 
            <span className="text-xs font-bold bg-[#FFB703] text-slate-900 px-2 py-0.5 rounded-full">Newest First</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {loading ? (
              <p className="text-center text-slate-500 p-4">Loading tickets...</p>
            ) : tickets.length === 0 ? (
              <p className="text-center text-slate-500 p-4">No tickets in this queue.</p>
            ) : (
              tickets.map((tkt) => (
                <div 
                  key={tkt._id} 
                  onClick={() => setSelectedTicket(tkt)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${selectedTicket?._id === tkt._id ? 'bg-slate-50 border-[#006D77]' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-slate-500">{tkt._id.substring(18).toUpperCase()}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{new Date(tkt.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1 line-clamp-1">{tkt.description}</h3>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                      <MessageSquare size={14} /> <span className="line-clamp-1 max-w-[100px]">{tkt.issueType}</span>
                    </div>
                    {tkt.priority === 'High' || tkt.priority === 'Critical' ? <span className="w-2 h-2 rounded-full bg-red-500"></span> : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ticket Detail */}
        {selectedTicket ? (
          <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden relative">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded ${selectedTicket.priority === 'Critical' || selectedTicket.priority === 'High' ? 'bg-red-500 text-white' : 'bg-[#006D77] text-white'}`}>
                    {selectedTicket.priority || 'Normal'} Priority
                  </span>
                  {selectedTicket.bookingId && (
                    <span className="text-sm font-bold text-slate-400">AWB: {selectedTicket.bookingId.trackingId}</span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-slate-900">{selectedTicket.issueType}</h2>
                {selectedTicket.user ? (
                  <button 
                    onClick={() => setShowCRM(true)}
                    className="text-sm text-slate-500 mt-1 font-medium hover:text-[#006D77] flex items-center gap-2 group transition"
                  >
                    Customer: <span className="text-[#006D77] group-hover:underline">{selectedTicket.user.name}</span> 
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">View CRM</span>
                  </button>
                ) : (
                  <p className="text-sm text-slate-500 mt-1 font-medium">Customer: Guest</p>
                )}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => updateStatus(selectedTicket.status === 'Resolved' ? 'Open' : 'Resolved')}
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition ${selectedTicket.status === 'Resolved' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
                >
                  {selectedTicket.status === 'Resolved' ? 'Reopen Ticket' : 'Mark Resolved'}
                </button>
              </div>
            </div>
            
            {/* Conversation/Timeline */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
              
              {/* Original Issue */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">C</div>
                <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm">
                  <p className="text-sm text-slate-700 font-medium leading-relaxed">
                    {selectedTicket.description}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Internal Notes */}
              {selectedTicket.internalNotes?.map((note, idx) => (
                <div key={idx} className="flex gap-4 flex-row-reverse">
                  <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold shrink-0">A</div>
                  <div className="bg-[#006D77] p-4 rounded-2xl rounded-tr-none shadow-sm text-white max-w-[80%]">
                    <span className="bg-white/20 text-[10px] uppercase font-bold px-2 py-0.5 rounded mb-2 inline-block">Internal Note</span>
                    <p className="text-sm font-medium leading-relaxed text-white/90">
                      {note.note}
                    </p>
                    <p className="text-xs text-white/50 mt-2">{new Date(note.timestamp).toLocaleString()} • Admin</p>
                  </div>
                </div>
              ))}

              {/* Status Changes */}
              {selectedTicket.history?.map((hist, idx) => (
                <div key={`hist-${idx}`} className="flex items-center justify-center">
                  <span className="bg-slate-200 text-slate-500 text-[10px] font-bold uppercase px-3 py-1 rounded-full">
                    {hist.action}
                  </span>
                </div>
              ))}

            </div>
            
            {/* Resolution Actions */}
            <div className="p-4 border-t border-slate-200 bg-white">
              <div className="relative">
                <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendNote()}
                  placeholder="Add an internal note..." 
                  className="w-full pl-12 pr-24 py-3 border border-slate-200 rounded-xl focus:border-[#006D77] outline-none text-sm font-medium bg-slate-50 focus:bg-white transition-colors"
                />
                <button 
                  onClick={handleSendNote}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#006D77] text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-[#00585f] transition flex items-center gap-1"
                >
                  <Send size={14} /> Add
                </button>
              </div>
            </div>
            
            {/* CRM Slide-out Panel overlaying the Ticket Detail */}
            {showCRM && selectedTicket.user && (
              <CRMProfilePanel 
                userId={selectedTicket.user._id} 
                onClose={() => setShowCRM(false)} 
              />
            )}

          </div>
        ) : (
          <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm items-center justify-center text-slate-400">
            <LifeBuoy size={48} className="mb-4 opacity-20" />
            <p className="font-bold">Select a ticket to view details</p>
          </div>
        )}
      </div>
      
      {showBulkUpdate && <BulkUpdateModal onClose={() => setShowBulkUpdate(false)} />}
    </div>
  );
}
