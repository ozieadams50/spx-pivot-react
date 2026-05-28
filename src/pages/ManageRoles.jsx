import { useState } from 'react';
import { loadAllRoles, loadCustomRoles, saveCustomRoles, FIXED_ROLES } from '../data/roles';

const ROLE_BADGE = {
  subscriber: 'bg-amber-500/15 text-amber-300',
  admin:      'bg-cyan-500/15 text-cyan-300',
  superuser:  'bg-violet-500/15 text-violet-300',
};

function EditModal({ role, onClose, onSave }) {
  const [shortDescription, setShortDescription] = useState(role.shortDescription);
  const [definition,       setDefinition]       = useState(role.definition);

  function handleSave() {
    onSave({ ...role, shortDescription, definition });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-[28px] border border-white/10 bg-[#09111d] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <h3 className="text-xl font-bold text-white">Edit Role</h3>
            <p className="mt-0.5">
              <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${ROLE_BADGE[role.key] ?? 'bg-white/5 text-slate-300'}`}>
                {role.name}
              </span>
              {role.fixed && <span className="ml-2 text-xs text-slate-500">Fixed role — name cannot be changed</span>}
            </p>
          </div>
          <button onClick={onClose} className="rounded-2xl border border-white/10 px-4 py-2 text-slate-400 transition hover:bg-white/5 hover:text-white">✕</button>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Short Description</label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#061018] px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Full Definition</label>
            <textarea
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              rows={5}
              className="w-full resize-y rounded-xl border border-white/10 bg-[#061018] px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
            />
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} className="flex-1 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#061018] transition hover:bg-cyan-400">
              Save Changes
            </button>
            <button onClick={onClose} className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/10">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ManageRoles() {
  const [roles,       setRoles]       = useState(loadAllRoles);
  const [editingRole, setEditingRole] = useState(null);

  function handleSave(updated) {
    if (updated.fixed) {
      // For fixed roles, persist description changes via customRoles overrides
      const custom = loadCustomRoles().filter((r) => r.key !== updated.key);
      saveCustomRoles([...custom, { ...updated }]);
    } else {
      const custom = loadCustomRoles().map((r) => r.key === updated.key ? updated : r);
      saveCustomRoles(custom);
    }
    setRoles(loadAllRoles());
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Manage Roles</h1>
        <p className="mt-1 text-sm text-slate-400">
          View and edit role definitions. Click a role name to edit its description.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0d1f2d]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs font-semibold uppercase tracking-widest text-slate-500">
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Short Description</th>
              <th className="px-4 py-3 text-left">Type</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r, i) => (
              <tr key={r.key} className={`transition-colors hover:bg-white/5 ${i < roles.length - 1 ? 'border-b border-white/5' : ''}`}>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setEditingRole(r)}
                    className="font-medium text-cyan-400 transition-colors hover:text-cyan-300 hover:underline"
                  >
                    <span className={`mr-2 rounded-lg px-2 py-0.5 text-xs font-semibold ${ROLE_BADGE[r.key] ?? 'bg-white/5 text-slate-300'}`}>
                      {r.name}
                    </span>
                  </button>
                </td>
                <td className="px-4 py-3 text-slate-300">{r.shortDescription}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${r.fixed ? 'bg-white/5 text-slate-500' : 'bg-emerald-500/15 text-emerald-300'}`}>
                    {r.fixed ? 'Fixed' : 'Custom'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
