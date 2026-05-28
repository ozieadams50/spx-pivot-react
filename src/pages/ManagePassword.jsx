import { useState } from 'react';

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-300">{label}</label>
      {children}
    </div>
  );
}

export default function ManagePassword() {
  const [current,  setCurrent]  = useState('');
  const [newPw,    setNewPw]    = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);

  function handleSubmit() {
    setError('');
    setSuccess(false);
    if (!current)              { setError('Current password is required.'); return; }
    if (!newPw)                { setError('New password is required.'); return; }
    if (newPw !== confirm)     { setError('Passwords do not match.'); return; }
    if (newPw.length < 8)     { setError('Password must be at least 8 characters.'); return; }
    // In production this would call /api/profile/password
    setCurrent(''); setNewPw(''); setConfirm('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Manage Password</h1>
        <p className="mt-1 text-sm text-slate-400">Update your account password.</p>
      </div>

      <div className="max-w-md rounded-2xl border border-white/10 bg-[#0d1f2d] p-6 shadow-lg">
        <div className="space-y-4">
          <Field label="Current Password">
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#061018] px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
            />
          </Field>

          <Field label="New Password">
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#061018] px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
            />
          </Field>

          <Field label="Confirm New Password">
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#061018] px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
            />
          </Field>

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              Password updated successfully.
            </div>
          )}

          <button
            onClick={handleSubmit}
            className="w-full rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#061018] transition hover:bg-cyan-400"
          >
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
}
