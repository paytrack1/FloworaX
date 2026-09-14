import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import FSpinner from '../components/FSpinner';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://floworax.vercel.app';

const MODULE_LABELS = {
  sales: 'Sales',
  bookings: 'Bookings',
  invoices: 'Invoices',
  events: 'Events',
  services: 'Services',
  customers: 'Customers',
  automations: 'Automations',
  communications: 'Communications',
};

const UpgradeVerify = () => {
  const navigate = useNavigate();
  const { token, fetchUser } = useStore();
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [unlockedModule, setUnlockedModule] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const verify = async () => {
      const params = new URLSearchParams(window.location.search);
      const reference = params.get('reference') || params.get('trxref');
      const module = params.get('module');

      if (!reference || !module) {
        setError('Missing payment reference or module.');
        setStatus('error');
        return;
      }

      try {
        const res = await fetch(`${BACKEND_URL}/api/subscription/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reference, module }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Verification failed');

        setUnlockedModule(module);
        setStatus('success');

        // Refresh user data to get updated unlockedModules
        if (fetchUser) await fetchUser();
      } catch (err) {
        setError(err.message);
        setStatus('error');
      }
    };

    verify();
  }, []);

  if (status === 'verifying') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <FSpinner />
        <p className="text-slate-500 font-semibold">Verifying your payment...</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <span className="text-4xl">✅</span>
        </div>
        <h1 className="text-2xl font-black text-[#0F172A] mb-2">
          {MODULE_LABELS[unlockedModule] || unlockedModule} Unlocked!
        </h1>
        <p className="text-slate-500 mb-8">
          You now have unlimited access to {MODULE_LABELS[unlockedModule] || unlockedModule}.
        </p>
        <button
          onClick={() => navigate('/')}
          className="w-full max-w-sm py-4 bg-[#185FA5] text-white font-black rounded-2xl hover:bg-[#1a4f8a] transition-all"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <span className="text-4xl">❌</span>
      </div>
      <h1 className="text-2xl font-black text-[#0F172A] mb-2">Payment Failed</h1>
      <p className="text-slate-500 mb-8">{error || 'Something went wrong. Please try again.'}</p>
      <button
        onClick={() => navigate('/')}
        className="w-full max-w-sm py-4 bg-[#185FA5] text-white font-black rounded-2xl hover:bg-[#1a4f8a] transition-all"
      >
        Back to Dashboard
      </button>
    </div>
  );
};

export default UpgradeVerify;
