import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { GRADE_CONFIG, MODEL_CONFIG } from '../data/earningsConfig';
import PageGuide from '../components/PageGuide';

const GRADES      = ['A+', 'A', 'B', 'C', 'D'];
const GRADE_ORDER = { 'A+': 0, A: 1, B: 2, C: 3, D: 4 };
const DAY_OPTS    = [{ label: '≤5d', value: 5 }, { label: '≤10d', value: 10 }, { label: '≤15d', value: 15 }, { label: 'All', value: null }];
const EXP_MOVE_OPTS = [{ label: 'All', value: null }, { label: '≥5%', value: 5 }, { label: '≥10%', value: 10 }, { label: '≥15%', value: 15 }, { label: '≥20%', value: 20 }];

function compareSignals(a, b, key, dir) {
  if (key === 'grade') {
    const va = GRADE_ORDER[a.grade] ?? 99;
    const vb = GRADE_ORDER[b.grade] ?? 99;
    return dir === 'asc' ? va - vb : vb - va;
  }
  if (['ticker', 'model_type', 'earnings_date', 'earnings_quarter', 'entry_date'].includes(key)) {
    const va = (a[key] ?? '').toLowerCase();
    const vb = (b[key] ?? '').toLowerCase();
    return dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
  }
  const va = a[key] ?? (dir === 'asc' ? Infinity : -Infinity);
  const vb = b[key] ?? (dir === 'asc' ? Infinity : -Infinity);
  return dir === 'asc' ? va - vb : vb - va;
}

// ── Badges ────────────────────────────────────────────────────────────────────

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

function NewBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--c-emerald)]">
      NEW
    </span>
  );
}

function ShortBadge({ pct }) {
  if (pct == null || pct <= 20) return null;
  return (
    <span className="inline-flex items-center rounded-full border border-orange-500/40 bg-orange-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--c-orange-strong)]">
      Short {pct.toFixed(0)}%
    </span>
  );
}

function SignedPct({ value, label }) {
  const color =
    value == null ? 'text-[var(--c-text-dimmed)]'
    : value > 0   ? 'text-[var(--c-emerald)]'
    : value < 0   ? 'text-[var(--c-rose)]'
    :               'text-[var(--c-text-muted)]';
  return (
    <div className="text-center">
      <p className="text-[10px] uppercase tracking-wide text-[var(--c-text-dimmed)]">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold font-mono ${color}`}>
        {value == null ? '—' : `${value > 0 ? '+' : ''}${value.toFixed(1)}%`}
      </p>
    </div>
  );
}

// ── Signal card ───────────────────────────────────────────────────────────────

function SignalCard({ signal, optionsLoading, onClick }) {
  const cfg    = GRADE_CONFIG[signal.grade] ?? GRADE_CONFIG['D'];
  const urgent = (signal.days_to_earnings ?? 99) <= 5;
  return (
    <button
      onClick={onClick}
      className={`group w-full text-left rounded-3xl border bg-gradient-to-br from-[#0b1420] to-[#08111c] p-5 transition-all duration-200 hover:scale-[1.015] hover:shadow-xl ${cfg.border}`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-xl font-bold text-[var(--c-text-primary)] group-hover:text-cyan-100 transition-colors">{signal.ticker}</p>
            {signal.is_new && <NewBadge />}
          </div>
          {signal.company_name && (
            <p className="mt-0.5 text-xs font-medium text-[var(--c-text-muted)] truncate max-w-[140px]">{signal.company_name}</p>
          )}
          <p className="mt-0.5 text-[10px] text-[var(--c-text-faint)] truncate max-w-[120px]">{signal.sector ?? ''}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <GradeBadge grade={signal.grade} />
          <ShortBadge pct={signal.short_float_pct} />
        </div>
      </div>
      <div className="mb-3 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-[var(--c-text-primary)]">{signal.score.toFixed(0)}</span>
        <span className="text-xs text-[var(--c-text-dimmed)]">/ 82 pts</span>
      </div>
      <div className="mb-3 border-t border-[var(--c-border-subtle)] pt-3">
        <p className="text-xs text-[var(--c-text-muted)] leading-relaxed">
          Earnings{' '}
          <span className="font-semibold text-[var(--c-text-primary)]">{signal.earnings_date}</span>{' '}
          <span className={`font-semibold ${urgent ? 'text-[var(--c-amber-strong)]' : 'text-[var(--c-text-muted)]'}`}>
            {signal.days_to_earnings != null ? `(in ${signal.days_to_earnings}d)` : ''}
          </span>
        </p>
        {signal.entry_date && (
          <p className="text-xs text-[var(--c-text-muted)] mt-0.5">
            Entry <span className="font-semibold text-[var(--c-text-primary)]">{signal.entry_date}</span>
          </p>
        )}
        <p className="text-[10px] text-[var(--c-text-faint)] mt-0.5">{signal.earnings_quarter}</p>
      </div>
      <div className="grid grid-cols-4 gap-1 border-t border-[var(--c-border-subtle)] pt-3">
        <SignedPct label="RS/SPY" value={signal.rs_spy_pct} />
        <SignedPct label="AVWAP"  value={signal.avwap_pct}  />
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wide text-[var(--c-text-dimmed)]">RSI</p>
          <p className="mt-0.5 text-sm font-semibold font-mono text-[var(--c-text-secondary)]">
            {signal.rsi != null ? signal.rsi.toFixed(0) : '—'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wide text-[var(--c-text-dimmed)]">Exp Move</p>
          <p className={`mt-0.5 text-sm font-semibold font-mono ${signal.expected_move_usd != null ? 'text-[var(--c-sky)]' : optionsLoading ? 'animate-pulse text-slate-700' : 'text-[var(--c-text-faint)]'}`}>
            {signal.expected_move_usd != null ? `$${signal.expected_move_usd.toFixed(2)}` : '—'}
          </p>
          {signal.expected_move_pct != null && (
            <p className="text-[10px] font-mono text-[var(--c-text-dimmed)] mt-0.5">
              ±{signal.expected_move_pct.toFixed(1)}%
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Grade bucket (summary) ────────────────────────────────────────────────────

function GradeBucketCard({ grade, count, avgScore, onClick }) {
  const cfg = GRADE_CONFIG[grade];
  return (
    <button
      onClick={onClick}
      className={`group w-full rounded-3xl border bg-gradient-to-br ${cfg.gradient} ${cfg.border} p-6 text-left transition-all duration-200 hover:scale-[1.03] hover:shadow-xl`}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
        <span className="text-[10px] uppercase tracking-widest text-[var(--c-text-dimmed)]">Grade</span>
      </div>
      <p className="text-5xl font-black text-[var(--c-text-primary)] leading-none">{grade}</p>
      <div className="mt-4">
        <p className="text-3xl font-bold text-[var(--c-text-primary)]">{count}</p>
        <p className="text-xs text-[var(--c-text-muted)] mt-0.5">{count !== 1 ? 'signals' : 'signal'}</p>
      </div>
      {avgScore != null && count > 0 && (
        <p className="mt-3 text-xs text-[var(--c-text-dimmed)]">avg score {avgScore.toFixed(0)}</p>
      )}
    </button>
  );
}

// ── Sortable header cell ──────────────────────────────────────────────────────

function SortTh({ label, sk, sortKey, sortDir, onSort, className = '' }) {
  const active = sortKey === sk;
  return (
    <th
      onClick={() => onSort(sk)}
      className={`cursor-pointer select-none py-3 text-[10px] uppercase tracking-widest whitespace-nowrap transition-colors ${
        active ? 'text-[var(--c-violet-strong)]' : 'text-[var(--c-text-dimmed)] hover:text-[var(--c-text-secondary)]'
      } ${className}`}
    >
      {label}
      <span className="ml-1 text-[9px]">{active ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}</span>
    </th>
  );
}

// ── List row ──────────────────────────────────────────────────────────────────

function SignalRow({ signal, optionsLoading, onClick }) {
  const urgent = (signal.days_to_earnings ?? 99) <= 5;

  const num = (v, fmt) =>
    v == null
      ? <span className={optionsLoading ? 'animate-pulse text-slate-700' : 'text-[var(--c-text-faint)]'}>—</span>
      : <span className="text-[var(--c-text-secondary)]">{fmt(v)}</span>;

  return (
    <tr onClick={onClick} className="cursor-pointer border-b border-[var(--c-border-subtle)] transition-colors hover:bg-[var(--c-hover)]">
      <td className="py-2.5 pl-4 pr-3">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-[var(--c-text-primary)]">{signal.ticker}</span>
          {signal.is_new && <NewBadge />}
        </div>
        {signal.company_name && <span className="text-xs text-[var(--c-text-muted)] hidden sm:block">{signal.company_name}</span>}
        {signal.sector && <span className="text-[10px] text-[var(--c-text-faint)] hidden sm:block">{signal.sector}</span>}
      </td>
      <td className="px-3 py-2.5 text-center"><GradeBadge grade={signal.grade} /></td>
      <td className="px-3 py-2.5 text-center font-mono text-sm text-[var(--c-text-primary)]">{signal.score.toFixed(0)}</td>
      <td className="px-3 py-2.5 text-center text-sm text-[var(--c-text-secondary)] whitespace-nowrap">
        {signal.earnings_date}
        {signal.days_to_earnings != null && (
          <span className={`ml-1.5 text-[10px] font-semibold ${urgent ? 'text-[var(--c-amber-strong)]' : 'text-[var(--c-text-faint)]'}`}>
            {urgent ? `⚡ ${signal.days_to_earnings}d` : `${signal.days_to_earnings}d`}
          </span>
        )}
      </td>
      <td className="px-3 py-2.5 text-center text-sm text-[var(--c-text-secondary)] whitespace-nowrap">
        {signal.entry_date ?? <span className="text-[var(--c-text-faint)]">—</span>}
      </td>
      <td className="px-3 py-2.5 text-center text-sm font-mono">
        {num(signal.expected_move_pct, (v) => `${v.toFixed(1)}%`)}
      </td>
      <td className="px-3 py-2.5 text-center text-sm font-mono">
        {num(signal.expected_move_usd, (v) => `$${v.toFixed(2)}`)}
      </td>
      <td className="px-3 py-2.5 text-center text-sm font-mono">
        {num(signal.iv, (v) => `${v.toFixed(1)}%`)}
      </td>
      <td className="px-3 py-2.5 text-center text-sm font-mono">
        {num(signal.spot_price, (v) => `$${v.toFixed(2)}`)}
      </td>
      <td className="px-3 py-2.5 text-center text-sm font-mono text-[var(--c-text-secondary)]">
        {signal.dte != null
          ? signal.dte
          : <span className={optionsLoading ? 'animate-pulse text-slate-700' : 'text-[var(--c-text-faint)]'}>—</span>}
      </td>
      <td className="px-3 py-2.5 pr-4 text-center text-sm font-mono">
        {signal.short_float_pct == null
          ? <span className="text-[var(--c-text-faint)]">—</span>
          : <span className={signal.short_float_pct > 20 ? 'font-bold text-[var(--c-orange-strong)]' : 'text-[var(--c-text-secondary)]'}>
              {signal.short_float_pct.toFixed(1)}%
            </span>
        }
      </td>
    </tr>
  );
}

// ── Filter bar ────────────────────────────────────────────────────────────────

function FilterBar({ tickerQ, setTickerQ, activeGrades, toggleGrade, maxDays, setMaxDays, minExpMove, setMinExpMove, highShortOnly, setHighShortOnly, total, filtered }) {
  return (
    <div className="mb-4 rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-card)] p-3 flex flex-wrap items-center gap-3">
      <div className="relative min-w-[140px]">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--c-text-dimmed)] text-xs pointer-events-none">⌕</span>
        <input
          type="text"
          value={tickerQ}
          onChange={(e) => setTickerQ(e.target.value.toUpperCase())}
          placeholder="Ticker…"
          className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-hover)] py-1.5 pl-7 pr-3 text-sm text-[var(--c-text-primary)] placeholder-[var(--c-text-faint)] focus:border-violet-500/50 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-widest text-[var(--c-text-faint)] mr-1">Grade</span>
        {GRADES.map((g) => {
          const cfg = GRADE_CONFIG[g];
          const on  = activeGrades.has(g);
          return (
            <button
              key={g}
              onClick={() => toggleGrade(g)}
              className={`rounded-lg border px-2 py-0.5 text-xs font-bold transition-all ${
                on ? cfg.badge : 'border-[var(--c-border)] bg-transparent text-[var(--c-text-faint)] hover:text-[var(--c-text-muted)]'
              }`}
            >
              {g}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-widest text-[var(--c-text-faint)] mr-1">Days</span>
        {DAY_OPTS.map(({ label, value }) => (
          <button
            key={label}
            onClick={() => setMaxDays(value)}
            className={`rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-all ${
              maxDays === value
                ? 'border-violet-500/40 bg-violet-500/20 text-[var(--c-violet)]'
                : 'border-[var(--c-border)] text-[var(--c-text-dimmed)] hover:text-[var(--c-text-primary)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-widest text-[var(--c-text-faint)] mr-1">Exp Move</span>
        {EXP_MOVE_OPTS.map(({ label, value }) => (
          <button
            key={label}
            onClick={() => setMinExpMove(value)}
            className={`rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-all ${
              minExpMove === value
                ? 'border-sky-500/40 bg-sky-500/20 text-[var(--c-sky)]'
                : 'border-[var(--c-border)] text-[var(--c-text-dimmed)] hover:text-[var(--c-text-primary)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <button
        onClick={() => setHighShortOnly(!highShortOnly)}
        className={`rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-all ${
          highShortOnly
            ? 'border-orange-500/50 bg-orange-500/20 text-[var(--c-orange)]'
            : 'border-[var(--c-border)] text-[var(--c-text-dimmed)] hover:text-[var(--c-text-primary)]'
        }`}
      >
        Short &gt;20%
      </button>

      {filtered < total && (
        <span className="ml-auto text-xs text-[var(--c-text-dimmed)]">
          <span className="font-semibold text-[var(--c-text-primary)]">{filtered}</span> of {total}
        </span>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

// ── Hot Pick card ─────────────────────────────────────────────────────────────

function HotPickCard({ pick, rank, onClick }) {
  const cfg    = GRADE_CONFIG[pick.grade] ?? GRADE_CONFIG['D'];
  const urgent = (pick.days_to_earnings ?? 99) <= 5;
  const isHot  = pick.tier === 'hot';

  return (
    <button
      onClick={onClick}
      className={`group relative w-full text-left rounded-2xl border bg-gradient-to-br from-[#0b1420] to-[#07101a] p-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl ${
        isHot ? 'border-amber-500/30 hover:border-amber-400/50' : 'border-[var(--c-border)] hover:border-white/20'
      }`}
    >
      {/* Rank badge */}
      <div className={`absolute -top-2 -left-2 h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black ${
        isHot ? 'bg-amber-500 text-black' : 'bg-slate-700 text-[var(--c-text-secondary)]'
      }`}>
        {rank}
      </div>

      {/* Momentum override badge */}
      {pick.momentum_override && (
        <div className="absolute -top-2 right-3 inline-flex items-center gap-1 rounded-full border border-cyan-500/40 bg-cyan-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--c-cyan-strong)]">
          ⚡ Override
        </div>
      )}

      <div className="mb-2 flex items-start justify-between gap-1">
        <div>
          <p className="text-base font-bold text-[var(--c-text-primary)] group-hover:text-[var(--c-amber)] transition-colors">{pick.ticker}</p>
          {pick.company_name && (
            <p className="text-[10px] text-[var(--c-text-dimmed)] truncate max-w-[120px]">{pick.company_name}</p>
          )}
        </div>
        <GradeBadge grade={pick.grade} />
      </div>

      {/* Dynamic score */}
      <div className="mb-2 flex items-baseline gap-1.5">
        <span className={`text-xl font-black ${isHot ? 'text-[var(--c-amber-strong)]' : 'text-[var(--c-text-secondary)]'}`}>
          {pick.dynamic_score.toFixed(0)}
        </span>
        <span className="text-[10px] text-[var(--c-text-faint)]">dyn</span>
        <span className="text-slate-700 text-xs">/</span>
        <span className="text-xs text-[var(--c-text-dimmed)]">{pick.model_score.toFixed(0)} mdl</span>
      </div>

      {/* Earnings timing */}
      <p className="mb-2 text-[10px] text-[var(--c-text-dimmed)]">
        Earnings{' '}
        <span className={`font-semibold ${urgent ? 'text-[var(--c-amber-strong)]' : 'text-[var(--c-text-secondary)]'}`}>
          {pick.days_to_earnings != null ? `in ${pick.days_to_earnings}d` : pick.earnings_date}
        </span>
      </p>

      {/* Key metrics row */}
      <div className="grid grid-cols-3 gap-1 border-t border-[var(--c-border-subtle)] pt-2">
        <div className="text-center">
          <p className="text-[9px] uppercase tracking-wide text-[var(--c-text-faint)]">RS/SPY</p>
          <p className={`text-xs font-bold font-mono ${(pick.rs_spy_pct ?? 0) > 10 ? 'text-[var(--c-cyan-strong)]' : 'text-[var(--c-text-muted)]'}`}>
            {pick.rs_spy_pct != null ? `+${pick.rs_spy_pct.toFixed(1)}` : '—'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[9px] uppercase tracking-wide text-[var(--c-text-faint)]">ADX</p>
          <p className={`text-xs font-bold font-mono ${(pick.adx ?? 0) > 25 ? 'text-[var(--c-emerald)]' : 'text-[var(--c-text-muted)]'}`}>
            {pick.adx != null ? pick.adx.toFixed(0) : '—'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[9px] uppercase tracking-wide text-[var(--c-text-faint)]">RVOL</p>
          <p className={`text-xs font-bold font-mono ${(pick.rvol_5d ?? 0) > 1.5 ? 'text-[var(--c-violet-strong)]' : 'text-[var(--c-text-muted)]'}`}>
            {pick.rvol_5d != null ? `${pick.rvol_5d.toFixed(1)}x` : '—'}
          </p>
        </div>
      </div>
    </button>
  );
}

function OnDeckCard({ pick, rank, onClick }) {
  const cfg = GRADE_CONFIG[pick.grade] ?? GRADE_CONFIG['D'];
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl border border-white/8 bg-[var(--c-bg-card)] px-3 py-2.5 text-left transition-all hover:border-white/20 hover:bg-[var(--c-hover-faint)]"
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[9px] font-black text-[var(--c-text-muted)]">
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-[var(--c-text-primary)]">{pick.ticker}</span>
          <GradeBadge grade={pick.grade} />
          {pick.momentum_override && (
            <span className="text-[8px] font-bold text-[var(--c-cyan-strong)]">⚡</span>
          )}
        </div>
        <p className="text-[10px] text-[var(--c-text-faint)]">
          {pick.days_to_earnings != null ? `in ${pick.days_to_earnings}d` : pick.earnings_date}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-black text-[var(--c-text-secondary)]">{pick.dynamic_score.toFixed(0)}</p>
        <p className="text-[9px] text-[var(--c-text-faint)]">dyn</p>
      </div>
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PreEarningsRunners() {
  const [signals,          setSignals]          = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);
  const [model,            setModel]            = useState('Both');
  const [view,             setView]             = useState('card');
  const [optionsMap,       setOptionsMap]       = useState({});
  const [optionsLoading,   setOptionsLoading]   = useState(false);
  const [shortFloatMap,    setShortFloatMap]    = useState({});
  const [tickerQ,          setTickerQ]          = useState('');
  const [activeGrades,     setActiveGrades]     = useState(new Set(GRADES));
  const [maxDays,          setMaxDays]          = useState(null);
  const [highShortOnly,    setHighShortOnly]    = useState(false);
  const [sortKey,          setSortKey]          = useState('score');
  const [sortDir,          setSortDir]          = useState('desc');
  const [minExpMove,       setMinExpMove]       = useState(null);
  const [sectorFilter,     setSectorFilter]     = useState([]);
  const [hotPicks,         setHotPicks]         = useState({ hot_picks: [], on_deck: [], compute_date: null });
  const [hotLoading,       setHotLoading]       = useState(true);
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const gradeFilter = params.get('grade');
  const isSummary   = !gradeFilter;

  useEffect(() => {
    if (gradeFilter && gradeFilter !== 'all') {
      setActiveGrades(new Set([gradeFilter]));
    } else {
      setActiveGrades(new Set(GRADES));
    }
    setTickerQ('');
    setMaxDays(null);
  }, [gradeFilter]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setOptionsMap({});
    apiFetch(`/earnings/signals?model=${model}&upcoming_only=true`)
      .then(setSignals)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [model]);

  // Batch-fetch options once signals are loaded
  useEffect(() => {
    if (signals.length === 0) return;
    const unique = [...new Set(signals.map((s) => s.ticker))];
    setOptionsLoading(true);
    apiFetch(`/earnings/options?tickers=${unique.join(',')}`)
      .then((data) => setOptionsMap(data))
      .catch(() => {})
      .finally(() => setOptionsLoading(false));
  }, [signals]);

  // Fetch short float data (cached hourly on server)
  useEffect(() => {
    if (signals.length === 0) return;
    apiFetch('/earnings/short-interest')
      .then((data) => setShortFloatMap(data))
      .catch(() => {});
  }, [signals]);

  // Fetch Hot Picks (independent of model — dynamic score is model-agnostic)
  useEffect(() => {
    setHotLoading(true);
    apiFetch('/earnings/hot-picks')
      .then((data) => setHotPicks(data))
      .catch(() => setHotPicks({ hot_picks: [], on_deck: [], compute_date: null }))
      .finally(() => setHotLoading(false));
  }, []);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const toggleGrade = (g) => {
    setActiveGrades((prev) => {
      const next = new Set(prev);
      if (next.has(g)) { if (next.size > 1) next.delete(g); }
      else next.add(g);
      return next;
    });
  };

  const byGrade = GRADES.map((g) => {
    const group = signals.filter((s) => s.grade === g);
    const avg   = group.length ? group.reduce((a, s) => a + s.score, 0) / group.length : null;
    return { grade: g, count: group.length, avgScore: avg };
  });
  const uniqueTickers = new Set(signals.map((s) => s.ticker)).size;

  // Merge options + short float data
  const enriched = useMemo(() =>
    signals.map((s) => {
      const opts = optionsMap[s.ticker] ?? {};
      const dte  = opts.expiry_date
        ? Math.max(0, Math.round((new Date(opts.expiry_date) - new Date()) / 86400000))
        : null;
      const short_float_pct = shortFloatMap[s.ticker] ?? null;
      return { ...s, ...opts, dte, short_float_pct };
    }),
    [signals, optionsMap, shortFloatMap],
  );

  // One entry per ticker — prefer Momentum; if same model keep highest score
  const deduped = useMemo(() => {
    const map = new Map();
    for (const s of enriched) {
      const prev = map.get(s.ticker);
      if (!prev) { map.set(s.ticker, s); continue; }
      const prefer =
        (s.model_type === 'Momentum' && prev.model_type !== 'Momentum') ||
        (s.model_type === prev.model_type && s.score > prev.score);
      if (prefer) map.set(s.ticker, s);
    }
    return [...map.values()];
  }, [enriched]);

  const allSectors = useMemo(() =>
    [...new Set(deduped.map((s) => s.sector).filter(Boolean))].sort(),
    [deduped]
  );

  const toggleSector = (s) =>
    setSectorFilter((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

  const displayed = useMemo(() => {
    const filtered = deduped.filter((s) =>
      activeGrades.has(s.grade) &&
      (!tickerQ || s.ticker.includes(tickerQ.trim())) &&
      (maxDays == null || (s.days_to_earnings != null && s.days_to_earnings <= maxDays)) &&
      (minExpMove == null || (s.expected_move_pct != null && s.expected_move_pct >= minExpMove)) &&
      (!highShortOnly || (s.short_float_pct != null && s.short_float_pct > 20)) &&
      (!sectorFilter.length || sectorFilter.includes(s.sector))
    );
    if (view === 'list') {
      return [...filtered].sort((a, b) => compareSignals(a, b, sortKey, sortDir));
    }
    return filtered;
  }, [enriched, deduped, activeGrades, tickerQ, maxDays, minExpMove, highShortOnly, sectorFilter, view, sortKey, sortDir]);

  const recentNew = useMemo(() => {
    const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000;
    return deduped.filter((s) =>
      s.is_new && s.added_date && new Date(s.added_date).getTime() >= cutoff
    );
  }, [deduped]);

  const shProps = { sortKey, sortDir, onSort: handleSort };

  return (
    <div className="mx-auto max-w-7xl p-3 sm:p-4 lg:p-8">

      {/* Page header */}
      <div className="mb-6 rounded-3xl border border-[var(--c-border)] bg-gradient-to-br from-[var(--c-bg-gradient-from)] to-[var(--c-bg-gradient-to)] p-6 lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-violet)]">
              Quantified Edge
            </div>
            <h1 className="text-3xl font-bold text-[var(--c-text-primary)] sm:text-4xl">Pre-Earnings Runners</h1>
            {!loading && (
              <p className="mt-2 text-sm text-[var(--c-text-muted)]">
                <span className="font-semibold text-[var(--c-text-primary)]">{uniqueTickers}</span> tickers reporting in the next 22 days
              </p>
            )}
          </div>
          <div className="flex self-start rounded-2xl border border-[var(--c-border)] bg-black/30 p-1 lg:self-auto">
            {['Both', 'Recovery', 'Momentum'].map((m) => (
              <button
                key={m}
                onClick={() => setModel(m)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                  model === m
                    ? 'bg-violet-500 text-[var(--c-text-primary)] shadow-lg shadow-violet-500/20'
                    : 'text-[var(--c-text-muted)] hover:text-[var(--c-text-primary)]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isSummary && (
        <PageGuide
          guideKey="pre-earnings-summary"
          accent="violet"
          title="Find stocks that go up before earnings — then pick the best ones."
          description="Stocks often rise in the days BEFORE their earnings announcement, driven by anticipation and excitement. This page gives you two ways to find the best opportunities: grade buckets and Hot Picks."
          steps={[
            { text: 'The grade cards (A+, A, B, C, D) show how reliable this pattern has been historically for each group. A+ means the strongest track record — the most past signals confirmed the run. Click any grade card to see every ticker in that bucket.', targetId: 'pg-grades' },
            { text: 'Hot Picks are ranked by Dynamic Score — a daily calculation that blends the historical grade with real-time conditions like relative strength vs SPY, sector momentum, and volume. ⚡ Momentum Override means ALL 6 key signals are firing at once — that\'s the highest-conviction alert the system can generate.', targetId: 'pg-hotpicks' },
            'Once you spot a stock that looks interesting — from the grade cards or Hot Picks — click it to open the full research report. That page shows exactly why it made the list and what conditions look like right now. Always review before placing a trade.',
          ]}
        />
      )}

      {!isSummary && (
        <button
          onClick={() => setParams({})}
          className="mb-5 flex items-center gap-2 text-sm text-[var(--c-text-muted)] hover:text-[var(--c-text-primary)] transition-colors"
        >
          ← Back to Summary
        </button>
      )}

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 py-4 text-sm text-[var(--c-rose-strong)]">
          Failed to load signals: {error}
        </div>
      )}

      {/* Summary: grade bucket cards */}
      {isSummary && (
        <>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">Signals by Grade</h2>
            <button
              onClick={() => setParams({ grade: 'all' })}
              className="text-sm text-[var(--c-violet-strong)] hover:text-[var(--c-violet)] transition-colors"
            >
              View all →
            </button>
          </div>
          <div id="pg-grades" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-44 animate-pulse rounded-3xl bg-[var(--c-hover)]" />
                ))
              : byGrade.map(({ grade, count, avgScore }) => (
                  <GradeBucketCard
                    key={grade}
                    grade={grade}
                    count={count}
                    avgScore={avgScore}
                    onClick={() => setParams({ grade })}
                  />
                ))}
          </div>

          {/* ── Hot Picks & On Deck ───────────────────────────────────────── */}
          {(hotLoading || hotPicks.hot_picks.length > 0) && (
            <div id="pg-hotpicks" className="mt-8">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-500">
                    🔥 Hot Picks
                  </h2>
                  <span className="text-[10px] text-[var(--c-text-faint)]">
                    Top 10 by dynamic score — updated daily at market close
                  </span>
                </div>
                {hotPicks.compute_date && (
                  <span className="text-[10px] text-[var(--c-text-faint)]">
                    As of {hotPicks.compute_date}
                  </span>
                )}
              </div>

              {hotLoading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="h-40 animate-pulse rounded-2xl bg-[var(--c-hover)]" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {hotPicks.hot_picks.map((pick, i) => (
                      <HotPickCard
                        key={pick.ticker}
                        pick={pick}
                        rank={i + 1}
                        onClick={() => navigate(`/earnings/${pick.ticker}`)}
                      />
                    ))}
                  </div>

                  {hotPicks.on_deck.length > 0 && (
                    <div className="mt-5">
                      <div className="mb-3 flex items-center gap-3">
                        <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">
                          On Deck
                        </h3>
                        <span className="text-[10px] text-[var(--c-text-faint)]">
                          Next 5 — ready to move up
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
                        {hotPicks.on_deck.map((pick, i) => (
                          <OnDeckCard
                            key={pick.ticker}
                            pick={pick}
                            rank={hotPicks.hot_picks.length + i + 1}
                            onClick={() => navigate(`/earnings/${pick.ticker}`)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {!loading && recentNew.length > 0 && (
            <div className="mt-8">
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">New Additions</h2>
                <span className="text-[10px] text-[var(--c-text-faint)]">Added in the last 3 days</span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {recentNew.map((s) => (
                  <SignalCard
                    key={s.ticker}
                    signal={s}
                    optionsLoading={optionsLoading}
                    onClick={() => navigate(`/earnings/${s.ticker}`)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Signal list / cards */}
      {!isSummary && (
        <>
          <PageGuide
            guideKey="all-signals"
            accent="violet"
            title="Every active pre-earnings signal — filtered and sorted your way."
            description="This is the full unfiltered list of all tickers approaching their earnings date. Use the filters to narrow down by grade, days to earnings, sector, or expected move size."
            steps={[
              { text: 'Use the grade buttons to focus on specific tiers, or the day filter to zero in on what\'s coming up soonest. The "≤5d" filter shows the most urgent opportunities — stocks with earnings in 5 days or less.', targetId: 'pg-filter-bar' },
              { text: 'The sector filter lets you target a specific industry or avoid a weak one. If Tech is running hot, you can filter to just Tech signals. If a sector is in a downtrend, you can exclude it entirely.', targetId: 'pg-sector-filter' },
              { text: 'Toggle between ⊞ Card view for a rich snapshot of each signal, or ☰ List view for a compact sortable table. In List view, click any column header to sort — useful for ranking by days to earnings, expected move, or IV.', targetId: 'pg-signals-list' },
            ]}
          />

          {/* Toolbar */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--c-text-dimmed)]">
                {loading ? '…' : `${displayed.length} signal${displayed.length !== 1 ? 's' : ''}${displayed.length < deduped.length ? ` of ${deduped.length}` : ''}`}
              </span>
              {optionsLoading && (
                <span className="text-[10px] text-[var(--c-text-faint)] animate-pulse">loading market data…</span>
              )}
            </div>
            <div className="flex rounded-xl border border-[var(--c-border)] bg-black/30 p-0.5 text-xs font-semibold">
              <button
                onClick={() => setView('card')}
                className={`rounded-lg px-3 py-1.5 transition-all ${view === 'card' ? 'bg-violet-500 text-[var(--c-text-primary)]' : 'text-[var(--c-text-muted)] hover:text-[var(--c-text-primary)]'}`}
              >
                ⊞ Card
              </button>
              <button
                onClick={() => setView('list')}
                className={`rounded-lg px-3 py-1.5 transition-all ${view === 'list' ? 'bg-violet-500 text-[var(--c-text-primary)]' : 'text-[var(--c-text-muted)] hover:text-[var(--c-text-primary)]'}`}
              >
                ☰ List
              </button>
            </div>
          </div>

          {/* Filter bar */}
          {!loading && (
            <div id="pg-filter-bar">
            <FilterBar
              tickerQ={tickerQ}
              setTickerQ={setTickerQ}
              activeGrades={activeGrades}
              toggleGrade={toggleGrade}
              maxDays={maxDays}
              setMaxDays={setMaxDays}
              minExpMove={minExpMove}
              setMinExpMove={setMinExpMove}
              highShortOnly={highShortOnly}
              setHighShortOnly={setHighShortOnly}
              total={deduped.length}
              filtered={displayed.length}
            />
            </div>
          )}

          {/* Sector filter */}
          {!loading && allSectors.length > 0 && (
            <div id="pg-sector-filter" className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-[var(--c-text-faint)] mr-1">Sector</span>
              {allSectors.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSector(s)}
                  className={`rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-all ${
                    sectorFilter.includes(s)
                      ? 'border-violet-500/40 bg-violet-500/20 text-[var(--c-violet)]'
                      : 'border-[var(--c-border)] text-[var(--c-text-dimmed)] hover:text-[var(--c-text-primary)]'
                  }`}
                >
                  {s}
                </button>
              ))}
              {sectorFilter.length > 0 && (
                <button
                  onClick={() => setSectorFilter([])}
                  className="ml-1 rounded-lg border border-[var(--c-border)] px-2.5 py-0.5 text-xs text-[var(--c-text-faint)] hover:text-[var(--c-text-secondary)] transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          <div id="pg-signals-list">
          {/* Card view */}
          {view === 'card' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-56 animate-pulse rounded-3xl bg-[var(--c-hover)]" />
                  ))
                : displayed.length === 0
                  ? (
                      <div className="col-span-full rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-card)] px-8 py-14 text-center text-[var(--c-text-dimmed)]">
                        No signals match the current filters.
                      </div>
                    )
                  : displayed.map((s) => (
                      <SignalCard
                        key={`${s.ticker}-${s.model_type}`}
                        signal={s}
                        optionsLoading={optionsLoading}
                        onClick={() => navigate(`/earnings/${s.ticker}`)}
                      />
                    ))}
            </div>
          )}

          {/* List view */}
          {view === 'list' && (
            <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-card)] overflow-hidden">
              {loading ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-10 animate-pulse rounded-xl bg-[var(--c-hover)]" />
                  ))}
                </div>
              ) : displayed.length === 0 ? (
                <div className="px-8 py-14 text-center text-[var(--c-text-dimmed)]">
                  No signals match the current filters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--c-border)]">
                        <SortTh label="Ticker"    sk="ticker"            {...shProps} className="pl-4 pr-3 text-left" />
                        <SortTh label="Grade"     sk="grade"             {...shProps} className="px-3 text-center" />
                        <SortTh label="Score"     sk="score"             {...shProps} className="px-3 text-center" />
                        <SortTh label="Earnings"  sk="earnings_date"     {...shProps} className="px-3 text-center" />
                        <SortTh label="Entry"     sk="entry_date"        {...shProps} className="px-3 text-center" />
                        <SortTh label="Exp Move %" sk="expected_move_pct"{...shProps} className="px-3 text-center" />
                        <SortTh label="Exp Move $" sk="expected_move_usd"{...shProps} className="px-3 text-center" />
                        <SortTh label="IV"        sk="iv"                {...shProps} className="px-3 text-center" />
                        <SortTh label="Spot"      sk="spot_price"        {...shProps} className="px-3 text-center" />
                        <SortTh label="Closest Expiry" sk="dte"            {...shProps} className="px-3 text-center" />
                        <SortTh label="Short Float %"  sk="short_float_pct" {...shProps} className="px-3 pr-4 text-center" />
                      </tr>
                    </thead>
                    <tbody>
                      {displayed.map((s) => (
                        <SignalRow
                          key={`${s.ticker}-${s.model_type}`}
                          signal={s}
                          optionsLoading={optionsLoading}
                          onClick={() => navigate(`/earnings/${s.ticker}`)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          </div>
        </>
      )}
    </div>
  );
}
