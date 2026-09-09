import React, { useEffect, useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { apiFetch } from '../utils/apiFetch';
import FAlert from '../components/FAlert';
import FSpinner from '../components/FSpinner';
import {
  MessageSquare, Plus, Pause, Play, Trash2, X, ChevronRight,
  Mail, Smartphone, CheckCircle2, XCircle, Clock, Coins,
} from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://flowora-backend-only.pxxl.run';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const CHANNEL_META = {
  whatsapp: { label: 'WhatsApp', icon: MessageSquare, color: 'text-green-600', bg: 'bg-green-50' },
  sms:      { label: 'SMS',      icon: Smartphone,    color: 'text-[#185FA5]', bg: 'bg-[#EEF4FF]' },
  email:    { label: 'Email',    icon: Mail,           color: 'text-amber-600', bg: 'bg-amber-50' },
};
const ALLOWED_VARS = ['firstName', 'lastName', 'fullName', 'businessName', 'serviceName', 'date', 'startTime', 'endTime', 'dayOfWeek'];

const EMPTY_FORM = {
  name: '',
  description: '',
  trigger: 'schedule',
  dayOfWeek: 0,
  startTime: '09:00',
  endTime: '',
  timezone: 'Africa/Lagos',
  reminder: { daysBefore: 1, atTime: '10:00' },
  audience: { mode: 'all', newWithinDays: 30, tag: '', customerIds: [] },
  channel: 'whatsapp',
  messageTemplate: 'Hello {{firstName}}, this is a reminder that {{serviceName}} is tomorrow at {{startTime}}. See you there!',
};

const TABS = [
  { id: 'automations', label: 'Automations' },
  { id: 'templates', label: 'Message Templates' },
  { id: 'log', label: 'Message Log' },
  { id: 'channels', label: 'Channels & Credits' },
];

const Communications = () => {
  const { token, user, setActiveTab } = useStore();
  const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const [tab, setTab] = useState('automations');
  const [automations, setAutomations] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const isPaidPlan = user?.plan === 'paid';

  const loadAutomations = useCallback(async () => {
    if (!token) return;
    try {
      const res = await apiFetch(`${BACKEND_URL}/api/automations`, { headers: authHeaders });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load automations');
      setAutomations(data.automations || []);
    } catch (err) {
      setError(err.message);
    }
  }, [token, authHeaders]);

  const loadLogs = useCallback(async () => {
    if (!token) return;
    try {
      const res = await apiFetch(`${BACKEND_URL}/api/automations/logs?limit=100`, { headers: authHeaders });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load message log');
      setLogs(data.logs || []);
    } catch (err) {
      setError(err.message);
    }
  }, [token, authHeaders]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadAutomations(), loadLogs()]);
      setLoading(false);
    })();
  }, [loadAutomations, loadLogs]);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, timezone: user?.timezone || 'Africa/Lagos' });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (a) => {
    setForm({
      name: a.name || '',
      description: a.description || '',
      trigger: a.trigger || 'schedule',
      dayOfWeek: a.dayOfWeek ?? 0,
      startTime: a.startTime || '09:00',
      endTime: a.endTime || '',
      timezone: a.timezone || user?.timezone || 'Africa/Lagos',
      reminder: { daysBefore: a.reminder?.daysBefore ?? 1, atTime: a.reminder?.atTime || '10:00' },
      audience: {
        mode: a.audience?.mode || 'all',
        newWithinDays: a.audience?.newWithinDays || 30,
        tag: a.audience?.tag || '',
        customerIds: a.audience?.customerIds || [],
      },
      channel: a.channel || 'whatsapp',
      messageTemplate: a.messageTemplate || '',
    });
    setEditingId(a._id);
    setShowForm(true);
  };

  const saveAutomation = async () => {
    setSaving(true);
    setError('');
    try {
      const url = editingId ? `${BACKEND_URL}/api/automations/${editingId}` : `${BACKEND_URL}/api/automations`;
      const method = editingId ? 'PATCH' : 'POST';
      const body = { ...form };
      if (body.trigger === 'new_member') {
        delete body.dayOfWeek; delete body.startTime; delete body.endTime;
        delete body.timezone; delete body.reminder;
      }
      const res = await apiFetch(url, { method, headers: authHeaders, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save automation');
      setSuccess(editingId ? 'Automation updated.' : 'Automation created.');
      setShowForm(false);
      await loadAutomations();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (a) => {
    setError('');
    try {
      const action = a.status === 'active' ? 'pause' : 'resume';
      const res = await apiFetch(`${BACKEND_URL}/api/automations/${a._id}/${action}`, { method: 'PATCH', headers: authHeaders });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action} automation`);
      setSuccess(action === 'pause' ? 'Automation paused. No further messages will send until resumed.' : 'Automation resumed.');
      await loadAutomations();
    } catch (err) {
      setError(err.message);
    }
  };

  const removeAutomation = async (a) => {
    if (!window.confirm(`Delete "${a.name}"? This cannot be undone.`)) return;
    setError('');
    try {
      const res = await apiFetch(`${BACKEND_URL}/api/automations/${a._id}`, { method: 'DELETE', headers: authHeaders });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete automation');
      setSuccess('Automation deleted.');
      await loadAutomations();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="py-24">
        <FSpinner message="Loading communications" />
      </div>
    );
  }

  return (
    <div className="pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Communications</h1>
        <p className="text-sm text-slate-500 mt-1">Recurring reminders, member welcomes, and message history â€” all opt-in and auditable.</p>
      </div>

      {error && <div className="mb-4"><FAlert type="error" message={error} onDismiss={() => setError('')} /></div>}
      {success && <div className="mb-4"><FAlert type="success" message={success} onDismiss={() => setSuccess('')} autoDismiss={4000} /></div>}

      {!isPaidPlan && (
        <div className="mb-4 bg-white rounded-2xl border border-[#185FA5]/20 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="font-black text-[#0F172A]">Communications is a Paid-plan feature</p>
            <p className="text-sm text-slate-500 mt-1">Upgrade to send automated reminders and messages, and to invite staff.</p>
          </div>
          <button
            onClick={() => setActiveTab('settings')}
            className="bg-[#185FA5] text-white px-4 py-2.5 rounded-xl text-sm font-black active:scale-95 transition-transform flex-shrink-0"
          >
            Upgrade to Paid
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-2xl p-1 border border-slate-100 w-fit overflow-x-auto max-w-full">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              tab === t.id ? 'bg-[#185FA5] text-white' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'automations' && (
        <AutomationsTab
          automations={automations}
          onCreate={openCreate}
          onEdit={openEdit}
          onToggle={toggleStatus}
          onDelete={removeAutomation}
        />
      )}

      {tab === 'templates' && <TemplatesTab automations={automations} onEdit={openEdit} />}

      {tab === 'log' && <MessageLogTab logs={logs} onRefresh={loadLogs} />}

      {tab === 'channels' && <ChannelsTab user={user} />}

      {showForm && (
        <AutomationFormModal
          form={form}
          setForm={setForm}
          editingId={editingId}
          saving={saving}
          onCancel={() => setShowForm(false)}
          onSave={saveAutomation}
        />
      )}
    </div>
  );
};

// â”€â”€ Automations list â”€â”€
const AutomationsTab = ({ automations, onCreate, onEdit, onToggle, onDelete }) => (
  <div>
    <div className="flex justify-between items-center mb-4">
      <p className="text-sm font-bold text-slate-500">{automations.length} automation{automations.length !== 1 ? 's' : ''}</p>
      <button
        onClick={onCreate}
        className="flex items-center gap-2 bg-[#185FA5] text-white px-4 py-2.5 rounded-xl text-sm font-black active:scale-95 transition-transform"
      >
        <Plus size={16} /> Create Automation
      </button>
    </div>

    {automations.length === 0 ? (
      <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
        <MessageSquare className="mx-auto text-slate-300 mb-3" size={40} />
        <p className="font-bold text-[#0F172A]">No automations yet</p>
        <p className="text-sm text-slate-500 mt-1">Create a recurring service reminder or a new-member welcome message.</p>
      </div>
    ) : (
      <div className="space-y-3">
        {automations.map((a) => {
          const meta = CHANNEL_META[a.channel] || CHANNEL_META.email;
          const Icon = meta.icon;
          return (
            <div key={a._id} className="bg-white rounded-2xl border border-slate-100 p-4 lg:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                    <Icon size={18} className={meta.color} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-[#0F172A] truncate">{a.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {a.trigger === 'new_member'
                        ? 'Fires once, when a new member registers'
                        : `Every ${DAY_NAMES[a.dayOfWeek]} at ${a.startTime} (${a.timezone}) Â· reminder ${a.reminder?.daysBefore ?? 1}d before at ${a.reminder?.atTime}`}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Audience: {audienceLabel(a.audience)} Â· {meta.label}
                      {a.nextRunDisplay ? ` Â· Next: ${a.nextRunDisplay}` : ''}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex-shrink-0 ${
                  a.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {a.status}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-50">
                <button onClick={() => onEdit(a)} className="text-xs font-bold text-[#185FA5] hover:underline">Edit</button>
                <span className="text-slate-200">Â·</span>
                <button onClick={() => onToggle(a)} className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:underline">
                  {a.status === 'active' ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Resume</>}
                </button>
                <span className="text-slate-200">Â·</span>
                <button onClick={() => onDelete(a)} className="flex items-center gap-1 text-xs font-bold text-red-500 hover:underline">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);

function audienceLabel(audience) {
  if (!audience) return 'All opted-in members';
  switch (audience.mode) {
    case 'new': return `New members (last ${audience.newWithinDays || 30}d)`;
    case 'group': return `Group: ${audience.tag || 'â€”'}`;
    case 'selected': return `${audience.customerIds?.length || 0} selected member(s)`;
    default: return 'All opted-in members';
  }
}

// â”€â”€ Templates tab: quick reference + jump into an automation's message â”€â”€
const TemplatesTab = ({ automations, onEdit }) => (
  <div className="space-y-4">
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <p className="font-black text-[#0F172A] mb-2">Available variables</p>
      <p className="text-xs text-slate-500 mb-3">Use these in any automation's message. Unknown variables are left blank â€” there's no code execution, just safe substitution.</p>
      <div className="flex flex-wrap gap-2">
        {ALLOWED_VARS.map((v) => (
          <code key={v} className="text-xs font-mono bg-[#EEF4FF] text-[#185FA5] px-2 py-1 rounded-lg">{'{{' + v + '}}'}</code>
        ))}
      </div>
    </div>

    <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50">
      {automations.length === 0 && (
        <p className="p-5 text-sm text-slate-400">Create an automation first to edit its message.</p>
      )}
      {automations.map((a) => (
        <button key={a._id} onClick={() => onEdit(a)} className="w-full flex items-center justify-between p-4 lg:p-5 text-left hover:bg-slate-50 transition-colors">
          <div className="min-w-0">
            <p className="font-bold text-[#0F172A] text-sm">{a.name}</p>
            <p className="text-xs text-slate-500 mt-1 truncate max-w-md">{a.messageTemplate}</p>
          </div>
          <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
        </button>
      ))}
    </div>
  </div>
);

// â”€â”€ Message log tab â”€â”€
const STATUS_META = {
  sent:                { label: 'Sent',        icon: CheckCircle2, color: 'text-green-600' },
  failed:              { label: 'Failed',      icon: XCircle,      color: 'text-red-500' },
  skipped_optout:      { label: 'Opted out',   icon: XCircle,      color: 'text-slate-400' },
  skipped_no_contact:  { label: 'No contact',  icon: XCircle,      color: 'text-slate-400' },
  skipped_no_credits:  { label: 'No credits',  icon: Coins,        color: 'text-amber-500' },
};

const MessageLogTab = ({ logs, onRefresh }) => (
  <div>
    <div className="flex justify-between items-center mb-4">
      <p className="text-sm font-bold text-slate-500">{logs.length} message{logs.length !== 1 ? 's' : ''} (last 100)</p>
      <button onClick={onRefresh} className="text-xs font-bold text-[#185FA5] hover:underline">Refresh</button>
    </div>

    {logs.length === 0 ? (
      <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
        <Clock className="mx-auto text-slate-300 mb-3" size={36} />
        <p className="font-bold text-[#0F172A]">No messages sent yet</p>
        <p className="text-sm text-slate-500 mt-1">Once an automation runs, every attempt shows up here â€” sent, failed, or skipped.</p>
      </div>
    ) : (
      <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50 overflow-hidden">
        {logs.map((log) => {
          const meta = STATUS_META[log.status] || STATUS_META.failed;
          const Icon = meta.icon;
          return (
            <div key={log._id} className="flex items-center justify-between gap-3 p-3.5 lg:p-4">
              <div className="flex items-center gap-3 min-w-0">
                <Icon size={16} className={`flex-shrink-0 ${meta.color}`} />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#0F172A] truncate">
                    {log.customerId?.name || 'Unknown member'}
                    <span className="text-slate-400 font-medium"> Â· {log.automationId?.name || log.messageType}</span>
                  </p>
                  <p className="text-xs text-slate-400">
                    {CHANNEL_META[log.channel]?.label || log.channel} Â· {log.recipient || 'no contact'}
                    {log.failureReason ? ` Â· ${log.failureReason}` : ''}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-xs font-black ${meta.color}`}>{meta.label}</p>
                <p className="text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleString()}</p>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);

// â”€â”€ Channels & credits tab â”€â”€
const ChannelsTab = ({ user }) => (
  <div className="space-y-4">
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center gap-2 mb-1">
        <Coins size={16} className="text-[#185FA5]" />
        <p className="font-black text-[#0F172A]">Messaging credits</p>
      </div>
      <p className="text-sm text-slate-500">
        {user?.messagingCredits === null || user?.messagingCredits === undefined
          ? 'Unlimited / not yet metered on your plan.'
          : `${user.messagingCredits} credit(s) remaining.`}
      </p>
      <p className="text-xs text-slate-400 mt-2">Each successfully delivered message consumes 1 credit, deducted only after the provider confirms it was accepted.</p>
    </div>

    <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50">
      {Object.entries(CHANNEL_META).map(([key, meta]) => {
        const Icon = meta.icon;
        return (
          <div key={key} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${meta.bg}`}>
                <Icon size={16} className={meta.color} />
              </div>
              <p className="font-bold text-[#0F172A] text-sm">{meta.label}</p>
            </div>
            <p className="text-xs text-slate-400">Provider status shown when you send your first {meta.label} message</p>
          </div>
        );
      })}
    </div>
    <p className="text-xs text-slate-400 px-1">
      Email sends through Resend. SMS and WhatsApp currently use mock/test providers for development. Configure real provider credentials on the backend for production delivery.
    </p>
  </div>
);

// â”€â”€ Create/Edit automation modal â”€â”€
const AutomationFormModal = ({ form, setForm, editingId, saving, onCancel, onSave }) => {
  const update = (patch) => setForm((f) => ({ ...f, ...patch }));
  const updateReminder = (patch) => setForm((f) => ({ ...f, reminder: { ...f.reminder, ...patch } }));
  const updateAudience = (patch) => setForm((f) => ({ ...f, audience: { ...f.audience, ...patch } }));

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4">
      <div className="bg-white rounded-t-3xl lg:rounded-3xl w-full lg:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex items-center justify-between p-5 border-b border-slate-50">
          <p className="font-black text-[#0F172A]">{editingId ? 'Edit Automation' : 'Create Automation'}</p>
          <button onClick={onCancel}><X size={20} className="text-slate-400" /></button>
        </div>

        <div className="p-5 space-y-4">
          <Field label="Trigger">
            <select value={form.trigger} onChange={(e) => update({ trigger: e.target.value })} className={inputCls}>
              <option value="schedule">Recurring schedule (service/session reminder)</option>
              <option value="new_member">New member welcome (fires once, on registration)</option>
            </select>
          </Field>

          <Field label="Name">
            <input value={form.name} onChange={(e) => update({ name: e.target.value })} placeholder="Sunday Service" className={inputCls} />
          </Field>

          <Field label="Description (optional)">
            <input value={form.description} onChange={(e) => update({ description: e.target.value })} placeholder="Weekly Sunday morning service" className={inputCls} />
          </Field>

          {form.trigger === 'schedule' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Day of week">
                  <select value={form.dayOfWeek} onChange={(e) => update({ dayOfWeek: Number(e.target.value) })} className={inputCls}>
                    {DAY_NAMES.map((d, i) => <option key={d} value={i}>{d}</option>)}
                  </select>
                </Field>
                <Field label="Start time">
                  <input type="time" value={form.startTime} onChange={(e) => update({ startTime: e.target.value })} className={inputCls} />
                </Field>
              </div>

              <Field label="Timezone">
                <input value={form.timezone} onChange={(e) => update({ timezone: e.target.value })} placeholder="Africa/Lagos" className={inputCls} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Remind (days before)">
                  <input type="number" min={0} value={form.reminder.daysBefore} onChange={(e) => updateReminder({ daysBefore: Number(e.target.value) })} className={inputCls} />
                </Field>
                <Field label="Reminder send time">
                  <input type="time" value={form.reminder.atTime} onChange={(e) => updateReminder({ atTime: e.target.value })} className={inputCls} />
                </Field>
              </div>
            </>
          )}

          <Field label="Audience">
            <select value={form.audience.mode} onChange={(e) => updateAudience({ mode: e.target.value })} className={inputCls}>
              <option value="all">All opted-in members</option>
              <option value="new">New members</option>
              <option value="group">A specific group (tag)</option>
              <option value="selected">Selected members</option>
            </select>
          </Field>
          {form.audience.mode === 'group' && (
            <Field label="Group tag">
              <input value={form.audience.tag} onChange={(e) => updateAudience({ tag: e.target.value })} placeholder="youth" className={inputCls} />
            </Field>
          )}

          <Field label="Channel">
            <select value={form.channel} onChange={(e) => update({ channel: e.target.value })} className={inputCls}>
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp (mock)</option>
              <option value="sms">SMS (mock)</option>
            </select>
          </Field>

          <Field label="Message">
            <textarea
              value={form.messageTemplate}
              onChange={(e) => update({ messageTemplate: e.target.value })}
              rows={4}
              className={inputCls}
              placeholder="Hello {{firstName}}, this is a reminder that {{serviceName}} is tomorrow at {{startTime}}."
            />
            <p className="text-[11px] text-slate-400 mt-1">Variables: {ALLOWED_VARS.map((v) => '{{' + v + '}}').join(' ')}</p>
          </Field>
        </div>

        <div className="sticky bottom-0 bg-white p-5 border-t border-slate-50 flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl font-black text-slate-500 bg-slate-50">Cancel</button>
          <button
            onClick={onSave}
            disabled={saving || !form.name.trim() || !form.messageTemplate.trim()}
            className="flex-1 py-3 rounded-xl font-black text-white bg-[#185FA5] disabled:opacity-50"
          >
            {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Automation'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div>
    <label className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5 block">{label}</label>
    {children}
  </div>
);

const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-[#0F172A] focus:outline-none focus:border-[#185FA5]';

export default Communications;
