import React, { useEffect, useMemo, useState } from 'react';
import { Banknote, TrendingDown, Users, Check, Delete, X, ChevronDown, ChevronUp, Volume2, VolumeX } from 'lucide-react';
import { useStore } from '../store/useStore';
import { SIMPLE_MODE_EVENT, readSimpleMode } from '../store/simpleMode';

const fmt = (n) => `₦${Number(n || 0).toLocaleString()}`;
const KEYPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'del'];

const isToday = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
};

/* Speak an amount aloud — the "voice" layer for users who can't read numbers
   comfortably. English numbers are recognised by TTS regardless of accent. */
const speak = (text, enabled) => {
  if (!enabled) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-NG';
    if (!window.speechSynthesis.getVoices().some((v) => v.lang === u.lang)) u.lang = 'en-GB';
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  } catch { /* speech unavailable — silently skip */ }
};

/* ---------------- Keypad ---------------- */
const Keypad = ({ onKey, disabled }) => (
  <div className="grid grid-cols-3 gap-3">
    {KEYPAD_KEYS.map((k) => (
      <button
        key={k}
        type="button"
        disabled={disabled}
        onClick={() => onKey(k)}
        className="h-16 rounded-2xl bg-surface-sunken active:bg-brand-50 active:scale-95 disabled:opacity-40 transition-all flex items-center justify-center"
        aria-label={k === 'del' ? 'Delete last digit' : k === '000' ? 'Three zeros' : k}
      >
        {k === 'del'
          ? <Delete size={28} className="text-ink-secondary" strokeWidth={2.2} />
          : <span className="text-3xl font-black text-ink">{k}</span>}
      </button>
    ))}
  </div>
);

const AmountDisplay = ({ value, accent = false }) => (
  <div className={`rounded-2xl border-2 px-4 py-4 text-center ${value ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-surface-sunken'}`}>
    <p className="text-micro font-bold uppercase tracking-widest text-ink-muted mb-1">Amount</p>
    <p className={`text-5xl font-black tabular-nums ${value ? 'text-brand-600' : 'text-ink-faint'}`}>
      {value ? fmt(value) : '₦0'}
    </p>
  </div>
);

/* ---------------- Sale sheet ---------------- */
const SaleSheet = ({ onClose, speakOn }) => {
  const { addSale, user } = useStore();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [reference, setReference] = useState('');
  const [showName, setShowName] = useState(false);
  const [itemName, setItemName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const METHODS = [
    { id: 'cash', label: 'Cash', icon: Banknote },
    { id: 'transfer', label: 'Transfer', icon: Volume2 },
    { id: 'pos', label: 'POS', icon: Check },
  ];
  const needsRef = method !== 'cash';
  const canSubmit = Number(amount) > 0 && (!needsRef || reference.trim().length > 2);

  const handleKey = (k) => {
    setError('');
    if (k === 'del') return setAmount((a) => a.slice(0, -1));
    if (k === '000') return setAmount((a) => (a + '000').slice(0, 11));
    setAmount((a) => (a + k).replace(/^0+(?=\d)/, '').slice(0, 11));
  };

  const submit = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    setError('');
    try {
      const total = Number(amount);
      await addSale({
        itemName: itemName.trim() || 'General Sale',
        total,
        paymentMethod: method,
        reference: needsRef ? reference.trim() : null,
        status: 'completed',
        profit: total,
      });
      speak(`Money in! ${total} naira`, speakOn);
      onClose();
    } catch (err) {
      setError(err.message || 'Could not save. Check your network and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-ink/60 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <div className="w-full sm:max-w-md bg-surface rounded-t-3xl sm:rounded-3xl p-5 max-h-[94vh] overflow-y-auto animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-2xl bg-positive-soft flex items-center justify-center">
              <Banknote size={26} className="text-positive" strokeWidth={2.4} />
            </span>
            <div>
              <p className="text-title font-black text-ink">Money IN</p>
              <p className="text-caption text-ink-muted">{user?.businessName || 'Your store'}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-full hover:bg-surface-sunken text-ink-muted">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="space-y-4">
          <AmountDisplay value={amount} />
          <Keypad onKey={handleKey} disabled={saving} />

          {/* Product name — fully optional, collapsed by default */}
          <div>
            <button type="button" onClick={() => setShowName(!showName)}
              className="flex items-center gap-1.5 text-caption font-semibold text-ink-muted hover:text-ink-secondary">
              {showName ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              Name this sale (not needed)
            </button>
            {showName && (
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. 2 breads"
                className="mt-2 w-full h-11 rounded-field border border-slate-200 px-3.5 text-body outline-none focus:border-brand-400"
              />
            )}
          </div>

          {/* Payment method — big picture buttons */}
          <div className="grid grid-cols-3 gap-3">
            {METHODS.map((m) => (
              <button key={m.id} type="button" onClick={() => setMethod(m.id)}
                className={`h-20 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all ${
                  method === m.id ? 'border-brand-400 bg-brand-50 text-brand-600' : 'border-slate-200 bg-surface text-ink-muted'
                }`}>
                <Banknote size={24} strokeWidth={2.2} aria-hidden />
                <span className="text-caption font-black">{m.label}</span>
              </button>
            ))}
          </div>

          {needsRef && (
            <div>
              <p className="text-caption font-bold text-ink-secondary mb-1.5">Bank alert number (required)</p>
              <input
                type="text"
                inputMode="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Copy from your bank SMS"
                className="w-full h-12 rounded-field border-2 border-slate-200 px-3.5 text-body outline-none focus:border-brand-400"
              />
            </div>
          )}

          {error && <p className="text-body text-negative font-semibold text-center" role="alert">{error}</p>}

          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit || saving}
            className={`w-full h-16 rounded-2xl font-black text-white text-lg flex items-center justify-center gap-2 transition-all ${
              canSubmit && !saving ? 'bg-positive active:scale-[0.98] shadow-lg' : 'bg-slate-300'
            }`}
          >
            <Check size={26} strokeWidth={3} />
            {saving ? 'Saving…' : 'SAVE MONEY IN'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------------- Expense sheet ---------------- */
const ExpenseSheet = ({ onClose, speakOn }) => {
  const { token } = useStore();
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = Number(amount) > 0;

  const handleKey = (k) => {
    setError('');
    if (k === 'del') return setAmount((a) => a.slice(0, -1));
    if (k === '000') return setAmount((a) => (a + '000').slice(0, 11));
    setAmount((a) => (a + k).replace(/^0+(?=\d)/, '').slice(0, 11));
  };

  const submit = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ description: 'General expense', amount: Number(amount), category: 'Other' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not save expense');
      speak(`Money out, ${Number(amount)} naira`, speakOn);
      onClose();
    } catch (err) {
      setError(err.message || 'Could not save. Check your network and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-ink/60 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <div className="w-full sm:max-w-md bg-surface rounded-t-3xl sm:rounded-3xl p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-2xl bg-negative-soft flex items-center justify-center">
              <TrendingDown size={26} className="text-negative" strokeWidth={2.4} />
            </span>
            <p className="text-title font-black text-ink">Money OUT</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-full hover:bg-surface-sunken text-ink-muted">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="space-y-4">
          <AmountDisplay value={amount} />
          <Keypad onKey={handleKey} disabled={saving} />
          {error && <p className="text-body text-negative font-semibold text-center" role="alert">{error}</p>}
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit || saving}
            className={`w-full h-16 rounded-2xl font-black text-white text-lg flex items-center justify-center gap-2 transition-all ${
              canSubmit && !saving ? 'bg-negative active:scale-[0.98] shadow-lg' : 'bg-slate-300'
            }`}
          >
            <Check size={26} strokeWidth={3} />
            {saving ? 'Saving…' : 'SAVE MONEY OUT'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------------- Simple home ---------------- */
const SimpleModeHome = () => {
  const { user, sales, setActiveTab } = useStore();
  const [sheet, setSheet] = useState(null); // 'sale' | 'expense' | null
  const [speakOn, setSpeakOn] = useState(true);

  // Re-render if the toggle flips in Settings
  const [, force] = useState(0);
  useEffect(() => {
    const handler = () => force((n) => n + 1);
    window.addEventListener(SIMPLE_MODE_EVENT, handler);
    return () => window.removeEventListener(SIMPLE_MODE_EVENT, handler);
  }, []);
  if (!readSimpleMode()) return null;

  const today = useMemo(() => {
    const t = (sales || []).filter((s) => isToday(s.createdAt) && s.status !== 'draft');
    return {
      moneyIn: t.reduce((sum, s) => sum + (Number(s.total) || 0), 0),
      profit: t.reduce((sum, s) => sum + (Number(s.profit) || 0), 0),
      count: t.length,
    };
  }, [sales]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Today's numbers — numerals only, huge */}
      <div className="bg-brand-500 rounded-3xl p-6 text-white shadow-lg">
        <p className="text-micro font-bold uppercase tracking-widest text-white/70">Today</p>
        <p className="text-5xl font-black mt-1 tabular-nums">{fmt(today.moneyIn)}</p>
        <div className="flex items-center gap-4 mt-3 text-caption font-bold">
          <span className="bg-white/15 rounded-full px-3 py-1">Profit {fmt(today.profit)}</span>
          <span className="bg-white/15 rounded-full px-3 py-1">{today.count} sale{today.count === 1 ? '' : 's'}</span>
        </div>
      </div>

      {/* Three big tiles */}
      <div className="grid gap-4">
        <button
          onClick={() => setSheet('sale')}
          className="h-36 rounded-3xl bg-positive-soft border-2 border-positive/20 active:scale-[0.98] transition-all flex items-center gap-5 px-6 text-left"
        >
          <span className="w-20 h-20 rounded-2xl bg-positive flex items-center justify-center shadow-md">
            <Banknote size={40} className="text-white" strokeWidth={2.4} />
          </span>
          <span>
            <span className="block text-2xl font-black text-ink">Money came in</span>
            <span className="block text-body text-ink-secondary">You sold something? Press here</span>
          </span>
        </button>

        <button
          onClick={() => setSheet('expense')}
          className="h-36 rounded-3xl bg-negative-soft border-2 border-negative/20 active:scale-[0.98] transition-all flex items-center gap-5 px-6 text-left"
        >
          <span className="w-20 h-20 rounded-2xl bg-negative flex items-center justify-center shadow-md">
            <TrendingDown size={40} className="text-white" strokeWidth={2.4} />
          </span>
          <span>
            <span className="block text-2xl font-black text-ink">Money went out</span>
            <span className="block text-body text-ink-secondary">You spent money? Press here</span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className="h-36 rounded-3xl bg-brand-50 border-2 border-brand-300/40 active:scale-[0.98] transition-all flex items-center gap-5 px-6 text-left"
        >
          <span className="w-20 h-20 rounded-2xl bg-brand-500 flex items-center justify-center shadow-md">
            <Users size={40} className="text-white" strokeWidth={2.4} />
          </span>
          <span>
            <span className="block text-2xl font-black text-ink">My customers</span>
            <span className="block text-body text-ink-secondary">See and add your customers</span>
          </span>
        </button>
      </div>

      {/* Voice feedback toggle */}
      <button
        onClick={() => setSpeakOn(!speakOn)}
        className="mx-auto flex items-center gap-2 text-caption font-semibold text-ink-muted hover:text-ink-secondary transition-colors"
        aria-pressed={speakOn}
      >
        {speakOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
        {speakOn ? 'Voice is ON — it reads your money out loud' : 'Voice is OFF — press to turn on'}
      </button>

      <p className="text-center text-caption text-ink-muted">
        Everything saves to your account. Press the ☰ menu for more.
      </p>

      {sheet === 'sale' && <SaleSheet onClose={() => setSheet(null)} speakOn={speakOn} />}
      {sheet === 'expense' && <ExpenseSheet onClose={() => setSheet(null)} speakOn={speakOn} />}
    </div>
  );
};

export default SimpleModeHome;
