"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../../store/useAuthStore';
import { apiFetch } from '../../../lib/api';
import { 
  FileText, 
  Plus, 
  Calendar, 
  AlertCircle, 
  Clock, 
  Trash2, 
  RefreshCw, 
  Search, 
  ExternalLink, 
  CheckCircle,
  ShieldCheck,
  Package,
  IndianRupee
} from 'lucide-react';

interface WarrantyItem {
  id: string;
  productName: string;
  price: number;
  purchaseDate: string;
  expiryDate: string;
  encFileUrl?: string;
  notes?: string;
  createdAt: string;
}

export default function WarrantyPage() {
  const { accessToken } = useAuthStore();
  const [items, setItems] = useState<WarrantyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    productName: '',
    price: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    notes: '',
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (accessToken) fetchWarranties();
  }, [accessToken]);

  const fetchWarranties = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/warranty');
      const data = await res.json();
      if (res.ok) {
        setItems(data.items || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
    const data = new FormData();
    data.append('productName', formData.productName);
    data.append('price', formData.price.toString());
    data.append('purchaseDate', new Date(formData.purchaseDate).toISOString());
    data.append('expiryDate', new Date(formData.expiryDate).toISOString());
    if (formData.notes) data.append('notes', formData.notes);
    if (file) data.append('bill', file);

    try {
      const res = await apiFetch('/warranty', {
        method: 'POST',
        body: data,
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        setFormData({ productName: '', price: '', purchaseDate: new Date().toISOString().split('T')[0], expiryDate: '', notes: '' });
        setFile(null);
        fetchWarranties();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this warranty record?')) return;
    try {
      const res = await apiFetch(`/warranty/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems(items.filter(i => i.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusInfo = (expiry: string) => {
    const days = (new Date(expiry).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    if (days < 0) return { color: 'text-red-400 bg-red-500/10 border-red-500/20', label: 'Expired', icon: AlertCircle };
    if (days < 30) return { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', label: `Expiring in ${Math.ceil(days)}d`, icon: Clock };
    return { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: 'Active Coverage', icon: ShieldCheck };
  };

  const filteredItems = items.filter(i => i.productName.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 md:p-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-4">
            <Package className="w-10 h-10 text-blue-500" />
            Warranty Wallet
          </h1>
          <p className="text-zinc-500 mt-2 text-lg font-medium">Securely managing coverage for {items.length} assets.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="px-8 py-3.5 bg-blue-600 text-white hover:bg-blue-500 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 flex items-center gap-3 active:scale-95"
        >
          <Plus className="w-5 h-5" /> Protect New Asset
        </button>
      </div>

      <div className="relative group max-w-xl">
        <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-blue-500 transition-colors" />
        <input 
          type="text" 
          placeholder="Search by product name..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-900/40 backdrop-blur-3xl border border-white/5 rounded-2xl pl-14 pr-4 py-5 text-white placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium relative z-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredItems.map(item => {
            const status = getStatusInfo(item.expiryDate);
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[var(--card)]/40 backdrop-blur-2xl border border-[var(--border)] rounded-[2.5rem] p-7 hover:border-white/20 transition-all group shadow-xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
                
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center shrink-0 border border-white/5 shadow-inner">
                      <FileText className="w-7 h-7 text-blue-400 group-hover:text-blue-300 transition-colors" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xl font-black text-white truncate tracking-tight">{item.productName}</h3>
                      <div className="flex items-center gap-1 text-emerald-400 font-bold text-sm">
                        <IndianRupee className="w-3.5 h-3.5" />
                        {item.price.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-2.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4 bg-black/40 rounded-3xl p-5 border border-white/5 relative z-10 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> Acquisition
                    </span>
                    <span className="text-zinc-300 text-xs font-bold">{new Date(item.purchaseDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                      <Clock className="w-3 h-3" /> Termination
                    </span>
                    <span className="text-zinc-300 text-xs font-bold">{new Date(item.expiryDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center relative z-10">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest ${status.color}`}>
                    <status.icon className="w-3.5 h-3.5" />
                    {status.label}
                  </div>
                  {item.encFileUrl && (
                    <button className="flex items-center gap-2 text-blue-500 hover:text-blue-400 text-[10px] font-black uppercase tracking-widest transition-all">
                      Scan Bill <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {!isLoading && filteredItems.length === 0 && (
          <div className="col-span-full py-24 text-center">
             <div className="w-24 h-24 bg-zinc-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-white/5">
                <Package className="w-10 h-10 text-zinc-800" />
             </div>
             <h3 className="text-white text-2xl font-black mb-2 tracking-tight">Wallet Empty</h3>
             <p className="text-zinc-500 text-sm max-w-sm mx-auto font-medium">Protect your investment. Upload your product data and receipts for secure tracking.</p>
          </div>
        )}

        {isLoading && (
          <div className="col-span-full py-24 text-center">
            <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-6" />
            <p className="text-zinc-500 font-black uppercase tracking-widest text-xs">Syncing Asset Registry...</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-[var(--card)] border border-[var(--border)] rounded-[3rem] p-6 md:p-10 w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600" />
              <h3 className="text-3xl font-black text-white mb-2 tracking-tight">Asset Protection</h3>
              <p className="text-zinc-500 text-sm font-medium mb-8">Register your product details for secure warranty monitoring.</p>
              
              <form onSubmit={handleAddSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Product Descriptor</label>
                  <input required type="text" value={formData.productName} onChange={e => setFormData({...formData, productName: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium" placeholder="MacBook Pro, Sony A7IV, etc." />
                </div>
                
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Asset Value (₹)</label>
                      <input type="number" step="1" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium" placeholder="0" />
                    </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Acquisition Date</label>
                    <input required type="date" value={formData.purchaseDate} onChange={e => setFormData({...formData, purchaseDate: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Warranty Termination Date</label>
                  <input required type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Visual Receipt (Encrypted Upload)</label>
                  <div className="border-2 border-dashed border-white/5 rounded-2xl p-8 text-center hover:border-blue-500/40 transition-all bg-black/40 cursor-pointer group/upload relative">
                    <input type="file" accept="image/*,.pdf" onChange={e => setFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center group-hover/upload:bg-blue-500/10 transition-colors">
                        <ExternalLink className="w-5 h-5 text-zinc-600 group-hover/upload:text-blue-500" />
                      </div>
                      <p className="text-xs font-black uppercase tracking-widest text-zinc-600 group-hover/upload:text-white transition-colors">
                        {file ? file.name : "Select Document"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all">Cancel</button>
                  <button type="submit" disabled={isUploading} className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex justify-center items-center">
                    {isUploading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Protect Asset'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
