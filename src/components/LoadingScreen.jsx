import React from 'react';

const LoadingScreen = ({ message = 'Loading...' }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center mb-6">
        <div className="absolute w-20 h-20 rounded-3xl bg-[#185FA5] opacity-20 animate-ping" />
        <div className="absolute w-16 h-16 rounded-2xl bg-[#185FA5] opacity-30 animate-ping" style={{ animationDelay: '0.2s' }} />
        <div className="w-14 h-14 bg-[#185FA5] rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-200 relative z-10">
          FL
        </div>
      </div>
      <h2 className="text-lg font-black text-[#0F172A] tracking-tight">Flowora</h2>
      <p className="text-[#94A3B8] text-sm font-medium mt-1">{message}</p>
    </div>
  );
};

export default LoadingScreen;
