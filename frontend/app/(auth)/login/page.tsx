"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/useAuthStore';
import { Eye, EyeOff, ShieldCheck, Fingerprint, Ghost } from 'lucide-react';
import { startAuthentication } from '@simplewebauthn/browser';

const getDashboardRoute = (role?: string) => {
  switch (role) {
    case 'ADMIN': return '/admin';
    case 'STUDENT': return '/student';
    case 'ACADEMIC': return '/academic';
    case 'DOCTOR': 
    case 'HEALTHCARE_STAFF': 
    case 'MEDICAL': return '/medical';
    case 'LAWYER': return '/lawyer';
    case 'EMERGENCY_PROFILE': return '/emergency';
    default: return '/dashboard';
  }
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isStealthMode, setIsStealthMode] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.data?.require2FA || data.require2FA) {
        router.push(`/2fa?email=${encodeURIComponent(email)}`);
        return;
      }

      const userData = data.data?.user || data.user;
      const tokenData = data.data?.accessToken || data.accessToken;
      useAuthStore.getState().login(userData, tokenData);
      router.push(getDashboardRoute(userData?.role));
    } catch (err: any) {
      if (err.message === 'Email not verified') {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWebAuthnLogin = async () => {
    if (!email) {
      setError('Please enter your email to use a security key.');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      // 1. Get options from server
      const optionsRes = await fetch('http://localhost:5000/api/auth/webauthn/login/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await optionsRes.json();

      if (!optionsRes.ok) throw new Error(data.error || data.message || 'Failed to get security key options');

      const { options, userId } = data.data || data;

      // 2. Start authentication ceremony
      const asseResp = await startAuthentication(options);

      // 3. Verify response with server
      const verifyRes = await fetch('http://localhost:5000/api/auth/webauthn/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: asseResp, userId }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) throw new Error(verifyData.error || verifyData.message || 'Security key authentication failed');

      const tokenData = verifyData.data?.accessToken || verifyData.accessToken;
      const userData = verifyData.data?.user || verifyData.user;

      if (tokenData) {
        useAuthStore.getState().login(userData, tokenData);
        router.push(getDashboardRoute(userData?.role));
      } else {
        throw new Error('Authentication response missing token');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative min-h-screen flex items-center justify-center transition-colors duration-1000 ${isStealthMode ? 'bg-[#050505]' : 'bg-transparent'}`}>
      {/* Decorative Blur */}
      {!isStealthMode && (
        <>
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-500/20 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-[80px] pointer-events-none" />
        </>
      )}
      
      <button 
        onClick={() => setIsStealthMode(!isStealthMode)}
        className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all z-50 group"
        title="Toggle Stealth Mode"
      >
        <Ghost className={`w-5 h-5 transition-colors ${isStealthMode ? 'text-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.5)]' : 'text-zinc-500'}`} />
      </button>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative p-1 px-1 rounded-[2.6rem] transition-all duration-1000 ${isStealthMode ? 'shadow-none' : 'bg-gradient-to-br from-white/10 to-transparent shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)]'}`}
      >
        <div className={`relative p-10 rounded-[2.5rem] w-full max-w-md overflow-hidden transition-all duration-1000 ${isStealthMode ? 'bg-black border-zinc-900 border' : 'bg-black/40 backdrop-blur-2xl border-white/10 border'}`}>
          {!isStealthMode && <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />}
          
          <div className="flex flex-col items-center mb-8">
            <motion.div 
              animate={isStealthMode ? { rotate: 0, scale: 0.9 } : { rotate: 3, scale: 1 }}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-1000 ${isStealthMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-2xl shadow-blue-500/20'}`}
            >
              <ShieldCheck className={`w-8 h-8 transition-colors duration-1000 ${isStealthMode ? 'text-zinc-700' : 'text-white'}`} />
            </motion.div>
            <h2 className={`text-3xl font-black tracking-tight transition-colors duration-1000 ${isStealthMode ? 'text-zinc-500' : 'text-white'}`}>CyberSuite</h2>
            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em] mt-2">Zero-Knowledge Authentication</p>
          </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-500 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full rounded-lg px-4 py-3 transition-all placeholder-zinc-700 focus:outline-none focus:ring-1 ${isStealthMode ? 'bg-zinc-950 border-zinc-900 text-zinc-400 focus:ring-zinc-800' : 'bg-black/50 border-white/10 text-white focus:ring-blue-500'}`}
              placeholder="name@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-500 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full rounded-lg px-4 py-3 transition-all placeholder-zinc-700 focus:outline-none focus:ring-1 pr-12 ${isStealthMode ? 'bg-zinc-950 border-zinc-900 text-zinc-400 focus:ring-zinc-800' : 'bg-black/50 border-white/10 text-white focus:ring-blue-500'}`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full font-medium py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 ${isStealthMode ? 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800 border border-zinc-800' : 'bg-white text-black hover:bg-zinc-200'}`}
          >
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className={`w-full border-t ${isStealthMode ? 'border-zinc-900' : 'border-white/10'}`}></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className={`px-2 transition-colors duration-1000 ${isStealthMode ? 'bg-black text-zinc-600' : 'bg-black/40 text-zinc-500'}`}>Or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleWebAuthnLogin}
          disabled={isLoading}
          className={`w-full flex items-center justify-center gap-2 font-medium py-3 rounded-lg transition-all border disabled:opacity-50 ${isStealthMode ? 'bg-zinc-950 border-zinc-900 text-zinc-600 hover:bg-zinc-900' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
        >
          <Fingerprint className="w-5 h-5" />
          Security Key
        </button>

        <div className="mt-8 flex justify-between items-center text-sm">
          <Link href="/forgot-password" className="text-zinc-600 hover:text-zinc-400 transition-colors">
            Forgot Password?
          </Link>
          <Link href="/register" className="text-zinc-400 hover:text-white transition-colors font-medium">
            Create Account
          </Link>
        </div>
        </div>
      </motion.div>
    </div>
  );
}
