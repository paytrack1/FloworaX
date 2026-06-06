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
        <svg className="absolute inset-0