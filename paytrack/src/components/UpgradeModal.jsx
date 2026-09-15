import React, { useState } from 'react';
import { X, Zap, Check } from 'lucide-react';
import { useStore } from '../store/useStore';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://floworax.vercel.app';

const ALL_MODULES = [
  { id: 'sales', label: 'Sales', desc: 'Unlimited sales recording' },
  { id: 'bookings', label: 'Bookings', desc: 'Unlimited client bookings' },
  { id: 'invoices', label: 'Invoices', desc: 'Unlimited invoices + no watermark' },
  { id: 'events', label: 'Events', desc: 'Unlimited events & tickets' },
  { id: 'customers', label: 'Customers', desc: 'Unlimited customer records' },
  { id: 'expenses', label: 'Expenses', desc: 'Full expense tracking' },
  { id: 'automations', label: 'Automations', desc: 'Automated messages & reminders' },
  { id: 'communications', label: 'Communications', desc: 'Bulk messaging campaigns' },
];

const UpgradeModal = ({ module, onClose, limitMessage }) => {
  const { token } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedModules, setSelectedModules] = useState(module ? [module] : []);

  const toggleModule = (id) => {
    setSelectedModules(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleUpgrade = async () => {
    if (selectedModules.length === 0) {
      setError('Please select at least one module to unlock.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/subscription/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ modules: selectedModules }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize payment');
      window.location.href = data.authorization_url;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-[#0F172A]">Upgrade FloworaX</h2>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">₦7,000/month — pick the modules you need</p>
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

          {/* Module picker */}
          <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Select modules to unlock</p>
          <div className="flex flex-col gap-2 mb-5">
            {ALL_MODULES.map((mod) => {
              const selected = selectedModules.includes(mod.id);
              return (
                <button
                  key={mod.id}
                  onClick={() => toggleModule(mod.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    selected
                      ? 'border-[#185FA5] bg-[#EEF4FF]'
                      : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    selected ? 'bg-[#185FA5]' : 'bg-slate-100'
                  }`}>
                    {selected && <Check size={14} className="text-white" strokeWidth={3} />}
                  </div>
                  <div>
                    <p className={`text-sm font-black ${selected ? 'text-[#185FA5]' : 'text-[#0F172A]'}`}>{mod.label}</p>
                    <p className="text-xs text-slate-400">{mod.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Price summary */}
          <div className="bg-[#F8FAFC] rounded-2xl p-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-600">
                {selectedModules.length} module{selectedModules.length !== 1 ? 's' : ''} selected
              </span>
              <span className="text-xl font-black text-[#185FA5]">₦7,000<span className="text-sm font-semibold text-slate-400">/month</span></span>
            </div>
            <p className="text-xs text-slate-400 mt-1">One price regardless of how many modules you pick.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={handleUpgrade}
            disabled={loading || selectedModules.length === 0}
            className="w-full py-4 bg-[#185FA5] text-white font-black rounded-2xl hover:bg-[#1a4f8a] transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-base"
          >
            {loading ? 'Redirecting to payment...' : (
              <><Zap size={18} /> Unlock {selectedModules.length} Module{selectedModules.length !== 1 ? 's' : ''} — ₦7,000/month</>
            )}
          </button>
          <p className="text-xs text-center text-slate-400 mt-3">Secured by Paystack · Card or Bank Transfer</p>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
