import React from 'react';

/**
 * SectionHeader — consistent block heading with optional action link.
 */
export default function SectionHeader({ title, subtitle, actionLabel, onAction, className = '' }) {
  return (
    <div className={`flex items-end justify-between mb-3 ${className}`}>
      <div>
        <h2 className="text-heading text-ink">{title}</h2>
        {subtitle && <p className="text-caption text-ink-muted mt-0.5">{subtitle}</p>}
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="text-caption font-bold text-brand-600 hover:text-brand-700 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
