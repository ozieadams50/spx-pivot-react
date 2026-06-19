import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';

// ── Role mapping (API keys ↔ display labels) ──────────────────────────────────

const ROLE_DISPLAY = { subscriber: 'Subscriber', admin: 'Admin', superuser: 'Super User' };
const ROLE_KEY     = { Subscriber: 'subscriber', Admin: 'admin', 'Super User': 'superuser' };

function normalizeUser(u) {
  return { ...u, role: ROLE_DISPLAY[u.role] ?? u.role };
}

function toApiBody(form) {
  const body = { ...form, role: ROLE_KEY[form.role] ?? form.role };
  if (!body.password) delete body.password;
  return body;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fullName(u) {
  return [u.firstName, u.lastName, u.suffix].filter(Boolean).join(' ');
}

const SUB_LEVELS = ['No Access', 'Trial', 'Monthly', 'Annual'];
const ROLES      = ['Subscriber', 'Admin', 'Super User'];
const PIVOT_OPTS = ['Daily', 'Weekly', 'Monthly'];
const STYLE_OPTS = ['Aggressive', 'Moderate', 'Conservative'];
const INDEX_OPTS = ['SPX', 'XSP'];

// ── Shared form widgets ───────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[var(--c-text-secondary)]">{label}</label>
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
      className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-page)] px-3 py-2 text-sm text-[var(--c-text-primary)] placeholder-[var(--c-text-faint)] outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
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
              ? 'border-cyan-500/50 bg-cyan-500/15 text-[var(--c-cyan)]'
              : 'border-[var(--c-border)] bg-[var(--c-hover)] text-[var(--c-text-muted)] hover:border-cyan-500/30 hover:text-[var(--c-cyan)]'
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
              ? 'border-cyan-500/50 bg-cyan-500/15 text-[var(--c-cyan)]'
              : 'border-[var(--c-border)] bg-[var(--c-hover)] text-[var(--c-text-muted)] hover:border-cyan-500/30 hover:text-[var(--c-cyan)]'
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
          ? 'border-cyan-500/50 bg-cyan-500/15 text-[var(--c-cyan)]'
          : 'border-[var(--c-border)] bg-[var(--c-hover)] text-[var(--c-text-muted)] hover:border-cyan-500/30'
      }`}
    >
      <span className="relative inline-block h-4 w-8 rounded-full bg-slate-700 transition">
        <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${checked ? 'left-4 bg-cyan-300' : 'left-0.5'}`} />
      </span>
      {label}
    </button>
  );
}

// ── Badge components ──────────────────────────────────────────────────────────

function SubBadge({ level }) {
  const cls =
    level === 'Annual'  ? 'bg-emerald-500/15 text-[var(--c-emerald-strong)]' :
    level === 'Monthly' ? 'bg-cyan-500/15 text-[var(--c-cyan)]'       :
    level === 'Trial'   ? 'bg-amber-500/15 text-[var(--c-amber)]'     :
                          'bg-[var(--c-hover)] text-[var(--c-text-dimmed)]';
  return <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${cls}`}>{level}</span>;
}

function RoleBadge({ role }) {
  const cls =
    role === 'Super User' ? 'bg-violet-500/15 text-[var(--c-violet)]' :
    role === 'Admin'      ? 'bg-cyan-500/15 text-[var(--c-cyan)]'     :
                            'bg-amber-500/15 text-[var(--c-amber)]';
  return <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${cls}`}>{role ?? 'Subscriber'}</span>;
}

function ActiveBadge({ active }) {
  return (
    <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${active ? 'bg-emerald-500/15 text-[var(--c-emerald-strong)]' : 'bg-rose-500/15 text-[var(--c-rose-strong)]'}`}>
      {active ? 'Yes' : 'No'}
    </span>
  );
}

// ── Edit modal ────────────────────────────────────────────────────────────────

function EditModal({ user, onClose, onSave, onDelete, onToggleActive, currentRole, saving }) {
  const [form,       setForm]       = useState({ ...user });
  const [confirmDel, setConfirmDel] = useState(false);
  const [newPwd,     setNewPwd]     = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdError,   setPwdError]   = useState('');

  function set(field) {
    return (val) => setForm((f) => ({ ...f, [field]: val }));
  }

  function handleSaveWithPwd(form) {
    if (newPwd || confirmPwd) {
      if (newPwd.length < 6) { setPwdError('Password must be at least 6 characters.'); return; }
      if (newPwd !== confirmPwd) { setPwdError('Passwords do not match.'); return; }
      onSave({ ...form, password: newPwd });
    } else {
      onSave(form);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-auto rounded-[28px] border border-[var(--c-border)] bg-[var(--c-bg-dropdown)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--c-border)] px-6 py-5">
          <div>
            <h3 className="text-xl font-bold text-[var(--c-text-primary)]">Edit User</h3>
            <p className="mt-0.5 text-sm text-[var(--c-text-muted)]">{fullName(user)}</p>
          </div>
          <button onClick={onClose} className="rounded-2xl border border-[var(--c-border)] px-4 py-2 text-[var(--c-text-muted)] transition-colors hover:bg-[var(--c-hover)] hover:text-[var(--c-text-primary)]">✕</button>
        </div>

        <div className="p-6">

          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--c-text-faint)]">Identity</p>
          <div className="grid grid-cols-3 gap-3">
            <Field label="First Name"><TextInput value={form.firstName} onChange={set('firstName')} placeholder="Jane" /></Field>
            <Field label="Last Name"><TextInput value={form.lastName}  onChange={set('lastName')}  placeholder="Smith" /></Field>
            <Field label="Suffix"><TextInput value={form.suffix} onChange={set('suffix')} placeholder="Jr." /></Field>
          </div>

          <div className="mt-6 border-t border-[var(--c-border)] pt-5">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--c-text-faint)]">Contact</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email"><TextInput value={form.email} onChange={set('email')} placeholder="jane@example.com" /></Field>
              <Field label="Phone"><TextInput value={form.phone} onChange={set('phone')} placeholder="+15551234567" /></Field>
            </div>
          </div>

          <div className="mt-6 border-t border-[var(--c-border)] pt-5">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--c-text-faint)]">Trading Preferences</p>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Trading Style"><Segment options={STYLE_OPTS} value={form.tradingStyle} onChange={set('tradingStyle')} /></Field>
              <Field label="Index"><Segment options={INDEX_OPTS} value={form.index} onChange={set('index')} /></Field>
              <Field label="Delta Trigger">
                <input
                  type="number" min={0.05} max={0.99} step={0.05}
                  value={form.deltaTrigger}
                  onChange={(e) => set('deltaTrigger')(parseFloat(e.target.value))}
                  className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-page)] px-3 py-2 text-sm text-[var(--c-text-primary)] outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Pivot Periods">
                <MultiToggle options={PIVOT_OPTS} value={form.pivotPeriods} onChange={set('pivotPeriods')} />
              </Field>
            </div>
          </div>

          <div className="mt-6 border-t border-[var(--c-border)] pt-5">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--c-text-faint)]">Alerts</p>
            <div className="flex gap-3">
              <ToggleSwitch label="Email Alerts" checked={form.notifEmail} onChange={set('notifEmail')} />
              <ToggleSwitch label="ntfy Push"    checked={form.notifNtfy}  onChange={set('notifNtfy')} />
            </div>
          </div>

          <div className="mt-6 border-t border-[var(--c-border)] pt-5">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--c-text-faint)]">Access</p>
            <div className="space-y-4">
              <Field label="Subscription Level">
                <Segment options={SUB_LEVELS} value={form.subscriptionLevel} onChange={set('subscriptionLevel')} />
              </Field>
              <Field label="Role">
                <Segment
                  options={currentRole === 'superuser' ? ROLES : ['Subscriber']}
                  value={form.role ?? 'Subscriber'}
                  onChange={set('role')}
                />
                {currentRole !== 'superuser' && (
                  <p className="mt-1.5 text-xs text-[var(--c-text-dimmed)]">Only Super Users can assign Admin or Super User roles.</p>
                )}
              </Field>
            </div>
          </div>

          <div className="mt-6 border-t border-[var(--c-border)] pt-5">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--c-text-faint)]">Reset Password</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="New Password">
                <TextInput type="password" value={newPwd} onChange={(v) => { setNewPwd(v); setPwdError(''); }} placeholder="Leave blank to keep current" />
              </Field>
              <Field label="Confirm Password">
                <TextInput type="password" value={confirmPwd} onChange={(v) => { setConfirmPwd(v); setPwdError(''); }} placeholder="Repeat new password" />
              </Field>
            </div>
            {pwdError && <p className="mt-2 text-xs text-[var(--c-rose)]">{pwdError}</p>}
          </div>

          <div className="mt-6 border-t border-[var(--c-border)] pt-5">
            <div className="flex gap-3">
              <button
                onClick={() => handleSaveWithPwd(form)}
                disabled={saving}
                className="flex-1 rounded-xl bg-[var(--c-btn-bg)] px-4 py-2.5 text-sm font-semibold text-[var(--c-btn-text)] transition hover:bg-[var(--c-btn-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-[var(--c-border)] bg-[var(--c-hover)] px-4 py-2.5 text-sm text-[var(--c-text-secondary)] transition hover:bg-[var(--c-hover-strong)]"
              >
                Cancel
              </button>
            </div>
          </div>

          <div className="mt-4">
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--c-text-dimmed)]">Danger Zone</p>
              <div className="flex gap-3">
                <button
                  onClick={() => onToggleActive(user)}
                  disabled={saving}
                  className="flex-1 rounded-xl border border-[var(--c-border)] bg-[var(--c-hover)] px-3 py-2 text-sm text-[var(--c-text-secondary)] transition hover:bg-[var(--c-hover-strong)] disabled:opacity-50"
                >
                  {user.isActive ? 'Deactivate User' : 'Reactivate User'}
                </button>
                {!confirmDel ? (
                  <button
                    onClick={() => setConfirmDel(true)}
                    className="flex-1 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-[var(--c-rose-strong)] transition hover:bg-rose-500/20"
                  >
                    Delete User
                  </button>
                ) : (
                  <div className="flex flex-1 gap-2">
                    <button
                      onClick={() => onDelete(user.id)}
                      disabled={saving}
                      className="flex-1 rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-[var(--c-text-primary)] transition hover:bg-rose-500 disabled:opacity-50"
                    >
                      Confirm Delete
                    </button>
                    <button
                      onClick={() => setConfirmDel(false)}
                      className="flex-1 rounded-xl border border-[var(--c-border)] bg-[var(--c-hover)] px-3 py-2 text-sm text-[var(--c-text-secondary)] transition hover:bg-[var(--c-hover-strong)]"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ManageUsers() {
  const { role: currentRole }         = useAuth();
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [query,       setQuery]       = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/users');
      setUsers(data.map(normalizeUser));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleSave(form) {
    setSaving(true);
    try {
      const updated = await apiFetch(`/users/${form.id}`, {
        method: 'PUT',
        body: JSON.stringify(toApiBody(form)),
      });
      setUsers((prev) => prev.map((u) => u.id === updated.id ? normalizeUser(updated) : u));
      setEditingUser(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setSaving(true);
    try {
      await apiFetch(`/users/${id}`, { method: 'DELETE' });
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setEditingUser(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(user) {
    setSaving(true);
    try {
      const updated = await apiFetch(`/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      setUsers((prev) => prev.map((u) => u.id === updated.id ? normalizeUser(updated) : u));
      setEditingUser(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const q = query.trim().toLowerCase();
  const filtered = q
    ? users.filter((u) => fullName(u).toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    : users;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--c-text-primary)]">Manage Users</h1>
        <p className="mt-1 text-sm text-[var(--c-text-muted)]">Platform subscribers. Click a name to view or edit.</p>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-[var(--c-rose-strong)]">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-4 text-[var(--c-rose)] hover:text-rose-200">✕</button>
        </div>
      )}

      <div className="mb-4 max-w-sm">
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--c-text-dimmed)]">&#9906;</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-panel)] py-2 pl-9 pr-4 text-sm text-[var(--c-text-primary)] placeholder-[var(--c-text-faint)] outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute inset-y-0 right-3 flex items-center text-[var(--c-text-dimmed)] hover:text-[var(--c-text-secondary)] transition-colors">✕</button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-panel)]">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 animate-pulse rounded-xl bg-[var(--c-hover)]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-sm text-[var(--c-text-muted)]">
            {q ? `No users match "${query}".` : 'No users yet.'}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--c-border)] text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Style</th>
                <th className="px-4 py-3 text-left">Index</th>
                <th className="px-4 py-3 text-left">Subscription</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Active</th>
                <th className="px-4 py-3 text-left">Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr
                  key={u.id}
                  className={`transition-colors hover:bg-[var(--c-hover)] ${i < filtered.length - 1 ? 'border-b border-[var(--c-border-subtle)]' : ''}`}
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setEditingUser(u)}
                      className="font-medium text-[var(--c-cyan-strong)] transition-colors hover:text-[var(--c-cyan)] hover:underline"
                    >
                      {fullName(u)}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-[var(--c-text-secondary)]">{u.email}</td>
                  <td className="px-4 py-3 text-[var(--c-text-muted)]">{u.tradingStyle}</td>
                  <td className="px-4 py-3 text-[var(--c-text-muted)]">{u.index}</td>
                  <td className="px-4 py-3"><SubBadge level={u.subscriptionLevel} /></td>
                  <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                  <td className="px-4 py-3"><ActiveBadge active={u.isActive} /></td>
                  <td className="px-4 py-3 text-[var(--c-text-dimmed)]">{u.updatedAt?.slice(0, 10) ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editingUser && (
        <EditModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSave}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
          currentRole={currentRole}
          saving={saving}
        />
      )}
    </div>
  );
}
