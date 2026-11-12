/**
 * Simple mode (Market Mode) — a minimal, icon-and-number UI for users with
 * low literacy. Persisted in localStorage; components listen via a custom
 * window event so the toggle applies instantly without a full reload.
 */
const KEY = 'flowora-simple-mode';
export const SIMPLE_MODE_EVENT = 'flowora-simple-mode-changed';

export const readSimpleMode = () => {
  try { return window.localStorage.getItem(KEY) === '1'; } catch { return false; }
};

export const writeSimpleMode = (on) => {
  try {
    window.localStorage.setItem(KEY, on ? '1' : '0');
    window.dispatchEvent(new CustomEvent(SIMPLE_MODE_EVENT, { detail: on }));
  } catch { /* private browsing etc. */ }
};
