import React, { useState, useRef } from 'react';
import FAlert   from '../components/FAlert';
import FSpinner from '../components/FSpinner';
import { useStore } from '../store/useStore';
import { Camera, ChevronRight } from 'lucide-react';

const MODULE_OPTIONS = [
  { key: 'customers', label: 'Customers', icon: '\ud83d\udc65', description: 'Manage your clients' },
  { key: 'sales', label: 'Sales', icon: '\ud83d\udcb5', description: 'Record and track sales' },
  { key: 'bookings', label: 'Bookings', icon: '\ud83d\udcc5', description: 'Accept appointments online' },
  { key: 'events', label: 'Events', icon: '\ud83c\udf9f\ufe0f', description: 'Sell tickets and manage attendees' },
  { key: 'finance', label: 'Finance', icon: '\ud83d\udcb0', description: 'Track income and expenses' },
  { key: 'reports', label: 'Reports', icon: '\ud83d\udcca', description: 'See performance at a glance' },
  { key: 'invoices', label: 'Invoices', icon: '\ud83e\uddfe', description: 'Bill clients and get paid' },
];

const Settings = () => {
  const { logout, user, setProfileImage, sales, dashboard, plans, planError, fetchPlans, upgradePlan, updateBusinessProfile } = useStore();
  const [exportStatus, setExportStatus] = useState('');
  const [showSupport, setShowSupport] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [planMessage, setPlanMessage] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileForm, setProfileForm] = useState({
    businessName: user?.businessName || '',
    businessType: user?.businessType || '',
    phone: user?.phone || '',
    address: user?.address || '',
    bankAccount: user?.bankAccount || '',
    currency: user?.currency || 'NGN',
    timezone: user?.timezone || 'Africa/Lagos',
  });
  const [selectedModules, setSelectedModules] = useState(user?.modules || []);
  const businessTypes = ['Consultant', 'Church', 'Clinic', 'School', 'Agency', 'Freelancer', 'Other'];
  const fileInputRef = useRef(null);

  const handleProfileFieldChange = (field, value) => {
    setProfileError('');
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    if (!profileForm.businessName.trim() || !profileForm.businessType) {
      setProfileError('Business name and business type are required.');
      return;
    }
    setSavingProfile(true);
    try {
      await updateBusinessProfile({ ...profileForm, modules: selectedModules });
      setShowEditProfile(false);
    } catch (err) {
      setProfileError(err.message || 'Failed to save changes.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => { setProfileImage(reader.result); };
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
    } catch {
      setExportStatus('Export failed. Try again.');
    }
  };

  const openConfirmUpgrade = (plan) => {
    if (plan.id === user?.plan) {
      setPlanMessage(`You are already on the ${plan.name} plan.`);
      return;
    }
    setSelectedPlan(plan);
    setPlanMessage('');
  };

  const confirmUpgrade = async () => {
    if (!selectedPlan) return;
    setIsUpgrading(true);
    setPlanMessage('Upgrading plan...');
    try {
      await upgradePlan(selectedPlan.id);
      setPlanMessage(`Upgraded to ${selectedPlan.name}`);
      setSelectedPlan(null);
      setShowPlans(false);
    } catch (err) {
      setPlanMessage(err.message || 'Upgrade failed');
    } finally {
      setIsUpgrading(false);
    }
  };

  const settingsOptions = [
    {
      label: 'Store Profile',
      sub: user?.businessName || 'My Store',
      iconBg: '#EEF4FF',
      action: 'profile',
    },
    {
      label: 'Subscription',
      sub: dashboard?.subscription?.plan?.name ? `${dashboard.subscription.plan.name} plan` : 'Free plan',
      iconBg: '#FEF3C7',
      action: 'plans',
    },
    {
      label: 'Sync Settings',
      sub: 'Auto-sync every 30 seconds',
      iconBg: '#F0FDF4',
      action: 'sync',
    },
    {
      label: 'Export Data',
      sub: 'Download all sales as CSV',
      iconBg: '#F5F3FF',
      action: 'export',
    },
    {
      label: 'Help & Support',
      sub: 'floworax2@gmail.com',
      iconBg: '#FFF7ED',
      action: 'support',
    },
  ];

  const handleOption = (action) => {
    if (action === 'export') handleExportCSV();
    if (action === 'support') setShowSupport(!showSupport);
    if (action === 'profile') setShowEditProfile(true);
    if (action === 'sync') setSyncMsg('Auto-sync is enabled. Sales sync every 30 seconds when online.');
    if (action === 'plans') {
      setShowPlans(!showPlans);
      if (!plans?.length) fetchPlans?.();
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-[#0F172A]">Settings</h2>

      {/* PROFILE */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Profile</p>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-[#185FA5] flex items-center justify-center overflow-hidden flex-shrink-0">
              {user?.profileImage ? (
                <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-black text-2xl">
                  {user?.businessName?.charAt(0).toUpperCase() || 'M'}
                </span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#185FA5] rounded-full flex items-center justify-center shadow-lg"
            >
              <Camera size={12} className="text-white" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>
          <div>
            <p className="font-black text-[#0F172A] text-lg">{user?.businessName || 'My Store'}</p>
            <p className="text-slate-400 text-xs font-medium">{user?.email || ''}</p>
            <button onClick={() => fileInputRef.current?.click()} className="text-[#185FA5] text-xs font-bold mt-1">
              Tap to change photo
            </button>
          </div>
        </div>
      </div>

      {/* OPTIONS */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
        {settingsOptions.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleOption(opt.action)}
            className={`w-full p-4 flex items-center justify-between active:bg-[#F8F9FB] transition-colors text-left ${
              i !== settingsOptions.length - 1 ? 'border-b border-[#F1F5F9]' : ''
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black"
                style={{ backgroundColor: opt.iconBg }}
              >
                {opt.action === 'profile' && '👤'}
                {opt.action === 'plans' && '⭐'}
                {opt.action === 'sync' && '🔄'}
                {opt.action === 'export' && '📥'}
                {opt.action === 'support' && '💬'}
              </div>
              <div>
                <p className="text-[#0F172A] font-bold text-sm">{opt.label}</p>
                <p className="text-[#94A3B8] text-[11px] font-medium">{opt.sub}</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-300" />
          </button>
        ))}
      </div>

      {/* SUPPORT */}
      {showSupport && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
          <p className="text-orange-800 font-bold text-sm mb-1">Contact Support</p>
          <p className="text-orange-600 text-xs mb-3">Send us an email and we will respond within 24 hours.</p>
          <a href="mailto:floworax2@gmail.com" className="bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded-xl inline-block">
            floworax2@gmail.com
          </a>
        </div>
      )}

      {/* EDIT PROFILE */}
      {showEditProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-bold">Store Profile</p>
                <h2 className="text-xl font-black text-[#0F172A] mt-2">Edit business details</h2>
              </div>
              <button type="button" onClick={() => setShowEditProfile(false)} className="text-sm text-slate-500">Close</button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Business Name</span>
                <input
                  value={profileForm.businessName}
                  onChange={(e) => handleProfileFieldChange('businessName', e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm outline-none focus:border-[#185FA5]"
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Business Type</span>
                <select
                  value={profileForm.businessType}
                  onChange={(e) => handleProfileFieldChange('businessType', e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm outline-none focus:border-[#185FA5]"
                >
                  <option value="">Select a type</option>
                  {businessTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Phone</span>
                <input
                  value={profileForm.phone}
                  onChange={(e) => handleProfileFieldChange('phone', e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm outline-none focus:border-[#185FA5]"
                  placeholder="+234 800 000 0000"
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Address</span>
                <textarea
                  value={profileForm.address}
                  onChange={(e) => handleProfileFieldChange('address', e.target.value)}
                  rows={2}
                  className="mt-2 w-full rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm outline-none focus:border-[#185FA5]"
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Bank Account</span>
                <input
                  value={profileForm.bankAccount}
                  onChange={(e) => handleProfileFieldChange('bankAccount', e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm outline-none focus:border-[#185FA5]"
                  placeholder="Account name / number"
                />
              </label>

              <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFF] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Modules</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {MODULE_OPTIONS.map((module) => {
                    const checked = selectedModules.includes(module.key);
                    return (
                      <label key={module.key} className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${checked ? 'border-[#185FA5] bg-white' : 'border-[#E2E8F0] bg-transparent'}`}>
                        <span className="text-lg leading-none mr-2">{module.icon}</span><span className="font-semibold text-[#0F172A]">{module.label}<br/><span className="text-xs font-normal text-[#64748B]">{module.description}</span></span>
                        <input type="checkbox" checked={checked} onChange={() => setSelectedModules((prev) => prev.includes(module.key) ? prev.filter((item) => item !== module.key) : [...prev, module.key])} className="h-4 w-4 rounded border-slate-300 text-[#185FA5] focus:ring-[#185FA5]" />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Currency</span>
                  <p className="mt-2 w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFF] px-4 py-3 text-sm text-slate-500">NGN &mdash; Nigerian Naira</p>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Timezone</span>
                  <p className="mt-2 w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFF] px-4 py-3 text-sm text-slate-500">Africa/Lagos</p>
                </div>
              </div>

              <FAlert type="error" message={profileError} onDismiss={() => setProfileError("")} />

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditProfile(false)}
                  className="flex-1 py-3 border border-[#E2E8F0] rounded-2xl font-bold text-[#64748B] text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="flex-1 py-3 bg-[#185FA5] text-white rounded-2xl font-bold text-sm disabled:opacity-60"
                >
                  {savingProfile ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PLANS */}
      {showPlans && ((
        () => {
          const [billing, setBilling] = React.useState('monthly');
          const getPrice = (plan) => billing === 'annual' && plan.annualPrice ? plan.annualPrice : plan.price;
          const getLabel = (plan) => {
            if (plan.price === 0) return 'Free forever';
            if (billing === 'annual' && plan.annualPrice) return ?/year;
            return ?/month;
          };
          const getOriginal = (plan) => billing === 'annual' && plan.annualPrice ? ? : null;
          return (
        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-bold">Subscription plans</p>
              <h2 className="text-lg font-black text-[#0F172A]">Choose a plan</h2>
            </div>
            <button onClick={() => setShowPlans(false)} className="text-sm text-[#64748B]">Close</button>
          </div>

          {/* Annual toggle */}
          <div className="flex items-center justify-center mb-5">
            <div className="flex bg-[#F1F5F9] rounded-2xl p-1 gap-1">
              <button onClick={() => setBilling('monthly')}
                className={px-4 py-2 rounded-xl text-sm font-bold transition-all }>
                Monthly
              </button>
              <button onClick={() => setBilling('annual')}
                className={px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 }>
                ? Annual
                <span className={	ext-[10px] font-black px-2 py-0.5 rounded-full }>Save 17%</span>
              </button>
            </div>
          </div>

          <FAlert type="error" message={planError} />
          <div className="grid gap-4 sm:grid-cols-3">
            {(plans || []).map((plan) => {
              const price  = getPrice(plan);
              const label  = getLabel(plan);
              const struck = getOriginal(plan);
              const isCurrent = plan.id === user?.plan;
              return (
              <button key={plan.id} type="button" onClick={() => openConfirmUpgrade({ ...plan, selectedPrice: price, billing })}
                className={ounded-3xl border p-4 text-left transition relative }>
                {plan.badge === 'Most popular' && (
                  <span className="absolute -top-2 left-4 bg-[#185FA5] text-white text-[10px] font-black px-3 py-0.5 rounded-full">Most popular</span>
                )}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <p className="text-sm font-black text-[#0F172A]">{plan.name}</p>
                  {isCurrent && <span className="text-xs font-bold text-[#185FA5]">Current</span>}
                </div>
                <div className="mb-2">
                  {struck && <p className="text-xs text-[#94A3B8] line-through">{struck}</p>}
                  <p className="text-2xl font-black text-[#0F172A]">{label}</p>
                  {billing === 'annual' && plan.annualPrice && (
                    <p className="text-[10px] text-green-600 font-bold mt-0.5">2 months free ??</p>
                  )}
                </div>
                <p className="text-xs text-[#94A3B8]">{plan.description}</p>
              </button>
              );
            })}
          </div>
          {planMessage && <FAlert type="info" message={planMessage} />}
        </div>
          );
        }
      )())}

      {/* CONFIRM UPGRADE MODAL */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-bold">Confirm plan upgrade</p>
                <h2 className="text-xl font-black text-[#0F172A] mt-2">Upgrade to {selectedPlan.name}</h2>
              </div>
              <button type="button" onClick={() => setSelectedPlan(null)} className="text-sm text-slate-500">Cancel</button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-[#E2E8F0] p-4 bg-[#F8FAFF]">
                <p className="text-xs text-slate-400 uppercase tracking-[0.3em] font-bold">
                  {selectedPlan.billing === 'annual' ? 'Annual cost' : 'Monthly cost'}
                </p>
                {selectedPlan.billing === 'annual' && selectedPlan.annualPrice && (
                  <p className="text-xs text-[#94A3B8] line-through mt-2">?{(selectedPlan.price * 12).toLocaleString()}</p>
                )}
                <p className="mt-1 text-2xl font-black text-[#0F172A]">?{(selectedPlan.selectedPrice || selectedPlan.price)?.toLocaleString()}</p>
                {selectedPlan.billing === 'annual' && <p className="text-xs text-green-600 font-bold mt-1">You save ?{((selectedPlan.price * 12) - selectedPlan.annualPrice).toLocaleString()} ??</p>}
                <p className="text-xs text-[#64748B] mt-2">Billed {selectedPlan.billing || 'monthly'}</p>
              </div>
              <div className="rounded-3xl border border-[#E2E8F0] p-4">
                <p className="text-xs text-slate-400 uppercase tracking-[0.3em] font-bold">Plan benefits</p>
                <ul className="mt-3 space-y-2 text-sm text-[#475569]">
                  {(selectedPlan.features || []).map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#185FA5] flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setSelectedPlan(null)}
                className="rounded-3xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
                Cancel
              </button>
              <button type="button" onClick={confirmUpgrade} disabled={isUpgrading}
                className="rounded-3xl bg-[#185FA5] px-5 py-3 text-sm font-bold text-white transition disabled:opacity-50">
                {isUpgrading ? <FSpinner size='sm' /> : Confirm upgrade to }
              </button>
            </div>
          </div>
        </div>
      )}
      {/* EXPORT STATUS */}
      {exportStatus && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <p className="text-green-700 text-sm font-medium text-center">{exportStatus}</p>
        </div>
      )}

      <button
        onClick={logout}
        className="w-full py-4 text-red-500 font-bold bg-red-50 rounded-2xl border border-red-100 active:scale-95 transition-transform"
      >
        Log Out
      </button>
      <p className="text-center text-[#CBD5E1] text-[10px] font-bold uppercase tracking-widest">
        Flowora v1.0.4
      </p>
    </div>
  );
};

export default Settings;
