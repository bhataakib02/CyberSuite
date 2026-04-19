"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Shield, FileText, Stethoscope, Key, ArrowRight, X, Command as CommandIcon, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../lib/api';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsOpen(prev => !prev);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await apiFetch(`/search?q=${query}`);
        const data = await res.json();
        if (res.ok) {
          setResults(data.results || []);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'WARRANTY': return FileText;
      case 'MEDICAL': return Stethoscope;
      case 'VAULT': return Key;
      default: return Shield;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 sm:px-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setIsOpen(false)}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden relative z-10"
      >
        <div className="p-6 border-b border-white/5 flex items-center gap-4">
          <Search className="w-6 h-6 text-zinc-500" />
          <input
            autoFocus
            type="text"
            placeholder="Search vault, warranties, medical records..."
            className="flex-1 bg-transparent border-none outline-none text-white text-lg placeholder-zinc-600 font-medium"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-zinc-800 rounded text-[10px] font-black text-zinc-500">ESC</span>
            <button onClick={() => setIsOpen(false)}>
              <X className="w-5 h-5 text-zinc-500 hover:text-white" />
            </button>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="p-8 text-center text-zinc-500 font-black uppercase tracking-widest text-xs">
              Searching Secure Nodes...
            </div>
          ) : results.length > 0 ? (
            results.map((result, idx) => {
              const Icon = getIcon(result.type);
              return (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => {
                    router.push(result.path);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-blue-600/10 border border-white/5 hover:border-blue-500/30 rounded-2xl group transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-blue-400 group-hover:bg-blue-500/5 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-black tracking-tight">{result.title}</p>
                      <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">{result.type}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </button>
              );
            })
          ) : query.length >= 2 ? (
            <div className="p-12 text-center">
              <Shield className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
              <p className="text-zinc-600 font-black uppercase tracking-widest text-xs">No encrypted records match your query</p>
            </div>
          ) : (
            <div className="p-8">
              <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest mb-4 ml-2">Quick Navigation</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'Dashboard', path: '/dashboard', icon: Shield },
                  { name: 'Vault', path: '/vault', icon: Key },
                  { name: 'Analyzer', path: '/analyzer', icon: ShieldAlert },
                  { name: 'Identity Protect', path: '/identity', icon: ShieldCheck },
                  { name: 'Warranty', path: '/warranty', icon: FileText },
                  { name: 'Medical', path: '/medical', icon: Stethoscope },
                ].map((item) => (
                  <button
                    key={item.name}
                    onClick={() => { router.push(item.path); setIsOpen(false); }}
                    className="flex items-center gap-3 p-4 bg-black/40 hover:bg-white/5 border border-white/5 rounded-2xl text-left transition-all"
                  >
                    <item.icon className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm font-bold text-white">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-white/5 bg-black/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CommandIcon className="w-4 h-4 text-zinc-700" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-700">CyberSuite Intelligence</span>
          </div>
          <p className="text-[10px] font-medium text-zinc-600 italic">Zero-Knowledge Search Enabled</p>
        </div>
      </motion.div>
    </div>
  );
}
