import React, { useEffect, useState } from 'react';
import { liveQuery } from 'dexie';
import { db } from '../db/dexie';
import RevenueCard from '../components/RevenueCard';
import TransactionItem from '../components/TransactionItem';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const API_KEY     = import.meta.env.VITE_API_KEY     || 'flowora-dev-key';

const Home = ({ onNavigateToSale }) => {
  const [sales, setSales]     = useState([]);
  const [stats, setStats]     = useState({ total: 0, count: 0, netProfit: 0 });
  const [syncLog, setSyncLog] = useState([]);
  const [showLog, setShowLog] = useState(false);

  // ── Live query from local store ──
  useEffect(() => {
    const subscription = liveQuery(() =>
      db.sales.orderBy('createdAt').reverse().toArray()
    ).subscribe({
      next: (allSales) => {
        const total     = allSales.reduce((sum, s) => sum + s.total, 0);
        const netProfit = allSales.reduce((sum, s) => sum + (s.profit ?? s.total * 0.3), 0);
        setSales(allSales);
        setStats({ total, count: allSales.length, netProfit });
      },
      error: (err) => console.error('liveQuery error:', err),
    });
    return () => subscription.unsubscribe();
  }, []);

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
      const res = await fetch(
        `${BACKEND_URL}/api/payments/verify/${sale.reference}`,
        { headers: { 'x-api-key': API_KEY } }
      );
      const data = await res.json();

      if (data.verified) {
        await db.sales.update(sale.id, {
          synced: 1, verified: true, status: 'completed',
        });
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
        totalAmount={stats.total}
        txCount={stats.count}
        netProfit={stats.netProfit}
      />

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
