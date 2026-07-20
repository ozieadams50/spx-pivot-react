import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';

export default function ResetPassword() {
  const navigate  = useNavigate();
  const [params]  = useSearchParams();
  const token     = params.get('token') ?? '';

  const [newPw,    setNewPw]    = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);
  const [saving,   setSaving]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!token)             { setError('This reset link is missing its token. Please request a new one.'); return; }
    if (!newPw)             { setError('New password is required.'); return; }
    if (newPw !== confirm)  { setError('Passwords do not match.'); return; }
    if (newPw.length < 8)   { setError('Password must be at least 8 characters.'); return; }

    setSaving(true);
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword: newPw }),
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--c-bg-page)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[var(--c-text-primary)]">SPX Control Center</h1>
          <p className="mt-2 text-sm text-[var(--c-text-dimmed)]">Institutional Market Intelligence Platform</p>
        </div>

        <div className="rounded-[28px] border border-[var(--c-border)] bg-[var(--c-bg-panel)] p-8 shadow-2xl">
          <h2 className="mb-6 text-lg font-semibold text-[var(--c-text-primary)]">Set a new password</h2>

          {success ? (
            <>
              <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-[var(--c-emerald-strong)]">
                Your password has been updated.
              </div>
              <button
                onClick={() => navigate('/login', { replace: true })}
                className="w-full rounded-xl bg-[var(--c-btn-bg)] px-4 py-2.5 text-sm font-semibold text-[var(--c-btn-text)] transition hover:bg-[var(--c-btn-hover)]"
              >
                Go to sign in
              </button>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--c-text-secondary)]">New Password</label>
                <input
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-page)] px-3 py-2.5 text-sm text-[var(--c-text-primary)] outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--c-text-secondary)]">Confirm New Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-page)] px-3 py-2.5 text-sm text-[var(--c-text-primary)] outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-[var(--c-rose-strong)]">
                  {error}
                  {' '}
                  <Link to="/forgot-password" className="underline hover:no-underline">Request a new link</Link>
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-[var(--c-btn-bg)] px-4 py-2.5 text-sm font-semibold text-[var(--c-btn-text)] transition hover:bg-[var(--c-btn-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-[var(--c-text-faint)]">
          <Link to="/login" className="text-[var(--c-text-dimmed)] hover:text-[var(--c-text-primary)]">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
