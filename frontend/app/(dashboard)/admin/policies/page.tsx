"use client";

import { useState, useEffect } from 'react';
import { 
  Lock, 
  Shield, 
  Globe, 
  Clock, 
  Smartphone, 
  UserCheck, 
  Zap, 
  Plus, 
  Settings2, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  AlertOctagon,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';

const POLICY_TEMPLATES = [
  { id: 'AUTH', icon: UserCheck, label: 'Auth Protocols', desc: 'Manage login thresholds & MFA enforcement' },
  { id: 'DATA', icon: Lock, label: 'Data Governance', desc: 'Define encryption & export limitations' },
  { id: 'ACCESS', icon: Globe, label: 'Network Access', desc: 'Geo-fencing & IP white/blacklisting' },
  { id: 'SESSIONS', icon: Clock, label: 'Session Lifecycle', desc: 'Timeouts & concurrent login limits' },
];

export default function PolicyEnginePage() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    // Mocking initial policies for demonstration
    setPolicies([
      { id: '1', name: 'Standard Brute Force Mitigation', type: 'AUTH', rules: { maxAttempts: 5, window: '10m' }, isActive: true },
      { id: '2', name: 'High-Value Export Limit', type: 'DATA', rules: { maxItems: 100, role: 'ADMIN' }, isActive: true },
      { id: '3', name: 'Restricted Geo-Access', type: 'ACCESS', rules: { allowed: ['US', 'IN', 'EU'] }, isActive: false },
    ]);
  }, []);

  const togglePolicy = (id: string) => {
    setPolicies(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
              <Lock className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Policy <span className="text-zinc-600">Engine</span></h1>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1 pl-0.5">Zero-Trust Governance • Security Protocol Orchestrator</p>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Deploy Protocol
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] pl-1 mb-4">Protocol Archetypes</p>
          {POLICY_TEMPLATES.map((t) => (
            <div key={t.id} className="p-5 bg-zinc-900/40 border border-white/5 rounded-2xl hover:border-blue-500/30 transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-all">
                  <t.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-tight">{t.label}</p>
                  <p className="text-[8px] font-bold text-zinc-600 uppercase mt-0.5">{t.desc}</p>
                </div>
              </div>
            </div>
          ))}
          
          <div className="mt-8 p-6 bg-blue-500/5 border border-blue-500/10 rounded-[2rem]">
            <div className="flex items-center gap-2 text-blue-400 mb-3">
              <Zap className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Active Engine</span>
            </div>
            <p className="text-[9px] text-zinc-500 font-bold leading-relaxed uppercase">The Policy Engine is currently enforcing 12 active protocols across 4 security sectors.</p>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between pl-1 mb-4">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Active Security Protocols</p>
            <div className="flex gap-2">
              <span className="text-[9px] font-black text-zinc-500 uppercase italic">Show:</span>
              <span className="text-[9px] font-black text-blue-500 uppercase italic cursor-pointer underline">All Sectors</span>
            </div>
          </div>

          <AnimatePresence>
            {policies.map((policy) => (
              <motion.div
                key={policy.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-8 rounded-[2.5rem] border backdrop-blur-xl transition-all relative overflow-hidden group ${
                  policy.isActive ? 'bg-zinc-900/40 border-white/5' : 'bg-black/20 border-white/[0.02] opacity-60'
                }`}
              >
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${
                      policy.isActive ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-zinc-800 text-zinc-600 border-white/5'
                    }`}>
                      <Shield className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-black text-white uppercase tracking-tight italic">{policy.name}</h3>
                        <span className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase border ${
                          policy.type === 'AUTH' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                        }`}>
                          {policy.type}
                        </span>
                      </div>
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest italic">{policy.isActive ? 'Protocol Active & Enforcing' : 'Protocol Deactivated'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div 
                      onClick={() => togglePolicy(policy.id)}
                      className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all ${policy.isActive ? 'bg-blue-600' : 'bg-zinc-800'}`}
                    >
                      <motion.div 
                        animate={{ x: policy.isActive ? 24 : 0 }}
                        className="w-4 h-4 bg-white rounded-full shadow-lg" 
                      />
                    </div>
                    <button className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-zinc-500 hover:text-white transition-all">
                      <Settings2 className="w-5 h-5" />
                    </button>
                    <button className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-zinc-500 hover:text-red-500 transition-all">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-white/5">
                   {Object.entries(policy.rules).map(([key, val]: any) => (
                     <div key={key} className="p-4 bg-black/40 rounded-2xl border border-white/5">
                       <p className="text-[8px] font-black text-zinc-600 uppercase mb-1 tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</p>
                       <p className="text-xs font-black text-white uppercase tabular-nums italic">
                         {Array.isArray(val) ? val.join(', ') : val}
                       </p>
                     </div>
                   ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isAdding && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            >
              <div className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-[3rem] p-10 shadow-2xl space-y-8">
                 <div className="flex justify-between items-start">
                   <div>
                     <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Provision <span className="text-zinc-600">Protocol</span></h2>
                     <p className="text-[10px] font-black text-zinc-500 uppercase mt-1 tracking-widest">Select Blueprint to Begin</p>
                   </div>
                   <button onClick={() => setIsAdding(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-zinc-500"><XCircle className="w-6 h-6" /></button>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                   {POLICY_TEMPLATES.map(t => (
                     <button key={t.id} className="p-6 bg-black/40 border border-white/5 rounded-3xl hover:border-blue-500/30 transition-all text-left group">
                       <t.icon className="w-6 h-6 text-zinc-600 group-hover:text-blue-500 mb-3 transition-colors" />
                       <p className="text-xs font-black text-white uppercase tracking-tight">{t.label}</p>
                     </button>
                   ))}
                 </div>

                 <button className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
                   Initialize Security Matrix
                 </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
