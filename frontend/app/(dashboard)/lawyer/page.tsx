"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scale, 
  Briefcase, 
  FileSignature, 
  MessageSquare,
  Users,
  Clock,
  ChevronRight,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Key,
  ShieldCheck
} from 'lucide-react';
import { rsaSign, rsaVerify, sha256, generateSigningKeyPair } from '../../../lib/crypto';
import Link from 'next/link';

export default function LawyerDashboard() {
  const [activeCases, setActiveCases] = useState([
    { id: 'CAS-1042', title: 'Corporate Restructuring vs. Apex Corp', client: 'Apex Corp', status: 'IN_PROGRESS', nextHearing: '2026-05-12' },
    { id: 'CAS-1045', title: 'Intellectual Property Dispute', client: 'TechNova', status: 'REVIEW', nextHearing: '2026-05-20' },
    { id: 'CAS-1050', title: 'Data Breach Liability Defense', client: 'GlobalNet', status: 'PENDING', nextHearing: '2026-06-01' },
  ]);

  const [recentDocs, setRecentDocs] = useState([
    { id: 1, name: 'Non-Disclosure Agreement_v2.pdf', type: 'Contract', date: '2026-04-18' },
    { id: 2, name: 'Subpoena_Response_Draft.docx', type: 'Litigation', date: '2026-04-17' },
    { id: 3, name: 'Client_Affidavit_Signed.pdf', type: 'Evidence', date: '2026-04-15' },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newCase, setNewCase] = useState({ title: '', client: '', status: 'PENDING', nextHearing: '' });

  // Signature State
  const [isSigningModalOpen, setIsSigningModalOpen] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [signingDoc, setSigningDoc] = useState<any>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);

  const handleSignDocument = async (doc: any) => {
    setSigningDoc(doc);
    setIsSigningModalOpen(true);
    setSignature(null);
    setVerificationResult(null);
  };

  const executeSignature = async () => {
    setIsSigning(true);
    try {
      const keyPair = await generateSigningKeyPair();
      const docHash = await sha256(signingDoc.name);
      const dataBuf = new TextEncoder().encode(docHash);
      const sig = await rsaSign(dataBuf, keyPair.rawKeyPair.privateKey);
      setSignature(sig);
      const isValid = await rsaVerify(dataBuf, sig, keyPair.rawKeyPair.publicKey);
      setVerificationResult(isValid);
    } catch (err: any) {
      alert('Signature failed: ' + err.message);
    } finally {
      setIsSigning(false);
    }
  };

  const handleAddCase = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `CAS-${Math.floor(Math.random() * 9000) + 1000}`;
    setActiveCases([{ id, ...newCase }, ...activeCases]);
    setShowAddModal(false);
    setNewCase({ title: '', client: '', status: 'PENDING', nextHearing: '' });
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2 flex items-center gap-3">
            <Scale className="w-8 h-8 text-amber-500" />
            Legal Practice Hub
          </h1>
          <p className="text-zinc-500 font-medium tracking-wide">Zero-Trust Case Management & Secure Client Communication.</p>
        </div>
          <button onClick={() => setShowAddModal(true)} className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 shadow-xl shadow-amber-500/20">
            <Briefcase className="w-4 h-4" />
            New Case File
          </button>
          <Link href="/chat" className="bg-white/5 border border-white/10 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Client Chat
          </Link>
        </div>


      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full" />
              
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-6">Initialize New Case</h2>
              
              <form onSubmit={handleAddCase} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Case Title</label>
                  <input 
                    required
                    value={newCase.title}
                    onChange={e => setNewCase({...newCase, title: e.target.value})}
                    placeholder="e.g. Smith vs. CyberCorp"
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Client Name</label>
                  <input 
                    required
                    value={newCase.client}
                    onChange={e => setNewCase({...newCase, client: e.target.value})}
                    placeholder="Full Name / Entity"
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Next Hearing</label>
                    <input 
                      type="date"
                      required
                      value={newCase.nextHearing}
                      onChange={e => setNewCase({...newCase, nextHearing: e.target.value})}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Priority</label>
                    <select 
                      value={newCase.status}
                      onChange={e => setNewCase({...newCase, status: e.target.value})}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all appearance-none"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="IN_PROGRESS">ACTIVE</option>
                      <option value="REVIEW">URGENT</option>
                    </select>
                  </div>
                </div>
                
                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-6 py-4 rounded-2xl bg-white/5 text-zinc-400 font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-6 py-4 rounded-2xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:bg-amber-400 transition-all"
                  >
                    Create Case
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Case Management */}
        <div className="lg:col-span-2 space-y-8">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/5 p-6 rounded-[2rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Briefcase className="w-16 h-16 text-amber-500" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">Active Cases</p>
              <h2 className="text-4xl font-black text-white tracking-tighter">14</h2>
            </div>
            
            <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/5 p-6 rounded-[2rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Users className="w-16 h-16 text-blue-500" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">Active Clients</p>
              <h2 className="text-4xl font-black text-white tracking-tighter">28</h2>
            </div>

            <div className="bg-gradient-to-br from-amber-600 to-amber-800 p-6 rounded-[2rem] shadow-2xl shadow-amber-500/20 relative overflow-hidden">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200 mb-2">Upcoming Hearings</p>
              <h2 className="text-4xl font-black text-white tracking-tighter">3</h2>
              <p className="text-xs text-amber-300 font-bold uppercase mt-2">Next in 12 days</p>
            </div>
          </div>

          {/* Active Cases List */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                <Briefcase className="w-6 h-6 text-amber-500" />
                Case Management
              </h3>
              <div className="flex gap-2">
                <button className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <Search className="w-4 h-4 text-zinc-400" />
                </button>
                <button className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <Filter className="w-4 h-4 text-zinc-400" />
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              {activeCases.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-5 bg-black/40 border border-white/5 rounded-3xl group hover:border-amber-500/30 transition-all cursor-pointer">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-black text-xs">
                      {c.id.split('-')[1]}
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm tracking-tight">{c.title}</h4>
                      <p className="text-zinc-500 text-[10px] font-black uppercase flex items-center gap-2 mt-1">
                        <span className="text-zinc-400">{c.client}</span>
                        <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                        <Clock className="w-3 h-3" /> Next Hearing: {new Date(c.nextHearing).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                      c.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                      c.status === 'REVIEW' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                      'bg-zinc-800 text-zinc-400 border-white/5'
                    }`}>
                      {c.status.replace('_', ' ')}
                    </span>
                    <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-amber-500 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-4 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-white/5 transition-all">
              View All Cases
            </button>
          </div>
        </div>

        {/* Right Column: Utilities */}
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/5 rounded-[2.5rem] p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Recent Documents</h3>
              <Link href="/files" className="text-[10px] font-black text-amber-500 uppercase tracking-widest hover:text-amber-400">Vault</Link>
            </div>
            
            <div className="space-y-4">
              {recentDocs.map((doc) => (
                <div key={doc.id} className="flex items-start gap-4 p-4 bg-black/20 rounded-2xl border border-white/5 hover:border-white/10 transition-colors cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                    <FileSignature className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-white truncate">{doc.name}</p>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleSignDocument(doc); }}
                        className="text-[9px] font-black uppercase text-amber-500 hover:text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg transition-colors"
                      >
                        Sign
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{doc.type}</span>
                      <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                      <span className="text-[9px] font-bold text-zinc-600 uppercase">{new Date(doc.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2">
              <ShieldAlert className="w-3 h-3 text-emerald-500" />
              Upload Encrypted Doc
            </button>
          </div>

          <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full" />
            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">Secure Consultation</h3>
            <p className="text-xs text-zinc-400 font-medium mb-6">End-to-end encrypted video and chat for confidential client meetings.</p>
            <Link href="/consultation" className="block w-full py-4 text-center bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-zinc-200 transition-all shadow-xl">
              Start Session
            </Link>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {isSigningModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSigningModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative bg-zinc-900 border border-white/10 rounded-[2.5rem] p-8 md:p-10 w-full max-w-xl shadow-2xl overflow-hidden"
             >
                <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-500" />
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20">
                      <FileSignature className="w-8 h-8 text-amber-500" />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black text-white tracking-tight uppercase">Digital Signature</h3>
                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Protocol: RSA-PSS / E2EE Integrity Check</p>
                   </div>
                </div>

                <div className="bg-black/40 border border-white/5 rounded-3xl p-6 mb-8">
                   <p className="text-zinc-400 text-xs font-medium mb-4 italic">Document to sign:</p>
                   <div className="flex items-center gap-3">
                      <div className="p-3 bg-white/5 rounded-xl text-amber-500"><ShieldCheck className="w-5 h-5" /></div>
                      <div>
                         <p className="text-white font-black uppercase text-sm">{signingDoc?.name}</p>
                         <p className="text-zinc-600 text-[9px] font-bold uppercase">{signingDoc?.type} • Hash generated locally</p>
                      </div>
                   </div>
                </div>

                {signature ? (
                   <div className="space-y-6">
                      <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl">
                         <div className="flex items-center gap-3 mb-4">
                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                            <h4 className="text-emerald-500 font-black uppercase text-xs tracking-widest">Integrity Verified</h4>
                         </div>
                         <div className="bg-black/60 p-4 rounded-2xl border border-white/5 mb-4">
                            <p className="text-[9px] font-black text-zinc-500 uppercase mb-2">RSA Signature Payload</p>
                            <p className="text-[10px] font-mono text-zinc-400 break-all leading-relaxed line-clamp-3">{signature}</p>
                         </div>
                         <div className="flex items-center justify-between text-[10px] font-black uppercase">
                            <span className="text-zinc-500">Signer Identity</span>
                            <span className="text-emerald-500">Verified Legal Counsel</span>
                         </div>
                      </div>
                      <button onClick={() => setIsSigningModalOpen(false)} className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl">Complete Workflow</button>
                   </div>
                ) : (
                   <div className="space-y-8">
                      <div className="flex items-start gap-4 p-4 bg-zinc-800/50 border border-white/5 rounded-2xl">
                         <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                         <p className="text-zinc-400 text-[10px] font-medium leading-relaxed">By signing, you are attaching a cryptographic proof of identity to this document hash. This process uses your hardware-backed private key and cannot be reversed.</p>
                      </div>
                      <div className="flex gap-4">
                         <button onClick={() => setIsSigningModalOpen(false)} className="flex-1 py-4 bg-white/5 text-zinc-500 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:text-white transition-all">Abort</button>
                         <button 
                          onClick={executeSignature}
                          disabled={isSigning}
                          className="flex-1 py-4 bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20 disabled:opacity-50"
                         >
                          {isSigning ? 'Hasing & Signing...' : 'Initialize Signature'}
                         </button>
                      </div>
                   </div>
                )}
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
