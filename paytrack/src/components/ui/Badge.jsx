import React from 'react';

/**
 * Badge — status indicator.
 * tone: success | danger | warning | info | neutral
 */
const TONES = {
  success: 'bg-positive-soft text-positive',
  danger:  'bg-negative-soft text-negative',
  warning: 'bg-warning-soft text-warning',
  info:    'bg-info-soft text-info',
  neutral: 'bg-surface-sunken text-ink-secondary',
  brand:   'bg-brand-50 text-brand-600',
};

const DOTS = {
  success: 'bg-positive',
  danger:  'bg-negative',
  warning: 'bg-warning',
  info:    'bg-info',
  neutral: 'bg-ink-faint',
  brand:   'bg-brand-500',
};

export default function Badge({ tone = 'neutral', dot = false, children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-micro font-bold uppercase tracking-wide ${TONES[tone]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${DOTS[tone]}`} aria-hidden />}
      {children}
    </span>
  );
}
