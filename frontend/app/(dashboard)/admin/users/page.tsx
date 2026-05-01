"use client";

import { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  LogOut, 
  Ban, 
  Key, 
  Activity,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Mail,
  Smartphone,
  Globe,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  lastActiveAt: string;
  riskLevel: string;
  _count: {
    vaultEntries: number;
    sessions: number;
  };
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await apiFetch(`/admin/users?page=${page}&search=${search}`);
      if (res.ok) {
        const d = await res.json();
        const data = d.data || d;
        setUsers(data.users || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const handleSearch = (e: any) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await apiFetch(`/admin/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !currentStatus })
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const forceLogout = async (id: string) => {
    if (!confirm('Force logout this user from all devices?')) return;
    try {
      const res = await apiFetch(`/admin/users/${id}/force-logout`, {
        method: 'POST'
      });
      if (res.ok) {
        alert('All sessions terminated');
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetPassword = async (id: string) => {
    if (!confirm('Send password reset email to this user?')) return;
    try {
      const res = await apiFetch(`/admin/users/${id}/reset-password`, {
        method: 'POST'
      });
      if (res.ok) alert('Reset instructions sent');
    } catch (err) {
      console.error(err);
    }
  };

  const viewDetails = async (user: User) => {
    setSelectedUser(user);
    setIsDetailsOpen(true);
    // Fetch full details
    try {
      const res = await apiFetch(`/admin/users/${user.id}`);
      if (res.ok) {
        const d = await res.json();
        const data = d.data || d;
        setSelectedUser(data.user);
      }
    } catch (err) {
      console.error('Failed to fetch full user details');
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Identity <span className="text-zinc-600">Registrar</span></h1>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1 pl-0.5">User Lifecycle Management • Access Control Center</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 flex items-center gap-2 focus-within:border-blue-500/50 transition-all">
            <Search className="w-4 h-4 text-zinc-600" />
            <input 
              type="text" 
              placeholder="Search by identity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-white w-64"
            />
          </form>
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95">
            <UserPlus className="w-4 h-4" />
            Provision Node
          </button>
        </div>
      </div>

      <div className="bg-zinc-900/40 border border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black/20 border-b border-white/5">
                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Identity Details</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Role / Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Assets</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Risk Level</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-zinc-800 to-zinc-700 flex items-center justify-center font-black text-zinc-400 border border-white/5 group-hover:border-blue-500/30 transition-all">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-black text-white uppercase tracking-tight">{user.name}</p>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                        user.role === 'ADMIN' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                      }`}>
                        {user.role}
                      </span>
                      <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex justify-center gap-4">
                      <div className="text-center">
                        <p className="text-[11px] font-black text-white tabular-nums">{user._count.vaultEntries}</p>
                        <p className="text-[7px] font-black text-zinc-600 uppercase">Secrets</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[11px] font-black text-white tabular-nums">{user._count.sessions}</p>
                        <p className="text-[7px] font-black text-zinc-600 uppercase">Devices</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border ${
                      user.riskLevel === 'HIGH' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                      user.riskLevel === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                      'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    }`}>
                      {user.riskLevel || 'LOW'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                       <ActionIcon icon={Key} tooltip="Reset Password" color="zinc" onClick={() => resetPassword(user.id)} />
                       <ActionIcon icon={LogOut} tooltip="Force Logout" color="amber" onClick={() => forceLogout(user.id)} />
                       <ActionIcon 
                        icon={user.isActive ? Ban : ShieldCheck} 
                        tooltip={user.isActive ? "Suspend Node" : "Restore Node"} 
                        color={user.isActive ? "red" : "emerald"} 
                        onClick={() => toggleStatus(user.id, user.isActive)}
                       />
                       <ActionIcon icon={ExternalLink} tooltip="View Details" color="blue" onClick={() => viewDetails(user)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-8 border-t border-white/5 flex items-center justify-between bg-black/20">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Showing Page <span className="text-white">{page}</span> of <span className="text-white">{totalPages}</span></p>
          <div className="flex gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-2.5 rounded-xl border border-white/5 text-zinc-500 hover:text-white disabled:opacity-20 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-2.5 rounded-xl border border-white/5 text-zinc-500 hover:text-white disabled:opacity-20 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isDetailsOpen && selectedUser && (
          <UserDetailsModal 
            user={selectedUser} 
            onClose={() => setIsDetailsOpen(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function UserDetailsModal({ user, onClose }: { user: any, onClose: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-4xl bg-zinc-900 border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row max-h-[90vh]"
      >
        <div className="w-full lg:w-[350px] bg-black/40 border-b lg:border-b-0 lg:border-r border-white/5 p-10 flex flex-col items-center text-center">
           <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-4xl text-white shadow-2xl mb-6">
             {user.name.charAt(0).toUpperCase()}
           </div>
           <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">{user.name}</h3>
           <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-2 mb-8">{user.email}</p>
           
           <div className="w-full space-y-2">
             <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-[10px] font-black text-zinc-500 uppercase">Role</span>
                <span className="text-[10px] font-black text-white uppercase">{user.role}</span>
             </div>
             <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-[10px] font-black text-zinc-500 uppercase">Status</span>
                <span className={`text-[10px] font-black uppercase ${user.isActive ? 'text-emerald-500' : 'text-red-500'}`}>{user.isActive ? 'Active' : 'Suspended'}</span>
             </div>
             <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-[10px] font-black text-zinc-500 uppercase">Risk Level</span>
                <span className="text-[10px] font-black text-amber-500 uppercase">{user.riskLevel || 'LOW'}</span>
             </div>
           </div>

           <button 
            onClick={onClose}
            className="mt-auto w-full py-4 bg-white/5 hover:bg-white/10 text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-[0.3em] rounded-2xl border border-white/5 transition-all"
           >
             Close Intel
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
           <section className="space-y-4">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-3 h-3" /> Core Telemetry
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <StatBox label="Secrets" value={user._count?.vaultEntries || 0} color="blue" />
                 <StatBox label="Medical" value={user._count?.medicalRecords || 0} color="red" />
                 <StatBox label="Files" value={user._count?.fileRecords || 0} color="emerald" />
                 <StatBox label="Sessions" value={user._count?.sessions || 0} color="amber" />
              </div>
           </section>

           <section className="space-y-4">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Smartphone className="w-3 h-3" /> Active Nodes
              </h4>
              <div className="space-y-2">
                 {user.sessions?.map((s: any, i: number) => (
                   <div key={i} className="p-4 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                            <Globe className="w-5 h-5 text-zinc-600" />
                         </div>
                         <div>
                            <p className="text-[11px] font-black text-white uppercase">{s.deviceInfo || 'Unknown Device'}</p>
                            <p className="text-[9px] font-black text-zinc-600 tabular-nums uppercase">{s.ipAddress}</p>
                         </div>
                      </div>
                      <span className={`text-[8px] font-black uppercase ${s.isActive ? 'text-emerald-500' : 'text-zinc-600'}`}>{s.isActive ? 'Live' : 'Dead'}</span>
                   </div>
                 ))}
              </div>
           </section>

           <section className="space-y-4">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <History className="w-3 h-3" /> Event Log
              </h4>
              <div className="space-y-1">
                 {user.activityLogs?.map((l: any, i: number) => (
                   <div key={i} className="py-3 border-b border-white/5 last:border-0 flex items-center justify-between group">
                      <div>
                        <p className="text-[10px] font-black text-white uppercase tracking-tight">{l.action.replace(/_/g, ' ')}</p>
                        <p className="text-[9px] font-black text-zinc-600 uppercase italic truncate max-w-[300px]">{l.details}</p>
                      </div>
                      <p className="text-[8px] font-black text-zinc-700 tabular-nums">{new Date(l.createdAt).toLocaleString()}</p>
                   </div>
                 ))}
              </div>
           </section>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatBox({ label, value, color }: any) {
  const colors: any = {
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    red: 'text-red-500 bg-red-500/10 border-red-500/20',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  };

  return (
    <div className={`p-4 rounded-2xl border text-center ${colors[color]}`}>
       <p className="text-xl font-black italic tabular-nums leading-none mb-1">{value}</p>
       <p className="text-[8px] font-black uppercase tracking-widest opacity-60">{label}</p>
    </div>
  );
}

function ActionIcon({ icon: Icon, tooltip, color, onClick }: any) {
  const colors: any = {
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500 hover:text-white',
    red: 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white',
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500 hover:text-white',
    emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-white',
    zinc: 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white hover:text-black',
  };

  return (
    <div className="relative group/tooltip">
      <button 
        onClick={onClick}
        className={`p-2 rounded-lg border transition-all ${colors[color]}`}
      >
        <Icon className="w-4 h-4" />
      </button>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-[8px] font-black text-white uppercase tracking-widest rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 border border-white/10 shadow-2xl">
        {tooltip}
      </div>
    </div>
  );
}
