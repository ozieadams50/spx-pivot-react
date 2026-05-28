import { useState } from 'react';
import { loadProfile, saveProfile } from '../data/profile';

const STYLE_OPTS  = ['Aggressive', 'Moderate', 'Conservative'];
const INDEX_OPTS  = ['SPX', 'XSP'];
const PERIOD_OPTS = ['Daily', 'Weekly', 'Monthly'];

const STYLE_HELP = {
  Aggressive:   'Short leg at S1 / R1 — nearest support/resistance. Highest premium, highest risk.',
  Moderate:     'Short leg at the midpoint between S1/S2 and R1/R2. Balanced risk/reward.',
  Conservative: 'Short leg at S2 / R2 — outermost pivot. Lower premium, larger buffer.',
};

const INDEX_HELP =
  'XSP is exactly 1/10th the size of SPX. Both are cash-settled European-style options — no assignment risk, no early exercise.';

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-300">{label}</label>
      {children}
    </div>
  );
}

function Segment({ options, value, onChange }) {
  return (
    <div className="flex gap-1.5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`flex-1 rounded-xl border py-2 text-xs font-medium transition ${
            value === opt
              ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300'
              : 'border-white/10 bg-white/5 text-slate-400 hover:border-cyan-500/30 hover:text-cyan-300'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function MultiToggle({ options, value, onChange }) {
  function toggle(opt) {
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  }
  return (
    <div className="flex gap-1.5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={`flex-1 rounded-xl border py-2 text-xs font-medium transition ${
            value.includes(opt)
              ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300'
              : 'border-white/10 bg-white/5 text-slate-400 hover:border-cyan-500/30 hover:text-cyan-300'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function SPXTradeSettings() {
  const p = loadProfile();
  const [tradingStyle,  setTradingStyle]  = useState(p.tradingStyle);
  const [index,         setIndex]         = useState(p.index);
  const [deltaTrigger,  setDeltaTrigger]  = useState(p.deltaTrigger);
  const [pivotPeriods,  setPivotPeriods]  = useState(p.pivotPeriods);
  const [success,       setSuccess]       = useState(false);

  function handleSave() {
    saveProfile({ tradingStyle, index, deltaTrigger, pivotPeriods });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">SPX Trade Settings</h1>
        <p className="mt-1 text-sm text-slate-400">
          Controls which pivot levels and alert triggers appear on your SPX Pivot page.
        </p>
      </div>

      <div className="max-w-2xl rounded-2xl border border-white/10 bg-[#0d1f2d] p-6 shadow-lg">
        <div className="space-y-6">

          {/* Trading Style */}
          <Field label="Trading Style">
            <Segment options={STYLE_OPTS} value={tradingStyle} onChange={setTradingStyle} />
            <p className="mt-2 text-xs text-slate-500">{STYLE_HELP[tradingStyle]}</p>
          </Field>

          {/* Index + Delta */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Field label="Index to Trade">
                <Segment options={INDEX_OPTS} value={index} onChange={setIndex} />
              </Field>
              <p className="mt-2 text-xs text-slate-500">{INDEX_HELP}</p>
            </div>
            <Field label="Delta Trigger">
              <input
                type="number"
                min={0.05} max={0.99} step={0.01}
                value={deltaTrigger}
                onChange={(e) => setDeltaTrigger(parseFloat(e.target.value))}
                className="w-full rounded-xl border border-white/10 bg-[#061018] px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
              />
              <p className="mt-2 text-xs text-slate-500">
                Alert fires when the short leg's delta reaches this value. Default: 0.35 (~20 pts OTM).
              </p>
            </Field>
          </div>

          {/* Pivot Periods */}
          <Field label="Pivot Time Period">
            <MultiToggle options={PERIOD_OPTS} value={pivotPeriods} onChange={setPivotPeriods} />
            {pivotPeriods.length === 0 && (
              <p className="mt-2 text-xs text-amber-400">
                Select at least one period to see spread levels and receive alerts.
              </p>
            )}
          </Field>

          {success && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              Trade settings saved.
            </div>
          )}

          <button
            onClick={handleSave}
            className="w-full rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#061018] transition hover:bg-cyan-400"
          >
            Save Trade Settings
          </button>
        </div>
      </div>

      {/* ntfy Subscription Guide */}
      <div className="mt-5 max-w-2xl rounded-2xl border border-white/10 bg-[#0d1f2d] p-6 shadow-lg">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">ntfy Subscriptions</p>
        <p className="mb-4 text-xs text-slate-400">
          Subscribe to these topics in the{' '}
          <a href="https://ntfy.sh" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">
            ntfy.sh
          </a>{' '}
          app to receive alerts. Your active style topic is highlighted.
        </p>
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs font-semibold uppercase tracking-widest text-slate-500">
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
                  <tr
                    key={topic}
                    className={`border-b border-white/5 last:border-0 ${active ? 'bg-cyan-500/5' : ''}`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-cyan-400">{topic}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${
                        active ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/5 text-slate-400'
                      }`}>
                        {style}{active ? ' ✓' : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-xs">
                      Intraday alert when SPX approaches the <span className="text-white font-medium">{style}</span> short strike
                    </td>
                  </tr>
                );
              })}
              {pivotPeriods.length > 0 && (
                <tr className="border-t border-white/10">
                  <td colSpan={3} className="px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Timeframe Topics
                  </td>
                </tr>
              )}
              {pivotPeriods.map((period) => (
                <tr key={period} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-cyan-400">SPX_{period}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">—</td>
                  <td className="px-4 py-3 text-slate-300 text-xs">
                    <span className="font-medium text-white">{period}</span> sentiment changes and commentary broadcasts
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
