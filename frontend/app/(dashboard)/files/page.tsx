"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../../store/useAuthStore';
import { apiFetch } from '../../../lib/api';
import { aesEncrypt, aesDecrypt, deriveVaultKey, sha256 } from '../../../lib/crypto';
import { 
  FolderLock, 
  Upload, 
  Search, 
  FileText, 
  Download, 
  Trash2, 
  Lock, 
  CheckCircle2, 
  X,
  FileBadge2,
  GraduationCap,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

interface FileRecord {
  id: string;
  category: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

const CATEGORIES = [
  { id: 'GENERAL', label: 'General Storage', icon: FileText },
  { id: 'LEGAL', label: 'Legal Vault', icon: FileBadge2 },
  { id: 'STUDENT', label: 'Academic Docs', icon: GraduationCap },
  { id: 'IDENTITY', label: 'Identity Proofs', icon: ShieldCheck },
];

export default function SecureFileVault() {
  const { user } = useAuthStore();
  const [masterPassword, setMasterPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const res = await apiFetch('/files');
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (!masterPassword) {
      alert("Master Password required to encrypt files.");
      return;
    }

    const file = e.target.files[0];
    if (file.size > 50 * 1024 * 1024) {
      alert("File size exceeds 50MB limit.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // 1. Read file as array buffer
      const buffer = await file.arrayBuffer();
      // 2. Convert to Base64 for AES encryption
      const base64String = Buffer.from(buffer).toString('base64');
      setUploadProgress(30);

      // 3. Derive key and encrypt payload
      if (!user?.masterPasswordSalt) throw new Error("Missing vault salt");
      const derivedKey = await deriveVaultKey(masterPassword, user.masterPasswordSalt);
      const encryptedData = await aesEncrypt(base64String, derivedKey);
      setUploadProgress(60);

      // 4. Create Blob from encrypted data
      const encryptedBlob = new Blob([JSON.stringify(encryptedData)], { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', encryptedBlob, file.name + '.enc');
      formData.append('fileName', file.name);
      formData.append('category', activeCategory === 'ALL' ? 'GENERAL' : activeCategory);
      setUploadProgress(80);

      // 5. Upload
      const res = await apiFetch('/files/upload', {
        method: 'POST',
        headers: {
          // Do NOT set Content-Type here, let browser set multipart/form-data with boundary
        },
        body: formData
      });

      if (res.ok) {
        setUploadProgress(100);
        await fetchFiles();
      } else {
        const err = await res.json();
        alert(err.error || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to encrypt or upload file.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (fileRecord: FileRecord) => {
    if (!masterPassword) {
      alert("Master Password required to decrypt files.");
      return;
    }
    
    try {
      const res = await apiFetch(`/files/download/${fileRecord.id}`);
      if (!res.ok) throw new Error('Failed to download');
      
      if (!user?.masterPasswordSalt) throw new Error("Missing vault salt");
      const derivedKey = await deriveVaultKey(masterPassword, user.masterPasswordSalt);
      const encryptedText = await res.text();
      const parsedData = JSON.parse(encryptedText);
      const base64String = await aesDecrypt(parsedData.encryptedMessage, parsedData.iv, derivedKey);
      
      // Convert base64 back to Blob
      const byteCharacters = atob(base64String);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: fileRecord.mimeType });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileRecord.fileName;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error(err);
      alert('Failed to download or decrypt file.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this encrypted file?')) return;
    try {
      const res = await apiFetch(`/files/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFiles(files.filter(f => f.id !== id));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete file');
    }
  };

  const filteredFiles = files.filter(f => {
    const matchesCategory = activeCategory === 'ALL' || f.category === activeCategory;
    const matchesSearch = f.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <Lock className="w-16 h-16 text-zinc-800 mb-6" />
        <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-widest">Vault Locked</h2>
        <p className="text-zinc-500 font-medium max-w-md mb-8">Enter your Master Password to decrypt and access your secure files.</p>
        <div className="w-full max-w-sm space-y-4">
          <input 
            type="password"
            value={masterPassword}
            onChange={(e) => setMasterPassword(e.target.value)}
            placeholder="Master Password"
            className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all text-center font-mono"
            onKeyDown={(e) => e.key === 'Enter' && setIsUnlocked(true)}
          />
          <button 
            onClick={() => setIsUnlocked(true)}
            disabled={!masterPassword}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50"
          >
            Unlock Vault
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 md:p-0">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <FolderLock className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Secure File Vault</h1>
          </div>
          <p className="text-zinc-500 font-medium">End-to-End Encrypted Document Storage.</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50"
          >
            {isUploading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            {isUploading ? `ENCRYPTING ${uploadProgress}%` : 'SECURE UPLOAD'}
          </button>
        </div>
      </header>

      {/* Categories & Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => setActiveCategory('ALL')}
              className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${
                activeCategory === 'ALL' 
                  ? 'bg-white text-black shadow-xl' 
                  : 'bg-black/40 text-zinc-500 hover:bg-white/5 border border-white/5'
              }`}
            >
              All Files
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${
                  activeCategory === cat.id 
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 border border-blue-500' 
                    : 'bg-black/40 text-zinc-500 hover:bg-white/5 border border-white/5'
                }`}
              >
                <cat.icon className="w-4 h-4" />
                {cat.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="relative w-full lg:w-72 shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium"
          />
        </div>
      </div>

      {/* File List Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-zinc-500 font-bold uppercase tracking-widest text-xs">Decrypting Vault Catalog...</div>
      ) : filteredFiles.length === 0 ? (
        <div className="bg-black/20 border border-white/5 rounded-[2rem] p-12 text-center">
          <FolderLock className="w-16 h-16 text-zinc-800 mx-auto mb-4" />
          <p className="text-white font-bold text-lg mb-1">No secure files found.</p>
          <p className="text-zinc-500 text-sm font-medium">Upload encrypted documents to safe-keep them.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredFiles.map((file) => {
              const catDef = CATEGORIES.find(c => c.id === file.category) || CATEGORIES[0];
              const Icon = catDef.icon;
              
              return (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-black/40 border border-white/5 rounded-3xl p-5 hover:border-white/10 transition-all group flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center text-zinc-400 border border-white/5">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 bg-white/5 px-2 py-1 rounded-md">
                      {file.category}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="text-white font-black text-sm truncate mb-1" title={file.fileName}>{file.fileName}</h3>
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                      <span>{formatSize(file.fileSize)}</span>
                      <span>•</span>
                      <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/5">
                    <button 
                      onClick={() => handleDownload(file)}
                      className="flex-1 bg-white/5 hover:bg-blue-600/20 hover:text-blue-400 text-zinc-400 font-bold text-xs py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Download
                    </button>
                    <button 
                      onClick={() => handleDelete(file.id)}
                      className="p-2.5 bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-zinc-500 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
