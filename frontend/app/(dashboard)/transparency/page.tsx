"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Monitor, 
  Search, 
  Filter,
  Download
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function TransparencyLogs() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await apiFetch('/admin/logs'); // Reusing admin logs for the user's own data
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">Transparency Logs</h1>
          <p className="text-zinc-500 font-medium tracking-wide">Every access request to your secure data is logged here.</p>
        </div>
        <button className="bg-white/5 border border-white/10 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export Audit Trail
        </button>
      </header>

      <div className="bg-zinc-900/50 border border-white/5 rounded-[3rem] overflow-hidden">
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-black/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white font-black text-lg">System Audit</p>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Real-time integrity monitor</p>
            </div>
          </div>
          <div className="flex gap-3">
             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input type="text" placeholder="Search activities..." className="bg-black/40 border border-white/10 rounded-xl pl-12 pr-6 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 w-64" />
             </div>
             <button className="p-3 bg-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-all"><Filter className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black/40 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                <th className="px-8 py-6">Timestamp</th>
                <th className="px-8 py-6">Action Protocol</th>
                <th className="px-8 py-6">Resource ID</th>
                <th className="px-8 py-6">Location/IP</th>
                <th className="px-8 py-6">Device</th>
                <th className="px-8 py-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-zinc-700" />
                      <span className="text-xs text-zinc-400 font-medium">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-xs font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{log.action}</span>
                    <p className="text-[10px] text-zinc-600 font-medium line-clamp-1">{log.details}</p>
                  </td>
                  <td className="px-8 py-6 font-mono text-[10px] text-zinc-500">
                    {log.id.split('-')[0]}...
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-zinc-700" />
                      <span className="text-xs text-zinc-500">{log.ipAddress || 'Internal'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-3 h-3 text-zinc-700" />
                      <span className="text-[10px] text-zinc-600 font-bold uppercase truncate max-w-[120px]" title={log.userAgent}>
                        {log.userAgent?.split(' ')[0] || 'Browser'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className={`text-[8px] font-black px-2 py-1 rounded uppercase ${
                      log.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-500' :
                      log.status === 'FAILURE' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && <div className="p-20 text-center text-zinc-600 font-black uppercase tracking-widest text-xs">No audit records detected in current session.</div>}
        </div>
      </div>
    </div>
  );
}
