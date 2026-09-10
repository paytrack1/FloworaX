import React from 'react';

const LoadingScreen = ({ message = 'Flowora' }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#F0F4FF] font-sans">
      <style>{`
        @keyframes flw-spin { to { transform: rotate(360deg); } }
        @keyframes flw-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .5; transform: scale(.9); } }
        @keyframes flw-bar { 0% { transform: translateX(-120%); } 100% { transform: translateX(360%); } }
      `}</style>

      <div className="relative h-24 w-24">
        <div className="absolute inset-0 rounded-full border-2 border-[#2F5FB3]/10" />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100"
          style={{ animation: 'flw-spin 1s linear infinite' }}>
          <circle cx="50" cy="50" r="44" fill="none" stroke="#2F5FB3" strokeWidth="4"
            strokeLinecap="round" strokeDasharray="68 220" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-black text-[#2F5FB3]"
            style={{ animation: 'flw-pulse 1.6s ease-in-out infinite' }}>F</span>
        </div>
      </div>

      <p className="mt-7 text-sm font-black uppercase tracking-[0.3em] text-[#0F172A]">{message}</p>

      <div className="mt-4 h-[3px] w-40 overflow-hidden rounded-full bg-[#2F5FB3]/10">
        <div className="h-full w-1/3 rounded-full bg-[#2F5FB3]"
          style={{ animation: 'flw-bar 1.3s ease-in-out infinite' }} />
      </div>
    </div>
  );
};

export default LoadingScreen;
