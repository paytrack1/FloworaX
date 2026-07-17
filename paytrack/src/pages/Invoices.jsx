import React, { useEffect, useState } from 'react';
import FAlert   from '../components/FAlert';
import FSpinner from '../components/FSpinner';
import { useStore } from '../store/useStore';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

// --- Helpers ---

const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

const formatNaira = (amount) =>
  `₦${Number(amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

const formatDate = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('en-NG', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : '—';

const generateInvoiceNumber = () =>
  `INV-${Date.now().toString().slice(-6)}`;

const EMPTY_ITEM = { description: '', quantity: 1, unitPrice: '' };

const EMPTY_FORM = {
  invoiceNumber: '',
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  clientAddress: '',
  issueDate: new Date().toISOString().split('T')[0],
  dueDate: '',
  items: [{ ...EMPTY_ITEM }],
  notes: '',
  status: 'draft',
};

// --- PDF Generator (pure-JS, no library needed) ---

const buildInvoiceHTML = (invoice, businessName = 'My Business') => {
  const subtotal = invoice.items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0
  );

  const itemRows = invoice.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:13px;color:#0F172A;">${item.description || '—'}</td>
        <td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:13px;color:#64748B;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:13px;color:#64748B;text-align:right;">₦${Number(item.unitPrice || 0).toLocaleString()}</td>
        <td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:13px;font-weight:700;color:#0F172A;text-align:right;">₦${(Number(item.quantity || 0) * Number(item.unitPrice || 0)).toLocaleString()}</td>
      </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; padding: 48px; color: #0F172A; }
    .accent { color: #185FA5; }
    .muted  { color: #94A3B8; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; }
  </style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;">
    <div>
      <div style="font-size:22px;font-weight:900;color:#185FA5;">${businessName}</div>
      <div style="font-size:12px;color:#94A3B8;margin-top:4px;">Professional Invoice</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:28px;font-weight:900;color:#0F172A;">INVOICE</div>
      <div style="font-size:13px;color:#185FA5;font-weight:700;margin-top:4px;">${invoice.invoiceNumber}</div>
    </div>
  </div>

  <div style="height:3px;background:linear-gradient(90deg,#185FA5,#E2E8F0);border-radius:2px;margin-bottom:32px;"></div>

  <div style="display:flex;justify-content:space-between;margin-bottom:36px;">
    <div>
      <div class="muted" style="margin-bottom:8px;">Bill To</div>
      <div style="font-weight:700;font-size:15px;">${invoice.clientName}</div>
      ${invoice.clientEmail ? `<div style="color:#64748B;font-size:13px;margin-top:2px;">${invoice.clientEmail}</div>` : ''}
      ${invoice.clientPhone ? `<div style="color:#64748B;font-size:13px;margin-top:2px;">${invoice.clientPhone}</div>` : ''}
      ${invoice.clientAddress ? `<div style="color:#64748B;font-size:13px;margin-top:2px;">${invoice.clientAddress}</div>` : ''}
    </div>
    <div style="text-align:right;">
      <div style="margin-bottom:8px;">
        <div class="muted">Issue Date</div>
        <div style="font-weight:700;font-size:13px;margin-top:2px;">${formatDate(invoice.issueDate)}</div>
      </div>
      ${invoice.dueDate ? `
      <div>
        <div class="muted">Due Date</div>
        <div style="font-weight:700;font-size:13px;color:#185FA5;margin-top:2px;">${formatDate(invoice.dueDate)}</div>
      </div>` : ''}
    </div>
  </div>

  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
    <thead>
      <tr style="border-bottom:2px solid #0F172A;">
        <th style="padding:0 0 10px;text-align:left;font-size:11px;color:#94A3B8;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">Description</th>
        <th style="padding:0 0 10px;text-align:center;font-size:11px;color:#94A3B8;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">Qty</th>
        <th style="padding:0 0 10px;text-align:right;font-size:11px;color:#94A3B8;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">Unit Price</th>
        <th style="padding:0 0 10px;text-align:right;font-size:11px;color:#94A3B8;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">Total</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div style="display:flex;justify-content:flex-end;margin-bottom:32px;">
    <div style="width:220px;">
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #E2E8F0;">
        <span style="font-size:13px;color:#64748B;">Subtotal</span>
        <span style="font-size:13px;font-weight:700;">₦${subtotal.toLocaleString()}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:12px 0;background:#EEF4FF;border-radius:8px;margin-top:4px;padding-left:12px;padding-right:12px;">
        <span style="font-size:14px;font-weight:900;color:#0F172A;">Total Due</span>
        <span style="font-size:14px;font-weight:900;color:#185FA5;">₦${subtotal.toLocaleString()}</span>
      </div>
    </div>
  </div>

  ${invoice.notes ? `
  <div style="background:#F8FAFC;border-left:3px solid #185FA5;border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:32px;">
    <div class="muted" style="margin-bottom:4px;">Notes</div>
    <div style="font-size:13px;color:#64748B;">${invoice.notes}</div>
  </div>` : ''}

  <div style="border-top:1px solid #E2E8F0;padding-top:16px;text-align:center;">
    <p style="font-size:11px;color:#CBD5E1;">Generated by Flowora &middot; Thank you for your business</p>
  </div>
</body>
</html>`;
};

// --- Status helpers ---

const STATUS_COLORS = {
  draft:   'bg-gray-50 text-gray-500',
  sent:    'bg-amber-50 text-amber-700',
  paid:    'bg-green-50 text-green-700',
  overdue: 'bg-red-50 text-red-500',
};

// --- Component ---

const Invoices = () => {
  const { token, user } = useStore();
  const businessName = user?.businessName || user?.name || 'My Business';

  const [invoices, setInvoices]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('invoices');
  const [showForm, setShowForm]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [form, setForm]             = useState({ ...EMPTY_FORM, invoiceNumber: generateInvoiceNumber() });
  const [preview, setPreview]       = useState(null);

  // -- Fetch --

  useEffect(() => {
    fetchInvoices();
  }, [token]);

  const fetchInvoices = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch(`${BACKEND_URL}/api/invoices`, { headers: authHeaders(token) });
      const data = await res.json();
      if (data.success) setInvoices(data.invoices || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // -- PDF download (moved inside the component so it can report errors via setError) --

  const downloadInvoicePDF = (invoice, biz) => {
    const html = buildInvoiceHTML(invoice, biz);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setError('Allow pop-ups to download the PDF. Please enable them in your browser.');
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
  };

  // -- Item helpers --

  const setItem = (index, field, value) => {
    const items = [...form.items];
    items[index] = { ...items[index], [field]: value };
    setForm({ ...form, items });
  };

  const addItem    = () => setForm({ ...form, items: [...form.items, { ...EMPTY_ITEM }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });

  const subtotal = form.items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0
  );

  // -- Create --

  const handleCreate = async () => {
    if (!form.clientName) { setError('Client name is required'); return; }
    if (form.items.some(i => !i.description || !i.unitPrice)) {
      setError('All line items need a description and price'); return;
    }
    setSaving(true);
    try {
      const res  = await fetch(`${BACKEND_URL}/api/invoices`, {
        method: 'POST', headers: authHeaders(token),
        body: JSON.stringify({
          clientName:  form.clientName,
          clientEmail: form.clientEmail,
          clientPhone: form.clientPhone,
          clientAddress: form.clientAddress,
          issueDate:   form.issueDate,
          dueDate:     form.dueDate || null,
          notes:       form.notes,
          items:       form.items,
          amount:      subtotal,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setInvoices([data.invoice, ...invoices]);
        resetForm();
      } else { setError(data.error || 'Failed to create invoice'); }
    } catch { setError('Failed to create invoice'); }
    finally { setSaving(false); }
  };

  const resetForm = () => {
    setShowForm(false);
    setError('');
    setForm({ ...EMPTY_FORM, invoiceNumber: generateInvoiceNumber() });
  };

  // -- Update status --

  const handleUpdateStatus = async (id, status) => {
    try {
      const res  = await fetch(`${BACKEND_URL}/api/invoices/${id}`, {
        method: 'PATCH', headers: authHeaders(token),
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) setInvoices(invoices.map(inv => inv._id === id ? data.invoice : inv));
    } catch { console.error('Update failed'); }
  };

  // -- Delete --

  const handleDelete = async (id) => {
    try {
      await fetch(`${BACKEND_URL}/api/invoices/${id}`, { method: 'DELETE', headers: authHeaders(token) });
      setInvoices(invoices.filter(inv => inv._id !== id));
    } catch { console.error('Delete failed'); }
  };

  // -- Stats --

  const totalPaid    = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.amount || 0), 0);
  const totalPending = invoices.filter(i => i.status === 'sent' || i.status === 'draft').length;

  return (
    <div className="bg-[#F5F7FA] min-h-screen pb-32">

      {/* Header */}
      <div className="p-6 bg-white border-b border-[#E2E8F0] shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-[#0F172A]">Invoices</h1>
          <p className="text-[#94A3B8] text-xs font-medium mt-0.5">Create and send professional invoices</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#185FA5] text-white px-4 py-2 rounded-xl font-bold text-sm active:scale-95 transition-all"
        >
          + Invoice
        </button>
      </div>

      {/* Stats */}
      <div className="p-6 grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm text-center">
          <p className="font-black text-2xl text-[#185FA5]">{invoices.length}</p>
          <p className="text-[#94A3B8] text-[11px] font-semibold uppercase mt-1">Total</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm text-center">
          <p className="font-black text-2xl text-amber-500">{totalPending}</p>
          <p className="text-[#94A3B8] text-[11px] font-semibold uppercase mt-1">Pending</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm text-center">
          <p className="font-black text-lg text-green-600">₦{(totalPaid / 1000).toFixed(0)}k</p>
          <p className="text-[#94A3B8] text-[11px] font-semibold uppercase mt-1">Collected</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 mb-4">
        <div className="flex bg-[#F1F5F9] rounded-2xl p-1">
          {['invoices', 'paid'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all capitalize ${activeTab === tab ? 'bg-white text-[#185FA5] shadow-sm' : 'text-[#94A3B8]'}`}>
              {tab === 'paid' ? 'Paid' : 'All Invoices'}
            </button>
          ))}
        </div>
      </div>

      {/* New Invoice Form */}
      {showForm && (
        <div className="mx-6 mb-4 bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
          <p className="text-[#0F172A] font-bold text-sm mb-4">New Invoice</p>
          <div className="flex flex-col gap-3">

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#0F172A] text-xs font-bold uppercase tracking-wide mb-1.5 block">Invoice #</label>
                <input value={form.invoiceNumber} onChange={e => setForm({ ...form, invoiceNumber: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#185FA5]" />
              </div>
              <div>
                <label className="text-[#0F172A] text-xs font-bold uppercase tracking-wide mb-1.5 block">Issue Date</label>
                <input type="date" value={form.issueDate} onChange={e => setForm({ ...form, issueDate: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#185FA5]" />
              </div>
            </div>

            <div>
              <label className="text-[#0F172A] text-xs font-bold uppercase tracking-wide mb-1.5 block">Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#185FA5]" />
            </div>

            <div className="pt-2 border-t border-[#F1F5F9]">
              <p className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wide mb-3">Client Details</p>
            </div>

            <div>
              <label className="text-[#0F172A] text-xs font-bold uppercase tracking-wide mb-1.5 block">Client Name *</label>
              <input value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} placeholder="e.g. Acme Corp"
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#185FA5]" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#0F172A] text-xs font-bold uppercase tracking-wide mb-1.5 block">Email</label>
                <input type="email" value={form.clientEmail} onChange={e => setForm({ ...form, clientEmail: e.target.value })} placeholder="client@email.com"
                  className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#185FA5]" />
              </div>
              <div>
                <label className="text-[#0F172A] text-xs font-bold uppercase tracking-wide mb-1.5 block">Phone</label>
                <input type="tel" value={form.clientPhone} onChange={e => setForm({ ...form, clientPhone: e.target.value })} placeholder="080..."
                  className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#185FA5]" />
              </div>
            </div>

            <div>
              <label className="text-[#0F172A] text-xs font-bold uppercase tracking-wide mb-1.5 block">Client Address</label>
              <input value={form.clientAddress} onChange={e => setForm({ ...form, clientAddress: e.target.value })} placeholder="Street, City, State"
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#185FA5]" />
            </div>

            <div className="pt-2 border-t border-[#F1F5F9]">
              <p className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wide mb-3">Line Items</p>
            </div>

            {form.items.map((item, i) => (
              <div key={i} className="bg-[#F8FAFC] rounded-xl p-3 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold text-[#0F172A]">Item {i + 1}</p>
                  {form.items.length > 1 && (
                    <button onClick={() => removeItem(i)} className="text-red-400 text-xs font-bold">Remove</button>
                  )}
                </div>
                <input value={item.description} onChange={e => setItem(i, 'description', e.target.value)} placeholder="Description"
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#185FA5] bg-white" />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[#94A3B8] text-[10px] font-bold uppercase mb-1 block">Qty</label>
                    <input type="number" min="1" value={item.quantity} onChange={e => setItem(i, 'quantity', e.target.value)}
                      className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#185FA5] bg-white" />
                  </div>
                  <div>
                    <label className="text-[#94A3B8] text-[10px] font-bold uppercase mb-1 block">Unit Price (₦)</label>
                    <input type="number" value={item.unitPrice} onChange={e => setItem(i, 'unitPrice', e.target.value)} placeholder="0.00"
                      className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#185FA5] bg-white" />
                  </div>
                </div>
                {item.quantity && item.unitPrice ? (
                  <p className="text-right text-xs font-bold text-[#185FA5]">
                    {formatNaira(Number(item.quantity) * Number(item.unitPrice))}
                  </p>
                ) : null}
              </div>
            ))}

            <button onClick={addItem}
              className="w-full py-2.5 border border-dashed border-[#185FA5] rounded-xl text-[#185FA5] text-sm font-bold">
              + Add Item
            </button>

            {subtotal > 0 && (
              <div className="flex justify-between items-center bg-[#EEF4FF] rounded-xl px-4 py-3">
                <span className="text-sm font-bold text-[#0F172A]">Total</span>
                <span className="text-sm font-black text-[#185FA5]">{formatNaira(subtotal)}</span>
              </div>
            )}

            <div>
              <label className="text-[#0F172A] text-xs font-bold uppercase tracking-wide mb-1.5 block">Notes (optional)</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Payment terms, bank details, thank-you note..."
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#185FA5] h-20 resize-none" />
            </div>

            {error && <FAlert type="error" message={error} onDismiss={() => setError('')} />}

            <div className="flex gap-3">
              <button onClick={resetForm}
                className="flex-1 py-3 border border-[#E2E8F0] rounded-xl font-bold text-[#64748B] text-sm">
                Cancel
              </button>
              <button onClick={handleCreate} disabled={saving}
                className="flex-1 py-3 bg-[#185FA5] text-white rounded-xl font-bold text-sm disabled:opacity-60 flex items-center justify-center">
                {saving ? <FSpinner size="sm" /> : 'Create Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
          onClick={() => setPreview(null)}>
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <p className="font-black text-[#0F172A] text-base">{preview.invoiceNumber}</p>
              <button onClick={() => setPreview(null)} className="text-[#94A3B8] text-xl font-bold">&times;</button>
            </div>

            <div className="flex flex-col gap-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8] font-semibold">Client</span>
                <span className="font-bold text-[#0F172A]">{preview.clientName}</span>
              </div>
              {preview.clientEmail && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8] font-semibold">Email</span>
                  <span className="text-[#64748B]">{preview.clientEmail}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8] font-semibold">Issue Date</span>
                <span className="text-[#64748B]">{formatDate(preview.issueDate)}</span>
              </div>
              {preview.dueDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8] font-semibold">Due Date</span>
                  <span className="text-[#64748B]">{formatDate(preview.dueDate)}</span>
                </div>
              )}
            </div>

            <div className="border-t border-[#F1F5F9] pt-3 mb-3">
              {(preview.items || []).map((item, i) => (
                <div key={i} className="flex justify-between py-2 text-sm border-b border-[#F8FAFC]">
                  <div>
                    <p className="font-bold text-[#0F172A]">{item.description}</p>
                    <p className="text-[#94A3B8] text-xs">{item.quantity} &times; {formatNaira(item.unitPrice)}</p>
                  </div>
                  <p className="font-black text-[#185FA5]">{formatNaira(Number(item.quantity) * Number(item.unitPrice))}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center bg-[#EEF4FF] rounded-xl px-4 py-3 mb-5">
              <span className="font-bold text-[#0F172A]">Total Due</span>
              <span className="font-black text-[#185FA5] text-lg">{formatNaira(preview.amount || preview.total)}</span>
            </div>

            <div className="flex gap-2 mb-3">
              {preview.status !== 'paid' && (
                <button onClick={() => { handleUpdateStatus(preview._id, 'paid'); setPreview(null); }}
                  className="flex-1 py-2.5 bg-green-50 text-green-700 rounded-xl font-bold text-sm">
                  Mark Paid
                </button>
              )}
              {preview.status === 'draft' && (
                <button onClick={() => { handleUpdateStatus(preview._id, 'sent'); setPreview(null); }}
                  className="flex-1 py-2.5 bg-amber-50 text-amber-700 rounded-xl font-bold text-sm">
                  Mark Sent
                </button>
              )}
            </div>

            <button
              onClick={() => downloadInvoicePDF(preview, businessName)}
              className="w-full py-3 bg-[#185FA5] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              Download PDF
            </button>
          </div>
        </div>
      )}

      {/* Invoice List */}
      <div className="px-6">
        {loading ? (
          <div className="flex justify-center py-16"><FSpinner size="md" message="Loading invoices" /></div>
        ) : (() => {
          const filtered = activeTab === 'paid'
            ? invoices.filter(i => i.status === 'paid')
            : invoices;

          if (filtered.length === 0) {
            return (
              <div className="flex flex-col items-center py-16 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#EEF4FF] flex items-center justify-center text-2xl">🧾</div>
                <p className="text-[#94A3B8] text-sm font-medium">
                  {activeTab === 'paid' ? 'No paid invoices yet.' : 'No invoices yet.'}
                </p>
                <p className="text-[#CBD5E1] text-xs">Tap "+ Invoice" to create your first invoice</p>
              </div>
            );
          }

          return (
            <div className="flex flex-col gap-3">
              {filtered.map(invoice => (
                <div key={invoice._id} className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-[#0F172A] font-bold text-sm">{invoice.clientName}</p>
                      <p className="text-[#94A3B8] text-xs mt-0.5">{invoice.invoiceNumber} &middot; {formatDate(invoice.issueDate)}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[invoice.status] || 'bg-gray-50 text-gray-500'}`}>
                      {invoice.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mb-3">
                    <div>
                      {invoice.dueDate && (
                        <p className="text-[#94A3B8] text-xs">Due {formatDate(invoice.dueDate)}</p>
                      )}
                    </div>
                    <p className="font-black text-[#185FA5] text-base">{formatNaira(invoice.amount || invoice.total)}</p>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-[#F1F5F9]">
                    <button onClick={() => setPreview(invoice)}
                      className="flex-1 py-2 bg-[#EEF4FF] text-[#185FA5] rounded-xl font-bold text-xs">
                      View &middot; Download
                    </button>
                    <button onClick={() => handleDelete(invoice._id)}
                      className="py-2 px-3 bg-red-50 text-red-400 rounded-xl font-bold text-xs">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

    </div>
  );
};

export default Invoices;