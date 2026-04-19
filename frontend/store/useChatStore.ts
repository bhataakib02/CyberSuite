import { create } from 'zustand';

export interface Contact {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  publicKey?: string;
  lastMessage?: string;
  lastMessageAt?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  encryptedMessage: string;
  encryptedKey: string;
  iv: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
  selfDestruct: boolean;
  destructAt?: string;
  createdAt: string;
  tempId?: string;
  
  // Client-side properties
  decryptedContent?: string;
  isError?: boolean;
}

interface ChatState {
  contacts: Contact[];
  activeContact: Contact | null;
  messages: Message[];
  setContacts: (contacts: Contact[]) => void;
  setActiveContact: (contact: Contact | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  removeMessage: (id: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  contacts: [],
  activeContact: null,
  messages: [],
  setContacts: (contacts) => set({ contacts }),
  setActiveContact: (activeContact) => set({ activeContact }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  updateMessage: (id, updates) => set((state) => ({
    messages: state.messages.map(m => (m.id === id || m.tempId === id) ? { ...m, ...updates } : m)
  })),
  removeMessage: (id) => set((state) => ({
    messages: state.messages.filter(m => m.id !== id && m.tempId !== id)
  })),
}));
