import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

      verifyEmail: async (otp) => {
        const { token } = get();
        if (!token) throw new Error('Authentication required');
        const res = await fetch(`${BACKEND_URL}/api/auth/verify-email`, {
          method: 'POST',
          headers: authHeaders(token),
          body: JSON.stringify({ otp }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Verification failed');
        set((state) => ({ user: { ...state.user, emailVerified: true } }));
        return data;
      },
      forgotPassword: async (email) => {
        set({ authError: null });
        try {
          const res = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) { set({ authError: data.error || 'Failed to send reset link' }); throw new Error(data.error); }
          return data;
        } catch (err) { set({ authError: err.message }); throw err; }
      },

      resetPassword: async (token, newPassword) => {
        set({ authError: null });
        try {
          const res = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) { set({ authError: data.error || 'Failed to reset password' }); throw new Error(data.error); }
          return data;
        } catch (err) { set({ authError: err.message }); throw err; }
      },

      resendOtp: async () => {
        const { token } = get();
        if (!token) throw new Error('Authentication required');
        const res = await fetch(`${BACKEND_URL}/api/auth/resend-otp`, {
          method: 'POST',
          headers: authHeaders(token),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to resend code');
        return data;
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
      dashboard: null,
      dashboardError: null,
      plans: [],
      planError: null,

      fetchUser: async () => {
        const { token } = get();
        if (!token) return null;

        const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
          headers: authHeaders(token),
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok && data.user) {
          set({ user: data.user });
          return data.user;
        }

        return null;
      },

      setBusinessType: async (businessType) => {
        const { token } = get();
        if (!token) throw new Error('Authentication required');

        try {
          const res = await fetch(`${BACKEND_URL}/api/auth/profile`, {
            method: 'PATCH',
            headers: authHeaders(token),
            body: JSON.stringify({ businessType }),
          });

          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            const errorMessage = data.error || `Failed to save business type (status ${res.status})`;
            throw new Error(errorMessage);
          }

          set({ user: data.user });
          return data;
        } catch (err) {
          if (err instanceof TypeError && err.message === 'Failed to fetch') {
            throw new Error('Unable to reach the backend. Check your internet connection or start the backend server.');
          }
          throw err;
        }
      },

      updateBusinessProfile: async (profile) => {
        const { token } = get();
        if (!token) throw new Error('Authentication required');

        try {
          const res = await fetch(`${BACKEND_URL}/api/auth/profile`, {
            method: 'PATCH',
            headers: authHeaders(token),
            body: JSON.stringify(profile),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            const errorMessage = data.error || `Failed to save profile (status ${res.status})`;
            throw new Error(errorMessage);
          }
          set({ user: data.user });
          return data;
        } catch (err) {
          if (err instanceof TypeError && err.message === 'Failed to fetch') {
            throw new Error('Unable to reach the backend. Check your internet connection or start the backend server.');
          }
          throw err;
        }
      },

      fetchSales: async () => {
        const { token } = get();
        if (!token) return;
        try {
          const res = await fetch(`${BACKEND_URL}/api/sales`, {
            headers: authHeaders(token),
          });
          const data = await res.json();
          if (res.ok) {
            set({ sales: data.sales || [], transactions: data.sales || [] });
          }
        } catch (err) {
          console.error('Failed to load sales:', err);
        }
      },

      fetchDashboard: async () => {
        const { token } = get();
        if (!token) return;
        try {
          const res = await fetch(`${BACKEND_URL}/api/dashboard`, {
            headers: authHeaders(token),
          });
          const data = await res.json();
          if (res.ok) {
            set({ dashboard: data.dashboard, dashboardError: null });
          } else {
            set({ dashboardError: data.error || 'Unable to load dashboard' });
          }
        } catch (err) {
          console.error('Failed to load dashboard:', err);
          set({ dashboardError: err.message || 'Dashboard fetch failed' });
        }
      },

      fetchPlans: async () => {
        try {
          const res = await fetch(`${BACKEND_URL}/api/plans`);
          const data = await res.json();
          if (res.ok) {
            set({ plans: data.plans || [], planError: null });
          } else {
            set({ planError: data.error || 'Unable to load plans' });
          }
        } catch (err) {
          console.error('Failed to load plans:', err);
          set({ planError: err.message || 'Plan fetch failed' });
        }
      },

      upgradePlan: async (planId) => {
        const { token } = get();
        if (!token) throw new Error('Authentication required');
        try {
          const res = await fetch(`${BACKEND_URL}/api/subscription/upgrade`, {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify({ planId }),
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Failed to upgrade plan');
          }
          set({ user: data.user, dashboard: { ...get().dashboard, subscription: data.subscription }, planError: null });
          return data;
        } catch (err) {
          console.error('Failed to upgrade plan:', err);
          set({ planError: err.message || 'Upgrade failed' });
          throw err;
        }
      },

      init: async () => {
        await get().fetchUser();
        await get().fetchSales();
        await get().fetchDashboard();
      },

      addSale: async (saleData) => {
        const { token } = get();
        if (!token) throw new Error('Authentication required');
        try {
          const res = await fetch(`${BACKEND_URL}/api/sales`, {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify(saleData),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to create sale');
          set((state) => ({ sales: [data.sale, ...state.sales], transactions: [data.sale, ...state.transactions] }));
          return data.sale;
        } catch (err) {
          console.error('Failed to save sale:', err);
          throw err;
        }
      },

      syncSale: async (sale) => {
        const { token } = get();
        if (!token) return;
        try {
          const res = await fetch(`${BACKEND_URL}/api/sales/sync`, {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify({ sales: [sale] }),
          });
          if (res.ok) {
            await get().fetchSales();
          }
        } catch (err) {
          console.warn('Sync failed:', err.message);
        }
      },

      setVerificationStatus: async (id, verified, provider) => {
        set((state) => ({
          sales: state.sales.map((s) => s.id === id ? { ...s, synced: 1, verified, provider } : s),
          transactions: state.transactions.map((s) => s.id === id ? { ...s, synced: 1, verified, provider } : s),
        }));
      },
    }),
    {
      name: 'flowora-auth',
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated, user: state.user, token: state.token }),
    }
  )
);