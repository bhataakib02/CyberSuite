"use client";

import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Shield, 
  MapPin, 
  Monitor, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Ban, 
  Flame, 
  MoreVertical,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';

interface Alert {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  ipAddress: string;
  location: string;
  deviceInfo: string;
  status: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchAlerts = async () => {
    try {
      const res = await apiFetch('/admin/alerts');
      if (res.ok) {
        const d = await res.json();
        const data = d.data || d;
        setAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error('Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleAction = async (id: string, action: string) => {
    try {
      const res = await apiFetch(`/admin/alerts/${id}/action`, {
        method: 'POST',
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        fetchAlerts();
      }
    } catch (err) {
      console.error('Action failed');
    }
  };

  const filteredAlerts = alerts.filter(a => {
    const matchesSearch = a.type.toLowerCase().includes(search.toLowerCase()) || a.message.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' || a.severity === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Security <span className="text-zinc-600">Alerts</span></h1>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1 pl-0.5">Real-time Threat Detection • Anomaly Queue</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 flex items-center gap-2 focus-within:border-blue-500/50 transition-all">
            <Search className="w-4 h-4 text-zinc-600" />
            <input 
              type="text" 
              placeholder="Search signatures..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-white w-48"
            />
          </div>
          <button onClick={fetchAlerts} className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-zinc-500 hover:text-white transition-all">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all flex items-center justify-between group ${
              filter === s 
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' 
                : 'bg-zinc-900/40 border-white/5 text-zinc-500 hover:bg-white/5'
            }`}
          >
            {s} SIGS
            <span className={`px-2 py-0.5 rounded-lg text-[8px] ${filter === s ? 'bg-white/20' : 'bg-zinc-800'}`}>
              {s === 'ALL' ? alerts.length : alerts.filter(a => a.severity === s).length}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {filteredAlerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`bg-zinc-900/40 border rounded-[2rem] p-6 backdrop-blur-xl transition-all hover:border-white/10 group ${
                alert.status !== 'NEW' ? 'opacity-50 grayscale' : 'border-white/5'
              }`}
            >
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-4">
                    <SeverityBadge severity={alert.severity} />
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest tabular-nums">{alert.id}</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-800" />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {new Date(alert.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight italic">{alert.type.replace(/_/g, ' ')}</h3>
                    <p className="text-zinc-500 text-sm font-bold mt-1">{alert.message}</p>
                  </div>

                  <div className="flex flex-wrap gap-6 pt-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-zinc-600" />
                      <div>
                        <p className="text-[8px] font-black text-zinc-600 uppercase">Origin IP / Location</p>
                        <p className="text-[10px] font-black text-white uppercase">{alert.ipAddress} • <span className="text-blue-500">{alert.location || 'Unknown'}</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-zinc-600" />
                      <div>
                        <p className="text-[8px] font-black text-zinc-600 uppercase">Device Fingerprint</p>
                        <p className="text-[10px] font-black text-white uppercase">{alert.deviceInfo || 'Standard Node'}</p>
                      </div>
                    </div>
                    {alert.user && (
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-zinc-600" />
                        <div>
                          <p className="text-[8px] font-black text-zinc-600 uppercase">Target Identity</p>
                          <p className="text-[10px] font-black text-white uppercase">{alert.user.name}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-row lg:flex-col justify-end gap-2 border-t lg:border-t-0 lg:border-l border-white/5 pt-6 lg:pt-0 lg:pl-6 min-w-[200px]">
                  <p className="hidden lg:block text-[8px] font-black text-zinc-600 uppercase mb-2 tracking-widest">Protocol Response</p>
                  <ActionButton 
                    label="Resolve" 
                    icon={CheckCircle2} 
                    color="emerald" 
                    onClick={() => handleAction(alert.id, 'RESOLVE')} 
                    disabled={alert.status !== 'NEW'}
                  />
                  <ActionButton 
                    label="Escalate" 
                    icon={Flame} 
                    color="red" 
                    onClick={() => handleAction(alert.id, 'INCIDENT')} 
                    disabled={alert.status !== 'NEW'}
                  />
                  <ActionButton 
                    label="Block Node" 
                    icon={Ban} 
                    color="amber" 
                    onClick={() => handleAction(alert.id, 'BLOCK')} 
                    disabled={alert.status !== 'NEW'}
                  />
                  <ActionButton 
                    label="Ignore" 
                    icon={XCircle} 
                    color="zinc" 
                    onClick={() => handleAction(alert.id, 'IGNORE')} 
                    disabled={alert.status !== 'NEW'}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredAlerts.length === 0 && !loading && (
          <div className="p-20 text-center bg-zinc-900/20 rounded-[3rem] border border-dashed border-white/5">
            <Shield className="w-16 h-16 text-zinc-800 mx-auto mb-6" />
            <h4 className="text-xl font-black text-zinc-600 uppercase tracking-tighter">Queue Empty</h4>
            <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] mt-2">All sectors showing nominal activity</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: any = {
    CRITICAL: 'bg-red-500 text-white animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.3)]',
    HIGH: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
    MEDIUM: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    LOW: 'bg-zinc-800 text-zinc-500 border-white/5',
  };

  return (
    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${colors[severity]}`}>
      {severity}
    </span>
  );
}

function ActionButton({ label, icon: Icon, color, onClick, disabled }: any) {
  const colors: any = {
    emerald: 'hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/20',
    red: 'hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20',
    amber: 'hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/20',
    zinc: 'hover:bg-white/10 hover:text-white hover:border-white/20',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 text-zinc-500 disabled:opacity-20 disabled:cursor-not-allowed group ${colors[color]}`}
    >
      <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
      {label}
    </button>
  );
}
