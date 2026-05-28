import { useState, useEffect } from 'react';

const SEED_APPS = [
  {
    id: 1,
    appName: 'SPX Pivots', appKey: 'spx_pivots',
    description: 'Daily, weekly, and monthly SPX pivot level signals.',
    isActive: true, createdAt: '2026-01-10T08:00:00',
  },
  {
    id: 2,
    appName: 'Fade Monitor', appKey: 'fade_monitor',
    description: 'Intraday fade alert system with options data and email/ntfy alerts.',
    isActive: true, createdAt: '2026-02-15T09:30:00',
  },
];

function loadApps() {
  try {
    const stored = JSON.parse(localStorage.getItem('manage_apps'));
    return stored?.length ? stored : SEED_APPS;
  } catch { return SEED_APPS; }
}

function saveApps(apps) {
  localStorage.setItem('manage_apps', JSON.stringify(apps));
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-300">{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, disabled = false }) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full rounded-xl border border-white/10 bg-[#061018] px-3 py-2 text-sm text-white placeholder-slate-600 outline-none transition ${
        disabled
          ? 'cursor-not-allowed opacity-50'
          : 'focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30'
      }`}
    />
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

function ActiveBadge({ active }) {
  return (
    <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${
      active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
    }`}>
      {active ? 'Active' : 'Disabled'}
    </span>
  );
}

function EditModal({ app, onClose, onSave, onDelete, onToggleActive }) {
  const [form, setForm] = useState({ ...app });

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
        className="max-h-[92vh] w-full max-w-lg overflow-auto rounded-[28px] border border-white/10 bg-[#09111d] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <h3 className="text-xl font-bold text-white">Edit App</h3>
            <p className="mt-0.5 text-sm text-slate-400">{app.appName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 px-4 py-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 p-6">
          {/* App Name + App Key */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="App Name">
              <TextInput value={form.appName} onChange={set('appName')} placeholder="SPX Pivots" />
            </Field>
            <Field label="App Key (read-only)">
              <TextInput value={form.appKey} disabled />
            </Field>
          </div>

          {/* Description */}
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => set('description')(e.target.value)}
              rows={3}
              placeholder="What this app does…"
              className="w-full resize-y rounded-xl border border-white/10 bg-[#061018] px-3 py-2 text-sm text-white placeholder-slate-600 outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
            />
          </Field>

          {/* Active toggle */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Status</label>
            <Toggle label="Active" checked={form.isActive} onChange={set('isActive')} />
          </div>

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
            <button
              onClick={() => { onToggleActive(app.id); onClose(); }}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10"
            >
              {app.isActive ? 'Disable App' : 'Enable App'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ManageApps() {
  const [apps, setApps]             = useState(loadApps);
  const [editingApp, setEditingApp] = useState(null);
  const [query, setQuery]           = useState('');

  useEffect(() => { saveApps(apps); }, [apps]);

  function handleSave(updated) {
    setApps((a) => a.map((x) => (x.id === updated.id ? updated : x)));
  }

  function handleDelete(id) {
    setApps((a) => a.filter((x) => x.id !== id));
  }

  function handleToggleActive(id) {
    setApps((a) =>
      a.map((x) =>
        x.id === id ? { ...x, isActive: !x.isActive, updatedAt: new Date().toISOString() } : x,
      ),
    );
  }

  const q = query.trim().toLowerCase();
  const filtered = q
    ? apps.filter(
        (a) =>
          a.appName.toLowerCase().includes(q) ||
          a.appKey.toLowerCase().includes(q),
      )
    : apps;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Manage Apps</h1>
        <p className="mt-1 text-sm text-slate-400">
          Registered platform applications. Click an app name to edit.
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
            placeholder="Search by name or key…"
            className="w-full rounded-xl border border-white/10 bg-[#0d1f2d] py-2 pl-9 pr-4 text-sm text-white placeholder-slate-600 outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute inset-y-0 right-3 flex items-center text-slate-500 transition-colors hover:text-slate-300"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0d1f2d]">
        {apps.length === 0 ? (
          <p className="p-6 text-sm text-slate-400">No apps registered yet.</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-sm text-slate-400">No apps match "{query}".</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs font-semibold uppercase tracking-widest text-slate-500">
                <th className="px-4 py-3 text-left">App Name</th>
                <th className="px-4 py-3 text-left">Key</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => (
                <tr
                  key={a.id}
                  className={`transition-colors hover:bg-white/5 ${
                    i < filtered.length - 1 ? 'border-b border-white/5' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setEditingApp(a)}
                      className="font-medium text-cyan-400 transition-colors hover:text-cyan-300 hover:underline"
                    >
                      {a.appName}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{a.appKey}</td>
                  <td className="px-4 py-3 max-w-xs truncate text-slate-300">{a.description || '—'}</td>
                  <td className="px-4 py-3"><ActiveBadge active={a.isActive} /></td>
                  <td className="px-4 py-3 text-slate-500">{a.createdAt?.slice(0, 10) ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editingApp && (
        <EditModal
          app={editingApp}
          onClose={() => setEditingApp(null)}
          onSave={handleSave}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
        />
      )}
    </div>
  );
}
