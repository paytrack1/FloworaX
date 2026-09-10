import React from 'react';

const DashboardCard = ({ title, value, subtitle, accent }) => {
  return (
    <div className="rounded-3xl overflow-hidden shadow-sm border border-[#E2E8F0] bg-white">
      <div className={`p-6 bg-gradient-to-r ${accent}`}>
        <p className="text-xs uppercase tracking-[0.3em] text-white/70 font-bold">{title}</p>
        <p className="mt-4 text-3xl font-black text-white tracking-tight">{value}</p>
      </div>
      <div className="p-5 border-t border-[#E2E8F0] text-sm text-[#475569]">
        {subtitle}
      </div>
    </div>
  );
};

export default DashboardCard;
