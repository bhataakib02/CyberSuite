"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Globe, 
  Bot, 
  AlertTriangle,
  PlayCircle,
  Settings2,
  Activity,
  ArrowRight,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { apiFetch } from '../../../../lib/api';

export default function AutomationDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await apiFetch('/admin/protocols');
      if (res.ok) setStats(await res.json());
    } catch (err) {
      console.error('Failed to fetch protocol stats', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutoMitigation = async () => {
    setToggling(true);
    try {
      const res = await apiFetch('/admin/soc/stats/auto-mitigation', { // I'll add this endpoint
        method: 'POST',
        body: JSON.stringify({ enabled: !stats?.autoMitigation })
      });
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (err) {
      alert('Failed to toggle auto-mitigation');
    } finally {
      setToggling(false);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse uppercase tracking-[0.3em] font-black text-zinc-600">Initializing Cyber-Logic...</div>;

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">Active <span className="text-zinc-700">Defense</span></h1>
          <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-xs">Autonomous Mitigation & Response Playbooks</p>
        </div>

        <div className={`p-1 pr-6 rounded-full flex items-center gap-4 transition-all ${stats?.autoMitigation ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
           <button 
             onClick={handleToggleAutoMitigation}
             disabled={toggling}
             className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-2xl ${stats?.autoMitigation ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-red-500 text-white shadow-red-500/20'}`}
           >
              {toggling ? <Activity className="animate-spin" /> : <Zap className={stats?.autoMitigation ? 'fill-white' : ''} />}
           </button>
           <div className="flex flex-col">
              <span className={`text-[10px] font-black uppercase tracking-widest ${stats?.autoMitigation ? 'text-emerald-500' : 'text-red-500'}`}>
                {stats?.autoMitigation ? 'ACTIVE MITIGATION: ENGAGED' : 'ACTIVE MITIGATION: STANDBY'}
              </span>
              <span className="text-[9px] font-bold text-zinc-500 uppercase italic">CyberSuite-Logic Cluster v1.4</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <h3 className="text-xl font-black text-zinc-500 uppercase tracking-widest pl-2">Configured Playbooks</h3>
          
          <PlaybookCard 
            title="Honeypot Decoy Trap" 
            desc="Detects requests to shadow paths (/.env, /wp-admin) and performs instant IP mitigation."
            trigger="Any shadow path hit"
            action="Block Source IP + Sentinel Critical Alert"
            active={true}
            icon={Bot}
            color="red"
          />

          <PlaybookCard 
            title="Bruteforce Neutralizer" 
            desc="Monitors login attempts and blocks sources exceeding the fail threshold."
            trigger="5 failed logins / 15 mins"
            action="Global IP Block (1 hour)"
            active={true}
            icon={Flame}
            color="orange"
          />

          <PlaybookCard 
            title="Impossible Travel Check" 
            desc="Analyzes geo-vector delta between successive logins to detect credential compromise."
            trigger="Distinct IPs / 1 hour"
            action="Revoke Sessions + Priority Sentinel Alert"
            active={true}
            icon={Globe}
            color="blue"
          />

          <PlaybookCard 
            title="Credential Stuffing Prevention" 
            desc="Detects many different usernames attempted from a single source."
            trigger="3 unique users / 10 mins"
            action="Block IP + Admin Notify"
            active={false}
            icon={ShieldAlert}
            color="zinc"
          />
        </div>

        <div className="space-y-8">
          <h3 className="text-xl font-black text-zinc-500 uppercase tracking-widest pl-2">System Logic</h3>
          <div className="bg-zinc-900/40 border border-white/5 p-10 rounded-[2.5rem] backdrop-blur-xl space-y-8">
             <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0 border border-blue-500/20">
                   <Settings2 className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                   <h4 className="text-white font-black uppercase tracking-tight text-md mb-2">Heuristic Confidence</h4>
                   <p className="text-zinc-500 text-xs leading-relaxed">Playbooks trigger only when Sentinel's confidence score exceeds 92%.</p>
                </div>
             </div>

             <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center shrink-0 border border-purple-500/20">
                   <Lock className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                   <h4 className="text-white font-black uppercase tracking-tight text-md mb-2">Audit Traceability</h4>
                   <p className="text-zinc-500 text-xs leading-relaxed">All automated actions are logged under the SYSTEM identifier for forensic review.</p>
                </div>
             </div>

             <div className="pt-6 border-t border-white/5">
                <div className="bg-black/40 p-6 rounded-2xl border border-white/5">
                   <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black text-zinc-500 uppercase">Model Version</span>
                      <span className="text-[10px] font-black text-white uppercase italic">Sentinel-v2-AI</span>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-zinc-500 uppercase">Training Data</span>
                      <span className="text-[10px] font-black text-white uppercase italic">8.4M Samples</span>
                   </div>
                </div>
             </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:rotate-12 transition-transform">
                <ShieldCheck className="w-24 h-24 text-white" />
             </div>
             <div className="relative z-10 space-y-6">
                <h4 className="text-white font-black text-2xl uppercase italic tracking-tighter leading-none">Security <br />Posture: Optimal</h4>
                <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Autonomous defense systems are protecting 14,209 assets across the network.</p>
                <button className="px-6 py-3 bg-white text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">View Defense Report</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlaybookCard({ title, desc, trigger, action, active, icon: Icon, color }: any) {
  const colors: any = {
    red: 'border-red-500/20 hover:border-red-500/40 bg-red-500/5',
    orange: 'border-orange-500/20 hover:border-orange-500/40 bg-orange-500/5',
    blue: 'border-blue-500/20 hover:border-blue-500/40 bg-blue-500/5',
    zinc: 'border-zinc-500/20 hover:border-zinc-500/40 bg-zinc-500/5 grayscale opacity-50',
  };

  const iconColors: any = {
    red: 'bg-red-500 text-white shadow-red-500/20',
    orange: 'bg-orange-500 text-white shadow-orange-500/20',
    blue: 'bg-blue-500 text-white shadow-blue-500/20',
    zinc: 'bg-zinc-500 text-white shadow-zinc-500/20',
  };

  return (
    <div className={`p-8 rounded-[2.5rem] border backdrop-blur-xl transition-all group ${colors[color]}`}>
      <div className="flex flex-col md:flex-row gap-8">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl ${iconColors[color]}`}>
           <Icon className="w-8 h-8" />
        </div>
        <div className="flex-1 space-y-6">
           <div className="flex items-center justify-between">
              <h4 className="text-2xl font-black text-white italic tracking-tighter uppercase">{title}</h4>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${active ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500' : 'border-zinc-500/20 bg-zinc-500/10 text-zinc-500'}`}>
                 <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-500'}`} />
                 <span className="text-[9px] font-black uppercase tracking-widest">{active ? 'Live' : 'Inactive'}</span>
              </div>
           </div>
           <p className="text-zinc-400 font-medium text-sm leading-relaxed">{desc}</p>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black/40 p-5 rounded-2xl border border-white/5 space-y-2">
                 <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Trigger Condition</span>
                 <p className="text-white text-xs font-bold uppercase">{trigger}</p>
              </div>
              <div className="bg-black/40 p-5 rounded-2xl border border-white/5 space-y-2">
                 <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Auto-Response</span>
                 <p className="text-white text-xs font-bold uppercase">{action}</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
