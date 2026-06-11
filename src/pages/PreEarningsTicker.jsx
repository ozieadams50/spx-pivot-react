import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { GRADE_CONFIG, MODEL_CONFIG, METRICS } from '../data/earningsConfig';

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
        <span className="text-xs text-slate-400 truncate">{label}</span>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-mono text-slate-500 w-24 text-right truncate">{rawValue}</span>
          <span className="text-xs font-mono text-white w-14 text-right">
            {(score ?? 0).toFixed(1)} / {max}
          </span>
        </div>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/10">
        <div className={`h-1.5 rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function KeyMetric({ label, value, signed = false, pct = false, prefix = '' }) {
  const color =
    value == null        ? 'text-slate-600'
    : signed && value > 0 ? 'text-emerald-400'
    : signed && value < 0 ? 'text-rose-400'
    :                        'text-white';
  const display = value == null
    ? '—'
    : `${prefix}${signed && value > 0 ? '+' : ''}${value.toFixed(1)}${pct ? '%' : ''}`;
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b1420] p-4 text-center">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-xl font-bold font-mono ${color}`}>{display}</p>
    </div>
  );
}

// ── Last 8 Quarters ────────────────────────────────────────────────────────────

function QuarterlyReturns({ quarters }) {
  if (!quarters || quarters.length === 0) return null;
  return (
    <div className="rounded-3xl border border-white/10 bg-[#0b1420] p-6">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
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
                : 'border-white/5 bg-white/5'
              }`}
            >
              <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-500 text-center leading-tight">
                {q.earnings_quarter}
              </p>
              <p className={`text-lg font-black font-mono leading-none ${
                isPos ? 'text-emerald-400' : isNeg ? 'text-rose-400' : 'text-slate-600'
              }`}>
                {pct != null ? `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%` : '—'}
              </p>
              {q.entry_price && q.exit_price && (
                <>
                  <p className={`text-xs font-semibold font-mono ${
                    isPos ? 'text-emerald-400' : isNeg ? 'text-rose-400' : 'text-slate-500'
                  }`}>
                    {q.exit_price - q.entry_price >= 0 ? '+' : ''}${(q.exit_price - q.entry_price).toFixed(2)}
                  </p>
                  <p className="text-[9px] text-slate-400 text-center">
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
  if (pct >=  5)   return 'bg-emerald-500 text-white';
  if (pct >=  2)   return 'bg-emerald-600/80 text-white';
  if (pct >=  0)   return 'bg-emerald-900/70 text-emerald-300';
  if (pct >= -2)   return 'bg-rose-900/70 text-rose-300';
  if (pct >= -5)   return 'bg-rose-600/80 text-white';
  return                  'bg-rose-500 text-white';
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
    <div className="rounded-3xl border border-white/10 bg-[#0b1420] p-6">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">Monthly Returns</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-separate border-spacing-[3px]">
          <thead>
            <tr>
              <th className="w-10 text-left text-slate-500 pb-1.5"></th>
              {MONTH_NAMES.map((m) => (
                <th key={m} className="min-w-[40px] text-center font-semibold text-slate-500 pb-1.5">{m}</th>
              ))}
              <th className="min-w-[48px] text-center font-semibold text-slate-500 pb-1.5">Year</th>
            </tr>
          </thead>
          <tbody>
            {years.map((year) => {
              const annual = annualReturn(year);
              return (
                <tr key={year}>
                  <td className="pr-2 font-semibold text-slate-500">{year}</td>
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

// ── Main page ──────────────────────────────────────────────────────────────────

export default function PreEarningsTicker() {
  const { ticker }       = useParams();
  const navigate         = useNavigate();
  const [searchParams]   = useSearchParams();
  const earningsDate     = searchParams.get('earningsDate');   // set when viewing a snapshot
  const isSnapshot       = !!earningsDate;

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

      <button
        onClick={() => navigate(-1)}
        className="mb-5 flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
      >
        ← Back
      </button>

      {isSnapshot && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <span className="text-amber-400">🗂</span>
          <div>
            <p className="text-sm font-semibold text-amber-300">Historical Snapshot</p>
            <p className="text-xs text-amber-400/70">Signal metrics as scored for the {earningsDate} earnings period. Live options data not shown.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 py-4 text-sm text-rose-300">{error}</div>
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
                  ? 'border-violet-500/40 bg-violet-500/15 text-violet-300'
                  : 'border-white/10 text-slate-400 hover:text-white'
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
            <div key={i} className={`animate-pulse rounded-3xl bg-white/5 ${i === 0 ? 'h-40' : i < 3 ? 'h-20' : 'h-56'}`} />
          ))}
        </div>
      ) : signal ? (
        <div className="space-y-5">

          {/* Ticker header */}
          <div className={`rounded-3xl border bg-gradient-to-br from-[#0b1420] to-[#08111c] p-6 ${cfg.border}`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h1 className="text-4xl font-black text-white">{signal.ticker}</h1>
                  <GradeBadge grade={signal.grade} />
                  <ModelBadge model={signal.model_type} />
                </div>
                <p className="text-sm text-slate-500">{signal.sector ?? ''}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-4xl font-bold text-white">{signal.score.toFixed(1)}</p>
                <p className="text-xs text-slate-500">out of 82 pts</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-white/5 pt-4 sm:grid-cols-4">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Earnings</p>
                <p className="mt-1 text-sm font-semibold text-white">{signal.earnings_date}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Quarter</p>
                <p className="mt-1 text-sm font-semibold text-white">{signal.earnings_quarter}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Days Until</p>
                <p className={`mt-1 text-sm font-semibold ${(signal.days_to_earnings ?? 99) <= 5 ? 'text-amber-400' : 'text-white'}`}>
                  {signal.days_to_earnings != null ? `${signal.days_to_earnings} days` : '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Entry Date</p>
                <p className="mt-1 text-sm font-semibold text-white">{signal.entry_date ?? '—'}</p>
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
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">Actual Outcome</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
                {/* Standard exit — Day -1 */}
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">Standard Exit (Day −1)</p>
                  <p className={`text-3xl font-black font-mono ${signal.actual_runup_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {signal.actual_runup_pct >= 0 ? '+' : ''}{signal.actual_runup_pct.toFixed(2)}%
                  </p>
                  <p className="text-xs text-slate-400">
                    ${signal.entry_price?.toFixed(2)} → ${signal.exit_price?.toFixed(2)}
                  </p>
                  <p className={`text-sm font-bold ${signal.outcome === 'WIN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {signal.outcome}
                  </p>
                </div>
                {/* Aggressive exit — Pre-Earnings High */}
                {signal.pre_earn_high_pct != null && (
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">Aggressive Exit (Pre-Earn Hi)</p>
                    <p className={`text-3xl font-black font-mono ${signal.pre_earn_high_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {signal.pre_earn_high_pct >= 0 ? '+' : ''}{signal.pre_earn_high_pct.toFixed(2)}%
                    </p>
                    <p className="text-xs text-slate-400">
                      ${signal.entry_price?.toFixed(2)} → ${signal.pre_earn_high?.toFixed(2)}
                    </p>
                    <p className="text-sm font-bold text-slate-400">PEAK</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Technicals row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KeyMetric label="RS vs SPY" value={signal.rs_spy_pct} signed pct />
            <KeyMetric label="AVWAP"     value={signal.avwap_pct}  signed pct />
            <KeyMetric label="RSI"       value={signal.rsi} />
            <KeyMetric label="EPS Accel" value={signal.eps_accel}  signed pct />
          </div>

          {/* Options / Dealer row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KeyMetric label="Exp Move %"  value={signal.expected_move_pct} pct />
            <KeyMetric label="Exp Move $"  value={signal.expected_move_usd} prefix="$" />
            <KeyMetric label="IV"          value={signal.iv}                pct />
            <KeyMetric label="Spot Price"  value={signal.spot_price}        prefix="$" />
          </div>

          {/* Last 8 quarters */}
          <QuarterlyReturns quarters={signal.quarterly_returns} />

          {/* Monthly returns grid */}
          <MonthlyReturns monthly={signal.monthly_returns} />

          {/* Score breakdown */}
          <div className="rounded-3xl border border-white/10 bg-[#0b1420] p-6">
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">Score Breakdown</h2>
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
            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
              <span className="text-sm font-semibold text-slate-400">Total Raw Score</span>
              <span className="font-mono text-lg font-bold text-white">
                {signal.raw_score?.toFixed(1)} / 82
              </span>
            </div>
          </div>


        </div>
      ) : null}
    </div>
  );
}
