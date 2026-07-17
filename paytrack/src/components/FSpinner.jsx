import React from 'react';

/**
 * FloworaX inline spinner — matches LoadingScreen.jsx animation language.
 * Use inside modals, buttons, or page sections (not full-screen).
 *
 * Props:
 *   size    — 'sm' | 'md' | 'lg'  (default 'md')
 *   message — optional label below the spinner
 */
const FSpinner = ({ size = 'md', message = '' }) => {
  const dim = size === 'sm' ? 32 : size === 'lg' ? 80 : 52;
  const font = size === 'sm' ? 11 : size === 'lg' ? 28 : 18;
  const sw   = size === 'sm' ? 3  : size === 'lg' ? 5  : 4;
  const r    = size === 'sm' ? 12 : size === 'lg' ? 34 : 22;
  const circ = 2 * Math.PI * r;
  const dash = circ * 0.3;

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <style>{`
        @keyframes flw-spin  { to { transform: rotate(360deg); } }
        @keyframes flw-zoom  {
          0%, 100% { transform: scale(1);    opacity: 1;   }
          40%      { transform: scale(1.35); opacity: 0.7; }
          70%      { transform: scale(0.85); opacity: 0.9; }
        }
        @keyframes flw-bar   { 0% { transform: translateX(-120%); } 100% { transform: translateX(360%); } }
      `}</style>

      <div className="relative" style={{ width: dim, height: dim }}>
        {/* Track ring */}
        <div
          className="absolute inset-0 rounded-full border border-[#2F5FB3]/10"
          style={{ borderWidth: sw }}
        />
        {/* Spinning arc */}
        <svg
          className="absolute inset-0"
          width={dim} height={dim}
          viewBox={`0 0 ${dim} ${dim}`}
          style={{ animation: 'flw-spin 1s linear infinite' }}
        >
          <circle
            cx={dim / 2} cy={dim / 2} r={r}
            fill="none"
            stroke="#2F5FB3"
            strokeWidth={sw}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ - dash}`}
          />
        </svg>
        {/* F — zoom in/out */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-black text-[#2F5FB3] select-none"
            style={{
              fontSize: font,
              animation: 'flw-zoom 1.6s ease-in-out infinite',
              lineHeight: 1,
            }}
          >
            F
          </span>
        </div>
      </div>

      {/* Optional progress bar */}
      <div
        className="overflow-hidden rounded-full bg-[#2F5FB3]/10"
        style={{ width: dim * 1.4, height: 3 }}
      >
        <div
          className="h-full rounded-full bg-[#2F5FB3]"
          style={{ width: '33%', animation: 'flw-bar 1.3s ease-in-out infinite' }}
        />
      </div>

      {message && (
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#0F172A]">
          {message}
        </p>
      )}
    </div>
  );
};

export default FSpinner;
