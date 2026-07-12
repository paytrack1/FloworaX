import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { fetchCustomers } from '../api/customers';

const Customers = () => {
  const { token } = useStore();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const getInitial = (name) => name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="bg-[#F5F7FA] min-h-screen pb-32">
      <div className="p-6 bg-white border-b border-[#E2E8F0] shadow-sm">
        <h1 className="text-xl font-black text-[#0F172A]">Clients</h1>
        <p className="text-[#94A3B8] text-xs font-medium mt-0.5">Everyone who has booked with you</p>
      </div>

      <div className="px-6 mt-6">
        {loading ? (
          <p className="text-[#94A3B8] text-sm text-center py-16">Loading clients&hellip;</p>
        ) : error ? (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#EEF4FF] flex items-center justify-center text-2xl">👥</div>
            <p className="text-[#94A3B8] text-sm font-medium">No clients yet.</p>
            <p className="text-[#CBD5E1] text-xs">Clients appear here once someone books a service.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {customers.map((c) => (
              <div key={c.email} className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex items-center gap-3 shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-[#185FA5] flex items-center justify-center flex-shrink-0 text-white font-black text-sm">
                  {getInitial(c.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#0F172A] font-bold text-sm truncate">{c.name}</p>
                  <p className="text-[#94A3B8] text-xs font-medium mt-0.5 truncate">
                    {c.email}{c.phone ? ` · ${c.phone}` : ''}
                  </p>
                  <p className="text-[#CBD5E1] text-[11px] font-medium mt-0.5">
                    Last booking: {c.lastBookingDate}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[#0F172A] font-black text-sm">{c.totalBookings}</p>
                  <p className="text-[#94A3B8] text-[10px] font-bold uppercase tracking-wide">
                    {c.totalBookings === 1 ? 'booking' : 'bookings'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Customers;
