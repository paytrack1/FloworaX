import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const Bookings = () => {
  const { token } = useStore();
  const [bookings, setBookings]   = useState([]);
  const [services, setServices]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState('bookings');
  const [showNewService, setShowNewService] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [form, setForm]           = useState({
    title: '', description: '', duration: 60,
    price: '', isFree: false, category: 'General', location: 'Online',
  });

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  useEffect(() => {
    fetchBookings();
    fetchServices();
  }, []);

  const fetchBookings = async () => {
    try {
      const res  = await fetch(`${BACKEND_URL}/api/bookings`, { headers: authHeaders });
      const data = await res.json();
      if (data.success) setBookings(data.bookings);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchServices = async () => {
    try {
      const res  = await fetch(`${BACKEND_URL}/api/services`, { headers: authHeaders });
      const data = await res.json();
      if (data.success) setServices(data.services);
    } catch (err) { console.error(err); }
  };

  const handleCreateService = async () => {
    if (!form.title || !form.duration) { setError('Title and duration are required'); return; }
    setSaving(true);
    try {
      const res  = await fetch(`${BACKEND_URL}/api/services`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ ...form, price: form.isFree ? 0 : Number(form.price) }),
      });
      const data = await res.json();
      if (data.success) {
        setServices([data.service, ...services]);
        setShowNewService(false);
        setForm({ title: '', description: '', duration: 60, price: '', isFree: false, category: 'General', location: 'Online' });
      } else { setError(data.error || 'Failed to create service'); }
    } catch { setError('Failed to create service'); }
    finally { setSaving(false); }
  };

  const handleDeleteService = async (id) => {
    try {
      await fetch(`${BACKEND_URL}/api/services/${id}`, { method: 'DELETE', headers: authHeaders });
      setServices(services.filter(s => s._id !== id));
    } catch { console.error('Delete failed'); }
  };

  const handleUpdateBooking = async (id, status) => {
    try {
      const res  = await fetch(`${BACKEND_URL}/api/bookings/${id}`, {
        method: 'PATCH', headers: authHeaders, body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) setBookings(bookings.map(b => b._id === id ? data.booking : b));
    } catch { console.error('Update failed'); }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'confirmed':  return 'bg-green-50 text-green-700';
      case 'pending':    return 'bg-amber-50 text-amber-700';
      case 'completed':  return 'bg-blue-50 text-blue-700';
      case 'cancelled':  return 'bg-red-50 text-red-500';
      default:           return 'bg-gray-50 text-gray-500';
    }
  };

  const upcoming  = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed');
  const past      = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');

  return (
    <div className="bg-[#F5F7FA] min-h-screen pb-32">
      {/* Header */}
      <div className="p-6 bg-white border-b border-[#E2E8F0] shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-[#0F172A]">Bookings</h1>
          <p className="text-[#94A3B8] text-xs font-medium mt-0.5">Manage your services and appointments</p>
        </div>
        <button onClick={() => setShowNewService(true)} className="bg-[#185FA5] text-white px-4 py-2 rounded-xl font-bold text-sm active:scale-95 transition-all">
          + Service
        </button>
      </div>

      {/* Stats */}
      <div className="p-6 grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm text-center">
          <p className="font-black text-2xl text-[#185FA5]">{services.length}</p>
          <p className="text-[#94A3B8] text-[11px] font-semibold uppercase mt-1">Services</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm text-center">
          <p className="font-black text-2xl text-amber-500">{upcoming.length}</p>
          <p className="text-[#94A3B8] text-[11px] font-semibold uppercase mt-1">Upcoming</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm text-center">
          <p className="font-black text-2xl text-green-600">{past.length}</p>
          <p className="text-[#94A3B8] text-[11px] font-semibold uppercase mt-1">Completed</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 mb-4">
        <div className="flex bg-[#F1F5F9] rounded-2xl p-1">
          {['bookings', 'services'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all capitalize ${activeTab === tab ? 'bg-white text-[#185FA5] shadow-sm' : 'text-[#94A3B8]'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* New Service Form */}
      {showNewService && (
        <div className="mx-6 mb-4 bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
          <p className="text-[#0F172A] font-bold text-sm mb-4">New Service</p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-[#0F172A] text-xs font-bold uppercase tracking-wide mb-1.5 block">Service Title</label>
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. 60min Therapy Session"
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#185FA5]" />
            </div>
            <div>
              <label className="text-[#0F172A] text-xs font-bold uppercase tracking-wide mb-1.5 block">Description</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="What does this service include?"
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#185FA5] h-20 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#0F172A] text-xs font-bold uppercase tracking-wide mb-1.5 block">Duration (mins)</label>
                <input type="number" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})}
                  className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#185FA5]" />
              </div>
              <div>
                <label className="text-[#0F172A] text-xs font-bold uppercase tracking-wide mb-1.5 block">Category</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                  className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#185FA5]">
                  {['General','Therapy','Consulting','Church','Fitness','Education','Legal','Medical','Other'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="isFree" checked={form.isFree} onChange={e => setForm({...form, isFree: e.target.checked})} className="w-4 h-4" />
              <label htmlFor="isFree" className="text-sm font-bold text-[#0F172A]">This is a free service</label>
            </div>
            {!form.isFree && (
              <div>
                <label className="text-[#0F172A] text-xs font-bold uppercase tracking-wide mb-1.5 block">Price (₦)</label>
                <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="0.00"
                  className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#185FA5]" />
              </div>
            )}
            <div>
              <label className="text-[#0F172A] text-xs font-bold uppercase tracking-wide mb-1.5 block">Location</label>
              <input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="Online or physical address"
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#185FA5]" />
            </div>
            {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl"><p className="text-red-600 text-sm">⚠️ {error}</p></div>}
            <div className="flex gap-3">
              <button onClick={() => { setShowNewService(false); setError(''); }}
                className="flex-1 py-3 border border-[#E2E8F0] rounded-xl font-bold text-[#64748B] text-sm">Cancel</button>
              <button onClick={handleCreateService} disabled={saving}
                className="flex-1 py-3 bg-[#185FA5] text-white rounded-xl font-bold text-sm disabled:opacity-60">
                {saving ? 'Saving…' : 'Create Service'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-6">
        {activeTab === 'services' ? (
          <div className="flex flex-col gap-3">
            {services.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#EEF4FF] flex items-center justify-center text-2xl">📅</div>
                <p className="text-[#94A3B8] text-sm font-medium">No services yet.</p>
                <p className="text-[#CBD5E1] text-xs">Tap "+ Service" to create your first service</p>
              </div>
            ) : services.map(service => (
              <div key={service._id} className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-[#0F172A] font-bold text-sm">{service.title}</p>
                    <p className="text-[#94A3B8] text-xs mt-0.5">{service.duration} mins · {service.category} · {service.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#185FA5] font-black text-sm">{service.isFree ? 'Free' : `₦${service.price?.toLocaleString()}`}</p>
                    <button onClick={() => handleDeleteService(service._id)} className="text-red-400 text-xs mt-1">Delete</button>
                  </div>
                </div>
                {service.description && <p className="text-[#64748B] text-xs">{service.description}</p>}
                <div className="mt-3 pt-3 border-t border-[#F1F5F9]">
                  <p className="text-[#94A3B8] text-xs font-medium">Share booking link:</p>
                  <p className="text-[#185FA5] text-xs font-mono mt-1 break-all">
                    {window.location.origin}/book/{service._id}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="text-center py-16 text-[#94A3B8] text-sm">Loading bookings...</div>
            ) : bookings.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#EEF4FF] flex items-center justify-center text-2xl">📋</div>
                <p className="text-[#94A3B8] text-sm font-medium">No bookings yet.</p>
                <p className="text-[#CBD5E1] text-xs">Share your service link to get bookings</p>
              </div>
            ) : bookings.map(booking => (
              <div key={booking._id} className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-[#0F172A] font-bold text-sm">{booking.clientName}</p>
                    <p className="text-[#94A3B8] text-xs mt-0.5">{booking.clientEmail} · {booking.clientPhone}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>
                <div className="flex gap-4 mb-3">
                  <div>
                    <p className="text-[#94A3B8] text-[10px] uppercase font-semibold">Date</p>
                    <p className="text-[#0F172A] text-sm font-bold">{booking.scheduledDate}</p>
                  </div>
                  <div>
                    <p className="text-[#94A3B8] text-[10px] uppercase font-semibold">Time</p>
                    <p className="text-[#0F172A] text-sm font-bold">{booking.scheduledTime}</p>
                  </div>
                  <div>
                    <p className="text-[#94A3B8] text-[10px] uppercase font-semibold">Amount</p>
                    <p className="text-[#0F172A] text-sm font-bold">{booking.amount === 0 ? 'Free' : `₦${booking.amount?.toLocaleString()}`}</p>
                  </div>
                </div>
                {booking.serviceId && (
                  <p className="text-[#64748B] text-xs mb-3">Service: {booking.serviceId.title}</p>
                )}
                {(booking.status === 'pending' || booking.status === 'confirmed') && (
                  <div className="flex gap-2">
                    {booking.status === 'pending' && (
                      <button onClick={() => handleUpdateBooking(booking._id, 'confirmed')}
                        className="flex-1 py-2 bg-green-50 text-green-700 rounded-xl font-bold text-xs">Confirm</button>
                    )}
                    <button onClick={() => handleUpdateBooking(booking._id, 'completed')}
                      className="flex-1 py-2 bg-blue-50 text-blue-700 rounded-xl font-bold text-xs">Complete</button>
                    <button onClick={() => handleUpdateBooking(booking._id, 'cancelled')}
                      className="flex-1 py-2 bg-red-50 text-red-500 rounded-xl font-bold text-xs">Cancel</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookings;