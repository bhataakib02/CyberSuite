"use client";

import { useState } from 'react';
import { 
  Settings, 
  Shield, 
  Lock, 
  Bell, 
  Globe, 
  Database, 
  Zap, 
  UserCog, 
  Key, 
  Monitor,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  Cpu,
  Server
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminSettingsPage() {
  const [activeSection, setActiveSection] = useState('GENERAL');

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-zinc-500/10 rounded-2xl flex items-center justify-center border border-white/10">
              <Settings className="w-6 h-6 text-zinc-400" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">System <span className="text-zinc-600">Config</span></h1>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1 pl-0.5">Core Parameters • Environmental Variables</p>
            </div>
          </div>
        </div>

        <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95">
          <Save className="w-4 h-4" />
          Synchronize Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         <div className="lg:col-span-1 space-y-2">
            <NavBtn id="GENERAL" icon={Monitor} label="Console Prefs" active={activeSection === 'GENERAL'} onClick={() => setActiveSection('GENERAL')} />
            <NavBtn id="SECURITY" icon={Shield} label="Security Core" active={activeSection === 'SECURITY'} onClick={() => setActiveSection('SECURITY')} />
            <NavBtn id="API" icon={Zap} label="API Gateways" active={activeSection === 'API'} onClick={() => setActiveSection('API')} />
            <NavBtn id="DATABASE" icon={Database} label="Data Storage" active={activeSection === 'DATABASE'} onClick={() => setActiveSection('DATABASE')} />
            <NavBtn id="AUTH" icon={Lock} label="Access Control" active={activeSection === 'AUTH'} onClick={() => setActiveSection('AUTH')} />
            <NavBtn id="INFRA" icon={Server} label="Infrastructure" active={activeSection === 'INFRA'} onClick={() => setActiveSection('INFRA')} />
         </div>

         <div className="lg:col-span-3">
            <div className="bg-zinc-900/40 border border-white/5 rounded-[3rem] p-10 backdrop-blur-xl space-y-12">
               {activeSection === 'GENERAL' && (
                 <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                    <section className="space-y-6">
                      <h3 className="text-xl font-black text-white uppercase italic tracking-tight flex items-center gap-3">
                        <Monitor className="w-5 h-5 text-blue-500" />
                        Dashboard <span className="text-zinc-600">Appearance</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <ToggleOption label="Real-time Telemetry" desc="Enable sub-second UI updates for heatmaps" defaultOn />
                         <ToggleOption label="Compact Grid Layout" desc="Maximize data density on larger screens" />
                         <ToggleOption label="Sound Alerts" desc="Trigger audio notifications for critical sigs" defaultOn />
                         <ToggleOption label="Developer Mode" desc="Expose raw JSON payloads in audit logs" />
                      </div>
                    </section>

                    <section className="space-y-6 pt-10 border-t border-white/5">
                      <h3 className="text-xl font-black text-white uppercase italic tracking-tight flex items-center gap-3">
                        <Globe className="w-5 h-5 text-emerald-500" />
                        Localization <span className="text-zinc-600">& Time</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Primary Timezone</label>
                            <select className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs font-black text-white uppercase tracking-widest outline-none focus:border-blue-500/50 transition-all">
                               <option>UTC (Coordinated Universal Time)</option>
                               <option>EST (Eastern Standard Time)</option>
                               <option>PST (Pacific Standard Time)</option>
                            </select>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Date Format</label>
                            <select className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs font-black text-white uppercase tracking-widest outline-none focus:border-blue-500/50 transition-all">
                               <option>ISO 8601 (YYYY-MM-DD)</option>
                               <option>US (MM/DD/YYYY)</option>
                               <option>UK (DD/MM/YYYY)</option>
                            </select>
                         </div>
                      </div>
                    </section>
                 </motion.div>
               )}

               {activeSection === 'SECURITY' && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                     <section className="space-y-6">
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tight flex items-center gap-3">
                          <Shield className="w-5 h-5 text-red-500" />
                          Hardening <span className="text-zinc-600">Parameters</span>
                        </h3>
                        <div className="grid grid-cols-1 gap-6">
                           <InputOption label="Root Admin Token Rotation" desc="Days before master security keys expire" type="number" val="30" />
                           <ToggleOption label="Enforce Hardware MFA" desc="Only allow physical security keys for admin access" defaultOn />
                           <ToggleOption label="IP Whitelisting" desc="Restrict console access to verified CIDR ranges" />
                        </div>
                     </section>
                  </motion.div>
               )}

               {/* Placeholder for other sections */}
               {activeSection !== 'GENERAL' && activeSection !== 'SECURITY' && (
                 <div className="py-20 text-center space-y-4">
                   <RefreshCw className="w-12 h-12 text-zinc-700 animate-spin mx-auto" />
                   <p className="text-zinc-500 font-black uppercase tracking-widest text-[10px]">Loading section configuration...</p>
                 </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
}

function NavBtn({ id, icon: Icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl border transition-all text-left group ${
        active ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' : 'bg-zinc-900/40 border-white/5 text-zinc-500 hover:bg-white/5'
      }`}
    >
      <Icon className={`w-5 h-5 transition-transform ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
      <span className="text-xs font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}

function ToggleOption({ label, desc, defaultOn = false }: any) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-start justify-between gap-6 p-6 bg-black/40 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all">
       <div className="space-y-1">
         <p className="text-sm font-black text-white uppercase tracking-tight italic">{label}</p>
         <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-relaxed">{desc}</p>
       </div>
       <div 
        onClick={() => setOn(!on)}
        className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all shrink-0 ${on ? 'bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-zinc-800'}`}
       >
         <div className={`w-4 h-4 bg-white rounded-full transition-transform ${on ? 'translate-x-6' : 'translate-x-0'}`} />
       </div>
    </div>
  );
}

function InputOption({ label, desc, type = 'text', val }: any) {
  return (
    <div className="flex items-center justify-between gap-6 p-8 bg-black/40 rounded-[2.5rem] border border-white/5 hover:border-white/10 transition-all">
       <div className="space-y-1">
         <p className="text-sm font-black text-white uppercase tracking-tight italic">{label}</p>
         <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-relaxed">{desc}</p>
       </div>
       <input 
        type={type} 
        defaultValue={val}
        className="bg-black border border-white/10 rounded-xl px-4 py-3 text-xs font-black text-white uppercase tabular-nums w-24 outline-none focus:border-blue-500/50 transition-all text-center"
       />
    </div>
  );
}
