"use client";

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  MessageSquare,
  Key,
  Activity,
  FileText,
  UserCheck,
  Stethoscope,
  Briefcase,
  LogOut,
  Menu,
  X,
  Bell,
  Settings,
  Search,
  ShieldAlert,
  FolderLock,
  Globe,
  CreditCard,
  GraduationCap,
  Fingerprint,
  Receipt,
  FileSignature,
  ShieldCheck,
  Database,
  BookOpen,
  Scale,
  Sun,
  Moon,
  LayoutDashboard,
  Users,
  UserCircle,
  AlertTriangle,
  Flame,
  History,
  BarChart3,
  Lock,
  Bot,
  Zap,
  UserCog,
  Monitor,
  Target
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { initSocket, getSocket } from '../../lib/socket';
import { syncAll } from '../../lib/sync';
import { ThemeToggle } from '../../components/ThemeToggle';
import CommandPalette from '../../components/CommandPalette';
import DisasterBanner from '../../components/DisasterBanner';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated, accessToken } = useAuthStore();
  const { t, i18n } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const allRoles = ['USER', 'ADMIN', 'STUDENT', 'ACADEMIC', 'DOCTOR', 'LAWYER', 'HEALTHCARE_STAFF', 'EMERGENCY_PROFILE'];

  const navigation = [
    { section: 'SOC Operations', roles: ['ADMIN'] },
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, roles: ['ADMIN'] },
    { name: 'Attack Map', href: '/admin/map', icon: Globe, roles: ['ADMIN'] },
    { name: 'Users', href: '/admin/users', icon: Users, roles: ['ADMIN'] },
    { name: 'Professionals', href: '/admin/professionals', icon: UserCircle, roles: ['ADMIN'] },
    { name: 'Alerts', href: '/admin/alerts', icon: AlertTriangle, roles: ['ADMIN'] },
    { name: 'Incidents', href: '/admin/incidents', icon: Flame, roles: ['ADMIN'] },
    { name: 'Audit Logs', href: '/admin/logs', icon: History, roles: ['ADMIN'] },
    { name: 'Intelligence Reports', href: '/admin/reports', icon: BarChart3, roles: ['ADMIN'] },
    { name: 'System Health', href: '/admin/health', icon: Monitor, roles: ['ADMIN'] },
    { name: 'Policy Engine', href: '/admin/policies', icon: Lock, roles: ['ADMIN'] },
    { name: 'Automation', href: '/admin/automation', icon: Bot, roles: ['ADMIN'] },
    
    { section: 'Personal Security', roles: allRoles },
    { name: t('dashboard'), href: '/dashboard', icon: Shield, roles: ['USER', 'STUDENT', 'ACADEMIC', 'DOCTOR', 'LAWYER', 'HEALTHCARE_STAFF', 'EMERGENCY_PROFILE'] },
    { name: t('vault'), href: '/vault', icon: Key, roles: ['USER', 'STUDENT', 'ACADEMIC', 'DOCTOR', 'LAWYER', 'HEALTHCARE_STAFF'] },
    { name: t('analyzer'), href: '/analyzer', icon: Activity, roles: ['USER', 'STUDENT', 'ACADEMIC'] },
    { name: 'Security Health', href: '/security-health', icon: Target, roles: allRoles },
    { name: t('files'), href: '/files', icon: FolderLock, roles: allRoles },
    
    { section: 'Identity & Professional', roles: ['USER', 'STUDENT', 'ACADEMIC', 'DOCTOR', 'LAWYER', 'HEALTHCARE_STAFF'] },
    { name: t('identity'), href: '/identity', icon: UserCheck, roles: allRoles },
    { name: t('professionals', 'Professional Hub'), href: '/professionals', icon: Briefcase, roles: ['USER', 'STUDENT', 'ACADEMIC'] },
    { name: 'Student Hub', href: '/student', icon: GraduationCap, roles: ['STUDENT', 'USER'] },
    { name: 'Academic Hub', href: '/academic', icon: BookOpen, roles: ['ACADEMIC'] },
    // ── Doctor / Healthcare ───────────────────────────────────────────────
    { name: t('medical'), href: '/medical', icon: Stethoscope, roles: ['DOCTOR', 'HEALTHCARE_STAFF', 'USER'] },
    { name: 'Consultations', href: '/consultation', icon: Stethoscope, roles: ['DOCTOR', 'HEALTHCARE_STAFF'] },
    // ── Lawyer ────────────────────────────────────────────────────────────
    { name: 'Case Manager', href: '/lawyer', icon: Scale, roles: ['LAWYER'] },
    // ── Emergency ─────────────────────────────────────────────────────────
    { name: 'Emergency ID', href: '/emergency', icon: ShieldAlert, roles: ['EMERGENCY_PROFILE'] },
  ].filter(item => {
    const userRole = (user?.role || 'USER').toUpperCase();
    return item.roles.some(role => role.toUpperCase() === userRole);
  });

  // Auto-redirect admin to /admin panel
  useEffect(() => {
    if (user?.role === 'ADMIN' && pathname === '/dashboard') {
      router.replace('/admin');
    }
  }, [user?.role, pathname, router]);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'ur', name: 'اردو', flag: '🇵🇰' },
  ];

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setLangMenuOpen(false);
  };
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchNotifications();
      syncAll();

      const socket = initSocket(accessToken);

      socket.on('notification:new', (newNotification: any) => {
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Optional: Show a browser notification if supported
        if ("Notification" in window && window.Notification.permission === "granted") {
          new window.Notification(newNotification.title, {
            body: newNotification.message,
            icon: '/favicon.ico'
          });
        }
      });

      return () => {
        socket.off('notification:new');
      };
    }
  }, [isAuthenticated, accessToken]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/notifications', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        const notifs = data.data?.notifications || data.notifications || [];
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n: any) => !n.isRead).length);
      }
    } catch (err) {
      console.error('Notification fetch failed', err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // Redirect if not authenticated (basic check)
    // In a real app, this should also check token validity or be done in middleware
    if (!isAuthenticated && typeof window !== 'undefined') {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!isAuthenticated) return null; // Avoid flicker before redirect

  return (
    <div className="min-h-screen bg-black text-white font-sans flex">
      <DisasterBanner />
      <CommandPalette />
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.div
        initial={{ x: -280 }}
        animate={{ x: sidebarOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth >= 1024 ? 0 : -280) }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[var(--card)] border-r border-[var(--border)] flex flex-col transition-transform lg:translate-x-0 lg:static lg:flex ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-16 flex items-center px-6 border-b border-[var(--border)] shrink-0">
          <Shield className="w-6 h-6 text-[var(--accent)] mr-2" />
          <span className="text-xl font-bold tracking-tight text-[var(--foreground)]">CYBERSUITE</span>
        </div>

          <nav className="space-y-6 px-3">
            {navigation.map((item, idx) => {
              if (item.section) {
                const userRole = (user?.role || 'USER').toUpperCase();
                const hasVisibleItems = navigation.slice(idx + 1).some(n => !n.section && n.roles && n.roles.some(r => r.toUpperCase() === userRole));
                if (!hasVisibleItems) return null;
                return (
                  <div key={item.section} className="pt-4 pb-1">
                    <p className="px-3 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                      {item.section}
                    </p>
                  </div>
                );
              }

              const isActive = pathname === item.href || (item.href && pathname.startsWith(item.href + '/'));
              const userRole = (user?.role || 'USER').toUpperCase();
              const hasAccess = item.roles && item.roles.some(r => r.toUpperCase() === userRole);
              if (!hasAccess || !item.href || !item.icon) return null;

              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center px-3 py-2 text-sm font-bold rounded-xl transition-all ${isActive
                      ? 'bg-blue-500/10 text-blue-500 shadow-sm'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-white hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                >
                  <Icon className={`mr-3 flex-shrink-0 h-4 w-4 transition-colors ${isActive ? 'text-blue-500' : 'text-zinc-500 group-hover:text-white'
                    }`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        <div className="p-5 border-t border-[var(--border)] bg-black/20">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 flex items-center justify-center font-black text-xl text-white shadow-2xl ring-2 ring-white/10 shrink-0">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-black text-white truncate tracking-tight">{t('welcome', { name: user?.name || 'Authorized User' })}</p>
                {user?.isVerified && (
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400 fill-blue-400/20" />
                )}
              </div>
              <p className="text-[10px] text-zinc-500 truncate font-bold uppercase tracking-widest">{user?.email || 'unverified_session'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-3 bg-white/5 hover:bg-red-500/10 hover:text-red-500 text-zinc-500 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-white/5 hover:border-red-500/20 active:scale-95"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t('logout', 'Terminate Session')}
          </button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[var(--background)]">
        {/* Navbar */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-md sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-zinc-400 hover:text-white transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 focus-within:border-blue-500/50 transition-all group">
              <Search className="w-4 h-4 text-zinc-600 group-focus-within:text-blue-500" />
              <input
                type="text"
                placeholder={t('search_placeholder')}
                className="bg-transparent border-none outline-none text-[11px] font-bold uppercase tracking-widest text-white ml-2 w-32 focus:w-48 transition-all"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const query = e.currentTarget.value.toLowerCase();
                    const item = navigation.find((n) => !n.section && n.name && n.name.toLowerCase().includes(query));
                    if (item && item.href) router.push(item.href);
                  }
                }}
              />
            </div>

            {/* Theme Switcher */}
            <ThemeToggle />

            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="text-zinc-400 hover:text-white transition-all hover:scale-110 active:scale-95 relative p-2 flex items-center gap-1"
                title="Change Language"
              >
                <Globe className="w-5 h-5" />
                <span className="text-xs font-black uppercase">{i18n.language}</span>
              </button>

              <AnimatePresence>
                {langMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setLangMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-4 w-40 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 p-2 space-y-1"
                    >
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => changeLanguage(lang.code)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                            i18n.language === lang.code ? 'bg-blue-500/10 text-blue-400' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span className="text-base">{lang.flag}</span>
                          {lang.name}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="text-zinc-400 hover:text-white transition-all hover:scale-110 relative p-2"
                title="Security Alerts"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-[9px] font-black text-white flex items-center justify-center rounded-full ring-2 ring-black">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-4 w-80 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                  <div className="p-4 border-b border-white/5 bg-black/40 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Security & Life Feed</span>
                    <button onClick={() => setNotificationsOpen(false)}><X className="w-3 h-3 text-zinc-500" /></button>
                  </div>
                  <div className="max-h-96 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-10 text-center">
                        <Bell className="w-8 h-8 text-zinc-800 mx-auto mb-3" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">All Protocols Clear</p>
                      </div>
                    ) : notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${!n.isRead ? 'bg-blue-500/5' : ''}`}
                      >
                        <div className="flex gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${n.type === 'WARRANTY' ? 'bg-amber-500/10 text-amber-500' :
                              n.type === 'MEDICAL' ? 'bg-red-500/10 text-red-500' :
                                n.type === 'FINANCE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'
                            }`}>
                            <Shield className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center justify-between gap-4 mb-1">
                              <p className="text-white text-xs font-black tracking-tight">{n.title}</p>
                              <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase ${
                                n.priority === 'CRITICAL' ? 'bg-red-500 text-white animate-pulse' :
                                n.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-500' :
                                n.priority === 'MEDIUM' ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-800 text-zinc-500'
                              }`}>
                                {n.priority}
                              </span>
                            </div>
                            <p className="text-zinc-500 text-[10px] leading-relaxed line-clamp-2">{n.message}</p>
                            <p className="text-[8px] text-zinc-700 mt-2 font-black uppercase">{new Date(n.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/dashboard/settings"
              className="text-zinc-400 hover:text-white transition-all hover:rotate-90 p-2"
              title="Identity Settings"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-[var(--background)] p-4 sm:p-6 lg:p-8 relative">
          <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-7xl mx-auto relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
