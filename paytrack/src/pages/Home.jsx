import React from 'react';
import DashboardCard from '../components/DashboardCard';
import { useStore } from '../store/useStore';

const Home = () => {
  const { user, dashboard } = useStore();

  const dashboardMetrics = [
    { title: 'Revenue', value: dashboard?.summary?.totalRevenue ? `₦${dashboard.summary.totalRevenue.toLocaleString()}` : '₦0', subtitle: 'Monthly total', accent: 'from-blue-500 to-cyan-500' },
    { title: 'Expenses', value: dashboard?.summary?.totalExpenses ? `₦${dashboard.summary.totalExpenses.toLocaleString()}` : '₦0', subtitle: 'This month', accent: 'from-red-500 to-rose-500' },
    { title: 'Profit', value: dashboard?.summary?.netProfit ? `₦${dashboard.summary.netProfit.toLocaleString()}` : '₦0', subtitle: 'Net income', accent: 'from-green-500 to-emerald-500' },
    { title: 'Transactions', value: dashboard?.summary?.transactionCount ?? '0', subtitle: 'Completed this month', accent: 'from-violet-500 to-indigo-500' },
    { title: 'Bookings', value: dashboard?.subscription?.usage?.monthlyBookings ?? '0', subtitle: 'Monthly bookings', accent: 'from-amber-500 to-orange-500' },
    { title: 'Services', value: dashboard?.subscription?.usage?.activeServices ?? '0', subtitle: 'Active services', accent: 'from-sky-500 to-blue-500' },
    { title: 'Events', value: dashboard?.subscription?.usage?.activeEvents ?? '0', subtitle: 'Active events', accent: 'from-fuchsia-500 to-pink-500' },
  ];

  return (
    <div className="bg-[#F5F7FA] min-h-screen pb-32">
      <div className="px-6 pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[#64748B] text-xs font-semibold uppercase tracking-widest">Welcome back</p>
            <h1 className="text-3xl font-black text-[#0F172A]">{user?.businessName || 'Your business'} Dashboard</h1>
          </div>
          <div className="inline-flex items-center gap-2 rounded-3xl bg-white px-4 py-3 shadow-sm">
            <div className="space-y-1 text-right">
              <span className="text-[#94A3B8] text-xs">Business type</span>
              <span className="rounded-full bg-[#E0F2FE] text-[#0C4A6E] text-[11px] font-bold px-3 py-1">
                {user?.businessType || 'Not selected'}
              </span>
            </div>
            <div className="space-y-1 text-right">
              <span className="text-[#94A3B8] text-xs">Plan</span>
              <span className="rounded-full bg-[#FEF3C7] text-[#92400E] text-[11px] font-bold px-3 py-1">
                {dashboard?.subscription?.plan?.name || 'Free'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {dashboardMetrics.map((metric) => (
          <DashboardCard key={metric.title} title={metric.title} value={metric.value} subtitle={metric.subtitle} accent={metric.accent} />
        ))}
      </div>

      <div className="px-6 mt-8 grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl bg-white p-6 shadow-sm border border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-bold">Subscription</p>
              <h2 className="text-lg font-black text-[#0F172A]">Plan & usage</h2>
            </div>
            <span className="text-[#2F5FB3] text-sm font-bold">{dashboard?.subscription?.plan?.badge || 'Free plan'}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 mb-4">
            <div className="rounded-2xl bg-[#F8FAFF] p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-bold">Monthly sales</p>
              <p className="mt-3 text-2xl font-black text-[#0F172A]">{dashboard?.subscription?.usage?.monthlySales ?? '0'}</p>
              <p className="text-xs text-[#64748B] mt-1">Limit: {dashboard?.subscription?.limits?.sales === null ? 'Unlimited' : dashboard?.subscription?.limits?.sales}</p>
            </div>
            <div className="rounded-2xl bg-[#F8FAFF] p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-bold">Monthly bookings</p>
              <p className="mt-3 text-2xl font-black text-[#0F172A]">{dashboard?.subscription?.usage?.monthlyBookings ?? '0'}</p>
              <p className="text-xs text-[#64748B] mt-1">Limit: {dashboard?.subscription?.limits?.bookings === null ? 'Unlimited' : dashboard?.subscription?.limits?.bookings}</p>
            </div>
            <div className="rounded-2xl bg-[#F8FAFF] p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-bold">Active events</p>
              <p className="mt-3 text-2xl font-black text-[#0F172A]">{dashboard?.subscription?.usage?.activeEvents ?? '0'}</p>
              <p className="text-xs text-[#64748B] mt-1">Limit: {dashboard?.subscription?.limits?.events === null ? 'Unlimited' : dashboard?.subscription?.limits?.events}</p>
            </div>
          </div>
          <p className="text-sm text-[#475569]">{dashboard?.subscription?.plan?.description || 'Your plan details will appear here once your dashboard loads.'}</p>
          <ul className="space-y-3 text-sm text-[#475569] mt-6">
            <li className="rounded-2xl bg-[#F8FAFF] p-4">Set up your first service and link it to bookings.</li>
            <li className="rounded-2xl bg-[#F8FAFF] p-4">Publish an event and invite attendees.</li>
            <li className="rounded-2xl bg-[#F8FAFF] p-4">Create an invoice for your latest booking.</li>
            <li className="rounded-2xl bg-[#F8FAFF] p-4">Review outstanding invoices and payments.</li>
          </ul>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm border border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-bold">Business snapshot</p>
              <h2 className="text-lg font-black text-[#0F172A]">Company info</h2>
            </div>
            <span className="text-[#64748B] text-sm">Updated recently</span>
          </div>
          <div className="grid gap-3 text-sm text-[#475569]">
            <div className="grid grid-cols-3 gap-4 rounded-2xl bg-[#F8FAFF] p-4">
              <span className="font-bold text-[#0F172A]">Phone</span>
              <span className="col-span-2">{user?.phone || 'Not set'}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 rounded-2xl bg-[#F8FAFF] p-4">
              <span className="font-bold text-[#0F172A]">Currency</span>
              <span className="col-span-2">{user?.currency || 'Not set'}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 rounded-2xl bg-[#F8FAFF] p-4">
              <span className="font-bold text-[#0F172A]">Timezone</span>
              <span className="col-span-2">{user?.timezone || 'Not set'}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 rounded-2xl bg-[#F8FAFF] p-4">
              <span className="font-bold text-[#0F172A]">Bank</span>
              <span className="col-span-2">{user?.bankAccount || 'Not set'}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;