import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { fetchFinancialSummary } from '../api/financial';
import { fetchExpenses, createExpense, deleteExpense } from '../api/expenses';

const CATEGORIES = [
  { label: 'Stock / Inventory', emoji: '📦' },
  { label: 'Transport', emoji: '🚗' },
  { label: 'Rent', emoji: '🏪' },
  { label: 'Salary / Staff', emoji: '👥' },
  { label: 'Utilities', emoji: '💡' },
  { label: 'Marketing', emoji: '📣' },
  { label: 'Equipment', emoji: '🔧' },
  { label: 'Other', emoji: '💸' },
];

const Expenses = () => {
  const { token } = useStore();
  const [expenses, setExpenses]       = useState([]);
  const [summary, setSummary]         = useState({ totalExpenses: 0 });
  const [showForm, setShowForm]       = useState(false);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');
  const [form, setForm]               = useState({
    description: '',
    amount:      '',
    category:    'Stock / Inventory',
    date:        new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    const loadExpenses = async () => {
      if (!token) return;
      try {
        const expensesData = await fetchExpenses(token);
        setExpenses(expensesData);
      } catch (err) {
        console.error('Failed to load expenses:', err);
      }
    };
    loadExpenses();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const loadSummary = async () => {
      try {
        const summaryData = await fetchFinancialSummary(token);
        setSummary(summaryData);
      } catch (err) {
        console.error('Failed to load financial summary:', err);
      }
    };
    loadSummary();
  }, [token]);

  const totalExpenses = summary.totalExpenses;

  const todayExpenses = expenses
    .filter((e) => new Date(e.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, e) => sum + e.amount, 0);

  const handleChange = (e) => {
    setError('');
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!form.amount || Number(form.amount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    setSaving(true);
    try {
      const expense = {
        description: form.description.trim() || form.category,
        amount:      parseFloat(form.amount),
        category:    form.category,
      };
      await createExpense(token, expense);
      const expensesData = await fetchExpenses(token);
      setExpenses(expensesData);
      const summaryData = await fetchFinancialSummary(token);
      setSummary(summaryData);
      setForm({
        description: '',
        amount:      '',
        category:    'Stock / Inventory',
        date:        new Date().toISOString().slice(0, 10),
      });
      setShowForm(false);
    } catch (err) {
      setError('Failed to save expense. Try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteExpense(token, id);
      const expensesData = await fetchExpenses(token);
      setExpenses(expensesData);
      const summaryData = await fetchFinancialSummary(token);
      setSummary(summaryData);
    } catch (err) {
      console.error('Failed to delete expense:', err);
    }
  };

  const getCategoryEmoji = (cat) => {
    const found = CATEGORIES.find((c) => c.label === cat);
    return found ? found.emoji : '💸';
  };

  return (
    <div className="bg-[#F5F7FA] min-h-screen pb-32">
      {/* Header */}
      <div className="p-6 bg-white border-b border-[#E2E8F0] shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-[#0F172A]">Expenses</h1>
          <p className="text-[#94A3B8] text-xs font-medium mt-0.5">Track what you spend</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#185FA5] text-white px-4 py-2 rounded-xl font-bold text-sm active:scale-95 transition-all"
        >
          + Add
        </button>
      </div>

      {/* Summary Cards */}
      <div className="p-6 grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm">
          <p className="text-[#94A3B8] text-[11px] font-semibold uppercase tracking-wide mb-1">Today</p>
          <p className="font-black text-lg text-red-500">₦{todayExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm">
          <p className="text-[#94A3B8] text-[11px] font-semibold uppercase tracking-wide mb-1">All Time</p>
          <p className="font-black text-lg text-[#0F172A]">₦{totalExpenses.toLocaleString()}</p>
        </div>
      </div>

      {/* Add Expense Form */}
      {showForm && (
        <div className="mx-6 mb-4 bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
          <p className="text-[#0F172A] font-bold text-sm mb-4">New Expense</p>

          {/* Category */}
          <div className="mb-3">
            <label className="text-[#0F172A] text-xs font-bold uppercase tracking-wide mb-1.5 block">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#185FA5]"
            >
              {CATEGORIES.map((c) => (
                <option key={c.label} value={c.label}>{c.emoji} {c.label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="mb-3">
            <label className="text-[#0F172A] text-xs font-bold uppercase tracking-wide mb-1.5 block">Description (optional)</label>
            <input
              name="description"
              type="text"
              value={form.description}
              onChange={handleChange}
              placeholder="e.g. Bought 10 bags of rice"
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#185FA5]"
            />
          </div>

          {/* Amount */}
          <div className="mb-3">
            <label className="text-[#0F172A] text-xs font-bold uppercase tracking-wide mb-1.5 block">Amount (₦)</label>
            <input
              name="amount"
              type="number"
              value={form.amount}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#0F172A] outline-none focus:border-[#185FA5] font-bold text-lg"
            />
          </div>

          {/* Date */}
          <div className="mb-4">
            <label className="text-[#0F172A] text-xs font-bold uppercase tracking-wide mb-1.5 block">Date</label>
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#185FA5]"
            />
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl mb-3">
              <p className="text-red-600 text-sm font-medium">⚠️ {error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setShowForm(false); setError(''); }}
              className="flex-1 py-3 border border-[#E2E8F0] rounded-xl font-bold text-[#64748B] text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 bg-[#185FA5] text-white rounded-xl font-bold text-sm disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save Expense'}
            </button>
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div className="px-6">
        <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest mb-3">All Expenses</p>

        {expenses.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center text-2xl">💸</div>
            <p className="text-[#94A3B8] text-sm font-medium">No expenses recorded yet.</p>
            <p className="text-[#CBD5E1] text-xs">Tap "+ Add" to log an expense</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {expenses.map((expense) => (
              <div key={expense.id} className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex items-center gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0 text-lg">
                  {getCategoryEmoji(expense.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#0F172A] font-bold text-sm truncate">{expense.description}</p>
                  <p className="text-[#94A3B8] text-xs font-medium mt-0.5">
                    {expense.category} · {new Date(expense.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                  <p className="text-red-500 font-black text-sm">-₦{expense.amount.toLocaleString()}</p>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="text-[#CBD5E1] text-xs hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Expenses;