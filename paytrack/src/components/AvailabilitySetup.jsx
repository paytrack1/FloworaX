import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const AvailabilitySetup = ({ service, token, onClose, onSaved }) => {
  const [slots, setSlots] = useState(
    service.availability?.length > 0
      ? service.availability
      : []
  );
  const [buffer, setBuffer] = useState(service.bufferTime || 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/services/${service._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ availability: slots, bufferTime: buffer }),
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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-[#0F172A]">Set Availability</h2>
              <p className="text-xs text-slate-400">{service.title}</p>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400"><X size={20} /></button>
          </div>

          {/* Day selector */}
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

          {/* Time slots per day */}
          {slots.length > 0 && (
            <div className="flex flex-col gap-3 mb-4">
              {slots.map((slot) => (
                <div key={slot.day} className="bg-[#F8FAFC] rounded-2xl p-3">
                  <p className="text-xs font-black text-[#185FA5] mb-2">{DAY_FULL[slot.day]}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <p className="text-[10px] text-slate-400 mb-1">Start</p>
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateSlot(slot.day, 'startTime', e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#185FA5]"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-slate-400 mb-1">End</p>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateSlot(slot.day, 'endTime', e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#185FA5]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {slots.length === 0 && (
            <div className="bg-amber-50 rounded-xl p-3 mb-4">
              <p className="text-xs text-amber-700 font-semibold">Select at least one day to set availability.</p>
            </div>
          )}

          {/* Buffer time */}
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Buffer Between Bookings</p>
            <select
              value={buffer}
              onChange={(e) => setBuffer(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#185FA5]"
            >
              <option value={0}>No buffer</option>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving || slots.length === 0}
            className="w-full py-4 bg-[#185FA5] text-white font-black rounded-2xl disabled:opacity-50 transition-all"
          >
            {saving ? 'Saving...' : 'Save Availability'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvailabilitySetup;
