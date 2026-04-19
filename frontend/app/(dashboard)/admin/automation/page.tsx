"use client";

import { useState } from 'react';
import { 
  Bot, 
  Zap, 
  Shield, 
  ArrowRight, 
  Plus, 
  Settings2, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Play, 
  Clock,
  Code,
  Layers,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MOCK_RULES = [
  { id: '1', name: 'Brute Force Auto-Block', desc: 'Block IP after 5 failed login attempts', trigger: 'LOGIN_FAILURE', condition: 'count > 5', action: 'BLOCK_IP', isActive: true },
  { id: '2', name: 'Identity Drift Alert', desc: 'Trigger HIGH alert if location jumps > 500km', trigger: 'SESSION_START', condition: 'distance > 500', action: 'CREATE_ALERT', isActive: true },
  { id: '3', name: 'Sensitive Data Cleanup', desc: 'Archive audit logs older than 90 days', trigger: 'SCHEDULED_DAILY', condition: 'age > 90d', action: 'ARCHIVE_DATA', isActive: false },
];

export default function AutomationRulesPage() {
  const [rules, setRules] = useState(MOCK_RULES);

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
              <Bot className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Automation <span className="text-zinc-600">Synthesizer</span></h1>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1 pl-0.5">Autonomous Security Response • Signal-to-Action Pipeline</p>
            </div>
          </div>
        </div>

        <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95">
          <Plus className="w-4 h-4" />
          Program Neural Rule
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
           {rules.map((rule) => (
             <motion.div
               key={rule.id}
               className={`p-8 rounded-[2.5rem] border backdrop-blur-xl transition-all relative overflow-hidden group ${
                 rule.isActive ? 'bg-zinc-900/40 border-white/5' : 'bg-black/20 border-white/[0.02] opacity-60'
               }`}
             >
               <div className="flex items-start justify-between relative z-10">
                 <div className="flex gap-6">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${
                     rule.isActive ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-zinc-800 text-zinc-600 border-white/5'
                   }`}>
                     <Zap className="w-7 h-7" />
                   </div>
                   <div className="space-y-1">
                      <h3 className="text-xl font-black text-white uppercase tracking-tight italic">{rule.name}</h3>
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{rule.desc}</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div 
                      onClick={() => toggleRule(rule.id)}
                      className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all ${rule.isActive ? 'bg-blue-600' : 'bg-zinc-800'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${rule.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                    <button className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-zinc-500 hover:text-white"><Settings2 className="w-5 h-5" /></button>
                 </div>
               </div>

               <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-white/5">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Trigger Source</p>
                    <div className="flex items-center gap-2 text-xs font-black text-white uppercase italic">
                      <Layers className="w-3.5 h-3.5 text-blue-500" />
                      {rule.trigger}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Logic Condition</p>
                    <div className="flex items-center gap-2 text-xs font-black text-blue-400 uppercase italic tabular-nums">
                      <Code className="w-3.5 h-3.5" />
                      {rule.condition}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Mitigation Action</p>
                    <div className="flex items-center gap-2 text-xs font-black text-emerald-500 uppercase italic">
                      <Play className="w-3.5 h-3.5" />
                      {rule.action}
                    </div>
                  </div>
               </div>
             </motion.div>
           ))}
        </div>

        <div className="space-y-6">
           <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl">
             <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6">Automation Analytics</h3>
             <div className="space-y-6">
               <AutoMetric label="Total Executions" value="1,284" trend="+12%" icon={Play} />
               <AutoMetric label="Threats Stopped" value="482" trend="+5%" icon={Shield} color="emerald" />
               <AutoMetric label="Human Hours Saved" value="84h" trend="+8h" icon={Clock} color="blue" />
             </div>
           </div>

           <div className="p-8 bg-amber-500/5 border border-amber-500/10 rounded-[2.5rem] space-y-4">
             <div className="flex items-center gap-2 text-amber-500">
               <AlertTriangle className="w-5 h-5" />
               <span className="text-[10px] font-black uppercase tracking-widest">Active Conflict</span>
             </div>
             <p className="text-[9px] text-zinc-500 font-bold leading-relaxed uppercase">2 rules are currently in overlap conflict. Admin intervention suggested to prevent protocol deadlock.</p>
             <button className="w-full py-3 bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase rounded-xl border border-amber-500/20">Resolve Conflicts</button>
           </div>
        </div>
      </div>
    </div>
  );
}

function AutoMetric({ label, value, trend, icon: Icon, color = 'zinc' }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Icon className={`w-4 h-4 text-zinc-500`} />
        <div>
          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest leading-none">{label}</p>
          <p className="text-lg font-black text-white italic tabular-nums mt-1">{value}</p>
        </div>
      </div>
      <span className="text-[10px] font-black text-emerald-500 italic">{trend}</span>
    </div>
  );
}
