"use client";

import { useState } from 'react';
import { 
  Zap, 
  ToggleRight, 
  Settings2, 
  Users, 
  Globe, 
  Shield, 
  Search, 
  Plus, 
  Trash2,
  RefreshCw,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MOCK_FLAGS = [
  { id: '1', key: 'ai_threat_detection', name: 'AI Threat Detection v2', desc: 'Enable advanced neural signal analysis for all nodes', isEnabled: true, rollout: '100%', env: 'Production' },
  { id: '2', key: 'biometric_auth', name: 'Biometric MFA Support', desc: 'Allow WebAuthn based fingerprint/face recognition', isEnabled: true, rollout: '40%', env: 'Production' },
  { id: '3', key: 'quantum_encryption_vault', name: 'Post-Quantum Vault', desc: 'Experimental PQC algorithms for high-value secrets', isEnabled: false, rollout: '0%', env: 'Staging' },
  { id: '4', key: 'live_attack_map', name: 'Real-time Attack Map', desc: 'Visualize global threat vectors on dashboard', isEnabled: false, rollout: 'Internal Only', env: 'Development' },
];

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState(MOCK_FLAGS);

  const toggleFlag = (id: string) => {
    setFlags(prev => prev.map(f => f.id === id ? { ...f, isEnabled: !f.isEnabled } : f));
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
              <Zap className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Feature <span className="text-zinc-600">Controller</span></h1>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1 pl-0.5">Dynamic Capability Orchestration • Progressive Rollout Engine</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <Search className="w-4 h-4 text-zinc-600" />
            <input 
              type="text" 
              placeholder="Filter capability flags..."
              className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-white w-48"
            />
          </div>
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95">
            <Plus className="w-4 h-4" />
            New Flag
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2rem] flex items-center justify-between">
           <div>
             <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Active Capabilities</p>
             <p className="text-2xl font-black text-white italic tabular-nums">{flags.filter(f => f.isEnabled).length}</p>
           </div>
           <Zap className="w-8 h-8 text-blue-500 opacity-20" />
        </div>
        <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2rem] flex items-center justify-between">
           <div>
             <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Staging Flags</p>
             <p className="text-2xl font-black text-white italic tabular-nums">{flags.filter(f => f.env === 'Staging').length}</p>
           </div>
           <Settings2 className="w-8 h-8 text-purple-500 opacity-20" />
        </div>
        <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2rem] flex items-center justify-between">
           <div>
             <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Global Rollout</p>
             <p className="text-2xl font-black text-white italic tabular-nums">84%</p>
           </div>
           <Globe className="w-8 h-8 text-emerald-500 opacity-20" />
        </div>
      </div>

      <div className="bg-zinc-900/40 border border-white/5 rounded-[3rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black/20 border-b border-white/5">
                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Capability Feature</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Environment</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Rollout Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {flags.map((flag) => (
                <tr key={flag.id} className={`hover:bg-white/[0.02] transition-colors group ${!flag.isEnabled ? 'opacity-60' : ''}`}>
                  <td className="px-8 py-8">
                    <div className="flex items-center gap-4">
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                         flag.isEnabled ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-zinc-800 text-zinc-600 border-white/5'
                       }`}>
                         <ToggleRight className="w-5 h-5" />
                       </div>
                       <div>
                         <p className="text-sm font-black text-white uppercase tracking-tight italic">{flag.name}</p>
                         <p className="text-[10px] font-black text-zinc-600 uppercase tracking-tighter mt-0.5">{flag.key}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-8">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                      flag.env === 'Production' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                      flag.env === 'Staging' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                      'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}>
                      {flag.env}
                    </span>
                  </td>
                  <td className="px-8 py-8">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 max-w-[100px] h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500" 
                          style={{ width: flag.rollout.includes('%') ? flag.rollout : '0%' }} 
                        />
                      </div>
                      <span className="text-[10px] font-black text-zinc-500 uppercase">{flag.rollout}</span>
                    </div>
                  </td>
                  <td className="px-8 py-8 text-right">
                    <div className="flex items-center justify-end gap-4">
                       <button className="p-2 bg-white/5 border border-white/5 rounded-lg text-zinc-500 hover:text-white transition-all"><Settings2 className="w-4 h-4" /></button>
                       <div 
                        onClick={() => toggleFlag(flag.id)}
                        className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all ${flag.isEnabled ? 'bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-zinc-800'}`}
                       >
                         <div className={`w-4 h-4 bg-white rounded-full transition-transform ${flag.isEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                       </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-8 bg-blue-500/5 border border-blue-500/10 rounded-[3rem] flex items-center gap-6">
         <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shrink-0">
           <Info className="w-6 h-6 text-blue-500" />
         </div>
         <p className="text-xs font-bold text-zinc-400 leading-relaxed uppercase">
           Feature Flags allow you to enable/disable capabilities for specific user segments or environments without code deployment. Changes are propagated to all edge nodes in <span className="text-white font-black italic">&lt; 300ms</span>.
         </p>
      </div>
    </div>
  );
}
