import React, { useState } from 'react';
import { Check, ChevronDown, Calendar, Receipt, TrendingDown, BarChart2, Users, Heart } from 'lucide-react';
import screenshotHome from '../assets/screenshot-home.png';
import screenshotBookings from '../assets/screenshot-bookings.png';
import screenshotInvoices from '../assets/screenshot-invoices.png';

const BUSINESS_PROFILES = [
  {
    id: 'therapist',
    label: 'Therapist',
    tagline: 'Clients booked, sessions paid, notes tracked.',
    modules: ['Bookings', 'Payments', 'Clients', 'Reports'],
  },
  {
    id: 'salon',
    label: 'Salon',
    tagline: 'Walk-ins and appointments, one calendar.',
    modules: ['Bookings', 'Payments', 'Services', 'Reports'],
  },
  {
    id: 'consultant',
    label: 'Consultant',
    tagline: 'Bill clients and get paid on time, every time.',
    modules: ['Invoices', 'Payments', 'Clients', 'Reports'],
  },
  {
    id: 'church',
    label: 'Church',
    tagline: 'Donations recorded, events organized, books balanced.',
    modules: ['Donations', 'Events', 'Expenses', 'Reports'],
  },
  {
    id: 'agency',
    label: 'Agency',
    tagline: 'Invoice clients, track spend, see your margin.',
    modules: ['Invoices', 'Expenses', 'Payments', 'Reports'],
  },
];

const PROBLEMS = [
  {
    icon: Calendar,
    title: 'Bookings live in your head',
    body: 'Double-bookings and missed appointments happen when your calendar is a notebook or a WhatsApp thread.',
  },
  {
    icon: Receipt,
    title: 'Invoices take too long',
    body: 'Typing out the same invoice in Word every time costs you hours you could spend on clients.',
  },
  {
    icon: TrendingDown,
    title: "You don't know your real profit",
    body: 'Revenue without expenses tracked next to it is a guess, not a number you can plan around.',
  },
  {
    icon: BarChart2,
    title: 'No single place to check numbers',
    body: "Sales in one app, expenses in a notebook, bookings in your DMs \u2014 nothing talks to each other.",
  },
];

const FAQS = [
  {
    q: 'Is FloworaX really free to start?',
    a: 'Yes. The Free plan includes sales, services, bookings, finance tracking, and reports, no card required. Upgrade to Pro or Business anytime you need higher limits or extra features like invoices, events, and staff tools.',
  },
  {
    q: 'My business is not on the list. Does FloworaX still work for me?',
    a: 'Yes. During setup you choose the business type closest to yours, and FloworaX turns on the modules that make sense \u2014 you can also just use the core tools like payments, invoicing, and reports directly.',
  },
  {
    q: 'Can I switch my business type later?',
    a: 'Yes, any time from Settings. Your data stays intact \u2014 only which modules are visible on your dashboard changes.',
  },
  {
    q: 'How do payments work?',
    a: 'Payments are processed through Paystack, so your customers can pay by card, bank transfer, or USSD, and funds settle to your linked bank account.',
  },
  {
    q: 'Do you take a cut of my sales?',
    a: 'FloworaX itself does not add a markup on top of standard Paystack processing fees. What you see is what Paystack charges for payment processing.',
  },
  {
    q: 'Is my customers\u2019 data safe?',
    a: 'Payment details are handled entirely by Paystack\u2019s secure infrastructure \u2014 FloworaX never stores card numbers. Your business records are protected behind your login.',
  },
];

const Welcome = ({ onGetStarted, onSignIn }) => {
  const [activeProfile, setActiveProfile] = useState(BUSINESS_PROFILES[0]);
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="min-h-screen bg-white">
      {/* ── NAV ── */}
      <nav className="px-6 lg:px-10 py-5 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-[#185FA5] rounded-xl flex items-center justify-center text-white font-black text-sm">
            FL
          </div>
          <span className="font-black text-[#0F172A] text-lg tracking-tight">FloworaX</span>
        </div>
        <button
          onClick={onSignIn}
          className="text-[#185FA5] font-bold text-sm px-4 py-2 rounded-xl hover:bg-[#F1F5F9] transition-colors"
        >
          Sign In
        </button>
      </nav>

      {/* ── HERO ── */}
      <section className="px-6 lg:px-10 pt-10 pb-20 max-w-6xl mx-auto">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#EEF4FF] text-[#185FA5] text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#185FA5]" />
              Built for Nigerian service businesses
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-[#0F172A] leading-[1.1] tracking-tight mb-5">
              One dashboard that adapts to your business.
            </h1>
            <p className="text-[#64748B] text-base lg:text-lg leading-relaxed max-w-md mb-8">
              Accept payments, manage bookings, send invoices, and track every naira in and out, all in one place, built for how your business actually runs.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onGetStarted}
                className="bg-[#185FA5] text-white px-7 py-4 rounded-2xl font-black text-sm shadow-lg shadow-blue-200 active:scale-95 transition-all"
              >
                Get Started Free
              </button>
              <button
                onClick={onSignIn}
                className="bg-[#F1F5F9] text-[#0F172A] px-7 py-4 rounded-2xl font-black text-sm active:scale-95 transition-all"
              >
                Sign In
              </button>
            </div>
            <p className="text-[#94A3B8] text-xs font-medium mt-4">No credit card required &middot; Free plan available forever</p>
          </div>

          {/* SIGNATURE: interactive business-type switcher */}
          <div className="bg-[#F8FAFF] rounded-3xl border border-[#E2E8F0] p-6 lg:p-7">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4">
              See it for your business
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              {BUSINESS_PROFILES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActiveProfile(p)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeProfile.id === p.id
                      ? 'bg-[#185FA5] text-white shadow-md shadow-blue-200'
                      : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:border-[#185FA5]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live preview</p>
              </div>
              <p className="font-black text-[#0F172A] text-lg mb-1">{activeProfile.label} Dashboard</p>
              <p className="text-[#64748B] text-xs mb-5">{activeProfile.tagline}</p>
              <div className="grid grid-cols-2 gap-2">
                {activeProfile.modules.map((m) => (
                  <div key={m} className="bg-[#F8FAFF] rounded-xl px-3 py-2.5 text-center">
                    <span className="text-[#185FA5] font-bold text-xs">{m}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR (marquee) ── */}
      <section className="py-4 max-w-6xl mx-auto overflow-hidden">
        <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-6 px-6">
          Built for service businesses like
        </p>
        <div className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10" />
          <div className="flex gap-2.5 marquee-track">
            {[...Array(2)].map((_, dupIndex) => (
              <div key={dupIndex} className="flex gap-2.5 flex-shrink-0">
                {['Therapists', 'Consultants', 'Coaches', 'Lawyers', 'Doctors', 'Tutors', 'Salons', 'Fitness Trainers', 'Agencies', 'Churches', 'NGOs', 'Contractors'].map((t) => (
                  <span key={`${dupIndex}-${t}`} className="bg-[#F1F5F9] text-[#475569] text-xs font-semibold px-3.5 py-2 rounded-full whitespace-nowrap flex-shrink-0">
                    {t}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
        <style>{`
          .marquee-track {
            width: max-content;
            animation: marquee-scroll 28s linear infinite;
          }
          @keyframes marquee-scroll {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
        `}</style>
      </section>

      {/* ── PROBLEMS ── */}
      <section className="px-6 lg:px-10 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[#185FA5] text-xs font-black uppercase tracking-[0.25em] mb-3">The problem</p>
          <h2 className="text-3xl lg:text-4xl font-black text-[#0F172A] tracking-tight max-w-lg mx-auto">
            Running a business shouldn&rsquo;t mean juggling five apps
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {PROBLEMS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-[#EEF4FF] flex items-center justify-center mb-4">
                <Icon size={20} className="text-[#185FA5]" />
              </div>
              <p className="font-black text-[#0F172A] text-base mb-2">{title}</p>
              <p className="text-[#64748B] text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRODUCT PREVIEW (mockup cards, not fake screenshots) ── */}
      <section className="px-6 lg:px-10 py-20 bg-[#F8FAFF]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#185FA5] text-xs font-black uppercase tracking-[0.25em] mb-3">Inside FloworaX</p>
            <h2 className="text-3xl lg:text-4xl font-black text-[#0F172A] tracking-tight">
              Everything in one dashboard
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {[
              { img: screenshotHome, icon: BarChart2, iconBg: 'bg-[#EEF4FF]', iconColor: 'text-[#185FA5]', title: 'Real-time reports', body: 'Revenue, expenses, and net profit calculated live from every sale and cost you log.' },
              { img: screenshotBookings, icon: Calendar, iconBg: 'bg-[#FEF3C7]', iconColor: 'text-amber-600', title: 'Online bookings', body: 'Clients book straight into your calendar, with payment collected up front through Paystack.' },
              { img: screenshotInvoices, icon: Receipt, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', title: 'Invoices in seconds', body: 'Create, send, and track invoices, with a clear view of what\u2019s outstanding.' },
            ].map(({ img, icon: Icon, iconBg, iconColor, title, body }) => (
              <div key={title} className="bg-white rounded-3xl border border-[#E2E8F0] overflow-hidden shadow-sm">
                {/* Browser-frame screenshot */}
                <div className="bg-[#0F172A] px-3 py-2.5 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <div className="h-44 overflow-hidden bg-[#F8FAFF]">
                  <img
                    src={img}
                    alt={`${title} screenshot`}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="p-6">
                  <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center mb-4`}>
                    <Icon size={20} className={iconColor} />
                  </div>
                  <p className="font-black text-[#0F172A] text-base mb-2">{title}</p>
                  <p className="text-[#64748B] text-sm leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING (real plan data) ── */}
      <section className="px-6 lg:px-10 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[#185FA5] text-xs font-black uppercase tracking-[0.25em] mb-3">Pricing</p>
          <h2 className="text-3xl lg:text-4xl font-black text-[#0F172A] tracking-tight mb-3">
            Start free, upgrade when you grow
          </h2>
          <p className="text-[#64748B] text-sm max-w-md mx-auto">No hidden fees. Cancel any time.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Free */}
          <div className="bg-white rounded-3xl border border-[#E2E8F0] p-7 flex flex-col">
            <p className="text-xs font-black text-[#94A3B8] uppercase tracking-widest mb-2">Best for starters</p>
            <p className="font-black text-[#0F172A] text-xl mb-1">Free</p>
            <p className="text-3xl font-black text-[#0F172A] mb-6">&#8358;0<span className="text-sm text-[#94A3B8] font-bold">/month</span></p>
            <ul className="space-y-3 mb-8 flex-1">
              {['50 sales / month', '40 bookings / month', '8 active services', 'Finance tracking', 'Reports'].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-[#475569]">
                  <Check size={16} className="text-[#185FA5] flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <button onClick={onGetStarted} className="w-full bg-[#F1F5F9] text-[#0F172A] py-3.5 rounded-2xl font-black text-sm active:scale-95 transition-all">
              Get Started Free
            </button>
          </div>

          {/* Pro */}
          <div className="bg-[#0F172A] rounded-3xl p-7 flex flex-col relative overflow-hidden">
            <div className="absolute top-5 right-5 bg-[#185FA5] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
              Most popular
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Pro</p>
            <p className="font-black text-white text-xl mb-1">Pro</p>
            <p className="text-3xl font-black text-white mb-6">&#8358;2,000<span className="text-sm text-slate-400 font-bold">/month</span></p>
            <ul className="space-y-3 mb-8 flex-1">
              {['500 sales / month', '200 bookings / month', '20 active services', 'Invoices', 'Events', 'Advanced reports'].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                  <Check size={16} className="text-[#185FA5] flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <button onClick={onGetStarted} className="w-full bg-[#185FA5] text-white py-3.5 rounded-2xl font-black text-sm active:scale-95 transition-all">
              Get Started
            </button>
            <p className="text-center text-slate-500 text-[11px] font-medium mt-3">Starts on Free &middot; upgrade anytime from Settings</p>
          </div>
          <div className="bg-white rounded-3xl border border-[#E2E8F0] p-7 flex flex-col">
            <p className="text-xs font-black text-[#94A3B8] uppercase tracking-widest mb-2">Enterprise</p>
            <p className="font-black text-[#0F172A] text-xl mb-1">Business</p>
            <p className="text-3xl font-black text-[#0F172A] mb-6">&#8358;4,000<span className="text-sm text-[#94A3B8] font-bold">/month</span></p>
            <ul className="space-y-3 mb-8 flex-1">
              {['Unlimited sales', 'Unlimited bookings', 'Unlimited services', 'Invoices & events', 'Staff features', 'Premium support'].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-[#475569]">
                  <Check size={16} className="text-[#185FA5] flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <button onClick={onGetStarted} className="w-full bg-[#F1F5F9] text-[#0F172A] py-3.5 rounded-2xl font-black text-sm active:scale-95 transition-all">
              Get Started
            </button>
            <p className="text-center text-[#94A3B8] text-[11px] font-medium mt-3">Starts on Free &middot; upgrade anytime from Settings</p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-6 lg:px-10 py-20 bg-[#F8FAFF]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[#185FA5] text-xs font-black uppercase tracking-[0.25em] mb-3">FAQ</p>
            <h2 className="text-3xl font-black text-[#0F172A] tracking-tight">Questions, answered</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((item, i) => (
              <div key={item.q} className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="font-bold text-[#0F172A] text-sm pr-4">{item.q}</span>
                  <ChevronDown
                    size={18}
                    className={`text-[#94A3B8] flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-[#64748B] text-sm leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="px-6 lg:px-10 py-20 max-w-6xl mx-auto text-center">
        <div className="bg-[#0F172A] rounded-3xl px-8 py-14 lg:py-16">
          <Heart size={28} className="text-[#185FA5] mx-auto mb-5" />
          <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tight mb-4 max-w-lg mx-auto">
            Your business, one dashboard away
          </h2>
          <p className="text-slate-400 text-sm max-w-sm mx-auto mb-8">
            Join service businesses across Nigeria running bookings, payments, and finance from one place.
          </p>
          <button
            onClick={onGetStarted}
            className="bg-[#185FA5] text-white px-8 py-4 rounded-2xl font-black text-sm shadow-lg shadow-blue-900/30 active:scale-95 transition-all"
          >
            Get Started Free
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-6 lg:px-10 py-8 max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#F1F5F9]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#185FA5] rounded-lg flex items-center justify-center text-white font-black text-[11px]">
            FL
          </div>
          <span className="font-bold text-[#0F172A] text-sm">FloworaX</span>
        </div>
        <div className="flex items-center gap-5 text-xs font-bold text-[#64748B]">
        <a href="/terms" className="hover:text-[#185FA5]">Terms</a>
        <a href="/privacy" className="hover:text-[#185FA5]">Privacy</a>
        <a href="/cookies" className="hover:text-[#185FA5]">Cookies</a>
        <a href="/contact" className="hover:text-[#185FA5]">Contact</a>
      </div>
      <p className="text-[#94A3B8] text-xs font-medium">&copy; {new Date().getFullYear()} FloworaX. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Welcome;
