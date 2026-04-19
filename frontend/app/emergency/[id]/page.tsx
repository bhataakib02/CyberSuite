"use client";

import { useEffect, useState } from 'react';
import { ShieldAlert, HeartPulse, PhoneCall, AlertTriangle, FileText, Cross } from 'lucide-react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';

export default function EmergencyProfile() {
  const params = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${apiUrl}/auth/emergency/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data.emergencyProfile);
        } else {
          setError('Emergency profile not found or unavailable.');
        }
      } catch (err) {
        setError('Network error. Unable to load profile.');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchProfile();
    }
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center animate-pulse text-red-500">
          <HeartPulse className="w-16 h-16 mb-4" />
          <p className="font-black uppercase tracking-widest text-sm">Accessing Medical Records...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
        <ShieldAlert className="w-16 h-16 text-zinc-800 mb-6" />
        <h1 className="text-2xl font-black text-white mb-2 uppercase tracking-widest">Profile Unavailable</h1>
        <p className="text-zinc-500 font-medium max-w-md">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-xl mx-auto space-y-6">
        
        {/* Header (Red alert style) */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-600 rounded-[2.5rem] p-8 text-center shadow-2xl shadow-red-600/20"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full text-red-600 mb-4 shadow-xl">
            <Cross className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-1">Emergency ID</h1>
          <p className="text-red-200 font-bold tracking-widest text-sm uppercase">Patient: {profile.name}</p>
        </motion.div>

        {/* Vital Info */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-900 border border-white/5 p-6 rounded-[2rem] flex flex-col items-center text-center shadow-xl"
          >
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-3">
              <HeartPulse className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Blood Group</p>
            <p className="text-3xl font-black text-white">{profile.bloodGroup || 'UNKNOWN'}</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900 border border-white/5 p-6 rounded-[2rem] flex flex-col items-center text-center shadow-xl"
          >
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Allergies</p>
            <p className="text-lg font-bold text-white line-clamp-2">{profile.allergies || 'None recorded'}</p>
          </motion.div>
        </div>

        {/* Detailed Medical Info */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-zinc-900 border border-white/5 p-8 rounded-[2.5rem] shadow-xl space-y-8"
        >
          <div>
            <div className="flex items-center gap-3 mb-3">
              <FileText className="w-5 h-5 text-blue-500" />
              <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500">Chronic Conditions / History</h2>
            </div>
            <p className="text-white font-medium text-lg leading-relaxed bg-black/50 p-6 rounded-3xl border border-white/5">
              {profile.chronicConditions || 'No conditions recorded.'}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-3">
              <PhoneCall className="w-5 h-5 text-emerald-500" />
              <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500">Emergency Contacts</h2>
            </div>
            <div className="bg-black/50 p-6 rounded-3xl border border-white/5">
              {profile.emergencyContacts ? (
                <p className="text-white font-medium text-lg leading-relaxed whitespace-pre-wrap">
                  {profile.emergencyContacts}
                </p>
              ) : (
                <p className="text-zinc-500 italic">No emergency contacts provided.</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-zinc-600 text-[10px] font-black uppercase tracking-widest pt-4">
          Verified CyberSuite Medical ID • Authorized Emergency Access Only
        </p>
      </div>
    </div>
  );
}
