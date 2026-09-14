import React, { useState } from 'react';
import { X, Zap, Lock } from 'lucide-react';
import { useStore } from '../store/useStore';

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

const MODULE_DESCRIPTIONS = {
  sales: 'Record unlimited sales and track your revenue without restrictions.',
  bookings: 'Accept unlimited bookings from your clients online.',
  invoices: 'Create unlimited professional invoices for your clients.',
  events: 'Create unlimited events and sell tickets to your audience.',
  services: 'Add unlimited services to your booking catalogue.',
  customers: 'Store and manage unlimited customer records.',
  automations: 'Set up automated messages and reminders for your customers.',
  communications: 'Send bulk SMS, WhatsApp, and email campaigns.',
};

const UpgradeModal = ({ module, onClose, limitMessage }) => {
  const { token } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpgrade = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/subscription/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ module }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize payment');
      // Redirect to Paystack checkout
      window.location.href = data.authorization_url;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#EEF4FF] rounded-2xl flex items-center justify-center">
              <Lock size={22} className="text-[#185FA5]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#0F172A]">Upgrade {MODULE_LABELS[module] || module}</h2>
              <p className="text-xs text-slate-400 font-semibold">₦7,000/month</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* Limit message */}
        {limitMessage && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4">
            <p className="text-sm text-amber-700 font-semibold">{limitMessage}</p>
          </div>
        )}

        {/* Module description */}
        <p className="text-sm text-slate-600 mb-5">
          {MODULE_DESCRIPTIONS[module] || `Unlock unlimited access to ${MODULE_LABELS[module] || module}.`}
        </p>

        {/* What you get */}
        <div className="bg-[#F8FAFC] rounded-2xl p-4 mb-5">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">What you get</p>
          <div className="flex flex-col gap-2">
            {[
              `Unlimited ${MODULE_LABELS[module] || module}`,
              'No monthly caps or restrictions',
              'Cancel anytime',
              'Pay only for what you use',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 text-xs font-black">✓</span>
                </div>
                <p className="text-sm font-semibold text-[#0F172A]">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full py-4 bg-[#185FA5] text-white font-black rounded-2xl hover:bg-[#1a4f8a] transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-base"
        >
          {loading ? (
            'Redirecting to payment...'
          ) : (
            <>
              <Zap size={18} />
              Unlock {MODULE_LABELS[module] || module} — ₦7,000/month
            </>
          )}
        </button>

        <p className="text-xs text-center text-slate-400 mt-3">
          Secured by Paystack · Card or Bank Transfer
        </p>
      </div>
    </div>
  );
};

export default UpgradeModal;
