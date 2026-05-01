"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Lock, 
  Activity,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  Key,
  UserCheck,
  Zap,
  RefreshCw,
  Globe,
  Plus,
  ArrowRight,
  Fingerprint,
  Heart,
  Stethoscope,
  GraduationCap,
  Briefcase,
  FileText,
  Calendar,
  Search,
  BookOpen,
  Scale
} from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { apiFetch } from '../../../lib/api';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Stats {
  vaultCount: number;
  messageCount: number;
  warrantyCount: number;
  identityCount: number;
  activityCount: number;
  securityScore: number;
  activeBreaches: number;
  weakPasswords: number;
  expiringWarranties: number;
}

export default function DashboardOverview() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'CORE' | 'PROFESSIONAL'>('CORE');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, logsRes] = await Promise.all([
          apiFetch('/auth/stats'),
          apiFetch('/auth/activity')
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (logsRes.ok) setLogs((await logsRes.json()).logs || []);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const getRoleBranding = () => {
    switch (user?.role || 'USER') {
      case 'ADMIN': return { title: 'Intelligence', span: 'Monitor', icon: ShieldAlert, color: 'blue' };
      case 'MEDICAL': return { title: 'Clinical', span: 'Command', icon: Stethoscope, color: 'emerald' };
      case 'PROFESSIONAL': return { title: 'Jurisdictional', span: 'Vault', icon: Scale, color: 'amber' };
      case 'PATIENT': return { title: 'Life', span: 'Protocol', icon: Heart, color: 'red' };
      case 'USER': 
        return { title: 'Command', span: 'Center', icon: Fingerprint, color: 'blue' };
      case 'STUDENT':
        return { title: 'Scholar', span: 'Toolkit', icon: GraduationCap, color: 'purple' };
      case 'ACADEMIC':
        return { title: 'Academic', span: 'Node', icon: BookOpen, color: 'indigo' };
      default: return { title: 'Command', span: 'Center', icon: Fingerprint, color: 'blue' };
    }
  };

  const branding = getRoleBranding();

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 bg-${branding.color}-500/10 rounded-2xl flex items-center justify-center border border-${branding.color}-500/20`}>
              <branding.icon className={`w-7 h-7 text-${branding.color}-500`} />
            </div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-black text-white tracking-tighter uppercase"
            >
              {branding.title} <span className={`text-${branding.color}-500`}>{branding.span}</span>
            </motion.h1>
          </div>
          <p className="text-zinc-500 text-lg font-bold uppercase tracking-widest pl-1">
            Status: <span className="text-emerald-500">Optimal</span> • Role: <span className="text-white">{user?.role || 'USER'}</span>
          </p>
        </div>

        {/* Role Switcher - Hidden for generic USER */}
        {user?.role !== 'USER' && (
          <div className="flex bg-zinc-900/50 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl">
            <button 
              onClick={() => setActiveTab('CORE')}
              className={`px-6 py-2.5 rounded-xl text-xs md:text-sm font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 ${activeTab === 'CORE' ? 'bg-white/10 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {user?.role === 'ADMIN' ? 'Global Status' : 'Core Personal'}
            </button>
            <button 
              onClick={() => setActiveTab('PROFESSIONAL')}
              className={`px-6 py-2.5 rounded-xl text-xs md:text-sm font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 ${activeTab === 'PROFESSIONAL' ? (user?.role === 'ADMIN' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20') : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {user?.role === 'ADMIN' ? 'System Intel' : 'Professional Mode'}
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        {activeTab === 'CORE' ? (
          <motion.div 
            key="core"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-12"
          >
            {/* Standard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Security Score', value: `${stats?.securityScore || 0}%`, icon: Activity, color: 'emerald', desc: 'Overall Integrity' },
                { label: 'Active Leaks', value: stats?.activeBreaches || 0, icon: Globe, color: 'red', desc: 'Privacy Alerts' },
                { label: 'Vault Objects', value: stats?.vaultCount || 0, icon: Lock, color: 'blue', desc: 'Encrypted Records' },
                { label: 'Cloud Footprint', value: 'Verified', icon: Fingerprint, color: 'purple', desc: 'Zero-Knowledge Sync' },
              ].map((s, i) => (
                <div key={s.label} className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-white/10 hover:scale-[1.02] transition-all cursor-default">
                  <s.icon className={`absolute -right-4 -top-4 w-24 h-24 text-${s.color}-500 opacity-5 group-hover:opacity-10 transition-opacity`} />
                  <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">{s.label}</p>
                  <p className="text-4xl font-black text-white tracking-tighter">{s.value}</p>
                  <p className="text-xs text-zinc-600 font-bold uppercase mt-2">{s.desc}</p>
                </div>
              ))}
            </div>

            {/* Core Feed and Quick Deployment */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8 space-y-8 min-w-0">
                <div className="bg-zinc-900/40 border border-white/5 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
                   <div className="flex items-center justify-between mb-8">
                     <h2 className="text-2xl font-black text-white tracking-tight">Security Handshakes & Hardware</h2>
                     <button 
                       onClick={async () => {
                         try {
                           // 1. Get options from server
                           const optionsRes = await apiFetch('/auth/register-options');
                           const options = await optionsRes.json();
                           if (!optionsRes.ok) throw new Error(options.error || 'Failed to get options');

                           // 2. Start registration ceremony
                           const { startRegistration } = await import('@simplewebauthn/browser');
                           const attResp = await startRegistration(options);

                           // 3. Verify with server
                           const verifyRes = await apiFetch('/auth/register-verify', {
                             method: 'POST',
                             body: JSON.stringify({ body: attResp }),
                           });
                           const data = await verifyRes.json();
                           if (data.verified) {
                             alert('Security key registered successfully!');
                             window.location.reload();
                           } else {
                             throw new Error(data.error || 'Verification failed');
                           }
                         } catch (err: any) {
                           alert(err.message);
                         }
                       }}
                       className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2"
                     >
                       <Plus className="w-4 h-4" /> Add Security Key
                     </button>
                   </div>
                   <div className="space-y-4">
                     {logs.length > 0 ? logs.slice(0, 5).map((log, i) => (
                       <div key={log.id} className="flex items-center gap-6 p-5 bg-black/20 rounded-2xl border border-white/5">
                          <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 border border-white/5">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-black text-sm uppercase tracking-tight">{log.action}</p>
                            <p className="text-zinc-500 text-xs font-medium">{log.details}</p>
                          </div>
                          <p className="text-zinc-600 text-[10px] font-black tabular-nums">{new Date(log.createdAt).toLocaleTimeString()}</p>
                       </div>
                     )) : (
                       <div className="text-center py-10 text-zinc-600 font-bold uppercase tracking-widest text-xs">
                         No recent activity detected
                       </div>
                     )}
                   </div>
                </div>
              </div>
              <div className="lg:col-span-4 min-w-0">
                <div className="bg-blue-600 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden">
                  <Fingerprint className="w-12 h-12 text-white/30 mb-6" />
                  <h3 className="text-3xl font-black text-white leading-tight">Identity <br/>Vault</h3>
                  <div className="mt-8 space-y-3">
                    {['Password Manager', 'Digital ID Wallet', 'File Shield'].map(item => (
                      <button key={item} className="w-full p-4 bg-black/20 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest border border-white/10 text-left flex justify-between items-center group overflow-hidden">
                        <span className="truncate">{item}</span> <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-1 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="pro"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-12"
          >
            {/* Professional Role Widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8 space-y-8 min-w-0">
                {/* Role Specific Widget */}
                {user?.role === 'MEDICAL' || user?.role === 'DOCTOR' ? (
                  <div className="bg-zinc-900/40 border border-white/5 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
                    <div className="flex items-center justify-between mb-10">
                      <h2 className="text-3xl font-black text-white tracking-tight">Clinical Requests</h2>
                      <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-4 py-1.5 rounded-full uppercase">3 Pending</span>
                    </div>
                    <div className="space-y-4">
                      {['Sarah Connor - Brain MRI Review', 'John Miller - Neurological Consult', 'Ellen Ripley - Post-Op Follow-up'].map((req, i) => (
                        <div key={i} className="flex items-center justify-between p-6 bg-black/20 rounded-3xl border border-white/5 hover:border-emerald-500/30 transition-all">
                           <div className="flex items-center gap-5">
                             <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                               <UserCheck className="w-6 h-6" />
                             </div>
                             <div>
                               <p className="text-white font-black uppercase tracking-tight text-sm">{req.split(' - ')[0]}</p>
                               <p className="text-zinc-500 text-xs font-medium">{req.split(' - ')[1]}</p>
                             </div>
                           </div>
                           <button className="px-5 py-2.5 bg-emerald-500 text-black text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-400 transition-all">Open Records</button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : user?.role === 'PROFESSIONAL' || user?.role === 'LAWYER' ? (
                  <div className="bg-zinc-900/40 border border-white/5 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
                    <h2 className="text-3xl font-black text-white tracking-tight mb-8">Active Case Timeline</h2>
                    <div className="space-y-6">
                      {[
                        { time: '10:00 AM', event: 'Corporate Disclosure Review', party: 'CyberCorp Inc.' },
                        { time: '02:30 PM', event: 'Privacy Compliance Audit', party: 'VaultSecure Ltd.' },
                      ].map((item, i) => (
                        <div key={i} className="flex gap-6">
                          <div className="flex flex-col items-center">
                            <div className="w-2 h-2 bg-amber-500 rounded-full" />
                            <div className="w-px flex-1 bg-zinc-800 my-2" />
                          </div>
                          <div className="pb-6">
                            <p className="text-amber-500 text-[10px] font-black uppercase tracking-widest">{item.time}</p>
                            <p className="text-white font-black text-lg tracking-tight mt-1">{item.event}</p>
                            <p className="text-zinc-500 text-xs font-medium uppercase">{item.party}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : user?.role === 'STUDENT' || user?.role === 'ACADEMIC' ? (
                  <div className="bg-zinc-900/40 border border-white/5 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-purple-500" />
                    <h2 className="text-3xl font-black text-white tracking-tight mb-10">Scholar Toolkit</h2>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-black/40 p-6 rounded-[2.5rem] border border-white/5 hover:border-purple-500/30 transition-all">
                        <FileText className="w-10 h-10 text-purple-400 mb-4" />
                        <p className="text-white font-black uppercase text-sm">Research Papers</p>
                        <p className="text-zinc-600 text-[10px] font-bold mt-1">12 Encrypted Documents</p>
                      </div>
                      <div className="bg-black/40 p-6 rounded-[2.5rem] border border-white/5 hover:border-purple-500/30 transition-all">
                        <Calendar className="w-10 h-10 text-emerald-400 mb-4" />
                        <p className="text-white font-black uppercase text-sm">Exam Countdown</p>
                        <p className="text-zinc-600 text-[10px] font-bold mt-1">Advanced Cryptography - 4 Days</p>
                      </div>
                    </div>
                  </div>
                ) : user?.role === 'ADMIN' ? (
                  <div className="bg-zinc-900/40 border border-white/5 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-600" />
                    <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                      <div className="w-24 h-24 bg-red-600/10 rounded-3xl flex items-center justify-center border border-red-600/20 shrink-0">
                        <ShieldAlert className="w-12 h-12 text-red-500" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-3xl font-black text-white tracking-tight mb-2">Command & Control Active</h2>
                        <p className="text-zinc-400 font-medium mb-6">Tier-1 access verified. All monitoring sub-systems are online. Proceed to the dedicated Admin Intel core for global directory and incident management.</p>
                        <Link href="/admin" className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-600/20">
                          Enter Admin Core <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                   <div className="bg-zinc-900/40 border border-white/5 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden text-center py-32">
                      <Zap className="w-16 h-16 text-zinc-800 mx-auto mb-6" />
                      <h2 className="text-zinc-600 text-xs font-black uppercase tracking-[0.3em]">No specialized professional module detected for this identity.</h2>
                      <p className="text-zinc-700 text-[10px] font-bold mt-2 uppercase tracking-widest">Upgrade to Institutional Protocol for advanced capabilities.</p>
                   </div>
                )}
              </div>

              <div className="lg:col-span-4 space-y-8 min-w-0">
                 <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/5 rounded-[3rem] p-8 shadow-2xl">
                    <h3 className="text-white text-[10px] font-black uppercase tracking-[0.3em] mb-8">Role Verified ID</h3>
                    <div className="flex flex-col items-center">
                       <div className="w-40 h-40 bg-white p-4 rounded-3xl mb-6 shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                          {/* Mock QR */}
                          <div className="w-full h-full bg-black flex items-center justify-center">
                            <ShieldCheck className="w-16 h-16 text-white animate-pulse" />
                          </div>
                       </div>
                       <p className="text-white font-black uppercase tracking-widest text-xs">{user?.name}</p>
                       <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em] mt-1">{user?.role} • VERIFIED</p>
                       <button className="mt-8 w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest transition-all">Download Protocol ID</button>
                    </div>
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
