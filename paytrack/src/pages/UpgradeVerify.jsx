import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import FSpinner from '../components/FSpinner';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://floworax.vercel.app';

const MODULE_LABELS = {
  sales: 'Sales', bookings: 'Bookings', invoices: 'Invoices',
  events: 'Events', services: 'Services', customers: 'Customers',
  expenses: 'Expenses', automations: 'Automations', communications: 'Communications',
};

const UpgradeVerify = () => {
  const navigate = useNavigate();
  const { token, fetchUser } = useStore();
  const [status, setStatus] = useState('verifying');
  const [unlockedModules, setUnlockedModules] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const verify = async () => {
      const params = new URLSearchParams(window.location.search);
      const reference = params.get('reference') || params.get('trxref');
      const modulesParam = params.get('modules') || params.get('module');
      const modules = modulesParam ? modulesParam.split(',') : [];

      if (!reference || modules.length === 0) {
        setError('Missing payment reference or modules.');
        setStatus('error');
        return;
      }

      try {
        const res = await fetch(`${BACKEND_URL}/api/subscription/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ reference, modules }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Verification failed');

        setUnlockedModules(data.unlockedModules || modules);
        setStatus('success');
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
        <h1 className="text-2xl font-black text-[#0F172A] mb-2">Modules Unlocked!</h1>
        <p className="text-slate-500 mb-4">You now have unlimited access to:</p>
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {unlockedModules.map(m => (
            <span key={m} className="bg-[#EEF4FF] text-[#185FA5] font-bold text-sm px-3 py-1 rounded-full">
              {MODULE_LABELS[m] || m}
            </span>
          ))}
        </div>
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
