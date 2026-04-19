"use client";

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Globe, 
  Users, 
  Shield, 
  Calendar, 
  Download, 
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Layers,
  Zap,
  Layout
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart as RePieChart,
  Pie
} from 'recharts';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';

const MOCK_GROWTH = [
  { month: 'JAN', users: 4000, active: 2400 },
  { month: 'FEB', users: 3000, active: 1398 },
  { month: 'MAR', users: 2000, active: 9800 },
  { month: 'APR', users: 2780, active: 3908 },
  { month: 'MAY', users: 1890, active: 4800 },
  { month: 'JUN', users: 2390, active: 3800 },
  { month: 'JUL', users: 3490, active: 4300 },
];

const ROLE_DATA = [
  { name: 'Standard Users', value: 75, color: '#3b82f6' },
  { name: 'Professionals', value: 15, color: '#a855f7' },
  { name: 'Academics', value: 7, color: '#10b981' },
  { name: 'Admin Staff', value: 3, color: '#ef4444' },
];

export default function ReportsPage() {
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
              <BarChart3 className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Intelligence <span className="text-zinc-600">Analytics</span></h1>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1 pl-0.5">Big Data Processing • behavioral Trend forecasting</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
           <button className="bg-zinc-900 border border-white/5 text-zinc-400 px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 hover:border-white/20 hover:text-white">
            <Calendar className="w-4 h-4" />
            Last Fiscal Quarter
          </button>
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95">
            <Download className="w-4 h-4" />
            Export Intel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Customer Retention" value="94.2%" trend="+2.4%" icon={TrendingUp} color="emerald" />
        <StatCard label="Average User Lifetime" value="184 Days" trend="+12" icon={Clock} color="blue" />
        <StatCard label="Security Compliance" value="99.9%" trend="Stable" icon={Shield} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[3rem] backdrop-blur-xl">
           <div className="flex items-center justify-between mb-8">
             <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
               <TrendingUp className="w-4 h-4 text-blue-500" />
               Growth & Engagement
             </h3>
             <div className="flex gap-4">
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-[9px] font-black text-zinc-500 uppercase">Total Nodes</span></div>
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-400" /><span className="text-[9px] font-black text-zinc-500 uppercase">Active</span></div>
             </div>
           </div>

           <div className="h-[300px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={MOCK_GROWTH}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                 <XAxis dataKey="month" stroke="#52525b" fontSize={10} fontWeight={900} axisLine={false} tickLine={false} />
                 <YAxis stroke="#52525b" fontSize={10} fontWeight={900} axisLine={false} tickLine={false} />
                 <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #ffffff10', borderRadius: '16px', fontSize: '10px', fontWeight: 900 }} />
                 <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={4} dot={false} activeDot={{ r: 8 }} />
                 <Line type="monotone" dataKey="active" stroke="#818cf8" strokeWidth={4} dot={false} strokeDasharray="5 5" />
               </LineChart>
             </ResponsiveContainer>
           </div>
         </div>

         <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[3rem] backdrop-blur-xl">
           <div className="flex items-center justify-between mb-8">
             <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
               <PieChart className="w-4 h-4 text-purple-500" />
               Identity Distribution
             </h3>
           </div>

           <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="h-[240px] w-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={ROLE_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {ROLE_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '10px', fontWeight: 900 }} />
                  </RePieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex-1 space-y-4 w-full">
                {ROLE_DATA.map((role) => (
                  <div key={role.name} className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }} />
                      <span className="text-[10px] font-black text-white uppercase tracking-tight">{role.name}</span>
                    </div>
                    <span className="text-xs font-black text-zinc-500 italic tabular-nums">{role.value}%</span>
                  </div>
                ))}
              </div>
           </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <FeatureStat label="Identity Protect" usage="84%" trend="+5%" icon={Shield} color="blue" />
         <FeatureStat label="Secure File Vault" usage="92%" trend="+12%" icon={Layers} color="purple" />
         <FeatureStat label="Warranty Wallet" usage="41%" trend="-2%" icon={Zap} color="amber" />
      </div>
    </div>
  );
}

function StatCard({ label, value, trend, icon: Icon, color }: any) {
  const colors: any = {
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  };

  return (
    <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl relative group overflow-hidden">
      <div className="absolute top-0 right-0 p-6 opacity-5 transition-opacity group-hover:opacity-10">
        <Icon className="w-16 h-16" />
      </div>
      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <h4 className="text-4xl font-black text-white italic tracking-tighter tabular-nums">{value}</h4>
        <div className={`px-2 py-1 rounded-lg text-[10px] font-black border ${colors[color]}`}>
          {trend}
        </div>
      </div>
    </div>
  );
}

function FeatureStat({ label, usage, trend, icon: Icon, color }: any) {
  return (
    <div className="p-6 bg-zinc-900/40 border border-white/5 rounded-3xl flex items-center justify-between group hover:border-white/10 transition-all">
       <div className="flex items-center gap-4">
         <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
           <Icon className="w-6 h-6 text-zinc-500" />
         </div>
         <div>
           <p className="text-sm font-black text-white uppercase tracking-tight">{label}</p>
           <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">Global Adoption</p>
         </div>
       </div>
       <div className="text-right">
          <p className="text-xl font-black text-white italic tabular-nums">{usage}</p>
          <p className={`text-[8px] font-black uppercase ${trend.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>{trend} YoY</p>
       </div>
    </div>
  );
}

function Clock({ className }: any) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
