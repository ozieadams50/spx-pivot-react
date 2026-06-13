import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';

const ROLE_KEY     = { Subscriber: 'subscriber', Admin: 'admin', 'Super User': 'superuser' };
const SUB_LEVELS   = ['No Access', 'Trial', 'Monthly', 'Annual'];
const ROLES        = ['Subscriber', 'Admin', 'Super User'];
const PIVOT_OPTS   = ['Daily', 'Weekly', 'Monthly'];
const STYLE_OPTS   = ['Aggressive', 'Moderate', 'Conservative'];
const INDEX_OPTS   = ['SPX', 'XSP'];

const DEFAULTS = {
  firstName: '', lastName: '', suffix: '',
  email: '', phone: '',
  tradingStyle: 'Moderate', index: 'SPX', deltaTrigger: 0.35,
  pivotPeriods: ['Weekly'],
  notifEmail: false, notifNtfy: false,
  subscriptionLevel: 'No Access',
  role: 'Subscriber',
  password: '',
};

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-300">{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-white/10 bg-[#061018] px-3 py-2 text-sm text-white placeholder-slate-600 outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
    />
  );
}

function Segment({ options, value, onChange }) {
  return (
    <div className="flex gap-1.5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`flex-1 rounded-xl border py-2 text-xs font-medium transition ${
            value === opt
              ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300'
              : 'border-white/10 bg-white/5 text-slate-400 hover:border-cyan-500/30 hover:text-cyan-300'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function MultiToggle({ options, value, onChange }) {
  function toggle(opt) {
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  }
  return (
    <div className="flex gap-1.5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={`flex-1 rounded-xl border py-2 text-xs font-medium transition ${
            value.includes(opt)
              ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300'
              : 'border-white/10 bg-white/5 text-slate-400 hover:border-cyan-500/30 hover:text-cyan-300'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function ToggleSwitch({ label, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition ${
        checked
          ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300'
          : 'border-white/10 bg-white/5 text-slate-400 hover:border-cyan-500/30'
      }`}
    >
      <span className="relative inline-block h-4 w-8 rounded-full bg-slate-700 transition">
        <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${checked ? 'left-4 bg-cyan-300' : 'left-0.5'}`} />
      </span>
      {label}
    </button>
  );
}

export default function AddUser() {
  const navigate = useNavigate();
  const { role: currentRole } = useAuth();
  const [form,   setForm]   = useState({ ...DEFAULTS });
  const [error,  setError]  = useState('');
  const [saving, setSaving] = useState(false);

  function set(field) {
    return (val) => setForm((f) => ({ ...f, [field]: val }));
  }

  async function handleSubmit() {
    setError('');
    if (!form.firstName.trim() || !form.lastName.trim()) { setError('First Name and Last Name are required.'); return; }
    if (!form.email.trim())  { setError('Email is required.'); return; }
    if (!form.password)      { setError('Password is required.'); return; }

    setSaving(true);
    try {
      await apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          firstName:  form.firstName.trim(),
          lastName:   form.lastName.trim(),
          suffix:     form.suffix.trim(),
          email:      form.email.trim().toLowerCase(),
          phone:      form.phone.trim(),
          role:       ROLE_KEY[form.role] ?? 'subscriber',
        }),
      });
      navigate('/admin/users');
    } catch (err) {
      setError(err.message ?? 'Failed to create user.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Add User</h1>
        <p className="mt-1 text-sm text-slate-400">Register a new platform subscriber.</p>
      </div>

      <div className="max-w-2xl rounded-2xl border border-white/10 bg-[#0d1f2d] p-6 shadow-lg">

        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Identity</p>
        <div className="grid grid-cols-3 gap-3">
          <Field label="First Name"><TextInput value={form.firstName} onChange={set('firstName')} placeholder="Jane" /></Field>
          <Field label="Last Name"><TextInput value={form.lastName}   onChange={set('lastName')}  placeholder="Smith" /></Field>
          <Field label="Suffix"><TextInput value={form.suffix} onChange={set('suffix')} placeholder="Jr." /></Field>
        </div>

        <div className="mt-6 border-t border-white/10 pt-5">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Contact</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email"><TextInput value={form.email} onChange={set('email')} placeholder="jane@example.com" /></Field>
            <Field label="Phone"><TextInput value={form.phone} onChange={set('phone')} placeholder="+15551234567" /></Field>
          </div>
        </div>

        <div className="mt-6 border-t border-white/10 pt-5">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Trading Preferences</p>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Trading Style"><Segment options={STYLE_OPTS} value={form.tradingStyle} onChange={set('tradingStyle')} /></Field>
            <Field label="Index"><Segment options={INDEX_OPTS} value={form.index} onChange={set('index')} /></Field>
            <Field label="Delta Trigger">
              <input
                type="number" min={0.05} max={0.99} step={0.05}
                value={form.deltaTrigger}
                onChange={(e) => set('deltaTrigger')(parseFloat(e.target.value))}
                className="w-full rounded-xl border border-white/10 bg-[#061018] px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
              />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Pivot Periods">
              <MultiToggle options={PIVOT_OPTS} value={form.pivotPeriods} onChange={set('pivotPeriods')} />
            </Field>
          </div>
        </div>

        <div className="mt-6 border-t border-white/10 pt-5">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Alerts</p>
          <div className="flex gap-3">
            <ToggleSwitch label="Email Alerts" checked={form.notifEmail} onChange={set('notifEmail')} />
            <ToggleSwitch label="ntfy Push"    checked={form.notifNtfy}  onChange={set('notifNtfy')} />
          </div>
        </div>

        <div className="mt-6 border-t border-white/10 pt-5">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Access</p>
          <div className="space-y-4">
            <Field label="Subscription Level">
              <Segment options={SUB_LEVELS} value={form.subscriptionLevel} onChange={set('subscriptionLevel')} />
            </Field>
            <Field label="Role">
              <Segment
                options={currentRole === 'superuser' ? ROLES : ['Subscriber']}
                value={form.role}
                onChange={set('role')}
              />
              {currentRole !== 'superuser' && (
                <p className="mt-1.5 text-xs text-slate-500">Only Super Users can assign Admin or Super User roles.</p>
              )}
            </Field>
          </div>
        </div>

        <div className="mt-6 border-t border-white/10 pt-5">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Password</p>
          <Field label="Password">
            <TextInput type="password" value={form.password} onChange={set('password')} placeholder="••••••••" />
          </Field>
        </div>

        <div className="mt-6 border-t border-white/10 pt-5">
          {error && (
            <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#061018] transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create User'}
            </button>
            <button
              onClick={() => navigate('/admin/users')}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
