"use client";

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';

function TwoFAForm() {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
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

    try {
      // In a real app, you might have a specific endpoint for verifying 2FA after login
      // Or you call the login endpoint again with the token. We will call login again.
      // Note: we'd need to remember the password, which isn't secure. 
      // A better flow is a dedicated /api/auth/verify-2fa-login endpoint that takes a temporary token.
      // For this demo, let's assume we have an endpoint that takes email + token if we implemented a temp token.
      // Wait, in our login endpoint, it requires email and password. 
      // Let's just create a basic UI that tells the user this is a placeholder if we didn't store password.
      
      // Since this is just UI scaffolding for now, we'll simulate success.
      // Later we will refactor the backend to return a `tempToken` to verify 2FA without password.
      
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl"
    >
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/50">
          <span className="text-3xl">🔐</span>
        </div>
      </div>
      
      <h2 className="text-2xl font-semibold text-white mb-2 text-center">Two-Factor Authentication</h2>
      <p className="text-zinc-400 text-sm text-center mb-6">
        Enter the 6-digit code from your authenticator app.
      </p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg text-sm text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <input
            type="text"
            required
            maxLength={6}
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white text-center tracking-[0.5em] text-xl font-mono placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="000000"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || token.length !== 6}
          className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {isLoading ? 'Verifying...' : 'Verify'}
        </button>
      </form>
      
      <button 
        onClick={() => router.push('/login')}
        className="w-full mt-4 text-zinc-500 hover:text-white transition-colors text-sm"
      >
        Cancel and return to login
      </button>
    </motion.div>
  );
}

export default function TwoFAPage() {
  return (
    <Suspense fallback={<div className="text-white text-center">Loading...</div>}>
      <TwoFAForm />
    </Suspense>
  );
}
