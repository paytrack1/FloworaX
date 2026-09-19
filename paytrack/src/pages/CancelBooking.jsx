import React, { useEffect, useState } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const Shell = ({ children }) => (
  <div className="min-h-screen bg-[#F0F4FF] flex items-center justify-center px-5 py-12 font-sans">
    <div className="w-full max-w-md bg-white rounded-3xl border border-[#E2E8F0] shadow-xl p-6 sm:p-8">
      {children}
    </div>
  </div>
);

const CancelBooking = () => {
  const token = new URLSearchParams(window.location.search).get('token');
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [done, setDone] = useState(false);
  const [refundMessage, setRefundMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setError('Invalid cancellation link.'); setLoading(false); return; }
    fetch(`${BACKEND_URL}/api/bookings/cancel/${token}`)
      .then(r => r.json())
      .then(data => {
        if (!data.success) throw new Error(data.error);
        setDetails(data);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/bookings/cancel/${token}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRefundMessage(data.refundMessage || '');
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <Shell><p className="text-slate-400 text-center">Loading...</p></Shell>;
  if (error) return <Shell><div className="text-center"><p className="text-red-500 font-semibold">{error}</p></div></Shell>;

  if (done) return (
    <Shell>
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✗</span>
        </div>
        <h2 className="text-xl font-black text-[#0F172A] mb-2">Booking Cancelled</h2>
        <p className="text-slate-500 text-sm mb-4">Your booking has been cancelled and the business has been notified.</p>
        {refundMessage && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-left">
            <p className="text-sm text-amber-700 font-semibold">💰 {refundMessage}</p>
          </div>
        )}
      </div>
    </Shell>
  );

  const { booking, withinPolicy, cancelHoursAllowed, hoursUntilBooking, refundMessage: policyMsg } = details;

  return (
    <Shell>
      <div className="text-center mb-6">
        <h2 className="text-xl font-black text-[#0F172A]">Cancel Booking</h2>
        <p className="text-slate-400 text-sm mt-1">Are you sure you want to cancel?</p>
      </div>

      <div className="bg-[#F8FAFC] rounded-2xl p-4 mb-5">
        <p className="font-bold text-[#0F172A]">{booking.serviceName}</p>
        <p className="text-sm text-slate-500">{booking.scheduledDate} at {booking.scheduledTime}</p>
        <p className="text-sm text-slate-500">Hi {booking.clientName}</p>
        {booking.amount > 0 && (
          <p className="text-sm font-bold text-[#185FA5] mt-1">₦{Number(booking.amount).toLocaleString()} paid</p>
        )}
      </div>

      {booking.paymentStatus === 'paid' && policyMsg && (
        <div className={`rounded-xl p-4 mb-5 ${withinPolicy ? 'bg-green-50 border border-green-100' : 'bg-amber-50 border border-amber-100'}`}>
          <p className={`text-sm font-semibold ${withinPolicy ? 'text-green-700' : 'text-amber-700'}`}>{policyMsg}</p>
        </div>
      )}

      <button
        onClick={handleCancel}
        disabled={cancelling}
        className="w-full py-4 bg-red-500 text-white font-black rounded-2xl hover:bg-red-600 transition-all disabled:opacity-60 mb-3"
      >
        {cancelling ? 'Cancelling...' : 'Yes, Cancel My Booking'}
      </button>
      <button
        onClick={() => window.history.back()}
        className="w-full py-3 border-2 border-slate-200 text-slate-600 font-semibold rounded-2xl hover:bg-slate-50 transition-all"
      >
        Keep My Booking
      </button>
    </Shell>
  );
};

export default CancelBooking;
