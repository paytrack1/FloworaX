import React from 'react';

/**
 * Card — white surface container. No gradients; elevation does the work.
 * `interactive` adds hover lift for clickable cards.
 */
export default function Card({ interactive = false, className = '', children, ...props }) {
  return (
    <div
      className={`bg-surface rounded-card border border-slate-200/80 shadow-sm
        ${interactive ? 'transition-all duration-200 hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 cursor-pointer' : ''}
        ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
