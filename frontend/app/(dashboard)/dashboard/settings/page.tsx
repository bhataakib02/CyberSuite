"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../../../store/useAuthStore';
import { apiFetch } from '../../../../lib/api';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Save, 
  Camera, 
  CheckCircle, 
  Lock as LockIcon, 
  X, 
  QrCode, 
  Smartphone,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Monitor,
  RefreshCw,
  ShieldCheck,
  MessageSquare,
  Activity,
  HeartPulse,
  Laptop,
  AlertCircle,
  Download,
  FileSignature
} from 'lucide-react';

export default function SettingsPage() {
  const { user, login, accessToken } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');

  // Emergency ID State
  const [bloodGroup, setBloodGroup] = useState((user as any)?.bloodGroup || '');
  const [allergies, setAllergies] = useState((user as any)?.allergies || '');
  const [chronicConditions, setChronicConditions] = useState((user as any)?.chronicConditions || '');
  const [emergencyContacts, setEmergencyContacts] = useState((user as any)?.emergencyContacts || '');

  // Password Modal State
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  // 2FA Setup State
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFAData, setTwoFAData] = useState<{ qrCode: string; secret: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [setupError, setSetupError] = useState('');

  // Sessions State
  const [sessions, setSessions] = useState<any[]>([]);

  // Legacy State
  const [legacyContacts, setLegacyContacts] = useState<any[]>([]);
  const [inactivityDays, setInactivityDays] = useState(180);
  const [newLegacyName, setNewLegacyName] = useState('');
  const [newLegacyEmail, setNewLegacyEmail] = useState('');

  // Recovery State
  const [recoveryBackups, setRecoveryBackups] = useState<any[]>([]);
  const [newServiceName, setNewServiceName] = useState('');
  const [newBackupCodes, setNewBackupCodes] = useState('');

  useEffect(() => {
    if (activeTab === 'security') {
      fetchSessions();
    }
    if (activeTab === 'legacy') {
      fetchLegacy();
    }
    if (activeTab === 'recovery') {
      fetchRecovery();
    }
  }, [activeTab]);

  const fetchRecovery = async () => {
    try {
      const res = await apiFetch('/auth/recovery-backups');
      if (res.ok) {
        const data = await res.json();
        setRecoveryBackups(data.backups);
      }
    } catch (err) {
      console.error('Failed to fetch recovery');
    }
  };

  const handleAddRecovery = async () => {
    if (!newServiceName || !newBackupCodes) return;
    try {
      const res = await apiFetch('/auth/recovery-backups', {
        method: 'POST',
        body: JSON.stringify({ serviceName: newServiceName, backupCodes: newBackupCodes })
      });
      if (res.ok) {
        fetchRecovery();
        setNewServiceName('');
        setNewBackupCodes('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRecovery = async (id: string) => {
    try {
      await apiFetch(`/auth/recovery-backups/${id}`, { method: 'DELETE' });
      fetchRecovery();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLegacy = async () => {
    try {
      const res = await apiFetch('/legacy');
      if (res.ok) {
        const data = await res.json();
        setLegacyContacts(data.contacts);
        setInactivityDays(data.legacyInactivityDays);
      }
    } catch (err) {
      console.error('Failed to fetch legacy');
    }
  };

  const handleAddLegacy = async () => {
    if (!newLegacyName || !newLegacyEmail) return;
    try {
      const res = await apiFetch('/legacy/contacts', {
        method: 'POST',
        body: JSON.stringify({ name: newLegacyName, email: newLegacyEmail })
      });
      if (res.ok) {
        fetchLegacy();
        setNewLegacyName('');
        setNewLegacyEmail('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLegacy = async (id: string) => {
    try {
      await apiFetch(`/legacy/contacts/${id}`, { method: 'DELETE' });
      fetchLegacy();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateInactivity = async (val: string) => {
    setInactivityDays(parseInt(val));
    try {
      await apiFetch('/legacy/settings', {
        method: 'PATCH',
        body: JSON.stringify({ inactivityDays: val })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await apiFetch('/auth/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);
      }
    } catch (err) {
      console.error('Failed to fetch sessions');
    }
  };

  const handleRevokeSession = async (id: string) => {
    try {
      const res = await apiFetch(`/auth/sessions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSessions(sessions.filter(s => s.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to revoke session');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Preference State
  const [notifications, setNotifications] = useState({ email: true, push: true, security: true, sms: false, whatsapp: false, app: true });
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Load preferences
    const savedTheme = localStorage.getItem('cyber-theme') || 'dark';
    setTheme(savedTheme);
    
    // Load preferences from user object
    if (user) {
      setNotifications({
        // @ts-ignore
        email: user.notifyEmail ?? true,
        // @ts-ignore
        sms: user.notifySMS ?? false,
        // @ts-ignore
        whatsapp: user.notifyWhatsApp ?? false,
        // @ts-ignore
        app: user.notifyApp ?? true,
        push: true,
        security: true
      });
    }
  }, [user]);

  useEffect(() => {
    // Apply theme
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    localStorage.setItem('cyber-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('cyber-notifs', JSON.stringify(notifications));
  }, [notifications]);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'emergency', label: 'Emergency ID', icon: Activity },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'legacy', label: 'Digital Will', icon: LockIcon },
    { id: 'recovery', label: 'Recovery Assistant', icon: RefreshCw },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const res = await apiFetch('/auth/update-profile', {
        method: 'POST',
        body: JSON.stringify({ 
          name, 
          email, 
          bio, 
          phoneNumber,
          bloodGroup,
          allergies,
          chronicConditions,
          emergencyContacts,
          notifyEmail: notifications.email,
          notifySMS: notifications.sms,
          notifyWhatsApp: notifications.whatsapp,
          notifyApp: notifications.app
        }),
      });
      const data = await res.json();
      if (res.ok) {
        login(data.user, accessToken!);
        setSaveSuccess(true);
        // Sync sidebar
        window.dispatchEvent(new CustomEvent('profile-updated'));
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
      alert('Security update failed. Protocol mismatch.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPwd(true);
    setPwdError('');
    try {
      const res = await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowPwdModal(false);
        setCurrentPassword('');
        setNewPassword('');
        alert('Password changed successfully');
      } else {
        setPwdError(data.error || 'Failed to change password');
      }
    } catch (err) {
      setPwdError('Something went wrong');
    } finally {
      setIsChangingPwd(false);
    }
  };

  const start2FASetup = async () => {
    if (user?.twoFAEnabled) return;
    try {
      const res = await apiFetch('/auth/enable-2fa', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setTwoFAData(data);
        setShow2FAModal(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const verify2FA = async () => {
    setIsVerifying(true);
    setSetupError('');
    try {
      const res = await apiFetch('/auth/verify-2fa', {
        method: 'POST',
        body: JSON.stringify({ token: verificationCode }),
      });
      const data = await res.json();
      if (res.ok) {
        if (user) login({ ...user, twoFAEnabled: true }, accessToken!);
        setShow2FAModal(false);
      } else {
        setSetupError(data.error || 'Invalid code');
      }
    } catch (err) {
      setSetupError('Error verifying');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Settings</h1>
          <p className="text-zinc-500 mt-1">Configure your personal security and profile preferences.</p>
        </div>
        <button 
          onClick={handleSaveProfile}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-bold transition-all shadow-lg ${
            saveSuccess ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
          }`}
        >
          {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : saveSuccess ? <CheckCircle className="w-5 h-5" /> : <Save className="w-5 h-5" />}
          {saveSuccess ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all border ${
                activeTab === tab.id 
                  ? 'bg-blue-600/10 text-blue-400 border-blue-500/20' 
                  : 'text-zinc-500 hover:bg-white/5 hover:text-white border-transparent'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 bg-[var(--card)]/40 backdrop-blur-3xl border border-[var(--border)] rounded-[2.5rem] p-6 md:p-10 shadow-2xl">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-8 pb-8 border-b border-white/5">
                  <div className="relative group">
                    <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center text-4xl font-black text-white shadow-2xl overflow-hidden ring-4 ring-white/5">
                      {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="avatar" /> : user?.name.charAt(0)}
                    </div>
                    <button className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[2rem]">
                      <Camera className="w-8 h-8 text-white" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">{user?.name}</h3>
                    <p className="text-zinc-500 font-medium">{user?.email}</p>
                    <div className="flex gap-4 mt-3">
                      <button className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300">Update Photo</button>
                      <button className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300">Remove</button>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Full Name</label>
                      <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Mobile Contact (SMS/WhatsApp)</label>
                      <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+1 234 567 890" className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Email Identifier</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Identity Bio</label>
                    <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium resize-none" />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'emergency' && (
              <motion.div
                key="emergency"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 mb-2">
                    <HeartPulse className="w-6 h-6 text-red-500" />
                    Emergency Digital ID
                  </h3>
                  <p className="text-zinc-500 text-sm">Vital medical information and emergency contacts accessible via your lock-screen QR.</p>
                </div>

                <div className="bg-red-500/5 border border-red-500/10 p-6 rounded-3xl mb-8 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white rounded-2xl p-1 shrink-0">
                      <QrCode className="w-full h-full text-black" />
                    </div>
                    <div>
                      <p className="text-white font-black">Public Emergency Card</p>
                      <p className="text-zinc-400 text-xs mt-1">Scan this QR code from your lock screen to view your Emergency ID.</p>
                    </div>
                  </div>
                  <a 
                    href={`/emergency/${user?.id}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-colors"
                  >
                    View ID
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Blood Group</label>
                    <input 
                      type="text" 
                      placeholder="e.g., O+ or AB-" 
                      value={bloodGroup} 
                      onChange={e => setBloodGroup(e.target.value)} 
                      className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all font-medium uppercase" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Emergency Contacts</label>
                    <input 
                      type="text" 
                      placeholder="Name: +1 234..." 
                      value={emergencyContacts} 
                      onChange={e => setEmergencyContacts(e.target.value)} 
                      className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all font-medium" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Allergies (Critical)</label>
                  <textarea 
                    value={allergies} 
                    onChange={e => setAllergies(e.target.value)} 
                    placeholder="List any severe allergies (e.g., Penicillin, Peanuts)..."
                    rows={2} 
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all font-medium resize-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Chronic Conditions / Medical History</label>
                  <textarea 
                    value={chronicConditions} 
                    onChange={e => setChronicConditions(e.target.value)} 
                    placeholder="Asthma, Diabetes, existing medications..."
                    rows={3} 
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all font-medium resize-none" 
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between p-6 bg-black/30 border border-white/5 rounded-3xl group hover:border-white/10 transition-all">
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${user?.twoFAEnabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      <Shield className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="text-white text-lg font-black tracking-tight">Two-Factor Auth</p>
                        {user?.twoFAEnabled && <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/10 font-black uppercase tracking-widest">Active</span>}
                      </div>
                      <p className="text-zinc-500 text-xs font-medium mt-1">Multi-layer defense for your credentials.</p>
                    </div>
                  </div>
                  <button 
                    onClick={start2FASetup}
                    disabled={user?.twoFAEnabled}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      user?.twoFAEnabled 
                        ? 'bg-emerald-500/10 text-emerald-400 cursor-default border border-emerald-500/10' 
                        : 'bg-white text-black hover:bg-zinc-200 shadow-xl'
                    }`}
                  >
                    {user?.twoFAEnabled ? 'Secured' : 'Configure'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-6 bg-black/30 border border-white/5 rounded-3xl group hover:border-white/10 transition-all">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <LockIcon className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-white text-lg font-black tracking-tight">Master Password</p>
                      <p className="text-zinc-500 text-xs font-medium mt-1">Primary key for your encrypted vault.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowPwdModal(true)}
                    className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-zinc-800 text-white hover:bg-zinc-700 transition-all border border-white/5"
                  >
                    Update
                  </button>
                </div>

                <div className="pt-8 border-t border-white/5">
                  <div className="flex items-center gap-3 mb-6">
                    <Laptop className="w-6 h-6 text-zinc-400" />
                    <h3 className="text-xl font-black text-white">Trusted Devices & Sessions</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {sessions.map((session) => {
                      return (
                        <div key={session.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-black/40 border border-white/5 rounded-2xl">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
                              <Monitor className="w-5 h-5 text-zinc-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-3">
                                <p className="text-white font-bold text-sm">{session.deviceInfo}</p>
                              </div>
                              <div className="text-zinc-500 text-xs font-medium mt-1 flex items-center gap-3">
                                <span>{session.ipAddress}</span>
                                <span>•</span>
                                <span>Last Active: {new Date(session.lastUsedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleRevokeSession(session.id)}
                            className="mt-4 md:mt-0 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold uppercase tracking-widest rounded-xl transition-colors"
                          >
                            Revoke
                          </button>
                        </div>
                      );
                    })}
                    {sessions.length === 0 && <p className="text-zinc-500 text-sm text-center py-4">Loading sessions...</p>}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Notification Protocols</h3>
                  <p className="text-zinc-500 text-sm">Configure how and where you receive security alerts and life-management reminders.</p>
                </div>

                <div className="space-y-4">
                  {[
                    { id: 'email', label: 'Email Transmissions', desc: 'Receive detailed reports to your verified inbox.', icon: Globe },
                    { id: 'app', label: 'In-App Priority Feed', desc: 'Real-time alerts directly in the dashboard center.', icon: Bell },
                    { id: 'sms', label: 'Mobile SMS Alerts', desc: 'Urgent short-form text messages to your phone.', icon: Smartphone },
                    { id: 'whatsapp', label: 'WhatsApp Intelligence', desc: 'Automated reminders via WhatsApp protocol.', icon: MessageSquare },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-6 bg-black/40 border border-white/5 rounded-[2rem] group hover:border-blue-500/20 transition-all">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-800/50 flex items-center justify-center border border-white/5 group-hover:bg-blue-600/10 transition-colors">
                          <item.icon className="w-5 h-5 text-zinc-400 group-hover:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white font-black tracking-tight text-sm">{item.label}</p>
                          <p className="text-zinc-600 text-[10px] font-medium">{item.desc}</p>
                        </div>
                      </div>
                      <div 
                        onClick={() => setNotifications(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof prev] }))}
                        className={`w-14 h-8 rounded-full p-1.5 cursor-pointer transition-all duration-300 ${
                          (notifications as any)[item.id] ? 'bg-blue-600' : 'bg-zinc-800'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-300 ${
                          (notifications as any)[item.id] ? 'translate-x-6' : ''
                        }`} />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'legacy' && (
              <motion.div
                key="legacy"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h3 className="text-2xl font-black text-white mb-2 tracking-tight flex items-center gap-3">
                    <ShieldCheck className="w-7 h-7 text-blue-500" />
                    Digital Will & Legacy Transfer
                  </h3>
                  <p className="text-zinc-500 text-sm">Designate trusted individuals to receive access to your vault after a specified period of inactivity.</p>
                </div>

                <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                      <p className="text-white font-bold text-lg mb-1">Inactivity Threshold</p>
                      <p className="text-zinc-500 text-xs">If you don't log in for this duration, your legacy protocol initiates.</p>
                    </div>
                    <select 
                      value={inactivityDays}
                      onChange={(e) => handleUpdateInactivity(e.target.value)}
                      className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    >
                      <option value="30">30 Days</option>
                      <option value="90">90 Days</option>
                      <option value="180">180 Days (6 Months)</option>
                      <option value="365">365 Days (1 Year)</option>
                    </select>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Legacy Contacts</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Action</p>
                    </div>

                    <div className="space-y-3">
                      {legacyContacts.map((contact) => (
                        <div key={contact.id} className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                          <div>
                            <p className="text-white font-bold text-sm">{contact.name}</p>
                            <p className="text-zinc-500 text-[10px]">{contact.email}</p>
                          </div>
                          <button 
                            onClick={() => handleDeleteLegacy(contact.id)}
                            className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 flex gap-3">
                      <input 
                        type="text" 
                        placeholder="Name"
                        value={newLegacyName}
                        onChange={e => setNewLegacyName(e.target.value)}
                        className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                      />
                      <input 
                        type="email" 
                        placeholder="Email"
                        value={newLegacyEmail}
                        onChange={e => setNewLegacyEmail(e.target.value)}
                        className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                      />
                      <button 
                        onClick={handleAddLegacy}
                        className="px-6 py-3 bg-white text-black text-xs font-black uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-all"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-500/5 border border-blue-500/10 p-6 rounded-3xl flex gap-4">
                  <AlertCircle className="w-6 h-6 text-blue-500 shrink-0" />
                  <p className="text-blue-200/60 text-xs leading-relaxed">
                    <strong>Protocol Note:</strong> Access is not granted automatically. Upon the inactivity threshold, designated contacts will be notified. They must then request access, which triggers a final 7-day confirmation period sent to your verified devices.
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === 'recovery' && (
              <motion.div
                key="recovery"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h3 className="text-2xl font-black text-white mb-2 tracking-tight flex items-center gap-3">
                    <RefreshCw className="w-7 h-7 text-emerald-500" />
                    Account Recovery Assistant
                  </h3>
                  <p className="text-zinc-500 text-sm">Centralized storage for backup codes and multi-factor recovery instructions.</p>
                </div>

                <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-sm">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Saved Service Backups</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Security State</p>
                    </div>

                    <div className="space-y-3">
                      {recoveryBackups.map((bk) => (
                        <div key={bk.id} className="flex items-center justify-between p-5 bg-black/20 rounded-2xl border border-white/5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400">
                              <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-white font-bold text-sm">{bk.serviceName}</p>
                              <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Codes Encrypted</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors">View Codes</button>
                            <button 
                              onClick={() => handleDeleteRecovery(bk.id)}
                              className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-6 border-t border-white/5 space-y-4">
                      <p className="text-xs font-black uppercase tracking-widest text-white">Add New Recovery Entry</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input 
                          type="text" 
                          placeholder="Service Name (e.g. Google)"
                          value={newServiceName}
                          onChange={e => setNewServiceName(e.target.value)}
                          className="bg-black/40 border border-white/5 rounded-xl px-4 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
                        />
                        <input 
                          type="text" 
                          placeholder="Backup Codes / Instructions"
                          value={newBackupCodes}
                          onChange={e => setNewBackupCodes(e.target.value)}
                          className="bg-black/40 border border-white/5 rounded-xl px-4 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
                        />
                      </div>
                      <button 
                        onClick={handleAddRecovery}
                        className="w-full py-4 bg-white text-black text-xs font-black uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-all shadow-xl"
                      >
                        Secure Storage Protocol
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Export All', icon: Download },
                    { label: 'Print Physical', icon: FileSignature },
                    { label: 'Trusted Check', icon: ShieldCheck },
                  ].map((btn, idx) => (
                    <button key={idx} className="flex flex-col items-center gap-3 p-6 bg-black/40 border border-white/5 rounded-3xl hover:border-white/10 transition-all">
                      <btn.icon className="w-6 h-6 text-zinc-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{btn.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'appearance' && (
              <motion.div
                key="appearance"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'light', label: 'Light', icon: Sun },
                    { id: 'dark', label: 'Dark', icon: Moon },
                    { id: 'system', label: 'System', icon: Monitor },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all ${
                        theme === t.id ? 'bg-blue-600/10 border-blue-500/40 text-blue-400' : 'bg-black/20 border-white/5 text-zinc-500 hover:border-white/10'
                      }`}
                    >
                      <t.icon className="w-8 h-8" />
                      <span className="text-xs font-black uppercase tracking-widest">{t.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Password Update Modal */}
      <AnimatePresence>
        {showPwdModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPwdModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-zinc-900 border border-white/10 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
              <h2 className="text-3xl font-black text-white mb-2">Update Security</h2>
              <p className="text-zinc-500 text-sm font-medium mb-8">Synchronize your new master password across all devices.</p>
              
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Current Password</label>
                  <div className="relative">
                    <input 
                      type={showPasswords ? 'text' : 'password'} 
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-black/60 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">New Master Key</label>
                  <div className="relative">
                    <input 
                      type={showPasswords ? 'text' : 'password'} 
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-black/60 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-mono"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white"
                    >
                      {showPasswords ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {pwdError && <p className="text-red-400 text-xs font-bold bg-red-500/10 p-3 rounded-xl border border-red-500/10">{pwdError}</p>}

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowPwdModal(false)} className="flex-1 py-4 rounded-2xl text-sm font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">Cancel</button>
                  <button type="submit" disabled={isChangingPwd} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl text-sm uppercase tracking-widest shadow-xl shadow-blue-600/20 disabled:opacity-50 transition-all">
                    {isChangingPwd ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : 'Confirm'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2FA Setup Modal (Reusing existing logic) */}
      <AnimatePresence>
        {show2FAModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShow2FAModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <button onClick={() => setShow2FAModal(false)} className="absolute right-6 top-6 text-zinc-500 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 mb-2"><QrCode className="w-8 h-8" /></div>
                <h2 className="text-2xl font-black text-white">Setup 2FA</h2>
                <div className="bg-white p-4 rounded-2xl inline-block mx-auto">{twoFAData?.qrCode && <img src={twoFAData.qrCode} alt="QR Code" className="w-48 h-48" />}</div>
                <div className="space-y-4 pt-4">
                  <input type="text" maxLength={6} value={verificationCode} onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-lg tracking-[1em] font-mono focus:outline-none focus:border-blue-500/50" placeholder="000000" />
                  {setupError && <p className="text-red-400 text-xs font-bold">{setupError}</p>}
                  <button onClick={verify2FA} disabled={isVerifying || verificationCode.length !== 6} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl shadow-lg transition-all">{isVerifying ? 'VERIFYING...' : 'ENABLE 2FA'}</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
