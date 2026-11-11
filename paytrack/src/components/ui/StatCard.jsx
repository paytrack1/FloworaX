import React from 'react';

/**
 * StatCard — financial KPI tile.
 * tone: brand | positive | negative | neutral — colors value + icon chip semantically.
 */
const TONES = {
  brand:    { chip: 'bg-brand-50 text-brand-600',    value: 'text-ink' },
  positive: { chip: 'bg-positive-soft text-positive', value: 'text-positive' },
  negative: { chip: 'bg-negative-soft text-negative', value: 'text-negative' },
  neutral:  { chip: 'bg-surface-sunken text-ink-secondary', value: 'text-ink' },
};

export default function StatCard({ title, value, subtitle, icon: Icon, tone = 'brand', trend, onClick }) {
  const t = TONES[tone] || TONES.brand;
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick(); } : undefined}
      className={`bg-surface rounded-card border border-slate-200/80 shadow-sm p-5
        flex flex-col gap-4 transition-all duration-200
        ${onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${t.chip}`}>
          {Icon && <Icon size={17} strokeWidth={2.2} aria-hidden />}
        </div>
        {trend !== undefined && (
          <span className={`text-caption font-bold px-2 py-0.5 rounded-full
            ${trend >= 0 ? 'bg-positive-soft text-positive' : 'bg-negative-soft text-negative'}`}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-caption font-semibold text-ink-muted uppercase tracking-wide">{title}</p>
        <p className={`text-display mt-1 ${t.value}`}>{value}</p>
        {subtitle && <p className="text-caption text-ink-muted mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
