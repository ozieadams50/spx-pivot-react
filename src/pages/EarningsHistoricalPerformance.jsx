import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { GRADE_CONFIG, MODEL_CONFIG, gradeToStars, STAR_GRADES } from '../data/earningsConfig';
import { useAuth } from '../context/AuthContext';
import PageGuide from '../components/PageGuide';

const GRADE_ORDER = { 'A+': 0, A: 1, B: 2, C: 3, D: 4 };
const GRADES      = STAR_GRADES;

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
  const { label } = gradeToStars(grade);
  return (
    <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-bold ${cfg.badge}`}>
      {label}
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
      ? 'bg-emerald-500/20 text-[var(--c-emerald-strong)] border-emerald-500/30'
      : outcome === 'LOSS'
      ? 'bg-rose-500/20 text-[var(--c-rose-strong)] border-rose-500/30'
      : outcome === 'PENDING'
      ? 'bg-amber-500/20 text-[var(--c-amber)] border-amber-500/30'
      : 'bg-slate-500/20 text-[var(--c-text-muted)] border-slate-500/30';
  return (
    <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-bold ${cls}`}>
      {outcome}
    </span>
  );
}

function displayOutcome(row) {
  if (row.pre_earn_high == null) return 'PENDING';
  return row.outcome;
}

function PctCell({ value }) {
  const color =
    value == null ? 'text-[var(--c-text-dimmed)]'
    : value > 0   ? 'text-[var(--c-emerald)]'
    : value < 0   ? 'text-[var(--c-rose)]'
    :               'text-[var(--c-text-muted)]';
  return <span className={`font-mono font-semibold tabular-nums ${color}`}>{fmtPct(value)}</span>;
}

function RanUpCell({ value }) {
  if (value == null) return <span className="text-[var(--c-text-faint)]">—</span>;
  return value ? (
    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-[var(--c-emerald-strong)] border border-emerald-500/25">
      ✓ Yes
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-[var(--c-rose)] border border-rose-500/20">
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
      className={`cursor-pointer select-none whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-[var(--c-text-dimmed)] hover:text-[var(--c-text-secondary)] transition-colors ${className}`}
      onClick={() => onSort(col)}
    >
      {label}
      {active && <span className="ml-1 text-[var(--c-cyan-strong)]">{sortDir === 'asc' ? '↑' : '↓'}</span>}
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

  const stat = (label, value, color = 'text-[var(--c-text-primary)]') => (
    <div className="flex flex-col items-center gap-0.5 px-4">
      <span className="text-[10px] uppercase tracking-widest text-[var(--c-text-dimmed)]">{label}</span>
      <span className={`text-lg font-bold ${color}`}>{value ?? '—'}</span>
    </div>
  );

  return (
    <div className="flex flex-wrap items-center gap-x-0 divide-x divide-white/10 rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-card)] py-3">
      {stat('Signals', total)}
      {stat('Wins', wins, 'text-[var(--c-emerald)]')}
      {stat('Losses', losses, 'text-[var(--c-rose)]')}
      {stat('Pending', pending, 'text-[var(--c-amber-strong)]')}
      {stat('Win Rate', winRate != null ? `${winRate}%` : null, winRate == null ? 'text-[var(--c-text-primary)]' : winRate >= 50 ? 'text-[var(--c-emerald)]' : 'text-[var(--c-rose)]')}
      {stat('Pre-Earn Ran Up', ranUp)}
      {stat('Avg Pre-Earn Hi%', avgHighPct != null ? fmtPct(avgHighPct) : null,
        avgHighPct == null ? 'text-[var(--c-text-primary)]' : avgHighPct > 0 ? 'text-[var(--c-emerald)]' : 'text-[var(--c-rose)]')}
      {stat('Avg 10D Post%', avgPostPct != null ? fmtPct(avgPostPct) : null,
        avgPostPct == null ? 'text-[var(--c-text-primary)]' : avgPostPct > 0 ? 'text-[var(--c-emerald)]' : 'text-[var(--c-rose)]')}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const SYSTEM_LAUNCH_DATE = '2026-06-01';

export default function EarningsHistoricalPerformance() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const canShowAll = role === 'admin' || role === 'superuser';

  const [data,         setData]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [model,        setModel]        = useState('Both');
  const [showAll,      setShowAll]      = useState(false);
  const [gradeFilter,  setGradeFilter]  = useState([]);
  const [sectorFilter, setSectorFilter] = useState([]);
  const [tickerQ,      setTickerQ]      = useState('');
  const [sortKey,      setSortKey]      = useState('earnings_date');
  const [sortDir,      setSortDir]      = useState('desc');
  const [ranUpOnly,    setRanUpOnly]    = useState(false);
  const [hotPickSet,   setHotPickSet]   = useState(new Set());

  useEffect(() => {
    setLoading(true);
    setError(null);
    const since = (canShowAll && showAll) ? '' : SYSTEM_LAUNCH_DATE;
    const sinceParam = since ? `&since=${since}` : '&since=';
    apiFetch(`/earnings/historical?model=${model}${sinceParam}`)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [model, showAll, canShowAll]);

  useEffect(() => {
    apiFetch('/earnings/hot-pick-tickers')
      .then(tickers => setHotPickSet(new Set(tickers)))
      .catch(() => {});
  }, []);

  const allSectors = useMemo(
    () => [...new Set(data.map(r => r.sector).filter(Boolean))].sort(),
    [data],
  );

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
    if (gradeFilter.length > 0)  rows = rows.filter(r => gradeFilter.includes(r.grade));
    if (sectorFilter.length > 0) rows = rows.filter(r => sectorFilter.includes(r.sector));
    if (tickerQ.trim())          rows = rows.filter(r => r.ticker.toUpperCase().includes(tickerQ.trim().toUpperCase()));
    if (ranUpOnly)               rows = rows.filter(r => r.pre_earn_ran_up === true);
    return [...rows].sort((a, b) => compare(a, b, sortKey, sortDir));
  }, [data, gradeFilter, sectorFilter, tickerQ, ranUpOnly, sortKey, sortDir]);

  function toggleSort(col) {
    if (sortKey === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(col); setSortDir('desc'); }
  }

  function toggleGrade(g) {
    setGradeFilter(prev =>
      prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
    );
  }

  function toggleSector(s) {
    setSectorFilter(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  }

  const thProps = { sortKey, sortDir, onSort: toggleSort };

  return (
    <div className="min-h-screen bg-[var(--c-bg-page)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-screen-2xl">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--c-text-primary)]">Historical Performance</h1>
            <p className="mt-1 text-sm text-[var(--c-text-dimmed)]">
              Pre-Earnings Runners —{' '}
              {canShowAll && showAll
                ? 'all historical signals'
                : 'signals since system launch (Jun 1, 2026)'}
            </p>
          </div>
          {canShowAll && (
            <button
              onClick={() => setShowAll(v => !v)}
              className={`mt-1 flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition-colors ${
                showAll
                  ? 'border-violet-500/40 bg-violet-500/20 text-[var(--c-violet)]'
                  : 'border-[var(--c-border)] bg-[var(--c-bg-card)] text-[var(--c-text-muted)] hover:text-[var(--c-text-primary)]'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${showAll ? 'bg-violet-400' : 'bg-slate-600'}`} />
              {showAll ? 'All History' : 'System Data Only'}
            </button>
          )}
        </div>

        <PageGuide
          guideKey="historical-performance"
          accent="violet"
          title="The scorecard — see exactly how past signals performed."
          description="Every signal the system has generated is tracked here with the real outcome. Use it to evaluate performance across different star ratings and conditions."
          steps={[
            { text: 'Use the star-rating buttons to narrow results. Higher-rated setups (more stars) have historically produced stronger outcomes.', targetId: 'pg-hist-filters' },
            { text: 'The summary bar shows Win Rate, total signals, and average performance across your filtered results.', targetId: 'pg-hist-summary' },
            { text: 'In the table, review individual signals and their outcomes. Click any row to see the full research page for that signal.', targetId: 'pg-hist-table' },
          ]}
        />

        {/* Controls */}
        <div id="pg-hist-filters" className="mb-5 flex flex-wrap items-center gap-3">
          {/* Model filter removed — API returns best-of automatically */}

          {/* Rating filter */}
          <div className="flex gap-1">
            {GRADES.map(g => {
              const cfg = GRADE_CONFIG[g];
              const active = gradeFilter.includes(g);
              return (
                <button
                  key={g}
                  onClick={() => toggleGrade(g)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition-all ${
                    active ? cfg.badge : 'border-[var(--c-border)] text-[var(--c-text-dimmed)] hover:border-white/20 hover:text-[var(--c-text-secondary)]'
                  }`}
                >
                  {gradeToStars(g).label}
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
            className="w-28 rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-card)] px-3 py-1.5 text-xs text-[var(--c-text-primary)] placeholder-[var(--c-text-faint)] focus:border-cyan-500/50 focus:outline-none"
          />

          {/* Ran-up filter */}
          <button
            onClick={() => setRanUpOnly(v => !v)}
            className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
              ranUpOnly
                ? 'border-emerald-500/30 bg-emerald-500/20 text-[var(--c-emerald-strong)]'
                : 'border-[var(--c-border)] text-[var(--c-text-muted)] hover:text-[var(--c-text-primary)]'
            }`}
          >
            Pre-Earn Ran Up
          </button>

          <span className="ml-auto text-xs text-[var(--c-text-faint)]">{filtered.length} signals</span>
        </div>

        {/* Sector filter */}
        {allSectors.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-[var(--c-text-faint)] mr-1">Sector</span>
            {sectorFilter.length > 0 && (
              <button
                onClick={() => setSectorFilter([])}
                className="rounded-lg border border-[var(--c-border)] px-2 py-0.5 text-[10px] text-[var(--c-text-dimmed)] hover:text-[var(--c-text-secondary)] transition-colors"
              >
                Clear
              </button>
            )}
            {allSectors.map(s => (
              <button
                key={s}
                onClick={() => toggleSector(s)}
                className={`rounded-xl border px-2.5 py-1 text-xs font-medium transition-all ${
                  sectorFilter.includes(s)
                    ? 'border-violet-500/40 bg-violet-500/20 text-[var(--c-violet)]'
                    : 'border-[var(--c-border)] text-[var(--c-text-dimmed)] hover:border-white/20 hover:text-[var(--c-text-secondary)]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Summary */}
        {!loading && !error && filtered.length > 0 && (
          <div id="pg-hist-summary" className="mb-5">
            <SummaryStrip data={filtered} />
          </div>
        )}

        {/* Table */}
        <div id="pg-hist-table">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 py-4 text-sm text-[var(--c-rose-strong)]">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-card)] px-6 py-12 text-center text-sm text-[var(--c-text-dimmed)]">
            No historical signals found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[var(--c-border)]">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--c-border)] bg-[var(--c-bg-card)]">
                  <Th col="ticker"             label="Ticker"        {...thProps} />
                  <th className="px-2 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-[var(--c-text-dimmed)]"></th>
                  <Th col="grade"              label="Rating"        {...thProps} />
                  <Th col="score"              label="Score"         {...thProps} />
                  <Th col="earnings_date"      label="Earn Date"     {...thProps} />
                  <Th col="entry_date"         label="Entry Date"    {...thProps} />
                  <Th col="entry_price"        label="Entry $"       {...thProps} />
                  <Th col="pre_earn_high"      label="Pre-Earn Hi"   {...thProps} className="border-l border-[var(--c-border-subtle)]" />
                  <Th col="pre_earn_high_pct"  label="Pre-Earn Hi %" {...thProps} />
                  <Th col="pre_earn_high_date" label="Pre-Earn Hi Date" {...thProps} />
                  <Th col="pre_earn_ran_up"    label="Ran Up?"       {...thProps} />
                  <Th col="exit_price"         label="Exit $"        {...thProps} className="border-l border-[var(--c-border-subtle)]" />
                  <Th col="actual_runup_pct"   label="Exit %"        {...thProps} />
                  <Th col="earn_day_price"     label="Earn Day $"    {...thProps} className="border-l border-[var(--c-border-subtle)]" />
                  <Th col="earn_day_pct"       label="Earn Day %"    {...thProps} />
                  <Th col="post10_price"       label="10D Post $"    {...thProps} className="border-l border-[var(--c-border-subtle)]" />
                  <Th col="post10_date"        label="10D Date"      {...thProps} />
                  <Th col="post10_pct"         label="10D Post %"    {...thProps} />
                  <Th col="outcome"            label="Outcome"       {...thProps} className="border-l border-[var(--c-border-subtle)]" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr
                    key={`${row.ticker}-${row.earnings_date}-${row.model_type}`}
                    className={`border-b border-[var(--c-border-subtle)] transition-colors hover:bg-[var(--c-hover-faint)] ${
                      i % 2 === 0 ? 'bg-[var(--c-bg-page)]' : 'bg-[var(--c-bg-alt)]'
                    }`}
                  >
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => navigate(`/earnings/${row.ticker}?earningsDate=${row.earnings_date}`)}
                        className="font-bold text-[var(--c-text-primary)] hover:text-[var(--c-cyan)] transition-colors underline-offset-2 hover:underline"
                      >
                        {row.ticker}
                      </button>
                    </td>
                    <td className="px-2 py-2.5">
                      {hotPickSet.has(row.ticker) && (
                        <span title="Was a Hot Pick" className="inline-flex items-center rounded-md border border-amber-500/40 bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-[var(--c-amber-strong)]">
                          HP
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5"><GradeBadge grade={row.grade} /></td>
                    <td className="px-3 py-2.5 font-mono text-xs text-[var(--c-text-secondary)] tabular-nums">{row.score.toFixed(1)}</td>
                    <td className="px-3 py-2.5 text-xs text-[var(--c-text-secondary)]">{fmtDate(row.earnings_date)}</td>
                    <td className="px-3 py-2.5 text-xs text-[var(--c-text-muted)]">{fmtDate(row.entry_date)}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-[var(--c-text-secondary)] tabular-nums">{fmtPrice(row.entry_price)}</td>

                    {/* Pre-earnings high block */}
                    <td className="border-l border-[var(--c-border-subtle)] px-3 py-2.5 font-mono text-xs text-[var(--c-text-secondary)] tabular-nums">
                      {fmtPrice(row.pre_earn_high)}
                    </td>
                    <td className="px-3 py-2.5"><PctCell value={row.pre_earn_high_pct} /></td>
                    <td className="px-3 py-2.5 text-xs text-[var(--c-text-muted)]">{fmtDate(row.pre_earn_high_date)}</td>
                    <td className="px-3 py-2.5"><RanUpCell value={row.pre_earn_ran_up} /></td>

                    {/* Exit block */}
                    <td className="border-l border-[var(--c-border-subtle)] px-3 py-2.5 font-mono text-xs text-[var(--c-text-secondary)] tabular-nums">
                      {fmtPrice(row.exit_price)}
                    </td>
                    <td className="px-3 py-2.5"><PctCell value={row.actual_runup_pct} /></td>

                    {/* Earnings day block */}
                    <td className="border-l border-[var(--c-border-subtle)] px-3 py-2.5 font-mono text-xs text-[var(--c-text-secondary)] tabular-nums">
                      {fmtPrice(row.earn_day_price)}
                    </td>
                    <td className="px-3 py-2.5"><PctCell value={row.earn_day_pct} /></td>

                    {/* 10-day post block */}
                    <td className="border-l border-[var(--c-border-subtle)] px-3 py-2.5 font-mono text-xs text-[var(--c-text-secondary)] tabular-nums">
                      {fmtPrice(row.post10_price)}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-[var(--c-text-muted)]">{fmtDate(row.post10_date)}</td>
                    <td className="px-3 py-2.5"><PctCell value={row.post10_pct} /></td>

                    {/* Outcome */}
                    <td className="border-l border-[var(--c-border-subtle)] px-3 py-2.5">
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
    </div>
  );
}
