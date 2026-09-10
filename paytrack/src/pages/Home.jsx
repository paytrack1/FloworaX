import React, { useEffect, useState } from 'react';
import FSpinner from '../components/FSpinner';
import DashboardCard from '../components/DashboardCard';
import { useStore } from '../store/useStore';
import BulkOffering from './BulkOffering';

const Home = () => {
  const [showBulk, setShowBulk] = useState(false);
  const { user, dashboard, fetchDashboard } = useStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchDashboard(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  };

  if (showBulk) return <BulkOffering onBack={() => setShowBulk(false)} />;

  const dashboardMetrics = [
    { title: 'Revenue', value: dashboard?.summary?.totalRevenue ? `₦${dashboard.summary.totalRevenue.toLocaleString()}` : '₦0', subtitle: 'Monthly total', accent: 'from-blue-500 to-cyan-500' },
    { title: 'Expenses', value: dashboard?.summary?.totalExpenses ? `₦${dashboard.summary.totalExpenses.toLocaleString()}` : '₦0', subtitle: 'This month', accent: 'from-red-500 to-rose-500' },
    { title: 'Profit', value: dashboard?.summary?.netProfit ? `₦${dashboard.summary.netProfit.toLocaleString()}` : '₦0', subtitle: 'This month', accent: 'from-green-500 to-emerald-500' },
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
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-[#0F172A]">{user?.businessName || 'Your business'} Dashboard</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Offering Button - visible for Church business type */}
      {user?.businessType?.toLowerCase() === 'church' && (
        <div className="px-6 mt-4">
          <button
            onClick={() => setShowBulk(true)}
            className="w-full bg-[#185FA5] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
          >
            <span className="text-xl">🙏</span> Bulk Offering Entry
          </button>
        </div>
      )}
      <div className="px-6 mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {dashboardMetrics.map((metric) => (
          <DashboardCard key={metric.title} title={metric.title} value={metric.value} subtitle={metric.subtitle} accent={metric.accent} />
        ))}
      </div>

    </div>
  );
};

export default Home;
