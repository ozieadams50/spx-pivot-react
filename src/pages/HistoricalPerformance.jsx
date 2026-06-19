import { useState, useMemo } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';

// ── Metric card with tooltip ──────────────────────────────────────────────────

const ICONS = {
  periods: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" opacity="0.7">
      <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
    </svg>
  ),
  touch: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" opacity="0.7">
      <path d="M13.28 7.78l3.22-3.22v1.69a.75.75 0 001.5 0v-3.5A.75.75 0 0017.25 2h-3.5a.75.75 0 000 1.5h1.69l-3.22 3.22a.75.75 0 001.06 1.06z" />
      <path d="M2 17.25v-3.5a.75.75 0 011.5 0v1.69l3.22-3.22a.75.75 0 011.06 1.06L4.56 16.5h1.69a.75.75 0 010 1.5h-3.5A.75.75 0 012 17.25z" />
    </svg>
  ),
  close_up: (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.5" opacity="0.7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-3.182-.818m3.182.818L17.25 6" />
    </svg>
  ),
  close_down: (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.5" opacity="0.7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.306-4.307a11.95 11.95 0 015.814 5.519l2.74 1.22m0 0l-3.182.818m3.182-.818L17.25 14" />
    </svg>
  ),
  inside: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" opacity="0.7">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
  ),
};

function MetricCard({ label, value, sub, color = 'text-[var(--c-text-primary)]', icon, tooltip }) {
  return (
    <div className="group relative rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-panel)] p-3 cursor-default">
      {tooltip && (
        <div className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-50 w-56 -translate-x-1/2 rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-dropdown)] p-3 opacity-0 shadow-2xl transition-opacity duration-150 group-hover:opacity-100">
          {tooltip.map((line, i) => (
            <p key={i} className={i === 0 ? 'text-[11px] font-semibold text-[var(--c-text-primary)]' : 'mt-1 text-[10px] text-[var(--c-text-muted)]'}>
              {line}
            </p>
          ))}
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[#0a1628]" />
        </div>
      )}
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">{label}</p>
        {icon && <span className="text-[var(--c-text-faint)]">{ICONS[icon]}</span>}
      </div>
      <p className={`mt-1 text-xl font-bold leading-none ${color}`}>{value}</p>
      {sub !== undefined && (
        <p className="mt-0.5 text-[10px] text-[var(--c-text-dimmed)]">{sub}</p>
      )}
    </div>
  );
}

// ── Segmented control ─────────────────────────────────────────────────────────

function Seg({ options, value, onChange }) {
  return (
    <div className="flex gap-1">
      {options.map(o => (
        <button key={o.v} type="button" onClick={() => onChange(o.v)}
          className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition ${
            value === o.v
              ? 'border-cyan-500/50 bg-cyan-500/15 text-[var(--c-cyan)]'
              : 'border-[var(--c-border)] bg-[var(--c-hover)] text-[var(--c-text-muted)] hover:border-white/20'
          }`}>
          {o.l ?? o.v}
        </button>
      ))}
    </div>
  );
}

const inputCls = 'w-full rounded-lg border border-[var(--c-border)] bg-[var(--c-bg-page)] px-2 py-1.5 text-sm text-[var(--c-text-primary)] outline-none focus:border-cyan-500/50';
const Lbl = ({ children }) => (
  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--c-text-dimmed)]">{children}</label>
);

const EVENT_BADGE = {
  touch_r1:   { bg: 'bg-rose-500/15',    text: 'text-[var(--c-rose-strong)]',    label: 'T>R1' },
  close_r1:   { bg: 'bg-rose-500/30',    text: 'text-rose-200',    label: 'C>R1' },
  touch_midr: { bg: 'bg-orange-500/15',  text: 'text-[var(--c-orange)]',  label: 'T>MR' },
  close_midr: { bg: 'bg-orange-500/30',  text: 'text-orange-200',  label: 'C>MR' },
  touch_r2:   { bg: 'bg-amber-500/15',   text: 'text-[var(--c-amber)]',   label: 'T>R2' },
  close_r2:   { bg: 'bg-amber-500/30',   text: 'text-[var(--c-amber)]',   label: 'C>R2' },
  touch_s1:   { bg: 'bg-emerald-500/15', text: 'text-[var(--c-emerald-strong)]', label: 'T<S1' },
  close_s1:   { bg: 'bg-emerald-500/30', text: 'text-emerald-200', label: 'C<S1' },
  touch_mids: { bg: 'bg-teal-500/15',    text: 'text-teal-300',    label: 'T<MS' },
  close_mids: { bg: 'bg-teal-500/30',    text: 'text-teal-200',    label: 'C<MS' },
  touch_s2:   { bg: 'bg-cyan-500/15',    text: 'text-[var(--c-cyan)]',    label: 'T<S2' },
  close_s2:   { bg: 'bg-cyan-500/30',    text: 'text-cyan-200',    label: 'C<S2' },
};

// ── Main page ─────────────────────────────────────────────────────────────────

const DEFAULTS = {
  ticker:     'SPX',
  start_date: '2015-01-01',
  end_date:   new Date().toISOString().slice(0, 10),
  period:     'daily',
  sma_filter: 'none',
};

// ── Premium estimate table ────────────────────────────────────────────────────

function PremiumTable({ title, subtitle, color, columns, data, overall }) {
  const C = {
    emerald: { hdr: 'text-[var(--c-emerald)]', val: 'text-[var(--c-emerald-strong)]', border: 'border-emerald-500/30', bg: 'bg-emerald-500/[0.06]' },
    rose:    { hdr: 'text-[var(--c-rose)]',    val: 'text-[var(--c-rose-strong)]',    border: 'border-rose-500/30',    bg: 'bg-rose-500/[0.06]' },
  }[color];

  return (
    <div className={`rounded-2xl border ${C.border} ${C.bg}`}>
      <div className="border-b border-[var(--c-border)] px-4 py-3">
        <p className={`text-xs font-bold ${C.hdr}`}>{title}</p>
        <p className="mt-0.5 text-[10px] text-[var(--c-text-dimmed)]">{subtitle}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--c-border-subtle)] text-[10px] uppercase tracking-widest text-[var(--c-text-faint)]">
              <th className="px-3 py-2 text-left">VIX</th>
              <th className="px-3 py-2 text-right">Days</th>
              {columns.map(c => (
                <th key={c.key} className={`px-3 py-2 text-right ${C.hdr}`}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-3 py-2 font-mono text-[var(--c-text-secondary)]">{row.vix_range}</td>
                <td className="px-3 py-2 text-right text-[var(--c-text-dimmed)]">{row.count}</td>
                {columns.map(c => {
                  const s = row.spreads[c.key];
                  return (
                    <td key={c.key} className="px-3 py-2 text-right">
                      {s ? (
                        <>
                          <span className={`font-bold ${C.val}`}>${s.mean.toFixed(2)}</span>
                          <span className="ml-1 text-[9px] text-[var(--c-text-faint)]">
                            ${s.p25}–${s.p75}
                          </span>
                        </>
                      ) : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
            {overall && (
              <tr className="border-t border-[var(--c-border)] bg-white/[0.025]">
                <td className="px-3 py-2 text-[10px] font-semibold text-[var(--c-text-muted)]">All VIX</td>
                <td className="px-3 py-2 text-right text-[var(--c-text-dimmed)]">
                  {data.reduce((s, r) => s + r.count, 0)}
                </td>
                {columns.map(c => {
                  const s = overall.spreads[c.key];
                  return (
                    <td key={c.key} className="px-3 py-2 text-right">
                      {s ? (
                        <>
                          <span className={`font-bold ${C.val}`}>${s.mean.toFixed(2)}</span>
                          <span className="ml-1 text-[9px] text-[var(--c-text-faint)]">
                            ${s.p25}–${s.p75}
                          </span>
                        </>
                      ) : '—'}
                    </td>
                  );
                })}
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="px-4 py-2 text-[9px] text-[var(--c-text-faint)]">
        Mean premium shown. ( p25–p75 range ). Black-Scholes at open, 0DTE, 5-wide spread, VIX as IV.
      </p>
    </div>
  );
}

export default function HistoricalPerformance() {
  const { role }                       = useAuth();
  const canSeePremiums                 = role === 'admin' || role === 'superuser';
  const [form,           setForm]        = useState({ ...DEFAULTS });
  const [results,        setResults]     = useState(null);
  const [premiums,       setPremiums]    = useState(null);
  const [loading,        setLoading]     = useState(false);
  const [error,          setError]       = useState('');
  const [showInverse,    setShowInverse] = useState(false);
  const [regStrike,      setRegStrike]   = useState('S1');   // register strike level
  const SPREAD_WIDTH = 5;

  // ── VIX bucket helper — labels must match api/historical.py _BUCKET_ORDER ──
  function vixBucket(v) {
    if (v == null) return null;
    if (v < 15)   return '< 15';
    if (v < 20)   return '15–20';   // en-dash: 15–20
    if (v < 25)   return '20–25';   // en-dash: 20–25
    if (v < 30)   return '25–30';   // en-dash: 25–30
    return '30+';
  }

  // ── Per-row P&L registry (chronological, then displayed reversed) ──────────
  const registry = useMemo(() => {
    if (!results?.periods) return [];
    let running = 0;
    return results.periods.map(p => {
      // Credit = bull_put_mids mean for that day's VIX bucket; fall back to overall avg
      const bucket  = vixBucket(p.vix);
      const bktData = premiums?.by_vix_bucket?.find(b => b.vix_range === bucket);
      const credit  = bktData?.spreads?.bull_put_mids?.mean
                   ?? premiums?.overall?.spreads?.bull_put_mids?.mean
                   ?? null;

      // Short strike based on selected level
      const shortK = regStrike === 'S1' ? p.s1 : regStrike === 'MidS' ? p.mid_s : p.s2;
      const longK  = shortK - SPREAD_WIDTH;

      let pnl = null;
      if (credit != null && shortK != null) {
        if (p.close >= shortK) {
          pnl = credit * 100;                                  // full win
        } else if (p.close >= longK) {
          pnl = (credit - (shortK - p.close)) * 100;          // partial loss
        } else {
          pnl = (credit - SPREAD_WIDTH) * 100;                 // max loss
        }
        pnl = Math.round(pnl * 100) / 100;
      }
      running = credit != null ? Math.round((running + (pnl ?? 0)) * 100) / 100 : running;
      return { pnl, cumulative: credit != null ? running : null, credit, bucket };
    });
  }, [results, premiums, regStrike]);

  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  async function runQuery() {
    setLoading(true); setError(''); setResults(null); setPremiums(null);
    try {
      const base = {
        ticker:       form.ticker.trim().toUpperCase(),
        start_date:   form.start_date,
        end_date:     form.end_date,
        sma_filter:   form.sma_filter,
      };
      const quantParams = new URLSearchParams({ ...base, period: form.period });
      const premParams  = new URLSearchParams({ ...base, spread_width: '5', period: form.period });

      const [data, prem] = await Promise.all([
        apiFetch(`/historical/quant?${quantParams}`),
        canSeePremiums
          ? apiFetch(`/historical/premium-estimate?${premParams}`).catch(() => null)
          : Promise.resolve(null),
      ]);
      setResults(data);
      setPremiums(prem);
    } catch (e) {
      setError(e.message ?? 'Query failed.');
    } finally {
      setLoading(false);
    }
  }

  const s = results?.summary;

  return (
    <div className="p-4 md:p-5">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--c-text-primary)]">Historical Performance</h1>
          <p className="text-sm text-[var(--c-text-muted)]">DKQPivot touch &amp; close statistics by period</p>
        </div>
        <button onClick={runQuery} disabled={loading}
          className="rounded-lg bg-violet-600 px-4 py-1.5 text-xs font-bold text-[var(--c-text-primary)] transition hover:bg-violet-500 disabled:opacity-50">
          {loading ? 'Running…' : '▶  Run Query'}
        </button>
      </div>

      {/* ── Main grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-4">

        {/* ── Left: Inputs ─────────────────────────────────────────────── */}
        <div className="col-span-3 rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-panel)] p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[var(--c-text-dimmed)]">Query Inputs</p>

          <div className="space-y-4">
            <div>
              <Lbl>Symbol</Lbl>
              <input type="text" value={form.ticker}
                onChange={e => set('ticker')(e.target.value)}
                placeholder="SPY"
                className={inputCls} />
              <p className="mt-1 text-[9px] text-[var(--c-text-faint)]">SPX, SPY, or any ticker in the database</p>
            </div>

            <div>
              <Lbl>Date Range</Lbl>
              <div className="space-y-1.5">
                <div>
                  <p className="mb-0.5 text-[9px] uppercase tracking-wider text-[var(--c-text-dimmed)]">From</p>
                  <input type="date" value={form.start_date}
                    onChange={e => set('start_date')(e.target.value)}
                    style={{ colorScheme: 'dark' }}
                    className={inputCls} />
                </div>
                <div>
                  <p className="mb-0.5 text-[9px] uppercase tracking-wider text-[var(--c-text-dimmed)]">To</p>
                  <input type="date" value={form.end_date}
                    onChange={e => set('end_date')(e.target.value)}
                    style={{ colorScheme: 'dark' }}
                    className={inputCls} />
                </div>
              </div>
            </div>

            <div>
              <Lbl>Quant Period</Lbl>
              <Seg
                options={[{ v: 'daily', l: 'Daily' }, { v: 'weekly', l: 'Weekly' }, { v: 'monthly', l: 'Monthly' }]}
                value={form.period}
                onChange={set('period')}
              />
              <p className="mt-1.5 text-[9px] text-[var(--c-text-faint)]">
                Sets the period used to calculate R1/R2/S1/S2 pivot levels
              </p>
            </div>

            <div>
              <Lbl>Daily SMA Filter</Lbl>
              <select
                value={form.sma_filter}
                onChange={e => set('sma_filter')(e.target.value)}
                className={inputCls}
              >
                <option value="none">None</option>
                <option value="spx_above_20ma">SPX above 20MA</option>
                <option value="spx_below_20ma">SPX below 20MA</option>
              </select>
              <p className="mt-1 text-[9px] text-[var(--c-text-faint)]">Filter periods by SPX vs 20-day MA</p>
            </div>

            {/* ── View toggle ───────────────────────────────────────── */}
            <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-hover-faint)] p-3">
              <Lbl>Card View</Lbl>
              <button
                type="button"
                onClick={() => setShowInverse(v => !v)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                  showInverse ? 'bg-violet-600' : 'bg-[var(--c-hover-strong)]'
                }`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                  showInverse ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
              <p className="mt-2 text-[10px] leading-relaxed text-[var(--c-text-muted)]">
                {showInverse
                  ? <><span className="font-semibold text-[var(--c-violet)]">Inverse view:</span> periods that DID NOT touch or close the level</>
                  : <><span className="font-semibold text-[var(--c-cyan)]">Default view:</span> periods that DID touch or close the level</>
                }
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-[var(--c-rose-strong)]">{error}</div>
            )}

            <button onClick={runQuery} disabled={loading}
              className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-bold text-[var(--c-text-primary)] transition hover:bg-violet-500 disabled:opacity-50">
              {loading ? 'Running…' : '▶  RUN QUERY'}
            </button>
          </div>
        </div>

        {/* ── Right: Results ────────────────────────────────────────────── */}
        <div className="col-span-9 space-y-4">

          {loading && (
            <div className="flex h-48 items-center justify-center rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-panel)]">
              <div className="text-center">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-400" />
                <p className="text-sm text-[var(--c-text-muted)]">Calculating pivot statistics…</p>
              </div>
            </div>
          )}

          {!results && !loading && (
            <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-[var(--c-border)] bg-[var(--c-bg-panel)]">
              <p className="text-sm text-[var(--c-text-faint)]">Configure inputs and click Run Query</p>
            </div>
          )}

          {results && s && (
            <>
              {/* ── Inverse helper ───────────────────────────────────────── */}
              {(() => {
                const n = s.periods_analyzed;
                const inv = key => n - s[key];
                const invPct = key => parseFloat((100 - s[key + '_pct']).toFixed(1));

                // Row 1 summary card logic
                const inside1     = showInverse ? inv('inside_r1s1') : s.inside_r1s1;
                const inside1Pct  = showInverse ? invPct('inside_r1s1') : s.inside_r1s1_pct;
                const inside2     = showInverse ? inv('inside_r2s2') : s.inside_r2s2;
                const inside2Pct  = showInverse ? invPct('inside_r2s2') : s.inside_r2s2_pct;

                return (
                  <>
              {/* ── View state banner ────────────────────────────────────── */}
              <div className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 ${
                showInverse
                  ? 'border-violet-500/30 bg-violet-500/10'
                  : 'border-cyan-500/30 bg-cyan-500/10'
              }`}>
                <span className={`h-2 w-2 flex-shrink-0 rounded-full ${showInverse ? 'bg-violet-400' : 'bg-cyan-400'}`} />
                <p className="text-xs font-semibold text-[var(--c-text-primary)]">
                  {showInverse ? 'Inverse View' : 'Default View'}
                </p>
                <span className="text-xs text-[var(--c-text-muted)]">—</span>
                <p className="text-xs text-[var(--c-text-muted)]">
                  {showInverse
                    ? 'Showing periods that DID NOT touch or close the level'
                    : 'Showing periods that DID touch or close the level'}
                </p>
              </div>

              {/* ── Row 1: Summary ───────────────────────────────────────── */}
              <div className="grid grid-cols-3 gap-3">
                <MetricCard
                  label="Periods Analyzed"
                  value={n.toLocaleString()}
                  color="text-[var(--c-text-primary)]"
                  icon="periods"
                  tooltip={[
                    `${n.toLocaleString()} complete ${form.period} periods`,
                    `From ${form.start_date} to ${form.end_date}`,
                    'R1/R2/S1/S2 are the DKQPivot levels',
                  ]}
                />
                <MetricCard
                  label={showInverse ? 'Outside R1 / S1' : 'Inside R1 / S1'}
                  value={`${inside1Pct}%`}
                  sub={`${inside1.toLocaleString()} periods`}
                  color="text-[var(--c-cyan-strong)]"
                  icon="inside"
                  tooltip={showInverse ? [
                    `${inside1} periods (${inside1Pct}%) closed`,
                    'OUTSIDE the R1/S1 range',
                    'i.e. closed above R1 or below S1',
                  ] : [
                    `${inside1} periods (${inside1Pct}%) closed`,
                    'between R1 and S1',
                  ]}
                />
                <MetricCard
                  label={showInverse ? 'Outside R2 / S2' : 'Inside R2 / S2'}
                  value={`${inside2Pct}%`}
                  sub={`${inside2.toLocaleString()} periods`}
                  color="text-[var(--c-violet-strong)]"
                  icon="inside"
                  tooltip={showInverse ? [
                    `${inside2} periods (${inside2Pct}%) closed`,
                    'OUTSIDE the R2/S2 range',
                    'i.e. closed above R2 or below S2',
                  ] : [
                    `${inside2} periods (${inside2Pct}%) closed`,
                    'between R2 and S2',
                  ]}
                />
              </div>

              {/* ── Row 2: Resistance (R1/R2) ────────────────────────────── */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { base: 'touch_r1', label: 'Touch > R1', invLabel: 'No Touch > R1', color: 'text-[var(--c-rose)]',   icon: 'touch',    tip: ['where the HIGH reached R1'], invTip: ['where HIGH stayed BELOW R1', 'price did not reach resistance'] },
                  { base: 'close_r1', label: 'Close > R1', invLabel: 'No Close > R1', color: 'text-[var(--c-rose-strong)]',   icon: 'close_up', tip: ['that CLOSED above R1'], invTip: ['that CLOSED below R1',         'price did not break resistance at close'] },
                  { base: 'touch_r2', label: 'Touch > R2', invLabel: 'No Touch > R2', color: 'text-[var(--c-orange-strong)]', icon: 'touch',    tip: ['where the HIGH reached R2'],  invTip: ['where HIGH stayed BELOW R2', 'price did not reach extended resistance'] },
                  { base: 'close_r2', label: 'Close > R2', invLabel: 'No Close > R2', color: 'text-[var(--c-orange)]', icon: 'close_up', tip: ['that CLOSED above R2'], invTip: ['that CLOSED below R2',    'price did not break extended resistance'] },
                ].map(({ base, label, invLabel, color, icon, tip, invTip }) => {
                  const count = showInverse ? inv(base) : s[base];
                  const pct   = showInverse ? invPct(base) : s[base + '_pct'];
                  return (
                    <MetricCard key={base}
                      label={showInverse ? invLabel : label}
                      value={`${pct}%`}
                      sub={`${count.toLocaleString()} periods`}
                      color={color}
                      icon={icon}
                      tooltip={[
                        `${count} periods (${pct}%)`,
                        ...(showInverse ? invTip : tip),
                      ]}
                    />
                  );
                })}
              </div>

              {/* ── Row 2b: Mid-R / Mid-S ────────────────────────────────── */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { base: 'touch_midr', label: 'Touch > Mid-R', invLabel: 'No Touch > Mid-R', color: 'text-[var(--c-orange-strong)]', icon: 'touch',      tip: ['where the HIGH reached Mid-R', 'midpoint between R1 and R2'], invTip: ['where HIGH stayed BELOW Mid-R'] },
                  { base: 'close_midr', label: 'Close > Mid-R', invLabel: 'No Close > Mid-R', color: 'text-[var(--c-orange)]', icon: 'close_up',   tip: ['that CLOSED above Mid-R'],                                    invTip: ['that CLOSED below Mid-R'] },
                  { base: 'touch_mids', label: 'Touch < Mid-S', invLabel: 'No Touch < Mid-S', color: 'text-teal-400',   icon: 'touch',      tip: ['where the LOW fell below Mid-S', 'midpoint between S1 and S2'], invTip: ['where LOW stayed ABOVE Mid-S'] },
                  { base: 'close_mids', label: 'Close < Mid-S', invLabel: 'No Close < Mid-S', color: 'text-teal-300',   icon: 'close_down', tip: ['that CLOSED below Mid-S'],                                    invTip: ['that CLOSED above Mid-S'] },
                ].map(({ base, label, invLabel, color, icon, tip, invTip }) => {
                  const count = showInverse ? inv(base) : s[base];
                  const pct   = showInverse ? invPct(base) : s[base + '_pct'];
                  return (
                    <MetricCard key={base}
                      label={showInverse ? invLabel : label}
                      value={`${pct}%`}
                      sub={`${count.toLocaleString()} periods`}
                      color={color}
                      icon={icon}
                      tooltip={[
                        `${count} periods (${pct}%)`,
                        ...(showInverse ? invTip : tip),
                      ]}
                    />
                  );
                })}
              </div>

              {/* ── Row 3: Support (S1/S2) ───────────────────────────────── */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { base: 'touch_s1', label: 'Touch < S1', invLabel: 'No Touch < S1', color: 'text-[var(--c-emerald)]', icon: 'touch',      tip: ['where the LOW fell below S1'], invTip: ['where LOW stayed ABOVE S1', 'price did not reach support'] },
                  { base: 'close_s1', label: 'Close < S1', invLabel: 'No Close < S1', color: 'text-[var(--c-emerald-strong)]', icon: 'close_down', tip: ['that CLOSED below S1'], invTip: ['that CLOSED above S1',         'price held above support at close'] },
                  { base: 'touch_s2', label: 'Touch < S2', invLabel: 'No Touch < S2', color: 'text-[var(--c-cyan-strong)]',    icon: 'touch',      tip: ['where the LOW fell below S2'], invTip: ['where LOW stayed ABOVE S2', 'price did not reach extended support'] },
                  { base: 'close_s2', label: 'Close < S2', invLabel: 'No Close < S2', color: 'text-[var(--c-cyan)]',    icon: 'close_down', tip: ['that CLOSED below S2'], invTip: ['that CLOSED above S2', 'price did not break extended support'] },
                ].map(({ base, label, invLabel, color, icon, tip, invTip }) => {
                  const count = showInverse ? inv(base) : s[base];
                  const pct   = showInverse ? invPct(base) : s[base + '_pct'];
                  return (
                    <MetricCard key={base}
                      label={showInverse ? invLabel : label}
                      value={`${pct}%`}
                      sub={`${count.toLocaleString()} periods`}
                      color={color}
                      icon={icon}
                      tooltip={[
                        `${count} periods (${pct}%)`,
                        ...(showInverse ? invTip : tip),
                      ]}
                    />
                  );
                })}
              </div>
                  </>
                );
              })()}

              {/* ── Premium estimates — Admin / Super User only ──────────── */}
              {canSeePremiums && premiums && premiums.by_vix_bucket.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 rounded-xl border border-[var(--c-border)] bg-white/[0.02] px-4 py-2.5">
                    <span className="h-2 w-2 flex-shrink-0 rounded-full bg-violet-400" />
                    <p className="text-xs font-semibold text-[var(--c-text-primary)]">5-Wide Spread Premium Estimates</p>
                    <span className="text-xs text-[var(--c-text-muted)]">—</span>
                    <p className="text-xs text-[var(--c-text-muted)]">Black-Scholes at open · {premiums.params?.dte ?? '0DTE'} · VIX as IV · {premiums.total_days} trading days</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <PremiumTable
                      title="Bull Put Credit Spreads"
                      subtitle="Sell put at level, buy 5 pts lower — profit if SPX holds above"
                      color="emerald"
                      columns={[
                        { key: 'bull_put_s2',   label: 'S2' },
                        { key: 'bull_put_mids', label: 'Mid-S' },
                        { key: 'bull_put_s1',   label: 'S1' },
                      ]}
                      data={premiums.by_vix_bucket}
                      overall={premiums.overall}
                    />
                    <PremiumTable
                      title="Bear Call Credit Spreads"
                      subtitle="Sell call at level, buy 5 pts higher — profit if SPX holds below"
                      color="rose"
                      columns={[
                        { key: 'bear_call_r2',   label: 'R2' },
                        { key: 'bear_call_midr', label: 'Mid-R' },
                        { key: 'bear_call_r1',   label: 'R1' },
                      ]}
                      data={premiums.by_vix_bucket}
                      overall={premiums.overall}
                    />
                  </div>
                </div>
              )}

              {/* ── Period detail table ───────────────────────────────────── */}
              <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-panel)]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--c-border)] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">
                    Period Detail — {results.periods.length.toLocaleString()} {form.period} periods
                  </p>
                  <div className="flex items-center gap-3">
                    {/* Register strike selector */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-[var(--c-text-dimmed)] uppercase tracking-wider">Register:</span>
                      {['S1','MidS','S2'].map(s => (
                        <button key={s} type="button" onClick={() => setRegStrike(s)}
                          className={`rounded px-2 py-0.5 text-[10px] font-semibold transition ${
                            regStrike === s
                              ? 'bg-emerald-500/20 text-[var(--c-emerald-strong)]'
                              : 'text-[var(--c-text-dimmed)] hover:text-[var(--c-text-secondary)]'
                          }`}>
                          {s === 'MidS' ? 'Mid-S' : s}
                        </button>
                      ))}
                      <span className="text-[10px] text-[var(--c-text-faint)]">· $5 spread · Mid-S VIX credit</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const cols = ['Date','VIX','P&L','Running P&L','Period Open','R2','Mid-R','R1','S1','Mid-S','S2','Open','High','Low','Close','T>R1','C>R1','T>MR','C>MR','T>R2','C>R2','T<S1','C<S1','T<MS','C<MS','T<S2','C<S2'];
                      const rows = results.periods.map((p, idx) => [
                        p.date, p.vix ?? '',
                        registry[idx]?.pnl ?? '', registry[idx]?.cumulative ?? '',
                        p.period_open, p.r2, p.mid_r, p.r1, p.s1, p.mid_s, p.s2,
                        p.open, p.high, p.low, p.close,
                        p.touch_r1?1:0, p.close_r1?1:0, p.touch_midr?1:0, p.close_midr?1:0,
                        p.touch_r2?1:0, p.close_r2?1:0,
                        p.touch_s1?1:0, p.close_s1?1:0, p.touch_mids?1:0, p.close_mids?1:0,
                        p.touch_s2?1:0, p.close_s2?1:0,
                      ].join(','));
                      const csv = [cols.join(','), ...rows].join('\n');
                      const a = document.createElement('a');
                      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
                      a.download = `${form.ticker}_${form.period}_quant.csv`;
                      a.click();
                    }}
                    className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-[var(--c-cyan-strong)] transition hover:bg-cyan-500/20">
                    ↓ Export CSV
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[var(--c-border-subtle)] text-[10px] uppercase tracking-widest text-[var(--c-text-faint)]">
                        <th className="px-3 py-2 text-left">Date</th>
                        <th className="px-3 py-2 text-right text-[var(--c-violet-strong)]/80">P&amp;L</th>
                        <th className="px-3 py-2 text-right text-[var(--c-violet-strong)]/80">Running</th>
                        <th className="px-3 py-2 text-right">Open</th>
                        <th className="px-3 py-2 text-right text-amber-500/70">R2</th>
                        <th className="px-3 py-2 text-right text-orange-500/70">Mid-R</th>
                        <th className="px-3 py-2 text-right text-rose-500/70">R1</th>
                        <th className="px-3 py-2 text-right text-emerald-500/70">S1</th>
                        <th className="px-3 py-2 text-right text-teal-500/70">Mid-S</th>
                        <th className="px-3 py-2 text-right text-cyan-500/70">S2</th>
                        <th className="px-3 py-2 text-right">High</th>
                        <th className="px-3 py-2 text-right">Low</th>
                        <th className="px-3 py-2 text-right">Close</th>
                        <th className="px-3 py-2 text-left">Events</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...results.periods].reverse().map((p, i) => {
                        const chronoIdx = results.periods.length - 1 - i;
                        const reg = registry[chronoIdx];
                        const events = Object.entries(EVENT_BADGE).filter(([k]) => p[k]);
                        const hasResistance = p.close_r1 || p.close_r2;
                        const hasSupport    = p.close_s1 || p.close_s2;
                        const rowBg = hasResistance
                          ? 'bg-rose-500/[0.03]'
                          : hasSupport ? 'bg-emerald-500/[0.03]' : '';
                        return (
                          <tr key={i} className={`border-b border-white/[0.04] transition-colors hover:bg-white/[0.02] ${rowBg}`}>
                            <td className="px-3 py-1.5 font-mono text-[var(--c-text-secondary)]">{p.date}</td>
                            {/* ── P&L register columns ── */}
                            <td className={`px-3 py-1.5 text-right font-mono font-semibold ${
                              reg?.pnl == null ? 'text-[var(--c-text-faint)]' :
                              reg.pnl > 0 ? 'text-[var(--c-emerald)]' : reg.pnl < 0 ? 'text-[var(--c-rose)]' : 'text-[var(--c-text-muted)]'
                            }`}>
                              {reg?.pnl == null ? '—' : `${reg.pnl >= 0 ? '+' : ''}$${reg.pnl.toFixed(0)}`}
                            </td>
                            <td className={`px-3 py-1.5 text-right font-mono font-bold ${
                              reg?.cumulative == null ? 'text-[var(--c-text-faint)]' :
                              reg.cumulative > 0 ? 'text-[var(--c-emerald-strong)]' : reg.cumulative < 0 ? 'text-[var(--c-rose-strong)]' : 'text-[var(--c-text-muted)]'
                            }`}>
                              {reg?.cumulative == null ? '—' : `${reg.cumulative >= 0 ? '+' : ''}$${reg.cumulative.toFixed(0)}`}
                            </td>
                            <td className="px-3 py-1.5 text-right font-mono text-[var(--c-text-muted)]">{p.period_open}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-[var(--c-amber-strong)]/70">{p.r2}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-[var(--c-orange-strong)]/70">{p.mid_r}</td>
                            <td className="px-3 py-1.5 text-right font-mono font-medium text-[var(--c-rose)]">{p.r1}</td>
                            <td className="px-3 py-1.5 text-right font-mono font-medium text-[var(--c-emerald)]">{p.s1}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-teal-400/70">{p.mid_s}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-[var(--c-cyan-strong)]/70">{p.s2}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-[var(--c-text-secondary)]">{p.high}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-[var(--c-text-secondary)]">{p.low}</td>
                            <td className={`px-3 py-1.5 text-right font-mono font-semibold ${p.close > p.period_open ? 'text-[var(--c-emerald)]' : 'text-[var(--c-rose)]'}`}>
                              {p.close}
                            </td>
                            <td className="px-3 py-1.5">
                              <div className="flex flex-wrap gap-1">
                                {events.map(([k, cfg]) => (
                                  <span key={k} className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${cfg.bg} ${cfg.text}`}>
                                    {cfg.label}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
