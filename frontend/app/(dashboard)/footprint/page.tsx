"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Fingerprint, 
  Search, 
  ShieldAlert, 
  Globe, 
  Mail, 
  ExternalLink,
  Lock,
  Zap
} from 'lucide-react';

export default function DigitalFootprintTracker() {
  const [leaks, setLeaks] = useState([
    { id: 1, site: 'Adobe (2013)', status: 'COMPROMISED', date: 'Oct 2013', impact: 'Email, Password' },
    { id: 2, site: 'LinkedIn (2016)', status: 'COMPROMISED', date: 'May 2016', impact: 'Email, Password Hash' },
    { id: 3, site: 'Canva (2019)', status: 'COMPROMISED', date: 'May 2019', impact: 'Name, Username, Email' },
  ]);

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto">
      <header>
        <div className="flex items-center gap-4 mb-2">
          <Fingerprint className="w-10 h-10 text-blue-500" />
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Digital Footprint Tracker</h1>
        </div>
        <p className="text-zinc-500 font-medium tracking-wide">Monitor your exposure across the clear, deep, and dark web.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Exposure Summary */}
          <div className="bg-zinc-900 border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Globe className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <h3 className="text-lg font-black text-white uppercase tracking-tight mb-8">Identity Exposure Report</h3>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Breach Count</p>
                  <p className="text-4xl font-black text-red-500">12</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Data Points</p>
                  <p className="text-4xl font-black text-white">47</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Risk Level</p>
                  <p className="text-4xl font-black text-amber-500">HIGH</p>
                </div>
              </div>
            </div>
          </div>

          {/* Breach List */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                <ShieldAlert className="w-6 h-6 text-red-500" />
                Historical Breaches
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input type="text" placeholder="Search sitename..." className="bg-black/40 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50" />
              </div>
            </div>

            <div className="space-y-4">
              {leaks.map((leak) => (
                <div key={leak.id} className="flex items-center justify-between p-6 bg-black/40 border border-white/5 rounded-3xl group hover:border-red-500/20 transition-all">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-500">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold">{leak.site}</h4>
                      <p className="text-zinc-500 text-[10px] font-medium uppercase tracking-widest mt-1">Impact: {leak.impact}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] font-black uppercase px-2 py-1 bg-red-500/10 text-red-500 rounded border border-red-500/10">{leak.status}</span>
                    <p className="text-[10px] text-zinc-600 mt-2 font-bold">{leak.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-blue-500/40">
            <Zap className="w-8 h-8 mb-6" />
            <h3 className="text-xl font-black uppercase tracking-tight mb-2">Auto-Rotate Passwords</h3>
            <p className="text-xs opacity-80 mb-8 font-medium leading-relaxed">CyberSuite can automatically rotate passwords for supported services if they appear in new breaches.</p>
            <button className="w-full py-4 bg-white text-blue-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-100 transition-all">
              Enable Auto-Rotation
            </button>
          </div>

          <div className="bg-zinc-900 border border-white/5 rounded-[2.5rem] p-8">
            <h3 className="text-lg font-black text-white mb-6 uppercase tracking-tight">Active Protocols</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-zinc-400">
                <div className="flex items-center gap-3">
                  <Lock className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-bold">Privacy Masking</span>
                </div>
                <div className="w-10 h-5 bg-blue-600 rounded-full flex items-center px-1">
                  <div className="w-3 h-3 bg-white rounded-full ml-auto" />
                </div>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-bold">Public Profile Blur</span>
                </div>
                <div className="w-10 h-5 bg-zinc-800 rounded-full flex items-center px-1">
                  <div className="w-3 h-3 bg-zinc-600 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
