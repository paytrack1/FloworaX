import React from 'react';

const SuccessMessage = ({ title = 'All done', message = '', actionLabel, onAction }) => {
  return (
    <div className="min-h-screen bg-[#F0F4FF] flex items-center justify-center px-5 font-sans">
      <style>{`
        @keyframes flw-pop { 0% { transform: scale(0); } 70% { transform: scale(1.12); } 100% { transform: scale(1); } }
        @keyframes flw-draw { to { stroke-dashoffset: 0; } }
      `}</style>
      <div className="w-full max-w-sm bg-white rounded-3xl border border-[#E2E8F0] shadow-xl shadow-blue-100/50 p-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100"
          style={{ animation: 'flw-pop .5s ease-out' }}>
          <svg viewBox="0 0 52 52" className="h-8 w-8">
            <path fill="none" stroke="#16a34a" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"
              d="M14 27 l8 8 l16 -18" strokeDasharray="48" strokeDashoffset="48"
              style={{ animation: 'flw-draw .4s .3s ease-out forwards' }} />
          </svg>
        </div>
        <h1 className="text-xl font-black text-[#0F172A]">{title}</h1>
        {message && <p className="mt-2 text-sm text-[#64748B]">{message}</p>}
        {actionLabel && onAction && (
          <button onClick={onAction}
            className="mt-6 w-full bg-[#2F5FB3] text-white py-3 rounded-xl font-black text-sm uppercase tracking-widest active:scale-[0.99] transition-transform">
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default SuccessMessage;
