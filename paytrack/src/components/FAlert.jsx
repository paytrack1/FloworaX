import React, { useEffect, useState } from 'react';

/**
 * FloworaX inline alert — matches SuccessMessage.jsx animation language.
 * Replaces browser alert() and plain red divs across the app.
 *
 * Props:
 *   type       — 'error' | 'success' | 'warning' | 'info'  (default 'error')
 *   message    — string to display
 *   onDismiss  — optional callback when user closes it
 *   autoDismiss — ms before auto-close (0 = never, default 0)
 */

const VARIANTS = {
  error: {
    bg:     'bg-red-50',
    border: 'border-red-200',
    icon:   '✕',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-500',
    textColor: 'text-red-700',
  },
  success: {
    bg:     'bg-green-50',
    border: 'border-green-200',
    icon:   '✓',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    textColor: 'text-green-700',
  },
  warning: {
    bg:     'bg-amber-50',
    border: 'border-amber-200',
    icon:   '!',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    textColor: 'text-amber-700',
  },
  info: {
    bg:     'bg-blue-50',
    border: 'border-[#2F5FB3]/20',
    icon:   'i',
    iconBg: 'bg-[#EEF4FF]',
    iconColor: 'text-[#2F5FB3]',
    textColor: 'text-[#185FA5]',
  },
};

const FAlert = ({ type = 'error', message = '', onDismiss, autoDismiss = 0 }) => {
  const [visible, setVisible] = useState(false);   // drives zoom-in
  const [leaving, setLeaving] = useState(false);   // drives zoom-out

  useEffect(() => {
    if (!message) return;
    setLeaving(false);
    // tiny delay so the DOM paints first, giving the zoom-in animation something to run
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, [message]);

  useEffect(() => {
    if (!autoDismiss || !message) return;
    const t = setTimeout(() => dismiss(), autoDismiss);
    return () => clearTimeout(t);
  }, [message, autoDismiss]);

  const dismiss = () => {
    setLeaving(true);
    setTimeout(() => {
      setVisible(false);
      setLeaving(false);
      onDismiss?.();
    }, 220);
  };

  if (!message) return null;

  const v = VARIANTS[type] || VARIANTS.error;

  return (
    <>
      <style>{`
        @keyframes falert-in  {
          0%   { transform: scale(0.7);  opacity: 0; }
          70%  { transform: scale(1.04); opacity: 1; }
          100% { transform: scale(1);    opacity: 1; }
        }
        @keyframes falert-out {
          0%   { transform: scale(1);   opacity: 1; }
          100% { transform: scale(0.8); opacity: 0; }
        }
      `}</style>

      <div
        className={`
          flex items-start gap-3 rounded-2xl border px-4 py-3
          ${v.bg} ${v.border}
        `}
        style={{
          animation: leaving
            ? 'falert-out 0.22s ease-in forwards'
            : visible
            ? 'falert-in 0.3s cubic-bezier(.34,1.56,.64,1) forwards'
            : 'none',
          opacity: visible ? undefined : 0,
        }}
      >
        {/* Icon badge */}
        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${v.iconBg}`}>
          <span className={`text-xs font-black ${v.iconColor}`}>{v.icon}</span>
        </div>

        {/* Message */}
        <p className={`text-sm font-semibold flex-1 ${v.textColor}`}>{message}</p>

        {/* Dismiss button */}
        {onDismiss && (
          <button
            onClick={dismiss}
            className={`text-sm font-black opacity-50 hover:opacity-100 transition-opacity ${v.textColor} flex-shrink-0`}
          >
            ✕
          </button>
        )}
      </div>
    </>
  );
};

export default FAlert;
