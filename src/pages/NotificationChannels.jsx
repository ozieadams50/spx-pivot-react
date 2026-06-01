import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

function Toggle({ label, description, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
        checked ? 'border-cyan-500/50 bg-cyan-500/10' : 'border-white/10 bg-white/5 hover:border-cyan-500/30'
      }`}
    >
      <span className="relative mt-0.5 inline-block h-5 w-9 shrink-0 rounded-full bg-slate-700 transition">
        <span className={`absolute top-1 h-3 w-3 rounded-full bg-white transition-all ${checked ? 'left-5 bg-cyan-300' : 'left-1'}`} />
      </span>
      <div>
        <p className={`text-sm font-medium ${checked ? 'text-cyan-300' : 'text-slate-300'}`}>{label}</p>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
    </button>
  );
}

const PIVOT_TYPES = [
  {
    key:         'daily',
    label:       'Daily Pivot',
    ntfyTopic:   'spx-pivots-daily',
    description: 'Notified every trading day at 9:31 AM when the daily pivot levels are ready, and immediately if a stale correction is applied.',
  },
  {
    key:         'weekly',
    label:       'Weekly Pivot',
    ntfyTopic:   'spx-pivots-weekly',
    description: 'Notified on the first trading day of each week (typically Monday) when weekly pivot levels are set.',
  },
  {
    key:         'monthly',
    label:       'Monthly Pivot',
    ntfyTopic:   'spx-pivots-monthly',
    description: 'Notified on the first trading day of each month when monthly pivot levels are set.',
  },
];

export default function NotificationChannels() {
  const [notifEmail, setNotifEmail] = useState(false);
  const [notifNtfy,  setNotifNtfy]  = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [error,      setError]      = useState('');

  // Pivot subscriptions
  const [pivotSubs,     setPivotSubs]     = useState({ daily: false, weekly: false, monthly: false });
  const [pivotLoading,  setPivotLoading]  = useState(true);
  const [pivotSaving,   setPivotSaving]   = useState(false);
  const [pivotSuccess,  setPivotSuccess]  = useState(false);
  const [pivotError,    setPivotError]    = useState('');

  useEffect(() => {
    apiFetch('/profile')
      .then((p) => { setNotifEmail(p.notifEmail); setNotifNtfy(p.notifNtfy); })
      .catch(() => setError('Failed to load preferences.'))
      .finally(() => setLoading(false));

    apiFetch('/pivots/subscriptions')
      .then((s) => setPivotSubs(s))
      .catch(() => setPivotError('Failed to load pivot subscriptions.'))
      .finally(() => setPivotLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true); setError('');
    try {
      await apiFetch('/profile', { method: 'PUT', body: JSON.stringify({ notifEmail, notifNtfy }) });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message ?? 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePivotSave() {
    setPivotSaving(true); setPivotError('');
    try {
      await apiFetch('/pivots/subscriptions', { method: 'PUT', body: JSON.stringify(pivotSubs) });
      setPivotSuccess(true);
      setTimeout(() => setPivotSuccess(false), 3000);
    } catch (err) {
      setPivotError(err.message ?? 'Failed to save pivot subscriptions.');
    } finally {
      setPivotSaving(false);
    }
  }

  function togglePivot(key) {
    setPivotSubs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-white">Notification Channels</h1>
        <p className="mt-1 text-sm text-slate-400">Choose how you receive trade alerts and pivot updates.</p>
      </div>

      {/* ── Delivery channels ── */}
      <div className="max-w-2xl rounded-2xl border border-white/10 bg-[#0d1f2d] p-6 shadow-lg">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">Delivery Channels</p>
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />)}
          </div>
        ) : (
          <div className="space-y-3">
            <Toggle
              label="Email Alerts"
              description="Alerts sent to your email address on file."
              checked={notifEmail}
              onChange={setNotifEmail}
            />
            <Toggle
              label="ntfy Push"
              description="Push notifications via your ntfy server. Subscribe to the relevant topics in the ntfy app, then enable this toggle."
              checked={notifNtfy}
              onChange={setNotifNtfy}
            />
          </div>
        )}
        {error   && <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div>}
        {success && <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">Notification preferences saved.</div>}
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="mt-5 w-full rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#061018] transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Preferences'}
        </button>
      </div>

      {/* ── Pivot subscriptions ── */}
      <div className="max-w-2xl rounded-2xl border border-white/10 bg-[#0d1f2d] p-6 shadow-lg">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">Pivot Update Subscriptions</p>
        <p className="mb-4 text-xs text-slate-400">
          Select which pivot timeframes you want to be notified about. You will receive a notification
          each time a pivot is written — and an urgent alert if a stale pivot is corrected by the
          Pivot Guardian. Email delivery uses the toggle above; ntfy topics are listed below.
        </p>

        {pivotLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {PIVOT_TYPES.map(({ key, label, description }) => (
              <Toggle
                key={key}
                label={label}
                description={description}
                checked={pivotSubs[key]}
                onChange={() => togglePivot(key)}
              />
            ))}
          </div>
        )}

        {/* ntfy topic reference */}
        {!pivotLoading && (
          <div className="mt-5 overflow-hidden rounded-xl border border-white/10">
            <div className="border-b border-white/10 px-4 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">ntfy Topics to Subscribe</p>
            </div>
            <table className="w-full text-xs">
              <tbody>
                {PIVOT_TYPES.map(({ key, label, ntfyTopic }) => (
                  <tr key={key} className={`border-b border-white/5 last:border-0 ${pivotSubs[key] ? 'bg-cyan-500/5' : ''}`}>
                    <td className="px-4 py-3 font-mono text-cyan-400">{ntfyTopic}</td>
                    <td className="px-4 py-3 text-slate-400">{label}</td>
                    <td className="px-4 py-3 text-right">
                      {pivotSubs[key]
                        ? <span className="rounded-lg bg-cyan-500/20 px-2 py-0.5 text-cyan-300">Subscribed ✓</span>
                        : <span className="rounded-lg bg-white/5 px-2 py-0.5 text-slate-500">Off</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pivotError   && <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{pivotError}</div>}
        {pivotSuccess && <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">Pivot subscriptions saved.</div>}
        <button
          onClick={handlePivotSave}
          disabled={pivotSaving || pivotLoading}
          className="mt-5 w-full rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#061018] transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pivotSaving ? 'Saving…' : 'Save Pivot Subscriptions'}
        </button>
      </div>
    </div>
  );
}
