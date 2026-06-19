import { useState } from 'react';
import { apiFetch } from '../lib/api';

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[var(--c-text-secondary)]">{label}</label>
      {children}
    </div>
  );
}

const INPUT_CLS = 'w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-page)] px-3 py-2 text-sm text-[var(--c-text-primary)] outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30';

export default function ManagePassword() {
  const [current,  setCurrent]  = useState('');
  const [newPw,    setNewPw]    = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);
  const [saving,   setSaving]   = useState(false);

  async function handleSubmit() {
    setError(''); setSuccess(false);
    if (!current)          { setError('Current password is required.'); return; }
    if (!newPw)            { setError('New password is required.'); return; }
    if (newPw !== confirm) { setError('Passwords do not match.'); return; }
    if (newPw.length < 8)  { setError('Password must be at least 8 characters.'); return; }

    setSaving(true);
    try {
      await apiFetch('/profile/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword: current, newPassword: newPw }),
      });
      setCurrent(''); setNewPw(''); setConfirm('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err.message ?? 'Password update failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--c-text-primary)]">Manage Password</h1>
        <p className="mt-1 text-sm text-[var(--c-text-muted)]">Update your account password.</p>
      </div>

      <div className="max-w-md rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-panel)] p-6 shadow-lg">
        <div className="space-y-4">
          <Field label="Current Password">
            <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className={INPUT_CLS} />
          </Field>
          <Field label="New Password">
            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className={INPUT_CLS} />
          </Field>
          <Field label="Confirm New Password">
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={INPUT_CLS} />
          </Field>

          {error   && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-[var(--c-rose-strong)]">{error}</div>}
          {success && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-[var(--c-emerald-strong)]">Password updated successfully.</div>}

          <button onClick={handleSubmit} disabled={saving}
            className="w-full rounded-xl bg-[var(--c-btn-bg)] px-4 py-2.5 text-sm font-semibold text-[var(--c-btn-text)] transition hover:bg-[var(--c-btn-hover)] disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? 'Updating…' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  );
}
