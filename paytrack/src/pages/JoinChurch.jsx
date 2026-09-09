import React, { useState } from 'react';
import { CheckCircle2, Users } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

// Public, no-auth "Join Church" / member registration page.
// Matches src/routes/customers.js POST /api/customers/public/:ownerId.
// URL shape mirrors PublicBooking.jsx: /join/<ownerId>
const Shell = ({ children }) => (
  <div className="min-h-screen bg-[#F0F4FF] flex items-center justify-center px-5 py-12 font-sans">
    <div className="w-full max-w-md bg-white rounded-3xl border border-[#E2E8F0] shadow-xl shadow-blue-100/50 p-6 sm:p-8">
      {children}
    </div>
  </div>
);

const JoinChurch = () => {
  const ownerId = window.location.pathname.split('/join/')[1]?.split('/')[0];

  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', howHeard: '', invitedBy: '', wantsVisit: false,
    emailOptIn: true, smsOptIn: false, whatsappOptIn: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) { setError('Please enter your name.'); return; }
    if (!form.email.trim() && !form.phone.trim()) { setError('Please provide an email or phone number.'); return; }
    if (form.whatsappOptIn && !form.phone.trim()) { setError('A phone number is required for WhatsApp updates.'); return; }
    if (form.smsOptIn && !form.phone.trim()) { setError('A phone number is required for SMS updates.'); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/customers/public/${ownerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed. Please try again.');
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!ownerId) {
    return (
      <Shell>
        <p className="text-center text-sm font-bold text-slate-500">This registration link is invalid or incomplete.</p>
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
          <h1 className="text-xl font-black text-[#0F172A]">You're in, {form.name.split(' ')[0]}!</h1>
          <p className="text-sm text-slate-500 mt-2">
            Thanks for registering. {form.emailOptIn || form.smsOptIn || form.whatsappOptIn
              ? "You'll hear from us on the channels you selected."
              : 'You can update your communication preferences any time by contacting us directly.'}
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[#EEF4FF] flex items-center justify-center mx-auto mb-3">
          <Users className="text-[#185FA5]" size={22} />
        </div>
        <h1 className="text-xl font-black text-[#0F172A]">Join Us</h1>
        <p className="text-sm text-slate-500 mt-1">Register below to stay in the loop with services, events, and reminders.</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-600 text-sm font-semibold rounded-xl px-3.5 py-2.5">{error}</div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Full name</label>
          <input value={form.name} onChange={(e) => update({ name: e.target.value })} placeholder="Jane Doe" className={inputCls} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Email</label>
            <input type="email" value={form.email} onChange={(e) => update({ email: e.target.value })} placeholder="jane@email.com" className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Phone</label>
            <input value={form.phone} onChange={(e) => update({ phone: e.target.value })} placeholder="080..." className={inputCls} />
          </div>
        </div>

        <div>
          <label className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Address (optional)</label>
          <input value={form.address} onChange={(e) => update({ address: e.target.value })} className={inputCls} />
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-3">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">How should we reach you?</p>
          <Checkbox label="Email updates" checked={form.emailOptIn} onChange={(v) => update({ emailOptIn: v })} />
          <Checkbox label="SMS reminders" checked={form.smsOptIn} onChange={(v) => update({ smsOptIn: v })} />
          <Checkbox label="WhatsApp reminders" checked={form.whatsappOptIn} onChange={(v) => update({ whatsappOptIn: v })} />
          <p className="text-[11px] text-slate-400">You can opt out at any time by contacting us. We'll only message you on the channels you select above.</p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 rounded-xl font-black text-white bg-[#185FA5] disabled:opacity-50"
        >
          {submitting ? 'Registering...' : 'Register'}
        </button>
      </form>
    </Shell>
  );
};

const Checkbox = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2.5 cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 rounded border-slate-300 text-[#185FA5] focus:ring-[#185FA5]"
    />
    <span className="text-sm font-semibold text-[#0F172A]">{label}</span>
  </label>
);

const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-[#0F172A] focus:outline-none focus:border-[#185FA5]';

export default JoinChurch;
