import React, { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Camera } from 'lucide-react';

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const Settings = () => {
  const { logout, user, setProfileImage, sales } = useStore();
  const [exportStatus, setExportStatus] = useState('');
  const [showSupport, setShowSupport] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleExportCSV = async () => {
    try {
      if (!sales || sales.length === 0) {
        setExportStatus('No sales to export yet.');
        setTimeout(() => setExportStatus(''), 3000);
        return;
      }
      const headers = ['ID', 'Item', 'Total', 'Payment', 'Status', 'Verified', 'Synced', 'Date'];
      const rows = sales.map((s) => [
        s.id,
        s.itemName || 'General Sale',
        s.total,
        s.paymentMethod,
        s.status,
        s.verified ? 'Yes' : 'No',
        s.synced === 1 ? 'Yes' : 'No',
        new Date(s.createdAt).toLocaleString(),
      ]);
      const csvContent = [headers, ...rows].map((r) => r.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flowora-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setExportStatus(`Exported ${sales.length} sales successfully!`);
      setTimeout(() => setExportStatus(''), 3000);
    } catch (err) {
      setExportStatus('Export failed. Try again.');
    }
  };

  const settingsOptions = [
    {
      label: 'Store Profile',
      sub: user?.businessName || 'My Store',
      iconBg: '#EEF4FF',
      action: 'profile',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    },
    {
      label: 'Sync Settings',
      sub: 'Auto-sync every 30 seconds',
      iconBg: '#F0FDF4',
      action: 'sync',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
    },
    {
      label: 'Export Data',
      sub: 'Download all sales as CSV',
      iconBg: '#F5F3FF',
      action: 'export',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    },
    {
      label: 'Help & Support',
      sub: 'hello@floworax.com',
      iconBg: '#FFF7ED',
      action: 'support',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    },
  ];

  const handleOption = (action) => {
    if (action === 'export') handleExportCSV();
    if (action === 'support') setShowSupport(!showSupport);
    if (action === 'profile') fileInputRef.current?.click();
    if (action === 'sync') alert('Auto-sync is enabled. Sales sync every 30 seconds when online.');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-[#0F172A]">Settings</h2>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Profile</p>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-[#2F5FB3] flex items-center justify-center overflow-hidden flex-shrink-0">
              {user?.profileImage ? (
                <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-black text-2xl">{user?.businessName?.charAt(0).toUpperCase() || 'M'}</span>
              )}
            </div>
            <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#2F5FB3] rounded-full flex items-center justify-center shadow-lg">
              <Camera size={12} className="text-white" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>
          <div>
            <p className="font-black text-[#0F172A] text-lg">{user?.businessName || 'My Store'}</p>
            <p className="text-slate-400 text-xs font-medium">{user?.email || ''}</p>
            <button onClick={() => fileInputRef.current?.click()} className="text-[#2F5FB3] text-xs font-bold mt-1">
              Tap to change photo
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
        {settingsOptions.map((opt, i) => (
          <button key={i} onClick={() => handleOption(opt.action)}
            className={`w-full p-4 flex items-center justify-between active:bg-[#F8F9FB] transition-colors text-left ${i !== settingsOptions.length - 1 ? 'border-b border-[#F1F5F9]' : ''}`}>
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: opt.iconBg }}>{opt.icon}</div>
              <div>
                <p className="text-[#0F172A] font-bold text-sm">{opt.label}</p>
                <p className="text-[#94A3B8] text-[11px] font-medium">{opt.sub}</p>
              </div>
            </div>
            <ChevronRight />
          </button>
        ))}
      </div>

      {showSupport && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
          <p className="text-orange-800 font-bold text-sm mb-1">Contact Support</p>
          <p className="text-orange-600 text-xs mb-3">Send us an email and we will respond within 24 hours.</p>
          <a href="mailto:hello@floworax.com" className="bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded-xl inline-block">
            hello@floworax.com
          </a>
        </div>
      )}

      {exportStatus && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <p className="text-green-700 text-sm font-medium text-center">{exportStatus}</p>
        </div>
      )}

      <button onClick={logout} className="w-full py-4 text-red-500 font-bold bg-red-50 rounded-2xl border border-red-100 active:scale-95 transition-transform">
        Log Out
      </button>
      <p className="text-center text-[#CBD5E1] text-[10px] font-bold uppercase tracking-widest">Flowora v1.0.4</p>
    </div>
  );
};

export default Settings;
