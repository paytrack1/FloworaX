import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, MapPin, Ticket } from 'lucide-react';
import { trackPageView, trackEvent } from '../utils/analytics';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const Shell = ({ children }) => (
  <div className="min-h-screen bg-[#F5F7FA] px-5 py-8 flex items-center justify-center">
    <div className="w-full max-w-xl rounded-[28px] border border-[#E2E8F0] bg-white p-6 shadow-xl shadow-blue-100/60">
      {children}
    </div>
  </div>
);

const EventRegistration = () => {
  const path = window.location.pathname;
  const segments = path.split('/').filter(Boolean);
  const eventId = segments[1];
  const isSuccessRoute = segments[2] === 'ticket-success' || path.includes('/ticket-success');

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(!isSuccessRoute);
  const [form, setForm] = useState({ buyerName: '', buyerEmail: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (isSuccessRoute || !eventId) return;
    const loadEvent = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/events/public/${eventId}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError('This event is no longer available.');
          return;
        }
        setEvent(data.event);
        trackPageView(`Event: ${data.event.title || eventId}`);
      } catch {
        setError('Unable to load this event right now.');
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [eventId, isSuccessRoute]);

  const submit = async () => {
    if (!form.buyerName.trim() || !form.buyerEmail.trim()) {
      setError('Please add your name and email.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/events/public/${eventId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed.');
      if (data.paymentRequired && data.authorizationUrl) {
        trackEvent('event_registration_started_payment', { event_id: eventId });
        window.location.href = data.authorizationUrl;
        return;
      }
      trackEvent('event_registration_completed', { event_id: eventId, free: true });
      setDone(true);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const detailRows = useMemo(() => [
    { label: 'Date', value: event?.date },
    { label: 'Time', value: event?.time },
    { label: 'Location', value: event?.location || 'Online' },
  ], [event]);

  if (isSuccessRoute) {
    return (
      <Shell>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-3xl text-green-600">✓</div>
          <p className="text-xl font-black text-[#0F172A]">Registration confirmed</p>
          <p className="mt-2 text-sm text-[#64748B]">Your ticket has been reserved. Check your email for the confirmation and code.</p>
          <button onClick={() => window.location.href = '/'} className="mt-6 rounded-2xl bg-[#185FA5] px-4 py-3 text-sm font-black text-white">Back to Flowora</button>
        </div>
      </Shell>
    );
  }

  if (loading) {
    return (
      <Shell>
        <p className="text-center text-sm text-[#64748B]">Loading event details...</p>
      </Shell>
    );
  }

  if (!event) {
    return (
      <Shell>
        <div className="space-y-3 text-center">
          <p className="text-xl font-black text-[#0F172A]">Event unavailable</p>
          <p className="text-sm text-[#64748B]">This registration link is invalid or the event is no longer live.</p>
        </div>
      </Shell>
    );
  }

  if (done) {
    return (
      <Shell>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-3xl text-green-600">✓</div>
          <p className="text-xl font-black text-[#0F172A]">You’re on the list</p>
          <p className="mt-2 text-sm text-[#64748B]">A confirmation email with your ticket code is on the way.</p>
          <button onClick={() => window.location.href = '/'} className="mt-6 rounded-2xl bg-[#185FA5] px-4 py-3 text-sm font-black text-white">Back to Flowora</button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <button onClick={() => window.history.back()} className="mb-5 flex items-center gap-2 text-sm font-bold text-[#185FA5]">
        <ArrowLeft size={16} /> Back
      </button>
      <div className="mb-6">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#2F5FB3]">Event registration</p>
        <h1 className="mt-2 text-2xl font-black text-[#0F172A]">{event.title}</h1>
        <p className="mt-2 text-sm text-[#64748B]">{event.description || 'Join this event and receive your ticket code instantly.'}</p>
      </div>

      <div className="mb-6 space-y-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFF] p-4">
        {detailRows.map((row) => (
          <div key={row.label} className="flex items-center gap-2 text-sm text-[#475569]">
            {row.label === 'Date' ? <CalendarDays size={15} className="text-[#185FA5]" /> : row.label === 'Location' ? <MapPin size={15} className="text-[#185FA5]" /> : <Ticket size={15} className="text-[#185FA5]" />}
            <span className="font-semibold text-[#0F172A]">{row.label}:</span> {row.value}
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-[#94A3B8]">Your name</label>
          <input value={form.buyerName} onChange={(e) => setForm({ ...form, buyerName: e.target.value })} className="w-full rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#185FA5]" placeholder="Full name" />
        </div>
        <div>
          <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-[#94A3B8]">Email</label>
          <input type="email" value={form.buyerEmail} onChange={(e) => setForm({ ...form, buyerEmail: e.target.value })} className="w-full rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#185FA5]" placeholder="you@email.com" />
        </div>
        {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
        <button onClick={submit} disabled={submitting} className="w-full rounded-2xl bg-[#185FA5] px-4 py-3 text-sm font-black text-white disabled:opacity-60">
          {submitting ? 'Registering...' : event.price > 0 ? `Pay ₦${Number(event.price).toLocaleString()} and register` : 'Register for free'}
        </button>
      </div>
    </Shell>
  );
};

export default EventRegistration;
