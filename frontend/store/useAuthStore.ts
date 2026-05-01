import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  twoFAEnabled: boolean;
  publicKey?: string;
  encPrivateKey?: string;
  hasMasterPassword?: boolean;
  masterPasswordSalt?: string;
  bio?: string;
  phoneNumber?: string;
  notifyEmail?: boolean;
  notifySMS?: boolean;
  notifyWhatsApp?: boolean;
  notifyApp?: boolean;
  isVerified?: boolean;
  bloodGroup?: string;
  allergies?: string;
  emergencyContacts?: string;
  chronicConditions?: string;
  trustedContacts?: any[];
  authenticators?: any[];
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setAccessToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, accessToken: token, isAuthenticated: true }),
      logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
      setAccessToken: (token) => set({ accessToken: token }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
