import React, { useState, useRef } from 'react';
import FAlert   from '../components/FAlert';
import FSpinner from '../components/FSpinner';
import ReferralCard from '../components/ReferralCard';
import { useStore } from '../store/useStore';
import { Button, Card, Input, Badge, SectionHeader } from '../components/ui';
import { Camera, ChevronRight, Users, DollarSign, Calendar, Ticket, Wallet, BarChart2, Receipt, Store, CreditCard, RefreshCw, Download, HelpCircle, Trash2, X } from 'lucide-react';

const MODULE_OPTIONS = [
  { key: 'customers', label: 'Customers', icon: Users, description: 'Manage your clients' },
  { key: 'sales', label: 'Sales', icon: DollarSign, description: 'Record and track sales' },
  { key: 'bookings', label: 'Bookings', icon: Calendar, description: 'Accept appointments online' },
  { key: 'events', label: 'Events', icon: Ticket, description: 'Sell tickets and manage attendees' },
  { key: 'finance', label: 'Finance', icon: Wallet, description: 'Track income and expenses' },
  { key: 'reports', label: 'Reports', icon: BarChart2, description: 'See performance at a glance' },
  { key: 'invoices', label: 'Invoices', icon: Receipt, description: 'Bill clients and get paid' },
];

const Settings = () => {
  const { logout, user, setProfileImage, sales, dashboard, plans, planError, fetchPlans, upgradePlan, updateBusinessProfile, clearSales } = useStore();
  const [exportStatus, setExportStatus] = useState('');
  const [syncMsg, setSyncMsg] = useState('');
  const [showSupport, setShowSupport] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [billing, setBilling] = useState('monthly');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [planMessage, setPlanMessage] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [clearSalesStatus, setClearSalesStatus] = useState('');
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

  const handleClearSales = async () => {
    if (!sales?.length) {
      setClearSalesStatus('No recorded sales found.');
      return;
    }
    if (!window.confirm(`Clear all ${sales.length} recorded sales? This removes the sale records and their revenue, profit, and transaction totals. This cannot be undone.`)) return;
    try {
      const result = await clearSales();
      setClearSalesStatus(`${result.deletedCount || 0} sale records cleared. Revenue, profit, and transaction totals reset.`);
    } catch (err) {
      setClearSalesStatus(err.message || 'Failed to clear sales.');
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

  // Plan pricing helpers. NOTE: the backend's plan catalog (src/middleware/plan.js)
  // currently only defines a single `price` field per plan -- there is no `annualPrice`.
  // The annual toggle below is wired but will always fall back to monthly pricing
  // until/unless annual pricing is actually added to the backend plan data.
  const getPrice = (plan) => (billing === 'annual' && plan.annualPrice ? plan.annualPrice : plan.price);
  const getLabel = (plan) => {
    if (plan.price === 0) return 'Free';
    if (billing === 'annual' && plan.annualPrice) return `₦${plan.annualPrice.toLocaleString()}/year`;
    return `₦${plan.price.toLocaleString()}/month`;
  };
  const getOriginal = (plan) =>
    billing === 'annual' && plan.annualPrice ? `₦${(plan.price * 12).toLocaleString()}` : null;

  const planName = dashboard?.subscription?.plan?.name || (user?.plan === 'paid' ? 'Paid' : 'Free');
  const isPaidUser = ['paid', 'pro', 'business'].includes(user?.plan);

  const settingsOptions = [
    { label: 'Store Profile',  sub: user?.businessName || 'My Store',   tone: 'brand',    icon: Store,       action: 'profile' },
    { label: 'Subscription',   sub: `${planName} plan`,                 tone: 'warning',  icon: CreditCard,  action: 'plans' },
    { label: 'Sync Settings',  sub: 'Auto-sync every 30 seconds',       tone: 'success',  icon: RefreshCw,   action: 'sync' },
    { label: 'Export Data',    sub: 'Download all sales as CSV',        tone: 'info',     icon: Download,    action: 'export' },
    { label: 'Help & Support', sub: 'floworax2@gmail.com',              tone: 'neutral',  icon: HelpCircle,  action: 'support' },
  ];

  const OPTION_TONES = {
    brand:    'bg-brand-50 text-brand-600',
    warning:  'bg-warning-soft text-warning',
    success:  'bg-positive-soft text-positive',
    info:     'bg-info-soft text-info',
    neutral:  'bg-surface-sunken text-ink-secondary',
  };

  const handleOption = (action) => {
    if (action === 'export') handleExportCSV();
    if (action === 'support') setShowSupport(!showSupport);
    if (action === 'profile') setShowEditProfile(true);
    if (action === 'sync') {
      setSyncMsg('Auto-sync is enabled. Sales sync every 30 seconds when online.');
      setTimeout(() => setSyncMsg(''), 4000);
    }
    if (action === 'plans') {
      setShowPlans(!showPlans);
      if (!plans?.length) fetchPlans?.();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-display text-ink">Settings</h2>
        <p className="text-body text-ink-muted mt-0.5">Manage your business profile, plan and data.</p>
      </div>

      {/* REFERRALS */}
      <ReferralCard />

      {/* PROFILE */}
      <Card className="p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-card bg-brand-500 flex items-center justify-center overflow-hidden">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-black text-xl">
                    {user?.businessName?.charAt(0).toUpperCase() || 'M'}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                aria-label="Change profile photo"
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center shadow-md ring-2 ring-white hover:bg-brand-600 transition-colors"
              >
                <Camera size={12} className="text-white" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-heading text-ink truncate">{user?.businessName || 'My Store'}</p>
                <Badge tone={isPaidUser ? 'brand' : 'neutral'} dot>{planName} plan</Badge>
              </div>
              <p className="text-caption text-ink-muted truncate">{user?.email || ''}</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShowEditProfile(true)}>Edit details</Button>
        </div>
      </Card>

      {/* OPTIONS */}
      <Card className="overflow-hidden">
        {settingsOptions.map((opt, i) => (
          <button
            key={opt.action}
            onClick={() => handleOption(opt.action)}
            className={`w-full p-4 flex items-center justify-between gap-3 hover:bg-surface-muted active:bg-surface-sunken transition-colors text-left ${
              i !== settingsOptions.length - 1 ? 'border-b border-slate-100' : ''
            }`}
          >
            <span className="flex items-center gap-3.5 min-w-0">
              <span className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${OPTION_TONES[opt.tone]}`}>
                <opt.icon size={17} strokeWidth={2.2} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-body font-semibold text-ink">{opt.label}</span>
                <span className="block text-caption text-ink-muted truncate">{opt.sub}</span>
              </span>
            </span>
            <ChevronRight size={16} className="text-ink-faint shrink-0" aria-hidden />
          </button>
        ))}
      </Card>

      {/* SYNC / EXPORT MESSAGES */}
      {syncMsg && (
        <div className="px-4 py-3 rounded-field bg-info-soft border border-sky-200">
          <p className="text-info text-body text-center">{syncMsg}</p>
        </div>
      )}
      {exportStatus && (
        <div className="px-4 py-3 rounded-field bg-positive-soft border border-emerald-200">
          <p className="text-positive text-body text-center">{exportStatus}</p>
        </div>
      )}

      {/* SUPPORT */}
      {showSupport && (
        <Card className="p-5">
          <SectionHeader title="Contact support" subtitle="Send us an email and we will respond within 24 hours." />
          <Button variant="secondary" size="sm" icon={HelpCircle} onClick={() => window.location.href = 'mailto:floworax2@gmail.com'}>
            floworax2@gmail.com
          </Button>
        </Card>
      )}

      {/* DANGER ZONE */}
      <Card className="p-5 border-negative/20">
        <SectionHeader
          title="Test data"
          subtitle="Clear only your recorded sales to start testing from a clean account."
        />
        <Button variant="danger" size="sm" icon={Trash2} onClick={handleClearSales}>
          Clear sales data
        </Button>
        {clearSalesStatus && <p className="text-caption text-negative font-semibold mt-2">{clearSalesStatus}</p>}
      </Card>

      {/* EDIT PROFILE MODAL */}
      {showEditProfile && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/50 backdrop-blur-sm sm:p-6 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="w-full max-w-xl bg-surface rounded-t-card sm:rounded-card shadow-lg p-6 max-h-[92vh] overflow-y-auto animate-fade-in">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-micro font-bold uppercase tracking-widest text-ink-muted">Store profile</p>
                <h2 className="text-title text-ink mt-1">Edit business details</h2>
              </div>
              <button type="button" onClick={() => setShowEditProfile(false)} aria-label="Close"
                className="p-2 rounded-full hover:bg-surface-sunken text-ink-muted transition-colors">
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            <div className="space-y-4">
              <Input
                label="Business name"
                value={profileForm.businessName}
                onChange={(e) => handleProfileFieldChange('businessName', e.target.value)}
              />

              <label className="flex flex-col gap-1.5">
                <span className="text-micro font-bold uppercase tracking-wide text-ink-secondary">Business type</span>
                <select
                  value={profileForm.businessType}
                  onChange={(e) => handleProfileFieldChange('businessType', e.target.value)}
                  className="w-full h-11 rounded-field bg-surface border border-slate-200 hover:border-slate-300 px-3.5 text-body text-ink outline-none transition-all duration-150 focus:border-brand-400 focus:shadow-ring"
                >
                  <option value="">Select a type</option>
                  {businessTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </label>

              <Input
                label="Phone"
                value={profileForm.phone}
                onChange={(e) => handleProfileFieldChange('phone', e.target.value)}
                placeholder="+234 800 000 0000"
              />

              <label className="flex flex-col gap-1.5">
                <span className="text-micro font-bold uppercase tracking-wide text-ink-secondary">Address</span>
                <textarea
                  value={profileForm.address}
                  onChange={(e) => handleProfileFieldChange('address', e.target.value)}
                  rows={2}
                  className="w-full rounded-field bg-surface border border-slate-200 hover:border-slate-300 px-3.5 py-2.5 text-body text-ink placeholder:text-ink-faint outline-none transition-all duration-150 focus:border-brand-400 focus:shadow-ring"
                />
              </label>

              <Input
                label="Bank account"
                value={profileForm.bankAccount}
                onChange={(e) => handleProfileFieldChange('bankAccount', e.target.value)}
                placeholder="Account name / number"
              />

              {/* Modules */}
              <div className="rounded-field border border-slate-200 bg-surface-muted p-4">
                <p className="text-micro font-bold uppercase tracking-wide text-ink-secondary mb-3">Modules</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {MODULE_OPTIONS.map((module) => {
                    const checked = selectedModules.includes(module.key);
                    return (
                      <label
                        key={module.key}
                        className={`flex items-center gap-3 rounded-field border px-3 py-2.5 cursor-pointer transition-all ${
                          checked ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-surface hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => setSelectedModules((prev) => prev.includes(module.key) ? prev.filter((item) => item !== module.key) : [...prev, module.key])}
                          className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-400 flex-shrink-0"
                        />
                        <module.icon size={16} className={`flex-shrink-0 ${checked ? 'text-brand-600' : 'text-ink-muted'}`} aria-hidden />
                        <span className="min-w-0">
                          <span className="block text-caption font-bold text-ink">{module.label}</span>
                          <span className="block text-micro text-ink-muted truncate">{module.description}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <span className="text-micro font-bold uppercase tracking-wide text-ink-secondary">Currency</span>
                  <p className="w-full h-11 rounded-field border border-slate-200 bg-surface-sunken px-3.5 text-body text-ink-secondary flex items-center">NGN — Nigerian Naira</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-micro font-bold uppercase tracking-wide text-ink-secondary">Timezone</span>
                  <p className="w-full h-11 rounded-field border border-slate-200 bg-surface-sunken px-3.5 text-body text-ink-secondary flex items-center">Africa/Lagos</p>
                </div>
              </div>

              {profileError && <FAlert type="error" message={profileError} onDismiss={() => setProfileError('')} />}

              <div className="flex gap-3 pt-2 sticky bottom-0 bg-surface pb-1">
                <Button variant="secondary" className="flex-1" onClick={() => setShowEditProfile(false)}>Cancel</Button>
                <Button className="flex-1" onClick={handleSaveProfile} loading={savingProfile}>
                  {savingProfile ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PLANS */}
      {showPlans && (
        <Card className="p-5">
          <SectionHeader
            title="Choose a plan"
            subtitle="Upgrade when your business outgrows the free limits."
            actionLabel="Close"
            onAction={() => setShowPlans(false)}
          />

          {/* Billing toggle */}
          <div className="flex justify-center mb-5">
            <div className="flex bg-surface-sunken rounded-field p-1 gap-1">
              <button onClick={() => setBilling('monthly')}
                className={`px-4 h-9 rounded-[0.5rem] text-caption font-bold transition-all ${billing === 'monthly' ? 'bg-surface shadow-sm text-brand-600' : 'text-ink-muted hover:text-ink-secondary'}`}>
                Monthly
              </button>
              <button onClick={() => setBilling('annual')}
                className={`px-4 h-9 rounded-[0.5rem] text-caption font-bold transition-all flex items-center gap-2 ${billing === 'annual' ? 'bg-surface shadow-sm text-brand-600' : 'text-ink-muted hover:text-ink-secondary'}`}>
                Annual
                <span className={`text-micro font-black px-1.5 py-0.5 rounded-full ${billing === 'annual' ? 'bg-positive-soft text-positive' : 'bg-surface-sunken text-ink-muted'}`}>Save 17%</span>
              </button>
            </div>
          </div>

          {planError && <FAlert type="error" message={planError} />}
          <div className="grid gap-4 sm:grid-cols-3">
            {(plans || []).map((plan) => {
              const price  = getPrice(plan);
              const label  = getLabel(plan);
              const struck = getOriginal(plan);
              const isCurrent = plan.id === user?.plan;
              return (
                <button key={plan.id} type="button" onClick={() => openConfirmUpgrade({ ...plan, selectedPrice: price, billing })}
                  className={`rounded-card border p-5 text-left transition-all relative hover:-translate-y-0.5 hover:shadow-md ${
                    isCurrent ? 'border-brand-400 bg-brand-50 shadow-ring' : 'border-slate-200 bg-surface hover:border-brand-300'
                  }`}>
                  {plan.badge && !isCurrent && (
                    <span className="absolute -top-2 left-4 bg-brand-500 text-white text-micro font-black px-2.5 py-0.5 rounded-full">{plan.badge}</span>
                  )}
                  {isCurrent && (
                    <span className="absolute -top-2 left-4 bg-positive text-white text-micro font-black px-2.5 py-0.5 rounded-full">Current plan</span>
                  )}
                  <p className="text-heading text-ink">{plan.name}</p>
                  <div className="mt-2 mb-3">
                    {struck && <p className="text-caption text-ink-muted line-through">{struck}</p>}
                    <p className="text-display text-ink">{label}</p>
                    {billing === 'annual' && plan.annualPrice && (
                      <p className="text-caption text-positive font-bold mt-0.5">2 months free 🎉</p>
                    )}
                  </div>
                  <p className="text-caption text-ink-muted">{plan.description}</p>
                </button>
              );
            })}
          </div>
          {planMessage && <FAlert type="info" message={planMessage} />}
        </Card>
      )}

      {/* CONFIRM UPGRADE MODAL */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/50 backdrop-blur-sm sm:p-6 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="w-full max-w-xl bg-surface rounded-t-card sm:rounded-card shadow-lg p-6 max-h-[92vh] overflow-y-auto animate-fade-in">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-micro font-bold uppercase tracking-widest text-ink-muted">Confirm plan upgrade</p>
                <h2 className="text-title text-ink mt-1">Upgrade to {selectedPlan.name}</h2>
              </div>
              <button type="button" onClick={() => setSelectedPlan(null)} aria-label="Cancel"
                className="p-2 rounded-full hover:bg-surface-sunken text-ink-muted transition-colors">
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-field border border-slate-200 p-4 bg-surface-muted">
                <p className="text-micro font-bold uppercase tracking-wide text-ink-muted">
                  {selectedPlan.billing === 'annual' ? 'Annual cost' : 'Monthly cost'}
                </p>
                {selectedPlan.billing === 'annual' && selectedPlan.annualPrice && (
                  <p className="text-caption text-ink-muted line-through mt-2">₦{(selectedPlan.price * 12).toLocaleString()}</p>
                )}
                <p className="mt-1 text-display text-ink">₦{(selectedPlan.selectedPrice || selectedPlan.price)?.toLocaleString()}</p>
                {selectedPlan.billing === 'annual' && selectedPlan.annualPrice && (
                  <p className="text-caption text-positive font-bold mt-1">You save ₦{((selectedPlan.price * 12) - selectedPlan.annualPrice).toLocaleString()} annually</p>
                )}
                <p className="text-caption text-ink-muted mt-2">Billed {selectedPlan.billing || 'monthly'}</p>
              </div>
              <div className="rounded-field border border-slate-200 p-4">
                <p className="text-micro font-bold uppercase tracking-wide text-ink-muted">Plan benefits</p>
                <ul className="mt-3 space-y-2 text-body text-ink-secondary">
                  {(selectedPlan.features || []).map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-500 flex-shrink-0" aria-hidden />
                      <span className="capitalize">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => setSelectedPlan(null)}>Cancel</Button>
              <Button onClick={confirmUpgrade} loading={isUpgrading}>
                {isUpgrading ? 'Upgrading…' : `Upgrade to ${selectedPlan.name}`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* LOGOUT */}
      <Button variant="danger" className="w-full" onClick={logout}>Log out</Button>
      <p className="text-center text-micro font-bold uppercase tracking-widest text-ink-faint">
        Flowora v1.0.4
      </p>
    </div>
  );
};

export default Settings;
