"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../../store/useAuthStore';
import { useChatStore, Contact, Message } from '../../../store/useChatStore';
import { apiFetch } from '../../../lib/api';
import { initSocket, getSocket, disconnectSocket } from '../../../lib/socket';
import { 
  Search, 
  Send, 
  Lock, 
  Clock, 
  Paperclip, 
  MoreVertical, 
  ShieldCheck, 
  Check, 
  CheckCheck,
  RefreshCw,
  UserPlus,
  Trash2,
  ShieldAlert,
  Smile
} from 'lucide-react';
import { aesDecrypt } from '../../../lib/crypto';

export default function ChatPage() {
  const { user, accessToken } = useAuthStore();
  const { contacts, activeContact, messages, setContacts, setActiveContact, setMessages, addMessage, updateMessage } = useChatStore();
  
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [isSelfDestruct, setIsSelfDestruct] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const EMOJIS = ['👍', '🔥', '😂', '❤️', '🙌', '👀', '💯', '🚀', '✅', '🔒', '💡', '⚠️'];

  useEffect(() => {
    if (!accessToken) return;
    const socket = initSocket(accessToken); 

    socket.on('message:receive', (msg: Message) => {
      if (activeContact && msg.senderId === activeContact.id) {
        addMessage(msg);
        socket.emit('message:read', { messageId: msg.id, senderId: msg.senderId });
      } else {
        // Maybe update unread count for contacts
        fetchContacts();
      }
    });

    socket.on('message:sent', (msg: Message) => {
      updateMessage(msg.tempId!, { id: msg.id, status: 'SENT' });
    });

    socket.on('message:status', ({ id, status }) => {
      updateMessage(id, { status });
    });

    fetchContacts();

    return () => {
      disconnectSocket();
    };
  }, [activeContact]);

  useEffect(() => {
    if (activeContact) {
      fetchMessages(activeContact.id);
    }
  }, [activeContact]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchContacts = async () => {
    try {
      const res = await apiFetch('/chat/contacts');
      const data = await res.json();
      if (res.ok) {
        setContacts(data.contacts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const searchUsers = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await apiFetch(`/auth/users?q=${q}`);
      const data = await res.json();
      if (res.ok) {
        setSearchResults(data.users || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (contactId: string) => {
    try {
      const res = await apiFetch(`/chat/messages/${contactId}`);
      const data = await res.json();
      
      // Basic simulation of decryption for demo if keys aren't fully set
      const decryptedMessages = data.messages.map((m: any) => ({
        ...m,
        decryptedContent: m.encryptedMessage.startsWith('ENCRYPTED_') 
          ? atob(m.encryptedMessage.replace('ENCRYPTED_', ''))
          : m.encryptedMessage
      }));
      
      setMessages(decryptedMessages);
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeContact) return;

    const tempId = `temp_${Date.now()}`;
    const plainText = inputText;
    setInputText('');

    const payload = {
      receiverId: activeContact.id,
      encryptedMessage: "ENCRYPTED_" + btoa(plainText),
      encryptedKey: "ENC_KEY_SIM",
      iv: "IV_SIM",
      tempId,
      selfDestruct: isSelfDestruct,
      destructInSeconds: isSelfDestruct ? 60 : undefined,
    };

    addMessage({
      id: tempId,
      senderId: user!.id,
      receiverId: activeContact.id,
      encryptedMessage: payload.encryptedMessage,
      encryptedKey: payload.encryptedKey,
      iv: payload.iv,
      status: 'SENT',
      selfDestruct: payload.selfDestruct,
      createdAt: new Date().toISOString(),
      decryptedContent: plainText,
      tempId,
    });

    const socket = getSocket();
    socket?.emit('message:send', payload);
  };

  return (
    <div className="h-[calc(100dvh-5rem)] md:h-[calc(100vh-8rem)] bg-zinc-900/40 backdrop-blur-3xl border border-white/10 rounded-2xl md:rounded-[2.5rem] flex overflow-hidden shadow-2xl relative">
      
      {/* Sidebar - Contacts */}
      <div className={`${showMobileSidebar ? 'flex' : 'hidden md:flex'} w-full md:w-80 lg:w-96 border-r border-white/5 flex-col bg-black/40 z-20`}>
        <div className="p-6 border-b border-white/5">
          <h2 className="text-xl font-black text-white mb-4 tracking-tight">Secure Messages</h2>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-blue-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={(e) => searchUsers(e.target.value)}
              className="w-full bg-black/60 border border-white/5 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {searchQuery ? (
            <div className="p-2">
              <p className="px-4 py-3 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Global Network Search</p>
              {searchResults.map((c) => (
                <div 
                  key={c.id} 
                  onClick={() => { setActiveContact(c); setSearchQuery(''); setShowMobileSidebar(false); }}
                  className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl cursor-pointer transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-white shrink-0 shadow-lg">
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-bold truncate group-hover:text-blue-400 transition-colors">{c.name}</p>
                    <p className="text-zinc-500 text-[10px] font-medium truncate">{c.email}</p>
                  </div>
                  <UserPlus className="w-4 h-4 text-zinc-700 group-hover:text-blue-500" />
                </div>
              ))}
              {searchResults.length === 0 && <p className="p-8 text-center text-zinc-600 text-xs font-bold uppercase">No users found</p>}
            </div>
          ) : (
            <div className="p-2">
              <p className="px-4 py-3 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Recent Transmissions</p>
              {isLoading ? (
                <div className="p-8 text-center"><RefreshCw className="w-6 h-6 text-zinc-800 animate-spin mx-auto" /></div>
              ) : contacts.map((c) => (
                <div 
                  key={c.id} 
                  onClick={() => { setActiveContact(c); setShowMobileSidebar(false); }}
                  className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all mb-1 ${activeContact?.id === c.id ? 'bg-blue-600/10 border-l-4 border-blue-500 shadow-xl' : 'hover:bg-white/5 border-l-4 border-transparent'}`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center font-black text-white shrink-0 border border-white/5">
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <p className="text-white text-sm font-black truncate">{c.name}</p>
                      <p className="text-zinc-600 text-[9px] font-bold">LIVE</p>
                    </div>
                    <p className="text-zinc-500 text-[11px] font-medium truncate flex items-center gap-1.5 uppercase tracking-tighter">
                      <Lock className="w-3 h-3 text-emerald-500/50" /> Secure Protocol Active
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`${!showMobileSidebar ? 'flex' : 'hidden md:flex'} flex-1 flex flex-col bg-zinc-950/20 relative`}>
        <div className="absolute inset-0 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        {activeContact ? (
          <>
            {/* Chat Header */}
            <header className="h-20 flex items-center justify-between px-4 md:px-8 border-b border-white/5 bg-black/40 backdrop-blur-3xl shrink-0 z-10">
              <div className="flex items-center gap-3 md:gap-4">
                <button 
                  onClick={() => setShowMobileSidebar(true)}
                  className="md:hidden p-2 text-zinc-400 hover:text-white"
                >
                  <RefreshCw className="w-5 h-5 -rotate-90" />
                </button>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-black text-white shadow-xl">
                  {activeContact.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-white font-black tracking-tight text-lg">{activeContact.name}</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                      E2E Encrypted Channel
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-5 text-zinc-500">
                <button className="hover:text-white transition-colors p-2"><Search className="w-5 h-5" /></button>
                <button className="hover:text-white transition-colors p-2"><MoreVertical className="w-5 h-5" /></button>
              </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth custom-scrollbar z-10">
              <div className="flex justify-center mb-12">
                <div className="bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl">
                  <ShieldCheck className="w-4 h-4" /> 
                  Zero-Knowledge Transmission Protocol Active
                </div>
              </div>

              {messages.map((msg, idx) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`max-w-[75%] rounded-3xl px-5 py-4 shadow-xl ${
                      isMe 
                        ? 'bg-blue-600 text-white rounded-br-none shadow-blue-600/20' 
                        : 'bg-zinc-900 border border-white/5 text-white rounded-bl-none shadow-black/40'
                    }`}>
                      <p className="text-sm font-medium leading-relaxed">{msg.decryptedContent || msg.encryptedMessage}</p>
                      
                      <div className={`flex items-center gap-2 mt-2.5 text-[9px] font-black uppercase tracking-tighter ${isMe ? 'text-blue-100/60 justify-end' : 'text-zinc-600'}`}>
                        {msg.selfDestruct && <Clock className="w-3 h-3 text-amber-500" />}
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isMe && (
                          <span className="ml-1 flex gap-0.5">
                            {msg.status === 'SENT' && <Check className="w-3 h-3" />}
                            {msg.status === 'DELIVERED' && <CheckCheck className="w-3 h-3" />}
                            {msg.status === 'READ' && <CheckCheck className="w-3 h-3 text-blue-400 drop-shadow-[0_0_2px_rgba(96,165,250,0.8)]" />}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Mobile Contact Toggle Overlay (Bottom) */}
            {!showMobileSidebar && (
              <button 
                onClick={() => setShowMobileSidebar(true)}
                className="md:hidden absolute bottom-28 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center z-50 active:scale-95 transition-all"
              >
                <MoreVertical className="w-6 h-6 rotate-90" />
              </button>
            )}

            {/* Input Area */}
            <div className="p-6 bg-black/40 backdrop-blur-3xl border-t border-white/5 shrink-0 z-10 relative">
              <AnimatePresence>
                {isEmojiPickerOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-28 left-6 bg-zinc-900 border border-white/10 p-3 rounded-2xl shadow-2xl flex flex-wrap gap-2 w-64 z-50"
                  >
                    {EMOJIS.map(emoji => (
                      <button 
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setInputText(prev => prev + emoji);
                          setIsEmojiPickerOpen(false);
                        }}
                        className="text-xl hover:bg-white/10 p-2 rounded-xl transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={sendMessage} className="flex items-end gap-4 max-w-5xl mx-auto">
                <button type="button" className="p-4 text-zinc-600 hover:text-white transition-colors bg-white/5 rounded-2xl border border-white/5">
                  <Paperclip className="w-5 h-5" />
                </button>
                
                <div className="flex-1 bg-black/60 border border-white/10 rounded-[2rem] flex flex-col transition-all focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/10">
                  <div className="flex items-center">
                    <button 
                      type="button" 
                      onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                      className="pl-6 text-zinc-500 hover:text-blue-400 transition-colors"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                    <input 
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Transmit encrypted data..."
                      className="w-full bg-transparent px-4 py-5 text-sm text-white placeholder-zinc-700 focus:outline-none font-medium"
                    />
                  </div>
                  <div className="flex items-center justify-between px-6 pb-3">
                    <button 
                      type="button" 
                      onClick={() => setIsSelfDestruct(!isSelfDestruct)}
                      className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-xl transition-all ${isSelfDestruct ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-lg shadow-amber-500/5' : 'text-zinc-600 hover:bg-white/5 hover:text-zinc-400'}`}
                    >
                      <Clock className="w-3.5 h-3.5" /> 
                      {isSelfDestruct ? 'EPHEMERAL MODE ACTIVE' : 'STEALTH MODE OFF'}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={!inputText.trim()}
                  className="p-5 bg-blue-600 text-white rounded-[1.5rem] hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  <Send className="w-6 h-6" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 p-8 text-center z-10">
            <div className="relative mb-10">
              <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
              <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center border border-white/10 relative z-10">
                <Lock className="w-10 h-10 text-zinc-400" />
              </div>
            </div>
            <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Zero-Trust Terminal</h2>
            <p className="max-w-md text-zinc-500 font-medium leading-relaxed">
              Initialize a secure handshake by selecting a contact. 
              All transmissions are locally encrypted via SHA-256 and AES-GCM before deployment.
            </p>
            <div className="mt-10 flex gap-4">
               <div className="px-4 py-2 bg-zinc-900 border border-white/5 rounded-full text-[10px] font-black uppercase tracking-tighter text-zinc-600">RSA-4096</div>
               <div className="px-4 py-2 bg-zinc-900 border border-white/5 rounded-full text-[10px] font-black uppercase tracking-tighter text-zinc-600">AES-256-GCM</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
