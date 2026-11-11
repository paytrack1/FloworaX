import React from 'react';

/**
 * Input — labeled text field with consistent focus ring and error state.
 * Uncontrolled or controlled both work; pass `error` for validation styling.
 */
export default function Input({
  label,
  error,
  hint,
  icon: Icon = null,
  className = '',
  id,
  ...props
}) {
  const inputId = id || props.name;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-micro font-bold uppercase tracking-wide text-ink-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none">
            <Icon size={16} strokeWidth={2.2} aria-hidden />
          </span>
        )}
        <input
          id={inputId}
          aria-invalid={!!error}
          className={`w-full h-11 rounded-field bg-surface border text-body text-ink
            placeholder:text-ink-faint outline-none transition-all duration-150
            focus:border-brand-400 focus:shadow-ring
            disabled:bg-surface-sunken disabled:cursor-not-allowed
            ${error ? 'border-negative' : 'border-slate-200 hover:border-slate-300'}
            ${Icon ? 'pl-10 pr-3.5' : 'px-3.5'}`}
          {...props}
        />
      </div>
      {error ? (
        <p className="text-caption text-negative" role="alert">{error}</p>
      ) : hint ? (
        <p className="text-caption text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}
