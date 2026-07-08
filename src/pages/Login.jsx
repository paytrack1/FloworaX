import React, { useState } from 'react';
import { useStore } from '../store/useStore';

const Login = ({ mode: initialMode = 'login' }) => {
  const { login, register, authError, clearAuthError } = useStore();
  const [mode, setMode] = useState(initialMode === 'register' ? 'register' : 'login');
  const [loading, setLoading] = useState(false);
  const [form, setForm]       = useState({ email: '', businessName: '', password: '' });

  const handleChange = (e) => {
    clearAuthError();
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.email || !form.password) return;
    if (mode === 'register' && !form.businessName.trim()) return;
    setLoading(true);
    try {
      if (mode === 'register') {
        await register(form.email, form.businessName, form.password);
      } else {
        await login(form.email, form.password);
      }
    } catch (err) {
      // authError set in store
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    clearAuthError();
    setForm({ email: '', businessName: '', password: '' });
    setMode(mode === 'login' ? 'register' : 'login');
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-center px-6">
      <div className="mb-10 text-center">
        <div className="w-16 h-16 bg-[#185FA5] rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto mb-4 shadow-lg shadow-blue-200">
          FL
        </div>
        <h1 className="text-2xl font-black text-[#0F172A]">Flowora</h1>
        <p className="text-[#94A3B8] text-sm font-medium mt-1">
          {mode === 'login' ? 'Sign in to your store' : 'Create your store account'}
        </p>
      </div>

      <div className="flex bg-[#F1F5F9] rounded-2xl p-1 mb-6">
        <button
          onClick={() => { if (mode !== 'login') switchMode(); }}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'login' ? 'bg-white text-[#185FA5] shadow-sm' : 'text-[#94A3B8]'}`}
        >
          Sign In
        </button>
        <button
          onClick={() => { if (mode !== 'register') switchMode(); }}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'register' ? 'bg-white text-[#185FA5] shadow-sm' : 'text-[#94A3B8]'}`}
        >
          Create Account
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm flex flex-col gap-4">
        <div>
          <label className="text-[#0F172A] text-xs font-bold uppercase tracking-wide mb-1.5 block">Email Address</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@store.com"
            className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#185FA5] transition-colors" />
        </div>

        {mode === 'register' && (
          <div>
            <label className="text-[#0F172A] text-xs font-bold uppercase tracking-wide mb-1.5 block">Business Name</label>
            <input name="businessName" type="text" value={form.businessName} onChange={handleChange} placeholder="Your store name"
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#185FA5] transition-colors" />
          </div>
        )}

        <div>
          <label className="text-[#0F172A] text-xs font-bold uppercase tracking-wide mb-1.5 block">Password</label>
          <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="••••••••"
            className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#185FA5] transition-colors" />
          {mode === 'register' && <p className="text-[#94A3B8] text-xs mt-1 ml-1">Minimum 4 characters</p>}
        </div>

        {authError && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm font-medium">⚠️ {authError}</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !form.email || !form.password || (mode === 'register' && !form.businessName)}
          className="w-full bg-[#185FA5] text-white py-4 rounded-2xl font-bold disabled:opacity-60 active:scale-95 transition-all mt-1"
        >
          {loading ? (mode === 'login' ? 'Signing in…' : 'Creating account…') : (mode === 'login' ? 'Sign In' : 'Create Account')}
        </button>
      </div>

      <p className="text-center text-[#CBD5E1] text-[10px] font-bold uppercase tracking-widest mt-8">
        Flowora · Secure payments via Paystack
      </p>
    </div>
  );
};

export default Login;