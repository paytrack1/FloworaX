import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Calendar, Save, X, Plus } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.floworax.com.ng';
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const AvailabilityPage = () => {
  const { token } = useStore();
  const [weeklySlots, setWeeklySlots] = useState([]);
  const [dateOverrides, setDateOverrides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newBlockDate, setNewBlockDate] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/availability`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setWeeklySlots(data.availability.weeklySlots || []);
          setDateOverrides(data.availability.dateOverrides || []);
        }
      } catch (err) {
        console.error('Failed to load availability:', err);
      } finally {
        setLoading(false);
      }
    };
    if (token) load();
  }, [token]);

  const toggleDay = (dayOfWeek) => {
    const existing = weeklySlots.find((w) => w.dayOfWeek === dayOfWeek);
    if (existing) {
      setWeeklySlots(weeklySlots.filter((w) => w.dayOfWeek !== dayOfWeek));
    } else {
      setWeeklySlots([...weeklySlots, { dayOfWeek, startTime: '09:00', endTime: '17:00' }]);
    }
  };

  const updateDayTime = (dayOfWeek, field, value) => {
    setWeeklySlots(weeklySlots.map((w) => (w.dayOfWeek === dayOfWeek ? { ...w, [field]: value } : w)));
  };

  const addBlockedDate = () => {
    if (!newBlockDate) return;
    if (dateOverrides.some((o) => o.date === newBlockDate)) return;
    setDateOverrides([...dateOverrides, { date: newBlockDate, available: false }]);
    setNewBlockDate('');
  };

  const removeOverride = (date) => {
    setDateOverrides(dateOverrides.filter((o) => o.date !== date));
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`${BACKEND_URL}/api/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ weeklySlots, dateOverrides }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (err) {
      console.error('Failed to save availability:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-slate-400 text-sm p-6">Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-black text-[#0F172A]">Availability</h1>
        <p className="text-sm text-slate-500 mt-1">Set your weekly hours, and block off specific dates when you're not available.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <p className="font-bold text-[#0F172A] mb-4">Weekly hours</p>
        <div className="space-y-3">
          {DAY_NAMES.map((name, dayOfWeek) => {
            const slot = weeklySlots.find((w) => w.dayOfWeek === dayOfWeek);
            return (
              <div key={dayOfWeek} className="flex items-center gap-3">
                <label className="flex items-center gap-2 w-32 flex-shrink-0">
                  <input type="checkbox" checked={!!slot} onChange={() => toggleDay(dayOfWeek)} className="w-4 h-4" />
                  <span className="text-sm font-bold text-[#0F172A]">{name}</span>
                </label>
                {slot ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateDayTime(dayOfWeek, 'startTime', e.target.value)}
                      className="border border-slate-200 rounded-lg px-2 py-1 text-sm"
                    />
                    <span className="text-slate-400 text-sm">to</span>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateDayTime(dayOfWeek, 'endTime', e.target.value)}
                      className="border border-slate-200 rounded-lg px-2 py-1 text-sm"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-slate-300">Unavailable</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <p className="font-bold text-[#0F172A] mb-2">Block specific dates</p>
        <p className="text-xs text-slate-500 mb-3">Use this for holidays, vacations, or any day you won't be available despite your normal weekly hours.</p>
        <div className="flex items-center gap-2 mb-4">
          <input
            type="date"
            value={newBlockDate}
            onChange={(e) => setNewBlockDate(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm flex-1"
          />
          <button onClick={addBlockedDate} className="flex items-center gap-1 bg-[#185FA5] text-white text-sm font-bold px-4 py-2 rounded-lg">
            <Plus size={14} /> Block
          </button>
        </div>
        {dateOverrides.length === 0 ? (
          <p className="text-sm text-slate-400">No blocked dates.</p>
        ) : (
          <div className="space-y-2">
            {dateOverrides.map((o) => (
              <div key={o.date} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                <span className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400" /> {o.date}
                </span>
                <button onClick={() => removeOverride(o.date)} className="text-slate-400 hover:text-red-500">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 bg-[#185FA5] text-white font-bold px-6 py-3 rounded-xl disabled:opacity-50"
      >
        <Save size={16} /> {saving ? 'Saving...' : saved ? 'Saved!' : 'Save availability'}
      </button>
    </div>
  );
};

export default AvailabilityPage;
