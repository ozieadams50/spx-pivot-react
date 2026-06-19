import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { useTheme } from '../context/ThemeContext';

const STYLE_OPTS  = ['Aggressive', 'Moderate', 'Conservative'];
const INDEX_OPTS  = ['SPX', 'XSP'];
const PERIOD_OPTS = ['Daily', 'Weekly', 'Monthly'];

const STYLE_HELP = {
  Aggressive:   'Short leg at S1 / R1 — nearest support/resistance. Highest premium, highest risk.',
  Moderate:     'Short leg at the midpoint between S1/S2 and R1/R2. Balanced risk/reward.',
  Conservative: 'Short leg at S2 / R2 — outermost pivot. Lower premium, larger buffer.',
};
const INDEX_HELP = 'XSP is exactly 1/10th the size of SPX. Both are cash-settled European-style options — no assignment risk, no early exercise.';

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[var(--c-text-secondary)]">{label}</label>
      {children}
    </div>
  );
}

function Segment({ options, value, onChange }) {
  return (
    <div className="flex gap-1.5">
      {options.map((opt) => (
        <button key={opt} type="button" onClick={() => onChange(opt)}
          className={`flex-1 rounded-xl border py-2 text-xs font-medium transition ${
            value === opt ? 'border-cyan-500/50 bg-cyan-500/15 text-[var(--c-cyan)]' : 'border-[var(--c-border)] bg-[var(--c-hover)] text-[var(--c-text-muted)] hover:border-cyan-500/30 hover:text-[var(--c-cyan)]'
          }`}>{opt}</button>
      ))}
    </div>
  );
}

function MultiToggle({ options, value, onChange }) {
  function toggle(opt) { onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]); }
  return (
    <div className="flex gap-1.5">
      {options.map((opt) => (
        <button key={opt} type="button" onClick={() => toggle(opt)}
          className={`flex-1 rounded-xl border py-2 text-xs font-medium transition ${
            value.includes(opt) ? 'border-cyan-500/50 bg-cyan-500/15 text-[var(--c-cyan)]' : 'border-[var(--c-border)] bg-[var(--c-hover)] text-[var(--c-text-muted)] hover:border-cyan-500/30 hover:text-[var(--c-cyan)]'
          }`}>{opt}</button>
      ))}
    </div>
  );
}

export default function SPXTradeSettings() {
  const { theme, setTheme } = useTheme();
  const [tradingStyle,  setTradingStyle]  = useState('Moderate');
  const [index,         setIndex]         = useState('SPX');
  const [deltaTrigger,  setDeltaTrigger]  = useState(0.35);
  const [pivotPeriods,  setPivotPeriods]  = useState(['Weekly']);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [success,       setSuccess]       = useState(false);
  const [error,         setError]         = useState('');

  useEffect(() => {
    apiFetch('/profile')
      .then((p) => {
        setTradingStyle(p.tradingStyle ?? 'Moderate');
        setIndex(p.index ?? 'SPX');
        setDeltaTrigger(p.deltaTrigger ?? 0.35);
        setPivotPeriods(p.pivotPeriods ?? ['Weekly']);
      })
      .catch(() => setError('Failed to load settings.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true); setError('');
    try {
      await apiFetch('/profile', {
        method: 'PUT',
        body: JSON.stringify({ tradingStyle, index, deltaTrigger, pivotPeriods }),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message ?? 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--c-text-primary)]">SPX Trade Settings</h1>
        <p className="mt-1 text-sm text-[var(--c-text-muted)]">Controls which pivot levels and alert triggers appear on your SPX Pivot page.</p>
      </div>

      <div className="mb-5 max-w-2xl rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-panel)] p-6 shadow-lg">
        <Field label="Theme">
          <Segment options={['Dark', 'Light']} value={theme === 'dark' ? 'Dark' : 'Light'} onChange={(v) => setTheme(v.toLowerCase())} />
          <p className="mt-2 text-xs text-[var(--c-text-dimmed)]">Your theme preference is saved automatically and will be applied on your next login.</p>
        </Field>
      </div>

      <div className="max-w-2xl rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-panel)] p-6 shadow-lg">
        {loading ? (
          <div className="space-y-4">{Array.from({length:4}).map((_,i) => <div key={i} className="h-10 animate-pulse rounded-xl bg-[var(--c-hover)]"/>)}</div>
        ) : (
          <div className="space-y-6">
            <Field label="Trading Style">
              <Segment options={STYLE_OPTS} value={tradingStyle} onChange={setTradingStyle} />
              <p className="mt-2 text-xs text-[var(--c-text-dimmed)]">{STYLE_HELP[tradingStyle]}</p>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Field label="Index to Trade">
                  <Segment options={INDEX_OPTS} value={index} onChange={setIndex} />
                </Field>
                <p className="mt-2 text-xs text-[var(--c-text-dimmed)]">{INDEX_HELP}</p>
              </div>
              <Field label="Delta Trigger">
                <input type="number" min={0.05} max={0.99} step={0.01} value={deltaTrigger}
                  onChange={(e) => setDeltaTrigger(parseFloat(e.target.value))}
                  className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-page)] px-3 py-2 text-sm text-[var(--c-text-primary)] outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30" />
                <p className="mt-2 text-xs text-[var(--c-text-dimmed)]">Alert fires when the short leg's delta reaches this value. Default: 0.35 (~20 pts OTM).</p>
              </Field>
            </div>

            <Field label="Pivot Time Period">
              <MultiToggle options={PERIOD_OPTS} value={pivotPeriods} onChange={setPivotPeriods} />
              {pivotPeriods.length === 0 && <p className="mt-2 text-xs text-[var(--c-amber-strong)]">Select at least one period to see spread levels and receive alerts.</p>}
            </Field>

            {error   && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-[var(--c-rose-strong)]">{error}</div>}
            {success && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-[var(--c-emerald-strong)]">Trade settings saved.</div>}

            <button onClick={handleSave} disabled={saving}
              className="w-full rounded-xl bg-[var(--c-btn-bg)] px-4 py-2.5 text-sm font-semibold text-[var(--c-btn-text)] transition hover:bg-[var(--c-btn-hover)] disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Trade Settings'}
            </button>
          </div>
        )}
      </div>

      {/* ntfy subscription guide — static, no API needed */}
      <div className="mt-5 max-w-2xl rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-panel)] p-6 shadow-lg">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">ntfy Subscriptions</p>
        <p className="mb-4 text-xs text-[var(--c-text-muted)]">
          Subscribe to these topics in the{' '}
          <a href="https://ntfy.sh" target="_blank" rel="noreferrer" className="text-[var(--c-cyan-strong)] hover:underline">ntfy.sh</a>{' '}
          app to receive alerts. Your active style topic is highlighted.
        </p>
        <div className="overflow-hidden rounded-xl border border-[var(--c-border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--c-border)] text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">
                <th className="px-4 py-2.5 text-left">Topic</th>
                <th className="px-4 py-2.5 text-left">Style</th>
                <th className="px-4 py-2.5 text-left">What You Receive</th>
              </tr>
            </thead>
            <tbody>
              {[
                { topic: 'SPX-Pivot-Aggressive',   style: 'Aggressive'   },
                { topic: 'SPX-Pivot-Moderate',     style: 'Moderate'     },
                { topic: 'SPX-Pivot-Conservative', style: 'Conservative' },
              ].map(({ topic, style }) => {
                const active = style === tradingStyle;
                return (
                  <tr key={topic} className={`border-b border-[var(--c-border-subtle)] last:border-0 ${active ? 'bg-cyan-500/5' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--c-cyan-strong)]">{topic}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${active ? 'bg-cyan-500/20 text-[var(--c-cyan)]' : 'bg-[var(--c-hover)] text-[var(--c-text-muted)]'}`}>
                        {style}{active ? ' ✓' : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--c-text-secondary)]">
                      Intraday alert when SPX approaches the <span className="font-medium text-[var(--c-text-primary)]">{style}</span> short strike
                    </td>
                  </tr>
                );
              })}
              {pivotPeriods.length > 0 && (
                <tr className="border-t border-[var(--c-border)]">
                  <td colSpan={3} className="px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">Timeframe Topics</td>
                </tr>
              )}
              {pivotPeriods.map((period) => (
                <tr key={period} className="border-b border-[var(--c-border-subtle)] last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-[var(--c-cyan-strong)]">SPX_{period}</td>
                  <td className="px-4 py-3 text-xs text-[var(--c-text-dimmed)]">—</td>
                  <td className="px-4 py-3 text-xs text-[var(--c-text-secondary)]">
                    <span className="font-medium text-[var(--c-text-primary)]">{period}</span> sentiment changes and commentary broadcasts
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
