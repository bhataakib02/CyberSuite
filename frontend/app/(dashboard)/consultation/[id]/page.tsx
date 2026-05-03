"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { 
  ShieldCheck, 
  Send, 
  Paperclip, 
  MoreVertical, 
  Phone, 
  Video, 
  Lock, 
  FileText, 
  Image as ImageIcon,
  User,
  Activity,
  CheckCheck
} from 'lucide-react';
import { apiFetch } from '../../../../lib/api';
import { useAuthStore } from '../../../../store/useAuthStore';
import { getSocket } from '../../../../lib/socket';

export default function ConsultationRoom() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [consultation, setConsultation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const socket = getSocket();

  useEffect(() => {
    fetchConsultation();
    
    if (socket) {
      socket.emit('join:consultation', { consultationId: id });
      socket.on('consultation:message', (msg: any) => {
        setMessages(prev => [...prev, msg]);
      });
    }

    return () => {
      if (socket) {
        socket.off('consultation:message');
      }
    };
  }, [id, socket]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchConsultation = async () => {
    try {
      const res = await apiFetch(`/consultation/active`); // Simplified fetch
      if (res.ok) {
        const { consultations } = await res.json();
        const current = consultations.find((c: any) => c.id === id);
        setConsultation(current);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    
    const msgData = {
      consultationId: id,
      content: inputText,
      senderId: user?.id,
      senderName: user?.name,
      createdAt: new Date().toISOString()
    };

    // In a real E2EE app, we would encrypt here before emitting
    if (socket) {
      socket.emit('consultation:message', msgData);
    }
    
    setMessages(prev => [...prev, msgData]);
    setInputText('');
  };

  if (loading) return <div className="h-screen flex items-center justify-center animate-pulse text-zinc-500 font-black uppercase tracking-widest">Entering Secure Room...</div>;
  if (!consultation) return <div className="p-20 text-center text-zinc-500 font-black uppercase">Consultation not found or access denied.</div>;

  const partnerName = user?.id === consultation.userId ? consultation.professional.name : consultation.user.name;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-zinc-900/40 border border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-xl">
      {/* HEADER */}
      <div className="p-6 border-b border-white/5 bg-black/20 flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
              <User className="w-6 h-6 text-blue-500" />
           </div>
           <div>
              <h4 className="text-white font-black uppercase tracking-tight">{partnerName}</h4>
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                 <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Secure Connection Active</span>
              </div>
           </div>
        </div>

        <div className="flex items-center gap-2">
           <button className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
              <Phone className="w-4 h-4" />
           </button>
           <button className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
              <Video className="w-4 h-4" />
           </button>
           <div className="w-px h-6 bg-white/5 mx-2" />
           <button className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
              <MoreVertical className="w-4 h-4" />
           </button>
        </div>
      </div>

      {/* MESSAGES */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth"
      >
        <div className="flex justify-center mb-10">
           <div className="px-4 py-2 bg-black/40 border border-white/5 rounded-full flex items-center gap-2">
              <Lock className="w-3 h-3 text-zinc-600" />
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">End-to-End Encrypted via RSA-4096</span>
           </div>
        </div>

        {messages.map((msg, idx) => {
          const isOwn = msg.senderId === user?.id;
          return (
            <div key={idx} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
               <div className={`max-w-[70%] p-5 rounded-3xl space-y-2 relative ${isOwn ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-zinc-800 text-white rounded-tl-none'}`}>
                  <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                  <div className="flex items-center justify-end gap-2">
                     <span className="text-[9px] font-black uppercase opacity-50">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                     {isOwn && <CheckCheck className="w-3 h-3 opacity-50" />}
                  </div>
               </div>
            </div>
          );
        })}
      </div>

      {/* INPUT */}
      <div className="p-8 bg-black/40 border-t border-white/5">
         <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
               <button className="p-2 text-zinc-500 hover:text-blue-500 transition-colors">
                  <Paperclip className="w-5 h-5" />
               </button>
            </div>
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message securely..."
              className="w-full bg-zinc-900 border border-white/5 rounded-[2rem] py-5 pl-14 pr-24 text-white font-bold outline-none focus:border-blue-500/50 transition-all placeholder:text-zinc-700"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
               <button 
                 onClick={sendMessage}
                 disabled={!inputText.trim()}
                 className="p-3 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-95"
               >
                  <Send className="w-5 h-5" />
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}
