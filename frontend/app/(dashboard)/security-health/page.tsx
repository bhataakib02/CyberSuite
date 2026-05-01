"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Zap, 
  Target, 
  Award, 
  Key, 
  Fingerprint, 
  Users, 
  ChevronRight,
  CheckCircle2,
  Lock,
  Smartphone
} from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { apiFetch } from '../../../lib/api';
import Link from 'next/link';

export default function SecurityHealthPage() {
  const { user } = useAuthStore();
  const [score, setScore] = useState(0);
  const [quests, setQuests] = useState<any[]>([]);

  useEffect(() => {
    calculateSecurityHealth();
  }, [user]);

  const calculateSecurityHealth = () => {
    let currentScore = 10; // Base score
    const newQuests = [];

    // 2FA Quest
    if (user?.twoFAEnabled) {
      currentScore += 30;
      newQuests.push({ id: '2fa', title: 'Biometric 2FA Enabled', completed: true, points: 30, icon: Smartphone, path: '/identity' });
    } else {
      newQuests.push({ id: '2fa', title: 'Secure with 2FA', completed: false, points: 30, icon: Smartphone, path: '/identity' });
    }

    // WebAuthn Quest
    if ((user as any)?.authenticators?.length > 0) {
      currentScore += 30;
      newQuests.push({ id: 'webauthn', title: 'Hardware Key Registered', completed: true, points: 30, icon: Fingerprint, path: '/identity' });
    } else {
      newQuests.push({ id: 'webauthn', title: 'Add Security Key', completed: false, points: 30, icon: Fingerprint, path: '/identity' });
    }

    // Legacy Sharding Quest
    if ((user as any)?.trustedContacts?.length >= 3) {
      currentScore += 30;
      newQuests.push({ id: 'sss', title: 'Legacy Protocol Primed', completed: true, points: 30, icon: Users, path: '/vault' });
    } else {
      newQuests.push({ id: 'sss', title: 'Set 3 Trusted Contacts', completed: false, points: 30, icon: Users, path: '/identity' });
    }

    setScore(currentScore);
    setQuests(newQuests);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">Security Health</h1>
          <p className="text-zinc-500 font-medium">Gamified Hardening & Defensive Protocol Management.</p>
        </div>
        <div className="flex items-center gap-3 px-6 py-4 bg-zinc-900/50 rounded-3xl border border-white/5">
          <Award className="w-6 h-6 text-amber-500" />
          <div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Rank</p>
            <p className="text-sm font-black text-white uppercase">{score >= 100 ? 'Sentinel' : score >= 70 ? 'Guardian' : 'Initiate'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Score Radial */}
        <div className="lg:col-span-5">
           <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/5 rounded-[3rem] p-10 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-blue-500/5 blur-[100px]" />
              <div className="relative w-64 h-64 flex items-center justify-center">
                 <svg className="w-full h-full transform -rotate-90">
                    <circle cx="128" cy="128" r="110" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/5" />
                    <motion.circle 
                      cx="128" cy="128" r="110" stroke="currentColor" strokeWidth="12" fill="transparent" 
                      strokeDasharray="691" 
                      initial={{ strokeDashoffset: 691 }}
                      animate={{ strokeDashoffset: 691 - (691 * score) / 100 }}
                      className={score >= 70 ? 'text-blue-500' : 'text-amber-500'}
                    />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-6xl font-black text-white tracking-tighter">{score}%</span>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mt-2">Cyber Strength</span>
                 </div>
              </div>
              
              <div className="mt-10 text-center">
                 <h3 className="text-lg font-black text-white uppercase mb-2">
                    {score >= 90 ? 'Maximum Resilience' : score >= 60 ? 'Healthy Defense' : 'Critical Exposure'}
                 </h3>
                 <p className="text-zinc-500 text-xs font-medium max-w-[200px]">
                    {score >= 90 ? 'Your vault and identity are protected by military-grade protocols.' : 'Complete pending quests to reach 100% security.'}
                 </p>
              </div>
           </div>
        </div>

        {/* Quests */}
        <div className="lg:col-span-7 space-y-6">
           <div className="flex items-center gap-3 ml-2">
              <Target className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-black text-white uppercase tracking-tight">Active Quests</h2>
           </div>

           <div className="space-y-4">
              {quests.map((quest) => (
                <Link 
                  key={quest.id} 
                  href={quest.path}
                  className={`block p-6 rounded-[2rem] border transition-all group ${
                    quest.completed 
                      ? 'bg-emerald-500/5 border-emerald-500/10' 
                      : 'bg-zinc-900 border-white/5 hover:border-blue-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${
                          quest.completed 
                            ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-500' 
                            : 'bg-black/40 border-white/5 text-zinc-500 group-hover:text-blue-500'
                        }`}>
                           <quest.icon className="w-6 h-6" />
                        </div>
                        <div>
                           <h4 className={`text-lg font-black tracking-tight ${quest.completed ? 'text-emerald-400' : 'text-white'}`}>
                             {quest.title}
                           </h4>
                           <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">
                             Reward: {quest.points} XP • {quest.completed ? 'COMPLETED' : 'PENDING'}
                           </p>
                        </div>
                     </div>
                     {quest.completed ? (
                       <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                     ) : (
                       <ChevronRight className="w-6 h-6 text-zinc-700 group-hover:text-blue-500 transition-all" />
                     )}
                  </div>
                </Link>
              ))}
           </div>

           <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] relative overflow-hidden shadow-2xl shadow-blue-500/20">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <Zap className="w-24 h-24 text-white" />
              </div>
              <h3 className="text-xl font-black text-white uppercase mb-2">Evolution in Progress</h3>
              <p className="text-blue-100 text-sm font-medium mb-6 opacity-80">Gain more XP to unlock the "Ghost Protocol" and advanced stealth features.</p>
              <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
                 <div className="h-full bg-white w-1/3" />
              </div>
              <p className="text-[10px] font-black text-white/50 uppercase mt-3 tracking-widest">3,450 XP to Level 4</p>
           </div>
        </div>
      </div>
    </div>
  );
}
