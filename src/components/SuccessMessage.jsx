import React from 'react';

const SuccessMessage = ({ title = 'All done', message = '', actionLabel, onAction }) => {
  return (
    <div className="min-h-screen bg-[#F0F4FF] flex items-center justify-center px-5 font-sans">
      <style>{`
        @keyframes flw-pop { 0% { transform: scale(0); } 70% { transform: scale(1.12); } 100% { transform: scale(1); } }
        @keyframes flw-draw { to { stroke-dashoffset: 0; } }
      `}</style>
      <div className="w-full max-w-sm bg-white rounded-3xl border