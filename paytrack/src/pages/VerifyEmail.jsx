import React, { useState, useRef, useEffect } from 'react';
import { Button, Badge } from '../components/ui';
import { MailCheck, LogOut } from 'lucide-react';
import { useStore } from '../store/useStore';

const CODE_LENGTH = 6;

const VerifyEmail = () => {
  const { verifyEmail, resendOtp, user, logout } = useStore();
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resent, setResent] = useState(false);
  const inputRefs = useRef([]);

  const codeString = code.join('');

  // Auto-verify once all 6 digits are in
  useEffect(() => {
    if (codeString.length === CODE_LENGTH && !loading) {
      handleVerify(codeString);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeString]);

  const focusAt = (index) => {
    const clamped = Math.max(0, Math.min(CODE_LENGTH - 1, index));
    inputRefs.current[clamped]?.focus();
    inputRefs.current[clamped]?.select();
  };

  const handleVerify = async (value = codeString) => {
    if (!value || value.length !== CODE_LENGTH) return;
    setError('');
    setLoading(true);
    try {
      await verifyEmail(value);
    } catch (err) {
      setError(err.message || 'Invalid code');
      setCode(Array(CODE_LENGTH).fill(''));
      focusAt(0);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index, raw) => {
    setError('');
    setResent(false);
    const digits = raw.replace(/\D/g, '');
    if (!digits) {
      // deletion or non-digit
      const next = [...code];
      next[index] = '';
      setCode(next);
      return;
    }
    // Support paste of the full code into any box
    const next = [...code];
    const chars = digits.split('');
    let cursor = index;
    for (const ch of chars) {
      if (cursor >= CODE_LENGTH) break;
      next[cursor] = ch;
      cursor += 1;
    }
    setCode(next);
    focusAt(Math.min(cursor, CODE_LENGTH - 1));
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      e.preventDefault();
      const next = [...code];
      next[index - 1] = '';
      setCode(next);
      focusAt(index - 1);
    }
    if (e.key === 'ArrowLeft' && index > 0) { e.preventDefault(); focusAt(index - 1); }
    if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) { e.preventDefault(); focusAt(index + 1); }
  };

  const handleResend = async () => {
    setError('');
    setResent(false);
    try {
      await resendOtp();
      setResent(true);
    } catch (err) {
      setError(err.message || 'Failed to resend code');
    }
  };

  return (
    <div className="min-h-screen bg-surface-muted flex flex-col justify-center px-6 py-10">
      <div className="w-full max-w-md mx-auto animate-fade-in">

        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="w-14 h-14 bg-brand-500 rounded-card flex items-center justify-center mx-auto mb-4 shadow-md">
            <MailCheck size={26} className="text-white" strokeWidth={2.2} aria-hidden />
          </div>
          <p className="text-micro font-bold uppercase tracking-widest text-ink-muted mb-1">Almost there</p>
          <h1 className="text-display text-ink">Verify your email</h1>
          <p className="text-body text-ink-secondary mt-2">
            We sent a 6-digit code to{' '}
            <span className="font-semibold text-ink">{user?.email || 'your email'}</span>
          </p>
        </div>

        <div className="bg-surface rounded-card border border-slate-200/80 shadow-md p-6 sm:p-8 flex flex-col gap-5">
          {/* OTP boxes */}
          <div>
            <label className="text-micro font-bold uppercase tracking-wide text-ink-secondary block mb-2">
              Enter the code
            </label>
            <div
              className="flex gap-2 sm:gap-2.5 justify-between"
              onPaste={(e) => {
                e.preventDefault();
                const digits = (e.clipboardData.getData('text') || '').replace(/\D/g, '').split('');
                if (!digits.length) return;
                const next = Array(CODE_LENGTH).fill('');
                digits.slice(0, CODE_LENGTH).forEach((d, i) => { next[i] = d; });
                setCode(next);
                focusAt(Math.min(digits.length, CODE_LENGTH - 1));
              }}
            >
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  aria-label={`Digit ${i + 1}`}
                  maxLength={CODE_LENGTH}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onFocus={(e) => e.target.select()}
                  className={`w-full aspect-square max-w-[3rem] rounded-field border text-center text-title font-bold text-ink
                    outline-none transition-all duration-150
                    focus:border-brand-400 focus:shadow-ring
                    ${digit ? 'border-brand-300 bg-brand-50' : 'border-slate-200 hover:border-slate-300 bg-surface'}`}
                />
              ))}
            </div>
            <p className="text-caption text-ink-muted mt-2">
              Tip: you can paste the whole code into any box.
            </p>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-field bg-negative-soft border border-red-200" role="alert">
              <p className="text-body text-negative font-medium">{error}</p>
            </div>
          )}

          {resent && !error && (
            <div className="flex justify-center">
              <Badge tone="success" dot>New code sent — check your inbox</Badge>
            </div>
          )}

          <Button size="lg" onClick={() => handleVerify()} loading={loading} disabled={codeString.length !== CODE_LENGTH}>
            {loading ? 'Verifying…' : 'Verify email'}
          </Button>

          <div className="flex flex-col items-center gap-1 pt-1">
            <button
              onClick={handleResend}
              className="text-caption font-bold text-brand-600 hover:text-brand-700 transition-colors"
            >
              Didn't get it? Resend code
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 text-caption text-ink-muted hover:text-ink-secondary transition-colors"
            >
              <LogOut size={12} strokeWidth={2.5} aria-hidden />
              Use a different account
            </button>
          </div>
        </div>

        <p className="text-center text-micro font-bold uppercase tracking-widest text-ink-faint mt-8">
          Flowora · Secure payments via Paystack
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;
