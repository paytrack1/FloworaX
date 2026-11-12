import React, { useEffect, useState } from 'react';
import { Copy, Check, Gift, Users, Wallet, ArrowUpRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Card, Badge, Button, SectionHeader } from './ui';

/**
 * ReferralCard — "Refer & Earn" block for Settings.
 * Shows code + shareable link, earnings stats and the referral list.
 */
const formatNaira = (n) => `₦${Number(n || 0).toLocaleString()}`;

const ReferralCard = () => {
  const { referral, referralError, fetchReferrals, requestWithdrawal } = useStore();
  const [copied, setCopied] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState(null);

  useEffect(() => { fetchReferrals(); }, [fetchReferrals]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referral?.link || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable (insecure context) — user can long-press the link instead
    }
  };

  const handleWithdraw = async () => {
    setWithdrawing(true);
    setWithdrawMsg(null);
    try {
      const data = await requestWithdrawal();
      setWithdrawMsg({ type: 'ok', text: data.message });
    } catch (err) {
      setWithdrawMsg({ type: 'err', text: err.message });
    } finally {
      setWithdrawing(false);
    }
  };

  if (referralError) {
    return (
      <Card className="p-5">
        <SectionHeader title="Refer & earn" />
        <p className="text-body text-negative">{referralError}</p>
      </Card>
    );
  }

  if (!referral) {
    return (
      <Card className="p-5">
        <SectionHeader title="Refer & earn" />
        <p className="text-caption text-ink-muted">Loading…</p>
      </Card>
    );
  }

  const canWithdraw = referral.pending >= referral.minWithdrawal;

  return (
    <Card className="p-5">
      <SectionHeader
        title="Refer & earn"
        subtitle={`Share your link — earn ${referral.rewardPercent}% of their first subscription payment`}
      />

      {/* Link box */}
      <div className="flex items-center gap-2 bg-surface-sunken rounded-field px-3.5 py-3 mb-4">
        <Gift size={16} className="text-brand-600 shrink-0" aria-hidden />
        <input
          readOnly
          value={referral.link}
          onFocus={(e) => e.target.select()}
          className="flex-1 min-w-0 bg-transparent text-caption text-ink-secondary outline-none"
          aria-label="Your referral link"
        />
        <button
          onClick={copyLink}
          className="shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-field bg-brand-500 text-white text-micro font-bold hover:bg-brand-600 active:scale-95 transition-all"
        >
          {copied ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} strokeWidth={2.5} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-surface-sunken rounded-field p-3">
          <Users size={14} className="text-ink-muted mb-1" aria-hidden />
          <p className="text-title text-ink">{referral.referredCount}</p>
          <p className="text-micro font-bold uppercase tracking-wide text-ink-muted">Signed up</p>
        </div>
        <div className="bg-surface-sunken rounded-field p-3">
          <Check size={14} className="text-positive mb-1" aria-hidden />
          <p className="text-title text-ink">{referral.convertedCount}</p>
          <p className="text-micro font-bold uppercase tracking-wide text-ink-muted">Converted</p>
        </div>
        <div className="bg-positive-soft rounded-field p-3">
          <Wallet size={14} className="text-positive mb-1" aria-hidden />
          <p className="text-title text-positive">{formatNaira(referral.pending)}</p>
          <p className="text-micro font-bold uppercase tracking-wide text-positive">Earned</p>
        </div>
      </div>

      {withdrawMsg && (
        <p className={`text-caption mb-3 ${withdrawMsg.type === 'ok' ? 'text-positive' : 'text-negative'}`} role="status">
          {withdrawMsg.text}
        </p>
      )}

      <Button
        variant={canWithdraw ? 'primary' : 'secondary'}
        size="sm"
        icon={ArrowUpRight}
        loading={withdrawing}
        onClick={handleWithdraw}
        disabled={!canWithdraw}
      >
        {canWithdraw
          ? `Withdraw ${formatNaira(referral.pending)}`
          : `Min withdrawal ${formatNaira(referral.minWithdrawal)}`}
      </Button>

      {/* Referral list */}
      {referral.referrals?.length > 0 && (
        <ul className="divide-y divide-slate-100 mt-4">
          {referral.referrals.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-3">
              <div className="min-w-0">
                <p className="text-body font-semibold text-ink truncate">{r.businessName}</p>
                <p className="text-caption text-ink-muted">{r.email}</p>
              </div>
              <Badge tone={r.status === 'earned' ? 'success' : 'neutral'} dot>
                {r.status === 'earned' ? `+${referral.rewardPercent}% earned` : r.status}
              </Badge>
            </li>
          ))}
        </ul>
      )}

      <p className="text-caption text-ink-muted mt-4">
        How it works: share your link → they sign up → the moment they subscribe to a paid plan,
        you earn {referral.rewardPercent}% of that first subscription payment. Withdraw anytime above
        the {formatNaira(referral.minWithdrawal)} minimum.
      </p>
    </Card>
  );
};

export default ReferralCard;
