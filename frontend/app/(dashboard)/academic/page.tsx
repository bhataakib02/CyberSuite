"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Search, 
  FlaskConical, 
  Library,
  ChevronRight,
  Database,
  FileText,
  Bookmark,
  Share2
} from 'lucide-react';
import Link from 'next/link';

export default function AcademicDashboard() {
  const [researchPapers, setResearchPapers] = useState([
    { id: 'RP-01', title: 'Zero-Knowledge Proofs in Distributed Systems', journal: 'IEEE Security & Privacy', status: 'PUBLISHED', date: '2026-03-10' },
    { id: 'RP-02', title: 'Post-Quantum Cryptography Benchmarks', journal: 'ACM CCS', status: 'UNDER_REVIEW', date: '2026-04-05' },
    { id: 'RP-03', title: 'Homomorphic Encryption for EHRs', journal: 'Drafting', status: 'DRAFT', date: '2026-04-18' },
  ]);

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-purple-500" />
            Academic Research Hub
          </h1>
          <p className="text-zinc-500 font-medium tracking-wide">Secure repository for research data and publications.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/files" className="bg-purple-500/10 border border-purple-500/20 text-purple-400 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-purple-500/20 transition-all flex items-center gap-2">
            <Database className="w-4 h-4" />
            Research Vault
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Publications */}
        <div className="lg:col-span-2 space-y-8">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/5 p-6 rounded-[2rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <FileText className="w-16 h-16 text-purple-500" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">Total Publications</p>
              <h2 className="text-4xl font-black text-white tracking-tighter">24</h2>
            </div>
            
            <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/5 p-6 rounded-[2rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Search className="w-16 h-16 text-blue-500" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">Citations</p>
              <h2 className="text-4xl font-black text-white tracking-tighter">1,204</h2>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-indigo-800 p-6 rounded-[2rem] shadow-2xl shadow-purple-500/20 relative overflow-hidden">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-200 mb-2">Active Projects</p>
              <h2 className="text-4xl font-black text-white tracking-tighter">4</h2>
              <p className="text-xs text-purple-300 font-bold uppercase mt-2">2 Seeking Funding</p>
            </div>
          </div>

          {/* Research Papers List */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                <FlaskConical className="w-6 h-6 text-purple-500" />
                Current Research
              </h3>
            </div>
            
            <div className="space-y-4">
              {researchPapers.map((paper) => (
                <div key={paper.id} className="flex items-center justify-between p-5 bg-black/40 border border-white/5 rounded-3xl group hover:border-purple-500/30 transition-all cursor-pointer">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 font-black text-xs">
                      <Library className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm tracking-tight">{paper.title}</h4>
                      <p className="text-zinc-500 text-[10px] font-black uppercase flex items-center gap-2 mt-1">
                        <span className="text-zinc-400">{paper.journal}</span>
                        <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                        <span>Updated: {new Date(paper.date).toLocaleDateString()}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                      paper.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                      paper.status === 'UNDER_REVIEW' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                      'bg-zinc-800 text-zinc-400 border-white/5'
                    }`}>
                      {paper.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-4 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-white/5 transition-all">
              View All Publications
            </button>
          </div>
        </div>

        {/* Right Column: Utilities */}
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/5 rounded-[2.5rem] p-8">
            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-6">Quick Tools</h3>
            
            <div className="space-y-3">
              {[
                { name: 'Dataset Vault', icon: Database, color: 'text-blue-500' },
                { name: 'Literature Review', icon: Bookmark, color: 'text-emerald-500' },
                { name: 'Collaborator Access', icon: Share2, color: 'text-purple-500' },
              ].map((tool, idx) => (
                <button key={idx} className="w-full flex items-center gap-4 p-4 bg-black/20 rounded-2xl border border-white/5 hover:bg-white/5 transition-all group">
                  <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 ${tool.color}`}>
                    <tool.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-zinc-400 group-hover:text-white transition-colors flex-1 text-left">{tool.name}</span>
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                </button>
              ))}
            </div>
            
            <button className="w-full mt-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2">
              <FileText className="w-3 h-3 text-purple-500" />
              New Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
