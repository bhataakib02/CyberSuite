"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ComposableMap, 
  Geographies, 
  Geography, 
  Marker,
  Sphere,
  Graticule,
  Line
} from 'react-simple-maps';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Zap, 
  Activity, 
  AlertTriangle, 
  RefreshCw, 
  Flame, 
  Lock, 
  EyeOff, 
  Monitor,
  Globe,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { apiFetch } from '../../../../lib/api';
import { getSocket } from '../../../../lib/socket';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface SOCStats {
  activeThreats: number;
  incidentCount: number;
  blockedIps: number;
  uptime: number;
  protocol: {
    protocol: string;
    reason: string;
    updatedBy: string;
    updatedAt: string;
  };
}

export default function SOCDashboard() {
  const [stats, setStats] = useState<SOCStats | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [changingProtocol, setChangingProtocol] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [statsRes, alertsRes] = await Promise.all([
        apiFetch('/admin/soc/stats'),
        apiFetch('/admin/alerts')
      ]);
      
      if (statsRes.ok) setStats(await statsRes.json());
      if (alertsRes.ok) setAlerts((await alertsRes.json()).alerts || []);
    } catch (err) {
      console.error('Failed to fetch SOC data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    
    // Real-time alerts via Socket
    const socket = getSocket();
    if (socket) {
      socket.on('alert:new', (newAlert: any) => {
        setAlerts(prev => [newAlert, ...prev].slice(0, 50));
        fetchData();
      });

      socket.on('protocol:change', (newProtocol: any) => {
        setStats(prev => prev ? { ...prev, protocol: newProtocol } : null);
      });
    }

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off('alert:new');
        socket.off('protocol:change');
      }
    };
  }, []);

  const handleProtocolChange = async (protocol: string) => {
    const reason = prompt(`Reason for switching to ${protocol} protocol:`);
    if (!reason) return;

    setChangingProtocol(true);
    try {
      const res = await apiFetch('/admin/protocols', {
        method: 'POST',
        body: JSON.stringify({ protocol, reason })
      });
      if (res.ok) {
        alert(`Protocol switched to ${protocol}`);
        fetchData();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || 'Failed to change protocol'}`);
      }
    } catch (err) {
      alert('Network error while changing protocol');
    } finally {
      setChangingProtocol(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center space-y-6">
          <div className="relative">
            <RefreshCw className="w-16 h-16 text-blue-500 animate-spin mx-auto opacity-20" />
            <ShieldAlert className="w-8 h-8 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-zinc-500 font-black uppercase tracking-[0.4em] text-[10px]">Synchronizing SOC Intelligence Core...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      {/* HEADER SECTION */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-10">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-600 rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.2)]">
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic leading-none">Intelligence <span className="text-zinc-700">Command</span></h1>
              <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 pl-0.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Sector 0-Delta Oversight • Node: CyberSuite-Master
              </p>
            </div>
          </div>
        </div>

        {/* PROTOCOL PANIC BUTTONS */}
        <div className="bg-zinc-900/50 backdrop-blur-xl p-2 rounded-[2rem] border border-white/5 flex flex-wrap gap-2 shadow-2xl">
          <ProtocolButton 
            active={stats?.protocol.protocol === 'NORMAL'} 
            onClick={() => handleProtocolChange('NORMAL')}
            icon={ShieldCheck} 
            label="Normal" 
            color="emerald" 
            desc="Optimal OPS"
          />
          <ProtocolButton 
            active={stats?.protocol.protocol === 'MAINTENANCE'} 
            onClick={() => handleProtocolChange('MAINTENANCE')}
            icon={Zap} 
            label="Maint" 
            color="amber" 
            desc="Read-Only"
          />
          <ProtocolButton 
            active={stats?.protocol.protocol === 'LOCKDOWN'} 
            onClick={() => handleProtocolChange('LOCKDOWN')}
            icon={Lock} 
            label="Lockdown" 
            color="red" 
            desc="Admin Only"
          />
          <ProtocolButton 
            active={stats?.protocol.protocol === 'STEALTH'} 
            onClick={() => handleProtocolChange('STEALTH')}
            icon={EyeOff} 
            label="Stealth" 
            color="purple" 
            desc="Mask Logs"
          />
        </div>
      </div>

      {/* CORE SOC METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Active Threats" value={stats?.activeThreats || 0} icon={Flame} color="red" danger={stats?.activeThreats! > 0} />
        <MetricCard label="System Incidents" value={stats?.incidentCount || 0} icon={AlertTriangle} color="amber" danger={stats?.incidentCount! > 0} />
        <MetricCard label="IP Mitigations" value={stats?.blockedIps || 0} icon={Shield} color="blue" />
        <MetricCard label="Uptime Efficiency" value={`${Math.floor(stats?.uptime! / 3600)}h ${Math.floor((stats?.uptime! % 3600) / 60)}m`} icon={Activity} color="emerald" />
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-12 gap-8">
        {/* THREAT MAP INTERFACE */}
        <div className="2xl:col-span-8 space-y-8">
          <div className="bg-zinc-900/40 border border-white/5 p-10 rounded-[3rem] backdrop-blur-xl relative overflow-hidden h-[600px] group shadow-2xl">
            <div className="absolute top-10 left-10 z-10 space-y-1">
              <h3 className="text-2xl font-black text-white tracking-tight uppercase leading-none italic">Global Vector <span className="text-zinc-600">Interface</span></h3>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-0.5">Geospatial Attack Surface Tracking</p>
            </div>

            <div className="absolute top-10 right-10 z-10 flex gap-4">
               <div className="px-4 py-2 bg-black/40 border border-white/10 rounded-xl flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span className="text-[10px] font-black text-white uppercase italic">Live Intercepts</span>
               </div>
            </div>

            <div className="w-full h-full pt-10 scale-110">
              <ComposableMap projectionConfig={{ rotate: [-10, 0, 0], scale: 147 }}>
                <Sphere stroke="#ffffff05" strokeWidth={0.5} id="sphere" fill="transparent" />
                <Graticule stroke="#ffffff05" strokeWidth={0.5} />
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill="#ffffff05"
                        stroke="#ffffff10"
                        strokeWidth={0.5}
                        style={{
                          default: { outline: "none" },
                          hover: { fill: "#ffffff10", outline: "none" },
                          pressed: { outline: "none" },
                        }}
                      />
                    ))
                  }
                </Geographies>
                {/* Real alerts on map */}
                {alerts.filter(a => a.metadata?.coords).map((alert) => (
                  <Marker key={alert.id} coordinates={alert.metadata.coords}>
                    <motion.circle 
                      r={alert.severity === 'CRITICAL' ? 12 : 6} 
                      fill={alert.severity === 'CRITICAL' ? '#ef4444' : alert.severity === 'HIGH' ? '#f97316' : '#eab308'} 
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ opacity: [0, 1, 0.4], scale: [1, 1.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    {alert.severity === 'CRITICAL' && (
                       <Line 
                         from={alert.metadata.coords} 
                         to={[0, 20]} 
                         stroke="#ef4444" 
                         strokeWidth={1} 
                         strokeDasharray="4 4"
                         className="animate-[dash_3s_linear_infinite]"
                       />
                    )}
                  </Marker>
                ))}
              </ComposableMap>
            </div>
          </div>

          {/* ACTIVE PROTOCOL DETAILS */}
          <div className="bg-gradient-to-r from-zinc-900/60 to-transparent border border-white/5 p-10 rounded-[3rem] backdrop-blur-xl relative overflow-hidden group shadow-2xl">
             <div className="flex flex-col md:flex-row items-center gap-10">
                <div className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center border-2 border-dashed ${stats?.protocol.protocol === 'NORMAL' ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
                   {stats?.protocol.protocol === 'NORMAL' ? <ShieldCheck className="w-16 h-16 text-emerald-500" /> : <ShieldAlert className="w-16 h-16 text-red-500 animate-pulse" />}
                </div>
                <div className="flex-1 space-y-4">
                   <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Current Status</span>
                      <div className={`h-px flex-1 ${stats?.protocol.protocol === 'NORMAL' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`} />
                   </div>
                   <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">PROTOCOL-{stats?.protocol.protocol}</h2>
                   <p className="text-zinc-400 font-medium text-lg leading-relaxed">{stats?.protocol.reason}</p>
                   <div className="flex items-center gap-6 pt-2">
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-black text-zinc-600 uppercase">Authorized By:</span>
                         <span className="text-[10px] font-black text-white uppercase italic">{stats?.protocol.updatedBy}</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-black text-zinc-600 uppercase">Activated:</span>
                         <span className="text-[10px] font-black text-white uppercase italic">{new Date(stats?.protocol.updatedAt!).toLocaleString()}</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* INTELLIGENCE FEED */}
        <div className="2xl:col-span-4 flex flex-col h-[950px] bg-zinc-900/40 border border-white/5 rounded-[3rem] backdrop-blur-xl shadow-2xl overflow-hidden">
           <div className="p-10 border-b border-white/5 flex items-center justify-between bg-black/20">
             <div>
               <h3 className="text-2xl font-black text-white tracking-tight uppercase italic leading-none">Signal <span className="text-zinc-600">Feed</span></h3>
               <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-2 pl-0.5">Heuristic Signal Processing</p>
             </div>
             <Monitor className="w-8 h-8 text-blue-500 opacity-50" />
           </div>

           <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
             <AnimatePresence mode="popLayout">
               {alerts.map((alert, idx) => (
                 <motion.div 
                   key={alert.id} 
                   initial={{ opacity: 0, x: 50 }} 
                   animate={{ opacity: 1, x: 0 }} 
                   exit={{ opacity: 0, scale: 0.9 }}
                   className={`p-6 border rounded-3xl group transition-all hover:bg-white/5 shadow-xl ${alert.severity === 'CRITICAL' ? 'bg-red-600/10 border-red-600/20' : alert.severity === 'HIGH' ? 'bg-orange-600/10 border-orange-600/20' : 'bg-black/40 border-white/5'}`}
                 >
                    <div className="flex justify-between items-start mb-4">
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase italic ${alert.severity === 'CRITICAL' ? 'bg-red-600 text-white' : alert.severity === 'HIGH' ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                          {alert.severity}
                       </span>
                       <span className="text-[9px] font-black text-zinc-600 tabular-nums italic">{new Date(alert.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <h4 className="text-white font-black uppercase tracking-tight text-md mb-2 leading-none">{alert.type.replace(/_/g, ' ')}</h4>
                    <p className="text-zinc-500 text-xs font-medium leading-relaxed mb-4">{alert.message}</p>
                    <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4">
                       <div className="flex items-center gap-2">
                          <Globe className="w-3 h-3 text-zinc-600" />
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">{alert.ipAddress || 'SYSTEM'}</span>
                       </div>
                       <button className="text-[9px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-colors flex items-center gap-1 group/btn">
                          Details <ArrowRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-1" />
                       </button>
                    </div>
                 </motion.div>
               ))}
             </AnimatePresence>
           </div>

           <div className="p-8 bg-black/40 border-t border-white/5">
             <button onClick={fetchData} className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-white/5 flex items-center justify-center gap-3">
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Clear Queue & Sync
             </button>
           </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes dash {
          to { stroke-dashoffset: -20; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.1); }
      `}</style>
    </div>
  );
}

function ProtocolButton({ active, onClick, icon: Icon, label, color, desc }: any) {
  const colorMap: any = { 
    emerald: active ? 'bg-emerald-600 text-white shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/5', 
    amber: active ? 'bg-amber-600 text-white shadow-[0_0_30px_rgba(245,158,11,0.3)]' : 'text-zinc-500 hover:text-amber-500 hover:bg-amber-500/5',
    red: active ? 'bg-red-600 text-white shadow-[0_0_30px_rgba(239,68,68,0.3)]' : 'text-zinc-500 hover:text-red-500 hover:bg-red-500/5',
    purple: active ? 'bg-purple-600 text-white shadow-[0_0_30px_rgba(168,85,247,0.3)]' : 'text-zinc-500 hover:text-purple-500 hover:bg-purple-500/5'
  };

  return (
    <button 
      onClick={onClick}
      className={`px-6 py-3 rounded-2xl transition-all flex flex-col items-center gap-1 group active:scale-95 ${colorMap[color]}`}
    >
      <Icon className={`w-5 h-5 transition-transform ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
      <span className="text-[10px] font-black uppercase tracking-tighter leading-none">{label}</span>
      <span className={`text-[7px] font-bold uppercase tracking-widest leading-none ${active ? 'text-white/70' : 'text-zinc-600'}`}>{desc}</span>
    </button>
  );
}

function MetricCard({ label, value, icon: Icon, color, danger }: any) {
  const colors: any = {
    red: 'bg-red-600 text-white shadow-[0_0_40px_rgba(239,68,68,0.2)] border-red-500/30',
    amber: 'bg-amber-600 text-white shadow-[0_0_40px_rgba(245,158,11,0.2)] border-amber-500/30',
    blue: 'bg-blue-600 text-white shadow-[0_0_40px_rgba(37,99,235,0.2)] border-blue-500/30',
    emerald: 'bg-emerald-600 text-white shadow-[0_0_40px_rgba(16,185,129,0.2)] border-emerald-500/30',
  };

  const softColors: any = {
    red: 'bg-red-500/10 text-red-500 border-red-500/20',
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  };

  return (
    <div className={`p-8 rounded-[2.5rem] border backdrop-blur-xl relative overflow-hidden group transition-all hover:-translate-y-1 ${danger ? colors[color] : 'bg-zinc-900/40 border-white/5 hover:border-white/10 shadow-2xl'}`}>
      <div className={`absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity ${danger ? 'text-white' : `text-${color}-500`}`}>
        <Icon className="w-32 h-32" />
      </div>
      <div className="relative z-10">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border transition-transform group-hover:scale-110 ${danger ? 'bg-white/20 border-white/30' : softColors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-2 ${danger ? 'text-white/70' : 'text-zinc-500'}`}>{label}</p>
        <h4 className="text-4xl font-black italic tracking-tighter tabular-nums leading-none">{value}</h4>
      </div>
    </div>
  );
}
