"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  Plus, 
  Calendar, 
  DollarSign, 
  Trash2, 
  AlertCircle,
  TrendingUp,
  Filter,
  ArrowRight
} from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { apiFetch, ApiResponse } from '../../../lib/api';

interface Subscription {
  id: string;
  name: string;
  category: string;
  amount: number;
  currency: string;
  billingCycle: string;
  nextBilling: string;
  isAutoRenew: boolean;
  remindMe: boolean;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSub, setNewSub] = useState({
    name: '',
    category: 'Entertainment',
    amount: '',
    currency: 'USD',
    billingCycle: 'MONTHLY',
    nextBilling: '',
    isAutoRenew: true,
    remindMe: true
  });

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const res = await apiFetch('/subscriptions');
      const data: ApiResponse<{ subscriptions: Subscription[] }> = await res.json();
      if (res.ok && data.success && data.data) {
        setSubscriptions(data.data.subscriptions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/subscriptions', {
        method: 'POST',
        body: JSON.stringify(newSub),
      });
      const data: ApiResponse<Subscription> = await res.json();
      if (res.ok && data.success) {
        fetchSubscriptions();
        setIsAddModalOpen(false);
        setNewSub({
          name: '',
          category: 'Entertainment',
          amount: '',
          currency: 'USD',
          billingCycle: 'MONTHLY',
          nextBilling: '',
          isAutoRenew: true,
          remindMe: true
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const res = await apiFetch(`/subscriptions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSubscriptions(subscriptions.filter(s => s.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const calculateDaysLeft = (date: string) => {
    const diff = new Date(date).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  const totalMonthlySpend = subscriptions.reduce((acc, sub) => {
    const monthlyAmount = sub.billingCycle === 'YEARLY' ? sub.amount / 12 : sub.amount;
    return acc + monthlyAmount;
  }, 0);

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">Subscription Tracker</h1>
          <p className="text-zinc-500 font-medium tracking-wide">Monitor your digital overhead and recurring expenses.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-white text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-200 transition-all shadow-2xl shadow-white/10 flex items-center gap-3 active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Subscription
        </button>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/50 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-sm"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Monthly Burn Rate</p>
          </div>
          <p className="text-4xl font-black text-white">${totalMonthlySpend.toFixed(2)}</p>
          <p className="text-xs text-zinc-600 mt-2 font-bold uppercase tracking-widest">Average Monthly Spend</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900/50 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-sm"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CreditCard className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Active Services</p>
          </div>
          <p className="text-4xl font-black text-white">{subscriptions.length}</p>
          <p className="text-xs text-zinc-600 mt-2 font-bold uppercase tracking-widest">Paid Subscriptions</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-900/50 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-sm"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Upcoming Payments</p>
          </div>
          <p className="text-4xl font-black text-white">
            {subscriptions.filter(s => calculateDaysLeft(s.nextBilling) <= 7).length}
          </p>
          <p className="text-xs text-zinc-600 mt-2 font-bold uppercase tracking-widest">Due in next 7 days</p>
        </motion.div>
      </div>

      {/* Subscription List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center gap-4 opacity-50">
            <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest">Synchronizing Vault...</p>
          </div>
        ) : subscriptions.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {subscriptions.map((sub, idx) => {
              const daysLeft = calculateDaysLeft(sub.nextBilling);
              return (
                <motion.div 
                  key={sub.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2rem] hover:border-white/10 transition-all group flex flex-col md:flex-row md:items-center gap-6"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
                    <CreditCard className="w-8 h-8" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-black text-white tracking-tight">{sub.name}</h3>
                      <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-white/5">
                        {sub.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Next: {new Date(sub.nextBilling).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> {sub.amount} {sub.currency} / {sub.billingCycle}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-xl font-black mb-1 ${daysLeft <= 3 ? 'text-red-500' : 'text-white'}`}>
                      {daysLeft} days
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Left until billing</p>
                  </div>

                  <button 
                    onClick={() => handleDeleteSubscription(sub.id)}
                    className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="bg-zinc-900/50 border border-dashed border-white/10 rounded-[3rem] p-20 flex flex-col items-center text-center">
            <CreditCard className="w-16 h-16 text-zinc-800 mb-6" />
            <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-widest">No Subscriptions Tracked</h3>
            <p className="text-zinc-500 font-medium max-w-md">Add your recurring services here to never miss a payment and monitor your digital budget.</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-zinc-900 border border-white/10 w-full max-w-lg rounded-[3rem] p-10 relative z-10 shadow-2xl"
            >
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-8 text-center">New Subscription</h2>
              
              <form onSubmit={handleAddSubscription} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Service Name</label>
                  <input 
                    required
                    type="text"
                    value={newSub.name}
                    onChange={(e) => setNewSub({...newSub, name: e.target.value})}
                    placeholder="Netflix, Spotify, etc."
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Amount</label>
                    <input 
                      required
                      type="number"
                      step="0.01"
                      value={newSub.amount}
                      onChange={(e) => setNewSub({...newSub, amount: e.target.value})}
                      placeholder="9.99"
                      className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Currency</label>
                    <select 
                      value={newSub.currency}
                      onChange={(e) => setNewSub({...newSub, currency: e.target.value})}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium appearance-none"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="INR">INR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Billing Cycle</label>
                    <select 
                      value={newSub.billingCycle}
                      onChange={(e) => setNewSub({...newSub, billingCycle: e.target.value})}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium appearance-none"
                    >
                      <option value="MONTHLY">Monthly</option>
                      <option value="YEARLY">Yearly</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Next Billing</label>
                    <input 
                      required
                      type="date"
                      value={newSub.nextBilling}
                      onChange={(e) => setNewSub({...newSub, nextBilling: e.target.value})}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-6 bg-black/20 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-xs font-black text-white uppercase tracking-widest">Reminders</p>
                      <p className="text-[10px] text-zinc-600 font-medium">Alert me 3 days before</p>
                    </div>
                  </div>
                  <input 
                    type="checkbox"
                    checked={newSub.remindMe}
                    onChange={(e) => setNewSub({...newSub, remindMe: e.target.checked})}
                    className="w-5 h-5 rounded-lg border-white/10 bg-black/40 text-blue-500 focus:ring-0 focus:ring-offset-0 transition-all"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest py-4 rounded-2xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-white text-black font-black uppercase tracking-widest py-4 rounded-2xl hover:bg-zinc-200 transition-all shadow-xl shadow-white/10"
                  >
                    Track Subscription
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
