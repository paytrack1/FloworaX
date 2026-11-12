import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Button, Input } from '../components/ui';
import { Mail, Store, Lock, ArrowLeft } from 'lucide-react';

const Login = ({ mode: initialMode = 'login', referralCode = null }) => {
  const { login, register, forgotPassword, authError, clearAuthError } = useStore();
  const [mode, setMode] = useState(initialMode === 'register' ? 'register' : 'login');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', businessName: '', password: '' });
  const [resetSent, setResetSent] = useState(false);

  const handleChange = (e) => {
    clearAuthError();
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleForgotPassword = async () => {
    if (!form.email) return;
    setLoading(true);
    try {
      await forgotPassword(form.email);
      setResetSent(true);
    } catch (err) {
      // authError set in store
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return;
    if (mode === 'register' && !form.businessName.trim()) return;
    setLoading(true);
    try {
      if (mode === 'register') {
        await register(form.email, form.businessName, form.password, referralCode);
      } else {
        await login(form.email, form.password);
      }
    } catch (err) {
      // authError set in store
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    clearAuthError();
    setForm({ email: '', businessName: '', password: '' });
    setMode(mode === 'login' ? 'register' : 'login');
  };

  const titles = {
    login: { eyebrow: 'Welcome back', heading: 'Sign in to Flowora' },
    register: { eyebrow: 'Get started', heading: 'Create your account' },
    forgot: { eyebrow: 'Password help', heading: 'Reset your password' },
  };
  const t = titles[mode] || titles.login;

  return (
    <div className="min-h-screen bg-surface-muted flex flex-col justify-center px-6 py-10">
      <div className="w-full max-w-md mx-auto animate-fade-in">

        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="w-14 h-14 bg-brand-500 rounded-card flex items-center justify-center text-white font-black text-xl mx-auto mb-4 shadow-md">
            FL
          </div>
          <p className="text-micro font-bold uppercase tracking-widest text-ink-muted mb-1">{t.eyebrow}</p>
          <h1 className="text-display text-ink">{t.heading}</h1>
          {referralCode && mode === 'register' && (
            <p className="text-caption text-brand-600 font-semibold mt-2 bg-brand-50 inline-block px-3 py-1 rounded-full">
              Invited with code {referralCode} — you'll help a friend earn when you make your first payment
            </p>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface rounded-card border border-slate-200/80 shadow-md p-6 sm:p-8 flex flex-col gap-5"
          noValidate
        >
          {mode === 'forgot' ? (
            <>
              {resetSent ? (
                <div className="px-4 py-3 rounded-field bg-positive-soft border border-emerald-200">
                  <p className="text-body text-positive font-medium">
                    If an account exists for this email, a reset link has been sent. Check your inbox.
                  </p>
                </div>
              ) : (
                <p className="text-body text-ink-secondary -mt-1">
                  Enter your email and we'll send you a reset link.
                </p>
              )}
              <Input
                label="Email address"
                name="email"
                type="email"
                autoComplete="email"
                icon={Mail}
                placeholder="you@store.com"
                value={form.email}
                onChange={handleChange}
              />
              <Button type="button" size="lg" onClick={handleForgotPassword} loading={loading} disabled={!form.email || resetSent}>
                {resetSent ? 'Link sent' : 'Send reset link'}
              </Button>
              <button
                type="button"
                onClick={() => { clearAuthError(); setResetSent(false); setMode('login'); }}
                className="inline-flex items-center justify-center gap-1.5 text-caption font-bold text-ink-muted hover:text-ink transition-colors"
              >
                <ArrowLeft size={14} strokeWidth={2.5} /> Back to sign in
              </button>
            </>
          ) : (
            <>
              {/* Mode switch */}
              <div className="flex bg-surface-sunken rounded-field p-1">
                <button
                  type="button"
                  onClick={() => { if (mode !== 'login') switchMode(); }}
                  className={`flex-1 h-9 rounded-[0.5rem] text-caption font-bold transition-all
                    ${mode === 'login' ? 'bg-surface shadow-sm text-brand-600' : 'text-ink-muted hover:text-ink-secondary'}`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => { if (mode !== 'register') switchMode(); }}
                  className={`flex-1 h-9 rounded-[0.5rem] text-caption font-bold transition-all
                    ${mode === 'register' ? 'bg-surface shadow-sm text-brand-600' : 'text-ink-muted hover:text-ink-secondary'}`}
                >
                  Create account
                </button>
              </div>

              <Input
                label="Email address"
                name="email"
                type="email"
                autoComplete="email"
                icon={Mail}
                placeholder="you@store.com"
                value={form.email}
                onChange={handleChange}
              />

              {mode === 'register' && (
                <Input
                  label="Business or ministry name"
                  name="businessName"
                  type="text"
                  autoComplete="organization"
                  icon={Store}
                  placeholder="e.g. Grace Assembly or Blessing Salon"
                  value={form.businessName}
                  onChange={handleChange}
                />
              )}

              <Input
                label="Password"
                name="password"
                type="password"
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                icon={Lock}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                hint={mode === 'register' ? 'Minimum 8 characters' : undefined}
              />

              {authError && (
                <div className="px-4 py-3 rounded-field bg-negative-soft border border-red-200" role="alert">
                  <p className="text-body text-negative font-medium">{authError}</p>
                </div>
              )}

              <Button type="submit" size="lg" loading={loading} disabled={!form.email || !form.password || (mode === 'register' && !form.businessName)}>
                {mode === 'login' ? 'Sign in' : 'Create account'}
              </Button>

              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => { clearAuthError(); setResetSent(false); setMode('forgot'); }}
                  className="text-caption font-bold text-brand-600 hover:text-brand-700 transition-colors"
                >
                  Forgot password?
                </button>
              )}
            </>
          )}
        </form>

        <p className="text-center text-micro font-bold uppercase tracking-widest text-ink-faint mt-8">
          Flowora · Secure payments via Paystack
        </p>
      </div>
    </div>
  );
};

export default Login;
