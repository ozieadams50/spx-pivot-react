import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../lib/api';

function subscriptionsFromLevel(subscriptionLevel) {
  return subscriptionLevel && subscriptionLevel !== 'No Access' ? ['spx_pivots'] : [];
}

export default function Login() {
  const navigate          = useNavigate();
  const { login }         = useAuth();
  const { loadFromProfile } = useTheme();
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) { setError('Email and password are required.'); return; }

    setLoading(true);
    try {
      const { access_token, user } = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });

      login({
        userId:        user.id,
        role:          user.role,
        subscriptions: subscriptionsFromLevel(user.subscriptionLevel),
        token:         access_token,
        user,
      });

      if (user.theme) loadFromProfile(user.theme);

      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message ?? 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--c-bg-page)] px-4">
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[var(--c-text-primary)]">SPX Control Center</h1>
          <p className="mt-2 text-sm text-[var(--c-text-dimmed)]">Institutional Market Intelligence Platform</p>
        </div>

        {/* Card */}
        <div className="rounded-[28px] border border-[var(--c-border)] bg-[var(--c-bg-panel)] p-8 shadow-2xl">
          <h2 className="mb-6 text-lg font-semibold text-[var(--c-text-primary)]">Sign in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--c-text-secondary)]">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-page)] px-3 py-2.5 text-sm text-[var(--c-text-primary)] placeholder-[var(--c-text-faint)] outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--c-text-secondary)]">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-page)] px-3 py-2.5 pr-10 text-sm text-[var(--c-text-primary)] placeholder-[var(--c-text-faint)] outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-[var(--c-text-dimmed)] transition hover:text-[var(--c-text-primary)]"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-[var(--c-rose-strong)]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[var(--c-btn-bg)] px-4 py-2.5 text-sm font-semibold text-[var(--c-btn-text)] transition hover:bg-[var(--c-btn-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-[var(--c-text-faint)]">
          Contact your administrator if you need access.
        </p>
      </div>
    </div>
  );
}
