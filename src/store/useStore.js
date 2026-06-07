import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db } from '../db/dexie';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
});

export const useStore = create(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      authError: null,
      activeTab: 'home',
      isSaleModalOpen: false,
      sales: [],
      transactions: [],

      register: async (email, businessName, password) => {
        set({ authError: null });
        try {
          const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, businessName, password }),
          });
          const data = await res.json();
          if (!res.ok) { set({ authError: data.error || 'Registration failed' }); throw new Error(data.error); }
          set({ isAuthenticated: true, user: data.user, token: data.token, authError: null });
          await get().init();
          return data;
        } catch (err) { set({ authError: err.message }); throw err; }
      },

      login: async (email, password) => {
        set({ authError: null });
        try {
          const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          const data = await res.json();
          if (!res.ok) { set({ authError: data.error || 'Login failed' }); throw new Error(data.error); }
          set({ isAuthenticated: true, user: data.user, token: data.token, authError: null });
          await get().init();
          return data;
        } catch (err) { set({ authError: err.message }); throw err; }
      },

      logout: () => {
        set({ isAuthenticated: false, user: null, token: null, sales: [], transactions: [], activeTab: 'home', isSaleModalOpen: false, authError: null });
      },

      setProfileImage: (imageUrl) => {
        set((state) => ({ user: { ...state.user, profileImage: imageUrl } }));
      },

      clearAuthError: () => set({ authError: null }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setSaleModal: (open) => set({ isSaleModalOpen: open }),

      init: async () => {
        try {
          const allSales = await db.sales.orderBy('createdAt').reverse().toArray();
          set({ sales: allSales, transactions: allSales });
        } catch (err) { console.error('Failed to load sales:', err); }
      },

      addSale: async (saleData) => {
        const { token, syncSale } = get();
        const sale = {
          ...saleData,
          id: `sale-${Date.now()}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdAt: new Date().toISOString(),
          synced: 0,
          verified: false,
          provider: null,
        };
        try {
          await db.sales.add(sale);
          set((state) => ({ sales: [sale, ...state.sales], transactions: [sale, ...state.transactions] }));
          if (token) await syncSale(sale);
        } catch (err) { console.error('Failed to save sale:', err); throw err; }
      },

      syncSale: async (sale) => {
        const { token, setVerificationStatus } = get();
        if (!token) return;
        try {
          const res = await fetch(`${BACKEND_URL}/api/sales/sync`, {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify({ sales: [sale] }),
          });
          if (res.ok) {
            const data = await res.json();
            for (const result of data.results || []) {
              await setVerificationStatus(result.id, result.verified, result.provider || 'paystack');
            }
          }
        } catch (err) { console.warn('Sync failed:', err.message); }
      },

      setVerificationStatus: async (id, verified, provider) => {
        try {
          await db.sales.update(id, { synced: 1, verified, provider });
          set((state) => ({
            sales: state.sales.map((s) => s.id === id ? { ...s, synced: 1, verified, provider } : s),
            transactions: state.transactions.map((s) => s.id === id ? { ...s, synced: 1, verified, provider } : s),
          }));
        } catch (err) { console.error('Failed to update verification:', err); }
      },
    }),
    {
      name: 'flowora-auth',
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated, user: state.user, token: state.token }),
    }
  )
);
