import React, { useEffect, useMemo, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, Wallet, PiggyBank, ReceiptText, CalendarDays, Scissors, Sparkles,
  ArrowRight, Plus, FileText, RefreshCw, Inbox,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { Card, StatCard, Button, Badge, EmptyState, SectionHeader } from './ui';
import FSpinner from './FSpinner';

// ── Fallback sample series (only used when the backend has no history) ──
const SAMPLE_TREND = [
  { month: 'Jun', revenue: 42000, expenses: 21000 },
  { month: 'Jul', revenue: 58000, expenses: 24000 },
  { month: 'Aug', revenue: 46000, expenses: 19500 },
  { month: 'Sep', revenue: 71000, expenses: 30500 },
  { month: 'Oct', revenue: 64000, expenses: 26000 },
  { month: 'Nov', revenue: 88500, expenses: 31000 },
];

const formatNaira = (n) => `₦${Number(n || 0).toLocaleString()}`;

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-ink text-white rounded-lg px-3 py-2 shadow-lg text-caption">
      <p className="font-bold mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {formatNaira(p.value)}
        </p>
      ))}
    </div>
  );
};

const Dashboard = ({ onNewSale, onNewExpense, onOpenReports }) => {
  const { user, dashboard, dashboardError, fetchDashboard, sales } = useStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  };

  const s = dashboard?.summary || {};
  const hasData = (s.totalRevenue || 0) > 0 || (s.totalExpenses || 0) > 0 || (s.transactionCount || 0) > 0;

  const trend = useMemo(() => {
    if (Array.isArray(dashboard?.monthlyTrend) && dashboard.monthlyTrend.length) {
      return dashboard.monthlyTrend.map((m) => ({
        month: m.month || m.label,
        revenue: m.revenue || 0,
        expenses: m.expenses || 0,
      }));
    }
    return SAMPLE_TREND; // sample data, clearly labelled below
  }, [dashboard]);

  const profitMargin = s.totalRevenue > 0
    ? Math.round((s.netProfit / s.totalRevenue) * 100)
    : null;

  const recentSales = (sales || []).slice(0, 4);

  if (refreshing) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <FSpinner />
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-8">
      {/* ── Welcome row ── */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-display text-ink">
            {user?.businessName || 'Welcome back'}
          </h1>
          <p className="text-body text-ink-muted mt-0.5">
            Here's how your business is performing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={handleRefresh} aria-label="Refresh dashboard">
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button size="sm" icon={Plus} onClick={onNewSale}>New sale</Button>
        </div>
      </div>

      {dashboardError && (
        <div className="mb-6 px-4 py-3 rounded-field bg-warning-soft border border-amber-200 text-warning text-body">
          {dashboardError}
        </div>
      )}

      {/* ── KPI row ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard
          title="Revenue"
          value={formatNaira(s.totalRevenue)}
          subtitle="This month"
          icon={TrendingUp}
          tone="brand"
        />
        <StatCard
          title="Expenses"
          value={formatNaira(s.totalExpenses)}
          subtitle="This month"
          icon={Wallet}
          tone="negative"
        />
        <StatCard
          title="Net profit"
          value={formatNaira(s.netProfit)}
          subtitle={profitMargin !== null ? `${profitMargin}% margin` : 'This month'}
          icon={PiggyBank}
          tone={s.netProfit >= 0 ? 'positive' : 'negative'}
        />
        <StatCard
          title="Transactions"
          value={String(s.transactionCount ?? 0)}
          subtitle="Completed this month"
          icon={ReceiptText}
          tone="neutral"
        />
      </div>

      {/* ── Revenue chart + breakdown ── */}
      <div className="grid gap-4 lg:grid-cols-3 mb-8">
        <Card className="lg:col-span-2 p-5">
          <SectionHeader
            title="Revenue overview"
            subtitle={!hasData && dashboard == null ? 'Showing sample data — connect data by recording sales' : 'Revenue vs expenses, last 6 months'}
          />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#185FA5" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#185FA5" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="expFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#DC2626" stopOpacity={0.16} />
                    <stop offset="100%" stopColor="#DC2626" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F7" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <YAxis
                  tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} width={48}
                  tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#185FA5" strokeWidth={2.5} fill="url(#revFill)" />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#DC2626" strokeWidth={2} fill="url(#expFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Quick actions */}
        <Card className="p-5">
          <SectionHeader title="Quick actions" />
          <div className="flex flex-col gap-2.5">
            <Button icon={Plus} onClick={onNewSale} className="justify-start">Record a sale</Button>
            <Button variant="secondary" icon={FileText} onClick={onNewExpense} className="justify-start">Add an expense</Button>
            <Button variant="secondary" icon={ArrowRight} onClick={onOpenReports} className="justify-start">View reports</Button>
          </div>
          <div className="mt-5 pt-5 border-t border-slate-100">
            <p className="text-micro font-bold uppercase tracking-wide text-ink-muted mb-2">Plan usage</p>
            <div className="flex flex-wrap gap-2">
              <Badge tone="brand" dot>Bookings: {dashboard?.subscription?.usage?.monthlyBookings ?? 0}</Badge>
              <Badge tone="neutral" dot>Services: {dashboard?.subscription?.usage?.activeServices ?? 0}</Badge>
              <Badge tone="neutral" dot>Events: {dashboard?.subscription?.usage?.activeEvents ?? 0}</Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Recent activity ── */}
      <Card className="p-5">
        <SectionHeader
          title="Recent activity"
          subtitle="Latest transactions across your business"
          actionLabel="See all"
          onAction={onOpenReports}
        />
        {recentSales.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No sales yet"
            description="Record your first sale to see activity here."
            actionLabel="Record a sale"
            onAction={onNewSale}
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentSales.map((sale) => (
              <li key={sale.id || sale._id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 shrink-0 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                    <Sparkles size={16} strokeWidth={2.2} aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="text-body font-semibold text-ink truncate">
                      {sale.itemName || (sale.items?.[0]?.name) || 'Sale'}
                    </p>
                    <p className="text-caption text-ink-muted">
                      {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                      {sale.paymentMethod ? ` · ${sale.paymentMethod}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge tone={sale.status === 'paid' ? 'success' : sale.status === 'pending' ? 'warning' : 'neutral'} dot>
                    {sale.status || 'recorded'}
                  </Badge>
                  <p className="text-body font-bold text-ink tabular-nums">{formatNaira(sale.total)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
