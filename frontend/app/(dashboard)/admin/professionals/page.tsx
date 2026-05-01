"use client";

import { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Scale, 
  UserCheck, 
  UserX, 
  Clock, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  Shield,
  Briefcase,
  AlertCircle,
  Eye,
  Download,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';

interface Professional {
  id: string;
  specialization: string;
  licenseNumber: string;
  organization: string;
  status: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export default function ProfessionalVerificationPage() {
  const [profiles, setProfiles] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING');

  const fetchProfiles = async () => {
    try {
      const res = await apiFetch('/admin/pending-verifications'); // Reusing existing or I'll expand it
      if (res.ok) {
        const d = await res.json();
        const data = d.data || d;
        setProfiles(data.profiles || []);
      }
    } catch (err) {
      console.error('Failed to fetch professional profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleVerify = async (id: string, action: string) => {
    try {
      const res = await apiFetch(`/admin/verify-professional/${id}`, {
        method: 'POST',
        body: JSON.stringify({ action })
      });
      if (res.ok) fetchProfiles();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = profiles.filter(p => activeTab === 'ALL' || p.status === activeTab);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20">
              <UserCheck className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Credential <span className="text-zinc-600">Validator</span></h1>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1 pl-0.5">Professional Trust Architecture • Docu-Audit Engine</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 bg-zinc-900/40 p-1.5 rounded-2xl border border-white/5">
          {['PENDING', 'VERIFIED', 'REJECTED', 'ALL'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-zinc-500 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence>
          {filtered.map((profile) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-zinc-900/40 border border-white/5 rounded-[3rem] p-8 backdrop-blur-xl relative overflow-hidden group hover:border-purple-500/30 transition-all"
            >
              <div className="flex flex-col lg:flex-row gap-10">
                <div className="flex-1 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-black text-2xl text-white shadow-2xl">
                        {profile.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">{profile.user.name}</h3>
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1">{profile.user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                         profile.user.role === 'DOCTOR' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                       }`}>
                         {profile.user.role}
                       </span>
                       <p className="text-[10px] font-black text-zinc-600 uppercase mt-2 tracking-tighter">Applied: {new Date(profile.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-black/40 p-6 rounded-[2rem] border border-white/5">
                    <DataPoint icon={Briefcase} label="Field / Specialization" value={profile.specialization} />
                    <DataPoint icon={FileText} label="License ID" value={profile.licenseNumber} />
                    <DataPoint icon={Shield} label="Organization" value={profile.organization} />
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Submitted Documentation</p>
                    <div className="flex gap-3">
                      <DocCard name="Proof of Identity.pdf" size="2.4 MB" />
                      <DocCard name="Medical_License_2025.jpg" size="4.1 MB" />
                      <DocCard name="Board_Certification.pdf" size="1.8 MB" />
                    </div>
                  </div>
                </div>

                <div className="w-full lg:w-[280px] bg-black/40 rounded-[2.5rem] p-8 border border-white/5 flex flex-col justify-between">
                  <div>
                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-6">Validation Panel</h4>
                    <div className="space-y-3">
                      <ActionButton 
                        label="Verify Credentials" 
                        icon={CheckCircle2} 
                        color="emerald" 
                        onClick={() => handleVerify(profile.id, 'APPROVE')} 
                        disabled={profile.status !== 'PENDING' && profile.status !== 'UNDER_REVIEW'}
                      />
                      <ActionButton 
                        label="Request Clarification" 
                        icon={Info} 
                        color="blue" 
                        onClick={() => handleVerify(profile.id, 'QUERY')} 
                        disabled={profile.status !== 'PENDING' && profile.status !== 'UNDER_REVIEW'}
                      />
                      <ActionButton 
                        label="Reject Identity" 
                        icon={XCircle} 
                        color="red" 
                        onClick={() => handleVerify(profile.id, 'REJECT')} 
                        disabled={profile.status !== 'PENDING' && profile.status !== 'UNDER_REVIEW'}
                      />
                      {(profile.status === 'VERIFIED' || profile.status === 'REJECTED') && (
                        <ActionButton 
                          label="Restore to Audit" 
                          icon={Clock} 
                          color="zinc" 
                          onClick={() => handleVerify(profile.id, 'RESTORE')} 
                        />
                      )}
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/5">
                    <div className="flex items-center gap-2 text-[10px] font-black text-zinc-600 uppercase italic">
                      <Shield className="w-3 h-3" />
                      Zero-Knowledge Audit OK
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && !loading && (
          <div className="p-20 text-center bg-zinc-900/20 rounded-[3rem] border border-dashed border-white/5">
            <UserCheck className="w-16 h-16 text-zinc-800 mx-auto mb-6" />
            <h4 className="text-xl font-black text-zinc-600 uppercase tracking-tighter">No Active Applications</h4>
            <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] mt-2">Professional trust pool is stable</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DataPoint({ icon: Icon, label, value }: any) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="w-3 h-3 text-zinc-500" />
        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-sm font-black text-white uppercase tracking-tight">{value}</p>
    </div>
  );
}

function DocCard({ name, size }: any) {
  return (
    <div className="flex-1 min-w-[140px] p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-purple-500/30 transition-all cursor-pointer group">
      <div className="flex items-center justify-between mb-3">
        <FileText className="w-5 h-5 text-purple-500" />
        <Download className="w-3 h-3 text-zinc-600 group-hover:text-white transition-colors" />
      </div>
      <p className="text-[10px] font-black text-white truncate uppercase">{name}</p>
      <p className="text-[8px] font-bold text-zinc-600 mt-1 uppercase">{size}</p>
    </div>
  );
}

function ActionButton({ label, icon: Icon, color, onClick, disabled }: any) {
  const colors: any = {
    emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-white shadow-emerald-500/10',
    red: 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white shadow-red-500/10',
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500 hover:text-white shadow-blue-500/10',
    zinc: 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white hover:text-black',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border disabled:opacity-20 disabled:cursor-not-allowed group shadow-lg ${colors[color]}`}
    >
      <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
      {label}
    </button>
  );
}
