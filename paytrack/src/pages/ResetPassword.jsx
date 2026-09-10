import React, { useState } from 'react';
import { useStore } from '../store/useStore';

const ResetPassword = ({ token }) => {
  const { resetPassword, authError, clearAuthError } = useStore();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ password: '', confirmPassword: '' });

  const handleChange = (e) => {
    clearAuthError();
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const mismatch = form.confirmPassword && form.password !== form.confirmPassword;

  const handleSubmit = async () => {
    if (!form.password || form.password.length < 8) return;
    if (form.password !== form.confirmPassword) return;
    setLoading(true);
    try {
      await resetPassword(token, form.password);
      setDone(true);
    } catch (err) {
      // authError set in store
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-center px-6">
      <div className="mb-10 text-center">
        <div className="w-16 h-16 bg-[#185FA5] rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto mb-4 shadow-lg shadow-blue-200">
          FL
        </div>
        <h1 className="text-2xl font-black text-[#0F172A]">Flowora</h1>
        <p className="text-[#94A3B8] text-sm font-medium mt-1">Set a new password</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm flex flex-col gap-4">
        {done ? (
          <>
            <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-green-700 text-sm font-medium">Your password has been reset. You can now sign in.</p>
            </div>
            <button
              onClick={goToLogin}
              className="w-full bg-[#185FA5] text-white py-4 rounded-2xl font-bold active:scale-95 transition-all mt-1"
            >
              Go to Sign In
            </button>
          </>
        ) : (
          <>
            <div>
              <label className="text-[#0F172A] text-xs font-bold uppercase tracking-wide mb-1.5 block">New Password</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="••••••••"
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#185FA5] transition-colors" />
              <p className="text-[#94A3B8] text-xs mt-1 ml-1">Minimum 8 characters</p>
            </div>

            <div>
              <label className="text-[#0F172A] text-xs font-bold uppercase tracking-wide mb-1.5 block">Confirm Password</label>
              <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="••••••••"
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#185FA5] transition-colors" />
              {mismatch && <p className="text-red-500 text-xs mt-1 ml-1">Passwords don't match</p>}
            </div>

            {authError && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-600 text-sm font-medium">⚠️ {authError}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !form.password || form.password.length < 8 || mismatch || !form.confirmPassword}
              className="w-full bg-[#185FA5] text-white py-4 rounded-2xl font-bold disabled:opacity-60 active:scale-95 transition-all mt-1"
            >
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </>
        )}
      </div>

      <p className="text-center text-[#CBD5E1] text-[10px] font-bold uppercase tracking-widest mt-8">
        Flowora · Secure payments via Paystack
      </p>
    </div>
  );
};

export default ResetPassword;