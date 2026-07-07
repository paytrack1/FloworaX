import React, { useMemo, useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { TrendingUp, ShoppingBag, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fetchFinancialSummary } from '../api/financial';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SalesHistory = () => {
  const { sales, user, token } = useStore();
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

  const chartData = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(today.getDate() - (6 - i));
      const dayStr = date.toDateString();
      const daySales = sales.filter(
        (s) => new Date(s.createdAt).toDateString() === dayStr
      );
      return {
        day: DAYS[date.getDay()],
        total: daySales.reduce((sum, s) => sum + (s.total || 0), 0),
        count: daySales.length,
        isToday: i === 6,
      };
    });
  }, [sales]);

  const maxTotal = Math.max(...chartData.map((d) => d.total), 1);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFillColor(27, 79, 155);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Flowora', 14, 15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Sales Report', 14, 23);
    doc.text(`${user?.businessName || 'My Store'}`, 14, 30);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 120, 23);

    // Summary
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, 50);

    const verifiedCount = sales.filter((s) => s.verified).length;
    const pendingCount = sales.filter((s) => !s.verified).length;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Sales: ${summary.transactionCount}`, 14, 60);
    doc.text(`Total Revenue: N${summary.totalRevenue.toLocaleString()}`, 14, 68);
    doc.text(`Verified: ${verifiedCount}`, 14, 76);
    doc.text(`Pending: ${pendingCount}`, 14, 84);

    // Table
    autoTable(doc, {
      startY: 95,
      head: [['Item', 'Amount (N)', 'Payment', 'Status', 'Date']],
      body: sales.map((s) => [
        s.itemName || 'General Sale',
        s.total?.toLocaleString(),
        s.paymentMethod?.toUpperCase(),
        s.verified ? 'Verified' : 'Pending',
        new Date(s.createdAt).toLocaleDateString(),
      ]),
      headStyles: { fillColor: [27, 79, 155], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 244, 255] },
      styles: { fontSize: 9 },
    });

    doc.save(`flowora-sales-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-[#0F172A]">Sales History</h2>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 bg-[#2F5FB3] text-white px-4 py-2.5 rounded-xl font-black text-sm active:scale-95 transition-all"
        >
          <Download size={16} />
          PDF
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Last 7 Days</p>
        <div className="flex items-end justify-between gap-2 h-40">
          {chartData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              {d.total > 0 && (
                <p className="text-[9px] font-black text-slate-400 text-center">
                  {d.total >= 1000 ? `${(d.total / 1000).toFixed(0)}k` : d.total}
                </p>
              )}
              <div className="w-full flex items-end" style={{ height: '100px' }}>
                <div
                  className={`w-full rounded-xl transition-all ${
                    d.isToday ? 'bg-[#2F5FB3]' : d.total > 0 ? 'bg-[#93C5FD]' : 'bg-slate-100'
                  }`}
                  style={{ height: d.total > 0 ? `${Math.max((d.total / maxTotal) * 100, 8)}%` : '8%' }}
                />
              </div>
              <p className={`text-[10px] font-black ${d.isToday ? 'text-[#2F5FB3]' : 'text-slate-400'}`}>
                {d.isToday ? 'Today' : d.day}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase">Total</p>
          <p className="text-xl font-black text-[#0F172A]">{summary.transactionCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase">Revenue</p>
          <p className="text-xl font-black text-[#0F172A]">₦{summary.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase">Profit</p>
          <p className="text-xl font-black text-[#15803D]">₦{Math.round(summary.netProfit).toLocaleString()}</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">All Transactions</p>
        {sales.length === 0 ? (
          <div className="text-center py-20 opacity-30">
            <ShoppingBag className="mx-auto mb-2" size={48} />
            <p className="font-bold italic">No sales recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sales.map((sale) => (
              <div key={sale.id} className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex items-center gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] flex items-center justify-center flex-shrink-0">
                  <TrendingUp size={18} className="text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#0F172A] font-bold text-sm truncate">{sale.itemName || 'General Sale'}</p>
                  <p className="text-[#94A3B8] text-xs font-medium mt-0.5">
                    {sale.paymentMethod} · {sale.time} · {new Date(sale.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[#0F172A] font-black text-sm mb-1">
                    ₦{sale.total?.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </p>
                  {sale.verified ? (
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700">Verified</span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">Pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesHistory;
