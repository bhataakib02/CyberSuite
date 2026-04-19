"use client";

import { useState, useEffect } from 'react';
import { 
  Flame, 
  Shield, 
  Activity, 
  Clock, 
  User, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  Filter,
  Search,
  MoreVertical,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';

interface Incident {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');

  const fetchIncidents = async () => {
    try {
      const res = await apiFetch('/admin/incidents');
      if (res.ok) {
        const data = await res.json();
        setIncidents(data.incidents || []);
      }
    } catch (err) {
      console.error('Failed to fetch incidents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await apiFetch(`/admin/incidents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchIncidents();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = incidents.filter(i => activeTab === 'ALL' || i.status === activeTab);

  const stats = {
    total: incidents.length,
    open: incidents.filter(i => i.status === 'OPEN').length,
    investigating: incidents.filter(i => i.status === 'INVESTIGATING').length,
    resolved: incidents.filter(i => i.status === 'RESOLVED').length,
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
              <Flame className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Incident <span className="text-zinc-600">Commander</span></h1>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1 pl-0.5">Crisis Management • Active Containment Protocols</p>
            </div>
          </div>
        </div>

        <button className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-red-600/20 active:scale-95">
          <Flame className="w-4 h-4" />
          Declare Incident
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatTab label="Total Breaches" value={stats.total} isActive={activeTab === 'ALL'} onClick={() => setActiveTab('ALL')} color="blue" />
        <StatTab label="Open Issues" value={stats.open} isActive={activeTab === 'OPEN'} onClick={() => setActiveTab('OPEN')} color="red" />
        <StatTab label="Investigating" value={stats.investigating} isActive={activeTab === 'INVESTIGATING'} onClick={() => setActiveTab('INVESTIGATING')} color="amber" />
        <StatTab label="Resolved" value={stats.resolved} isActive={activeTab === 'RESOLVED'} onClick={() => setActiveTab('RESOLVED')} color="emerald" />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence>
          {filtered.map((incident) => (
            <motion.div
              key={incident.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-xl relative overflow-hidden group hover:border-white/10 transition-all"
            >
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                <div className="w-full lg:w-3/4 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                      incident.severity === 'CRITICAL' ? 'bg-red-500 text-white border-red-400' :
                      incident.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                      'bg-blue-500/10 text-blue-500 border-blue-500/20'
                    }`}>
                      {incident.severity}
                    </span>
                    <span className="text-[10px] font-black text-zinc-600 uppercase tabular-nums">{incident.id}</span>
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">{incident.title}</h3>
                    <p className="text-zinc-500 text-sm font-bold mt-2 leading-relaxed">{incident.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-6 pt-4 border-t border-white/5">
                    <MetaItem icon={User} label="Primary Target" value={incident.user?.name || 'System-Wide'} />
                    <MetaItem icon={Clock} label="Time Since Detection" value={new Date(incident.createdAt).toLocaleTimeString()} />
                    <MetaItem icon={Activity} label="Response Status" value={incident.status} />
                  </div>
                </div>

                <div className="w-full lg:w-1/4 space-y-3">
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2">Command Center</p>
                  <StatusButton 
                    label="Mark Investigating" 
                    active={incident.status === 'INVESTIGATING'} 
                    onClick={() => updateStatus(incident.id, 'INVESTIGATING')} 
                    color="amber"
                  />
                  <StatusButton 
                    label="Contain & Resolve" 
                    active={incident.status === 'RESOLVED'} 
                    onClick={() => updateStatus(incident.id, 'RESOLVED')} 
                    color="emerald"
                  />
                  <button className="w-full py-3 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 active:scale-95 flex items-center justify-center gap-2 group">
                    <MessageSquare className="w-4 h-4" />
                    Open War Room
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatTab({ label, value, isActive, onClick, color }: any) {
  const colors: any = {
    blue: 'text-blue-500 border-blue-500/20 bg-blue-500/5',
    red: 'text-red-500 border-red-500/20 bg-red-500/5',
    amber: 'text-amber-500 border-amber-500/20 bg-amber-500/5',
    emerald: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5',
  };

  return (
    <button
      onClick={onClick}
      className={`p-6 rounded-[2rem] border transition-all text-left group ${
        isActive 
          ? colors[color] + ' border-current shadow-lg shadow-current/10' 
          : 'bg-zinc-900/40 border-white/5 text-zinc-500 hover:bg-white/5'
      }`}
    >
      <p className="text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-black text-white tabular-nums italic group-hover:scale-110 transition-transform origin-left">{value}</p>
    </button>
  );
}

function MetaItem({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5">
        <Icon className="w-4 h-4 text-zinc-500" />
      </div>
      <div>
        <p className="text-[8px] font-black text-zinc-600 uppercase leading-none">{label}</p>
        <p className="text-[10px] font-black text-white uppercase mt-1">{value}</p>
      </div>
    </div>
  );
}

function StatusButton({ label, active, onClick, color }: any) {
  const colors: any = {
    amber: 'hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/20',
    emerald: 'hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/20',
  };

  return (
    <button
      onClick={onClick}
      className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${
        active 
          ? 'bg-zinc-800 border-zinc-700 text-zinc-400 opacity-50 cursor-not-allowed' 
          : 'bg-white/5 border-white/5 text-zinc-500 ' + colors[color]
      }`}
    >
      {active && <CheckCircle2 className="w-4 h-4" />}
      {label}
    </button>
  );
}
