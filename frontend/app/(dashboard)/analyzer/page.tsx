"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../../lib/api';
import { useRouter } from 'next/navigation';
import { 
  Activity, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Key, 
  ShieldCheck, 
  Globe, 
  Cpu, 
  Fingerprint,
  Zap,
  Info,
  Lock
} from 'lucide-react';

interface AnalysisResult {
  score: number;
  label: string;
  pwnedCount: number;
  entropy: number;
  crackTime: { seconds: number; label: string };
  charsetSize: number;
  length: number;
  patterns: string[];
  suggestions: string[];
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumbers: boolean;
  hasSymbols: boolean;
  protocols: { name: string; status: string; detail: string }[];
}

export default function AnalyzerPage() {
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (password) {
        analyzePassword(password);
      } else {
        setResult(null);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [password]);

  const analyzePassword = async (pwd: string) => {
    setIsAnalyzing(true);
    try {
      const res = await apiFetch('/analyze', {
        method: 'POST',
        body: JSON.stringify({ password: pwd })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Failed to analyze password', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score < 30) return 'bg-red-500';
    if (score < 60) return 'bg-amber-500';
    if (score < 80) return 'bg-emerald-400';
    return 'bg-blue-500';
  };

  const getScoreTextColor = (score: number) => {
    if (score < 30) return 'text-red-500';
    if (score < 60) return 'text-amber-500';
    if (score < 80) return 'text-emerald-400';
    return 'text-blue-500';
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
    let pwd = "";
    const arr = new Uint32Array(16);
    window.crypto.getRandomValues(arr);
    for (let i = 0; i < 16; i++) {
      pwd += chars[arr[i] % chars.length];
    }
    setPassword(pwd);
  };

  const handleSaveToVault = () => {
    navigator.clipboard.writeText(password);
    alert('Password copied to clipboard. Redirecting to Vault to save...');
    router.push('/vault');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4 md:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Fingerprint className="w-10 h-10 text-blue-500" />
            Password Analyzer
          </h1>
          <p className="text-zinc-500 mt-2 text-lg">Military-grade strength analysis and real-time breach detection.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 rounded-2xl border border-white/5 shadow-inner">
          <Globe className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Global HIBP Sync Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Input & Basic Stats */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-900/40 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 bg-[length:200%_auto] animate-gradient-x" />
            
            <label className="block text-sm font-bold text-zinc-500 mb-4 uppercase tracking-widest">Master Key Entry</label>
            <div className="relative">
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Type a password to analyze..."
                className="w-full bg-black/60 border border-white/10 rounded-2xl px-5 py-4 pr-14 text-white placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono text-lg"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {isAnalyzing ? (
                  <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                ) : (
                  <Zap className="w-5 h-5 text-zinc-700 group-focus-within:text-blue-500 transition-colors" />
                )}
              </div>
            </div>

            <button 
              onClick={generatePassword}
              className="w-full mt-6 bg-white/5 hover:bg-white/10 text-white py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 border border-white/10 active:scale-95 shadow-lg"
            >
              <Key className="w-4 h-4 text-blue-400" /> Generate Secure Password
            </button>

            <AnimatePresence>
              {result && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-8 pt-8 border-t border-white/5 space-y-6"
                >
                  <div>
                    <div className="flex justify-between items-end mb-3">
                      <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Final Security Rating</span>
                      <span className={`text-2xl font-black ${getScoreTextColor(result.score)}`}>{result.score}%</span>
                    </div>
                    <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${result.score}%` }}
                        className={`h-full ${getScoreColor(result.score)} rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]`}
                      />
                    </div>
                    <p className={`text-center mt-3 text-sm font-black uppercase tracking-widest ${getScoreTextColor(result.score)}`}>
                      {result.label}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Technology Info (THE USER REQUESTED THIS) */}
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-xl">
            <h3 className="text-white text-xs font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-500" /> Analysis Engine
            </h3>
            <div className="space-y-4">
              {[
                { name: 'K-Anonymity HIBP', detail: '12B+ leaked records', icon: Globe },
                { name: 'Shannon Entropy', detail: 'Logarithmic bit calculation', icon: Activity },
                { name: 'Heuristic Scan', detail: 'Pattern & keyboard detection', icon: Fingerprint }
              ].map((tech) => (
                <div key={tech.name} className="flex items-center gap-3 p-3 bg-black/30 rounded-2xl border border-white/5">
                  <tech.icon className="w-4 h-4 text-zinc-500" />
                  <div>
                    <p className="text-white text-xs font-bold">{tech.name}</p>
                    <p className="text-zinc-500 text-[10px] uppercase font-medium mt-0.5">{tech.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Detailed Analysis */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div 
                key="result"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-6"
              >
                {/* Breach Status (HIGH IMPACT) */}
                <div className={`p-8 rounded-[2rem] border transition-all shadow-2xl ${
                  result.pwnedCount > 0 
                    ? 'bg-red-500/10 border-red-500/20 shadow-red-500/5' 
                    : 'bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5'
                }`}>
                  <div className="flex items-start gap-6">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${
                      result.pwnedCount > 0 ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {result.pwnedCount > 0 ? <ShieldAlert className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
                    </div>
                    <div>
                      <h2 className={`text-2xl font-black ${result.pwnedCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {result.pwnedCount > 0 ? 'CRITICAL BREACH DETECTED' : 'NO DATA BREACHES FOUND'}
                      </h2>
                      <p className="text-zinc-400 mt-2 text-sm font-medium leading-relaxed">
                        {result.pwnedCount > 0 
                          ? `This password has appeared in ${result.pwnedCount.toLocaleString()} public data breaches. Using this password makes your account extremely vulnerable to credential stuffing attacks.`
                          : 'Our real-time scan of over 12 billion leaked credentials found no instances of this password. It is currently safe from known historical breaches.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Technical Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-zinc-900/50 border border-white/10 p-6 rounded-3xl group hover:border-blue-500/30 transition-colors">
                    <div className="flex items-center gap-2 text-zinc-500 mb-3">
                      <Activity className="w-4 h-4" />
                      <span className="text-xs font-black uppercase tracking-widest">Entropy Level</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-white">{result.entropy}</span>
                      <span className="text-zinc-500 text-sm font-bold">bits</span>
                    </div>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase mt-3 tracking-tighter">Shannon Entropy: log₂(charsetᴸᵉⁿᵍᵗʰ)</p>
                  </div>
                  
                  <div className="bg-zinc-900/50 border border-white/10 p-6 rounded-3xl group hover:border-purple-500/30 transition-colors">
                    <div className="flex items-center gap-2 text-zinc-500 mb-3">
                      <RefreshCw className="w-4 h-4" />
                      <span className="text-xs font-black uppercase tracking-widest">Offline Crack Resistance</span>
                    </div>
                    <div className="text-3xl font-black text-white truncate">
                      {result.crackTime.label}
                    </div>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase mt-3 tracking-tighter">Est. time @ 10B guesses/second</p>
                  </div>
                </div>

                {/* Characteristics & Patterns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-3xl">
                    <h3 className="text-white text-xs font-black uppercase tracking-widest mb-4">Structural Audit</h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Length', val: `${result.length} chars`, ok: result.length >= 12 },
                        { label: 'Uppercase', ok: result.hasUppercase },
                        { label: 'Lowercase', ok: result.hasLowercase },
                        { label: 'Numbers', ok: result.hasNumbers },
                        { label: 'Symbols', ok: result.hasSymbols }
                      ].map((c) => (
                        <div key={c.label} className="flex items-center justify-between text-xs">
                          <span className="text-zinc-500 font-bold uppercase">{c.label}</span>
                          <div className="flex items-center gap-2">
                            {c.val && <span className={`font-black ${c.ok ? 'text-emerald-500' : 'text-amber-500'}`}>{c.val}</span>}
                            {c.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-zinc-700" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {result.patterns.length > 0 && (
                    <div className="bg-amber-500/5 border border-amber-500/10 p-6 rounded-3xl">
                      <h3 className="text-amber-400 text-xs font-black uppercase tracking-widest mb-4">Heuristic Warnings</h3>
                      <div className="space-y-3">
                        {result.patterns.map((p, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-amber-200/60 text-[11px] font-bold uppercase leading-tight">{p}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Advanced Suggestions */}
                <div className="bg-blue-500/5 border border-blue-500/10 p-8 rounded-[2.5rem]">
                  <h3 className="text-blue-400 text-sm font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                    <Info className="w-5 h-5" /> Security Hardening Protocol
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.suggestions.map((s, i) => (
                      <div key={i} className="flex items-center gap-3 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                        <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                        <span className="text-blue-100/70 text-xs font-bold leading-snug">{s}</span>
                      </div>
                    ))}
                  </div>
                  
                  {result.score >= 60 && (
                    <button 
                      onClick={handleSaveToVault}
                      className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
                    >
                      <Lock className="w-5 h-5" /> Secure in Vault
                    </button>
                  )}
                </div>

              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12 bg-zinc-900/10 border-2 border-white/5 rounded-[3rem] border-dashed"
              >
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
                  <Fingerprint className="w-24 h-24 text-zinc-800 relative z-10" />
                </div>
                <h2 className="text-3xl font-black text-white mb-3">System Idle</h2>
                <p className="text-zinc-500 text-lg max-w-sm font-medium leading-relaxed">
                  Enter a master password to initiate the deep-scan security audit.
                </p>
                <div className="mt-8 flex gap-4">
                  <div className="px-4 py-2 bg-zinc-900/50 rounded-full border border-white/5 text-[10px] font-black uppercase tracking-tighter text-zinc-500">AES-256 Support</div>
                  <div className="px-4 py-2 bg-zinc-900/50 rounded-full border border-white/5 text-[10px] font-black uppercase tracking-tighter text-zinc-500">SHA-512 Ready</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
