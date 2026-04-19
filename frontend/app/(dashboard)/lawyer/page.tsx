"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Scale, 
  Briefcase, 
  FileSignature, 
  MessageSquare,
  Users,
  Clock,
  ChevronRight,
  ShieldAlert,
  Search,
  Filter
} from 'lucide-react';
import Link from 'next/link';

export default function LawyerDashboard() {
  const [activeCases, setActiveCases] = useState([
    { id: 'CAS-1042', title: 'Corporate Restructuring vs. Apex Corp', client: 'Apex Corp', status: 'IN_PROGRESS', nextHearing: '2026-05-12' },
    { id: 'CAS-1045', title: 'Intellectual Property Dispute', client: 'TechNova', status: 'REVIEW', nextHearing: '2026-05-20' },
    { id: 'CAS-1050', title: 'Data Breach Liability Defense', client: 'GlobalNet', status: 'PENDING', nextHearing: '2026-06-01' },
  ]);

  const [recentDocs, setRecentDocs] = useState([
    { id: 1, name: 'Non-Disclosure Agreement_v2.pdf', type: 'Contract', date: '2026-04-18' },
    { id: 2, name: 'Subpoena_Response_Draft.docx', type: 'Litigation', date: '2026-04-17' },
    { id: 3, name: 'Client_Affidavit_Signed.pdf', type: 'Evidence', date: '2026-04-15' },
  ]);

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2 flex items-center gap-3">
            <Scale className="w-8 h-8 text-amber-500" />
            Legal Practice Hub
          </h1>
          <p className="text-zinc-500 font-medium tracking-wide">Zero-Trust Case Management & Secure Client Communication.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/contracts" className="bg-amber-500/10 border border-amber-500/20 text-amber-500 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-500/20 transition-all flex items-center gap-2">
            <FileSignature className="w-4 h-4" />
            Digital Signatures
          </Link>
          <Link href="/chat" className="bg-white/5 border border-white/10 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Client Chat
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Case Management */}
        <div className="lg:col-span-2 space-y-8">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/5 p-6 rounded-[2rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Briefcase className="w-16 h-16 text-amber-500" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">Active Cases</p>
              <h2 className="text-4xl font-black text-white tracking-tighter">14</h2>
            </div>
            
            <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/5 p-6 rounded-[2rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Users className="w-16 h-16 text-blue-500" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">Active Clients</p>
              <h2 className="text-4xl font-black text-white tracking-tighter">28</h2>
            </div>

            <div className="bg-gradient-to-br from-amber-600 to-amber-800 p-6 rounded-[2rem] shadow-2xl shadow-amber-500/20 relative overflow-hidden">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200 mb-2">Upcoming Hearings</p>
              <h2 className="text-4xl font-black text-white tracking-tighter">3</h2>
              <p className="text-xs text-amber-300 font-bold uppercase mt-2">Next in 12 days</p>
            </div>
          </div>

          {/* Active Cases List */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                <Briefcase className="w-6 h-6 text-amber-500" />
                Case Management
              </h3>
              <div className="flex gap-2">
                <button className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <Search className="w-4 h-4 text-zinc-400" />
                </button>
                <button className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <Filter className="w-4 h-4 text-zinc-400" />
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              {activeCases.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-5 bg-black/40 border border-white/5 rounded-3xl group hover:border-amber-500/30 transition-all cursor-pointer">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-black text-xs">
                      {c.id.split('-')[1]}
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm tracking-tight">{c.title}</h4>
                      <p className="text-zinc-500 text-[10px] font-black uppercase flex items-center gap-2 mt-1">
                        <span className="text-zinc-400">{c.client}</span>
                        <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                        <Clock className="w-3 h-3" /> Next Hearing: {new Date(c.nextHearing).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                      c.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                      c.status === 'REVIEW' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                      'bg-zinc-800 text-zinc-400 border-white/5'
                    }`}>
                      {c.status.replace('_', ' ')}
                    </span>
                    <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-amber-500 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-4 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-white/5 transition-all">
              View All Cases
            </button>
          </div>
        </div>

        {/* Right Column: Utilities */}
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/5 rounded-[2.5rem] p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Recent Documents</h3>
              <Link href="/files" className="text-[10px] font-black text-amber-500 uppercase tracking-widest hover:text-amber-400">Vault</Link>
            </div>
            
            <div className="space-y-4">
              {recentDocs.map((doc) => (
                <div key={doc.id} className="flex items-start gap-4 p-4 bg-black/20 rounded-2xl border border-white/5 hover:border-white/10 transition-colors cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                    <FileSignature className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{doc.type}</span>
                      <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                      <span className="text-[9px] font-bold text-zinc-600 uppercase">{new Date(doc.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2">
              <ShieldAlert className="w-3 h-3 text-emerald-500" />
              Upload Encrypted Doc
            </button>
          </div>

          <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full" />
            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">Secure Consultation</h3>
            <p className="text-xs text-zinc-400 font-medium mb-6">End-to-end encrypted video and chat for confidential client meetings.</p>
            <Link href="/consultation" className="block w-full py-4 text-center bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-zinc-200 transition-all shadow-xl">
              Start Session
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
