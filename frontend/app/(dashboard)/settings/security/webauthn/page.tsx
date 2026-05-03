"use client";

import { useState, useEffect } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import { 
  Key, 
  ShieldCheck, 
  ShieldAlert, 
  Cpu, 
  Usb, 
  Trash2, 
  CheckCircle2, 
  Plus, 
  Settings2,
  Activity,
  Fingerprint
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function WebAuthnSettings() {
  const [authenticators, setAuthenticators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  useEffect(() => {
    fetchAuthenticators();
  }, []);

  const fetchAuthenticators = async () => {
    try {
      const res = await apiFetch('/auth/me'); // I'll assume this returns user with authenticators
      if (res.ok) {
        const user = await res.json();
        setAuthenticators(user.authenticators || []);
      }
    } catch (err) {
      console.error('Failed to fetch authenticators', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setRegistering(true);
    setStatus(null);
    try {
      // 1. Get options
      const optionsRes = await apiFetch('/auth/webauthn/register/options');
      if (!optionsRes.ok) throw new Error('Failed to get registration options');
      const options = await optionsRes.json();

      // 2. Trigger browser WebAuthn prompt
      const attestation = await startRegistration(options);

      // 3. Verify with server
      const verifyRes = await apiFetch('/auth/webauthn/register/verify', {
        method: 'POST',
        body: JSON.stringify(attestation)
      });

      if (verifyRes.ok) {
        setStatus({ type: 'success', msg: 'Hardware key registered successfully!' });
        fetchAuthenticators();
      } else {
        throw new Error('Verification failed');
      }
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message || 'Registration failed' });
    } finally {
      setRegistering(false);
    }
  };

  const deleteAuthenticator = async (id: string) => {
    if (!confirm('Are you sure you want to remove this hardware key?')) return;
    try {
      const res = await apiFetch(`/auth/webauthn/authenticators/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAuthenticators(prev => prev.filter(a => a.id !== id));
      }
    } catch (err) {
      alert('Failed to delete key');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">Hardware <span className="text-zinc-700">Security</span></h1>
          <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-xs">FIDO2 / WebAuthn / YubiKey Management</p>
        </div>

        <button 
          onClick={handleRegister}
          disabled={registering}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-blue-600/20 transition-all flex items-center gap-3"
        >
          {registering ? <Activity className="animate-spin" /> : <Plus className="w-5 h-5" />}
          {registering ? 'Waiting for Key...' : 'Add Hardware Key'}
        </button>
      </div>

      {status && (
        <div className={`p-6 rounded-2xl border flex items-center gap-4 ${status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
          {status.type === 'success' ? <CheckCircle2 /> : <ShieldAlert />}
          <span className="font-bold uppercase tracking-wider text-sm">{status.msg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="p-20 text-center animate-pulse text-zinc-700 font-black uppercase tracking-widest">Scanning Secure Enclave...</div>
        ) : authenticators.length > 0 ? (
          authenticators.map((auth) => (
            <div key={auth.id} className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] flex items-center justify-between group hover:border-blue-500/30 transition-all backdrop-blur-xl">
               <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                     <Usb className="w-7 h-7 text-blue-500" />
                  </div>
                  <div className="space-y-1">
                     <h4 className="text-white font-black uppercase tracking-tight text-lg">Hardware Key</h4>
                     <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em]">Registered {new Date(auth.createdAt).toLocaleDateString()}</p>
                     <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 bg-zinc-800 rounded text-[9px] font-black text-zinc-500 uppercase tracking-widest">{auth.credentialDeviceType}</span>
                        {auth.credentialBackedUp && <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[9px] font-black uppercase tracking-widest">Backed Up</span>}
                     </div>
                  </div>
               </div>

               <div className="flex items-center gap-4">
                  <div className="text-right hidden md:block">
                     <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Last Used</p>
                     <p className="text-white font-bold text-xs uppercase italic">Never</p>
                  </div>
                  <button 
                    onClick={() => deleteAuthenticator(auth.id)}
                    className="p-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl border border-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                     <Trash2 className="w-5 h-5" />
                  </button>
               </div>
            </div>
          ))
        ) : (
          <div className="p-20 bg-zinc-900/40 border border-dashed border-white/10 rounded-[3rem] text-center space-y-6">
             <Key className="w-16 h-16 text-zinc-800 mx-auto" />
             <div className="space-y-2">
                <p className="text-zinc-500 font-black uppercase tracking-widest">No hardware keys found</p>
                <p className="text-zinc-700 text-xs font-bold uppercase">Add a YubiKey or Biometric key to enhance your account security.</p>
             </div>
          </div>
        )}
      </div>

      <div className="bg-zinc-900/40 border border-white/5 p-10 rounded-[3rem] space-y-8 backdrop-blur-xl">
         <div className="flex items-center gap-4">
            <ShieldCheck className="w-8 h-8 text-blue-500" />
            <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Why use Hardware Keys?</h3>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureBox 
              icon={Fingerprint} 
              title="Phishing Proof" 
              desc="Hardware keys are immune to phishing attacks because they verify the domain cryptographically."
            />
            <FeatureBox 
              icon={Lock} 
              title="No Passwords" 
              desc="Enable seamless passwordless login using biometrics or physical security tokens."
            />
            <FeatureBox 
              icon={Settings2} 
              title="FIDO2 Standard" 
              desc="CyberSuite uses the global FIDO2 standard for maximum compatibility across all modern devices."
            />
         </div>
      </div>
    </div>
  );
}

function FeatureBox({ icon: Icon, title, desc }: any) {
  return (
    <div className="space-y-4">
       <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center border border-white/5">
          <Icon className="w-5 h-5 text-zinc-400" />
       </div>
       <div className="space-y-1">
          <h4 className="text-white font-black uppercase tracking-tight text-sm">{title}</h4>
          <p className="text-zinc-500 text-[11px] leading-relaxed font-medium">{desc}</p>
       </div>
    </div>
  );
}

import { Lock } from 'lucide-react';
