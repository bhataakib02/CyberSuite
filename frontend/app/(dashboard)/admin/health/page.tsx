"use client";

import { useState, useEffect } from 'react';
import { 
  Activity, 
  Cpu, 
  Database, 
  Zap, 
  HardDrive, 
  Server, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';

export default function SystemHealthPage() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulation of real-time metrics
  useEffect(() => {
    const generateMetrics = () => {
      const now = new Date();
      return Array.from({ length: 20 }).map((_, i) => ({
        time: new Date(now.getTime() - (20 - i) * 5000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        cpu: 30 + Math.random() * 20,
        ram: 45 + Math.random() * 10,
        latency: 15 + Math.random() * 30
      }));
    };

    setMetrics(generateMetrics());

    const interval = setInterval(() => {
      setMetrics(prev => [
        ...prev.slice(1),
        {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          cpu: 30 + Math.random() * 20,
          ram: 45 + Math.random() * 10,
          latency: 15 + Math.random() * 30
        }
      ]);
    }, 5000);

    setLoading(false);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
              <Activity className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">System <span className="text-zinc-600">Health</span></h1>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1 pl-0.5">Real-time Infrastructure Telemetry • Resource Monitor</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 bg-zinc-900/40 border border-white/5 px-4 py-2 rounded-xl">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-black text-white uppercase tracking-widest">Global Status: Optimal</span>
           </div>
           <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-zinc-500 hover:text-white transition-all">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ResourceGauge icon={Cpu} label="CPU Utilization" value={Math.round(metrics[metrics.length-1]?.cpu || 0)} color="blue" />
        <ResourceGauge icon={Server} label="Memory Usage" value={Math.round(metrics[metrics.length-1]?.ram || 0)} color="purple" />
        <ResourceGauge icon={Zap} label="Network Latency" value={Math.round(metrics[metrics.length-1]?.latency || 0)} color="amber" unit="ms" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricChart title="CPU & Memory Trends" data={metrics} keys={['cpu', 'ram']} colors={['#3b82f6', '#a855f7']} />
        <MetricChart title="Request Latency (ms)" data={metrics} keys={['latency']} colors={['#f59e0b']} />
      </div>

      <div className="bg-zinc-900/40 border border-white/5 rounded-[3rem] p-8 backdrop-blur-xl">
        <h3 className="text-lg font-black text-white uppercase tracking-tight italic mb-6 flex items-center gap-2">
          <Database className="w-5 h-5 text-zinc-500" />
          Subsystem <span className="text-zinc-600">Integrity</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <SystemItem name="PostgreSQL" status="Healthy" load="12%" uptime="99.99%" />
          <SystemItem name="Redis Cache" status="Healthy" load="4%" uptime="99.99%" />
          <SystemItem name="Worker Engine" status="Warning" load="88%" uptime="99.95%" danger />
          <SystemItem name="Socket Cluster" status="Healthy" load="31%" uptime="100%" />
        </div>
      </div>
    </div>
  );
}

function ResourceGauge({ icon: Icon, label, value, color, unit = '%' }: any) {
  const colors: any = {
    blue: 'text-blue-500',
    purple: 'text-purple-500',
    amber: 'text-amber-500',
  };

  return (
    <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-6 opacity-5">
        <Icon className="w-16 h-16" />
      </div>
      <div className="flex items-center gap-3 mb-6">
        <Icon className={`w-5 h-5 ${colors[color]}`} />
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</p>
      </div>
      <div className="flex items-end gap-2">
        <h4 className="text-5xl font-black text-white italic tabular-nums">{value}</h4>
        <span className="text-xl font-black text-zinc-600 italic mb-1">{unit}</span>
      </div>
      <div className="mt-6 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={`h-full rounded-full transition-all duration-1000 ${
            color === 'blue' ? 'bg-blue-500' : color === 'purple' ? 'bg-purple-500' : 'bg-amber-500'
          }`}
        />
      </div>
    </div>
  );
}

function MetricChart({ title, data, keys, colors }: any) {
  return (
    <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl">
      <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-8">{title}</h3>
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              {colors.map((c: string, i: number) => (
                <linearGradient key={i} id={`color${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={c} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={c} stopOpacity={0}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
            <XAxis dataKey="time" stroke="#52525b" fontSize={8} fontWeight={900} axisLine={false} tickLine={false} />
            <YAxis stroke="#52525b" fontSize={8} fontWeight={900} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#09090b', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '10px', fontWeight: 900 }}
            />
            {keys.map((k: string, i: number) => (
              <Area key={k} type="monotone" dataKey={k} stroke={colors[i]} strokeWidth={3} fillOpacity={1} fill={`url(#color${i})`} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SystemItem({ name, status, load, uptime, danger }: any) {
  return (
    <div className="p-6 bg-black/40 border border-white/5 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-black text-white uppercase">{name}</p>
        <div className={`w-2 h-2 rounded-full ${danger ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'} animate-pulse`} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[8px] font-black text-zinc-600 uppercase">Current Load</p>
          <p className={`text-sm font-black italic ${danger ? 'text-amber-500' : 'text-white'}`}>{load}</p>
        </div>
        <div>
          <p className="text-[8px] font-black text-zinc-600 uppercase">Uptime</p>
          <p className="text-sm font-black text-white italic">{uptime}</p>
        </div>
      </div>
    </div>
  );
}
