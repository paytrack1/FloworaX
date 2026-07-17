import React, { useState, useEffect } from "react";
import { useStore } from "../store/useStore";
import { Package, Car, Store, Users, Zap, Megaphone, Wrench, DollarSign, Plus, Trash2, TrendingDown } from "lucide-react";

const CATEGORIES = [
  { label: "Stock / Inventory", icon: Package },
  { label: "Transport",         icon: Car },
  { label: "Rent",              icon: Store },
  { label: "Salary / Staff",    icon: Users },
  { label: "Utilities",         icon: Zap },
  { label: "Marketing",         icon: Megaphone },
  { label: "Equipment",         icon: Wrench },
  { label: "Other",             icon: DollarSign },
];

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

const Expenses = () => {
  const { token } = useStore();
  const [expenses, setExpenses]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [form, setForm]           = useState({ description: "", amount: "", category: "Other" });

  const authHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  useEffect(() => { fetchExpenses(); }, []);

  const fetchExpenses = async () => {
    try {
      const res  = await fetch(`${BACKEND_URL}/api/expenses`, { headers: authHeaders });
      const data = await res.json();
      if (data.success) setExpenses(data.expenses);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!form.description.trim() || !form.amount) { setError("Description and amount are required"); return; }
    setSaving(true);
    try {
      const res  = await fetch(`${BACKEND_URL}/api/expenses`, {
        method: "POST", headers: authHeaders,
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      const data = await res.json();
      if (data.success) {
        setExpenses([data.expense, ...expenses]);
        setShowForm(false);
        setForm({ description: "", amount: "", category: "Other" });
        setError("");
      } else { setError(data.error || "Failed to add expense"); }
    } catch { setError("Failed to add expense"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this expense?")) return;
    try {
      await fetch(`${BACKEND_URL}/api/expenses/${id}`, { method: "DELETE", headers: authHeaders });
      setExpenses(expenses.filter(e => e.id !== id && e._id !== id));
    } catch { console.error("Delete failed"); }
  };

  const getCategoryIcon = (cat) => {
    const found = CATEGORIES.find(c => c.label === cat);
    const Icon = found ? found.icon : DollarSign;
    return <Icon size={14} strokeWidth={2} />;
  };

  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div className="bg-[#F5F7FA] min-h-screen pb-32">
      <div className="p-6 bg-white border-b border-[#E2E8F0] shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-[#0F172A]">Expenses</h1>
          <p className="text-[#94A3B8] text-xs font-medium mt-0.5">{expenses.length} total expenses</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-[#185FA5] text-white px-4 py-2 rounded-xl font-bold text-sm active:scale-95 transition-all">
          + Expense
        </button>
      </div>

      <div className="p-6">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm mb-4">
          <p className="text-[#94A3B8] text-[10px] font-semibold uppercase mb-1">Total Expenses</p>
          <div className="flex items-center gap-2">
            <TrendingDown size={20} className="text-red-500" />
            <p className="font-black text-3xl text-red-500">N{totalExpenses.toLocaleString()}</p>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm mb-4">
            <p className="text-[#0F172A] font-bold text-sm mb-4">New Expense</p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[#0F172A] text-xs font-bold uppercase tracking-wide mb-1.5 block">Description *</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. Office rent payment"
                  className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#185FA5]" />
              </div>
              <div>
                <label className="text-[#0F172A] text-xs font-bold uppercase tracking-wide mb-1.5 block">Amount (N) *</label>
                <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00"
                  className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#185FA5]" />
              </div>
              <div>
                <label className="text-[#0F172A] text-xs font-bold uppercase tracking-wide mb-1.5 block">Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#185FA5]">
                  {CATEGORIES.map(c => <option key={c.label} value={c.label}>{c.label}</option>)}
                </select>
              </div>
              {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl"><p className="text-red-600 text-sm">{error}</p></div>}
              <div className="flex gap-3">
                <button onClick={() => { setShowForm(false); setError(""); }} className="flex-1 py-3 border border-[#E2E8F0] rounded-xl font-bold text-[#64748B] text-sm">Cancel</button>
                <button onClick={handleCreate} disabled={saving} className="flex-1 py-3 bg-[#185FA5] text-white rounded-xl font-bold text-sm disabled:opacity-60">
                  {saving ? "Saving..." : "Add Expense"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {loading ? (
            <div className="text-center py-16 text-[#94A3B8] text-sm">Loading expenses...</div>
          ) : expenses.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#FEF2F2] flex items-center justify-center">
                <TrendingDown size={28} className="text-red-400" />
              </div>
              <p className="text-[#94A3B8] text-sm font-medium">No expenses yet</p>
              <p className="text-[#CBD5E1] text-xs">Tap "+ Expense" to log your first expense</p>
            </div>
          ) : expenses.map(expense => (
            <div key={expense._id || expense.id} className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                    {getCategoryIcon(expense.category)}
                  </div>
                  <div>
                    <p className="text-[#0F172A] font-bold text-sm">{expense.description}</p>
                    <p className="text-[#94A3B8] text-xs mt-0.5">{expense.category} · {new Date(expense.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-red-500 font-black text-sm">N{expense.amount?.toLocaleString()}</p>
                  <button onClick={() => handleDelete(expense.id || expense._id)} className="text-[#94A3B8] hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Expenses;
