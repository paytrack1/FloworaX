import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { fetchFinancialSummary } from '../api/financial';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Reports = () => {
  const { token, sales, fetchSales } = useStore();
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    cashFlow: 0,
    transactionCount: 0,
    invoiceTotals: { total: 0, paid: 0, outstanding: 0 },
  });

  useEffect(() => {
    if (!token) return;
    fetchSales();
  }, [token, fetchSales]);

  useEffect(() => {
    if (!token) return;
    const loadSummary = async () => {
      try {
        const summaryData = await fetchFinancialSummary(token);
        setSummary(summaryData);
      } catch (err) {
        console.error('Failed to load financial summary:', err);
      }
    };
    loadSummary();
  }, [token]);

  // Derived stats
  const total     = summary.totalRevenue;
  const count     = summary.transactionCount;
  const avg       = count > 0 ? Math.round(total / count) : 0;
  const netProfit = summary.netProfit;
  const verified  = sales.filter((s) => s.verified).length;

  // Real chart data grouped by day of week
  const daySales  = Array(7).fill(0);
  sales.forEach((s) => {
    const day = new Date(s.createdAt).getDay();
    daySales[day] += s.total;
  });
  const maxVal     = Math.max(...daySales, 1);
  const todayIndex = new Date().getDay();

  return (
    <div className="bg-[#F5F7FA] min-h-screen pb-32">
      {/* Header */}
      <div className="p-6 bg-white border-b border-[#E2E8F0] shadow-sm">
        <h1 className="text-xl font-black text-[#0F172A]">Sales Reports</h1>
        <p className="text-[#94A3B8] text-xs font-medium mt-0.5">All-time performance</p>
      </div>

      <div className="p-6 flex flex-col gap-4">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total Revenue',   value: `₦${total.toLocaleString()}`,              color: '#0F172A' },
            { label: 'Total Sales',     value: count,                                      color: '#0F172A' },
            { label: 'Avg Sale Value',  value: `₦${avg.toLocaleString()}`,                color: '#185FA5' },
            { label: 'Net Profit',      value: `₦${Math.round(netProfit).toLocaleString()}`, color: '#15803D' },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-sm">
              <p className="text-[#94A3B8] text-[11px] font-semibold uppercase tracking-wide mb-1">
                {kpi.label}
              </p>
              <p className="font-black text-lg" style={{ color: kpi.color }}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Verification Stats */}
        <div className="bg-[#185FA5] p-5 rounded-2xl text-white flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-[11px] font-semibold uppercase tracking-widest mb-1">
              Paystack Verification Rate
            </p>
            <p className="text-4xl font-black">
              {count > 0 ? ((verified / count) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-blue-200 text-xs mt-1 font-medium">
              {verified} of {count} sales verified
            </p>
          </div>
          <div className="text-5xl opacity-20">✓</div>
        </div>

        {/* Real Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h4 className="text-[#0F172A] font-bold text-sm">Revenue by Day</h4>
            <span className="text-[#94A3B8] text-[11px] font-medium">This week</span>
          </div>

          {count === 0 ? (
            <div className="flex items-center justify-center h-32 text-[#CBD5E1] text-sm">
              No data yet
            </div>
          ) : (
            <div className="flex items-end justify-between h-32 gap-1.5">
              {daySales.map((val, i) => {
                const heightPct = Math.round((val / maxVal) * 100);
                const isToday   = i === todayIndex;
                const hasData   = val > 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t-lg transition-all duration-500"
                      style={{
                        height: `${hasData ? Math.max(heightPct, 8) : 4}%`,
                        backgroundColor: isToday ? '#185FA5' : hasData ? '#BFDBFE' : '#F1F5F9',
                      }}
                    />
                    <span className="text-[10px] font-bold" style={{ color: isToday ? '#185FA5' : '#94A3B8' }}>
                      {DAY_LABELS[i].charAt(0)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-4 mt-4 pt-4 border-t border-[#F1F5F9]">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#185FA5]" />
              <span className="text-[10px] text-[#94A3B8] font-medium">Today</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#BFDBFE]" />
              <span className="text-[10px] text-[#94A3B8] font-medium">Other days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
