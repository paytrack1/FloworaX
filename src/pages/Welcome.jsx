import React from 'react';

const Welcome = ({ onGetStarted, onSignIn }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top section */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16 pb-8 text-center">
        {/* Logo */}
        <div className="w-20 h-20 bg-[#185FA5] rounded-3xl flex items-center justify-center text-white font-black text-3xl mb-8 shadow-xl shadow-blue-200">
          FL
        </div>

        {/* Brand */}
        <h1 className="text-4xl font-black text-[#0F172A] tracking-tight mb-2">
          Flowora
        </h1>
        <p className="text-[#185FA5] font-bold text-sm uppercase tracking-widest mb-10">
          by Floworax
        </p>

        {/* Value proposition */}
        <h2 className="text-2xl font-black text-[#0F172A] leading-tight mb-4 max-w-xs">
          Run your business.<br />Get paid faster.
        </h2>
        <p className="text-[#64748B] text-base leading-relaxed max-w-sm">
          Record sales offline, accept payments, track expenses, and grow your business — all in one place.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-8">
          {['Works offline', 'Paystack payments', 'Real-time sync', 'Expense tracking'].map((f) => (
            <span key={f} className="bg-[#F1F5F9] text-[#64748B] text-xs font-semibold px-3 py-1.5 rounded-full">
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="px-6 pb-12 flex flex-col gap-3">
        <button
          onClick={onGetStarted}
          className="w-full bg-[#185FA5] text-white py-4 rounded-2xl font-black text-base shadow-lg shadow-blue-200 active:scale-95 transition-all"
        >
          Get Started — It's Free
        </button>
        <button
          onClick={onSignIn}
          className="w-full bg-[#F1F5F9] text-[#0F172A] py-4 rounded-2xl font-black text-base active:scale-95 transition-all"
        >
          Sign In
        </button>
        <p className="text-center text-[#94A3B8] text-xs mt-1">
          No credit card required · Works offline
        </p>
      </div>
    </div>
  );
};

export default Welcome;
