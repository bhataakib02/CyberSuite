"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../../store/useAuthStore';
import { apiFetch } from '../../../lib/api';
import { 
  UserCheck, 
  ShieldAlert, 
  ShieldCheck, 
  Mail, 
  Key, 
  AlertTriangle, 
  RefreshCw,
  Search,
  Lock,
  Globe,
  Activity
} from 'lucide-react';

interface IdentityResult {
  email: string;
  breached: boolean;
  breachCount: number;
  breachedSites: string[];
  riskScore: number;
  riskLabel: string;
}

export default function IdentityProtectPage() {
  const { user } = useAuthStore();
  const [email, setEmail] = useState(user?.email || '');
  const [passwordToCheck, setPasswordToCheck] = useState('');
  
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState<IdentityResult | null>(null);
  
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);
  const [passwordResult, setPasswordResult] = useState<{ exposed: boolean; count: number; message: string } | null>(null);

  const checkEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsCheckingEmail(true);
    setEmailResult(null);
    try {
      const res = await apiFetch('/identity/check', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setEmailResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const checkPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordToCheck) return;
    
    setIsCheckingPassword(true);
    setPasswordResult(null);
    try {
      const res = await apiFetch('/identity/check-password', {
        method: 'POST',
        body: JSON.stringify({ password: passwordToCheck })
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordResult({ exposed: data.exposed, count: data.exposureCount, message: data.message });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCheckingPassword(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4 md:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Globe className="w-10 h-10 text-indigo-500" />
            Identity Protection
          </h1>
          <p className="text-zinc-500 mt-2 text-lg">Monitor your digital footprint across the deep and dark web.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 shadow-inner">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Live Monitoring Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Email Breach Scanner */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-zinc-900/40 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-inner">
                <Mail className="w-7 h-7 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">Email Scanner</h2>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Dark Web Audit</p>
              </div>
            </div>
            
            <form onSubmit={checkEmail} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Target Email</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter email to scan..."
                      className="w-full bg-black/60 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={isCheckingEmail}
                    className="px-8 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center shadow-lg shadow-blue-600/20 active:scale-95 py-4 sm:py-0"
                  >
                    {isCheckingEmail ? <RefreshCw className="w-6 h-6 animate-spin" /> : 'RUN SCAN'}
                  </button>
                </div>
              </div>
            </form>

            <AnimatePresence mode="wait">
              {emailResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mt-8 pt-8 border-t border-white/5"
                >
                  {emailResult.breached ? (
                    <div className="space-y-6">
                      <div className="flex items-start gap-5 p-6 bg-red-500/5 border border-red-500/10 rounded-3xl shadow-2xl shadow-red-500/5">
                        <AlertTriangle className="w-8 h-8 text-red-500 shrink-0" />
                        <div>
                          <h3 className="text-red-400 text-lg font-black tracking-tight">CRITICAL EXPOSURE</h3>
                          <p className="text-zinc-500 text-sm mt-1 font-medium">
                            Your email was found in <span className="text-red-400 font-black">{emailResult.breachCount}</span> data breaches.
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Compromised Repositories</h4>
                        <div className="flex flex-wrap gap-2">
                          {emailResult.breachedSites.map(site => (
                            <div key={site} className="px-4 py-2 bg-zinc-900/80 border border-white/5 rounded-xl text-xs font-black text-zinc-300 flex items-center gap-2 group hover:border-red-500/30 transition-all">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                              {site}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-5 p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl shadow-2xl shadow-emerald-500/5">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                        <ShieldCheck className="w-7 h-7 text-emerald-500" />
                      </div>
                      <div>
                        <h3 className="text-emerald-400 text-lg font-black tracking-tight">IDENTITY SECURED</h3>
                        <p className="text-zinc-500 text-sm font-medium mt-1">No breaches detected for this account.</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Password Exposure Scanner */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-zinc-900/40 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500" />
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-inner">
                <Key className="w-7 h-7 text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">Password Check</h2>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">K-Anonymity Protocol</p>
              </div>
            </div>

            <form onSubmit={checkPassword} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Target Password</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                    <input
                      type="password"
                      required
                      value={passwordToCheck}
                      onChange={(e) => setPasswordToCheck(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black/60 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all font-mono text-xl tracking-tighter"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={isCheckingPassword}
                    className="px-8 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center shadow-lg shadow-purple-600/20 active:scale-95 py-4 sm:py-0"
                  >
                    {isCheckingPassword ? <RefreshCw className="w-6 h-6 animate-spin" /> : 'CHECK'}
                  </button>
                </div>
              </div>
            </form>

            <AnimatePresence mode="wait">
              {passwordResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mt-8 pt-8 border-t border-white/5"
                >
                  {passwordResult.exposed ? (
                    <div className="flex items-start gap-5 p-6 bg-red-500/5 border border-red-500/10 rounded-3xl">
                      <AlertTriangle className="w-8 h-8 text-red-500 shrink-0" />
                      <div>
                        <h3 className="text-red-400 text-lg font-black tracking-tight uppercase">EXPOSED PASSWORD</h3>
                        <p className="text-zinc-500 text-sm mt-1 font-medium">
                          {passwordResult.message} Never use this password again.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-5 p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                        <ShieldCheck className="w-7 h-7 text-emerald-500" />
                      </div>
                      <div>
                        <h3 className="text-emerald-400 text-lg font-black tracking-tight uppercase">CLEAN RECORD</h3>
                        <p className="text-zinc-500 text-sm font-medium mt-1">{passwordResult.message}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Overview Score Box */}
          <AnimatePresence>
            {emailResult && (
              <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="bg-zinc-900/50 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] flex items-center justify-between shadow-2xl relative overflow-hidden"
              >
                <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full -mr-10 -mt-10" />
                <div className="relative z-10">
                  <h3 className="text-zinc-600 text-xs font-black uppercase tracking-[0.3em]">Aggregate Risk Profile</h3>
                  <p className={`text-3xl font-black mt-2 tracking-tight ${
                    emailResult.riskScore >= 80 ? 'text-emerald-400' : 
                    emailResult.riskScore >= 50 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {emailResult.riskLabel}
                  </p>
                  <p className="text-zinc-500 text-[10px] font-bold mt-1 uppercase tracking-widest">Based on live footprint scan</p>
                </div>
                <div className="relative flex items-center justify-center group">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="36"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-zinc-800"
                    />
                    <motion.circle
                      cx="48"
                      cy="48"
                      r="36"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray="226.2"
                      initial={{ strokeDashoffset: 226.2 }}
                      animate={{ strokeDashoffset: 226.2 - (226.2 * emailResult.riskScore) / 100 }}
                      className={`${
                        emailResult.riskScore >= 80 ? 'text-emerald-500' : 
                        emailResult.riskScore >= 50 ? 'text-amber-500' : 'text-red-500'
                      }`}
                    />
                  </svg>
                  <span className="absolute text-2xl font-black text-white tracking-tighter">{emailResult.riskScore}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
