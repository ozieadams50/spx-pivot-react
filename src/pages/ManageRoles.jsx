import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';

const ROLE_BADGE = {
  subscriber: 'bg-amber-500/15 text-[var(--c-amber)]',
  admin:      'bg-cyan-500/15 text-[var(--c-cyan)]',
  superuser:  'bg-violet-500/15 text-[var(--c-violet)]',
};

function EditModal({ role, onClose, onSave }) {
  const [shortDescription, setShortDescription] = useState(role.shortDescription);
  const [definition,       setDefinition]       = useState(role.definition);
  const [saving,           setSaving]           = useState(false);
  const [error,            setError]            = useState('');

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const updated = await apiFetch(`/roles/${role.key}`, {
        method: 'PUT',
        body: JSON.stringify({ shortDescription, definition }),
      });
      onSave(updated);
      onClose();
    } catch (e) {
      setError(e.message ?? 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-[28px] border border-[var(--c-border)] bg-[var(--c-bg-dropdown)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[var(--c-border)] px-6 py-5">
          <div>
            <h3 className="text-xl font-bold text-[var(--c-text-primary)]">Edit Role</h3>
            <p className="mt-0.5">
              <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${ROLE_BADGE[role.key] ?? 'bg-[var(--c-hover)] text-[var(--c-text-secondary)]'}`}>
                {role.name}
              </span>
              {role.fixed && <span className="ml-2 text-xs text-[var(--c-text-dimmed)]">Fixed role — name cannot be changed</span>}
            </p>
          </div>
          <button onClick={onClose} className="rounded-2xl border border-[var(--c-border)] px-4 py-2 text-[var(--c-text-muted)] transition hover:bg-[var(--c-hover)] hover:text-[var(--c-text-primary)]">✕</button>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--c-text-secondary)]">Short Description</label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-page)] px-3 py-2 text-sm text-[var(--c-text-primary)] outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--c-text-secondary)]">Full Definition</label>
            <textarea
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              rows={5}
              className="w-full resize-y rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-page)] px-3 py-2 text-sm text-[var(--c-text-primary)] outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-[var(--c-rose-strong)]">{error}</div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-xl bg-[var(--c-btn-bg)] px-4 py-2.5 text-sm font-semibold text-[var(--c-btn-text)] transition hover:bg-[var(--c-btn-hover)] disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button onClick={onClose} className="flex-1 rounded-xl border border-[var(--c-border)] bg-[var(--c-hover)] px-4 py-2.5 text-sm text-[var(--c-text-secondary)] transition hover:bg-[var(--c-hover-strong)]">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ManageRoles() {
  const [roles,       setRoles]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [editingRole, setEditingRole] = useState(null);
  const [deleting,    setDeleting]    = useState(null);

  useEffect(() => {
    apiFetch('/roles')
      .then(setRoles)
      .catch((e) => setError(e.message ?? 'Failed to load roles.'))
      .finally(() => setLoading(false));
  }, []);

  function handleSave(updated) {
    setRoles((prev) => prev.map((r) => r.key === updated.key ? updated : r));
  }

  async function handleDelete(role) {
    if (!window.confirm(`Delete the "${role.name}" role? This cannot be undone.`)) return;
    setDeleting(role.key);
    try {
      await apiFetch(`/roles/${role.key}`, { method: 'DELETE' });
      setRoles((prev) => prev.filter((r) => r.key !== role.key));
    } catch (e) {
      alert(e.message ?? 'Delete failed.');
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--c-text-primary)]">Manage Roles</h1>
          <p className="mt-1 text-sm text-[var(--c-text-muted)]">
            View and edit role definitions. Click a role name to edit its description.
          </p>
        </div>
        <Link
          to="/admin/roles/add"
          className="rounded-xl bg-[var(--c-btn-bg)] px-4 py-2.5 text-sm font-semibold text-[var(--c-btn-text)] transition hover:bg-[var(--c-btn-hover)]"
        >
          + Add Role
        </Link>
      </div>

      {loading && (
        <p className="text-sm text-[var(--c-text-muted)]">Loading roles…</p>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-[var(--c-rose-strong)]">{error}</div>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-panel)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--c-border)] text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Short Description</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {roles.map((r, i) => (
                <tr key={r.key} className={`transition-colors hover:bg-[var(--c-hover)] ${i < roles.length - 1 ? 'border-b border-[var(--c-border-subtle)]' : ''}`}>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setEditingRole(r)}
                      className="font-medium text-[var(--c-cyan-strong)] transition-colors hover:text-[var(--c-cyan)] hover:underline"
                    >
                      <span className={`mr-2 rounded-lg px-2 py-0.5 text-xs font-semibold ${ROLE_BADGE[r.key] ?? 'bg-[var(--c-hover)] text-[var(--c-text-secondary)]'}`}>
                        {r.name}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-[var(--c-text-secondary)]">{r.shortDescription}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${r.fixed ? 'bg-[var(--c-hover)] text-[var(--c-text-dimmed)]' : 'bg-emerald-500/15 text-[var(--c-emerald-strong)]'}`}>
                      {r.fixed ? 'Fixed' : 'Custom'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!r.fixed && (
                      <button
                        onClick={() => handleDelete(r)}
                        disabled={deleting === r.key}
                        className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs text-[var(--c-rose)] transition hover:bg-rose-500/20 disabled:opacity-40"
                      >
                        {deleting === r.key ? '…' : 'Delete'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingRole && (
        <EditModal
          role={editingRole}
          onClose={() => setEditingRole(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
