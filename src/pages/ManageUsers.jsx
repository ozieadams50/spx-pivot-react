import { useState, useEffect } from 'react';

const SEED_USERS = [
  {
    id: 1,
    firstName: 'Jane', lastName: 'Smith', suffix: '',
    email: 'jane@example.com', phone: '+15551234567',
    tradingStyle: 'Moderate', index: 'SPX', deltaTrigger: 0.35,
    pivotPeriods: ['Weekly'],
    notifEmail: true, notifNtfy: false,
    subscriptionLevel: 'Monthly',
    isActive: true, updatedAt: '2026-05-15T10:00:00',
  },
  {
    id: 2,
    firstName: 'John', lastName: 'Doe', suffix: 'Jr.',
    email: 'john@example.com', phone: '',
    tradingStyle: 'Aggressive', index: 'XSP', deltaTrigger: 0.25,
    pivotPeriods: ['Daily', 'Weekly'],
    notifEmail: false, notifNtfy: true,
    subscriptionLevel: 'Annual',
    isActive: true, updatedAt: '2026-05-20T14:30:00',
  },
];

function loadUsers() {
  try {
    const stored = JSON.parse(localStorage.getItem('manage_users'));
    return stored?.length ? stored : SEED_USERS;
  } catch { return SEED_USERS; }
}

function saveUsers(users) {
  localStorage.setItem('manage_users', JSON.stringify(users));
}

function fullName(u) {
  return [u.firstName, u.lastName, u.suffix].filter(Boolean).join(' ');
}

const SUB_LEVELS   = ['No Access', 'Trial', 'Monthly', 'Annual'];
const PIVOT_OPTS   = ['Daily', 'Weekly', 'Monthly'];
const STYLE_OPTS   = ['Aggressive', 'Moderate', 'Conservative'];
const INDEX_OPTS   = ['SPX', 'XSP'];

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

function Toggle({ label, checked, onChange }) {
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
        <span
          className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${
            checked ? 'left-4 bg-cyan-300' : 'left-0.5'
          }`}
        />
      </span>
      {label}
    </button>
  );
}

function SubBadge({ level }) {
  const cls =
    level === 'Annual'    ? 'bg-emerald-500/15 text-emerald-300' :
    level === 'Monthly'   ? 'bg-cyan-500/15 text-cyan-300'       :
    level === 'Trial'     ? 'bg-amber-500/15 text-amber-300'     :
                            'bg-white/5 text-slate-500';
  return <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${cls}`}>{level}</span>;
}

function ActiveBadge({ active }) {
  return (
    <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${
      active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
    }`}>
      {active ? 'Yes' : 'No'}
    </span>
  );
}

function EditModal({ user, onClose, onSave, onDelete, onToggleActive }) {
  const [form, setForm]           = useState({ ...user });
  const [confirmDel, setConfirmDel] = useState(false);

  function set(field) {
    return (val) => setForm((f) => ({ ...f, [field]: val }));
  }

  function handleSave() {
    onSave({ ...form, updatedAt: new Date().toISOString() });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-auto rounded-[28px] border border-white/10 bg-[#09111d] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <h3 className="text-xl font-bold text-white">Edit User</h3>
            <p className="mt-0.5 text-sm text-slate-400">{fullName(user)}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 px-4 py-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 p-6">
          {/* Name */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="First Name">
              <TextInput value={form.firstName} onChange={set('firstName')} placeholder="Jane" />
            </Field>
            <Field label="Last Name">
              <TextInput value={form.lastName} onChange={set('lastName')} placeholder="Smith" />
            </Field>
            <Field label="Suffix">
              <TextInput value={form.suffix} onChange={set('suffix')} placeholder="Jr." />
            </Field>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <TextInput value={form.email} onChange={set('email')} placeholder="jane@example.com" />
            </Field>
            <Field label="Phone">
              <TextInput value={form.phone} onChange={set('phone')} placeholder="+15551234567" />
            </Field>
          </div>

          {/* Trading preferences */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Trading Style">
              <Segment options={STYLE_OPTS} value={form.tradingStyle} onChange={set('tradingStyle')} />
            </Field>
            <Field label="Index">
              <Segment options={INDEX_OPTS} value={form.index} onChange={set('index')} />
            </Field>
            <Field label="Delta Trigger">
              <input
                type="number"
                min={0.05} max={0.99} step={0.05}
                value={form.deltaTrigger}
                onChange={(e) => set('deltaTrigger')(parseFloat(e.target.value))}
                className="w-full rounded-xl border border-white/10 bg-[#061018] px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
              />
            </Field>
          </div>

          {/* Pivot Periods */}
          <Field label="Pivot Periods">
            <MultiToggle options={PIVOT_OPTS} value={form.pivotPeriods} onChange={set('pivotPeriods')} />
          </Field>

          {/* Notifications */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Notifications</label>
            <div className="flex gap-3">
              <Toggle label="Email Alerts" checked={form.notifEmail} onChange={set('notifEmail')} />
              <Toggle label="ntfy Push"    checked={form.notifNtfy}  onChange={set('notifNtfy')} />
            </div>
          </div>

          {/* Subscription Level */}
          <Field label="Subscription Level">
            <Segment options={SUB_LEVELS} value={form.subscriptionLevel} onChange={set('subscriptionLevel')} />
          </Field>

          {/* Save / Cancel */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#061018] transition hover:bg-cyan-400"
            >
              Save Changes
            </button>
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/10"
            >
              Cancel
            </button>
          </div>

          {/* Danger zone */}
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">Danger Zone</p>
            <div className="flex gap-3">
              <button
                onClick={() => { onToggleActive(user.id); onClose(); }}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10"
              >
                {user.isActive ? 'Deactivate User' : 'Reactivate User'}
              </button>

              {!confirmDel ? (
                <button
                  onClick={() => setConfirmDel(true)}
                  className="flex-1 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300 transition hover:bg-rose-500/20"
                >
                  Delete User
                </button>
              ) : (
                <div className="flex flex-1 gap-2">
                  <button
                    onClick={() => { onDelete(user.id); onClose(); }}
                    className="flex-1 rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
                  >
                    Confirm Delete
                  </button>
                  <button
                    onClick={() => setConfirmDel(false)}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10"
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
  );
}

export default function ManageUsers() {
  const [users, setUsers]             = useState(loadUsers);
  const [editingUser, setEditingUser] = useState(null);
  const [query, setQuery]             = useState('');

  useEffect(() => { saveUsers(users); }, [users]);

  function handleSave(updated) {
    setUsers((u) => u.map((x) => (x.id === updated.id ? updated : x)));
  }

  function handleDelete(id) {
    setUsers((u) => u.filter((x) => x.id !== id));
  }

  function handleToggleActive(id) {
    setUsers((u) =>
      u.map((x) =>
        x.id === id ? { ...x, isActive: !x.isActive, updatedAt: new Date().toISOString() } : x,
      ),
    );
  }

  const q = query.trim().toLowerCase();
  const filtered = q
    ? users.filter(
        (u) =>
          fullName(u).toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q),
      )
    : users;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Manage Users</h1>
        <p className="mt-1 text-sm text-slate-400">
          Platform subscribers. Click a name to view or edit.
        </p>
      </div>

      {/* Search */}
      <div className="mb-4 max-w-sm">
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
            &#9906;
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full rounded-xl border border-white/10 bg-[#0d1f2d] py-2 pl-9 pr-4 text-sm text-white placeholder-slate-600 outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0d1f2d]">
        {users.length === 0 ? (
          <p className="p-6 text-sm text-slate-400">No users yet.</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-sm text-slate-400">No users match "{query}".</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs font-semibold uppercase tracking-widest text-slate-500">
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Style</th>
                <th className="px-4 py-3 text-left">Index</th>
                <th className="px-4 py-3 text-left">Subscription</th>
                <th className="px-4 py-3 text-left">Active</th>
                <th className="px-4 py-3 text-left">Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr
                  key={u.id}
                  className={`transition-colors hover:bg-white/5 ${
                    i < filtered.length - 1 ? 'border-b border-white/5' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setEditingUser(u)}
                      className="font-medium text-cyan-400 transition-colors hover:text-cyan-300 hover:underline"
                    >
                      {fullName(u)}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{u.email}</td>
                  <td className="px-4 py-3 text-slate-400">{u.tradingStyle}</td>
                  <td className="px-4 py-3 text-slate-400">{u.index}</td>
                  <td className="px-4 py-3"><SubBadge level={u.subscriptionLevel} /></td>
                  <td className="px-4 py-3"><ActiveBadge active={u.isActive} /></td>
                  <td className="px-4 py-3 text-slate-500">{u.updatedAt?.slice(0, 10) ?? '—'}</td>
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
        />
      )}
    </div>
  );
}
