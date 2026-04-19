"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Paperclip, 
  ShieldCheck, 
  ChevronLeft, 
  MoreVertical,
  Phone,
  Video,
  FileText,
  Clock,
  X
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function ConsultationChat() {
  const { id } = useParams();
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Polling for demo
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await apiFetch(`/consultation/chat/${id}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const msg = {
      encryptedContent: input, // In real E2EE, this would be AES encrypted
      encryptedKey: 'mock_key',
      iv: 'mock_iv',
      type: 'TEXT'
    };

    try {
      const res = await apiFetch(`/consultation/chat/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify(msg)
      });
      if (res.ok) {
        setInput('');
        fetchMessages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-5xl mx-auto bg-zinc-900 border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
      {/* Chat Header */}
      <header className="p-6 bg-black/40 border-b border-white/5 flex items-center justify-between backdrop-blur-xl relative z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded-xl transition-all">
            <ChevronLeft className="w-5 h-5 text-zinc-400" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-xl">D</div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-black tracking-tight">Dr. Sarah Connor</h3>
                <ShieldCheck className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> E2EE Active
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <button className="p-3 hover:bg-white/5 rounded-xl text-zinc-500 transition-all"><Phone className="w-5 h-5" /></button>
           <button className="p-3 hover:bg-white/5 rounded-xl text-zinc-500 transition-all"><Video className="w-5 h-5" /></button>
           <button className="p-3 hover:bg-white/5 rounded-xl text-zinc-500 transition-all"><MoreVertical className="w-5 h-5" /></button>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide bg-zinc-900/50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-8">
               <div className="bg-black/40 border border-white/5 px-6 py-2 rounded-full text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                  <Clock className="w-3 h-3" /> Consultation Started - Today 11:30 AM
               </div>
            </div>
            
            {messages.map((m, i) => (
              <motion.div 
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.senderId === 'ME' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] p-5 rounded-[2rem] text-sm font-medium ${
                  m.senderId === 'ME' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-zinc-800 text-zinc-100 rounded-tl-none'
                }`}>
                  {m.encryptedContent}
                  <p className={`text-[8px] mt-2 opacity-50 uppercase font-black ${m.senderId === 'ME' ? 'text-right' : 'text-left'}`}>
                    11:32 AM • {m.senderId === 'ME' ? 'Read' : 'Verified'}
                  </p>
                </div>
              </motion.div>
            ))}
            <div ref={scrollRef} />
          </>
        )}
      </main>

      {/* Shared Document Banner (Mock) */}
      <div className="px-8 py-3 bg-blue-500/5 border-t border-white/5 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-blue-500" />
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Medical_Report_v2.pdf shared with Dr. Sarah</p>
         </div>
         <button className="text-zinc-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
      </div>

      {/* Input Area */}
      <footer className="p-6 bg-black/40 border-t border-white/5 backdrop-blur-xl relative z-10">
        <form onSubmit={handleSend} className="flex items-center gap-4 bg-zinc-900 border border-white/10 p-2 rounded-2xl">
          <button type="button" className="p-3 hover:bg-white/5 rounded-xl text-zinc-500 transition-all">
            <Paperclip className="w-5 h-5" />
          </button>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your secure message..." 
            className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none placeholder:text-zinc-600"
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95">
            <Send className="w-5 h-5" />
          </button>
        </form>
      </footer>
    </div>
  );
}
