import React, { useState } from 'react';
import { X, Copy, Download, MessageSquare, Check } from 'lucide-react';

const WhatsAppBroadcast = ({ customers, onClose, businessName }) => {
  const [message, setMessage] = useState(`Hi {{name}}, this is a reminder from ${businessName || 'us'}. Please reply if you have any questions.`);
  const [copied, setCopied] = useState(false);
  const [copiedNumbers, setCopiedNumbers] = useState(false);

  const phones = customers
    .map(c => c.phone)
    .filter(Boolean)
    .map(p => {
      const digits = p.replace(/\D/g, '');
      if (digits.startsWith('234')) return '+' + digits;
      if (digits.startsWith('0')) return '+234' + digits.slice(1);
      return '+234' + digits;
    });

  const noPhone = customers.filter(c => !c.phone);

  const copyMessage = () => {
    navigator.clipboard.writeText(message.replace('{{name}}', 'Customer'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyNumbers = () => {
    navigator.clipboard.writeText(phones.join('\n'));
    setCopiedNumbers(true);
    setTimeout(() => setCopiedNumbers(false), 2000);
  };

  const exportCSV = () => {
    const rows = [
      ['Name', 'Phone', 'Email'],
      ...customers.map(c => [c.name || '', c.phone || '', c.email || '']),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'floworax-contacts.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const openWhatsApp = () => {
    const text = encodeURIComponent(message.replace('{{name}}', 'Customer'));
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-2xl flex items-center justify-center">
                <MessageSquare size={20} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#0F172A]">WhatsApp Broadcast</h2>
                <p className="text-xs text-slate-400">{customers.length} customer{customers.length !== 1 ? 's' : ''} selected</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400"><X size={20} /></button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-green-50 rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-green-700">{phones.length}</p>
              <p className="text-xs text-green-600 font-semibold">With phone number</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-slate-500">{noPhone.length}</p>
              <p className="text-xs text-slate-400 font-semibold">No phone number</p>
            </div>
          </div>

          {/* Message editor */}
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Your Message</p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              placeholder="Type your message here..."
            />
            <p className="text-xs text-slate-400 mt-1">Use {'{{name}}'} to personalize — it shows as "Customer" in WhatsApp</p>
          </div>

          {/* Phone numbers preview */}
          {phones.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Phone Numbers ({phones.length})</p>
              <div className="bg-slate-50 rounded-xl p-3 max-h-28 overflow-y-auto">
                <p className="text-xs text-slate-600 font-mono leading-relaxed">{phones.slice(0, 10).join(', ')}{phones.length > 10 ? ` ... +${phones.length - 10} more` : ''}</p>
              </div>
            </div>
          )}

          {/* How to use */}
          <div className="bg-blue-50 rounded-2xl p-4 mb-5">
            <p className="text-xs font-black text-[#185FA5] mb-2">How to broadcast:</p>
            <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
              <li>Copy your message below</li>
              <li>Copy or export phone numbers</li>
              <li>Open WhatsApp → New Broadcast List</li>
              <li>Add the numbers → paste message → Send</li>
            </ol>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={openWhatsApp}
              className="w-full py-3.5 bg-green-500 text-white font-black rounded-2xl hover:bg-green-600 transition-all flex items-center justify-center gap-2"
            >
              <MessageSquare size={18} /> Open WhatsApp with Message
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={copyMessage}
                className="py-3 border-2 border-green-200 text-green-700 font-bold rounded-xl hover:bg-green-50 transition-all flex items-center justify-center gap-2 text-sm"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy Message'}
              </button>
              <button
                onClick={copyNumbers}
                disabled={phones.length === 0}
                className="py-3 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-40"
              >
                {copiedNumbers ? <Check size={16} /> : <Copy size={16} />}
                {copiedNumbers ? 'Copied!' : 'Copy Numbers'}
              </button>
            </div>

            <button
              onClick={exportCSV}
              className="w-full py-3 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Download size={16} /> Export as CSV / Excel
            </button>
          </div>

          {noPhone.length > 0 && (
            <p className="text-xs text-slate-400 text-center mt-3">
              {noPhone.length} customer{noPhone.length !== 1 ? 's' : ''} skipped — no phone number on file.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppBroadcast;
