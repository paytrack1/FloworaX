import React from 'react';

/**
 * Button — single source of truth for all buttons.
 * variants: primary | secondary | ghost | danger
 * sizes:    sm | md | lg
 * All interactive states included; use <Button as anchor via `href`> when needed.
 */
const VARIANTS = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-sm hover:shadow-md disabled:bg-brand-300',
  secondary: 'bg-surface text-ink border border-slate-200 hover:border-brand-300 hover:text-brand-600 active:bg-surface-sunken',
  ghost: 'bg-transparent text-ink-secondary hover:bg-surface-sunken hover:text-ink',
  danger: 'bg-negative text-white hover:bg-red-700 active:bg-red-800 shadow-sm',
};

const SIZES = {
  sm: 'h-9 px-3.5 text-caption rounded-field gap-1.5',
  md: 'h-11 px-5 text-body font-semibold rounded-field gap-2',
  lg: 'h-13 px-6 text-heading rounded-field gap-2',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon = null,
  iconRight: IconRight = null,
  loading = false,
  disabled = false,
  className = '',
  children,
  ...props
}) {
  const isDisabled = disabled || loading;
  return (
    <button
      disabled={isDisabled}
      className={`inline-flex items-center justify-center font-semibold whitespace-nowrap
        transition-all duration-150 outline-none
        focus-visible:ring-3 focus-visible:shadow-ring
        disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]
        ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden />
      ) : (
        Icon && <Icon size={size === 'sm' ? 15 : 17} strokeWidth={2.2} aria-hidden />
      )}
      {children}
      {IconRight && !loading && <IconRight size={size === 'sm' ? 15 : 17} strokeWidth={2.2} aria-hidden />}
    </button>
  );
}
