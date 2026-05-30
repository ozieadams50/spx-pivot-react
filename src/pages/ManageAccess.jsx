import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MENU_ITEMS } from '../data/accessMatrix';
import { apiFetch } from '../lib/api';

const ROLE_BADGE = {
  subscriber: 'text-amber-300',
  admin:      'text-cyan-300',
  superuser:  'text-violet-300',
};

const INDENT = ['', 'pl-5', 'pl-10'];
const LEVEL_STYLE = [
  'bg-white/[0.03] font-semibold text-slate-200',   // level 0 — section
  'text-slate-300',                                   // level 1 — group
  'text-slate-400',                                   // level 2 — leaf
];

function Checkbox({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`mx-auto flex h-5 w-5 items-center justify-center rounded-md border transition ${
        disabled
          ? 'cursor-not-allowed border-white/5 bg-white/5 opacity-40'
          : checked
          ? 'border-cyan-500/50 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'
          : 'border-white/20 bg-white/5 text-transparent hover:border-white/40'
      }`}
    >
      {checked && <span className="text-[10px] font-bold leading-none">✓</span>}
    </button>
  );
}

export default function ManageAccess() {
  const navigate                      = useNavigate();
  const { role: currentRole, accessMatrix, updateMatrix } = useAuth();
  const [roles,   setRoles]           = useState([]);
  const [matrix,  setMatrix]          = useState({ ...accessMatrix });
  const [saved,   setSaved]           = useState(false);
  const [saving,  setSaving]          = useState(false);
  const [error,   setError]           = useState('');

  useEffect(() => {
    apiFetch('/roles').then(setRoles).catch(() => {});
  }, []);

  const isSuperUser = currentRole === 'superuser';

  function toggle(itemKey, roleKey) {
    setMatrix((prev) => ({
      ...prev,
      [itemKey]: {
        ...prev[itemKey],
        [roleKey]: !(prev[itemKey]?.[roleKey] ?? true),
      },
    }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true); setError('');
    try {
      await apiFetch('/settings/access-matrix', {
        method: 'PUT',
        body: JSON.stringify({ matrix }),
      });
      updateMatrix(matrix);   // sync local state + localStorage cache
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message ?? 'Failed to save access rules.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Access</h1>
          <p className="mt-1 text-sm text-slate-400">
            Control which roles can see each menu section. Changes take effect on save.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {error && (
            <span className="text-sm text-rose-400">{error}</span>
          )}
          {saved && !error && (
            <span className="text-sm text-emerald-400">Saved — all users will see this on next load ✓</span>
          )}
          <button
            onClick={handleSave}
            disabled={!isSuperUser || saving}
            className="rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-[#061018] transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save Access Rules'}
          </button>
          <button
            onClick={() => navigate('/admin/access')}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/10"
          >
            Cancel
          </button>
        </div>
      </div>

      {!isSuperUser && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Only Super Users can modify the access matrix. You are viewing in read-only mode.
        </div>
      )}

      <div className="inline-block overflow-x-auto rounded-2xl border border-white/10 bg-[#0d1f2d]">
        <table className="text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
                Menu / Section
              </th>
              {roles.map((r) => (
                <th key={r.key} className="w-16 px-2 py-3 text-center text-xs font-semibold uppercase tracking-widest">
                  <span className={ROLE_BADGE[r.key] ?? 'text-slate-300'}>{r.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MENU_ITEMS.map((item, i) => {
              const isSection = item.level === 0;
              return (
                <tr
                  key={item.key}
                  className={`${i < MENU_ITEMS.length - 1 ? 'border-b border-white/5' : ''} ${
                    isSection ? 'bg-white/[0.025]' : ''
                  }`}
                >
                  <td className={`px-4 py-2.5 ${INDENT[item.level] ?? 'pl-10'} ${LEVEL_STYLE[item.level] ?? 'text-slate-400'}`}>
                    {item.label}
                  </td>
                  {roles.map((r) => {
                    const checked = matrix[item.key]?.[r.key] !== false;
                    return (
                      <td key={r.key} className="px-2 py-2.5 text-center">
                        <Checkbox
                          checked={checked}
                          onChange={() => toggle(item.key, r.key)}
                          disabled={!isSuperUser}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-slate-600">
        Note: Super User always retains full access regardless of matrix settings.
      </p>
    </div>
  );
}
