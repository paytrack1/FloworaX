import React from 'react';

const CartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const TransactionItem = ({ name = 'General Sale', itemsCount = 1, amount = 0, time = '', synced = false }) => {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex items-center gap-3 shadow-sm">
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] flex items-center justify-center flex-shrink-0">
        <CartIcon />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[#0F172A] font-bold text-sm truncate">{name}</p>
        <p className="text-[#94A3B8] text-xs font-medium mt-0.5">
          {itemsCount} {itemsCount === 1 ? 'item' : 'items'} · {time}
        </p>
      </div>

      {/* Amount + Badge */}
      <div className="text-right flex-shrink-0">
        <p className="text-[#0F172A] font-black text-sm mb-1">
          ₦{amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        {synced ? (
          <span
            className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
            style={{ background: '#F0FDF4', color: '#15803D' }}
          >
            Synced
          </span>
        ) : (
          <span
            className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
            style={{ background: '#FAEEDA', color: '#854F0B' }}
          >
            Pending
          </span>
        )}
      </div>
    </div>
  );
};

export default TransactionItem;