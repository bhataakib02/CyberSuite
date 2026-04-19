"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  ShieldCheck, 
  FileText,
  Plus,
  ArrowRight,
  Target,
  Clock
} from 'lucide-react';
import Link from 'next/link';

export default function StudentSafetyToolkit() {
  const [exams, setExams] = useState([
    { id: 1, subject: 'Advanced Cryptography', date: '2026-05-15', time: '10:00 AM' },
    { id: 2, subject: 'Network Security', date: '2026-05-18', time: '02:00 PM' },
  ]);

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">Student Safety Toolkit</h1>
          <p className="text-zinc-500 font-medium tracking-wide">Secure your academic journey and intellectual property.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/files" className="bg-white/5 border border-white/10 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Academic Vault
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Academic Stats */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-blue-500/20">
              <div className="flex items-center justify-between mb-6">
                <Target className="w-8 h-8 opacity-50" />
                <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">Target GPA: 4.0</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-1">Current Academic Standing</p>
              <h2 className="text-5xl font-black tracking-tighter mb-4">3.85</h2>
              <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '96%' }} className="bg-white h-full" />
              </div>
            </div>

            <div className="bg-zinc-900 border border-white/5 p-8 rounded-[2.5rem] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">Secure</span>
              </div>
              <div>
                <p className="text-2xl font-black text-white mt-6 mb-1">9 Encrypted Files</p>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">In Academic Vault</p>
              </div>
            </div>
          </div>

          {/* Exam Schedule */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                <Calendar className="w-6 h-6 text-blue-500" />
                Exam Countdown
              </h3>
              <button className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">View All</button>
            </div>
            
            <div className="space-y-4">
              {exams.map((exam) => (
                <div key={exam.id} className="flex items-center justify-between p-6 bg-black/40 border border-white/5 rounded-3xl group hover:border-white/10 transition-all">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex flex-col items-center justify-center text-zinc-400">
                      <span className="text-xs font-black">{new Date(exam.date).getDate()}</span>
                      <span className="text-[8px] uppercase font-black">{new Date(exam.date).toLocaleString('default', { month: 'short' })}</span>
                    </div>
                    <div>
                      <h4 className="text-white font-bold">{exam.subject}</h4>
                      <p className="text-zinc-500 text-[10px] font-medium uppercase flex items-center gap-1.5 mt-1">
                        <Clock className="w-3 h-3" /> {exam.time}
                      </p>
                    </div>
                  </div>
                  <button className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                    <ArrowRight className="w-5 h-5 text-zinc-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Toolkit Options */}
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/5 rounded-[2.5rem] p-8">
            <h3 className="text-lg font-black text-white mb-6 uppercase tracking-tight">Toolkit Utilities</h3>
            <div className="space-y-3">
              {[
                { label: 'Project Backups', icon: ShieldCheck, color: 'text-blue-500' },
                { label: 'Internship Credentials', icon: FileText, color: 'text-emerald-500' },
                { label: 'Graduation Milestones', icon: GraduationCap, color: 'text-purple-500' },
                { label: 'Academic Citations', icon: BookOpen, color: 'text-amber-500' },
              ].map((item, idx) => (
                <button key={idx} className="w-full flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5 hover:bg-white/5 transition-all group">
                  <div className="flex items-center gap-4">
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                    <span className="text-sm font-bold text-zinc-400 group-hover:text-white transition-colors">{item.label}</span>
                  </div>
                  <Plus className="w-4 h-4 text-zinc-700" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white">
            <h3 className="text-lg font-black uppercase tracking-tight mb-2">Student SOS</h3>
            <p className="text-xs opacity-80 mb-6 font-medium">Instantly notify your campus emergency contacts and share your live location.</p>
            <button className="w-full py-4 bg-white text-blue-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-100 transition-all shadow-xl">
              Trigger SOS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
