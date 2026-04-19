"use client";

import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Lock, 
  Settings, 
  ShieldAlert, 
  Plus, 
  Search, 
  Filter, 
  ChevronRight, 
  CheckCircle2, 
  XCircle,
  Key,
  Database,
  Globe,
  Fingerprint,
  Activity,
  UserCog
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';

const ROLES = [
  { id: 'ADMIN', label: 'Super Administrator', color: 'red', desc: 'Full system access and governance overrides.' },
  { id: 'DOCTOR', label: 'Medical Professional', color: 'blue', desc: 'Access to health records and secure consultations.' },
  { id: 'LAWYER', label: 'Legal Counsel', color: 'emerald', desc: 'Case management and secure document signing.' },
  { id: 'ACADEMIC', label: 'Research / Academic', color: 'purple', desc: 'Educational resource access and verification.' },
  { id: 'STUDENT', label: 'Student Profile', color: 'amber', desc: 'Limited education hub and vault access.' },
  { id: 'USER', label: 'Individual Citizen', color: 'zinc', desc: 'Standard platform features and identity vault.' },
];

const PERMISSIONS = [
  { id: 'p1', name: 'Identity Mutation', sector: 'IDENTITY', risk: 'CRITICAL' },
  { id: 'p2', name: 'Audit Log Deletion', sector: 'GOVERNANCE', risk: 'CRITICAL' },
  { id: 'p3', name: 'Financial Export', sector: 'FINANCE', risk: 'HIGH' },
  { id: 'p4', name: 'Medical Record Decryption', sector: 'HEALTH', risk: 'CRITICAL' },
  { id: 'p5', name: 'System Config Write', sector: 'INFRA', risk: 'HIGH' },
  { id: 'p6', name: 'User Provisioning', sector: 'ADMIN', risk: 'MEDIUM' },
];

export default function PermissionsPage() {
  const [activeRole, setActiveRole] = useState('ADMIN');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">RBAC <span className="text-zinc-600">Permissions</span></h1>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1 pl-0.5">Role-Based Access Control • Granular Governance Matrix</p>
            </div>
          </div>
        </div>

        <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95">
          <Plus className="w-4 h-4" />
          Define Custom Role
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-3">
           <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-1 mb-4">Platform Identities</p>
           {ROLES.map((role) => (
             <button key={role.id} onClick={() => setActiveRole(role.id)} className={`w-full p-6 rounded-[2rem] border transition-all text-left relative overflow-hidden group ${activeRole === role.id ? 'bg-zinc-900 border-white/10 shadow-2xl' : 'bg-black/20 border-white/[0.02] text-zinc-500 hover:border-white/5'}`}>
               <div className="flex items-center gap-4 relative z-10">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${activeRole === role.id ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-zinc-800 border-white/5'}`}>
                    <UserCog className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`text-xs font-black uppercase tracking-tight transition-colors ${activeRole === role.id ? 'text-white' : ''}`}>{role.id}</p>
                    <p className="text-[8px] font-bold text-zinc-600 uppercase mt-0.5">{role.label}</p>
                  </div>
               </div>
               {activeRole === role.id && (<motion.div layoutId="role-active" className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />)}
             </button>
           ))}
        </div>

        <div className="lg:col-span-3 space-y-8">
           <div className="bg-zinc-900/40 border border-white/5 rounded-[3rem] p-10 backdrop-blur-xl">
             <div className="flex flex-col md:flex-row justify-between gap-6 mb-12">
               <div className="space-y-1">
                 <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">{activeRole} <span className="text-zinc-600">Permissions</span></h2>
                 <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{ROLES.find(r => r.id === activeRole)?.desc}</p>
               </div>
               <div className="flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5 h-fit self-start">
                  <div className="text-right"><p className="text-[8px] font-black text-zinc-600 uppercase">Active Nodes</p><p className="text-sm font-black text-white tabular-nums italic">128</p></div>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500"><Users className="w-5 h-5" /></div>
               </div>
             </div>

             <div className="space-y-6">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-4">Capability Entitlements</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PERMISSIONS.map((p) => (
                    <div key={p.id} className="p-6 bg-black/40 rounded-[2rem] border border-white/5 group hover:border-emerald-500/30 transition-all">
                       <div className="flex items-center justify-between gap-6">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-600 group-hover:text-emerald-500 transition-colors"><Fingerprint className="w-5 h-5" /></div>
                             <div><p className="text-sm font-black text-white uppercase tracking-tight italic">{p.name}</p><p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">{p.sector}</p></div>
                          </div>
                          <div className="flex items-center gap-4">
                             <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase ${p.risk === 'CRITICAL' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>{p.risk} RISK</span>
                             <div className="w-10 h-5 bg-emerald-600/20 rounded-full border border-emerald-500/30 p-1 cursor-pointer"><div className="w-3 h-3 bg-emerald-500 rounded-full translate-x-5 shadow-[0_0_10px_rgba(16,185,129,0.5)]" /></div>
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
