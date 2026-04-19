"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, ShieldAlert, Navigation } from 'lucide-react';
import { apiFetch } from '../lib/api';

export default function DisasterBanner() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await apiFetch('/disaster/alerts');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts);
      }
    } catch (err) {
      console.error('Failed to fetch disaster alerts');
    }
  };

  if (alerts.length === 0 || dismissed) return null;

  const mainAlert = alerts[0];

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-[100] p-4 pointer-events-none"
      >
        <div className="max-w-4xl mx-auto bg-red-600 text-white rounded-[2rem] shadow-2xl shadow-red-500/40 p-6 flex items-center gap-6 pointer-events-auto border border-white/20 backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center animate-pulse shrink-0">
            <AlertTriangle className="w-10 h-10" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-white text-red-600 px-2 py-0.5 rounded">
                Emergency Broadcast
              </span>
              <span className="text-xs font-bold opacity-80">{mainAlert.location}</span>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight leading-tight">{mainAlert.title}</h3>
            <p className="text-sm font-medium opacity-90 line-clamp-1">{mainAlert.message}</p>
          </div>

          <div className="flex items-center gap-3">
            <button className="bg-white text-red-600 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-zinc-100 transition-all flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              Safety Routes
            </button>
            <button 
              onClick={() => setDismissed(true)}
              className="p-3 hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
