import React, { useEffect, useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { apiFetch } from '../utils/apiFetch';
import FAlert from '../components/FAlert';
import FSpinner from '../components/FSpinner';
import {
  Users, Copy, Check, Plus, X, Trash2, Shield, ChevronDown, Link2,
} from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.floworax.com.ng';

const PERMISSION_OPTIONS = [
  { key: 'sales', label: 'Sales' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'customers', label: 'Customers' },
  { key: 'events', label: 'Events' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'reports', label: 'Reports' },
];

const TeamManagement = () => {
  const { token, user } = useStore();
  const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const joinLink = user?.slug
    ? `${window.location.origin}/join/${user.slug}`
    : (user?.id ? `${window.location.origin}/join/${user.id}` : '');

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', name: '', role: 'staff', permissions: [] });
  const [inviting, setInviting] = useState(false);
  const [lastInviteLink, setLastInviteLink] = useState('');

  const [editingId, setEditingId] = useState(null);

  const loadStaff = useCallback(async () => {
    if (!token) return;
    try {
      const res = await apiFetch(`${BACKEND_URL}/api/staff`, { headers: authHeaders });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load team');
      setStaff(data.staff || []);
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadStaff();
      setLoading(false);
    })();
  }, [loadStaff]);

  const copyJoinLink = async () => {
    try {
      await navigator.clipboard.writeText(joinLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy automatically - select and copy the link manually.');
    }
  };

  const togglePermission = (key) => {
    setInviteForm((f) => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter((p) => p !== key)
        : [...f.permissions, key],
    }));
  };

  const sendInvite = async () => {
    if (!inviteForm.email.trim()) { setError('Enter an email address.'); return; }
    setInviting(true);
    setError('');
    try {
      const res = await apiFetch(`${BACKEND_URL}/api/staff/invite`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(inviteForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send invite');
      setSuccess(data.emailSent ? `Invite emailed to ${inviteForm.email}.` : `Invite created. Email delivery is not confirmed - share the link directly for now.`);
      setLastInviteLink(data.inviteLink || '');
      setShowInvite(false);
      setInviteForm({ email: '', name: '', role: 'staff', permissions: [] });
      await loadStaff();
    } catch (err) {
      setError(err.message);
    } finally {
      setInviting(false);
    }
  };

  const updatePermissions = async (staffId, patch) => {
    setError('');
    try {
      const res = await apiFetch(`${BACKEND_URL}/api/staff/${staffId}/permissions`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      await loadStaff();
    } catch (err) {
      setError(err.message);
    }
  };

  const removeStaff = async (member) => {
    if (!window.confirm(`Remove ${member.name || member.email} from your team?`)) return;
    setError('');
    try {
      const res = await apiFetch(`${BACKEND_URL}/api/staff/${member._id}`, { method: 'DELETE', headers: authHeaders });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove');
      setSuccess('Removed from your team.');
      await loadStaff();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="py-24"><FSpinner message="Loading your team" /></div>;
  }

  return (
    <div className="pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Team</h1>
        <p className="text-sm text-slate-500 mt-1">Your public join link, and everyone who has access to your account.</p>
      </div>

      {error && <div className="mb-4"><FAlert type="error" message={error} onDismiss={() => setError('')} /></div>}
      {success && <div className="mb-4"><FAlert type="success" message={success} onDismiss={() => setSuccess('')} autoDismiss={5000} /></div>}

      {/* Join link */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Link2 size={16} className="text-[#185FA5]" />
          <p className="font-black text-[#0F172A]">Your join link</p>
        </div>
        <p className="text-sm text-slate-500 mb-3">Share this with customers or members so they can register themselves - no login needed on their end.</p>
        <div className="flex items-center gap-2">
          <input readOnly value={joinLink} className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-slate-600 bg-slate-50 truncate" />
          <button
            onClick={copyJoinLink}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-black text-white bg-[#185FA5] active:scale-95 transition-transform flex-shrink-0"
          >
            {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
          </button>
        </div>
      </div>

      {lastInviteLink && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6">
          <p className="text-xs font-black uppercase tracking-wider text-amber-700 mb-1.5">Latest invite link (share manually if email isn't confirmed)</p>
          <p className="text-xs font-mono text-amber-800 break-all">{lastInviteLink}</p>
        </div>
      )}

      {/* Staff list */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm font-bold text-slate-500">{staff.length} team member{staff.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 bg-[#185FA5] text-white px-4 py-2.5 rounded-xl text-sm font-black active:scale-95 transition-transform"
        >
          <Plus size={16} /> Invite Staff
        </button>
      </div>

      {staff.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <Users className="mx-auto text-slate-300 mb-3" size={40} />
          <p className="font-bold text-[#0F172A]">No staff yet</p>
          <p className="text-sm text-slate-500 mt-1">Invite someone to give them limited access to parts of your account.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {staff.map((member) => (
            <div key={member._id} className="bg-white rounded-2xl border border-slate-100 p-4 lg:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#EEF4FF] flex items-center justify-center flex-shrink-0">
                    <Shield size={18} className="text-[#185FA5]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-[#0F172A] truncate">{member.name || member.email}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{member.email}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {member.role === 'manager' ? 'Manager (all access)' : (member.permissions?.length ? member.permissions.join(', ') : 'No permissions assigned')}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex-shrink-0 ${
                  member.accepted ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {member.accepted ? 'Active' : 'Pending'}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-50">
                <button
                  onClick={() => setEditingId(editingId === member._id ? null : member._id)}
                  className="flex items-center gap-1 text-xs font-bold text-[#185FA5] hover:underline"
                >
                  Edit permissions <ChevronDown size={12} className={editingId === member._id ? 'rotate-180 transition-transform' : 'transition-transform'} />
                </button>
                <span className="text-slate-200">|</span>
                <button onClick={() => removeStaff(member)} className="flex items-center gap-1 text-xs font-bold text-red-500 hover:underline">
                  <Trash2 size={12} /> Remove
                </button>
              </div>

              {editingId === member._id && (
                <div className="mt-4 pt-4 border-t border-slate-50 space-y-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-400">Role</label>
                    <select
                      value={member.role}
                      onChange={(e) => updatePermissions(member._id, { role: e.target.value })}
                      className="text-sm font-semibold border border-slate-200 rounded-lg px-2 py-1"
                    >
                      <option value="staff">Staff</option>
                      <option value="manager">Manager (all access)</option>
                    </select>
                  </div>
                  {member.role !== 'manager' && (
                    <div className="flex flex-wrap gap-2">
                      {PERMISSION_OPTIONS.map((p) => {
                        const active = member.permissions?.includes(p.key);
                        return (
                          <button
                            key={p.key}
                            onClick={() => updatePermissions(member._id, {
                              permissions: active
                                ? member.permissions.filter((x) => x !== p.key)
                                : [...(member.permissions || []), p.key],
                            })}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
                              active ? 'bg-[#185FA5] text-white' : 'bg-slate-50 text-slate-500'
                            }`}
                          >
                            {p.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showInvite && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4">
          <div className="bg-white rounded-t-3xl lg:rounded-3xl w-full lg:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between p-5 border-b border-slate-50">
              <p className="font-black text-[#0F172A]">Invite Staff</p>
              <button onClick={() => setShowInvite(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Email</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-[#185FA5]"
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Name (optional)</label>
                <input
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-[#185FA5]"
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Role</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager (all access)</option>
                </select>
              </div>
              {inviteForm.role !== 'manager' && (
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Permissions</label>
                  <div className="flex flex-wrap gap-2">
                    {PERMISSION_OPTIONS.map((p) => {
                      const active = inviteForm.permissions.includes(p.key);
                      return (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => togglePermission(p.key)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
                            active ? 'bg-[#185FA5] text-white' : 'bg-slate-50 text-slate-500'
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-white p-5 border-t border-slate-50 flex gap-3">
              <button onClick={() => setShowInvite(false)} className="flex-1 py-3 rounded-xl font-black text-slate-500 bg-slate-50">Cancel</button>
              <button
                onClick={sendInvite}
                disabled={inviting || !inviteForm.email.trim()}
                className="flex-1 py-3 rounded-xl font-black text-white bg-[#185FA5] disabled:opacity-50"
              >
                {inviting ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
