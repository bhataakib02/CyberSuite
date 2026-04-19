"use client";

import { useState, useEffect } from 'react';
import { 
  UserCog, 
  ShieldAlert, 
  History, 
  Search, 
  Filter, 
  ShieldCheck, 
  Zap, 
  Lock, 
  Clock,
  ArrowRight,
  Database,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminLogs = async () => {
      try {
        const res = await apiFetch('/admin/audit-logs?action=ADMIN'); // Assuming filtering works
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminLogs();
  }, []);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
              <UserCog className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Admin <span className="text-zinc-600">Activity</span></h1>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1 pl-0.5">Privileged Signal Monitoring • Governance Override Logs</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-zinc-900/40 p-4 rounded-2xl border border-white/5">
           <ShieldCheck className="w-5 h-5 text-emerald-500" />
           <div>
             <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest leading-none">Status</p>
             <p className="text-[10px] font-black text-white uppercase mt-1 italic">Governance Active</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         <div className="lg:col-span-1 space-y-6">
            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl">
               <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6">Sector Filter</h3>
               <div className="space-y-2">
                 <FilterBtn label="All Overrides" active />
                 <FilterBtn label="Policy Mutations" />
                 <FilterBtn label="Identity Blocks" />
                 <FilterBtn label="Health Restarts" />
                 <FilterBtn label="Key Rotations" />
               </div>
            </div>
         </div>

         <div className="lg:col-span-3 space-y-4">
            <div className="bg-zinc-900/40 border border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-xl">
               <div className="p-8 border-b border-white/5 bg-black/20 flex justify-between items-center">
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Privileged Event Stream</span>
                 <p className="text-[9px] font-black text-zinc-600 uppercase tabular-nums">Total Records: {logs.length}</p>
               </div>

               <div className="divide-y divide-white/5">
                  {logs.map((log, idx) => (
                    <motion.div 
                      key={log.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-8 hover:bg-white/[0.02] transition-all group"
                    >
                      <div className="flex flex-col lg:flex-row gap-8 lg:items-center">
                         <div className="lg:w-[200px] flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 border border-purple-500/20">
                               <ShieldAlert className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                               <p className="text-xs font-black text-white uppercase italic truncate">Admin Override</p>
                               <p className="text-[9px] font-black text-zinc-600 uppercase tabular-nums">{new Date(log.createdAt).toLocaleTimeString()}</p>
                            </div>
                         </div>
                         
                         <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                               <span className="px-2 py-0.5 bg-zinc-800 text-zinc-500 text-[8px] font-black uppercase rounded border border-white/5 tracking-widest">{log.action}</span>
                            </div>
                            <p className="text-zinc-400 text-sm font-bold tracking-tight">{log.details}</p>
                         </div>

                         <div className="lg:w-[150px] text-right">
                            <p className="text-[10px] font-black text-zinc-600 uppercase mb-1">Executor</p>
                            <p className="text-[11px] font-black text-white uppercase truncate">{log.user?.email.split('@')[0] || 'SYSTEM'}</p>
                         </div>
                      </div>
                    </motion.div>
                  ))}
                  {logs.length === 0 && !loading && (
                    <div className="p-20 text-center space-y-4">
                       <History className="w-12 h-12 text-zinc-800 mx-auto" />
                       <p className="text-zinc-600 font-black uppercase text-[10px] tracking-widest">No privileged actions recorded in the last 24H</p>
                    </div>
                  )}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function FilterBtn({ label, active }: any) {
  return (
    <button className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
      active ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/20' : 'bg-black/20 border-white/5 text-zinc-500 hover:bg-white/5'
    }`}>
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      <ArrowRight className={`w-3.5 h-3.5 transition-transform ${active ? 'translate-x-0' : '-translate-x-2 opacity-0'}`} />
    </button>
  );
}
