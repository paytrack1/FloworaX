import React, { useState } from 'react';
import { LogIn } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const Shell = ({ children }) => (
  <div className="min-h-screen bg-[#F0F4FF] flex items-center justify-center px-5 py-12 font-sans">
    <div className="w-full max-w-md bg-white rounded-3xl border border-[#E2E8F0] shadow-xl shadow-blue-100/50 p-6 sm:p-8">
      {children}
    </div>
  </div>
);

const StaffLogin = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/staff/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('staffToken', data.token);
      localStorage.setItem('staffOwnerId', data.staff.ownerId || '');
      window.location.href = '/staff';
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Shell>
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[#EEF4FF] flex items-center justify-center mx-auto mb-3">
          <LogIn className="text-[#185FA5]" size={22} />
        </div>
        <h1 className="text-xl font-black text-[#0F172A]">Staff Sign In</h1>
        <p className="text-sm text-slate-500 mt-1">Sign in with the credentials you set from your invite.</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-600 text-sm font-semibold rounded-xl px-3.5 py-2.5">{error}</div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Password</label>
          <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className={inputCls} />
        </div>
        <button type="submit" disabled={submitting} className="w-full py-3.5 rounded-xl font-black text-white bg-[#185FA5] disabled:opacity-50">
          {submitting ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </Shell>
  );
};

const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-[#0F172A] focus:outline-none focus:border-[#185FA5]';

export default StaffLogin;
