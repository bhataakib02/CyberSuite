"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileSignature, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  ArrowRight,
  Download,
  AlertCircle
} from 'lucide-react';

export default function DigitalContractSigning() {
  const [contracts, setContracts] = useState([
    { id: 1, title: 'Confidentiality Agreement.pdf', status: 'PENDING', date: '2026-04-18' },
    { id: 2, title: 'Freelance Service Terms.pdf', status: 'SIGNED', date: '2026-04-15' },
    { id: 3, title: 'Housing Lease Extension.pdf', status: 'VERIFIED', date: '2026-04-10' },
  ]);

  const [signingId, setSigningId] = useState<number | null>(null);

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">Digital Signature Vault</h1>
          <p className="text-zinc-500 font-medium tracking-wide">Securely sign and verify legal documents with RSA-based cryptography.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center gap-3">
          <FileSignature className="w-5 h-5" />
          New Signature Request
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Document List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Pending Actions</p>
          </div>
          
          <div className="space-y-4">
            {contracts.map((contract) => (
              <div key={contract.id} className="bg-zinc-900 border border-white/5 rounded-[2.5rem] p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-blue-500/20 transition-all">
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${
                    contract.status === 'SIGNED' ? 'bg-emerald-500/10 text-emerald-500' :
                    contract.status === 'VERIFIED' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    <FileSignature className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-white text-lg font-black tracking-tight">{contract.title}</h4>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{contract.date}</p>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${
                        contract.status === 'SIGNED' ? 'bg-emerald-500/10 text-emerald-500' :
                        contract.status === 'VERIFIED' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {contract.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {contract.status === 'PENDING' ? (
                    <button 
                      onClick={() => setSigningId(contract.id)}
                      className="px-6 py-3 bg-white text-black text-xs font-black uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-all flex items-center gap-2"
                    >
                      Sign Now <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button className="p-4 bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all">
                      <Download className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Info */}
        <div className="space-y-6">
          <div className="bg-black/40 border border-white/5 p-8 rounded-[2.5rem]">
            <ShieldCheck className="w-8 h-8 text-blue-500 mb-6" />
            <h3 className="text-white font-black uppercase tracking-tight mb-4">Verification Protocol</h3>
            <p className="text-xs text-zinc-500 leading-relaxed font-medium">
              Every signature is cryptographically bound to your Master Identity. Altering a single byte of the document will invalidate the signature hash.
            </p>
          </div>
          
          <div className="bg-amber-500/5 border border-amber-500/10 p-8 rounded-[2.5rem]">
            <AlertCircle className="w-8 h-8 text-amber-500 mb-6" />
            <h3 className="text-amber-500 font-black uppercase tracking-tight mb-4">Legal Notice</h3>
            <p className="text-xs text-amber-200/40 leading-relaxed font-medium">
              Digital signatures on this platform comply with standard electronic signing regulations. Ensure you have reviewed all terms before applying your signature.
            </p>
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      <AnimatePresence>
        {signingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSigningId(null)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-zinc-900 border border-white/10 rounded-[3rem] p-12 max-w-2xl w-full shadow-2xl">
              <h2 className="text-3xl font-black text-white mb-2">Cryptographic Signature</h2>
              <p className="text-zinc-500 text-sm font-medium mb-8">Apply your secure signature to "{contracts.find(c => c.id === signingId)?.title}".</p>
              
              <div className="aspect-video bg-black/60 border-2 border-dashed border-white/5 rounded-[2rem] mb-8 flex items-center justify-center group hover:border-blue-500/30 transition-all cursor-crosshair">
                <div className="text-center">
                  <FileSignature className="w-12 h-12 text-zinc-800 mx-auto mb-4 group-hover:text-blue-500/50 transition-all" />
                  <p className="text-zinc-700 font-black uppercase tracking-widest text-[10px]">Draw your signature or use Master Key</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setSigningId(null)} className="flex-1 py-5 rounded-2xl text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">Cancel</button>
                <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all">Apply Identity Key</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
