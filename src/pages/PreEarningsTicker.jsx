import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { GRADE_CONFIG, MODEL_CONFIG, METRICS } from '../data/earningsConfig';
import PageGuide from '../components/PageGuide';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function GradeBadge({ grade }) {
  const cfg = GRADE_CONFIG[grade] ?? GRADE_CONFIG['D'];
  return (
    <span className={`inline-flex items-center rounded-xl border px-2.5 py-0.5 text-xs font-bold ${cfg.badge}`}>
      {grade}
    </span>
  );
}

function ModelBadge({ model }) {
  const cls = MODEL_CONFIG[model] ?? MODEL_CONFIG.Recovery;
  return (
    <span className={`inline-flex items-center rounded-xl border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {model}
    </span>
  );
}

function MetricBar({ label, score, max, rawValue }) {
  const pct   = max > 0 ? Math.min(100, ((score ?? 0) / max) * 100) : 0;
  const color = pct >= 75 ? 'bg-emerald-500' : pct >= 40 ? 'bg-sky-500' : 'bg-slate-600';
  return (
    <div className="py-2.5">
      <div className="mb-1 flex items-center justify-between gap-4">
        <span className="text-xs text-[var(--c-text-muted)] truncate">{label}</span>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-mono text-[var(--c-text-dimmed)] w-24 text-right truncate">{rawValue}</span>
          <span className="text-xs font-mono text-[var(--c-text-primary)] w-14 text-right">
            {(score ?? 0).toFixed(1)} / {max}
          </span>
        </div>
      </div>
      <div className="h-1.5 w-full rounded-full bg-[var(--c-hover-strong)]">
        <div className={`h-1.5 rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function KeyMetric({ label, value, signed = false, pct = false, prefix = '', tooltip, subtitle }) {
  const color =
    value == null        ? 'text-[var(--c-text-faint)]'
    : signed && value > 0 ? 'text-[var(--c-emerald)]'
    : signed && value < 0 ? 'text-[var(--c-rose)]'
    :                        'text-[var(--c-text-primary)]';
  const display = value == null
    ? '—'
    : `${prefix}${signed && value > 0 ? '+' : ''}${value.toFixed(1)}${pct ? '%' : ''}`;
  return (
    <div className="relative group/tip rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-card)] p-4 text-center cursor-default">
      <p className="text-[10px] uppercase tracking-wide text-[var(--c-text-dimmed)]">{label}</p>
      <p className={`mt-2 text-xl font-bold font-mono ${color}`}>{display}</p>
      {subtitle && <p className="mt-1 text-[10px] font-mono text-[var(--c-text-dimmed)]">{subtitle}</p>}
      {tooltip && (
        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-50
                        opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150
                        w-56 rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-dropdown)] shadow-xl
                        px-3 py-2.5 text-[10px] text-[var(--c-text-secondary)] leading-relaxed whitespace-normal text-left">
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0
                          border-l-[5px] border-r-[5px] border-t-[5px]
                          border-l-transparent border-r-transparent border-t-[#0d1822]" />
        </div>
      )}
    </div>
  );
}

// ── Last 8 Quarters ────────────────────────────────────────────────────────────

function QuarterlyReturns({ quarters }) {
  if (!quarters || quarters.length === 0) return null;
  return (
    <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-card)] p-6">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">
        Last 8 Quarters · 15-Day Pre-Earnings Runup
      </h2>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {quarters.map((q) => {
          const pct   = q.runup_pct;
          const isPos = pct != null && pct >= 0;
          const isNeg = pct != null && pct < 0;
          return (
            <div
              key={q.earnings_date}
              className={`flex min-w-[76px] flex-1 flex-col items-center gap-1.5 rounded-2xl border p-3 ${
                isPos ? 'border-emerald-500/30 bg-emerald-500/10'
                : isNeg ? 'border-rose-500/30 bg-rose-500/10'
                : 'border-[var(--c-border-subtle)] bg-[var(--c-hover)]'
              }`}
            >
              <p className="text-[9px] font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)] text-center leading-tight">
                {q.earnings_quarter}
              </p>
              <p className={`text-lg font-black font-mono leading-none ${
                isPos ? 'text-[var(--c-emerald)]' : isNeg ? 'text-[var(--c-rose)]' : 'text-[var(--c-text-faint)]'
              }`}>
                {pct != null ? `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%` : '—'}
              </p>
              {q.entry_price && q.exit_price && (
                <>
                  <p className={`text-xs font-semibold font-mono ${
                    isPos ? 'text-[var(--c-emerald)]' : isNeg ? 'text-[var(--c-rose)]' : 'text-[var(--c-text-dimmed)]'
                  }`}>
                    {q.exit_price - q.entry_price >= 0 ? '+' : ''}${(q.exit_price - q.entry_price).toFixed(2)}
                  </p>
                  <p className="text-[9px] text-[var(--c-text-muted)] text-center">
                    ${q.entry_price.toFixed(2)} → ${q.exit_price.toFixed(2)}
                  </p>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Monthly Returns Grid ───────────────────────────────────────────────────────

function cellCls(pct) {
  if (pct == null) return 'bg-transparent text-slate-700';
  if (pct >=  5)   return 'bg-emerald-500 text-[var(--c-text-primary)]';
  if (pct >=  2)   return 'bg-emerald-600/80 text-[var(--c-text-primary)]';
  if (pct >=  0)   return 'bg-emerald-900/70 text-[var(--c-emerald-strong)]';
  if (pct >= -2)   return 'bg-rose-900/70 text-[var(--c-rose-strong)]';
  if (pct >= -5)   return 'bg-rose-600/80 text-[var(--c-text-primary)]';
  return                  'bg-rose-500 text-[var(--c-text-primary)]';
}

function MonthlyReturns({ monthly }) {
  if (!monthly || monthly.length === 0) return null;

  const byYear = {};
  for (const m of monthly) {
    (byYear[m.year] ??= {})[m.month] = m.return_pct;
  }
  const years = Object.keys(byYear).map(Number).sort();

  function annualReturn(year) {
    const months = byYear[year];
    let compound = 1;
    let hasData  = false;
    for (let mo = 1; mo <= 12; mo++) {
      if (months[mo] != null) { compound *= (1 + months[mo] / 100); hasData = true; }
    }
    return hasData ? Math.round((compound - 1) * 10000) / 100 : null;
  }

  return (
    <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-card)] p-6">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">Monthly Returns</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-separate border-spacing-[3px]">
          <thead>
            <tr>
              <th className="w-10 text-left text-[var(--c-text-dimmed)] pb-1.5"></th>
              {MONTH_NAMES.map((m) => (
                <th key={m} className="min-w-[40px] text-center font-semibold text-[var(--c-text-dimmed)] pb-1.5">{m}</th>
              ))}
              <th className="min-w-[48px] text-center font-semibold text-[var(--c-text-dimmed)] pb-1.5">Year</th>
            </tr>
          </thead>
          <tbody>
            {years.map((year) => {
              const annual = annualReturn(year);
              return (
                <tr key={year}>
                  <td className="pr-2 font-semibold text-[var(--c-text-dimmed)]">{year}</td>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((mo) => {
                    const pct = byYear[year]?.[mo] ?? null;
                    return (
                      <td
                        key={mo}
                        className={`rounded-md p-1.5 text-center font-mono font-semibold text-[10px] ${cellCls(pct)}`}
                      >
                        {pct != null ? `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}` : ''}
                      </td>
                    );
                  })}
                  <td className={`rounded-md p-1.5 text-center font-mono font-bold text-[11px] ${cellCls(annual)}`}>
                    {annual != null ? `${annual >= 0 ? '+' : ''}${annual.toFixed(1)}%` : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Dynamic Context (Phase 2) ──────────────────────────────────────────────────

const SECTION_META = [
  {
    key: 's1_historical',
    label: 'S1 · Historical Pattern',
    desc: 'What this stock has done in pre-earnings windows across past quarters',
    metrics: [
      { label: 'Avg Run-Up',    key: 'm1_avg_pct',      fmt: v => v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}%` : '—' },
      { label: 'Positive Rate', key: 'm2_pos_rate',      fmt: v => v != null ? `${v.toFixed(0)}%` : '—' },
      { label: 'Beat Rate',     key: 'm8_beat_rate',     fmt: v => v != null ? `${v.toFixed(0)}%` : '—' },
      { label: 'Post-Earn Avg', key: 'm4_post_earn_avg', fmt: v => v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}%` : '—' },
    ],
  },
  {
    key: 's2_momentum',
    label: 'S2 · Current Momentum',
    desc: 'Where price is moving right now relative to SPY and its sector',
    metrics: [
      { label: 'RS vs SPY',     key: 'm5_rs_spy',        fmt: v => v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}%` : '—' },
      { label: 'Stk vs Sector', key: 'm15_stk_vs_sec',   fmt: v => v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}%` : '—' },
      { label: 'Sec vs SPY',    key: 'm15_sec_vs_spy',   fmt: v => v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}%` : '—' },
      { label: 'AVWAP',         key: 'm19_avwap_pct',    fmt: v => v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}%` : '—' },
      { label: 'Higher Lows',   key: 'm20_lows_slope',   fmt: v => v != null ? `${(v * 100).toFixed(2)}%/d` : '—' },
    ],
  },
  {
    key: 's3_fundamental',
    label: 'S3 · Fundamental Catalyst',
    desc: 'Earnings setup quality — acceleration, beat history, and post-earnings reaction',
    metrics: [
      { label: 'EPS Accel',      key: 'm6_eps_accel',    fmt: v => v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(1)} ppts` : '—' },
      { label: 'Beat Magnitude', key: 'm7_beat_mag',     fmt: v => v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}%` : '—' },
      { label: 'Beat Rate',      key: 'm8_beat_rate',    fmt: v => v != null ? `${v.toFixed(0)}%` : '—' },
    ],
  },
  {
    key: 's4_technical',
    label: 'S4 · Technical Setup',
    desc: 'Chart configuration — MA alignment, RSI position, and volatility expansion',
    metrics: [
      { label: 'RSI',          key: 'm16_rsi',         fmt: v => v != null ? v.toFixed(0) : '—' },
      { label: 'ATR Ratio',    key: 'm17_atr_ratio',   fmt: v => v != null ? `${v.toFixed(2)}x` : '—' },
      { label: 'MA Alignment', key: 'm18_ma_align',    fmt: v => v ?? '—' },
    ],
  },
  {
    key: 's5_volume',
    label: 'S5 · Volume & Accumulation',
    desc: 'Is smart money positioning? Volume trend and relative volume signal conviction',
    metrics: [
      { label: 'Vol Ratio', key: 'm13_vol_ratio', fmt: v => v != null ? `${v.toFixed(2)}x` : '—' },
    ],
  },
];

const OVERRIDE_LABELS = {
  rs_spy_gt10:         'RS vs SPY > 10%',
  stk_sec_gt5:         'Stock vs Sector > 5%',
  sec_spy_gt5:         'Sector vs SPY > 5%',
  'lows_slope_gt0.8':  'Higher Lows Slope > 0.80',
  avwap_gt20pct:       'AVWAP > 20% above',
  eps_accel_gt10:      'EPS Accel > 10 ppts',
};

function sectionBarColor(score) {
  if (score == null) return 'bg-slate-600';
  if (score >= 70)   return 'bg-emerald-500';
  if (score >= 45)   return 'bg-amber-500';
  return 'bg-rose-500';
}

function sectionNumColor(score) {
  if (score == null) return 'text-[var(--c-text-dimmed)]';
  if (score >= 70)   return 'text-[var(--c-emerald)]';
  if (score >= 45)   return 'text-[var(--c-amber-strong)]';
  return 'text-[var(--c-rose)]';
}

function pillCls(val, threshold) {
  if (val == null) return 'border-[var(--c-border)] bg-[var(--c-hover)] text-[var(--c-text-dimmed)]';
  return val >= threshold
    ? 'border-emerald-500/40 bg-emerald-500/15 text-[var(--c-emerald-strong)]'
    : 'border-[var(--c-border)] bg-[var(--c-hover)] text-[var(--c-text-muted)]';
}

function Tooltip({ text, children }) {
  return (
    <div className="relative group/tip inline-block">
      {children}
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-50
                      opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150
                      w-56 rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-dropdown)] shadow-xl
                      px-3 py-2.5 text-[10px] text-[var(--c-text-secondary)] leading-relaxed whitespace-normal text-left">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0
                        border-l-[5px] border-r-[5px] border-t-[5px]
                        border-l-transparent border-r-transparent border-t-[#0d1822]" />
      </div>
    </div>
  );
}

function SectionPanel({ meta, ctx, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const score = ctx[meta.key];

  return (
    <div className="rounded-2xl border border-[var(--c-border)] overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--c-hover)] transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[var(--c-text-primary)] mb-1.5">{meta.label}</p>
          <div className="h-1.5 w-full rounded-full bg-[var(--c-hover-strong)]">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${sectionBarColor(score)}`}
              style={{ width: `${Math.min(100, score ?? 0)}%` }}
            />
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className={`font-mono text-sm font-bold w-8 text-right ${sectionNumColor(score)}`}>
            {score != null ? score.toFixed(0) : '—'}
          </span>
          <span className="text-[var(--c-text-faint)] text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>
      {open && (
        <div className="border-t border-[var(--c-border)] px-4 py-3 space-y-2">
          <p className="text-[10px] text-[var(--c-text-dimmed)] mb-2">{meta.desc}</p>
          {meta.metrics.map(m => (
            <div key={m.key} className="flex items-center justify-between">
              <span className="text-xs text-[var(--c-text-muted)]">{m.label}</span>
              <span className="text-xs font-mono text-[var(--c-text-primary)]">{m.fmt(ctx[m.key])}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DynamicContext({ ticker }) {
  const [ctx, setCtx]         = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/earnings/ticker-context/${ticker}`)
      .then(setCtx)
      .catch(() => setCtx(null))
      .finally(() => setLoading(false));
  }, [ticker]);

  if (loading) {
    return <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-card)] h-32 animate-pulse" />;
  }
  if (!ctx || !ctx.has_dynamic_data) return null;

  const metCount = ctx.override_details
    ? Object.values(ctx.override_details).filter(Boolean).length
    : 0;

  const assessmentBorder = ctx.momentum_override
    ? 'border-emerald-500/40 bg-emerald-500/10'
    : metCount >= 3
      ? 'border-amber-500/30 bg-amber-500/10'
      : 'border-[var(--c-border)] bg-[var(--c-bg-card)]';

  return (
    <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-card)] p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">
          Dynamic Context
        </h2>
        {ctx.compute_date && (
          <span className="text-[10px] text-[var(--c-text-faint)]">as of {ctx.compute_date}</span>
        )}
      </div>

      {/* Overall assessment */}
      <div className={`rounded-2xl border px-4 py-3 ${assessmentBorder}`}>
        {ctx.momentum_override && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--c-emerald)] mb-1.5">
            ⚡ Momentum Override Active
          </p>
        )}
        <p className="text-sm text-[var(--c-text-secondary)] leading-relaxed">{ctx.overall_assessment}</p>
      </div>

      {/* Momentum Override criteria */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-[var(--c-text-faint)] mb-2">
          Override Criteria — {metCount}/6 met
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {Object.entries(OVERRIDE_LABELS).map(([k, label]) => {
            const met = ctx.override_details?.[k];
            return (
              <div
                key={k}
                className={`rounded-xl border px-2.5 py-1.5 text-[10px] font-medium flex items-center gap-1.5 ${
                  met
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-[var(--c-emerald-strong)]'
                    : 'border-[var(--c-border)] bg-[var(--c-hover)] text-[var(--c-text-dimmed)]'
                }`}
              >
                <span>{met ? '✓' : '○'}</span>
                <span>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Outside indicators */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-[var(--c-text-faint)] mb-2">
          Outside Indicators
        </p>
        <div className="flex gap-2 flex-wrap">
          <Tooltip text="Average Directional Index — measures trend strength regardless of direction. Above 25 = strong trend in place. Computed using 14-period Wilder smoothing on daily OHLC.">
            <div className={`rounded-xl border px-3 py-1.5 text-xs font-mono font-semibold cursor-default ${pillCls(ctx.adx, 25)}`}>
              ADX {ctx.adx != null ? ctx.adx.toFixed(1) : '—'}
            </div>
          </Tooltip>
          <Tooltip text="Relative Volume — 5-day average volume vs. prior 20-day baseline. Above 1.5× signals above-average accumulation or smart money positioning.">
            <div className={`rounded-xl border px-3 py-1.5 text-xs font-mono font-semibold cursor-default ${pillCls(ctx.rvol_5d, 1.5)}`}>
              RVOL {ctx.rvol_5d != null ? `${ctx.rvol_5d.toFixed(2)}x` : '—'}
            </div>
          </Tooltip>
          <Tooltip text="Rate of Change (10-day) — percentage price move over the last 10 trading days. Above +5% signals strong short-term price momentum into earnings.">
            <div className={`rounded-xl border px-3 py-1.5 text-xs font-mono font-semibold cursor-default ${pillCls(ctx.roc_10d, 5)}`}>
              ROC 10d {ctx.roc_10d != null ? `${ctx.roc_10d >= 0 ? '+' : ''}${ctx.roc_10d.toFixed(1)}%` : '—'}
            </div>
          </Tooltip>
        </div>
      </div>

      {/* 5 section panels */}
      <div className="space-y-2">
        {SECTION_META.map((meta, i) => (
          <SectionPanel key={meta.key} meta={meta} ctx={ctx} defaultOpen={i === 0} />
        ))}
      </div>
    </div>
  );
}


// ── Main page ──────────────────────────────────────────────────────────────────

export default function PreEarningsTicker() {
  const { ticker }       = useParams();
  const navigate         = useNavigate();
  const location         = useLocation();
  const [searchParams]   = useSearchParams();
  const earningsDate     = searchParams.get('earningsDate');   // set when viewing a snapshot
  const isSnapshot       = !!earningsDate;

  const tickerList = location.state?.tickers ?? [];
  const listIdx    = tickerList.indexOf(ticker);
  const prevTicker = listIdx > 0 ? tickerList[listIdx - 1] : null;
  const nextTicker = listIdx >= 0 && listIdx < tickerList.length - 1 ? tickerList[listIdx + 1] : null;

  const [details,   setDetails]   = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const url = earningsDate
      ? `/earnings/signals/${ticker}?earnings_date=${earningsDate}`
      : `/earnings/signals/${ticker}`;
    apiFetch(url)
      .then((data) => { setDetails(data); setActiveIdx(0); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [ticker, earningsDate]);

  const signal = details[activeIdx];
  const cfg    = signal ? (GRADE_CONFIG[signal.grade] ?? GRADE_CONFIG['D']) : null;

  return (
    <div className="mx-auto max-w-4xl p-3 sm:p-4 lg:p-8">

      <div className="mb-5 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-[var(--c-text-muted)] hover:text-[var(--c-text-primary)] transition-colors"
        >
          ← Back
        </button>
        {tickerList.length > 0 && listIdx >= 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => prevTicker && navigate(`/earnings/${prevTicker}`, { state: { tickers: tickerList } })}
              disabled={!prevTicker}
              className={`text-sm transition-colors ${prevTicker ? 'text-[var(--c-text-muted)] hover:text-[var(--c-text-primary)]' : 'text-[var(--c-text-faint)] cursor-not-allowed'}`}
            >
              ← Prev
            </button>
            <span className="text-xs font-mono text-[var(--c-text-dimmed)]">
              {listIdx + 1} / {tickerList.length}
            </span>
            <button
              onClick={() => nextTicker && navigate(`/earnings/${nextTicker}`, { state: { tickers: tickerList } })}
              disabled={!nextTicker}
              className={`text-sm transition-colors ${nextTicker ? 'text-[var(--c-text-muted)] hover:text-[var(--c-text-primary)]' : 'text-[var(--c-text-faint)] cursor-not-allowed'}`}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {!isSnapshot && (
        <PageGuide
          guideKey="ticker-detail"
          accent="violet"
          title="Full research report — review before placing any trade."
          description="This is the complete breakdown of why this stock made the list and how strong the current conditions are."
          steps={[
            { text: 'The grade and score at the top reflect the overall strength of this setup. Hover any metric card for a plain-language explanation of what it measures.', targetId: 'pg-ticker-header' },
            { text: 'The key metric cards show live market conditions. Green values mean favorable conditions right now. If most are green, the setup is aligned.', targetId: 'pg-key-metrics' },
            { text: 'The context section at the bottom gives you a multi-dimensional view of the setup. ⚡ means all key conditions are firing at once — the strongest signal the system can show.', targetId: 'pg-dynamic-context' },
          ]}
        />
      )}

      {isSnapshot && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <span className="text-[var(--c-amber-strong)]">🗂</span>
          <div>
            <p className="text-sm font-semibold text-[var(--c-amber)]">Historical Snapshot</p>
            <p className="text-xs text-[var(--c-amber-strong)]/70">Signal metrics as scored for the {earningsDate} earnings period. Live options data not shown.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 py-4 text-sm text-[var(--c-rose-strong)]">{error}</div>
      )}

      {/* Model tabs */}
      {details.length > 1 && (
        <div className="mb-4 flex gap-2">
          {details.map((d, i) => (
            <button
              key={d.model_type}
              onClick={() => setActiveIdx(i)}
              className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition-all ${
                i === activeIdx
                  ? 'border-violet-500/40 bg-violet-500/15 text-[var(--c-violet)]'
                  : 'border-[var(--c-border)] text-[var(--c-text-muted)] hover:text-[var(--c-text-primary)]'
              }`}
            >
              {d.model_type}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`animate-pulse rounded-3xl bg-[var(--c-hover)] ${i === 0 ? 'h-40' : i < 3 ? 'h-20' : 'h-56'}`} />
          ))}
        </div>
      ) : signal ? (
        <div className="space-y-5">

          {/* Ticker header */}
          <div id="pg-ticker-header" className={`rounded-3xl border bg-gradient-to-br from-[#0b1420] to-[#08111c] p-6 ${cfg.border}`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h1 className="text-4xl font-black text-[var(--c-text-primary)]">{signal.ticker}</h1>
                  <GradeBadge grade={signal.grade} />
                  <ModelBadge model={signal.model_type} />
                </div>
                {signal.company_name && (
                  <p className="text-base font-semibold text-[var(--c-text-secondary)] mb-0.5">{signal.company_name}</p>
                )}
                <p className="text-sm text-[var(--c-text-dimmed)]">{signal.sector ?? ''}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-4xl font-bold text-[var(--c-text-primary)]">{signal.score.toFixed(1)}</p>
                <p className="text-xs text-[var(--c-text-dimmed)]">out of 82 pts</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-[var(--c-border-subtle)] pt-4 sm:grid-cols-4">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-[var(--c-text-dimmed)]">Earnings</p>
                <p className="mt-1 text-sm font-semibold text-[var(--c-text-primary)]">{signal.earnings_date}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-[var(--c-text-dimmed)]">Quarter</p>
                <p className="mt-1 text-sm font-semibold text-[var(--c-text-primary)]">{signal.earnings_quarter}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-[var(--c-text-dimmed)]">Days Until</p>
                <p className={`mt-1 text-sm font-semibold ${(signal.days_to_earnings ?? 99) <= 5 ? 'text-[var(--c-amber-strong)]' : 'text-[var(--c-text-primary)]'}`}>
                  {signal.days_to_earnings != null ? `${signal.days_to_earnings} days` : '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-[var(--c-text-dimmed)]">Entry Date</p>
                <p className="mt-1 text-sm font-semibold text-[var(--c-text-primary)]">{signal.entry_date ?? '—'}</p>
              </div>
            </div>
          </div>

          {/* Actual Outcome — shown at top when data is available */}
          {signal.outcome !== 'PENDING' && signal.actual_runup_pct != null && (
            <div className={`rounded-3xl border p-6 ${
              signal.actual_runup_pct >= 0
                ? 'border-emerald-500/30 bg-emerald-500/10'
                : 'border-rose-500/30 bg-rose-500/10'
            }`}>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--c-text-muted)]">Actual Outcome</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
                {/* Standard exit — Day -1 */}
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] uppercase tracking-wide text-[var(--c-text-dimmed)]">Standard Exit (Day −1)</p>
                  <p className={`text-3xl font-black font-mono ${signal.actual_runup_pct >= 0 ? 'text-[var(--c-emerald)]' : 'text-[var(--c-rose)]'}`}>
                    {signal.actual_runup_pct >= 0 ? '+' : ''}{signal.actual_runup_pct.toFixed(2)}%
                  </p>
                  <p className="text-xs text-[var(--c-text-muted)]">
                    ${signal.entry_price?.toFixed(2)} → ${signal.exit_price?.toFixed(2)}
                  </p>
                  <p className={`text-sm font-bold ${signal.outcome === 'WIN' ? 'text-[var(--c-emerald)]' : 'text-[var(--c-rose)]'}`}>
                    {signal.outcome}
                  </p>
                </div>
                {/* Aggressive exit — Pre-Earnings High */}
                {signal.pre_earn_high_pct != null && (
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] uppercase tracking-wide text-[var(--c-text-dimmed)]">Aggressive Exit (Pre-Earn Hi)</p>
                    <p className={`text-3xl font-black font-mono ${signal.pre_earn_high_pct >= 0 ? 'text-[var(--c-emerald)]' : 'text-[var(--c-rose)]'}`}>
                      {signal.pre_earn_high_pct >= 0 ? '+' : ''}{signal.pre_earn_high_pct.toFixed(2)}%
                    </p>
                    <p className="text-xs text-[var(--c-text-muted)]">
                      ${signal.entry_price?.toFixed(2)} → ${signal.pre_earn_high?.toFixed(2)}
                    </p>
                    <p className="text-sm font-bold text-[var(--c-text-muted)]">PEAK</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Technicals row */}
          <div id="pg-key-metrics" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KeyMetric label="RS vs SPY" value={signal.rs_spy_pct} signed pct
              tooltip="Relative Strength vs SPY — how much this stock has outperformed the S&P 500 over the prior 20 trading days. Positive = outperforming the market." />
            <KeyMetric label="AVWAP"     value={signal.avwap_pct}  signed pct
              tooltip="Anchored VWAP — how far price is trading above (or below) the volume-weighted average price anchored to the last earnings date. Above 0% = trading above institutional cost basis." />
            <KeyMetric label="RSI"       value={signal.rsi}
              tooltip="Relative Strength Index (14-period) — momentum oscillator. Readings 40–70 are ideal for pre-earnings entries: not oversold, not overbought. Above 70 may signal near-term exhaustion." />
            <KeyMetric label="EPS Accel" value={signal.eps_accel}  signed pct
              tooltip="EPS Acceleration — change in earnings-per-share growth rate vs. the prior quarter (in percentage points). Positive = earnings are accelerating, a key catalyst for pre-earnings runs." />
          </div>

          {/* Options / Dealer row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KeyMetric label="Exp Move %"  value={signal.expected_move_pct} pct
              tooltip="Expected Move % — the options market's implied one-standard-deviation move by expiration, expressed as a percentage of current spot price. Derived from near-term straddle pricing." />
            <KeyMetric label="Exp Move $"  value={signal.expected_move_usd} prefix="$"
              tooltip="Expected Move $ — the options market's implied one-standard-deviation move in dollar terms. Useful for sizing positions relative to the anticipated range."
              subtitle={signal.spot_price != null && signal.expected_move_usd != null
                ? `$${(signal.spot_price - signal.expected_move_usd).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} – $${(signal.spot_price + signal.expected_move_usd).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                : null} />
            <KeyMetric label="IV"          value={signal.iv}                pct
              tooltip="Implied Volatility — the market's forward-looking volatility expectation priced into options. Elevated IV increases option premiums and expected move size ahead of earnings." />
            <KeyMetric label="Spot Price"  value={signal.spot_price}        prefix="$"
              tooltip="Spot Price — the current market price of the underlying stock at the time this signal was scored." />
          </div>

          {/* Last 8 quarters */}
          <QuarterlyReturns quarters={signal.quarterly_returns} />

          {/* Monthly returns grid */}
          <MonthlyReturns monthly={signal.monthly_returns} />

          {/* Score breakdown */}
          <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-card)] p-6">
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">Score Breakdown</h2>
            <div className="divide-y divide-white/5">
              {METRICS.map((m) => (
                <MetricBar
                  key={m.key}
                  label={m.label}
                  score={signal.metrics?.[m.key]}
                  max={m.max}
                  rawValue={m.fmt(signal.metrics?.[m.rawKey])}
                />
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[var(--c-border)] pt-4">
              <span className="text-sm font-semibold text-[var(--c-text-muted)]">Total Raw Score</span>
              <span className="font-mono text-lg font-bold text-[var(--c-text-primary)]">
                {signal.raw_score?.toFixed(1)} / 82
              </span>
            </div>
          </div>

          {/* Dynamic Context */}
          {!isSnapshot && <div id="pg-dynamic-context"><DynamicContext ticker={ticker} /></div>}

        </div>
      ) : null}
    </div>
  );
}
