import React, { useEffect, useState } from 'react';
import RevenueCard from '../components/RevenueCard';
import TransactionItem from '../components/TransactionItem';
import { useStore } from '../store/useStore';
import { fetchFinancialSummary } from '../api/financial';
import { verifySale } from '../api/sales';

const Home = ({ onNavigateToSale }) => {
  const { token, sales, fetchSales } = useStore();
  const [summary, setSummary]       = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    cashFlow: 0,
    transactionCount: 0,
    invoiceTotals: { total: 0, paid: 0, outstanding: 0 },
  });
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [syncLog, setSyncLog] = useState([]);
  const [showLog, setShowLog] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchSales();
  }, [token, fetchSales]);

  const loadFinancialSummary = async () => {
    if (!token) return;
    setLoadingSummary(true);
    try {
      const summaryData = await fetchFinancialSummary(token);
      setSummary(summaryData);
      setSummaryError('');
    } catch (err) {
      console.error('Failed to load financial summary:', err);
      setSummaryError(err.message || 'Unable to load financial summary');
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    loadFinancialSummary();
  }, [token]);

  // ── Verify a single sale payment on Paystack ──
  const handleVerifySale = async (sale) => {
    if (!sale.reference) {
      setSyncLog([`Sale ${sale.id.slice(0, 8)} has no payment reference.`]);
      setShowLog(true);
      return;
    }

    const log = [`Verifying payment on Paystack...`];
    setSyncLog([...log]);
    setShowLog(true);

    try {
        const data = await verifySale(token, sale.reference);
      if (data.verified) {
        await fetchSales();
        log.push(`Sale ${sale.id.slice(0, 8)} verified by Paystack ₦${data.amount?.toLocaleString()}`);
      } else {
        log.push(`Sale ${sale.id.slice(0, 8)} not found on Paystack`);
      }
    } catch (err) {
      log.push(`Verification failed: ${err.message}`);
    }

    setSyncLog([...log]);
  };

  return (
    <div className="bg-[#F5F7FA] min-h-screen pb-32">
      {/* Header */}
      <div className="p-6 flex justify-between items-center bg-white shadow-sm">
        <div>
          <p className="text-[#64748B] text-xs font-semibold uppercase tracking-widest">
            Good Morning 👋
          </p>
          <h1 className="text-xl font-black text-[#0F172A]">Adeola Store</h1>
        </div>
        <div className="w-10 h-10 bg-[#185FA5] rounded-xl flex items-center justify-center text-white font-bold text-sm">
          AS
        </div>
      </div>

      {/* Verification Log Panel */}
      {showLog && syncLog.length > 0 && (
        <div className="mx-6 mt-4 bg-[#0F172A] rounded-2xl p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-white text-xs font-bold uppercase tracking-widest">Verification</p>
            <button onClick={() => setShowLog(false)} className="text-[#64748B] text-xs">✕ Close</button>
          </div>
          {syncLog.map((line, i) => (
            <p key={i} className="text-green-400 text-xs font-mono leading-6">{line}</p>
          ))}
        </div>
      )}

      {/* Revenue Card */}
      <RevenueCard
        totalAmount={summary.totalRevenue}
        txCount={summary.transactionCount}
        netProfit={summary.netProfit}
      />

      {summaryError && (
        <div className="mx-6 mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {summaryError}
        </div>
      )}

      {/* Transactions */}
      <div className="px-6 mt-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-[#0F172A] text-base">Recent Transactions</h3>
          <span className="text-[#185FA5] text-xs font-bold cursor-pointer">View All</span>
        </div>

        {sales.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#EEF4FF] flex items-center justify-center text-2xl">🛒</div>
            <p className="text-[#94A3B8] text-sm font-medium">No sales recorded yet.</p>
            <p className="text-[#CBD5E1] text-xs">Tap "+ New Sale" to get started</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sales.map((sale) => (
              <TransactionItem
                key={sale.id}
                name={sale.items?.[0]?.name || 'General Sale'}
                itemsCount={sale.items?.length ?? 0}
                amount={sale.total}
                time={new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                synced={sale.synced === 1}
                verified={sale.verified}
                onVerify={() => handleVerifySale(sale)}
              />
            ))}
          </div>
        )}
      </div>

      {/* New Sale Button */}
      <div className="fixed bottom-24 left-0 right-0 px-6 z-10">
        <button
          onClick={onNavigateToSale}
          className="w-full bg-[#185FA5] text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-transform text-base"
        >
          + New Sale
        </button>
      </div>
    </div>
  );
};

export default Home;
