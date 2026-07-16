import React, { useState } from 'react';
import { useStore } from '../store/useStore';

const MODULE_OPTIONS = [
  { key: 'customers', label: 'Customers', icon: '\ud83d\udc65', description: 'Manage your clients' },
  { key: 'sales', label: 'Sales', icon: '\ud83d\udcb5', description: 'Record and track sales' },
  { key: 'bookings', label: 'Bookings', icon: '\ud83d\udcc5', description: 'Accept appointments online' },
  { key: 'events', label: 'Events', icon: '\ud83c\udf9f\ufe0f', description: 'Sell tickets and manage attendees' },
  { key: 'finance', label: 'Finance', icon: '\ud83d\udcb0', description: 'Track income and expenses' },
  { key: 'reports', label: 'Reports', icon: '\ud83d\udcca', description: 'See performance at a glance' },
  { key: 'invoices', label: 'Invoices', icon: '\ud83e\uddfe', description: 'Bill clients and get paid' },
];

const DEFAULT_MODULES = ['sales', 'customers', 'reports'];

const getModulesForBusinessType = (businessType) => {
  const key = (businessType || '').toLowerCase();
  if (['health_wellness', 'professional_services'].includes(key)) return ['bookings', 'customers', 'invoices', 'finance', 'reports', 'events'];
  if (key === 'education_nonprofits') return ['events', 'customers', 'invoices', 'finance', 'reports'];
  if (key === 'business_retail') return ['sales', 'customers', 'invoices', 'finance', 'reports'];
  if (key === 'complete_business_os') return MODULE_OPTIONS.map((option) => option.key);
  return DEFAULT_MODULES;
};

const options = [
  {
    value: 'health_wellness',
    title: '🩺 Health & Wellness',
    description: 'Clinics, therapists, dentists, and gyms that need appointments, patients, and payments.',
    categories: ['Clinics', 'Therapists', 'Dentists', 'Gyms'],
    features: ['Appointments', 'Patients', 'Payments'],
  },
  {
    value: 'professional_services',
    title: '💼 Professional Services',
    description: 'Consultants, lawyers, agencies, and freelancers focused on clients, invoices, and projects.',
    categories: ['Consultants', 'Lawyers', 'Agencies', 'Freelancers'],
    features: ['Clients', 'Invoices', 'Payments', 'Projects'],
  },
  {
    value: 'education_nonprofits',
    title: '🎓 Education & Nonprofits',
    description: 'Schools, NGOs, and churches that manage events, registrations, donations, and reports.',
    categories: ['Schools', 'NGOs', 'Churches'],
    features: ['Events', 'Registrations', 'Donations', 'Reports'],
  },
  {
    value: 'business_retail',
    title: '🏢 Business & Retail',
    description: 'Stores, SMEs, and companies that need finance, invoices, customers, and reports.',
    categories: ['Stores', 'SMEs', 'Companies'],
    features: ['Finance', 'Invoices', 'Customers', 'Reports'],
  },
  {
    value: 'complete_business_os',
    title: '⚙️ Complete Business OS ⭐',
    description: 'Everything enabled: CRM, services, events, appointments, payments, finance, reports, automation.',
    categories: ['CRM', 'Services', 'Events', 'Appointments', 'Payments', 'Finance', 'Reports', 'Automation'],
    recommended: true,
  },
];

const BusinessTypeOnboarding = () => {
  const { user, updateBusinessProfile, setActiveTab } = useStore();
  const [form, setForm] = useState({
    businessName: user?.businessName || '',
    businessType: user?.businessType || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: user?.address || '',
    bankAccount: user?.bankAccount || '',
    currency: user?.currency || 'NGN',
    timezone: user?.timezone || '',
    logo: user?.profileImage || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedModules, setSelectedModules] = useState(() => getModulesForBusinessType(user?.businessType || ''));

  const businessTypes = [
    'Consultant',
    'Church',
    'Clinic',
    'School',
    'Agency',
    'Freelancer',
    'Other',
  ];

  const currencies = ['NGN'];
  const timezones = ['Africa/Lagos'];

  const handleChange = (field, value) => {
    setError('');
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, logo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleModuleToggle = (moduleKey) => {
    setSelectedModules((prev) => prev.includes(moduleKey) ? prev.filter((item) => item !== moduleKey) : [...prev, moduleKey]);
  };

  const handleContinue = async () => {
    const requiredFields = ['businessName', 'businessType', 'phone', 'address', 'bankAccount', 'currency', 'timezone'];
    const missing = requiredFields.filter((field) => !form[field]?.toString().trim());
    if (missing.length > 0) {
      setError('Please fill in all required fields before continuing.');
      return;
    }

    setLoading(true);
    try {
      await updateBusinessProfile({
        businessName: form.businessName,
        businessType: form.businessType,
        modules: selectedModules,
        phone: form.phone,
        address: form.address,
        bankAccount: form.bankAccount,
        currency: form.currency,
        timezone: form.timezone,
        profileImage: form.logo,
      });
      setActiveTab('home');
    } catch (err) {
      console.error('Business profile save failed:', err);
      setError(err.message || 'Unable to save your business profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col">
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-[#185FA5] text-white text-3xl font-black mb-4">
            FL
          </div>
          <p className="text-sm font-bold text-[#2F5FB3] uppercase tracking-[0.3em] mb-3">Business Setup</p>
          <h1 className="text-3xl lg:text-4xl font-black text-[#0F172A] mb-4">Complete your business profile</h1>
          <p className="max-w-2xl mx-auto text-[#64748B] text-sm leading-relaxed">
            Enter your business details now so the dashboard, invoices, and events are configured correctly.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Business Name</span>
                <input
                  value={form.businessName}
                  onChange={(e) => handleChange('businessName', e.target.value)}
                  className="mt-2 w-full rounded-3xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm outline-none focus:border-[#185FA5]"
                  placeholder="My Business"
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Business Category</span>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {options.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleChange("businessType", opt.value)}
                      className={"text-left rounded-2xl border p-4 transition " + (form.businessType === opt.value ? "border-[#185FA5] bg-[#EFF6FF]" : "border-[#E2E8F0] bg-white")}
                    >
                      <p className="font-black text-sm text-[#0F172A]">{opt.title}</p>
                      <p className="text-xs text-[#64748B] mt-1">{opt.description}</p>
                    </button>
                  ))}
                </div>
              </label>
            </div>

            <div className="rounded-3xl border border-[#E2E8F0] bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Step 2</p>
                  <h2 className="mt-1 text-lg font-black text-[#0F172A]">Choose your modules</h2>
                  <p className="mt-1 text-sm text-[#64748B]">These are pre-filled based on your business type, but you can edit them anytime from Settings.</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {MODULE_OPTIONS.map((module) => {
                  const checked = selectedModules.includes(module.key);
                  return (
                    <label key={module.key} className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 transition ${checked ? 'border-[#185FA5] bg-[#EFF6FF]' : 'border-[#E2E8F0] bg-white'}`}>
                      <span className="text-xl leading-none mr-3">{module.icon}</span><span className="text-sm font-semibold text-[#0F172A]">{module.label}<br/><span className="text-xs font-normal text-[#64748B]">{module.description}</span></span>
                      <input type="checkbox" checked={checked} onChange={() => handleModuleToggle(module.key)} className="h-4 w-4 rounded border-slate-300 text-[#185FA5] focus:ring-[#185FA5]" />
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Phone</span>
                <input
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="mt-2 w-full rounded-3xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm outline-none focus:border-[#185FA5]"
                  placeholder="+234 800 000 0000"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Email</span>
                <input
                  value={form.email}
                  disabled
                  className="mt-2 w-full rounded-3xl border border-[#E2E8F0] bg-[#F8FAFF] px-4 py-3 text-sm text-slate-500 outline-none"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Address</span>
              <textarea
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                rows={3}
                className="mt-2 w-full rounded-3xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm outline-none focus:border-[#185FA5]"
                placeholder="Street, city, state"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Bank Account</span>
                <input
                  value={form.bankAccount}
                  onChange={(e) => handleChange('bankAccount', e.target.value)}
                  className="mt-2 w-full rounded-3xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm outline-none focus:border-[#185FA5]"
                  placeholder="Account name / number"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Currency</span>
                <select
                  value={form.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  className="mt-2 w-full rounded-3xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm outline-none focus:border-[#185FA5]"
                >
                  {currencies.map((currency) => (
                    <option key={currency} value={currency}>{currency}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Timezone</span>
              <select
                value={form.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
                className="mt-2 w-full rounded-3xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm outline-none focus:border-[#185FA5]"
              >
                <option value="">Choose timezone</option>
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </label>

            {error && (
              <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between sm:items-center">
              <p className="text-sm text-[#64748B]">You can update this later in settings.</p>
              <button
                onClick={handleContinue}
                disabled={loading}
                className="w-full sm:w-auto bg-[#185FA5] text-white px-6 py-3 rounded-2xl font-black text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                {loading ? 'Saving...' : 'Continue'}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-bold mb-4">Logo</p>
              <div className="flex items-center justify-center rounded-3xl border border-dashed border-[#CBD5E1] bg-[#F8FAFF] h-52">
                {form.logo ? (
                  <img src={form.logo} alt="Business logo" className="h-full object-contain" />
                ) : (
                  <div className="text-center text-sm text-slate-500">
                    Upload a logo to personalize your dashboard.
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="mt-4 w-full text-sm text-slate-500" />
            </div>

            <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-bold mb-4">Why this matters</p>
              <ul className="space-y-3 text-sm text-[#475569]">
                <li>• Your business profile helps invoices and reports look professional.</li>
                <li>• Currency and timezone ensure revenue and booking times are accurate.</li>
                <li>• A bank account improves future payout flows and payment setup.</li>
                <li>• Business type enables the right modules for your industry.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessTypeOnboarding;
