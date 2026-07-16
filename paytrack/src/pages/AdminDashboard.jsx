import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';

export default function AdminDashboard() {
  const { adminData, adminError, fetchAdminDashboard } = useStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAdminDashboard();
  }, [fetchAdminDashboard]);

  if (adminError) {
    return (
      <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200">
        <h2 className="font-bold mb-2">Access Error</h2>
        <p>{adminError}</p>
      </div>
    );
  }

  if (!adminData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-4 border-[#185FA5] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500">Retrieving system diagnostics...</p>
      </div>
    );
  }

  const { metrics, users } = adminData;

  const filteredUsers = users.filter(usr =>
    usr.email?.toLowerCase().includes(search.toLowerCase()) ||
    usr.businessName?.toLowerCase().includes(search.toLowerCase())
  );

  const planBadgeClass = (plan) => {
    if (plan === 'business') return 'bg-purple-100 text-purple-700';
    if (plan === 'pro') return 'bg-blue-100 text-blue-700';
    return 'bg-slate-100 text-slate-600';
  };

  const formatCurrency = (n) => `₦${(n || 0).toLocaleString()}`;

  const planEntries = Object.entries(metrics.planBreakdown || {});
  const topBusinessTypes = metrics.topBusinessTypes || [];

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Registered', val: metrics.totalUsers, bg: 'bg-blue-500/10 text-blue-700' },
          { label: 'Active (30d)', val: metrics.activeUsers, bg: 'bg-cyan-500/10 text-cyan-700' },
          { label: 'New This Month', val: metrics.newSignupsThisMonth, bg: 'bg-indigo-500/10 text-indigo-700' },
          { label: 'Premium Users', val: metrics.premiumUsers, bg: 'bg-emerald-500/10 text-emerald-700' },
          { label: 'Verified Users', val: metrics.verifiedUsers, bg: 'bg-green-500/10 text-green-700' },
          { label: 'Platform Sales', val: metrics.totalSales, bg: 'bg-purple-500/10 text-purple-700' },
          { label: 'Total Bookings', val: metrics.totalBookings, bg: 'bg-amber-500/10 text-amber-700' },
          { label: 'Total Events', val: metrics.totalEvents, bg: 'bg-rose-500/10 text-rose-700' },
        ].map((m, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{m.label}</span>
            <span className={`text-2xl font-black mt-2 self-start px-2 py-0.5 rounded-lg ${m.bg}`}>
              {m.val}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-black text-slate-800 mb-4">Subscription Breakdown</h2>
          <div className="space-y-3">
            {planEntries.length === 0 && <p className="text-sm text-slate-400">No plan data yet.</p>}
            {planEntries.map(([plan, count]) => (
              <div key={plan} className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded-md text-xs font-black uppercase ${planBadgeClass(plan)}`}>
                  {plan}
                </span>
                <span className="text-sm font-bold text-slate-700">{count} users</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-black text-slate-800 mb-4">Top Business Types</h2>
          <div className="space-y-3">
            {topBusinessTypes.length === 0 && <p className="text-sm text-slate-400">No business type data yet.</p>}
            {topBusinessTypes.map((t) => (
              <div key={t.type} className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-600 capitalize">{t.type}</span>
                <span className="text-sm font-bold text-slate-700">{t.count} users</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-800">User Directory</h2>
            <p className="text-xs text-slate-400">View and manage registered accounts</p>
          </div>
          <input
            type="text"
            placeholder="Search email or business..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-xs"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs text-slate-400 uppercase font-bold">
              <tr>
                <th className="px-6 py-4">Business Name / Email</th>
                <th className="px-6 py-4">Plan Status</th>
                <th className="px-6 py-4">Setup Complete?</th>
                <th className="px-6 py-4">Date Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((usr) => (
                <tr key={usr._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{usr.businessName || 'No Business Name'}</p>
                    <p className="text-xs text-slate-400">{usr.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-black uppercase ${planBadgeClass(usr.plan)}`}>
                      {usr.plan || 'free'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${usr.emailVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {usr.emailVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400">
                    {new Date(usr.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}