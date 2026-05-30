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
        {label}
        {hint && <span className="ml-1.5 font-normal text-slate-500">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

export default function AddRole() {
  const navigate = useNavigate();
  const [name,             setName]             = useState('');
  const [key,              setKey]              = useState('');
  const [keyTouched,       setKeyTouched]       = useState(false);
  const [shortDescription, setShortDescription] = useState('');
  const [definition,       setDefinition]       = useState('');
  const [error,            setError]            = useState('');
  const [saving,           setSaving]           = useState(false);

  function handleNameChange(val) {
    setName(val);
    if (!keyTouched) setKey(toKey(val));
  }

  async function handleSubmit() {
    setError('');
    if (!name.trim()) { setError('Role name is required.'); return; }
    if (!key.trim())  { setError('Role key is required.'); return; }

    setSaving(true);
    try {
      await apiFetch('/roles', {
        method: 'POST',
        body: JSON.stringify({
          key:              key.trim(),
          name:             name.trim(),
          shortDescription: shortDescription.trim(),
          definition:       definition.trim(),
        }),
      });
      navigate('/admin/roles');
    } catch (e) {
      setError(e.message ?? 'Failed to create role.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Add Role</h1>
        <p className="mt-1 text-sm text-slate-400">Define a new custom platform role.</p>
      </div>

      <div className="max-w-lg rounded-2xl border border-white/10 bg-[#0d1f2d] p-6 shadow-lg">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Role Name">
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Moderator"
                className="w-full rounded-xl border border-white/10 bg-[#061018] px-3 py-2 text-sm text-white placeholder-slate-600 outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
              />
            </Field>
            <Field label="Role Key" hint="(auto-derived)">
              <input
                type="text"
                value={key}
                onChange={(e) => { setKeyTouched(true); setKey(toKey(e.target.value)); }}
                placeholder="moderator"
                className="w-full rounded-xl border border-white/10 bg-[#061018] px-3 py-2 text-sm text-white placeholder-slate-600 outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
              />
            </Field>
          </div>

          <Field label="Short Description">
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="One-line summary shown in the roles table."
              className="w-full rounded-xl border border-white/10 bg-[#061018] px-3 py-2 text-sm text-white placeholder-slate-600 outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
            />
          </Field>

          <Field label="Full Definition">
            <textarea
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              rows={4}
              placeholder="Detailed description of what this role can access and do."
              className="w-full resize-y rounded-xl border border-white/10 bg-[#061018] px-3 py-2 text-sm text-white placeholder-slate-600 outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
            />
          </Field>

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#061018] transition hover:bg-cyan-400 disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create Role'}
            </button>
            <button onClick={() => navigate('/admin/roles')} className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/10">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
