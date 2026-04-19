"use client";

import { useState, useEffect } from 'react';
import { 
  Database, 
  HardDrive, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Music, 
  PieChart, 
  TrendingUp, 
  Search, 
  Filter, 
  RefreshCw,
  FolderLock,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';
import { 
  PieChart as RePieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { motion } from 'framer-motion';

const STORAGE_DATA = [
  { name: 'Documents', value: 450, color: '#3b82f6' },
  { name: 'Encrypted Media', value: 1200, color: '#a855f7' },
  { name: 'Identity Blobs', value: 300, color: '#10b981' },
  { name: 'System Backups', value: 800, color: '#f59e0b' },
];

const NODE_USAGE = [
  { node: 'Node-01', usage: 82 },
  { node: 'Node-02', usage: 45 },
  { node: 'Node-03', usage: 91 },
  { node: 'Node-04', usage: 12 },
  { node: 'Node-05', usage: 67 },
];

export default function StorageMonitorPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
              <Database className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Storage <span className="text-zinc-600">Matrix</span></h1>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1 pl-0.5">Distributed Blob Management • Zero-Knowledge Data Density</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex flex-col items-end mr-4">
            <p className="text-[10px] font-black text-zinc-500 uppercase">Available Volume</p>
            <p className="text-xl font-black text-white italic tabular-nums leading-none">2.4 TB <span className="text-zinc-600 text-sm">/ 10 TB</span></p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95">
            <Zap className="w-4 h-4" />
            Expand Cluster
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <StorageCard label="Total Objects" value="1.2M" trend="+15k" icon={FileText} color="blue" />
         <StorageCard label="Data Encryption" value="AES-256" trend="Verified" icon={ShieldCheck} color="emerald" />
         <StorageCard label="Compression Ratio" value="2.4:1" trend="Optimized" icon={TrendingUp} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[3rem] backdrop-blur-xl">
           <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-2">
             <PieChart className="w-4 h-4 text-purple-500" />
             Blob Density Distribution
           </h3>
           <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="h-[240px] w-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie data={STORAGE_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {STORAGE_DATA.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '10px', fontWeight: 900 }} />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-4 w-full">
                {STORAGE_DATA.map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[10px] font-black text-white uppercase tracking-tight">{item.name}</span>
                    </div>
                    <span className="text-xs font-black text-zinc-500 italic tabular-nums">{item.value} GB</span>
                  </div>
                ))}
              </div>
           </div>
         </div>

         <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[3rem] backdrop-blur-xl">
           <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-2">
             <Activity className="w-4 h-4 text-blue-500" />
             Node Capacity Utilization
           </h3>
           <div className="h-[240px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={NODE_USAGE} layout="vertical">
                 <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={false} />
                 <XAxis type="number" hide />
                 <YAxis dataKey="node" type="category" stroke="#52525b" fontSize={10} fontWeight={900} axisLine={false} tickLine={false} />
                 <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '10px', fontWeight: 900 }} />
                 <Bar dataKey="usage" fill="#3b82f6" radius={[0, 4, 4, 0]} />
               </BarChart>
             </ResponsiveContainer>
           </div>
           <div className="mt-4 p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest text-center italic">
                Distributed storage health is nominal. Cluster self-healing active.
              </p>
           </div>
         </div>
      </div>

      <div className="bg-zinc-900/40 border border-white/5 rounded-[3rem] p-8 backdrop-blur-xl">
        <h3 className="text-lg font-black text-white uppercase tracking-tight italic mb-6 flex items-center gap-2">
          <FolderLock className="w-5 h-5 text-zinc-500" />
          High-Density <span className="text-zinc-600">Audit</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <AuditItem user="thefreelancer2076@gmail.com" type="MEDIA" size="12.4 GB" nodes="3" />
           <AuditItem user="john.doe@protonmail.com" type="DOCS" size="4.2 GB" nodes="2" />
           <AuditItem user="sarah.smith@vault.inc" type="BACKUP" size="45.1 GB" nodes="5" />
           <AuditItem user="dr.medical@cybersuite.io" type="ENCRYPTED" size="1.1 GB" nodes="3" />
        </div>
      </div>
    </div>
  );
}

function StorageCard({ label, value, trend, icon: Icon, color }: any) {
  const colors: any = {
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  };

  return (
    <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl group relative overflow-hidden">
      <div className="absolute top-0 right-0 p-6 opacity-5">
        <Icon className="w-16 h-16" />
      </div>
      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <h4 className="text-4xl font-black text-white italic tracking-tighter tabular-nums">{value}</h4>
        <div className={`px-2 py-1 rounded-lg text-[9px] font-black border ${colors[color]}`}>
          {trend}
        </div>
      </div>
    </div>
  );
}

function AuditItem({ user, type, size, nodes }: any) {
  return (
    <div className="p-6 bg-black/40 border border-white/5 rounded-3xl space-y-4">
      <div className="flex items-center justify-between">
        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[8px] font-black uppercase rounded">{type}</span>
        <span className="text-[9px] font-black text-white italic tabular-nums">{size}</span>
      </div>
      <p className="text-[10px] font-black text-zinc-500 truncate uppercase">{user}</p>
      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
        <p className="text-[8px] font-black text-zinc-600 uppercase">Replication</p>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < nodes ? 'bg-blue-500' : 'bg-zinc-800'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
