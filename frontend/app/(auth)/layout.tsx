import { ReactNode } from 'react';
import { motion } from 'framer-motion';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden font-sans">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/30 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">CYBERSUITE</h1>
          <p className="text-zinc-400 mt-2 text-sm">Next-Generation Security Platform</p>
        </div>
        
        {children}
      </div>
    </div>
  );
}
