import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';

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
  const { user, setBusinessType, setActiveTab } = useStore();
  const [selected, setSelected] = useState(user?.businessType || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const handleContinue = async () => {
    if (!selected) {
      setError('Please choose your organization type.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const result = await setBusinessType(selected);
      console.log('Business type saved:', result.user);
      setActiveTab('home');
      setSaved(true);
    } catch (err) {
      console.error('Business type save failed:', err);
      setError(err.message || 'Unable to save your selection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (saved) {
      window.location.replace('/');
    }
  }, [saved]);

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col">
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-[#185FA5] text-white text-3xl font-black mb-4">
            FL
          </div>
          <p className="text-sm font-bold text-[#2F5FB3] uppercase tracking-[0.3em] mb-3">Welcome to FloworaX</p>
          <h1 className="text-3xl lg:text-4xl font-black text-[#0F172A] mb-4">What type of organization are you managing?</h1>
          <p className="max-w-2xl mx-auto text-[#64748B] text-sm leading-relaxed">
            Pick the option that best matches your organization. We’ll enable the right modules and hide the rest.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {options.map((option) => {
            const active = selected === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelected(option.value)}
                className={`rounded-3xl border p-6 text-left transition-all focus:outline-none ${
                  active
                    ? 'border-[#2F5FB3] bg-white shadow-lg shadow-blue-200/40'
                    : 'border-[#E2E8F0] bg-white hover:border-[#2F5FB3]'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <p className="text-lg font-black text-[#0F172A] mb-0">{option.title}</p>
                      {option.recommended && (
                        <span className="inline-flex items-center rounded-full bg-[#FDE68A] text-[#92400E] text-[11px] font-bold px-2.5 py-1">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#64748B] leading-relaxed mb-4">{option.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {option.categories?.map((item) => (
                        <span key={item} className="rounded-full border border-[#E2E8F0] bg-[#F8FAFF] px-3 py-1 text-[11px] font-semibold text-[#475569]">
                          {item}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {option.features?.map((feature) => (
                        <span key={feature} className="rounded-2xl bg-[#EFF6FF] text-[#1D4ED8] px-3 py-1 text-[12px] font-semibold">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                  {active && <span className="inline-flex items-center justify-center rounded-full bg-[#2F5FB3] text-white w-9 h-9">✓</span>}
                </div>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mt-6 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <div className="text-sm text-[#64748B]">You can change this later in settings.</div>
          <button
            onClick={handleContinue}
            disabled={!selected || loading}
            className="w-full sm:w-auto bg-[#185FA5] text-white px-6 py-3 rounded-2xl font-black text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessTypeOnboarding;
