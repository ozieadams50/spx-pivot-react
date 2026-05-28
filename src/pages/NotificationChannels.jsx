import { useState } from 'react';
import { loadProfile, saveProfile } from '../data/profile';

function Toggle({ label, description, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
        checked
          ? 'border-cyan-500/50 bg-cyan-500/10'
          : 'border-white/10 bg-white/5 hover:border-cyan-500/30'
      }`}
    >
      <span className="relative mt-0.5 inline-block h-5 w-9 shrink-0 rounded-full bg-slate-700 transition">
        <span
          className={`absolute top-1 h-3 w-3 rounded-full bg-white transition-all ${
            checked ? 'left-5 bg-cyan-300' : 'left-1'
          }`}
        />
      </span>
      <div>
        <p className={`text-sm font-medium ${checked ? 'text-cyan-300' : 'text-slate-300'}`}>{label}</p>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
    </button>
  );
}

export default function NotificationChannels() {
  const p = loadProfile();
  const [notifEmail, setNotifEmail] = useState(p.notifEmail);
  const [notifNtfy,  setNotifNtfy]  = useState(p.notifNtfy);
  const [success,    setSuccess]    = useState(false);

  function handleSave() {
    saveProfile({ notifEmail, notifNtfy });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Notification Channels</h1>
        <p className="mt-1 text-sm text-slate-400">
          Choose how you receive trade alerts and sentiment broadcasts.
        </p>
      </div>

      <div className="max-w-2xl rounded-2xl border border-white/10 bg-[#0d1f2d] p-6 shadow-lg">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">Channels</p>
        <div className="space-y-3">
          <Toggle
            label="Email Alerts"
            description="Alerts sent to your email address on file."
            checked={notifEmail}
            onChange={setNotifEmail}
          />
          <Toggle
            label="ntfy Push"
            description="Push notifications via ntfy.sh. Subscribe to your topics in SPX Trade Settings, then enable this toggle."
            checked={notifNtfy}
            onChange={setNotifNtfy}
          />
        </div>

        {success && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            Notification preferences saved.
          </div>
        )}

        <button
          onClick={handleSave}
          className="mt-5 w-full rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#061018] transition hover:bg-cyan-400"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
}
