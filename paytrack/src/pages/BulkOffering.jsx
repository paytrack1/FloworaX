import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle, X } from 'lucide-react';
import FAlert from '../components/FAlert';
import FSpinner from '../components/FSpinner';
import { useStore } from '../store/useStore';

const OFFERING_TYPES = [
  'Sunday Offering',
  'Tithe',
  'First Fruit',
  'Thanksgiving',
  'Building Fund',
  'Welfare',
  'Missions',
  'Special Offering',
];

const EMPTY_ROW = { name: '', amount: '', type: 'Sunday Offering', paymentMethod: 'cash' };

const BulkOffering = ({ onBack }) => {
  const { addSale, user } = useStore();
  const [rows, setRows] = useState([{ ...EMPTY_ROW }, { ...EMPTY_ROW }, { ...EMPTY_ROW }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  const updateRow = (i, field, value) => {
    const updated = [...rows];
    updated[i] = { ...updated[i], [field]: value };
    setRows(updated);
  };

  const addRow = () => setRows([...rows, { ...EMPTY_ROW }]);

  const removeRow = (i) => {
    if (rows.length === 1) return;
    setRows(rows.filter((_, idx) => idx !== i));
  };

  const validRows = rows.filter(r => r.name.trim() && parseFloat(r.amount) > 0);
  const total = validRows.reduce((s, r) => s + parseFloat(r.amount || 0), 0);

  const handleSubmit = async () => {
    if (validRows.length === 0) {
      setError('Please add at least one entry with a name and amount.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      for (const row of validRows) {
        await addSale({
          itemName: `${row.type} - ${row.name.trim()}`,
          total: parseFloat(row.amount),
          paymentMethod: row.paymentMethod,
          reference: null,
          status: 'completed',
          profit: parseFloat(row.amount),
        });
      }
      setSavedCount(validRows.length);
      setDone(true);
    } catch (err) {
      setError('Failed to save entries. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col h-screen bg-[#F8FAFC] items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle size={40} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-black text-[#0F172A] mb-2">Offering Recorded!</h2>
        <p className="text-slate-500 mb-1">{savedCount} entries saved</p>
        <p className="text-2xl font-black text-[#185FA5] mb-8">₦{total.toLocaleString()}</p>
        <button
          onClick={onBack}
          className="w-full max-w-sm bg-[#185FA5] text-white font-black py-4 rounded-2xl"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-white p-5 flex justify-between items-center border-b border-slate-100">
        <div>
          <h2 className="text-xl font-black text-[#0F172A]">Bulk Offering Entry</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {user?.businessName || 'Church'} · {validRows.length} entries · ₦{total.toLocaleString()}
          </p>
        </div>
        <button onClick={onBack} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all">
          <X size={20} />
        </button>
      </div>

      {/* Table header */}
      <div className="px-4 pt-4 pb-2 grid grid-cols-12 gap-2 text-[10px] font-black uppercase text-slate-400">
        <div className="col-span-4">Name</div>
        <div className="col-span-3">Type</div>
        <div className="col-span-3">Amount (₦)</div>
        <div className="col-span-1">Pay</div>
        <div className="col-span-1"></div>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto px-4 pb-40 space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
            {/* Name */}
            <input
              className="col-span-4 text-sm font-semibold outline-none border-b border-slate-200 pb-1 focus:border-[#185FA5]"
              placeholder="Full name"
              value={row.name}
              onChange={e => updateRow(i, 'name', e.target.value)}
            />
            {/* Type */}
            <select
              className="col-span-3 text-xs outline-none border-b border-slate-200 pb-1 focus:border-[#185FA5] bg-white"
              value={row.type}
              onChange={e => updateRow(i, 'type', e.target.value)}
            >
              {OFFERING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {/* Amount */}
            <input
              type="number"
              className="col-span-3 text-sm font-black outline-none border-b border-slate-200 pb-1 focus:border-[#185FA5] text-[#185FA5]"
              placeholder="0"
              value={row.amount}
              onChange={e => updateRow(i, 'amount', e.target.value)}
            />
            {/* Payment method */}
            <select
              className="col-span-1 text-[10px] outline-none bg-white text-slate-500"
              value={row.paymentMethod}
              onChange={e => updateRow(i, 'paymentMethod', e.target.value)}
            >
              <option value="cash">💵</option>
              <option value="transfer">📱</option>
              <option value="pos">💳</option>
            </select>
            {/* Remove */}
            <button onClick={() => removeRow(i)} className="col-span-1 flex justify-center text-slate-300 hover:text-red-400 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        {/* Add row */}
        <button
          onClick={addRow}
          className="w-full py-3 border-2 border-dashed border-[#185FA5] rounded-2xl text-[#185FA5] font-bold text-sm flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Add Entry
        </button>

        {error && <FAlert type="error" message={error} onDismiss={() => setError('')} />}
      </div>

      {/* Summary + Submit */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-5">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-semibold text-slate-500">{validRows.length} valid entries</span>
          <span className="text-lg font-black text-[#185FA5]">₦{total.toLocaleString()}</span>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving || validRows.length === 0}
          className="w-full py-4 bg-[#185FA5] text-white font-black rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <FSpinner size="sm" /> : <><CheckCircle size={20} /><span>SAVE {validRows.length} OFFERING{validRows.length !== 1 ? 'S' : ''}</span></>}
        </button>
      </div>
    </div>
  );
};

export default BulkOffering;
