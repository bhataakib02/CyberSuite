"use client";

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck,
    ShieldAlert,
    Search,
    Link as LinkIcon,
    Hash,
    Cpu,
    ExternalLink,
    RefreshCw,
    ArrowLeft,
    Upload,
    File
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '../../lib/api';
import Link from 'next/link';

function VerificationForm() {
    const searchParams = useSearchParams();
    const [txId, setTxId] = useState(searchParams.get('txId') || '');
    const [fileHash, setFileHash] = useState(searchParams.get('hash') || '');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    const calculateHash = async (file: File): Promise<string> => {
        const arrayBuffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            const hash = await calculateHash(file);
            setFileHash(hash);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!txId || !fileHash) return;

        setIsLoading(true);
        setError('');
        setResult(null);

        try {
            // Calling the public endpoint specifically designed for trustless verification
            const res = await apiFetch(`/medical/public/verify/${txId}?hash=${fileHash}`);
            const data = await res.json();

            if (res.ok) {
                setResult(data);
            } else {
                setError(data.error || 'Verification failed. Please check the integrity credentials.');
            }
        } catch (err) {
            setError('Intelligence network timeout. Ensure the verification node is active.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative max-w-4xl mx-auto pt-16 pb-24 px-6">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest mb-12 group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Return to Terminal
            </Link>

            <header className="text-center mb-20">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8"
                >
                    <Cpu className="w-4 h-4" /> CyberSuite Blockchain Audit Node
                </motion.div>
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-5xl md:text-8xl font-black tracking-tighter mb-8 italic"
                >
                    Verify <span className="text-blue-500">Integrity.</span>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-zinc-500 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed"
                >
                    Publicly cross-reference clinical file hashes against the Layer 2 immutable ledger.
                </motion.p>
            </header>

            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-zinc-900/40 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-8 md:p-14 shadow-2xl relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600" />

                <form onSubmit={handleVerify} className="space-y-10">
                    <div className="grid grid-cols-1 gap-8">
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`relative border-2 border-dashed rounded-[2rem] p-10 transition-all cursor-pointer group ${isDragging
                                    ? 'border-blue-500 bg-blue-500/10'
                                    : 'border-white/5 bg-black/20 hover:border-white/20'
                                }`}
                        >
                            <div className="flex flex-col items-center gap-4 text-center">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-zinc-600 group-hover:text-zinc-400'}`}>
                                    <Upload className="w-8 h-8" />
                                </div>
                                <div>
                                    <p className="text-sm font-black uppercase tracking-widest text-white mb-1">Drop file to hash</p>
                                    <p className="text-xs text-zinc-500 font-medium">Auto-computes SHA-256 digest locally</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
                                <LinkIcon className="w-4 h-4" /> Transaction Identifier (TXID)
                            </label>
                            <input
                                type="text"
                                value={txId}
                                onChange={(e) => setTxId(e.target.value)}
                                placeholder="0x..."
                                className="w-full bg-black/60 border border-white/5 rounded-3xl px-8 py-6 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-mono text-sm placeholder:text-zinc-800"
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
                                <Hash className="w-4 h-4" /> Document SHA-256 Digest
                            </label>
                            <input
                                type="text"
                                value={fileHash}
                                onChange={(e) => setFileHash(e.target.value)}
                                placeholder="Local payload hash..."
                                className="w-full bg-black/60 border border-white/5 rounded-3xl px-8 py-6 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-mono text-sm placeholder:text-zinc-800"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !txId || !fileHash}
                        className="w-full py-6 bg-white text-black font-black rounded-3xl text-xs uppercase tracking-[0.4em] transition-all hover:bg-blue-500 hover:text-white active:scale-95 disabled:opacity-30 flex items-center justify-center gap-4 shadow-2xl shadow-blue-500/10"
                    >
                        {isLoading ? (
                            <><RefreshCw className="w-5 h-5 animate-spin" /> Node Synchronization...</>
                        ) : (
                            <><Search className="w-5 h-5" /> Execute Integrity Audit</>
                        )}
                    </button>
                </form>

                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="mt-10 p-8 bg-red-500/5 border border-red-500/20 rounded-[2rem] flex items-center gap-6 text-red-400"
                        >
                            <ShieldAlert className="w-8 h-8 shrink-0" />
                            <p className="text-sm font-black uppercase tracking-widest">{error}</p>
                        </motion.div>
                    )}

                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
                            className="mt-16 space-y-8"
                        >
                            <div className={`p-10 rounded-[2.5rem] border transition-all ${result.isValid ? 'bg-emerald-500/5 border-emerald-500/20 shadow-emerald-500/5' : 'bg-red-500/5 border-red-500/20 shadow-red-500/5'}`}>
                                <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left mb-10 pb-10 border-b border-white/5">
                                    <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center shrink-0 shadow-2xl ring-4 ${result.isValid ? 'bg-emerald-500/20 text-emerald-400 ring-emerald-500/10' : 'bg-red-500/20 text-red-400 ring-red-500/10'}`}>
                                        {result.isValid ? <ShieldCheck className="w-12 h-12" /> : <ShieldAlert className="w-12 h-12" />}
                                    </div>
                                    <div>
                                        <h4 className={`text-3xl font-black tracking-tight mb-2 ${result.isValid ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {result.isValid ? 'Anchor Validated' : 'Integrity Mismatch'}
                                        </h4>
                                        <p className="text-zinc-400 text-sm font-medium italic opacity-60">"{result.message}"</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-6 bg-black/40 rounded-2xl border border-white/5">
                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Protocol Network</p>
                                        <p className="text-base text-white font-black">{result.blockchainData.network}</p>
                                    </div>
                                    <div className="p-6 bg-black/40 rounded-2xl border border-white/5">
                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Immutable Block</p>
                                        <p className="text-base text-white font-black"># {result.blockchainData.blockNumber}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

export default function VerificationPage() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/5 blur-[160px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/5 blur-[160px] rounded-full" />
            </div>
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-zinc-500 font-black uppercase tracking-widest">Initialising Audit Node...</div>}>
                <VerificationForm />
            </Suspense>
            <footer className="relative pb-12 text-center opacity-30 group hover:opacity-100 transition-opacity">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400">
                    CyberSuite Protocol // Cryptographic Truth Engine
                </p>
            </footer>
        </div>
    );
}