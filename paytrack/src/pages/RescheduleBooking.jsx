import React, { useEffect, useState } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const Shell = ({ children }) => (
  <div className="min-h-screen bg-[#F0F4FF] flex items-center justify-center px-5 py-12 font-sans">
    <div className="w-full max-w-md bg-white rounded-3xl border border-[#E2E8F0] shadow-xl p-6 sm:p-8">
      {children}
    </div>
  </div>
);

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getNext30Days() {
  const days = [];
  const today = new Date();
  for (let i = 1; i <= 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatDate(d) {
  return d.toISOString().split('T')[0];
}

const RescheduleBooking = () => {
  const token = new URLSearchParams(window.location.search).get('token');
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [newDateTime, setNewDateTime] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setError('Invalid link.'); setLoading(false); return; }
    fetch(`${BACKEND_URL}/api/bookings/reschedule/${token}`)
      .then(r => r.json())
      .then(data => {
        if (!data.success) throw new Error(data.error);
        setDetails(data.booking);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!selectedDate || !details) return;
    setSlotsLoading(true);
    setSlots([]);
    setSelectedSlot('');
    fetch(`${BACKEND_URL}/api/services/${details.serviceId}/slots?date=${selectedDate}`)
      .then(r => r.json())
      .then(data => setSlots(data.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate, details]);

  const handleReschedule = async () => {
    if (!selectedDate || !selectedSlot) return;
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/bookings/reschedule/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newDate: selectedDate, newTime: selectedSlot }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewDateTime({ date: selectedDate, time: selectedSlot });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Shell><p className="text-slate-400 text-center">Loading...</p></Shell>;
  if (error) return <Shell><div className="text-center"><p className="text-red-500 font-semibold">{error}</p></div></Shell>;

  if (done) return (
    <Shell>
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✅</span>
        </div>
        <h2 className="text-xl font-black text-[#0F172A] mb-2">Booking Rescheduled!</h2>
        <p className="text-slate-500 text-sm mb-4">Your booking has been moved to:</p>
        <div className="bg-[#EEF4FF] rounded-2xl p-4">
          <p className="font-black text-[#185FA5] text-lg">{newDateTime.date}</p>
          <p className="font-bold text-[#185FA5]">{newDateTime.time}</p>
        </div>
        <p className="text-slate-400 text-xs mt-4">A new confirmation email has been sent to you.</p>
      </div>
    </Shell>
  );

  const availableDays = new Set(details.availability?.map(a => a.day) || []);
  const next30 = getNext30Days();

  return (
    <Shell>
      <div className="mb-5">
        <h2 className="text-xl font-black text-[#0F172A]">Reschedule Booking</h2>
        <p className="text-slate-400 text-sm mt-1">{details.serviceName}</p>
        <div className="bg-slate-50 rounded-xl p-3 mt-3">
          <p className="text-xs text-slate-400">Current booking</p>
          <p className="text-sm font-bold text-slate-600 line-through">{details.scheduledDate} at {details.scheduledTime}</p>
        </div>
      </div>

      {/* Date picker */}
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Select New Date</p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {next30.map((d) => {
            const dayStr = formatDate(d);
            const isAvailable = availableDays.size === 0 || availableDays.has(d.getDay());
            const isSelected = selectedDate === dayStr;
            if (!isAvailable) return null;
            return (
              <button
                key={dayStr}
                onClick={() => setSelectedDate(dayStr)}
                className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border-2 transition-all ${
                  isSelected ? 'border-[#185FA5] bg-[#185FA5] text-white' : 'border-slate-100 hover:border-[#185FA5] text-slate-700'
                }`}
              >
                <span className={`text-[10px] font-bold ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>{DAYS[d.getDay()]}</span>
                <span className="text-lg font-black leading-tight">{d.getDate()}</span>
                <span className={`text-[10px] font-bold ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>{d.toLocaleDateString('en-NG', { month: 'short' })}</span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="mb-5">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Select New Time</p>
          {slotsLoading ? (
            <p className="text-sm text-slate-400 text-center py-4">Loading slots...</p>
          ) : slots.length === 0 ? (
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-sm text-slate-500">No available slots on this date.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`py-2.5 rounded-xl text-sm font-bold transition-all border-2 ${
                    selectedSlot === slot ? 'border-[#185FA5] bg-[#185FA5] text-white' : 'border-slate-100 hover:border-[#185FA5] text-slate-700'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <button
        onClick={handleReschedule}
        disabled={!selectedDate || !selectedSlot || saving}
        className="w-full py-4 bg-[#185FA5] text-white font-black rounded-2xl disabled:opacity-50 transition-all"
      >
        {saving ? 'Rescheduling...' : selectedSlot ? `Confirm — ${selectedDate} at ${selectedSlot}` : 'Select a date and time'}
      </button>
    </Shell>
  );
};

export default RescheduleBooking;
