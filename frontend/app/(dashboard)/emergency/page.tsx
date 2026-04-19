"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, 
  QrCode, 
  HeartPulse, 
  Activity, 
  Phone, 
  Share2,
  Copy,
  Download,
  AlertTriangle,
  Lock,
  Edit3
} from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';

export default function EmergencyDashboard() {
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const emergencyUrl = `https://cybersuite.local/emergency/${user?.id || 'demo-id'}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(emergencyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2 flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-red-500" />
            Emergency Protocol
          </h1>
          <p className="text-zinc-500 font-medium tracking-wide">Manage your critical medical profile and emergency access.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-red-500 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-600 transition-all flex items-center gap-2 shadow-xl shadow-red-500/20">
            <AlertTriangle className="w-4 h-4" />
            Trigger SOS Alert
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: ID & QR */}
        <div className="space-y-6">
          <div className="bg-gradient-to-b from-red-600 to-red-900 border border-red-500/30 rounded-[2.5rem] p-8 text-center relative overflow-hidden shadow-2xl shadow-red-500/10">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />
            
            <HeartPulse className="w-12 h-12 text-white mx-auto mb-4 animate-pulse" />
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">Medical ID Card</h2>
            <p className="text-red-200 text-xs font-bold uppercase tracking-widest mb-8">Scan for vital info</p>

            <div className="bg-white p-6 rounded-3xl w-48 h-48 mx-auto mb-8 shadow-2xl flex items-center justify-center">
              {/* Placeholder for actual QR code component */}
              <QrCode className="w-32 h-32 text-black" />
            </div>

            <div className="bg-black/20 rounded-2xl p-4 flex items-center justify-between border border-white/10 backdrop-blur-md">
              <span className="text-[10px] font-bold text-red-100 truncate flex-1 text-left mr-4">
                {emergencyUrl}
              </span>
              <button 
                onClick={handleCopy}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white shrink-0"
              >
                {copied ? <span className="text-[10px] font-black uppercase">Copied!</span> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <button className="py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 border border-white/5">
                <Download className="w-4 h-4" /> Save
              </button>
              <button className="py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 border border-white/5">
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>
          </div>

          <div className="bg-zinc-900 border border-white/5 rounded-[2rem] p-6 text-center">
            <Lock className="w-6 h-6 text-zinc-500 mx-auto mb-3" />
            <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-2">Privacy Guardian Active</h3>
            <p className="text-xs text-zinc-500">Only essential medical data is shared. Personal vault remains locked.</p>
          </div>
        </div>

        {/* Right Column: Profile Data */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                <Activity className="w-6 h-6 text-emerald-500" />
                Vital Information
              </h3>
              <button className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                <Edit3 className="w-4 h-4 text-zinc-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-black/40 border border-white/5 rounded-2xl p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Blood Group</p>
                <p className="text-2xl font-black text-red-500 tracking-tighter">{user?.bloodGroup || 'O+'}</p>
              </div>
              <div className="bg-black/40 border border-white/5 rounded-2xl p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Organ Donor</p>
                <p className="text-2xl font-black text-emerald-500 tracking-tighter">Registered</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Allergies</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg">Penicillin</span>
                  <span className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg">Peanuts</span>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Chronic Conditions</p>
                <div className="bg-black/40 border border-white/5 rounded-2xl p-4 text-zinc-300 text-sm font-medium">
                  {user?.chronicConditions || 'Type 1 Diabetes, Asthma'}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                <Phone className="w-6 h-6 text-blue-500" />
                Emergency Contacts
              </h3>
              <button className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors">
                + Add Contact
              </button>
            </div>

            <div className="space-y-4">
              {[
                { name: 'Sarah Connor', relation: 'Spouse', phone: '+1 (555) 019-2834' },
                { name: 'Dr. James Wilson', relation: 'Primary Care', phone: '+1 (555) 882-1044' }
              ].map((contact, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl group hover:border-white/10 transition-colors">
                  <div>
                    <h4 className="text-white font-bold">{contact.name}</h4>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">{contact.relation}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-zinc-400 font-medium text-sm hidden md:block">{contact.phone}</span>
                    <button className="p-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-xl transition-colors">
                      <Phone className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
