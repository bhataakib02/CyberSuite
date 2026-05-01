"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ComposableMap, 
  Geographies, 
  Geography, 
  Marker,
  Sphere,
  Graticule
} from 'react-simple-maps';
import { 
  RefreshCw, 
  Shield, 
  Users, 
  Activity, 
  AlertTriangle, 
  Flame, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown,
  Globe as GlobeIcon
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Area 
} from 'recharts';
import { apiFetch } from '../../../lib/api';

interface DashboardData {
  kpis: {
    totalUsers: number;
    activeSessions: number;
    failedLoginsToday: number;
    activeIncidents: number;
    [key: string]: any;
  };
  trends: {
    growth: number[];
    activity: number[];
    alerts: number[];
  };
  liveFeed: any[];
  security: {
    twoFAPercentage: number;
    weakPasswords: number;
    activeThreats: number;
    riskLevel: string;
  };
}

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface ThreatMarker {
  id: string;
  coordinates: [number, number];
  city: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

const MOCK_THREATS: ThreatMarker[] = [
  { id: '1', coordinates: [77.2090, 28.6139], city: 'New Delhi', severity: 'HIGH' },
  { id: '2', coordinates: [-74.0060, 40.7128], city: 'New York', severity: 'CRITICAL' },
  { id: '3', coordinates: [139.6503, 35.6762], city: 'Tokyo', severity: 'MEDIUM' },
  { id: '4', coordinates: [-0.1276, 51.5072], city: 'London', severity: 'LOW' },
  { id: '5', coordinates: [37.6173, 55.7558], city: 'Moscow', severity: 'HIGH' },
  { id: '6', coordinates: [151.2093, -33.8688], city: 'Sydney', severity: 'MEDIUM' },
];

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeView, setActiveView] = useState<'MAP' | 'CHART'>('MAP');

  const fetchDashboardData = async () => {
    setRefreshing(true);
    try {
      const res = await apiFetch('/admin/dashboard');
      if (res.ok) {
        const d = await res.json();
        setData(d.data || d);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
          <p className="text-zinc-500 font-black uppercase tracking-[0.3em] text-xs">Initializing Intelligence Core...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8 pb-20">
      {/* SOC HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
              <Shield className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Security Operations <span className="text-zinc-600">Center</span></h1>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1 pl-0.5">Real-time Zero-Trust Oversight • System Intelligence Node-01</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-white/5 mr-4">
             <button 
               onClick={() => setActiveView('MAP')}
               className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeView === 'MAP' ? 'bg-white/10 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
             >Global Map</button>
             <button 
               onClick={() => setActiveView('CHART')}
               className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeView === 'CHART' ? 'bg-white/10 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
             >Telemetry</button>
          </div>
          <button 
            onClick={fetchDashboardData}
            disabled={refreshing}
            className={`p-3 rounded-xl bg-white/5 border border-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all ${refreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Intelligence" subtitle="Registered Nodes" value={data.kpis.totalUsers} trend="+12%" icon={Users} color="blue" />
        <KPICard title="Live Vectors" subtitle="Concurrent Sessions" value={data.kpis.activeSessions} trend="-2%" icon={Activity} color="emerald" />
        <KPICard title="Threat Vectors" subtitle="Failed Logins" value={data.kpis.failedLoginsToday} trend="+40%" icon={AlertTriangle} color="amber" danger={data.kpis.failedLoginsToday > 50} />
        <KPICard title="Active Breaches" subtitle="Open Incidents" value={data.kpis.activeIncidents} trend="0" icon={Flame} color="red" danger={data.kpis.activeIncidents > 0} />
      </div>

      {/* MAIN SOC DISPLAY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {activeView === 'MAP' ? (
              <motion.div 
                key="map"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl relative overflow-hidden h-[500px]"
              >
                <div className="absolute top-8 left-8 z-10">
                   <h3 className="text-xl font-black text-white tracking-tight uppercase leading-none">Global <span className="text-zinc-600">Threat Interface</span></h3>
                   <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Geospatial Attack Vector Tracking</p>
                </div>

                <div className="w-full h-full pt-10">
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
                    {MOCK_THREATS.map(({ id, coordinates, severity, city }) => (
                      <Marker key={id} coordinates={coordinates}>
                        <motion.circle 
                          r={severity === 'CRITICAL' ? 8 : 4} 
                          fill={severity === 'CRITICAL' ? '#ef4444' : severity === 'HIGH' ? '#f97316' : '#eab308'} 
                          animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.5, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        />
                        <text
                          textAnchor="middle"
                          y={-12}
                          style={{ fontFamily: "Inter", fill: "#52525b", fontSize: 8, fontWeight: 900, textTransform: 'uppercase' }}
                        >
                          {city}
                        </text>
                      </Marker>
                    ))}
                  </ComposableMap>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="chart"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl h-[500px]"
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight uppercase">Network Activity <span className="text-zinc-600">Telemetrics</span></h3>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Aggregated Traffic Analysis • 72H Window</p>
                  </div>
                </div>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart data={data.trends.growth.map((v: number, i: number) => ({ name: `T-${6-i}`, users: v, activity: data.trends.activity[i] }))}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                        <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis dataKey="name" stroke="#52525b" fontSize={10} fontWeight={900} axisLine={false} tickLine={false} />
                      <YAxis stroke="#52525b" fontSize={10} fontWeight={900} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #ffffff10', borderRadius: '16px', fontSize: '10px', fontWeight: 900 }} />
                      <Area type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorUsers)" />
                      <Area type="monotone" dataKey="activity" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorActivity)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-white tracking-tight uppercase">Incident <span className="text-zinc-600">Command Center</span></h3>
                <button className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-600/20 flex items-center gap-2">
                  <Flame className="w-4 h-4" /> Declare Incident
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'INC-772', title: 'Brute Force Attempt', severity: 'HIGH', status: 'INVESTIGATING', time: '12m ago' },
                  { id: 'INC-771', title: 'Auth Service Latency', severity: 'LOW', status: 'MONITORING', time: '1h ago' },
                ].map(inc => (
                  <div key={inc.id} className="p-5 bg-black/40 border border-white/5 rounded-3xl group hover:border-red-500/30 transition-all cursor-pointer">
                    <div className="flex justify-between items-start mb-3">
                       <span className="text-[10px] font-black text-zinc-600">{inc.id}</span>
                       <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${inc.severity === 'HIGH' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>{inc.severity}</span>
                    </div>
                    <h4 className="text-white font-black uppercase tracking-tight text-sm mb-1">{inc.title}</h4>
                    <p className="text-zinc-500 text-[10px] font-bold uppercase">{inc.status} • {inc.time}</p>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* LIVE ACTIVITY FEED */}
        <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] backdrop-blur-xl flex flex-col h-[820px]">
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white tracking-tight uppercase italic leading-none">Intelligence <span className="text-zinc-600">Feed</span></h3>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Live Signal Processing</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {data.liveFeed.map((event: any, idx: number) => (
              <motion.div key={event.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} className="p-4 bg-black/40 border border-white/5 rounded-2xl group hover:border-blue-500/30 transition-all hover:bg-black/60 shadow-lg">
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110 ${event.action.includes('FAILURE') || event.action.includes('UNAUTHORIZED') ? 'bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                    <Activity className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-[11px] font-black text-white uppercase tracking-tight truncate">{event.action.replace(/_/g, ' ')}</p>
                      <p className="text-[8px] font-black text-zinc-600 uppercase tabular-nums">{new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-medium leading-tight line-clamp-1">{event.details}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-4 h-4 rounded-full bg-zinc-800 flex items-center justify-center text-[7px] font-black text-zinc-400">{event.user?.name?.charAt(0).toUpperCase() || 'S'}</div>
                      <p className="text-[9px] font-black text-zinc-600 truncate uppercase tracking-tighter">{event.user?.email || 'SYSTEM_CORE'}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="p-6 bg-black/40 border-t border-white/5 rounded-b-[2.5rem]">
            <button className="w-full py-3 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 active:scale-95 flex items-center justify-center gap-2 group">
              View Audit History <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, subtitle, value, trend, icon: Icon, color, danger = false }: any) {
  const colorMap: any = { blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20', emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20', red: 'text-red-500 bg-red-500/10 border-red-500/20' };
  return (
    <div className={`p-6 bg-zinc-900/40 border rounded-3xl backdrop-blur-xl relative overflow-hidden group transition-all hover:scale-[1.02] active:scale-[0.98] ${danger ? 'border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.1)]' : 'border-white/5'}`}>
      <div className="absolute top-0 right-0 p-4 opacity-5 transition-opacity group-hover:opacity-10"><Icon className="w-12 h-12" /></div>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colorMap[color]}`}><Icon className="w-5 h-5" /></div>
        <div><p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">{title}</p><p className="text-[8px] font-black text-zinc-600 uppercase tracking-tight mt-1">{subtitle}</p></div>
      </div>
      <div className="flex items-end justify-between">
        <h4 className="text-3xl font-black text-white tracking-tighter italic tabular-nums leading-none">{typeof value === 'number' ? value.toLocaleString() : value}</h4>
        <div className={`flex items-center gap-1 text-[10px] font-black uppercase italic ${trend.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>{trend.startsWith('+') ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{trend}</div>
      </div>
    </div>
  );
}

function RiskIndicator({ label, value, color }: any) {
  const colorMap: any = { blue: 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]', emerald: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]', purple: 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]', red: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' };
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-500"><span>{label}</span><span className="text-white tabular-nums italic">{Math.round(value)}%</span></div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]"><motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 1, ease: "easeOut" }} className={`h-full rounded-full ${colorMap[color]}`} /></div>
    </div>
  );
}
