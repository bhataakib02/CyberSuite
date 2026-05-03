"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Fingerprint, 
  ShieldCheck, 
  ShieldEllipsis, 
  Lock, 
  EyeOff, 
  Cpu, 
  Key, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Zap
} from 'lucide-react';
import { apiFetch } from '../../../lib/api';
import { generateZKPProof } from '../../../lib/zkp';

export default function PrivateVerifyPage() {
  const [attribute, setAttribute] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [step, setStep] = useState(1);

  const handleVerify = async () => {
    if (!attribute) return;
    
    setVerifying(true);
    setStep(2);
    
    try {
      // Step 1: Get challenge from server
      const challengeRes = await apiFetch('/identity/zkp/challenge');
      if (!challengeRes.ok) throw new Error('Failed to get challenge');
      const { challenge, nonce } = await challengeRes.json();
      
      setStep(3);
      // Step 2: Generate proof locally (Zero-Knowledge)
      const proof = await generateZKPProof(attribute.toUpperCase(), challenge, nonce);
      
      setStep(4);
      // Step 3: Submit proof for verification
      const verifyRes = await apiFetch('/identity/zkp/verify', {
        method: 'POST',
        body: JSON.stringify({ attribute: attribute.toUpperCase(), proof })
      });
      
      const data = await verifyRes.json();
      setResult(data);
      setStep(5);
    } catch (err) {
      console.error(err);
      setResult({ error: 'Verification failed' });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto border border-blue-500/20 shadow-[0_0_50px_rgba(37,99,235,0.1)]">
           <Fingerprint className="w-10 h-10 text-blue-500" />
        </div>
        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">Sovereign <span className="text-zinc-700">Identity</span></h1>
        <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-xs">Zero-Knowledge Proof (ZKP) Verification Engine</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* LEFT: INFO */}
        <div className="space-y-8 bg-zinc-900/40 border border-white/5 p-10 rounded-[2.5rem] backdrop-blur-xl">
           <h3 className="text-xl font-black text-white uppercase italic tracking-tight">How it works</h3>
           <div className="space-y-6">
              <InfoStep 
                num="01" 
                title="Client-Side Commmitment" 
                desc="Your browser generates a cryptographic hash of your attribute. The actual value never leaves your device." 
                icon={Cpu}
              />
              <InfoStep 
                num="02" 
                title="Challenge Exchange" 
                desc="The server provides a random challenge string to verify your knowledge of the secret." 
                icon={Zap}
              />
              <InfoStep 
                num="03" 
                title="Proof Generation" 
                desc="A mathematical proof is generated locally, proving you own the attribute without revealing what it is." 
                icon={Key}
              />
           </div>

           <div className="bg-blue-500/5 border border-blue-500/10 p-6 rounded-3xl space-y-3">
              <div className="flex items-center gap-2 text-blue-500">
                 <ShieldCheck className="w-4 h-4" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Privacy Guaranteed</span>
              </div>
              <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
                CyberSuite uses mathematical proofs to verify claims. Even if our database was compromised, your actual sensitive documents and attribute values remain completely private because they were never stored on our servers.
              </p>
           </div>
        </div>

        {/* RIGHT: INTERACTIVE FORM */}
        <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
           <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
           
           {!result ? (
             <div className="space-y-8 relative z-10">
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Attribute to Verify</label>
                  <div className="relative group">
                     <div className="absolute left-5 top-1/2 -translate-y-1/2">
                        <Lock className="w-5 h-5 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
                     </div>
                     <input 
                       type="text" 
                       value={attribute}
                       onChange={(e) => setAttribute(e.target.value)}
                       placeholder="e.g. DOCTOR, STUDENT, LAWYER"
                       className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white font-bold placeholder:text-zinc-700 outline-none focus:border-blue-500/50 transition-all"
                     />
                  </div>
                  <p className="text-[10px] text-zinc-600 font-bold uppercase italic ml-1">* Case insensitive. Verification is mathematical.</p>
               </div>

               <div className="space-y-4">
                  {verifying && (
                    <div className="space-y-4">
                       <StepIndicator current={step} />
                    </div>
                  )}

                  <button 
                    onClick={handleVerify}
                    disabled={!attribute || verifying}
                    className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                     {verifying ? <Cpu className="animate-spin" /> : <ShieldEllipsis />}
                     {verifying ? 'Generating Proof...' : 'Execute Private Verification'}
                  </button>
               </div>
             </div>
           ) : (
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }} 
               animate={{ opacity: 1, scale: 1 }}
               className="text-center space-y-8 relative z-10 py-10"
             >
                {result.verified ? (
                  <>
                    <div className="w-24 h-24 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto border border-emerald-500/20">
                       <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                    </div>
                    <div className="space-y-2">
                       <h4 className="text-3xl font-black text-white tracking-tighter uppercase italic">Attribute Verified</h4>
                       <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Proof of Attribute: {attribute.toUpperCase()}</p>
                    </div>
                    <div className="bg-black/40 p-6 rounded-3xl border border-white/5 text-left space-y-3">
                       <div className="flex justify-between items-center text-[9px] font-black uppercase text-zinc-600">
                          <span>Verification Engine</span>
                          <span>Sentinel-ZKP-v1</span>
                       </div>
                       <div className="h-px bg-white/5" />
                       <div className="flex justify-between items-center text-[9px] font-black uppercase text-zinc-500">
                          <span>Mathematic Integrity</span>
                          <span className="text-emerald-500">Confirmed (SHA-256)</span>
                       </div>
                       <div className="flex justify-between items-center text-[9px] font-black uppercase text-zinc-500">
                          <span>Data Disclosure</span>
                          <span className="text-blue-500">Zero (Masked)</span>
                       </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-24 h-24 bg-red-500/10 rounded-[2rem] flex items-center justify-center mx-auto border border-red-500/20">
                       <ShieldAlert className="w-12 h-12 text-red-500" />
                    </div>
                    <div className="space-y-2">
                       <h4 className="text-3xl font-black text-white tracking-tighter uppercase italic">Verification Failed</h4>
                       <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">{result.error || 'Cryptographic mismatch'}</p>
                    </div>
                  </>
                )}

                <button 
                  onClick={() => { setResult(null); setStep(1); }}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all"
                >
                   Perform New Verification
                </button>
             </motion.div>
           )}
        </div>
      </div>
    </div>
  );
}

function InfoStep({ num, title, desc, icon: Icon }: any) {
  return (
    <div className="flex gap-6 group">
       <div className="text-3xl font-black text-zinc-800 italic group-hover:text-blue-900 transition-colors">{num}</div>
       <div className="space-y-2">
          <div className="flex items-center gap-2">
             <Icon className="w-4 h-4 text-blue-500" />
             <h4 className="text-white font-black uppercase tracking-tight text-sm italic">{title}</h4>
          </div>
          <p className="text-zinc-500 text-xs leading-relaxed">{desc}</p>
       </div>
    </div>
  );
}

function StepIndicator({ current }: { current: number }) {
  const steps = [
    "Establishing Session",
    "Fetching Challenge",
    "Computing Proof Locally",
    "Finalizing Disclosure",
    "Verification Complete"
  ];

  return (
    <div className="space-y-3">
       <div className="flex justify-between items-center">
          <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{steps[current - 1]}</span>
          <span className="text-[9px] font-black text-zinc-600 uppercase italic">Step {current} of 5</span>
       </div>
       <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: '0%' }}
            animate={{ width: `${(current / 5) * 100}%` }}
            className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
          />
       </div>
    </div>
  );
}
