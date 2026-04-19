"use client";

import { useState, useEffect } from 'react';
import { 
  Globe, 
  Shield, 
  Activity, 
  Zap, 
  AlertTriangle, 
  Flame, 
  Crosshair, 
  RefreshCw,
  Search,
  Layers,
  MapPin,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ATTACK_VECTORS = [
  { id: '1', origin: 'Frankfurt, DE', target: 'East-Node-01', type: 'DDoS', severity: 'HIGH', x: 480, y: 150 },
  { id: '2', origin: 'Shenzhen, CN', target: 'Central-DB', type: 'SQL-Injection', severity: 'CRITICAL', x: 720, y: 220 },
  { id: '3', origin: 'Sao Paulo, BR', target: 'Auth-Gateway', type: 'Brute Force', severity: 'MEDIUM', x: 280, y: 380 },
  { id: '4', origin: 'Moscow, RU', target: 'File-Vault-04', type: 'Exfiltration', severity: 'HIGH', x: 550, y: 120 },
  { id: '5', origin: 'San Jose, US', target: 'Load-Balancer', type: 'Probe', severity: 'LOW', x: 120, y: 180 },
];

export default function AttackMapPage() {
  const [attacks, setAttacks] = useState(ATTACK_VECTORS);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanning(true);
      setTimeout(() => setScanning(false), 2000);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
              <Globe className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Global <span className="text-zinc-600">Threat Map</span></h1>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1 pl-0.5">Real-time Vector Visualization • Sector 0-Delta Oversight</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end mr-4">
             <p className="text-[10px] font-black text-zinc-500 uppercase">Live Nodes</p>
             <div className="flex items-center gap-2 text-emerald-500 font-black text-xs uppercase italic">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
               948 Active
             </div>
          </div>
          <button className="p-3 rounded-xl bg-white/5 border border-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all group relative overflow-hidden">
            <RefreshCw className={`w-5 h-5 ${scanning ? 'animate-spin' : ''}`} />
            <div className="absolute inset-0 bg-blue-500/10 scale-0 group-hover:scale-100 transition-transform rounded-full" />
          </button>
        </div>
      </div>

      <div className="relative aspect-[16/9] w-full bg-zinc-900/40 border border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-xl group">
        <svg viewBox="0 0 1000 500" className="absolute inset-0 w-full h-full opacity-20 transition-opacity group-hover:opacity-30">
          <path fill="#1e293b" d="M150,150 L180,130 L220,140 L250,180 L230,220 L190,240 L160,220 Z" />
          <path fill="#1e293b" d="M450,120 L480,100 L550,110 L580,150 L560,200 L510,220 L460,190 Z" />
          <path fill="#1e293b" d="M700,180 L750,160 L850,200 L880,250 L840,300 L750,320 L720,260 Z" />
          <path fill="#1e293b" d="M250,320 L300,300 L350,350 L340,420 L280,450 L240,400 Z" />
          <g stroke="#ffffff" strokeWidth="0.5" opacity="0.1">
            {Array.from({ length: 20 }).map((_, i) => (<line key={`v-${i}`} x1={i * 50} y1="0" x2={i * 50} y2="500" />))}
            {Array.from({ length: 10 }).map((_, i) => (<line key={`h-${i}`} x1="0" y1={i * 50} x2="1000" y2={i * 50} />))}
          </g>
        </svg>

        {scanning && (
          <motion.div initial={{ left: '-20%' }} animate={{ left: '120%' }} transition={{ duration: 2, ease: "linear" }} className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent skew-x-12 pointer-events-none z-10" />
        )}

        <div className="absolute inset-0 pointer-events-none">
          <svg viewBox="0 0 1000 500" className="w-full h-full">
            <AnimatePresence>
              {attacks.map((attack) => (
                <g key={attack.id}>
                  <motion.circle initial={{ r: 0, opacity: 0 }} animate={{ r: [0, 10, 0], opacity: [0, 0.8, 0] }} transition={{ duration: 2, repeat: Infinity }} cx={attack.x} cy={attack.y} className={attack.severity === 'CRITICAL' ? 'fill-red-500' : 'fill-amber-500'} />
                  <circle cx={attack.x} cy={attack.y} r="2" fill="white" />
                  <circle cx="500" cy="250" r="4" fill="#3b82f6" className="animate-pulse" />
                  <motion.path initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.4 }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }} d={`M${attack.x},${attack.y} Q${(attack.x + 500)/2},${Math.min(attack.y, 250) - 50} 500,250`} stroke={attack.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b'} strokeWidth="1.5" fill="none" strokeDasharray="4 4" />
                </g>
              ))}
            </AnimatePresence>
          </svg>
        </div>

        <div className="absolute top-8 left-8 space-y-4">
           <div className="p-4 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 w-64">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Live Intercepts</p>
              <div className="space-y-2">
                {attacks.slice(0, 3).map(a => (
                  <div key={a.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${a.severity === 'CRITICAL' ? 'bg-red-500' : 'bg-amber-500'}`} />
                      <span className="text-[9px] font-black text-white uppercase">{a.type}</span>
                    </div>
                    <span className="text-[8px] font-bold text-zinc-600 uppercase italic">From {a.origin.split(',')[0]}</span>
                  </div>
                ))}
              </div>
           </div>
        </div>

        <div className="absolute bottom-8 right-8 flex items-end gap-6">
           <div className="flex items-center gap-6 bg-black/60 backdrop-blur-md p-6 rounded-[2rem] border border-white/10">
              <LegendItem color="bg-red-500" label="Breach" />
              <LegendItem color="bg-amber-500" label="Attack" />
              <LegendItem color="bg-blue-500" label="Safe" />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AttackSummary label="Mitigation" value="12,842" trend="+124 Today" icon={Shield} color="emerald" />
        <AttackSummary label="Depth" value="4.2s" trend="-0.8s" icon={Activity} color="blue" />
        <AttackSummary label="Blocked" value="842" trend="+14" icon={Lock} color="amber" />
        <AttackSummary label="Zones" value="12" trend="Fixed" icon={MapPin} color="purple" />
      </div>
    </div>
  );
}

function LegendItem({ color, label }: any) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</span>
    </div>
  );
}

function AttackSummary({ label, value, trend, icon: Icon, color }: any) {
  const colors: any = {
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  };

  return (
    <div className="p-8 bg-zinc-900/40 border border-white/5 rounded-[2.5rem] backdrop-blur-xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-6 opacity-5 transition-opacity group-hover:opacity-10">
        <Icon className="w-16 h-16" />
      </div>
      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <h4 className="text-4xl font-black text-white italic tracking-tighter tabular-nums">{value}</h4>
        <div className={`px-2 py-1 rounded-lg text-[9px] font-black border ${colors[color]}`}>{trend}</div>
      </div>
    </div>
  );
}
