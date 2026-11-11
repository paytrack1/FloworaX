import React from 'react';

/**
 * EmptyState — friendly zero-data placeholder with an optional action.
 */
export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 px-6 ${className}`}>
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-surface-sunken text-ink-muted flex items-center justify-center mb-4">
          <Icon size={22} strokeWidth={1.8} aria-hidden />
        </div>
      )}
      <p className="text-heading text-ink">{title}</p>
      {description && <p className="text-body text-ink-muted mt-1 max-w-xs">{description}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 h-9 px-4 rounded-field bg-brand-50 text-brand-600 text-caption font-bold hover:bg-brand-100 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
