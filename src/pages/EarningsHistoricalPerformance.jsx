import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { GRADE_CONFIG, MODEL_CONFIG } from '../data/earningsConfig';

const GRADE_ORDER = { 'A+': 0, A: 1, B: 2, C: 3, D: 4 };
const GRADES      = ['A+', 'A', 'B', 'C', 'D'];

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtPct(v) {
  if (v == null) return '—';
  return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;
}

function fmtPrice(v) {
  if (v == null) return '—';
  return `$${v.toFixed(2)}`;
}

function fmtDate(d) {
  if (!d) return '—';
  try {
    const [y, m, day] = d.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[parseInt(m, 10) - 1]} ${parseInt(day, 10)}, '${y.slice(2)}`;
  } catch {
    return d;
  }
}

// ── Badges ────────────────────────────────────────────────────────────────────

function GradeBadge({ grade }) {
  const cfg = GRADE_CONFIG[grade] ?? GRADE_CONFIG['D'];
  return (
    <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-bold ${cfg.badge}`}>
      {grade}
    </span>
  );
}

function ModelBadge({ model }) {
  const cls = MODEL_CONFIG[model] ?? MODEL_CONFIG.Recovery;
  return (
    <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {model}
    </span>
  );
}

function OutcomeBadge({ outcome }) {
  const cls =
    outcome === 'WIN'
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      : outcome === 'LOSS'
      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
      : outcome === 'PENDING'
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      : 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  return (
    <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-bold ${cls}`}>
      {outcome}
    </span>
  );
}

// A signal is "display pending" when price data hasn't been fetched yet
function displayOutcome(row) {
  return row.pre_earn_high == null ? 'PENDING' : row.outcome;
}

function PctCell({ value }) {
  const color =
    value == null ? 'text-slate-500'
    : value > 0   ? 'text-emerald-400'
    : value < 0   ? 'text-rose-400'
    :               'text-slate-400';
  return <span className={`font-mono font-semibold tabular-nums ${color}`}>{fmtPct(value)}</span>;
}

function RanUpCell({ value }) {
  if (value == null) return <span className="text-slate-600">—</span>;
  return value ? (
    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/25">
      ✓ Yes
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/20">
      ✗ No
    </span>
  );
}

// ── Sort helpers ──────────────────────────────────────────────────────────────

function compare(a, b, key, dir) {
  if (key === 'grade') {
    const va = GRADE_ORDER[a.grade] ?? 99;
    const vb = GRADE_ORDER[b.grade] ?? 99;
    return dir === 'asc' ? va - vb : vb - va;
  }
  if (['ticker', 'model_type', 'earnings_date', 'entry_date', 'earnings_quarter', 'outcome'].includes(key)) {
    const va = (a[key] ?? '').toLowerCase();
    const vb = (b[key] ?? '').toLowerCase();
    return dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
  }
  if (key === 'pre_earn_ran_up') {
    const va = a[key] == null ? -1 : a[key] ? 1 : 0;
    const vb = b[key] == null ? -1 : b[key] ? 1 : 0;
    return dir === 'asc' ? va - vb : vb - va;
  }
  const va = a[key] ?? (dir === 'asc' ? Infinity : -Infinity);
  const vb = b[key] ?? (dir === 'asc' ? Infinity : -Infinity);
  return dir === 'asc' ? va - vb : vb - va;
}

// ── Sort header ───────────────────────────────────────────────────────────────

function Th({ label, col, sortKey, sortDir, onSort, className = '' }) {
  const active = sortKey === col;
  return (
    <th
      className={`cursor-pointer select-none whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-300 transition-colors ${className}`}
      onClick={() => onSort(col)}
    >
      {label}
      {active && <span className="ml-1 text-cyan-400">{sortDir === 'asc' ? '↑' : '↓'}</span>}
    </th>
  );
}

// ── Summary strip ─────────────────────────────────────────────────────────────

function SummaryStrip({ data }) {
  const total   = data.length;
  const wins    = data.filter(r => displayOutcome(r) === 'WIN').length;
  const losses  = data.filter(r => displayOutcome(r) === 'LOSS').length;
  const pending = data.filter(r => displayOutcome(r) === 'PENDING').length;
  const resolved = wins + losses;
  const winRate = resolved > 0 ? Math.round((wins / resolved) * 100) : null;
  const ranUp   = data.filter(r => r.pre_earn_ran_up === true).length;

  const avgPostPct = (() => {
    const valid = data.filter(r => r.post10_pct != null);
    if (!valid.length) return null;
    return valid.reduce((s, r) => s + r.post10_pct, 0) / valid.length;
  })();

  const avgHighPct = (() => {
    const valid = data.filter(r => r.pre_earn_high_pct != null);
    if (!valid.length) return null;
    return valid.reduce((s, r) => s + r.pre_earn_high_pct, 0) / valid.length;
  })();

  const stat = (label, value, color = 'text-white') => (
    <div className="flex flex-col items-center gap-0.5 px-4">
      <span className="text-[10px] uppercase tracking-widest text-slate-500">{label}</span>
      <span className={`text-lg font-bold ${color}`}>{value ?? '—'}</span>
    </div>
  );

  return (
    <div className="flex flex-wrap items-center gap-x-0 divide-x divide-white/10 rounded-2xl border border-white/10 bg-[#0b1420] py-3">
      {stat('Signals', total)}
      {stat('Wins', wins, 'text-emerald-400')}
      {stat('Losses', losses, 'text-rose-400')}
      {stat('Pending', pending, 'text-amber-400')}
      {stat('Win Rate', winRate != null ? `${winRate}%` : null, winRate == null ? 'text-white' : winRate >= 50 ? 'text-emerald-400' : 'text-rose-400')}
      {stat('Pre-Earn Ran Up', ranUp)}
      {stat('Avg Pre-Earn Hi%', avgHighPct != null ? fmtPct(avgHighPct) : null,
        avgHighPct == null ? 'text-white' : avgHighPct > 0 ? 'text-emerald-400' : 'text-rose-400')}
      {stat('Avg 10D Post%', avgPostPct != null ? fmtPct(avgPostPct) : null,
        avgPostPct == null ? 'text-white' : avgPostPct > 0 ? 'text-emerald-400' : 'text-rose-400')}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function EarningsHistoricalPerformance() {
  const navigate = useNavigate();
  const [data,      setData]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [model,     setModel]     = useState('Both');
  const [gradeFilter, setGradeFilter] = useState([]);
  const [tickerQ,   setTickerQ]   = useState('');
  const [sortKey,   setSortKey]   = useState('earnings_date');
  const [sortDir,   setSortDir]   = useState('desc');
  const [ranUpOnly, setRanUpOnly] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiFetch(`/earnings/historical?model=${model}`)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [model]);

  const filtered = useMemo(() => {
    // Deduplicate by ticker: prefer Recovery; if same model keep highest score
    const seen = new Map();
    for (const r of data) {
      const key = `${r.ticker}__${r.earnings_date}`;
      const existing = seen.get(key);
      if (!existing) { seen.set(key, r); continue; }
      const prefer = (r.model_type === 'Recovery' && existing.model_type !== 'Recovery')
        || (r.model_type === existing.model_type && r.score > existing.score);
      if (prefer) seen.set(key, r);
    }
    let rows = Array.from(seen.values());
    if (gradeFilter.length > 0) rows = rows.filter(r => gradeFilter.includes(r.grade));
    if (tickerQ.trim())          rows = rows.filter(r => r.ticker.toUpperCase().includes(tickerQ.trim().toUpperCase()));
    if (ranUpOnly)               rows = rows.filter(r => r.pre_earn_ran_up === true);
    return [...rows].sort((a, b) => compare(a, b, sortKey, sortDir));
  }, [data, gradeFilter, tickerQ, ranUpOnly, sortKey, sortDir]);

  function toggleSort(col) {
    if (sortKey === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(col); setSortDir('desc'); }
  }

  function toggleGrade(g) {
    setGradeFilter(prev =>
      prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
    );
  }

  const thProps = { sortKey, sortDir, onSort: toggleSort };

  return (
    <div className="min-h-screen bg-[#060e18] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-screen-2xl">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Historical Performance</h1>
          <p className="mt-1 text-sm text-slate-500">Pre-Earnings Runners — completed signals with price outcomes</p>
        </div>

        {/* Controls */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          {/* Model */}
          <div className="flex rounded-xl border border-white/10 bg-[#0b1420] p-0.5">
            {['Both', 'Recovery', 'Momentum'].map(m => (
              <button
                key={m}
                onClick={() => setModel(m)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  model === m
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Grade filter */}
          <div className="flex gap-1">
            {GRADES.map(g => {
              const cfg = GRADE_CONFIG[g];
              const active = gradeFilter.includes(g);
              return (
                <button
                  key={g}
                  onClick={() => toggleGrade(g)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition-all ${
                    active ? cfg.badge : 'border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300'
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>

          {/* Ticker search */}
          <input
            type="text"
            placeholder="Ticker…"
            value={tickerQ}
            onChange={e => setTickerQ(e.target.value)}
            className="w-28 rounded-xl border border-white/10 bg-[#0b1420] px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:border-cyan-500/50 focus:outline-none"
          />

          {/* Ran-up filter */}
          <button
            onClick={() => setRanUpOnly(v => !v)}
            className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
              ranUpOnly
                ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300'
                : 'border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            Pre-Earn Ran Up
          </button>

          <span className="ml-auto text-xs text-slate-600">{filtered.length} signals</span>
        </div>

        {/* Summary */}
        {!loading && !error && filtered.length > 0 && (
          <div className="mb-5">
            <SummaryStrip data={filtered} />
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 py-4 text-sm text-rose-300">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#0b1420] px-6 py-12 text-center text-sm text-slate-500">
            No historical signals found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-[#0b1420]">
                  <Th col="ticker"          label="Ticker"       {...thProps} />
                  <Th col="grade"           label="Grade"        {...thProps} />
                  <Th col="model_type"      label="Model"        {...thProps} />
                  <Th col="score"           label="Score"        {...thProps} />
                  <Th col="earnings_date"   label="Earn Date"    {...thProps} />
                  <Th col="entry_date"      label="Entry Date"   {...thProps} />
                  <Th col="entry_price"     label="Entry $"      {...thProps} />
                  <Th col="exit_price"      label="Exit $"       {...thProps} className="border-l border-white/5" />
                  <Th col="actual_runup_pct" label="Exit %"      {...thProps} />
                  <Th col="pre_earn_high"   label="Pre-Earn Hi"  {...thProps} className="border-l border-white/5" />
                  <Th col="pre_earn_high_date" label="Hi Date"   {...thProps} />
                  <Th col="pre_earn_high_pct"  label="Hi %"      {...thProps} />
                  <Th col="pre_earn_ran_up" label="Ran Up?"      {...thProps} />
                  <Th col="earn_day_price"  label="Earn Day $"   {...thProps} className="border-l border-white/5" />
                  <Th col="earn_day_pct"    label="Earn Day %"   {...thProps} />
                  <Th col="post10_price"    label="10D Post $"   {...thProps} className="border-l border-white/5" />
                  <Th col="post10_date"     label="10D Date"     {...thProps} />
                  <Th col="post10_pct"      label="10D Post %"   {...thProps} />
                  <Th col="outcome"         label="Outcome"      {...thProps} className="border-l border-white/5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr
                    key={`${row.ticker}-${row.earnings_date}-${row.model_type}`}
                    className={`border-b border-white/5 transition-colors hover:bg-white/[0.03] ${
                      i % 2 === 0 ? 'bg-[#060e18]' : 'bg-[#080f1a]'
                    }`}
                  >
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => navigate(`/earnings/${row.ticker}?earningsDate=${row.earnings_date}`)}
                        className="font-bold text-white hover:text-cyan-300 transition-colors underline-offset-2 hover:underline"
                      >
                        {row.ticker}
                      </button>
                    </td>
                    <td className="px-3 py-2.5"><GradeBadge grade={row.grade} /></td>
                    <td className="px-3 py-2.5"><ModelBadge model={row.model_type} /></td>
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-300 tabular-nums">{row.score.toFixed(1)}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-300">{fmtDate(row.earnings_date)}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-400">{fmtDate(row.entry_date)}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-300 tabular-nums">{fmtPrice(row.entry_price)}</td>

                    {/* Standard exit block */}
                    <td className="border-l border-white/5 px-3 py-2.5 font-mono text-xs text-slate-300 tabular-nums">
                      {fmtPrice(row.exit_price)}
                    </td>
                    <td className="px-3 py-2.5"><PctCell value={row.actual_runup_pct} /></td>

                    {/* Pre-earnings high block */}
                    <td className="border-l border-white/5 px-3 py-2.5 font-mono text-xs text-slate-300 tabular-nums">
                      {fmtPrice(row.pre_earn_high)}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-400">{fmtDate(row.pre_earn_high_date)}</td>
                    <td className="px-3 py-2.5"><PctCell value={row.pre_earn_high_pct} /></td>
                    <td className="px-3 py-2.5"><RanUpCell value={row.pre_earn_ran_up} /></td>

                    {/* Earnings day block */}
                    <td className="border-l border-white/5 px-3 py-2.5 font-mono text-xs text-slate-300 tabular-nums">
                      {fmtPrice(row.earn_day_price)}
                    </td>
                    <td className="px-3 py-2.5"><PctCell value={row.earn_day_pct} /></td>

                    {/* 10-day post block */}
                    <td className="border-l border-white/5 px-3 py-2.5 font-mono text-xs text-slate-300 tabular-nums">
                      {fmtPrice(row.post10_price)}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-400">{fmtDate(row.post10_date)}</td>
                    <td className="px-3 py-2.5"><PctCell value={row.post10_pct} /></td>

                    {/* Outcome */}
                    <td className="border-l border-white/5 px-3 py-2.5">
                      <OutcomeBadge outcome={displayOutcome(row)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
