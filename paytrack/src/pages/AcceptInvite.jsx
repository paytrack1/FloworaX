import React, { useState } from 'react';
import { CheckCircle2, UserPlus } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const Shell = ({ children }) => (
  <div className="min-h-screen bg-[#F0F4FF] flex items-center justify-center px-5 py-12 font-sans">
    <div className="w-full max-w-md bg-white rounded-3xl border border-[#E2E8F0] shadow-xl shadow-blue-100/50 p-6 sm:p-8">
      {children}
    </div>
  </div>
);

const AcceptInvite = () => {
  const token = new URLSearchParams(window.location.search).get('token');

  const [form, setForm] = useState({ name: '', password: '', confirmPassword: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.password || form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/staff/accept-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name: form.name, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      setDone(true);
      setTimeout(() => { window.location.href = '/staff-login'; }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <Shell>
        <p className="text-center text-sm font-bold text-slate-500">This invite link is missing or invalid. Ask whoever invited you to send a new one.</p>
      </Shell>
    );
  }

  if (done) {
    return (
      <Shell>
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="text-green-600" size={28} />
          </div>
          <h1 className="text-xl font-black text-[#0F172A]">You're all set!</h1>
          <p className="text-sm text-slate-500 mt-2">Taking you to the staff sign-in page…</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[#EEF4FF] flex items-center justify-center mx-auto mb-3">
          <UserPlus className="text-[#185FA5]" size={22} />
        </div>
        <h1 className="text-xl font-black text-[#0F172A]">Set up your account</h1>
        <p className="text-sm text-slate-500 mt-1">You've been invited to join a team on Flowora. Set a password to get started.</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-600 text-sm font-semibold rounded-xl px-3.5 py-2.5">{error}</div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Your name</label>
          <input value={form.name} onChange={(e) => update({ name: e.target.value })} placeholder="Jane Doe" className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Password</label>
          <input type="password" value={form.password} onChange={(e) => update({ password: e.target.value })} placeholder="At least 8 characters" className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Confirm password</label>
          <input type="password" value={form.confirmPassword} onChange={(e) => update({ confirmPassword: e.target.value })} className={inputCls} />
        </div>
        <button type="submit" disabled={submitting} className="w-full py-3.5 rounded-xl font-black text-white bg-[#185FA5] disabled:opacity-50">
          {submitting ? 'Setting up…' : 'Set Password & Continue'}
        </button>
      </form>
    </Shell>
  );
};

const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-[#0F172A] focus:outline-none focus:border-[#185FA5]';

export default AcceptInvite;
