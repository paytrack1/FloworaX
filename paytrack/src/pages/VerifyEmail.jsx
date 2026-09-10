import React, { useState } from 'react';
import FAlert   from '../components/FAlert';
import FSpinner from '../components/FSpinner';
import { useStore } from '../store/useStore';

const VerifyEmail = () => {
  const { verifyEmail, resendOtp, user, logout } = useStore();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resent, setResent] = useState(false);

  const handleVerify = async () => {
    if (!code.trim()) return;
    setError('');
    setLoading(true);
    try {
      await verifyEmail(code.trim());
    } catch (err) {
      setError(err.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-center px-6">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-[#185FA5] rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto mb-4 shadow-lg shadow-blue-200">
          FL
        </div>
        <h1 className="text-2xl font-black text-[#0F172A]">Verify your email</h1>
        <p className="text-[#94A3B8] text-sm font-medium mt-1">
          We sent a 6-digit code to {user?.email}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm flex flex-col gap-4">
        <div>
          <label className="text-[#0F172A] text-xs font-bold uppercase tracking-wide mb-1.5 block">
            Verification Code
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="123456"
            className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-center text-lg tracking-[0.5em] font-bold text-[#0F172A] outline-none focus:border-[#185FA5] transition-colors"
          />
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}

        {resent && !error && (
          <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-green-700 text-sm font-medium">New code sent</p>
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={loading || code.length !== 6}
          className="w-full bg-[#185FA5] text-white py-4 rounded-2xl font-bold disabled:opacity-60 active:scale-95 transition-all"
        >
          {loading ? <FSpinner size='sm' /> : 'Verify'}
        </button>

        <button
          onClick={handleResend}
          className="w-full text-[#185FA5] text-sm font-bold py-2"
        >
          Resend code
        </button>

        <button
          onClick={logout}
          className="w-full text-[#94A3B8] text-xs font-medium py-1"
        >
          Sign out
        </button>
      </div>
    </div>
  );
};

export default VerifyEmail;