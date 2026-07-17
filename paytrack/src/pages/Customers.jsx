import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { fetchCustomers } from '../api/customers';
import FSpinner from '../components/FSpinner';
import FAlert   from '../components/FAlert';

const formatNaira = (amount) =>
  `₦${Number(amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-NG', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const getInitial = (name) => name?.charAt(0)?.toUpperCase() || '?';

const AVATAR_COLORS = [
  'bg-[#185FA5]', 'bg-violet-500', 'bg-emerald-500',
  'bg-amber-500',  'bg-rose-500',   'bg-cyan-500',
];
const avatarColor = (email) =>
  AVATAR_COLORS[(email?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

// ─── Customer Detail Drawer ───────────────────────────────────────────────────
const CustomerDrawer = ({ customer, onClose }) => {
  if (!customer) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
      onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl w-full max-w-lg shadow-2xl"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'slideUp .25s ease-out' }}
      >
        <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-[#E2E8F0] rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 pt-3 pb-5 flex items-center gap-4 border-b border-[#F1F5F9]">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl flex-shrink-0 ${avatarColor(customer.email)}`}>
            {getInitial(customer.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#0F172A] font-black text-base truncate">{customer.name}</p>
            <p className="text-[#94A3B8] text-xs mt-0.5 truncate">{customer.email}</p>
            {customer.phone && (
              <p className="text-[#94A3B8] text-xs mt-0.5">{customer.phone}</p>
            )}
          </div>
          <button onClick={onClose} className="text-[#94A3B8] text-xl font-bold p-2">✕</button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 px-6 py-5">
          <div className="bg-[#EEF4FF] rounded-2xl p-4 text-center">
            <p className="font-black text-xl text-[#185FA5]">{customer.totalBookings}</p>
            <p className="text-[#94A3B8] text-[10px] font-bold uppercase mt-1">Bookings</p>
          </div>
          <div className="bg-green-50 rounded-2xl p-4 text-center">
            <p className="font-black text-base text-green-600">{formatNaira(customer.totalSpent)}</p>
            <p className="text-[#94A3B8] text-[10px] font-bold uppercase mt-1">Total Spent</p>
          </div>
          <div className="bg-[#F8FAFC] rounded-2xl p-4 text-center">
            <p className="font-black text-xs text-[#0F172A]">{formatDate(customer.lastBookingDate)}</p>
            <p className="text-[#94A3B8] text-[10px] font-bold uppercase mt-1">Last Visit</p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-8 flex gap-3">
          {customer.email && (
            <a href={`mailto:${customer.email}`}
              className="flex-1 py-3 bg-[#EEF4FF] text-[#185FA5] rounded-xl font-bold text-sm text-center">
              ✉️ Email
            </a>
          )}
          {customer.phone && (
            <a href={`tel:${customer.phone}`}
              className="flex-1 py-3 bg-green-50 text-green-700 rounded-xl font-bold text-sm text-center">
              📞 Call
            </a>
          )}
          {customer.phone && (
            <a href={`https://wa.me/${customer.phone.replace(/\D/g,'')}`}
              target="_blank" rel="noreferrer"
              className="flex-1 py-3 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-sm text-center">
              💬 WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Customers = () => {
  const { token } = useStore();
  const [customers, setCustomers]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState(null);
  const [sortBy, setSortBy]         = useState('lastBookingDate'); // lastBookingDate | totalSpent | totalBookings

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      try {
        const data = await fetchCustomers(token);
        setCustomers(data);
      } catch (err) {
        setError(err.message || 'Failed to load customers.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  // ── Derived data ─────────────────────────────────────────────────────────
  const totalSpentAll = customers.reduce((s, c) => s + (c.totalSpent || 0), 0);
  const topSpender    = customers.reduce((top, c) => (!top || c.totalSpent > top.totalSpent ? c : top), null);

  const filtered = customers
    .filter(c =>
      !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
    )
    .sort((a, b) => {
      if (sortBy === 'totalSpent')    return (b.totalSpent    || 0) - (a.totalSpent    || 0);
      if (sortBy === 'totalBookings') return (b.totalBookings || 0) - (a.totalBookings || 0);
      return (b.lastBookingDate || '') > (a.lastBookingDate || '') ? 1 : -1;
    });

  return (
    <div className="bg-[#F5F7FA] min-h-screen pb-32">

      {/* Header */}
      <div className="p-6 bg-white border-b border-[#E2E8F0] shadow-sm">
        <h1 className="text-xl font-black text-[#0F172A]">Customers</h1>
        <p className="text-[#94A3B8] text-xs font-medium mt-0.5">
          Everyone who has booked with you
        </p>
      </div>

      {/* Stats */}
      <div className="p-6 grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm text-center">
          <p className="font-black text-2xl text-[#185FA5]">{customers.length}</p>
          <p className="text-[#94A3B8] text-[11px] font-semibold uppercase mt-1">Total</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm text-center">
          <p className="font-black text-lg text-green-600">{formatNaira(totalSpentAll)}</p>
          <p className="text-[#94A3B8] text-[11px] font-semibold uppercase mt-1">Revenue</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm text-center">
          <p className="font-black text-sm text-amber-500 truncate">{topSpender?.name?.split(' ')[0] || '—'}</p>
          <p className="text-[#94A3B8] text-[11px] font-semibold uppercase mt-1">Top Client</p>
        </div>
      </div>

      {/* Search + Sort */}
      <div className="px-6 mb-4 flex gap-2">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email or phone…"
          className="flex-1 border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#185FA5] bg-white"
        />
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-xs font-bold text-[#64748B] outline-none bg-white"
        >
          <option value="lastBookingDate">Recent</option>
          <option value="totalSpent">Top Spenders</option>
          <option value="totalBookings">Most Bookings</option>
        </select>
      </div>

      {/* List */}
      <div className="px-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <FSpinner size="md" message="Loading customers" />
          </div>
        ) : error ? (
          <FAlert type="error" message={error} onDismiss={() => setError('')} />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#EEF4FF] flex items-center justify-center text-2xl">👥</div>
            <p className="text-[#94A3B8] text-sm font-medium">
              {search ? 'No customers match your search.' : 'No customers yet.'}
            </p>
            <p className="text-[#CBD5E1] text-xs">
              {search ? 'Try a different name or email.' : 'Customers appear here once someone books a service.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((c) => (
              <button
                key={c.email}
                onClick={() => setSelected(c)}
                className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex items-center gap-3 shadow-sm text-left w-full active:scale-[0.99] transition-transform"
              >
                {/* Avatar */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-black text-sm ${avatarColor(c.email)}`}>
                  {getInitial(c.name)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[#0F172A] font-bold text-sm truncate">{c.name}</p>
                  <p className="text-[#94A3B8] text-xs font-medium mt-0.5 truncate">
                    {c.email}{c.phone ? ` · ${c.phone}` : ''}
                  </p>
                  <p className="text-[#CBD5E1] text-[11px] font-medium mt-0.5">
                    Last visit: {formatDate(c.lastBookingDate)}
                  </p>
                </div>

                {/* Right side */}
                <div className="text-right flex-shrink-0">
                  <p className="text-[#185FA5] font-black text-sm">{formatNaira(c.totalSpent)}</p>
                  <p className="text-[#94A3B8] text-[10px] font-bold uppercase tracking-wide mt-0.5">
                    {c.totalBookings} {c.totalBookings === 1 ? 'booking' : 'bookings'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <CustomerDrawer customer={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default Customers;
