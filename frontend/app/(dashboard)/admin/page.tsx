"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  Users, 
  Database, 
  Activity, 
  Clock, 
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Lock,
  Server,
  Cpu,
  RefreshCcw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  MoreVertical
} from 'lucide-react';
import { apiFetch } from '../../../lib/api';
import { useAuthStore } from '../../../store/useAuthStore';
import { useRouter } from 'next/navigation';
import { getSocket } from '../../../lib/socket';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [isAuditLoading, setIsAuditLoading] = useState(false);

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    const fetchData = async () => {
      try {
        const [statsRes, usersRes, pendingRes, healthRes] = await Promise.all([
          apiFetch('/admin/stats'),
          apiFetch('/admin/users'),
          apiFetch('/admin/pending-verifications'),
          apiFetch('/admin/system-health')
        ]);
        
        if (statsRes.ok && usersRes.ok && pendingRes.ok && healthRes.ok) {
          const statsData = await statsRes.json();
          const usersData = await usersRes.json();
          const pendingData = await pendingRes.json();
          const healthData = await healthRes.json();
          
          setStats(statsData);
          setUsers(usersData.users);
          setPendingVerifications(pendingData.pending);
          setHealth(healthData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    fetchAuditLogs(1);

    const socket = getSocket();
    if (socket) {
      socket.on('admin:threat', (newThreat: any) => {
        setStats((prev: any) => ({
          ...prev,
          recentThreats: [newThreat, ...(prev?.recentThreats || [])].slice(0, 10)
        }));
      });
    }

    const healthInterval = setInterval(async () => {
      const res = await apiFetch('/admin/system-health');
      if (res.ok) setHealth(await res.json());
    }, 5000);

    return () => clearInterval(healthInterval);
  }, [user, router]);

  const fetchAuditLogs = async (page: number) => {
    setIsAuditLoading(true);
    try {
      const res = await apiFetch(`/admin/audit-logs?page=${page}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs);
        setAuditTotalPages(data.pagination.totalPages);
        setAuditPage(page);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAuditLoading(false);
    }
  };

  const handleVerify = async (id: string, status: 'APPROVE' | 'REJECT') => {
    try {
      const res = await apiFetch(`/admin/verify-professional/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setPendingVerifications(prev => prev.filter(v => v.id !== id));
      }
    } catch (err) {
      alert('Verification failed');
    }
  };

  const handleBlockUser = async (id: string) => {
    try {
      const res = await apiFetch(`/admin/users/${id}/block`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setUsers(users.map(u => u.id === id ? { ...u, isActive: data.isActive } : u));
        if (selectedUser?.id === id) setSelectedUser({ ...selectedUser, isActive: data.isActive });
      }
    } catch (err) {
      alert('Update failed');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading || !stats) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <RefreshCcw className="w-10 h-10 text-blue-500 animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Accessing Intelligence Core...</p>
    </div>
  );

  return (
    <div className="space-y-12 pb-20">
      {/* Enterprise Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
              <ShieldAlert className="w-6 h-6 text-red-500" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Intelligence <span className="text-zinc-500">Center</span></h1>
          </div>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] pl-1">Tier-1 Administrative Access • Zero-Knowledge Verified</p>
        </div>

        {/* System Health Indicators */}
        <div className="flex items-center gap-4 bg-black/40 border border-white/5 p-4 rounded-2xl backdrop-blur-md">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Cpu className="w-3 h-3 text-emerald-500" />
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-tighter">CPU Load</span>
            </div>
            <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div 
                animate={{ width: `${health?.cpu || 0}%` }}
                className="h-full bg-emerald-500" 
              />
            </div>
          </div>
          <div className="h-8 w-px bg-white/5" />
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Server className="w-3 h-3 text-blue-500" />
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-tighter">API Latency</span>
            </div>
            <p className="text-xs font-black text-white">{health?.latency}ms</p>
          </div>
          <div className="h-8 w-px bg-white/5" />
          <div className="flex items-center gap-2 px-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Live</span>
          </div>
        </div>
      </header>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Operators', value: stats.totalUsers, icon: Users, color: 'text-blue-500', trend: '+12% Monthly' },
          { label: 'Secure Objects', value: stats.totalVaultEntries, icon: Database, color: 'text-purple-500', trend: '99.9% Sync' },
          { label: 'Active Sessions', value: stats.activeSessions, icon: Activity, color: 'text-emerald-500', trend: 'Geo-Optimized' },
          { label: 'Breach Scans', value: stats.breachChecks, icon: ShieldCheck, color: 'text-blue-400', trend: 'Global k-Anonymity' },
        ].map((s, idx) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden group hover:border-white/10 transition-colors"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <s.icon className={`w-16 h-16 ${s.color}`} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">{s.label}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-5xl font-black text-white tracking-tighter">{s.value}</p>
              <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">{s.trend}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Threat Monitor & Institutional Approvals */}
        <div className="lg:col-span-8 space-y-10">
          {/* Live Threat Monitor */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Security Intelligence Feed
              </h2>
              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest bg-white/5 px-4 py-1.5 rounded-full border border-white/5">Auto-Mitigation Active</span>
            </div>

            <div className="bg-black/40 backdrop-blur-2xl border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
              <div className="p-1">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5">
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500">Operator Instance</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500">Anomaly Type</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {stats.recentThreats.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-8 py-16 text-center text-zinc-600 font-bold uppercase text-[10px] tracking-[0.2em]">All sectors clear • No anomalies detected</td>
                      </tr>
                    ) : stats.recentThreats.map((log: any) => (
                      <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] font-black border border-white/5">
                              {log.user.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-black text-white tracking-tight">{log.user.name}</p>
                              <p className="text-[10px] text-zinc-600 font-bold uppercase">{log.user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`px-4 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                            log.action === 'BREACH_FOUND' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                            log.action === 'LOGIN_FAILURE' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                          }`}>
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <p className="text-[10px] font-black text-zinc-500 tabular-nums uppercase tracking-tight">
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </p>
                          <p className="text-[9px] text-zinc-700 font-bold uppercase">{new Date(log.createdAt).toLocaleDateString()}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Institutional Approvals */}
          <section className="space-y-6 pt-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                Institutional Verification
              </h2>
              <div className="flex gap-2">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-lg">Board Certified</span>
              </div>
            </div>

            <div className="bg-black/40 backdrop-blur-2xl border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
              <div className="p-1">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5">
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500">Institutional Identity</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500">Accreditation</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {pendingVerifications.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-8 py-16 text-center text-zinc-600 font-bold uppercase text-[10px] tracking-[0.2em]">Zero-Trust: All credentials verified</td>
                      </tr>
                    ) : pendingVerifications.map((v: any) => (
                      <tr key={v.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-8 py-5">
                          <p className="text-sm font-black text-white tracking-tight">{v.user.name}</p>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase">{v.user.email}</p>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter">{v.type} • {v.specialization}</span>
                            <span className="text-[9px] text-zinc-600 font-bold uppercase">{v.qualification}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-3">
                            <button 
                              onClick={() => handleVerify(v.id, 'REJECT')}
                              className="px-4 py-2 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-widest rounded-xl border border-red-500/10 transition-all"
                            >
                              Deny
                            </button>
                            <button 
                              onClick={() => handleVerify(v.id, 'APPROVE')}
                              className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase tracking-widest rounded-xl border border-emerald-500/20 transition-all"
                            >
                              Authorize
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

        {/* Global Directory Sidebar */}
        <div className="lg:col-span-4 space-y-10">
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-500" />
                Global Directory
              </h2>
            </div>
            
            <div className="relative group mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-hover:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search operator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-white placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredUsers.map((u) => (
                <motion.div 
                  layout
                  key={u.id} 
                  className="bg-zinc-900/40 border border-white/5 p-5 rounded-[2rem] flex items-center gap-4 hover:border-blue-500/30 transition-all group relative overflow-hidden"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center font-black text-white border border-white/5 shadow-2xl">
                    {u.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white truncate tracking-tight">{u.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter">{u.role}</span>
                      <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                      <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-tighter">{u._count.vaultEntries} Objects</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setSelectedUser(u); setIsUserModalOpen(true); }}
                    className="p-3 bg-white/5 hover:bg-blue-500/10 text-zinc-700 hover:text-blue-500 rounded-xl transition-all border border-transparent hover:border-blue-500/20"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
              {filteredUsers.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-700">No operators found in directory</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Audit Logs Section */}
      <section className="space-y-8 pt-10 border-t border-white/5">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
            <Clock className="w-5 h-5 text-purple-500" />
            Immutable Audit Registry
          </h2>
          <div className="flex gap-2">
            <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/5">
              <Filter className="w-4 h-4 text-zinc-500" />
            </button>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-2xl border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
          <div className="p-1">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/5">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500">Operator Instance</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500">Operation</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500">Intelligence Details</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">Sequence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isAuditLoading ? (
                  <tr><td colSpan={4} className="px-8 py-16 text-center text-zinc-600 font-bold uppercase text-[10px] tracking-[0.2em] animate-pulse">Synchronizing Logs...</td></tr>
                ) : auditLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-8 py-5">
                      <p className="text-sm font-black text-white tracking-tight">{log.user?.name || 'SYSTEM CORE'}</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tabular-nums">{log.user?.email || 'INTERNAL'}</p>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-4 py-1.5 bg-zinc-800 text-[9px] font-black uppercase tracking-widest text-zinc-400 rounded-xl border border-white/5">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-xs text-zinc-400 font-bold leading-relaxed max-w-xs">{log.details}</p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <p className="text-[10px] font-black text-zinc-500 tabular-nums uppercase">{new Date(log.createdAt).toLocaleTimeString()}</p>
                      <p className="text-[9px] text-zinc-700 font-bold uppercase">{new Date(log.createdAt).toLocaleDateString()}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between p-8 border-t border-white/5 bg-white/5">
            <button 
              disabled={auditPage === 1} 
              onClick={() => fetchAuditLogs(auditPage - 1)}
              className="px-6 py-3 bg-black hover:bg-zinc-900 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-white/10"
            >
              Previous Block
            </button>
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">
              Fragment {auditPage} of {auditTotalPages}
            </span>
            <button 
              disabled={auditPage === auditTotalPages} 
              onClick={() => fetchAuditLogs(auditPage + 1)}
              className="px-6 py-3 bg-black hover:bg-zinc-900 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-white/10"
            >
              Next Block
            </button>
          </div>
        </div>
      </section>

      {/* User Management Modal */}
      <AnimatePresence>
        {isUserModalOpen && selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl" 
              onClick={() => setIsUserModalOpen(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-zinc-900 border border-white/10 p-10 rounded-[3rem] w-full max-w-xl shadow-[0_30px_100px_rgba(0,0,0,1)] overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600" />
              
              <div className="flex items-center gap-6 mb-10">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-3xl font-black text-white shadow-2xl rotate-3">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white tracking-tighter mb-1 uppercase">{selectedUser.name}</h3>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-black rounded-lg uppercase tracking-widest">{selectedUser.role}</span>
                    <span className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest ${selectedUser.isActive !== false ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {selectedUser.isActive !== false ? 'Active Status' : 'System Blocked'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-10">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-1">Electronic Mail</p>
                    <p className="text-white font-bold tracking-tight">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-1">Registration Date</p>
                    <p className="text-zinc-400 font-bold tracking-tight">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-2">Security Assets</p>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-zinc-600 uppercase">Vault Objects</span>
                        <span className="text-white">{selectedUser._count.vaultEntries}</span>
                      </div>
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-zinc-600 uppercase">Medical Records</span>
                        <span className="text-white">{selectedUser._count.medicalRecords}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <button 
                    onClick={() => handleBlockUser(selectedUser.id)}
                    className={`flex-1 py-4 font-black uppercase tracking-widest text-[11px] rounded-2xl transition-all border ${
                      selectedUser.isActive !== false 
                        ? 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20' 
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/20'
                    }`}
                  >
                    {selectedUser.isActive !== false ? 'Terminate Access' : 'Restore Authorization'}
                  </button>
                  <button className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[11px] rounded-2xl border border-white/10 transition-all">
                    Reset Protocol
                  </button>
                </div>
                <button 
                  onClick={() => setIsUserModalOpen(false)}
                  className="w-full py-4 text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
                >
                  Exit Operator View
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
