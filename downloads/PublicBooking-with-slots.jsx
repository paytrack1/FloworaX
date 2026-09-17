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

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getNext30Days() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatDate(d) {
  return d.toISOString().split('T')[0];
}

function formatDisplayDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' });
}

const BookingForm = () => {
  const serviceId = window.location.pathname.split('/book/')[1]?.split('/')[0];
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [form, setForm] = useState({ clientName: '', clientEmail: '', clientPhone: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  // Available days from service
  const availableDays = new Set(service?.availability?.map(a => a.day) || []);

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

  // Load slots when date selected
  useEffect(() => {
    if (!selectedDate || !service) return;
    setSlotsLoading(true);
    setSlots([]);
    setSelectedSlot('');
    fetch(`${BACKEND_URL}/api/services/${service._id}/slots?date=${selectedDate}`)
      .then(r => r.json())
      .then(data => setSlots(data.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate, service]);

  const update = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setError(''); };

  const submit = async () => {
    setError('');
    if (!form.clientName.trim() || !form.clientEmail.trim()) {
      setError('Please fill in your name and email.');
      return;
    }
    if (!selectedDate) { setError('Please select a date.'); return; }
    if (!selectedSlot) { setError('Please select a time slot.'); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/bookings/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId,
          ...form,
          scheduledDate: selectedDate,
          scheduledTime: selectedSlot,
        }),
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
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✅</span>
        </div>
        <p className="text-[#0F172A] font-black text-xl mb-2">Booking Confirmed!</p>
        <p className="text-[#94A3B8] text-sm mb-1">{service?.title}</p>
        <p className="text-[#185FA5] font-bold text-sm">{formatDisplayDate(selectedDate)} at {selectedSlot}</p>
        <p className="text-[#94A3B8] text-xs mt-3">Check your email for confirmation details.</p>
      </div>
    </Shell>
  );

  const next30Days = getNext30Days();
  const hasAvailability = service?.availability?.length > 0;

  return (
    <Shell>
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-bold text-[#185FA5] uppercase tracking-wider mb-1">Book a Session</p>
        <h1 className="text-2xl font-black text-[#0F172A]">{service.title}</h1>
        {service.description && <p className="text-sm text-[#94A3B8] mt-1">{service.description}</p>}
        <div className="flex items-center gap-3 mt-3">
          <span className="text-xs bg-[#EEF4FF] text-[#185FA5] font-bold px-3 py-1 rounded-full">
            {service.duration} min
          </span>
          {service.isFree || service.price === 0 ? (
            <span className="text-xs bg-green-50 text-green-700 font-bold px-3 py-1 rounded-full">Free</span>
          ) : (
            <span className="text-xs bg-[#EEF4FF] text-[#185FA5] font-bold px-3 py-1 rounded-full">
              ₦{Number(service.price).toLocaleString()}
            </span>
          )}
          <span className="text-xs bg-slate-50 text-slate-500 font-bold px-3 py-1 rounded-full">
            {service.location}
          </span>
        </div>
      </div>

      {!hasAvailability ? (
        <div className="bg-amber-50 rounded-2xl p-4 text-center mb-4">
          <p className="text-amber-700 font-semibold text-sm">This service has no availability set up yet. Please check back later.</p>
        </div>
      ) : (
        <>
          {/* Date picker */}
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Select a Date</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {next30Days.map((d) => {
                const dayStr = formatDate(d);
                const isAvailable = availableDays.has(d.getDay());
                const isSelected = selectedDate === dayStr;
                if (!isAvailable) return null;
                return (
                  <button
                    key={dayStr}
                    onClick={() => setSelectedDate(dayStr)}
                    className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-[#185FA5] bg-[#185FA5] text-white'
                        : 'border-slate-100 hover:border-[#185FA5] text-slate-700'
                    }`}
                  >
                    <span className={`text-[10px] font-bold ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                      {DAYS[d.getDay()]}
                    </span>
                    <span className="text-lg font-black leading-tight">{d.getDate()}</span>
                    <span className={`text-[10px] font-bold ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                      {d.toLocaleDateString('en-NG', { month: 'short' })}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time slots */}
          {selectedDate && (
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                Available Times — {formatDisplayDate(selectedDate)}
              </p>
              {slotsLoading ? (
                <p className="text-sm text-slate-400 text-center py-4">Loading slots...</p>
              ) : slots.length === 0 ? (
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-slate-500">No available slots on this date. Try another day.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-2.5 rounded-xl text-sm font-bold transition-all border-2 ${
                        selectedSlot === slot
                          ? 'border-[#185FA5] bg-[#185FA5] text-white'
                          : 'border-slate-100 hover:border-[#185FA5] text-slate-700'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Client details */}
      {selectedSlot && (
        <div className="flex flex-col gap-3 mb-5">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">Your Details</p>
          {[
            { key: 'clientName', label: 'Full Name', type: 'text', required: true },
            { key: 'clientEmail', label: 'Email Address', type: 'email', required: true },
            { key: 'clientPhone', label: 'Phone Number', type: 'tel', required: false },
          ].map(({ key, label, type, required }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-slate-500 block mb-1">
                {label}{required && <span className="text-red-400 ml-0.5">*</span>}
              </label>
              <input
                type={type}
                value={form[key]}
                onChange={update(key)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#185FA5]"
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={update('notes')}
              rows={2}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#185FA5] resize-none"
            />
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {selectedSlot && (
        <button
          onClick={submit}
          disabled={submitting}
          className="w-full py-4 bg-[#185FA5] text-white font-black rounded-2xl disabled:opacity-60 transition-all"
        >
          {submitting ? 'Booking...' : `Confirm — ${formatDisplayDate(selectedDate)} at ${selectedSlot}`}
        </button>
      )}
    </Shell>
  );
};

export default BookingForm;
