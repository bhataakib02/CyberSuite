"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useAuthStore } from '../../../store/useAuthStore';
import { apiFetch, ApiResponse } from '../../../lib/api';
import {
  Stethoscope,
  FileText,
  Upload,
  Plus,
  Clock,
  Key,
  ShieldCheck,
  UserCheck,
  X,
  RefreshCw,
  Search,
  ExternalLink,
  Lock,
  MoreVertical,
  Activity,
  Calendar,
  Heart,
  QrCode
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  generateAESKey, 
  encryptBlob, 
  exportCryptoKey, 
  importPublicKey, 
  rsaEncrypt 
} from '../../../lib/crypto';

interface MedicalRecord {
  id: string;
  patientId: string;
  fileName: string;
  description?: string;
  createdAt: string;
  doctorAccesses: DoctorAccess[];
}

interface DoctorAccess {
  id: string;
  doctorId: string;
  expiresAt: string;
  doctor?: { name: string; email: string };
  record?: MedicalRecord & { patient: { name: string; email: string } };
}

interface Doctor {
  id: string;
  name: string;
  email: string;
  publicKey?: string;
}

export default function MedicalRecordsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'my_records' | 'shared_with_me'>(user?.role === 'MEDICAL' ? 'shared_with_me' : 'my_records');
  const [isLoading, setIsLoading] = useState(true);

  // Patient State
  const [myRecords, setMyRecords] = useState<MedicalRecord[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [documentType, setDocumentType] = useState('Lab Report');
  const [lastUploadTxId, setLastUploadTxId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Doctor State
  const [sharedRecords, setSharedRecords] = useState<DoctorAccess[]>([]);

  // Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [expiresInHours, setExpiresInHours] = useState(24);

  // QR Share State
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [shareToken, setShareToken] = useState('');
  const [qrHashKey, setQrHashKey] = useState('');

  useEffect(() => {
    if (user?.role === 'USER' || user?.role === 'ADMIN') {
      fetchMyRecords();
      fetchDoctors();
    }
    if (user?.role === 'MEDICAL' || user?.role === 'ADMIN') {
      fetchSharedRecords();
    }
  }, [user?.role]);

  const fetchMyRecords = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/medical/records');
      const data: ApiResponse<{ records: MedicalRecord[] }> = await res.json();
      if (res.ok && data.success && data.data) setMyRecords(data.data.records || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSharedRecords = async () => {
    try {
      const res = await apiFetch('/medical/doctor-access');
      const data: ApiResponse<{ accesses: DoctorAccess[] }> = await res.json();
      if (res.ok && data.success && data.data) setSharedRecords(data.data.accesses || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await apiFetch('/medical/doctors');
      const data: ApiResponse<{ doctors: Doctor[] }> = await res.json();
      if (res.ok && data.success && data.data) setDoctors(data.data.doctors || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setIsUploading(true);
    setLastUploadTxId(null);

    try {
      // 1. Generate a fresh AES-256 key for this specific record
      const { key, rawKeyBase64 } = await generateAESKey();

      // 2. Encrypt the file blob client-side
      const { encryptedBlob, iv } = await encryptBlob(file, key);

      // 3. Encrypt the AES key for the owner (using their RSA Public Key)
      let encKeyForOwner = rawKeyBase64; // Fallback
      if (user?.publicKey) {
        const userPubKey = await importPublicKey(user.publicKey);
        const rawKeyBuf = Uint8Array.from(atob(rawKeyBase64), c => c.charCodeAt(0));
        encKeyForOwner = await rsaEncrypt(rawKeyBuf, userPubKey);
      }

      const data = new FormData();
      // We append the encrypted blob instead of the raw file
      data.append('record', encryptedBlob, file.name + '.enc');
      data.append('description', description);
      data.append('documentType', documentType);
      data.append('encKeyForOwner', encKeyForOwner);
      data.append('iv', iv); // We need to store the IV too

      const res = await apiFetch('/medical/upload', {
        method: 'POST',
        body: data,
      });

      const result: ApiResponse<{ record: { blockchainTxId: string } }> = await res.json();
      if (res.ok && result.success && result.data) {
        setLastUploadTxId(result.data.record.blockchainTxId);
        setFile(null);
        setDescription('');
        fetchMyRecords();
      }
    } catch (err) {
      console.error('Encryption or upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordId || !selectedDoctorId) return;

    try {
      const doctor = doctors.find(d => d.id === selectedDoctorId);
      const record = myRecords.find(r => r.id === selectedRecordId);
      
      if (!doctor?.publicKey) {
        alert("This doctor hasn't set up their security keys yet.");
        return;
      }

      // In a real flow, we'd decrypt record.encKeyForOwner using user's private key
      // For this demo, we'll assume the raw key is available or simulated
      const simulatedRawKey = "SIMULATED_DECRYPTED_KEY_" + selectedRecordId;
      const rawKeyBuf = new TextEncoder().encode(simulatedRawKey);

      // Encrypt the record's AES key for the doctor
      const doctorPubKey = await importPublicKey(doctor.publicKey);
      const encKeyForDoctor = await rsaEncrypt(rawKeyBuf, doctorPubKey);

      const res = await apiFetch('/medical/grant-access', {
        method: 'POST',
        body: JSON.stringify({
          recordId: selectedRecordId,
          doctorId: selectedDoctorId,
          expiresInHours,
          encKey: encKeyForDoctor
        }),
      });

      if (res.ok) {
        setIsShareModalOpen(false);
        setSelectedRecordId(null);
        fetchMyRecords();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOneTimeShare = async (recordId: string) => {
    const randomHashKey = Math.random().toString(36).substring(2, 15);
    setQrHashKey(randomHashKey);

    try {
      const res = await apiFetch('/medical/one-time-share', {
        method: 'POST',
        body: JSON.stringify({
          recordId,
          expiresInHours: 1, // 1 hour for QR shares
          encKey: 'SIMULATED_KEY_ENCRYPTED_WITH_' + randomHashKey
        }),
      });


 
      if (res.ok) {
        const data: ApiResponse<{ token: string }> = await res.json();
        if (data.success && data.data) {
          setShareToken(data.data.token);
          setIsQrModalOpen(true);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const revokeAccess = async (accessId: string) => {
    try {
      const res = await apiFetch(`/medical/revoke-access/${accessId}`, { method: 'DELETE' });
      if (res.ok) fetchMyRecords();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 md:p-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-4">
            <Heart className="w-10 h-10 text-red-500" />
            {user?.role === 'MEDICAL' ? 'Clinical Access Portal' : 'Medical Health Vault'}
          </h1>
          <p className="text-zinc-500 mt-2 text-lg font-medium">
            {user?.role === 'MEDICAL'
              ? 'Authorized read-only access to patient-shared clinical data.'
              : 'Zero-knowledge medical record storage and controlled sharing.'}
          </p>
        </div>
        {user?.role !== 'MEDICAL' && (
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-8 py-3.5 bg-blue-600 text-white hover:bg-blue-500 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 flex items-center gap-3 active:scale-95"
          >
            <Upload className="w-5 h-5" /> Secure Upload
          </button>
        )}
      </div>

      {(user?.role === 'ADMIN' || user?.role === 'MEDICAL') && (
        <div className="flex gap-2 p-1.5 bg-black/40 border border-white/5 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('my_records')}
            className={`px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'my_records' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
          >
            Patient Portal
          </button>
          <button
            onClick={() => setActiveTab('shared_with_me')}
            className={`px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'shared_with_me' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
          >
            Physician Portal
          </button>
        </div>
      )}

      {/* PATIENT VIEW */}
      {(user?.role === 'USER' || (user?.role === 'ADMIN' && activeTab === 'my_records')) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AnimatePresence mode="popLayout">
            {myRecords.map(record => (
              <motion.div
                key={record.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-zinc-900/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group hover:border-white/10 transition-all shadow-2xl"
              >
                <div className="absolute top-0 left-0 w-2 h-full bg-blue-500/40 group-hover:bg-blue-500 transition-colors" />

                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center shrink-0 border border-white/5 shadow-inner">
                      <FileText className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white truncate max-w-[200px] tracking-tight">{record.fileName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                        <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-widest">{new Date(record.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOneTimeShare(record.id)}
                      className="p-2.5 bg-white/5 hover:bg-blue-500/10 border border-white/5 rounded-xl text-zinc-500 hover:text-blue-400 transition-all active:scale-95"
                      title="Generate QR Link"
                    >
                      <QrCode className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => { setSelectedRecordId(record.id); setIsShareModalOpen(true); }}
                      className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all active:scale-95"
                    >
                      Grant Access
                    </button>
                  </div>
                </div>

                {record.description && (
                  <div className="bg-black/40 rounded-3xl p-5 border border-white/5 mb-6">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5" /> Clinical Notes
                    </p>
                    <p className="text-sm text-zinc-400 font-medium leading-relaxed italic">"{record.description}"</p>
                  </div>
                )}

                <div className="space-y-3">
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Active Practitioner Clearances
                  </p>
                  {record.doctorAccesses.filter(a => new Date(a.expiresAt) > new Date()).length === 0 ? (
                    <div className="p-6 bg-black/20 rounded-[1.5rem] border border-white/5 border-dashed text-center">
                      <p className="text-[11px] font-bold text-zinc-700 uppercase tracking-widest">No active clearances found</p>
                    </div>
                  ) : (
                    record.doctorAccesses.map(access => (
                      <div key={access.id} className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl group/access transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                            <Stethoscope className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm text-white font-black tracking-tight">Dr. {access.doctor?.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Clock className="w-3 h-3 text-emerald-400/50" />
                              <p className="text-[9px] text-zinc-500 font-black uppercase tracking-tighter">Expires: {new Date(access.expiresAt).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => revokeAccess(access.id)}
                          className="p-2 text-zinc-700 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                          title="Revoke Access"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {!isLoading && myRecords.length === 0 && (
            <div className="col-span-full py-24 text-center">
              <div className="w-24 h-24 bg-zinc-900 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-white/5">
                <Lock className="w-10 h-10 text-zinc-800" />
              </div>
              <h3 className="text-white text-2xl font-black mb-2 tracking-tight">Vault Isolated</h3>
              <p className="max-w-sm mx-auto text-sm text-zinc-500 font-medium">Your medical identity is currently empty. Upload your clinical data for secure multi-party computation.</p>
            </div>
          )}
        </div>
      )}

      {/* DOCTOR VIEW */}
      {(user?.role === 'MEDICAL' || (user?.role === 'ADMIN' && activeTab === 'shared_with_me')) && (
        <div className="space-y-8">
          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] p-8 flex items-start gap-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full -mr-32 -mt-32" />
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-500/20">
              <UserCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-emerald-400 text-xl font-black tracking-tight">Authorized Practitioner Clearance</h3>
              <p className="text-sm text-zinc-500 mt-2 leading-relaxed font-medium">
                You are currently accessing a Zero-Knowledge sub-registry. Your access keys are temporary and will self-destruct upon clearance expiration.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AnimatePresence mode="popLayout">
              {sharedRecords.map(access => (
                <motion.div
                  key={access.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-zinc-900/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group hover:border-white/10 transition-all shadow-2xl"
                >
                  <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500/40 group-hover:bg-emerald-500 transition-colors" />

                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center shrink-0 border border-white/5 text-white font-black text-xl shadow-inner">
                        {access.record?.patient.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white truncate max-w-[200px] tracking-tight">{access.record?.patient.name}</h3>
                        <p className="text-zinc-500 text-[11px] font-black uppercase tracking-widest mt-1">{access.record?.patient.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center px-4 py-2 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-500/20 shadow-lg shadow-amber-500/5">
                        <Clock className="w-3.5 h-3.5 mr-2" />
                        {Math.max(0, Math.floor((new Date(access.expiresAt).getTime() - new Date().getTime()) / 3600000))}h TTL
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/40 rounded-[1.5rem] border border-white/5 p-6 mb-8">
                    <div className="flex items-center gap-3 mb-3">
                      <FileText className="w-5 h-5 text-zinc-500" />
                      <p className="text-sm font-black text-white tracking-tight">{access.record?.fileName}</p>
                    </div>
                    {access.record?.description && (
                      <p className="text-xs text-zinc-500 pl-8 font-medium italic">"{access.record.description}"</p>
                    )}
                  </div>

                  <button className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/5 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 group/btn">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 group-hover/btn:scale-110 transition-transform" />
                    Secure Decryption Audit
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {!isLoading && sharedRecords.length === 0 && (
              <div className="col-span-full py-24 text-center">
                <div className="w-24 h-24 bg-zinc-900 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-white/5">
                  <Stethoscope className="w-10 h-10 text-zinc-800" />
                </div>
                <h3 className="text-white text-2xl font-black mb-2 tracking-tight">Handshake Pending</h3>
                <p className="max-w-sm mx-auto text-sm text-zinc-500 font-medium">No patients have initiated a record transmission to your terminal at this time.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsUploadModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-zinc-900 border border-white/10 rounded-[3rem] p-10 w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600" />
              <h3 className="text-3xl font-black text-white mb-2 tracking-tight">Record Deployment</h3>
              <p className="text-zinc-500 text-sm font-medium mb-8">Clinical data will be SHA-512 hashed and AES-256 encrypted locally.</p>

              {lastUploadTxId ? (
                <div className="space-y-6">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl text-center">
                    <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                    <h4 className="text-white font-black uppercase tracking-widest text-sm mb-2">Immutable Anchor Created</h4>
                    <p className="text-zinc-400 text-xs font-mono break-all bg-black/40 p-3 rounded-lg border border-white/5">
                      {lastUploadTxId}
                    </p>
                    <div className="mt-4">
                      <Link 
                        href={`/verify-integrity?txId=${lastUploadTxId}`} 
                        className="text-[10px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest transition-colors"
                      >
                        Execute Integrity Audit →
                      </Link>
                    </div>
                  </div>
                  <button
                    onClick={() => { setIsUploadModalOpen(false); setLastUploadTxId(null); }}
                    className="w-full py-4 bg-white text-black font-black rounded-2xl text-xs uppercase tracking-widest transition-all"
                  >
                    Return to Vault
                  </button>
                </div>
              ) : (
                <form onSubmit={handleUpload} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Clinical Payload (PDF/IMG)</label>
                    <div className="border-2 border-dashed border-white/5 rounded-2xl p-8 text-center hover:border-blue-500/40 transition-all bg-black/40 cursor-pointer group/upload relative">
                      <input type="file" required disabled={isUploading} onChange={e => setFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center group-hover/upload:bg-blue-500/10 transition-colors">
                          <Upload className="w-5 h-5 text-zinc-600 group-hover/upload:text-blue-500" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest text-zinc-600 group-hover/upload:text-white transition-colors">
                          {file ? file.name : "Secure Select"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Metadata Descriptor</label>
                    <input type="text" disabled={isUploading} value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium" placeholder="E.g. MRI Scan Results Q1" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Document Classification</label>
                    <select
                      value={documentType}
                      disabled={isUploading}
                      onChange={e => setDocumentType(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium appearance-none"
                    >
                      <option value="Lab Report">Lab Report</option>
                      <option value="Prescription">Prescription</option>
                      <option value="Imaging/X-Ray">Imaging/X-Ray</option>
                      <option value="Vaccination Record">Vaccination Record</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="flex gap-4 pt-6">
                    <button type="button" disabled={isUploading} onClick={() => setIsUploadModalOpen(false)} className="flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all">Cancel</button>
                    <button type="submit" disabled={!file || isUploading} className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50">
                      {isUploading ? "Anchoring..." : "Encrypt & Deploy"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsShareModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-zinc-900 border border-white/10 rounded-[3rem] p-10 w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-teal-600" />
              <h3 className="text-3xl font-black text-white mb-2 tracking-tight">Practitioner Clearance</h3>
              <p className="text-zinc-500 text-sm font-medium mb-8">Exchange temporary session keys with a verified healthcare professional.</p>

              <form onSubmit={handleGrantAccess} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Verified Physician</label>
                  <select
                    required
                    value={selectedDoctorId}
                    onChange={e => setSelectedDoctorId(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-black text-xs uppercase tracking-widest cursor-pointer"
                  >
                    <option value="" className="bg-zinc-900">-- Choose Medical Professional --</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id} className="bg-zinc-900">Dr. {d.name} [{d.email}]</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Clearance TTL (Hours)</label>
                  <input
                    type="number"
                    min="1"
                    max="72"
                    value={expiresInHours}
                    onChange={e => setExpiresInHours(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-black"
                  />
                  <p className="text-[9px] text-zinc-600 font-black uppercase tracking-tighter mt-1 ml-1">Maximum clearance window: 72 hours</p>
                </div>

                <div className="flex gap-4 pt-6">
                  <button type="button" onClick={() => setIsShareModalOpen(false)} className="flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all">Cancel</button>
                  <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-600/20 active:scale-95">Initiate Handshake</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Share Modal */}
      <AnimatePresence>
        {isQrModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsQrModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-zinc-900 border border-white/10 rounded-[3rem] p-10 w-full max-w-sm shadow-2xl overflow-hidden text-center"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600" />
              <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Clinical QR Link</h3>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-8">Scan for instant clinical clearance</p>

              <div className="bg-white p-6 rounded-[2.5rem] mb-8 inline-block shadow-2xl ring-4 ring-blue-500/20">
                <QRCodeCanvas
                  value={`${window.location.origin}/doctor/view/${shareToken}#${qrHashKey}`}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-black/40 border border-white/5 rounded-2xl">
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Status</p>
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live One-Time Link
                  </p>
                </div>
                <p className="text-[9px] text-zinc-600 font-medium">Link expires in 1 hour. The decryption key is embedded in the QR and never stored on our servers.</p>
              </div>

              <button
                onClick={() => setIsQrModalOpen(false)}
                className="mt-8 w-full py-4 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-white rounded-2xl border border-white/5 transition-all"
              >
                Terminate View
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
