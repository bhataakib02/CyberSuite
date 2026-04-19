"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Stethoscope, 
  Scale, 
  Search, 
  Star, 
  ShieldCheck, 
  MapPin, 
  MessageSquare,
  Calendar,
  Filter,
  ArrowRight,
  Clock,
  Briefcase
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function ProfessionalDiscovery() {
  const [activeTab, setActiveTab] = useState<'DOCTOR' | 'LAWYER'>('DOCTOR');
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfessionals();
  }, [activeTab]);

  const fetchProfessionals = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/consultation/professionals?type=${activeTab}`);
      if (res.ok) {
        const data = await res.json();
        setProfessionals(data.professionals);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <header className="space-y-4">
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Verified Professionals</h1>
        <p className="text-zinc-500 font-medium tracking-wide">Secure E2EE consultations with top-tier medical and legal experts.</p>
        
        <div className="flex flex-col md:flex-row gap-4 pt-4">
           <div className="flex bg-zinc-900 p-1.5 rounded-2xl border border-white/5">
             <button 
              onClick={() => setActiveTab('DOCTOR')}
              className={`flex items-center gap-3 px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${activeTab === 'DOCTOR' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-zinc-500 hover:text-white'}`}
             >
               <Stethoscope className="w-4 h-4" /> Doctors
             </button>
             <button 
              onClick={() => setActiveTab('LAWYER')}
              className={`flex items-center gap-3 px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${activeTab === 'LAWYER' ? 'bg-purple-600 text-white shadow-xl shadow-purple-600/20' : 'text-zinc-500 hover:text-white'}`}
             >
               <Scale className="w-4 h-4" /> Lawyers
             </button>
           </div>

           <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input type="text" placeholder={`Search ${activeTab.toLowerCase()}s by name or specialty...`} className="w-full bg-zinc-900 border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50" />
           </div>
           
           <button className="p-4 bg-zinc-900 border border-white/5 rounded-2xl text-zinc-500 hover:text-white transition-all"><Filter className="w-5 h-5" /></button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="wait">
          {loading ? (
             Array.from({length: 6}).map((_, i) => (
                <div key={i} className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] h-64 animate-pulse" />
             ))
          ) : professionals.map((prof) => (
            <motion.div 
              key={prof.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-white/5 rounded-[2.5rem] p-8 group hover:border-white/10 transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5">
                {prof.type === 'DOCTOR' ? <Stethoscope className="w-24 h-24" /> : <Scale className="w-24 h-24" />}
              </div>

              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-white/5 flex items-center justify-center text-zinc-500 text-2xl font-black">
                   {prof.user.name.charAt(0)}
                </div>
                <div className="flex items-center gap-1 bg-black/40 px-3 py-1.5 rounded-full border border-white/5">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span className="text-[10px] font-black text-white">{prof.rating || '4.9'}</span>
                </div>
              </div>

              <div className="space-y-2 relative z-10">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-white tracking-tight">{prof.user.name}</h3>
                  {prof.isVerified && <ShieldCheck className="w-4 h-4 text-blue-500" />}
                </div>
                <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest">{prof.specialization}</p>
                <div className="flex flex-wrap gap-4 pt-4">
                   <div className="flex items-center gap-2 text-zinc-500">
                     <Clock className="w-3 h-3" />
                     <span className="text-[10px] font-bold">{prof.experience} Years Exp.</span>
                   </div>
                   <div className="flex items-center gap-2 text-zinc-500">
                     <Briefcase className="w-3 h-3" />
                     <span className="text-[10px] font-bold">${prof.fee} / session</span>
                   </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-white/5 flex gap-3 relative z-10">
                <button className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Chat
                </button>
                <button className="flex-1 bg-white text-black py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2">
                  <Calendar className="w-4 h-4" /> Book
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {!loading && professionals.length === 0 && (
         <div className="py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-zinc-700">
               <Search className="w-10 h-10" />
            </div>
            <p className="text-zinc-600 font-black uppercase tracking-widest text-xs">No verified {activeTab.toLowerCase()}s found in your region.</p>
         </div>
      )}
    </div>
  );
}
