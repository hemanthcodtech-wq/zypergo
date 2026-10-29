import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Clock, CheckCircle2, Search, ArrowUpRight, ChevronLeft, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../api';

export default function CustomerInvoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/bookings/my-shipments');
      if (res.data && res.data.success) {
        setInvoices(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.trackingId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.dropLocation?.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto pb-24">
      {/* Top Mobile Sticky Header */}
      <div className="bg-white px-4 py-3 sticky top-0 z-20 shadow-xs border-b border-slate-100 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/profile')}
            className="p-1 -ml-1 text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title="Go back"
          >
            <ChevronLeft size={22} />
          </button>
          <div>
            <h1 className="text-base font-black text-slate-900 leading-tight">Invoices & Billing</h1>
            <p className="text-[10px] font-bold text-slate-400">DOWNLOAD RECEIPTS & STATEMENTS</p>
          </div>
        </div>
      </div>

      {/* Header */}
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 mb-1">Invoices & Billing</h1>
          <p className="text-sm text-slate-500">Manage your payments, download receipts, and view billing history.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search by Tracking ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full md:w-64 focus:border-[#fb5c00] focus:ring-1 focus:ring-[#fb5c00] outline-none transition-all"
          />
        </div>
      </div>

      {/* Invoice List */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">
            <div className="w-8 h-8 border-4 border-[#fb5c00] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            Loading billing history...
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center text-slate-500">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <FileText size={32} className="text-slate-300" />
            </div>
            <p className="font-bold text-slate-800">No invoices found</p>
            <p className="text-sm mt-1">You don't have any billing history matching your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4 pl-6">Invoice / Tracking ID</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Destination</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={inv._id} 
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-[#fb5c00]">
                          <FileText size={14} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">INV-{inv.trackingId}</p>
                          <p className="text-xs text-slate-500 font-mono">ID: {inv.trackingId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-slate-700 font-medium">{new Date(inv.createdAt).toLocaleDateString()}</p>
                      <p className="text-xs text-slate-500">{new Date(inv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-slate-700 truncate max-w-[150px]">{inv.dropLocation?.address}</p>
                      <p className="text-xs text-slate-500">{inv.dropLocation?.pincode}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900">₹{inv.pricing?.total || 0}</p>
                      <p className="text-xs text-slate-500">{inv.payment?.mode || 'UPI'}</p>
                    </td>
                    <td className="p-4">
                      {inv.payment?.status === 'Completed' ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md text-xs font-bold">
                          <CheckCircle2 size={12} /> Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-md text-xs font-bold">
                          <Clock size={12} /> {inv.payment?.status || 'Pending'}
                        </span>
                      )}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button 
                        onClick={() => setSelectedInvoice(inv)}
                        className="text-[#fb5c00] hover:text-[#e05200] font-bold text-sm inline-flex items-center gap-1 transition-colors"
                      >
                        PDF <Download size={14} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INVOICE MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header Actions - Hidden when printing */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center print:hidden">
              <h2 className="font-bold text-slate-800">Invoice Preview</h2>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handlePrint}
                  className="bg-[#fb5c00] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-[#e05200] transition-colors"
                >
                  <Download size={16} /> Save PDF
                </button>
                <button 
                  onClick={() => setSelectedInvoice(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold px-2 py-2"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable Area */}
            <div className="p-8 md:p-12 overflow-y-auto print:p-0 print:overflow-visible">
              
              {/* Invoice Header */}
              <div className="flex justify-between items-start mb-12 border-b border-slate-200 pb-8">
                <div>
                  <img src="/images/logo.png" alt="ZyperGo" className="h-8 mb-4" />
                  <p className="text-slate-500 text-sm">ZyperGo Logistics Pvt. Ltd.</p>
                  <p className="text-slate-500 text-sm">Madhapur, Hyderabad, 500081</p>
                  <p className="text-slate-500 text-sm">GSTIN: 36ABCDE1234F1Z5</p>
                </div>
                <div className="text-right">
                  <h1 className="text-3xl font-black text-slate-200 tracking-widest uppercase mb-2">Invoice</h1>
                  <p className="font-bold text-slate-800">INV-{selectedInvoice.trackingId}</p>
                  <p className="text-sm text-slate-500">Date: {new Date(selectedInvoice.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Billing Info */}
              <div className="grid grid-cols-2 gap-8 mb-12">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To (Sender)</p>
                  <p className="font-bold text-slate-800">{selectedInvoice.senderDetails?.name || 'Valued Customer'}</p>
                  <p className="text-sm text-slate-600">{selectedInvoice.pickupLocation?.address}</p>
                  <p className="text-sm text-slate-600">Phone: {selectedInvoice.senderDetails?.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Shipped To (Receiver)</p>
                  <p className="font-bold text-slate-800">{selectedInvoice.receiverDetails?.name || 'Receiver'}</p>
                  <p className="text-sm text-slate-600">{selectedInvoice.dropLocation?.address}</p>
                  <p className="text-sm text-slate-600">Phone: {selectedInvoice.receiverDetails?.phone || 'N/A'}</p>
                </div>
              </div>

              {/* Package Details Table */}
              <div className="mb-12 border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Weight/Vol</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-4">
                        <p className="font-bold text-slate-800">{selectedInvoice.metadata?.category || 'General Parcel'} Delivery</p>
                        <p className="text-xs text-slate-500 mt-1">Tracking: {selectedInvoice.trackingId}</p>
                      </td>
                      <td className="p-4 text-right text-slate-700">{selectedInvoice.metadata?.weight || 0} kg</td>
                      <td className="p-4 text-right font-bold text-slate-800">₹{selectedInvoice.pricing?.base || (selectedInvoice.pricing?.total * 0.8).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="p-4" colSpan={2}>
                        <p className="text-sm text-slate-600 text-right">Taxes & Fees (18% GST)</p>
                      </td>
                      <td className="p-4 text-right font-bold text-slate-800">₹{selectedInvoice.pricing?.tax || (selectedInvoice.pricing?.total * 0.2).toFixed(2)}</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200">
                    <tr>
                      <td className="p-4 font-black text-slate-900 text-right uppercase" colSpan={2}>Total Amount</td>
                      <td className="p-4 font-black text-[#fb5c00] text-xl text-right">₹{selectedInvoice.pricing?.total || 0}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Footer */}
              <div className="text-center text-xs text-slate-400 mt-16 pt-8 border-t border-slate-200">
                <p>This is a computer-generated invoice and requires no physical signature.</p>
                <p className="mt-1">For support, contact support@zypergo.com or visit www.zypergo.com</p>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
