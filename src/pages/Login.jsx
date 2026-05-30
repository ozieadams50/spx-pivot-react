import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';

function subscriptionsFromLevel(subscriptionLevel) {
  return subscriptionLevel && subscriptionLevel !== 'No Access' ? ['spx_pivots'] : [];
}

export default function Login() {
  const navigate      = useNavigate();
  const { login }     = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

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

      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message ?? 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#061018] px-4">
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">SPX Control Center</h1>
          <p className="mt-2 text-sm text-slate-500">Institutional Market Intelligence Platform</p>
        </div>

        {/* Card */}
        <div className="rounded-[28px] border border-white/10 bg-[#0d1f2d] p-8 shadow-2xl">
          <h2 className="mb-6 text-lg font-semibold text-white">Sign in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-xl border border-white/10 bg-[#061018] px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full rounded-xl border border-white/10 bg-[#061018] px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#061018] transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-slate-600">
          Contact your administrator if you need access.
        </p>
      </div>
    </div>
  );
}
