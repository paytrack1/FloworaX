import React, { useEffect, useState } from "react";
import { useStore } from "../store/useStore";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

const Customers = () => {
  const { token } = useStore();
  const [customers, setCustomers] = useState([]);
  const [selected, setSelected]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [search, setSearch]       = useState("");
  const [form, setForm]           = useState({ name: "", email: "", phone: "", address: "", notes: "" });

  const authHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    try {
      const res  = await fetch(`${BACKEND_URL}/api/customers`, { headers: authHeaders });
      const data = await res.json();
      if (data.success) setCustomers(data.customers);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchCustomer = async (id) => {
    try {
      const res  = await fetch(`${BACKEND_URL}/api/customers/${id}`, { headers: authHeaders });
      const data = await res.json();
      if (data.success) setSelected(data.customer);
    } catch (err) { console.error(err); }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    try {
      const res  = await fetch(`${BACKEND_URL}/api/customers`, { method: "POST", headers: authHeaders, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) {
        setCustomers([data.customer, ...customers]);
        setShowForm(false);
        setForm({ name: "", email: "", phone: "", address: "", notes: "" });
        setError("");
      } else { setError(data.error || "Failed to create customer"); }
    } catch { setError("Failed to create customer"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this customer?")) return;
    try {
      await fetch(`${BACKEND_URL}/api/customers/${id}`, { method: "DELETE", headers: authHeaders });
      setCustomers(customers.filter(c => c._id !== id));
      if (selected?._id === id) setSelected(null);
    } catch { console.error("Delete failed"); }
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  const fmt = (n) => `N${(n || 0).toLocaleString()}`;

  if (selected) {
    return (
      <div className="bg-[#F5F7FA] min-h-screen pb-32">
        <div className="p-6 bg-white border-b border-[#E2E8F0] shadow-sm flex items-center gap-4">
          <button onClick={() => setSelected(null)} className="text-[#185FA5] font-bold text-sm">Back</button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-[#0F172A]">{selected.name}</h1>
            <p className="text-[#94A3B8] text-xs font-medium mt-0.5">{selected.email || "No email"}</p>
          </div>
          <button onClick={() => handleDelete(selected._id)} className="text-red-400 text-sm font-bold">Delete</button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm">
            <p className="text-[#94A3B8] text-[10px] font-semibold uppercase mb-1">Total Spent</p>
            <p className="font-black text-xl text-[#185FA5]">{fmt(selected.stats?.totalSpent)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm">
            <p className="text-[#94A3B8] text-[10px] font-semibold uppercase mb-1">Outstanding</p>
            <p className="font-black text-xl text-red-500">{fmt(selected.stats?.outstanding)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm text-center">
            <p className="font-black text-2xl text-[#0F172A]">{selected.stats?.totalBookings || 0}</p>
            <p className="text-[#94A3B8] text-[11px] font-semibold uppercase mt-1">Bookings</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm text-center">
            <p className="font-black text-2xl text-[#0F172A]">{selected.stats?.totalInvoices || 0}</p>
            <p className="text-[#94A3B8] text-[11px] font-semibold uppercase mt-1">Invoices</p>
          </div>
        </div>
        <div className="mx-6 mb-4 bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
          <p className="text-[#0F172A] font-bold text-sm mb-3">Contact Info</p>
          {selected.phone   && <p className="text-[#64748B] text-sm mb-1">Phone: {selected.phone}</p>}
          {selected.email   && <p className="text-[#64748B] text-sm mb-1">Email: {selected.email}</p>}
          {selected.address && <p className="text-[#64748B] text-sm mb-1">Address: {selected.address}</p>}
          {selected.notes   && (
            <div className="mt-3 pt-3 border-t border-[#F1F5F9]">
              <p className="text-[#94A3B8] text-[10px] font-semibold uppercase mb-1">Notes</p>
              <p className="text-[#64748B] text-sm">{selected.notes}</p>
            </div>
          )}
        </div>
        {selected.sales?.length > 0 && (
          <div className="mx-6 mb-4 bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
            <p className="text-[#0F172A] font-bold text-sm mb-3">Recent Sales</p>
            {selected.sales.slice(0, 5).map(s => (
              <div key={s._id} className="flex justify-between items-center py-2 border-b border-[#F1F5F9] last:border-0">
                <div>
                  <p className="text-[#0F172A] text-sm font-semibold">{s.itemName || "Sale"}</p>
                  <p className="text-[#94A3B8] text-xs">{new Date(s.createdAt).toLocaleDateString()}</p>
                </div>
                <p className="text-[#185FA5] font-bold text-sm">{fmt(s.total)}</p>
              </div>
            ))}
          </div>
        )}
        {selected.bookings?.length > 0 && (
          <div className="mx-6 mb-4 bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
            <p className="text-[#0F172A] font-bold text-sm mb-3">Recent Bookings</p>
            {selected.bookings.slice(0, 5).map(b => (
              <div key={b._id} className="flex justify-between items-center py-2 border-b border-[#F1F5F9] last:border-0">
                <div>
                  <p className="text-[#0F172A] text-sm font-semibold">{b.scheduledDate} at {b.scheduledTime}</p>
                  <p className="text-[#94A3B8] text-xs capitalize">{b.status}</p>
                </div>
                <p className="text-[#0F172A] font-bold text-sm">{b.amount === 0 ? "Free" : fmt(b.amount)}</p>
              </div>
            ))}
          </div>
        )}
        {selected.invoices?.length > 0 && (
          <div className="mx-6 mb-4 bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
            <p className="text-[#0F172A] font-bold text-sm mb-3">Invoices</p>
            {selected.invoices.slice(0, 5).map(inv => (
              <div key={inv._id} className="flex justify-between items-center py-2 border-b border-[#F1F5F9] last:border-0">
                <div>
                  <p className="text-[#0F172A] text-sm font-semibold">{inv.invoiceNumber}</p>
                  <p className="text-[#94A3B8] text-xs">{new Date(inv.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#0F172A] font-bold text-sm">{fmt(inv.amount)}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${inv.status === "paid" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{inv.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#F5F7FA] min-h-screen pb-32">
      <div className="p-6 bg-white border-b border-[#E2E8F0] shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-[#0F172A]">Customers</h1>
          <p className="text-[#94A3B8] text-xs font-medium mt-0.5">{customers.length} total customers</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-[#185FA5] text-white px-4 py-2 rounded-xl font-bold text-sm active:scale-95 transition-all">+ Customer</button>
      </div>
      <div className="px-6 pt-5 pb-2">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email or phone..."
          className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#185FA5] bg-white" />
      </div>
      {showForm && (
        <div className="mx-6 my-4 bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
          <p className="text-[#0F172A] font-bold text-sm mb-4">New Customer</p>
          <div className="flex flex-col gap-3">
            {[{ label: "Full Name *", key: "name", placeholder: "e.g. John Doe" }, { label: "Email", key: "email", placeholder: "john@example.com" }, { label: "Phone", key: "phone", placeholder: "+234..." }, { label: "Address", key: "address", placeholder: "City, State" }].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="text-[#0F172A] text-xs font-bold uppercase tracking-wide mb-1.5 block">{label}</label>
                <input value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder}
                  className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#185FA5]" />
              </div>
            ))}
            <div>
              <label className="text-[#0F172A] text-xs font-bold uppercase tracking-wide mb-1.5 block">Notes</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any notes about this customer..."
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#185FA5] h-20 resize-none" />
            </div>
            {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl"><p className="text-red-600 text-sm">{error}</p></div>}
            <div className="flex gap-3">
              <button onClick={() => { setShowForm(false); setError(""); setForm({ name: "", email: "", phone: "", address: "", notes: "" }); }}
                className="flex-1 py-3 border border-[#E2E8F0] rounded-xl font-bold text-[#64748B] text-sm">Cancel</button>
              <button onClick={handleCreate} disabled={saving}
                className="flex-1 py-3 bg-[#185FA5] text-white rounded-xl font-bold text-sm disabled:opacity-60">{saving ? "Saving..." : "Add Customer"}</button>
            </div>
          </div>
        </div>
      )}
      <div className="px-6 pt-2 flex flex-col gap-3">
        {loading ? (
          <div className="text-center py-16 text-[#94A3B8] text-sm">Loading customers...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#EEF4FF] flex items-center justify-center text-2xl">??</div>
            <p className="text-[#94A3B8] text-sm font-medium">{search ? "No customers found" : "No customers yet"}</p>
            <p className="text-[#CBD5E1] text-xs">Tap "+ Customer" to add your first customer</p>
          </div>
        ) : filtered.map(c => (
          <button key={c._id} onClick={() => fetchCustomer(c._id)} className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm text-left w-full active:scale-[0.98] transition-all">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EEF4FF] flex items-center justify-center font-black text-[#185FA5] text-sm">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-[#0F172A] font-bold text-sm">{c.name}</p>
                  <p className="text-[#94A3B8] text-xs mt-0.5">{c.email || c.phone || "No contact info"}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[#185FA5] font-black text-sm">{fmt(c.stats?.totalSpent)}</p>
                <p className="text-[#94A3B8] text-[10px] mt-0.5">spent</p>
              </div>
            </div>
            <div className="flex gap-4 pt-2 border-t border-[#F1F5F9]">
              <div className="text-center">
                <p className="text-[#0F172A] font-bold text-sm">{c.stats?.totalSales || 0}</p>
                <p className="text-[#94A3B8] text-[10px] uppercase font-semibold">Sales</p>
              </div>
              <div className="text-center">
                <p className="text-[#0F172A] font-bold text-sm">{c.stats?.totalBookings || 0}</p>
                <p className="text-[#94A3B8] text-[10px] uppercase font-semibold">Bookings</p>
              </div>
              <div className="text-center">
                <p className="text-[#0F172A] font-bold text-sm">{c.stats?.totalInvoices || 0}</p>
                <p className="text-[#94A3B8] text-[10px] uppercase font-semibold">Invoices</p>
              </div>
              {c.stats?.outstanding > 0 && (
                <div className="text-center ml-auto">
                  <p className="text-red-500 font-bold text-sm">{fmt(c.stats.outstanding)}</p>
                  <p className="text-[#94A3B8] text-[10px] uppercase font-semibold">Owed</p>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Customers;
