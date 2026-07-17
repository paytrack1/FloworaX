import React, { useState, useEffect } from "react";
import {
  Plus,
  MapPin,
  Calendar,
  Clock,
  Ticket,
  UserCheck,
  Users,
  X,
  AlertCircle
} from "lucide-react";
import { useStore } from "../store/useStore";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export default function Events() {
  const { token } = useStore();
  const authHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const [events, setEvents] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [scanningEventId, setScanningEventId] = useState(null);
  const [scanResult, setScanResult] = useState("");
  const [ticketInput, setTicketInput] = useState("");
  const [form, setForm] = useState({ title: "", date: "", time: "", location: "", capacity: "", price: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/events`, { headers: authHeaders });
      const data = await res.json();
      if (data.success) setEvents(data.events);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    }
  };

  const handleCreateEvent = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/events`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ ...form, capacity: Number(form.capacity) || 0, price: Number(form.price) || 0 }),
      });
      const data = await res.json();
      if (data.success) {
        setEvents(prev => [...prev, data.event]);
        setShowCreateModal(false);
        setForm({ title: "", date: "", time: "", location: "", capacity: "", price: "" });
      }
    } catch (err) {
      console.error("Failed to create event:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCheckIn = async (eventId) => {
    if (!ticketInput.trim()) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/events/${eventId}/checkin`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ ticketCode: ticketInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setScanResult(`Checked in ${ticketInput}! Success.`);
        setEvents(prev => prev.map(evt =>
          evt._id === eventId ? { ...evt, checkedInCount: (evt.checkedInCount || 0) + 1 } : evt
        ));
      } else {
        setScanResult(data.error || "Check-in failed");
      }
    } catch (err) {
      setScanResult("Check-in failed");
      console.error("Check-in error:", err);
    }
    setTicketInput("");
  };


  const handleShare = async (event) => {
    const url = `${window.location.origin}/events/${event._id}`;
    const text = `You are invited to ${event.title}! Register here: ${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: event.title, text, url });
      } catch (err) {
        console.error("Share cancelled or failed:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setScanResult("Link copied to clipboard!");
        setTimeout(() => setScanResult(""), 3000);
      } catch (err) {
        console.error("Copy failed:", err);
      }
    }
  };
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0A1F44]">Events & Tickets</h1>
          <p className="text-sm text-gray-500">Manage your conferences, ticketing, and real-time check-ins</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#0A1F44] text-white px-4 py-2 rounded-lg font-semibold hover:bg-opacity-90 transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          Create Event
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map((event) => (
          <div key={event._id} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700">
                  {event.price === 0 ? "Free" : `?${event.price}`}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Calendar size={12} /> {event.date} at {event.time}
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#0A1F44] mt-3">{event.title}</h3>
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <MapPin size={14} className="text-gray-400" /> {event.location}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-b border-gray-100 py-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold flex items-center gap-1">
                    <Ticket size={12} /> Tickets Issued
                  </p>
                  <p className="text-2xl font-bold text-[#0A1F44] mt-1">{event.ticketCount || 0} <span className="text-xs text-gray-400">/ {event.capacity || "8"}</span></p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold flex items-center gap-1">
                    <UserCheck size={12} /> Checked In
                  </p>
                  <p className="text-2xl font-bold text-indigo-600 mt-1">{event.checkedInCount || 0} <span className="text-xs text-gray-400">/ {event.ticketCount || 0}</span></p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => { setScanningEventId(event._id); setScanResult(""); }}
                className="flex-1 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
              >
                <UserCheck size={16} /> Scan Tickets
              </button>
              <button className="flex-1 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2">
                <Users size={16} /> Attendee List
              </button>
            </div>
              <button onClick={() => handleShare(event)} className="flex-1 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2">Share Event</button>
          </div>
        ))}
      </div>

      {scanningEventId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setScanningEventId(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-[#0A1F44] mb-4">Scan/Enter Ticket Code</h3>
            <div className="bg-slate-50 h-48 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-gray-200 mb-4">
              <Ticket size={32} className="text-indigo-400 animate-pulse" />
              <span className="text-xs text-gray-400 mt-2">Camera scanner ready</span>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Enter Ticket Code (e.g. TKT-73891)"
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => handleCheckIn(scanningEventId)}
                className="w-full bg-[#0A1F44] text-white py-2 rounded-lg font-bold text-sm hover:opacity-95 transition-all"
              >
                Submit Manual Ticket
              </button>
              {scanResult && (
                <p className="p-3 text-center text-xs font-semibold rounded bg-emerald-50 text-emerald-700 mt-2 border border-emerald-100 flex items-center justify-center gap-1.5">
                  <AlertCircle size={14} />
                  {scanResult}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-[#0A1F44] mb-4">Create Event</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Event title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm" />
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm" />
              <input type="text" placeholder="Time (e.g. 10:00 AM)" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm" />
              <input type="text" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm" />
              <input type="number" placeholder="Capacity" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm" />
              <input type="number" placeholder="Price (0 for free)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm" />
              <button onClick={handleCreateEvent} disabled={saving} className="w-full bg-[#0A1F44] text-white py-2 rounded-lg font-bold text-sm hover:opacity-95 transition-all disabled:opacity-50">
                {saving ? "Creating..." : "Create Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
