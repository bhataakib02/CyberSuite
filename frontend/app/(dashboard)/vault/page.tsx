"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../../store/useAuthStore';
import { apiFetch } from '../../../lib/api';
import { 
  Lock, 
  Plus, 
  Key, 
  Copy, 
  Eye, 
  EyeOff, 
  Search, 
  ShieldAlert, 
  Check,
  RefreshCw,
  Globe,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Fingerprint
} from 'lucide-react';
import { deriveVaultKey, aesEncrypt, aesDecrypt, generateSaltHex, sha256 } from '../../../lib/crypto';

interface VaultItem {
  id: string;
  category: string;
  encryptedData: string;
  strength: number;
  createdAt: string;
  decrypted?: any;
}

export default function VaultPage() {
  const { user, login, accessToken } = useAuthStore();
  const [items, setItems] = useState<VaultItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Vault Auth
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [vaultKey, setVaultKey] = useState<CryptoKey | null>(null);
  const [authError, setAuthError] = useState('');
  
  // Setup State
  const [isSetupMode, setIsSetupMode] = useState(!user?.hasMasterPassword);
  const [setupStep, setSetupStep] = useState(1);
  const [recoveryKey, setRecoveryKey] = useState('');

  // Recovery State
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState('');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', username: '', email: '', password: '', url: '', notes: '', category: 'Login' });
  
  // Local UI state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState('All');

  // Vault Auto-Lock (5 min inactivity)
  useEffect(() => {
    if (!isUnlocked) return;
    
    let timeoutId: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        lockVault();
        alert('Vault automatically locked due to inactivity.');
      }, 5 * 60 * 1000);
    };

    resetTimer();
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer));

    return () => {
      clearTimeout(timeoutId);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [isUnlocked]);

  useEffect(() => {
    if (accessToken) fetchVaultItems();
    if (user?.hasMasterPassword) setIsSetupMode(false);
  }, [accessToken, user]);

  const fetchVaultItems = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/vault');
      const data = await res.json();
      if (res.ok) {
        setItems(data.entries || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupVault = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const salt = generateSaltHex(16);
      const key = await deriveVaultKey(masterPassword, salt);
      
      const recKey = Array.from(crypto.getRandomValues(new Uint8Array(12)))
        .map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      setRecoveryKey(recKey);
      const recoveryHash = await sha256(recKey);
      
      const res = await apiFetch('/auth/vault-setup', {
        method: 'POST',
        body: JSON.stringify({ 
          masterPasswordSalt: salt,
          masterPasswordHash: 'PROTECTED',
          recoveryKeyHash: recoveryHash,
        }),
      });

      if (!res.ok) throw new Error('Failed to save vault configuration');
      
      const data = await res.json();
      login(data.user, accessToken!); // Update user state with hasMasterPassword: true
      
      setVaultKey(key);
      setSetupStep(2);
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleUnlockVault = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const salt = user?.masterPasswordSalt || "cybersuite_static_salt_fallback"; 
      const key = await deriveVaultKey(masterPassword, salt);
      
      let decryptionSuccess = true;
      if (items.length > 0) {
        try {
          const firstItem = items[0];
          const parts = firstItem.encryptedData.split(':');
          await aesDecrypt(parts[1], parts[0], key);
        } catch (e) {
          decryptionSuccess = false;
        }
      }

      if (!decryptionSuccess && items.length > 0) throw new Error('Invalid master password');

      setVaultKey(key);
      
      const decryptedItems = await Promise.all(items.map(async (item) => {
        try {
          const parts = item.encryptedData.split(':');
          if (parts.length === 2) {
            const decStr = await aesDecrypt(parts[1], parts[0], key);
            return { ...item, decrypted: JSON.parse(decStr) };
          }
          return item;
        } catch (err) {
          return item;
        }
      }));
      
      setItems(decryptedItems);
      setIsUnlocked(true);
      setMasterPassword('');
    } catch (err: any) {
      setAuthError(err.message || 'Failed to unlock vault');
    }
  };

  const handleRecoverVault = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const recoveryHash = await sha256(recoveryInput.toUpperCase());
      const newSalt = generateSaltHex(16);
      
      const res = await apiFetch('/auth/vault-recovery', {
        method: 'POST',
        body: JSON.stringify({ 
          recoveryKeyHash: recoveryHash,
          newMasterPasswordHash: 'PROTECTED',
          newMasterPasswordSalt: newSalt
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Recovery failed');
      }

      alert('Vault recovered! Set a new master password now.');
      window.location.reload();
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const lockVault = () => {
    setIsUnlocked(false);
    setVaultKey(null);
    setItems(items.map(i => ({ ...i, decrypted: undefined })));
  };

  const calculateStrength = (password: string): number => {
    let score = 0;
    if (!password) return 0;
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 20;
    if (/[A-Z]/.test(password)) score += 20;
    if (/[0-9]/.test(password)) score += 20;
    if (/[^A-Za-z0-9]/.test(password)) score += 20;
    return score;
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaultKey) return;
    
    try {
      const strength = calculateStrength(newItem.password);
      const payloadString = JSON.stringify(newItem);
      const { encryptedMessage, iv } = await aesEncrypt(payloadString, vaultKey);
      const encryptedData = `${iv}:${encryptedMessage}`;

      const res = await apiFetch('/vault', {
        method: 'POST',
        body: JSON.stringify({ encryptedData, category: newItem.category, strength }),
      });

      const data = await res.json();
      if (res.ok) {
        const addedItem = { ...data.entry, decrypted: newItem, strength };
        setItems([addedItem, ...items]);
        setIsAddModalOpen(false);
        setNewItem({ title: '', username: '', email: '', password: '', url: '', notes: '', category: 'Login' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this secret?')) return;
    try {
      const res = await apiFetch(`/vault/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems(items.filter(i => i.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    
    // Auto-clear clipboard after 10 seconds for security
    setTimeout(() => {
      navigator.clipboard.writeText('');
      setCopiedId(null);
    }, 10000);
  };

  const togglePasswordVisibility = (id: string) => {
    const newSet = new Set(visiblePasswords);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setVisiblePasswords(newSet);
  };

  // ── RENDER: SETUP FLOW ─────────────────────────────────────────────────────
  if (isSetupMode) {
    return (
      <div className="max-w-md mx-auto mt-20 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-[var(--card)]/60 backdrop-blur-3xl border border-[var(--border)] p-6 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600" />
          {setupStep === 1 ? (
            <>
              <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center border border-blue-500/20 mx-auto mb-8 shadow-inner">
                <ShieldAlert className="w-10 h-10 text-blue-400" />
              </div>
              <h2 className="text-3xl font-black text-white mb-2 text-center tracking-tight">Vault Setup</h2>
              <p className="text-zinc-500 text-sm mb-8 text-center font-medium">Create a Master Password to locally encrypt your data. We never see this.</p>
              
              <form onSubmit={handleSetupVault} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Master Key</label>
                  <input 
                    type="password"
                    required
                    minLength={8}
                    value={masterPassword}
                    onChange={e => setMasterPassword(e.target.value)}
                    placeholder="Enter master password..."
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-mono"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-95 uppercase tracking-widest text-sm"
                >
                  Initialize Secure Vault
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center border border-emerald-500/20 mx-auto mb-8">
                <ShieldCheck className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-3xl font-black text-white mb-2 text-center tracking-tight">Recovery Protocol</h2>
              <p className="text-zinc-500 text-sm mb-8 text-center font-medium">This is the ONLY way to recover your vault if you forget your master password.</p>
              
              <div className="bg-black/60 border border-white/10 rounded-2xl p-6 mb-8 flex flex-col items-center gap-4 group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                    onClick={() => copyToClipboard(recoveryKey, 'recovery')}
                    className="p-2 bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-all"
                  >
                    {copiedId === 'recovery' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-white font-mono text-base md:text-lg font-black tracking-[0.2em] text-center break-all select-all">
                  {recoveryKey.match(/.{1,4}/g)?.join(' ') || recoveryKey}
                </span>
                <p className="text-[9px] font-black text-blue-500/50 uppercase tracking-widest">Permanent Recovery Hash</p>
              </div>
              
              <button 
                onClick={() => { setIsSetupMode(false); setIsUnlocked(true); }}
                className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-zinc-200 transition-all uppercase tracking-widest text-sm shadow-xl"
              >
                Saved, Open Vault
              </button>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  // ── RENDER: RECOVERY FLOW ──────────────────────────────────────────────────
  if (isRecoveryMode) {
    return (
      <div className="max-w-md mx-auto mt-20 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[var(--card)]/60 backdrop-blur-3xl border border-[var(--border)] p-6 md:p-10 rounded-[2.5rem] shadow-2xl text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 to-red-600" />
          <div className="w-20 h-20 bg-orange-500/10 rounded-3xl flex items-center justify-center border border-orange-500/20 mx-auto mb-8">
            <Fingerprint className="w-10 h-10 text-orange-400" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Vault Recovery</h2>
          <p className="text-zinc-500 text-sm mb-8 font-medium">Enter your 24-character recovery key to override vault encryption.</p>
          
          {authError && <p className="text-red-400 text-xs font-bold mb-6 bg-red-500/10 p-4 rounded-2xl border border-red-500/10">{authError}</p>}
          
          <form onSubmit={handleRecoverVault} className="space-y-6">
            <input 
              type="text"
              required
              value={recoveryInput}
              onChange={e => setRecoveryInput(e.target.value.toUpperCase())}
              placeholder="XXXX XXXX XXXX XXXX"
              className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-5 text-white text-center font-mono text-base font-black tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-orange-500/30 transition-all placeholder:text-zinc-800"
            />
            <button 
              type="submit"
              className="w-full bg-orange-600 text-white font-black py-4 rounded-2xl hover:bg-orange-500 transition-all uppercase tracking-widest text-sm shadow-xl shadow-orange-600/20"
            >
              Force Recovery
            </button>
          </form>
          
          <button 
            onClick={() => setIsRecoveryMode(false)}
            className="text-xs font-black uppercase tracking-widest text-zinc-600 mt-8 hover:text-white transition-colors"
          >
            Abort Protocol
          </button>
        </motion.div>
      </div>
    );
  }

  // ── RENDER: UNLOCK SCREEN ──────────────────────────────────────────────────
  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto mt-20 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[var(--card)]/60 backdrop-blur-3xl border border-[var(--border)] p-6 md:p-10 rounded-[2.5rem] shadow-2xl text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-purple-600" />
          <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center border border-blue-500/20 mx-auto mb-8 shadow-inner">
            <Lock className="w-10 h-10 text-blue-400" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Vault Locked</h2>
          <p className="text-zinc-500 text-sm mb-8 font-medium">Verify your master identity to access encrypted secrets.</p>
          
          {authError && <p className="text-red-400 text-xs font-bold mb-6 bg-red-500/10 p-4 rounded-2xl border border-red-500/10">{authError}</p>}
          
          <form onSubmit={handleUnlockVault} className="space-y-6">
            <input 
              type="password"
              required
              value={masterPassword}
              onChange={e => setMasterPassword(e.target.value)}
              placeholder="Master Password"
              className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-mono"
            />
            <button 
              type="submit"
              className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-zinc-200 transition-all uppercase tracking-widest text-sm shadow-xl active:scale-95"
            >
              Unlock Identity
            </button>
          </form>
          
          <button 
            onClick={() => setIsRecoveryMode(true)}
            className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mt-8 hover:text-white transition-colors border-b border-transparent hover:border-zinc-400"
          >
            Forgot Master Key?
          </button>
        </motion.div>
      </div>
    );
  }

  // ── RENDER: MAIN VAULT UI ──────────────────────────────────────────────────
  const filteredItems = items.filter(item => {
    const matchesSearch = item.decrypted?.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.decrypted?.username?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'Login', 'Finance', 'Identity', 'Secure Note'];

  return (
    <div className="space-y-8 p-4 md:p-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-4">
            <Lock className="w-10 h-10 text-blue-500" />
            Password Vault
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Local E2EE Active</span>
            </div>
            <p className="text-zinc-500 text-sm font-medium">Securely managing {items.length} encrypted entries.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={lockVault}
            className="px-6 py-3 bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white hover:border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl"
          >
            Lock Vault
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-500 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
              activeCategory === cat 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                : 'bg-zinc-900/50 text-zinc-500 hover:text-white hover:bg-zinc-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="relative max-w-xl group">
        <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-blue-500 transition-colors" />
        <input 
          type="text"
          placeholder="Search by title, username, or website..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-900/40 backdrop-blur-3xl border border-white/5 rounded-2xl pl-14 pr-4 py-5 text-white placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium relative z-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredItems.map(item => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900/40 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 hover:border-white/20 transition-all group shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-3xl rounded-full -mr-12 -mt-12" />
              
              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center border border-white/5 shadow-inner">
                    <Globe className="w-6 h-6 text-zinc-500 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white font-black tracking-tight truncate text-lg">{item.decrypted?.title || 'Unknown Secret'}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                       <span className={`w-2 h-2 rounded-full ${
                         item.strength >= 80 ? 'bg-emerald-500' : 
                         item.strength >= 60 ? 'bg-blue-500' : 
                         item.strength >= 40 ? 'bg-amber-500' : 'bg-red-500'
                       }`} />
                       <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                         {item.strength >= 80 ? 'Fortress' : 
                          item.strength >= 60 ? 'Secure' : 
                          item.strength >= 40 ? 'Vulnerable' : 'Critical'}
                       </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-4 bg-black/40 rounded-3xl p-5 border border-white/5 relative z-10">
                <div className="space-y-1.5 group/field">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Username</span>
                    <button 
                      onClick={() => copyToClipboard(item.decrypted?.username, `user-${item.id}`)}
                      className="text-zinc-600 hover:text-white transition-colors"
                    >
                      {copiedId === `user-${item.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-white text-sm font-mono break-all line-clamp-1 group-hover/field:line-clamp-none transition-all">{item.decrypted?.username}</p>
                </div>
                
                <div className="space-y-1.5 group/field">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Password</span>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => togglePasswordVisibility(item.id)}
                        className="text-zinc-600 hover:text-white transition-colors"
                      >
                        {visiblePasswords.has(item.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button 
                        onClick={() => copyToClipboard(item.decrypted?.password, `pass-${item.id}`)}
                        className="text-zinc-600 hover:text-white transition-colors"
                      >
                        {copiedId === `pass-${item.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-white text-sm font-mono tracking-wider truncate">
                    {visiblePasswords.has(item.id) ? item.decrypted?.password : '••••••••••••••••'}
                  </p>
                </div>

                {item.decrypted?.url && (
                  <a 
                    href={item.decrypted.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center justify-between pt-2 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors"
                  >
                    <span>Visit Website</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {!isLoading && filteredItems.length === 0 && (
          <div className="col-span-full py-24 text-center">
            <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
              <Search className="w-8 h-8 text-zinc-800" />
            </div>
            <h3 className="text-white text-xl font-black mb-2">No items found</h3>
            <p className="text-zinc-500 text-sm max-w-xs mx-auto">Your vault is clean. Click "Add Item" to securely encrypt your first secret.</p>
          </div>
        )}

        {isLoading && (
          <div className="col-span-full py-24 text-center">
            <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Synchronizing Vault...</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-[var(--card)] border border-[var(--border)] rounded-[2.5rem] p-6 md:p-10 w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600" />
              <h3 className="text-3xl font-black text-white mb-2 tracking-tight">New Secret</h3>
              <p className="text-zinc-500 text-sm font-medium mb-8">This data will be encrypted locally before being transmitted.</p>
              
              <form onSubmit={handleAddItem} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Platform / Service</label>
                    <input required type="text" value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium" placeholder="e.g. Amazon, GitHub" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Category</label>
                    <select required value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium appearance-none">
                      <option value="Login">Login</option>
                      <option value="Finance">Finance</option>
                      <option value="Identity">Identity</option>
                      <option value="Secure Note">Secure Note</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Username / Handle</label>
                    <input required type="text" value={newItem.username} onChange={e => setNewItem({...newItem, username: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium" placeholder="johndoe_99" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Login Email (Identity)</label>
                    <input type="email" value={newItem.email} onChange={e => setNewItem({...newItem, email: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium" placeholder="user@example.com" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Access Password</label>
                    <button type="button" onClick={() => setNewItem({...newItem, password: generateSaltHex(12)})} className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400">Auto-Generate</button>
                  </div>
                  <input required type="text" value={newItem.password} onChange={e => setNewItem({...newItem, password: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-mono" placeholder="••••••••" />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Portal URL (Optional)</label>
                    <input type="url" value={newItem.url} onChange={e => setNewItem({...newItem, url: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium" placeholder="https://" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Secure Notes</label>
                    <input type="text" value={newItem.notes} onChange={e => setNewItem({...newItem, notes: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium" placeholder="Backup codes, hints..." />
                  </div>
                </div>
                
                <div className="flex gap-4 pt-6">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all">Cancel</button>
                  <button type="submit" className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95">Encrypt & Store</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
