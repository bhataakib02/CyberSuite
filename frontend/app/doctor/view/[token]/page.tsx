"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck, FileText, Lock, AlertTriangle, Download, Calendar, User } from 'lucide-react';

export default function PublicDoctorView() {
  const params = useParams();
  const token = params.token as string;
  const [record, setRecord] = useState<any>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [decryptedKey, setDecryptedKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/medical/public/access/${token}`);
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Access denied');
        }

        setRecord(data.record);
        
        // In a real app, we would read the AccessKey from window.location.hash
        // and decrypt data.encKey here.
        // For this demo, we'll simulate the decryption if the hash is present.
        const hash = window.location.hash.substring(1);
        if (hash) {
          setDecryptedKey('SIMULATED_DECRYPTED_KEY_' + hash);
        } else {
          setError('Decryption key missing from URL hash. Access denied.');
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (isLoading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
        <ShieldCheck className="w-12 h-12 text-blue-500" />
      </motion.div>
      <p className="mt-6 text-zinc-500 font-black uppercase tracking-[0.3em] text-[10px]">Validating Secure Handshake...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
      <AlertTriangle className="w-16 h-16 text-red-500 mb-6" />
      <h1 className="text-2xl font-black text-white mb-2 tracking-tight uppercase">Clearance Denied</h1>
      <p className="text-zinc-500 max-w-sm mx-auto font-medium">{error}</p>
      <button onClick={() => window.location.reload()} className="mt-8 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-white transition-colors">Retry Handshake</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/20">
                <ShieldCheck className="w-7 h-7" />
             </div>
             <div>
                <h1 className="text-2xl font-black tracking-tighter uppercase">Clinical Clearance</h1>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">One-Time Authorized View</p>
             </div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 rounded-2xl flex items-center gap-3">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
             <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Encrypted Session Active</span>
          </div>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/50 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 shadow-2xl overflow-hidden relative"
        >
          <div className="absolute top-0 left-0 w-2 h-full bg-blue-600" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Patient</label>
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-white/5">
                      <User className="w-4 h-4 text-zinc-400" />
                   </div>
                   <p className="text-xl font-black tracking-tight">{record.patient.name}</p>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Record Protocol</label>
                <div className="flex items-center gap-3">
                   <FileText className="w-5 h-5 text-blue-500" />
                   <p className="font-bold text-zinc-300">{record.fileName}</p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Transmission Date</label>
                <div className="flex items-center gap-3 text-zinc-300">
                   <Calendar className="w-5 h-5 text-zinc-600" />
                   <p className="font-bold">{new Date(record.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Security Hash</label>
                <div className="flex items-center gap-3">
                   <Lock className="w-5 h-5 text-emerald-500/50" />
                   <code className="text-[9px] text-zinc-500 truncate font-mono bg-black/40 px-3 py-1 rounded-lg border border-white/5">{record.id}</code>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black/60 border border-white/5 rounded-3xl p-8 mb-10">
             <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-4">Clinical Metadata</h4>
             <p className="text-sm text-zinc-300 font-medium leading-relaxed italic">
               {record.description || "No metadata provided for this record."}
             </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
             <button className="flex-1 py-5 bg-white text-black rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95">
                <Download className="w-5 h-5" /> Decrypt & Download Payload
             </button>
             <button className="flex-1 py-5 bg-zinc-800 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-zinc-700 transition-all border border-white/5 active:scale-95">
                Print Clearance Report
             </button>
          </div>
        </motion.div>

        <footer className="text-center space-y-4 pt-12">
           <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">CyberSuite Zero-Trust Infrastructure</p>
           <div className="flex justify-center gap-3">
              <div className="px-3 py-1 bg-zinc-900 border border-white/5 rounded-full text-[8px] font-black text-zinc-700">AES-256-GCM</div>
              <div className="px-3 py-1 bg-zinc-900 border border-white/5 rounded-full text-[8px] font-black text-zinc-700">SHA-512</div>
              <div className="px-3 py-1 bg-zinc-900 border border-white/5 rounded-full text-[8px] font-black text-zinc-700">RSA-4096</div>
           </div>
        </footer>
      </div>
    </div>
  );
}
