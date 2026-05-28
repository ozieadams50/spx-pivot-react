import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function loadApps() {
  try {
    return JSON.parse(localStorage.getItem('manage_apps')) || [];
  } catch { return []; }
}

function saveApps(apps) {
  localStorage.setItem('manage_apps', JSON.stringify(apps));
}

function toKey(name) {
  return name.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-300">
        {label}
        {hint && <span className="ml-1.5 font-normal text-slate-500">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

export default function RegisterApp() {
  const navigate = useNavigate();
  const [appName,     setAppName]     = useState('');
  const [appKey,      setAppKey]      = useState('');
  const [keyTouched,  setKeyTouched]  = useState(false);
  const [description, setDescription] = useState('');
  const [error,       setError]       = useState('');
  const [saving,      setSaving]      = useState(false);

  function handleNameChange(val) {
    setAppName(val);
    if (!keyTouched) setAppKey(toKey(val));
  }

  function handleKeyChange(val) {
    setKeyTouched(true);
    setAppKey(val.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''));
  }

  function handleSubmit() {
    setError('');
    if (!appName.trim()) { setError('App Name is required.'); return; }
    if (!appKey.trim())  { setError('App Key is required.'); return; }

    const apps = loadApps();
    if (apps.some((a) => a.appKey === appKey.trim())) {
      setError(`An app with key "${appKey.trim()}" already exists.`);
      return;
    }

    setSaving(true);
    const newId = apps.length ? Math.max(...apps.map((a) => a.id)) + 1 : 1;
    saveApps([
      ...apps,
      {
        id:          newId,
        appName:     appName.trim(),
        appKey:      appKey.trim(),
        description: description.trim(),
        isActive:    true,
        createdAt:   new Date().toISOString(),
      },
    ]);
    setSaving(false);
    navigate('/admin/apps');
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Register App</h1>
        <p className="mt-1 text-sm text-slate-400">Register a new application in the platform.</p>
      </div>

      <div className="max-w-lg rounded-2xl border border-white/10 bg-[#0d1f2d] p-6 shadow-lg">
        <div className="space-y-5">
          {/* App Name + App Key */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="App Name">
              <input
                type="text"
                value={appName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Fade Monitor"
                className="w-full rounded-xl border border-white/10 bg-[#061018] px-3 py-2 text-sm text-white placeholder-slate-600 outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
              />
            </Field>
            <Field label="App Key" hint="(lowercase, underscores)">
              <input
                type="text"
                value={appKey}
                onChange={(e) => handleKeyChange(e.target.value)}
                placeholder="fade_monitor"
                className="w-full rounded-xl border border-white/10 bg-[#061018] px-3 py-2 text-sm text-white placeholder-slate-600 outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
              />
            </Field>
          </div>

          {/* Description */}
          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What this app does…"
              className="w-full resize-y rounded-xl border border-white/10 bg-[#061018] px-3 py-2 text-sm text-white placeholder-slate-600 outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
            />
          </Field>

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#061018] transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Registering…' : 'Register App'}
            </button>
            <button
              onClick={() => navigate('/admin/apps')}
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
