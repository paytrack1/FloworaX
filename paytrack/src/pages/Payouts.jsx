import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Wallet, CheckCircle2, Loader2 } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.floworax.com.ng';

const PayoutsPage = () => {
  const { token } = useStore();
  const [banks, setBanks] = useState([]);
  const [status, setStatus] = useState(null);
  const [bankCode, setBankCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [resolvedName, setResolvedName] = useState('');
  const [resolving, setResolving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [banksRes, statusRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/payouts/banks`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${BACKEND_URL}/api/payouts/status`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const banksData = await banksRes.json();
        const statusData = await statusRes.json();
        if (banksData.success) setBanks(banksData.banks || []);
        if (statusData.success) setStatus(statusData.payout);
      } catch (err) {
        console.error('Failed to load payout info:', err);
      } finally {
        setLoading(false);
      }
    };
    if (token) load();
  }, [token]);

  useEffect(() => {
    setResolvedName('');
    setError('');
    const resolve = async () => {
      if (!bankCode || accountNumber.length !== 10) return;
      setResolving(true);
      try {
        const res = await fetch(`${BACKEND_URL}/api/payouts/resolve-account`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ accountNumber, bankCode }),
        });
        const data = await res.json();
        if (data.success) setResolvedName(data.accountName);
        else setError(data.error || 'Could not verify this account number');
      } catch {
        setError('Could not verify this account number');
      } finally {
        setResolving(false);
      }
    };
    resolve();
  }, [bankCode, accountNumber, token]);

  const save = async () => {
    if (!resolvedName) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/payouts/subaccount`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ accountNumber, bankCode, bankName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to set up payouts');
      setStatus({ bankName, accountNumber, accountName: resolvedName, subaccountCode: data.subaccountCode, active: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-slate-400 text-sm p-6">Loading...</p>;

  return (
    <div className="max-w-xl mx-auto p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-black text-[#0F172A]">Payouts</h1>
        <p className="text-sm text-slate-500 mt-1">Link your bank account to get paid directly for paid bookings, invoices, and sales.</p>
      </div>

      {status?.active ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center gap-2 text-green-600 font-bold text-sm mb-3">
            <CheckCircle2 size={18} /> Payouts active
          </div>
          <p className="text-sm text-[#0F172A] font-bold">{status.accountName}</p>
          <p className="text-sm text-slate-500">{status.bankName} &bull; {status.accountNumber}</p>
          <p className="text-xs text-slate-400 mt-3">Payments from customers now settle directly to this account.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Bank</label>
            <select
              value={bankCode}
              onChange={(e) => {
                const b = banks.find((x) => x.code === e.target.value);
                setBankCode(e.target.value);
                setBankName(b ? b.name : '');
              }}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
            >
              <option value="">Select your bank</option>
              {banks.map((b) => (
                <option key={b.code} value={b.code}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Account number</label>
            <input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit account number"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
            />
          </div>

          {resolving && <p className="text-sm text-slate-400 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Verifying account...</p>}
          {resolvedName && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <p className="text-xs text-green-700 font-bold uppercase tracking-widest">Account verified</p>
              <p className="text-sm font-black text-[#0F172A] mt-1">{resolvedName}</p>
            </div>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={save}
            disabled={!resolvedName || saving}
            className="w-full flex items-center justify-center gap-2 bg-[#185FA5] text-white font-bold py-3 rounded-xl disabled:opacity-50"
          >
            <Wallet size={16} /> {saving ? 'Saving...' : 'Save payout account'}
          </button>
        </div>
      )}
    </div>
  );
};

export default PayoutsPage;
