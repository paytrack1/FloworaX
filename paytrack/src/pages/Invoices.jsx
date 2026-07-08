import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { fetchInvoices, createInvoice, markInvoicePaid, deleteInvoice } from '../api/invoices';

const Invoices = () => {
  const { token } = useStore();
  const [invoices, setInvoices]     = useState([]);
  const [showForm, setShowForm]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [form, setForm]             = useState({
    clientName:  '',
    clientEmail: '',
    amount:      '',
    dueDate:     '',
    notes:       '',
  });

  useEffect(() => {
    const loadInvoices = async () => {
      if (!token) return;
      try {
        const invoicesData = await fetchInvoices(token);
        setInvoices(invoicesData);
      } catch (err) {
        console.error('Failed to load invoices:', err);
      }
    };
    loadInvoices();
  }, [token]);

  const totalOutstanding = invoices
    .filter((inv) => inv.status !== 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const totalPaid = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const handleChange = (e) => {
    setError('');
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!form.clientName.trim()) {
      setError('Please enter a client name.');
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    setSaving(true);
    try {
      const invoiceData = {
        clientName:  form.clientName.trim(),
        clientEmail: form.clientEmail.trim(),
        amount:      parseFloat(form.amount),
        dueDate:     form.dueDate || null,
        notes:       form.notes.trim(),
      };
      await createInvoice(token, invoiceData);
      const invoicesData = await fetchInvoices(token);
      setInvoices(invoicesData);
      setForm({ clientName: '', clientEmail: '', amount: '', dueDate: '', notes: '' });
      setShowForm(false);
    } catch (err) {
      setError('Failed to save invoice. Try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await markInvoicePaid(token, id);
      const invoicesData = await fetchInvoices(token);
      setInvoices(invoicesData);
    } catch (err) {
      console.error('Failed to mark invoice as paid:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteInvoice(token, id);
      const invoicesData = await fetchInvoices(token);
      setInvoices(invoicesData);
    } catch (err) {
      console.error('Failed to delete invoice:', err);
    }
  };

  const statusStyles = {
    draft:   { bg: 'bg-slate-100', text: 'text-slate-500', label: 'Draft' },
    sent:    { bg: 'bg-amber-50',  text: 'text-amber-600', label: 'Outstanding' },
    paid:    { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Paid' },
    overdue: { bg: 'bg-red-50',    text: 'text-red-600',   label: 'Overdue' },
  };

  return (
    <div className="bg-[#F5F7FA] min-h-screen pb-32">
      {/* Header */}
      <div className="p-6 bg-white border-b border-[#E2E8F0] shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-[#0F172A]">Invoices</h1>
          <p className="text-[#94A3B8] text-xs font-medium mt-0.5">Bill your clients</p>
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
          <p className="text-[#94A3B8] text-[11px] font-semibold uppercase tracking-wide mb-1">Outstanding</p>
          <p className="font-black text-lg text-amber-500">₦{totalOutstanding.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm">
          <p className="text-[#94A3B8] text-[11px] font-semibold uppercase tracking-wide mb-1">Paid</p>
          <p className="font-black text-lg text-[#0F172A]">₦{totalPaid.toLocaleString()}</p>
        </div>
      </div>

      {/* Add Invoice Form */}
      {showForm && (
        <div className="mx-6 mb-4 bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
          <p className="text-[#0F172A] font-bold text-sm mb-4">New Invoice</p>

          <div className="mb-3">
            <label className="text-[#0F172A] text-xs font-bold uppercase tracking-wide mb-1.5 block">Client Name</label>
            <input
              name="clientName"
              type="text"
              value={form.clientName}
              onChange={handleChange}
              placeholder="e.g. Ademola Store"
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#185FA5]"
            />
          </div>

          <div className="mb-3">
            <label className="text-[#0F172A] text-xs font-bold uppercase tracking-wide mb-1.5 block">Client Email (optional)</label>
            <input
              name="clientEmail"
              type="email"
              value={form.clientEmail}
              onChange={handleChange}
              placeholder="client@example.com"
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#185FA5]"
            />
          </div>

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

          <div className="mb-3">
            <label className="text-[#0F172A] text-xs font-bold uppercase tracking-wide mb-1.5 block">Due Date (optional)</label>
            <input
              name="dueDate"
              type="date"
              value={form.dueDate}
              onChange={handleChange}
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#185FA5]"
            />
          </div>

          <div className="mb-4">
            <label className="text-[#0F172A] text-xs font-bold uppercase tracking-wide mb-1.5 block">Notes (optional)</label>
            <input
              name="notes"
              type="text"
              value={form.notes}
              onChange={handleChange}
              placeholder="e.g. For 5 bags of cement"
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
              {saving ? 'Saving…' : 'Save Invoice'}
            </button>
          </div>
        </div>
      )}

      {/* Invoices List */}
      <div className="px-6">
        <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest mb-3">All Invoices</p>

        {invoices.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-2xl">🧾</div>
            <p className="text-[#94A3B8] text-sm font-medium">No invoices yet.</p>
            <p className="text-[#CBD5E1] text-xs">Tap "+ Add" to create one</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {invoices.map((invoice) => {
              const style = statusStyles[invoice.status] || statusStyles.draft;
              return (
                <div key={invoice._id} className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex items-center gap-3 shadow-sm">
                  <div className={`w-10 h-10 rounded-xl ${style.bg} flex items-center justify-center flex-shrink-0 text-lg`}>
                    🧾
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#0F172A] font-bold text-sm truncate">{invoice.clientName}</p>
                    <p className="text-[#94A3B8] text-xs font-medium mt-0.5">
                      {invoice.invoiceNumber} · {new Date(invoice.createdAt).toLocaleDateString()}
                    </p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                    <p className="text-[#0F172A] font-black text-sm">₦{invoice.amount.toLocaleString()}</p>
                    <div className="flex gap-2">
                      {invoice.status !== 'paid' && (
                        <button
                          onClick={() => handleMarkPaid(invoice._id)}
                          className="text-emerald-500 text-xs font-bold hover:text-emerald-600 transition-colors"
                        >
                          Mark Paid
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(invoice._id)}
                        className="text-[#CBD5E1] text-xs hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Invoices;
