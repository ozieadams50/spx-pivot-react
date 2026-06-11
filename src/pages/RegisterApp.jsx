import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';

function toKey(name) {
  return name.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-300">
        {label}{hint && <span className="ml-1.5 font-normal text-slate-500">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

const INPUT_CLS = 'w-full rounded-xl border border-white/10 bg-[#061018] px-3 py-2 text-sm text-white placeholder-slate-600 outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30';

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

  async function handleSubmit() {
    setError('');
    if (!appName.trim()) { setError('App Name is required.'); return; }
    if (!appKey.trim())  { setError('App Key is required.'); return; }
    setSaving(true);
    try {
      await apiFetch('/apps', {
        method: 'POST',
        body: JSON.stringify({ appName: appName.trim(), appKey: appKey.trim(), description: description.trim() }),
      });
      navigate('/admin/apps');
    } catch (err) {
      setError(err.message ?? 'Failed to register app.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Register App</h1>
        <p className="mt-1 text-sm text-slate-400">Register a new application in the platform.</p>
      </div>

      <div className="max-w-lg rounded-2xl border border-white/10 bg-[#0d1f2d] p-6 shadow-lg">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="App Name">
              <input type="text" value={appName} onChange={(e) => handleNameChange(e.target.value)} placeholder="Fade Monitor" className={INPUT_CLS} />
            </Field>
            <Field label="App Key" hint="(lowercase, underscores)">
              <input type="text" value={appKey} onChange={(e) => handleKeyChange(e.target.value)} placeholder="fade_monitor" className={INPUT_CLS} />
            </Field>
          </div>
          <Field label="Description">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              placeholder="What this app does..." className={`${INPUT_CLS} resize-y`} />
          </Field>
          {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div>}
          <div className="flex gap-3">
            <button onClick={handleSubmit} disabled={saving}
              className="flex-1 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#061018] transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? 'Registering...' : 'Register App'}
            </button>
            <button onClick={() => navigate('/admin/apps')}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/10">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
