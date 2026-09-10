import React, { useState, useEffect } from 'react';
import { trackPageView, trackEvent } from '../utils/analytics';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const Shell = ({ children }) => (
  <div className="min-h-screen bg-[#F0F4FF] flex items-center justify-center px-5 py-12 font-sans">
    <div className="w-full max-w-md bg-white rounded-3xl border border-[#E2E8F0] shadow-xl shadow-blue-100/50 p-6 sm:p-8">
      {children}
    </div>
  </div>
);

const BookingForm = () => {
  const serviceId = window.location.pathname.split('/book/')[1]?.split('/')[0];
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState({ clientName: '', clientEmail: '', clientPhone: '', scheduledDate: '', scheduledTime: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/services/single/${serviceId}`);
        const data = await res.json();
        if (!res.ok || !data.service) { setNotFound(true); return; }
        setService(data.service);
        trackPageView(`Booking: ${data.service.title || serviceId}`);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    if (serviceId) load(); else { setNotFound(true); setLoading(false); }
  }, [serviceId]);

  const update = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setError(''); };

  const submit = async () => {
    setError('');
    if (!form.clientName.trim() || !form.clientEmail.trim() || !form.scheduledDate || !form.scheduledTime) {
      setError('Please fill in your name, email, date and time.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/bookings/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not create booking');
      if (data.paymentRequired && data.authorizationUrl) {
        trackEvent('booking_started_payment', { service_id: serviceId });
        window.location.href = data.authorizationUrl;
        return;
      }
      trackEvent('booking_completed', { service_id: serviceId, free: true });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Shell><p className="text-[#94A3B8] text-sm text-center">Loading...</p></Shell>;

  if (notFound) return (
    <Shell>
      <div className="text-center">
        <p className="text-[#0F172A] font-black text-lg mb-1">Service not available</p>
        <p className="text-[#94A3B8] text-sm">This booking link is invalid or no longer active.</p>
      </div>
    </Shell>
  );

  if (done) return (
    <Shell>
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center text-3xl mx-auto mb-4">✓</div>
        <p className="text-[#0F172A] font-black text-lg mb-1">Booking confirmed</p>
        <p className="text-[#94A3B8] text-sm">{service.title} on {form.scheduledDate} at {form.scheduledTime}. A confirmation was sent to {form.clientEmail}.</p>
      </div>
    </Shell>
  );

  const fld = "w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] text-sm outline-none focus:border-[#2F5FB3]";
  const lbl = "text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] mb-1.5 block";

  return (
    <Shell>
      <div className="mb-6">
        <p className="text-[10px] font-black text-[#2F5FB3] uppercase tracking-[0.3em] mb-2">Book a session</p>
        <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">{service.title}</h1>
        {service.description && <p className="text-[#64748B] text-sm mt-2">{service.description}</p>}
        <div className="flex items-center gap-3 mt-3 text-xs text-[#64748B]">
          <span>{service.duration} mins</span>
          <span className="w-1 h-1 rounded-full bg-[#CBD5E1]" />
          <span className="font-black text-[#0F172A]">{service.isFree ? 'Free' : `₦${Number(service.price).toLocaleString()}`}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className={lbl}>Your name</label>
          <input className={fld} value={form.clientName} onChange={update('clientName')} placeholder="Full name" />
        </div>
        <div>
          <label className={lbl}>Email</label>
          <input className={fld} type="email" value={form.clientEmail} onChange={update('clientEmail')} placeholder="you@email.com" />
        </div>
        <div>
          <label className={lbl}>Phone</label>
          <input className={fld} value={form.clientPhone} onChange={update('clientPhone')} placeholder="Optional" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Date</label>
            <input className={fld} type="date" value={form.scheduledDate} onChange={update('scheduledDate')} />
          </div>
          <div>
            <label className={lbl}>Time</label>
            <input className={fld} type="time" value={form.scheduledTime} onChange={update('scheduledTime')} />
          </div>
        </div>
        <div>
          <label className={lbl}>Notes</label>
          <textarea className={fld} rows={3} value={form.notes} onChange={update('notes')} placeholder="Anything the provider should know (optional)" />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button onClick={submit} disabled={submitting}
          className="w-full bg-[#2F5FB3] text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest active:scale-[0.99] transition-transform disabled:opacity-60">
          {submitting ? 'Booking...' : service.isFree ? 'Confirm booking' : `Pay ₦${Number(service.price).toLocaleString()} and book`}
        </button>
      </div>
    </Shell>
  );
};

const BookingSuccess = () => {
  const params = new URLSearchParams(window.location.search);
  const reference = params.get('reference') || params.get('trxref');
  const [state, setState] = useState('verifying');

  useEffect(() => {
    const verify = async () => {
      if (!reference) { setState('failed'); return; }
      try {
        const res = await fetch(`${BACKEND_URL}/api/bookings/verify/${reference}`);
        const data = await res.json();
        setState(data.success ? 'success' : 'failed');
      } catch {
        setState('failed');
      }
    };
    verify();
  }, [reference]);

  return (
    <Shell>
      <div className="text-center">
        {state === 'verifying' && <p className="text-[#94A3B8] text-sm">Verifying your payment...</p>}
        {state === 'success' && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center text-3xl mx-auto mb-4">✓</div>
            <p className="text-[#0F172A] font-black text-lg mb-1">Payment confirmed</p>
            <p className="text-[#94A3B8] text-sm">Your booking is confirmed. Check your email for the details.</p>
          </>
        )}
        {state === 'failed' && (
          <>
            <p className="text-[#0F172A] font-black text-lg mb-1">We could not confirm payment</p>
            <p className="text-[#94A3B8] text-sm">If you were charged, contact the provider and they can confirm your booking.</p>
          </>
        )}
      </div>
    </Shell>
  );
};

const PublicBooking = () => {
  const path = window.location.pathname;
  if (path.startsWith('/booking/')) return <BookingSuccess />;
  return <BookingForm />;
};

export default PublicBooking;
