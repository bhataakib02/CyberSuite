"use client";

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ShieldCheck, Lock, Activity, Users, Database } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 overflow-hidden relative">
      {/* Background Effects */}
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="absolute top-0 w-full p-6 flex items-center justify-between z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
            CYBERSUITE
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            Login
          </Link>
          <Link href="/register" className="px-5 py-2.5 bg-white text-black text-sm font-semibold rounded-full hover:bg-zinc-200 transition-transform hover:scale-105 active:scale-95">
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 max-w-[1400px] mx-auto flex flex-col items-center text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8"
        >
          <Lock className="w-4 h-4" /> Military-Grade Encryption Standard
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8"
        >
          Zero-Trust Security <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500">
            For Your Digital Life
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-12"
        >
          CYBERSUITE is an all-in-one cryptographic platform featuring end-to-end encrypted chat, password management, identity monitoring, and secure medical records.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <Link href="/register" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-full hover:shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)] transition-all hover:-translate-y-1">
            Create Secure Account
          </Link>
          <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-zinc-900 border border-white/10 text-white font-medium rounded-full hover:bg-zinc-800 transition-all">
            Access Dashboard
          </Link>
        </motion.div>

        {/* Feature Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 w-full text-left"
        >
          <div className="bg-zinc-900/50 backdrop-blur border border-white/10 p-8 rounded-3xl hover:border-blue-500/30 transition-colors">
            <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
              <Lock className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Password Vault</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">AES-256 encrypted local vault. Your master password never touches our servers. Integrated entropy analyzer predicts offline crack times.</p>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur border border-white/10 p-8 rounded-3xl hover:border-purple-500/30 transition-colors">
            <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3">E2EE Secure Chat</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">Communicate with zero knowledge. RSA keys are generated per user, and dynamic AES keys encrypt every message payload on your device.</p>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur border border-white/10 p-8 rounded-3xl hover:border-emerald-500/30 transition-colors">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6">
              <Activity className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Medical & Identity</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">Check for data breaches via k-anonymity protocols. Securely share encrypted medical records with verified doctors using time-expiring access keys.</p>
          </div>
        </motion.div>

        {/* Trust Signals */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-32 pt-20 border-t border-white/5 w-full"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-12 text-center">Verified Professional Network</p>
          <div className="flex flex-wrap justify-center gap-12 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
            <div className="flex items-center gap-2 text-xl font-bold">🩺 Medical Board Verified</div>
            <div className="flex items-center gap-2 text-xl font-bold">⚖️ Legal Council Approved</div>
            <div className="flex items-center gap-2 text-xl font-bold">🎓 Academic Accredited</div>
            <div className="flex items-center gap-2 text-xl font-bold">🛡️ ISO 27001 Compliant</div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
