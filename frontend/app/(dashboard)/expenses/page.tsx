"use client";

import { useState, useEffect } from 'react';
import { 
  Receipt, 
  Plus, 
  Search, 
  Filter, 
  TrendingUp, 
  CreditCard, 
  ShoppingBag, 
  Smartphone,
  Server,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../../lib/api';

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  createdAt: string;
}

const CATEGORIES = [
  { id: 'SOFTWARE', icon: Server, color: 'blue' },
  { id: 'HARDWARE', icon: Smartphone, color: 'purple' },
  { id: 'SERVICE', icon: CreditCard, color: 'emerald' },
  { id: 'SHOPPING', icon: ShoppingBag, color: 'amber' },
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await apiFetch('/auth/expenses'); // Re-using existing route if available, or I'll create a new one
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses || []);
      }
    } catch (err) {
      console.error('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  const filteredExpenses = expenses.filter(e => 
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-10 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
              <Receipt className="w-6 h-6 text-blue-500" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Expense <span className="text-zinc-500">Vault</span></h1>
          </div>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs pl-1">Secure Tracking • Institutional Overhead Management</p>
        </div>

        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Log Transaction
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <TrendingUp className="w-16 h-16 text-emerald-500" />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Total Expenditure</p>
          <p className="text-4xl font-black text-white tracking-tighter">${totalSpent.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-4 text-emerald-500 text-xs font-bold uppercase">
            <ArrowDownRight className="w-4 h-4" />
            <span>4.2% optimized this month</span>
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <Calendar className="w-16 h-16 text-blue-500" />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Average Monthly</p>
          <p className="text-4xl font-black text-white tracking-tighter">${(totalSpent / (expenses.length || 1)).toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-4 text-zinc-600 text-xs font-bold uppercase">
            <span>Aggregated across all nodes</span>
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <Filter className="w-16 h-16 text-purple-500" />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Active Categories</p>
          <p className="text-4xl font-black text-white tracking-tighter">{new Set(expenses.map(e => e.category)).size}</p>
          <div className="flex items-center gap-1 mt-4 text-purple-500 text-xs font-bold uppercase">
            <span>Resource allocation healthy</span>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-zinc-900/40 border border-white/5 rounded-[3rem] p-1 shadow-2xl relative overflow-hidden">
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">Audit <span className="text-zinc-500">History</span></h2>
          
          <div className="flex items-center bg-black/40 border border-white/10 rounded-2xl px-4 py-2 focus-within:border-blue-500/50 transition-all group w-full md:w-80">
            <Search className="w-4 h-4 text-zinc-600 group-focus-within:text-blue-500" />
            <input 
              type="text" 
              placeholder="Filter by title or node..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-bold uppercase tracking-widest text-white ml-3 w-full"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5">
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-zinc-500">Transaction Details</th>
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-zinc-500">Classification</th>
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-zinc-500">Amount</th>
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-zinc-500 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence>
                {filteredExpenses.map((expense) => {
                  const category = CATEGORIES.find(c => c.id === expense.category) || CATEGORIES[0];
                  return (
                    <motion.tr 
                      key={expense.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-white/5 transition-colors group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl bg-${category.color}-500/10 flex items-center justify-center border border-${category.color}-500/20`}>
                            <category.icon className={`w-5 h-5 text-${category.color}-500`} />
                          </div>
                          <p className="text-sm font-black text-white tracking-tight">{expense.title}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-${category.color}-500/10 text-${category.color}-500 border border-${category.color}-500/20`}>
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-base font-black text-white tabular-nums">${expense.amount.toFixed(2)}</p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <p className="text-xs font-black text-zinc-500 tabular-nums uppercase tracking-tight">
                          {new Date(expense.createdAt).toLocaleTimeString()}
                        </p>
                        <p className="text-[10px] text-zinc-700 font-bold uppercase">
                          {new Date(expense.createdAt).toLocaleDateString()}
                        </p>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>

              {filteredExpenses.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <p className="text-xs font-black text-zinc-600 uppercase tracking-[0.3em]">No historical data found in sector</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
