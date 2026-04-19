"use client";

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function VerifyContent() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  useEffect(() => {
    if (!email) {
      router.push('/login');
    }
  }, [email, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setMessage(data.message);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('New code sent to your email');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to resend code');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl max-w-md w-full"
    >
      <div className="flex justify-center mb-6">
        <div className="p-3 bg-blue-500/10 rounded-full">
          <Shield className="w-8 h-8 text-blue-500" />
        </div>
      </div>
      
      <h2 className="text-2xl font-semibold text-white mb-2 text-center">Verify Email</h2>
      <p className="text-zinc-400 text-sm text-center mb-8">
        We sent a 6-digit verification code to <br />
        <span className="text-white font-medium">{email}</span>
      </p>
      
      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg text-sm text-center">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 rounded-lg text-sm text-center">
          {message}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-6">
        <div>
          <input
            type="text"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] text-white placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="000000"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || code.length !== 6}
          className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Verifying...' : 'Verify Email'}
        </button>
      </form>

      <div className="mt-8 flex flex-col items-center gap-4">
        <button 
          onClick={handleResend}
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          Didn't receive a code? <span className="text-blue-400 underline">Resend</span>
        </button>
        
        <Link href="/login" className="flex items-center text-sm text-zinc-500 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Sign In
        </Link>
      </div>
    </motion.div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="text-white">Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
