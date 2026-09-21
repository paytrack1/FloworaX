import React, { useState } from 'react';
import { X, Plus, Trash2, Calendar, Clock } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

function getNext60Days() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

const AvailabilitySetup = ({ service, token, onClose, onSaved }) => {
  const [mode, setMode] = useState(service.availabilityMode || 'weekly');
  const [slots, setSlots] = useState(service.availability?.length > 0 ? service.availability : []);
  const [specificDates, setSpecificDates] = useState(service.specificDates?.length > 0 ? service.specificDates : []);
  const [buffer, setBuffer] = useState(service.bufferTime || 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Weekly mode handlers
  const toggleDay = (dayIndex) => {
    const exists = slots.find(s => s.day === dayIndex);
    if (exists) {
      setSlots(slots.filter(s => s.day !== dayIndex));
    } else {
      setSlots([...slots, { day: dayIndex, startTime: '09:00', endTime: '17:00' }].sort((a, b) => a.day - b.day));
    }
  };

  const updateSlot = (dayIndex, field, value) => {
    setSlots(slots.map(s => s.day === dayIndex ? { ...s, [field]: value } : s));
  };

  // Specific dates mode handlers
  const toggleSpecificDate = (date) => {
    const exists = specificDates.find(d => d.date === date);
    if (exists) {
      setSpecificDates(specificDates.filter(d => d.date !== date));
    } else {
      setSpecificDates([...specificDates, { date, startTime: '09:00', endTime: '17:00' }].sort((a, b) => a.date.localeCompare(b.date)));
    }
  };

  const updateSpecificDate = (date, field, value) => {
    setSpecificDates(specificDates.map(d => d.date === date ? { ...d, [field]: value } : d));
  };

  const handleSave = async () => {
    if (mode === 'weekly' && slots.length === 0) { setError('Select at least one day'); return; }
    if (mode === 'specific' && specificDates.length === 0) { setError('Select at least one date'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/services/${service._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          availabilityMode: mode,
          availability: mode === 'weekly' ? slots : [],
          specificDates: mode === 'specific' ? specificDates : [],
          bufferTime: buffer,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      onSaved(data.service);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const next60 = getNext60Days();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-black text-[#0F172A]">Set Availability</h2>
              <p className="text-xs text-slate-400">{service.title}</p>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400"><X size={20} /></button>
          </div>

          {/* Mode selector */}
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setMode('weekly')}
              className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                mode === 'weekly' ? 'border-[#185FA5] bg-[#EEF4FF] text-[#185FA5]' : 'border-slate-100 text-slate-500'
              }`}
            >
              <Clock size={16} /> Weekly Schedule
            </button>
            <button
              onClick={() => setMode('specific')}
              className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                mode === 'specific' ? 'border-[#185FA5] bg-[#EEF4FF] text-[#185FA5]' : 'border-slate-100 text-slate-500'
              }`}
            >
              <Calendar size={16} /> Specific Dates
            </button>
          </div>

          {/* Weekly mode */}
          {mode === 'weekly' && (
            <>
              <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Available Days</p>
              <div className="flex gap-2 mb-4 flex-wrap">
                {DAYS.map((day, i) => {
                  const active = slots.find(s => s.day === i);
                  return (
                    <button
                      key={i}
                      onClick={() => toggleDay(i)}
                      className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${
                        active ? 'bg-[#185FA5] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              {slots.length > 0 && (
                <div className="flex flex-col gap-3 mb-4">
                  {slots.map((slot) => (
                    <div key={slot.day} className="bg-[#F8FAFC] rounded-2xl p-3">
                      <p className="text-xs font-black text-[#185FA5] mb-2">{DAY_FULL[slot.day]}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <p className="text-[10px] text-slate-400 mb-1">Start</p>
                          <input type="time" value={slot.startTime} onChange={(e) => updateSlot(slot.day, 'startTime', e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#185FA5]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] text-slate-400 mb-1">End</p>
                          <input type="time" value={slot.endTime} onChange={(e) => updateSlot(slot.day, 'endTime', e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#185FA5]" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Specific dates mode */}
          {mode === 'specific' && (
            <>
              <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                Pick Specific Dates ({specificDates.length} selected)
              </p>
              <div className="grid grid-cols-7 gap-1 mb-4">
                {next60.map((date) => {
                  const d = new Date(date + 'T00:00:00');
                  const isSelected = specificDates.find(s => s.date === date);
                  const isPast = d < new Date(new Date().setHours(0,0,0,0));
                  if (isPast) return null;
                  return (
                    <button
                      key={date}
                      onClick={() => toggleSpecificDate(date)}
                      className={`flex flex-col items-center py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                        isSelected ? 'bg-[#185FA5] text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-[9px] opacity-70">{DAYS[d.getDay()]}</span>
                      <span>{d.getDate()}</span>
                    </button>
                  );
                })}
              </div>

              {/* Set hours for selected dates */}
              {specificDates.length > 0 && (
                <div className="flex flex-col gap-3 mb-4">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">Set Hours Per Date</p>
                  {specificDates.map((sd) => {
                    const d = new Date(sd.date + 'T00:00:00');
                    return (
                      <div key={sd.date} className="bg-[#F8FAFC] rounded-2xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-black text-[#185FA5]">
                            {DAYS[d.getDay()]} {d.getDate()} {d.toLocaleDateString('en-NG', { month: 'short' })}
                          </p>
                          <button onClick={() => toggleSpecificDate(sd.date)} className="text-slate-300 hover:text-red-400">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <p className="text-[10px] text-slate-400 mb-1">Start</p>
                            <input type="time" value={sd.startTime} onChange={(e) => updateSpecificDate(sd.date, 'startTime', e.target.value)}
                              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#185FA5]" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] text-slate-400 mb-1">End</p>
                            <input type="time" value={sd.endTime} onChange={(e) => updateSpecificDate(sd.date, 'endTime', e.target.value)}
                              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#185FA5]" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Buffer time */}
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Buffer Between Bookings</p>
            <select value={buffer} onChange={(e) => setBuffer(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#185FA5]">
              <option value={0}>No buffer</option>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

          <button onClick={handleSave} disabled={saving}
            className="w-full py-4 bg-[#185FA5] text-white font-black rounded-2xl disabled:opacity-50 transition-all">
            {saving ? 'Saving...' : 'Save Availability'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvailabilitySetup;
