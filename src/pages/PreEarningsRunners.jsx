import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { GRADE_CONFIG, MODEL_CONFIG } from '../data/earningsConfig';

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

function SignedPct({ value, label }) {
  const color =
    value == null ? 'text-slate-500'
    : value > 0   ? 'text-emerald-400'
    : value < 0   ? 'text-rose-400'
    :               'text-slate-400';
  return (
    <div className="text-center">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
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
          <p className="text-xl font-bold text-white group-hover:text-cyan-100 transition-colors">{signal.ticker}</p>
          <p className="mt-0.5 text-xs text-slate-600 truncate max-w-[120px]">{signal.sector ?? ''}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <GradeBadge grade={signal.grade} />
        </div>
      </div>
      <div className="mb-3 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-white">{signal.score.toFixed(0)}</span>
        <span className="text-xs text-slate-500">/ 82 pts</span>
      </div>
      <div className="mb-3 border-t border-white/5 pt-3">
        <p className="text-xs text-slate-400 leading-relaxed">
          Earnings{' '}
          <span className="font-semibold text-white">{signal.earnings_date}</span>{' '}
          <span className={`font-semibold ${urgent ? 'text-amber-400' : 'text-slate-400'}`}>
            {signal.days_to_earnings != null ? `(in ${signal.days_to_earnings}d)` : ''}
          </span>
        </p>
        {signal.entry_date && (
          <p className="text-xs text-slate-400 mt-0.5">
            Entry <span className="font-semibold text-white">{signal.entry_date}</span>
          </p>
        )}
        <p className="text-[10px] text-slate-600 mt-0.5">{signal.earnings_quarter}</p>
      </div>
      <div className="grid grid-cols-4 gap-1 border-t border-white/5 pt-3">
        <SignedPct label="RS/SPY" value={signal.rs_spy_pct} />
        <SignedPct label="AVWAP"  value={signal.avwap_pct}  />
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">RSI</p>
          <p className="mt-0.5 text-sm font-semibold font-mono text-slate-300">
            {signal.rsi != null ? signal.rsi.toFixed(0) : '—'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Exp Move</p>
          <p className={`mt-0.5 text-sm font-semibold font-mono ${signal.expected_move_pct != null ? 'text-sky-300' : optionsLoading ? 'animate-pulse text-slate-700' : 'text-slate-600'}`}>
            {signal.expected_move_pct != null ? `±${signal.expected_move_pct.toFixed(1)}%` : '—'}
          </p>
          {signal.expected_move_usd != null && (
            <p className="text-[10px] font-mono text-slate-500 mt-0.5">
              ±${signal.expected_move_usd.toFixed(2)}
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
        <span className="text-[10px] uppercase tracking-widest text-slate-500">Grade</span>
      </div>
      <p className="text-5xl font-black text-white leading-none">{grade}</p>
      <div className="mt-4">
        <p className="text-3xl font-bold text-white">{count}</p>
        <p className="text-xs text-slate-400 mt-0.5">{count !== 1 ? 'signals' : 'signal'}</p>
      </div>
      {avgScore != null && count > 0 && (
        <p className="mt-3 text-xs text-slate-500">avg score {avgScore.toFixed(0)}</p>
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
        active ? 'text-violet-400' : 'text-slate-500 hover:text-slate-300'
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
      ? <span className={optionsLoading ? 'animate-pulse text-slate-700' : 'text-slate-600'}>—</span>
      : <span className="text-slate-200">{fmt(v)}</span>;

  return (
    <tr onClick={onClick} className="cursor-pointer border-b border-white/5 transition-colors hover:bg-white/5">
      <td className="py-2.5 pl-4 pr-3">
        <span className="font-bold text-white">{signal.ticker}</span>
        {signal.sector && <span className="ml-2 text-[10px] text-slate-600 hidden sm:inline">{signal.sector}</span>}
      </td>
      <td className="px-3 py-2.5 text-center"><GradeBadge grade={signal.grade} /></td>
      <td className="px-3 py-2.5 text-center font-mono text-sm text-white">{signal.score.toFixed(0)}</td>
      <td className="px-3 py-2.5 text-center text-sm text-slate-300 whitespace-nowrap">
        {signal.earnings_date}
        {signal.days_to_earnings != null && (
          <span className={`ml-1.5 text-[10px] font-semibold ${urgent ? 'text-amber-400' : 'text-slate-600'}`}>
            {urgent ? `⚡ ${signal.days_to_earnings}d` : `${signal.days_to_earnings}d`}
          </span>
        )}
      </td>
      <td className="px-3 py-2.5 text-center text-sm text-slate-300 whitespace-nowrap">
        {signal.entry_date ?? <span className="text-slate-600">—</span>}
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
      <td className="px-3 py-2.5 pr-4 text-center text-sm font-mono text-slate-300">
        {signal.dte != null
          ? signal.dte
          : <span className={optionsLoading ? 'animate-pulse text-slate-700' : 'text-slate-600'}>—</span>}
      </td>
    </tr>
  );
}

// ── Filter bar ────────────────────────────────────────────────────────────────

function FilterBar({ tickerQ, setTickerQ, activeGrades, toggleGrade, maxDays, setMaxDays, minExpMove, setMinExpMove, total, filtered }) {
  return (
    <div className="mb-4 rounded-2xl border border-white/10 bg-[#0b1420] p-3 flex flex-wrap items-center gap-3">
      <div className="relative min-w-[140px]">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none">⌕</span>
        <input
          type="text"
          value={tickerQ}
          onChange={(e) => setTickerQ(e.target.value.toUpperCase())}
          placeholder="Ticker…"
          className="w-full rounded-xl border border-white/10 bg-white/5 py-1.5 pl-7 pr-3 text-sm text-white placeholder-slate-600 focus:border-violet-500/50 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-widest text-slate-600 mr-1">Grade</span>
        {GRADES.map((g) => {
          const cfg = GRADE_CONFIG[g];
          const on  = activeGrades.has(g);
          return (
            <button
              key={g}
              onClick={() => toggleGrade(g)}
              className={`rounded-lg border px-2 py-0.5 text-xs font-bold transition-all ${
                on ? cfg.badge : 'border-white/10 bg-transparent text-slate-600 hover:text-slate-400'
              }`}
            >
              {g}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-widest text-slate-600 mr-1">Days</span>
        {DAY_OPTS.map(({ label, value }) => (
          <button
            key={label}
            onClick={() => setMaxDays(value)}
            className={`rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-all ${
              maxDays === value
                ? 'border-violet-500/40 bg-violet-500/20 text-violet-300'
                : 'border-white/10 text-slate-500 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-widest text-slate-600 mr-1">Exp Move</span>
        {EXP_MOVE_OPTS.map(({ label, value }) => (
          <button
            key={label}
            onClick={() => setMinExpMove(value)}
            className={`rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-all ${
              minExpMove === value
                ? 'border-sky-500/40 bg-sky-500/20 text-sky-300'
                : 'border-white/10 text-slate-500 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered < total && (
        <span className="ml-auto text-xs text-slate-500">
          <span className="font-semibold text-white">{filtered}</span> of {total}
        </span>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PreEarningsRunners() {
  const [signals,        setSignals]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [model,          setModel]          = useState('Both');
  const [view,           setView]           = useState('card');
  const [optionsMap,     setOptionsMap]     = useState({});
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [tickerQ,        setTickerQ]        = useState('');
  const [activeGrades,   setActiveGrades]   = useState(new Set(GRADES));
  const [maxDays,        setMaxDays]        = useState(null);
  const [sortKey,        setSortKey]        = useState('score');
  const [sortDir,        setSortDir]        = useState('desc');
  const [minExpMove,     setMinExpMove]     = useState(null);
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

  // Merge options data + compute DTE from expiry_date
  const enriched = useMemo(() =>
    signals.map((s) => {
      const opts = optionsMap[s.ticker] ?? {};
      const dte  = opts.expiry_date
        ? Math.max(0, Math.round((new Date(opts.expiry_date) - new Date()) / 86400000))
        : null;
      return { ...s, ...opts, dte };
    }),
    [signals, optionsMap],
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

  const displayed = useMemo(() => {
    const filtered = deduped.filter((s) =>
      activeGrades.has(s.grade) &&
      (!tickerQ || s.ticker.includes(tickerQ.trim())) &&
      (maxDays == null || (s.days_to_earnings != null && s.days_to_earnings <= maxDays)) &&
      (minExpMove == null || (s.expected_move_pct != null && s.expected_move_pct >= minExpMove))
    );
    if (view === 'list') {
      return [...filtered].sort((a, b) => compareSignals(a, b, sortKey, sortDir));
    }
    return filtered;
  }, [enriched, activeGrades, tickerQ, maxDays, view, sortKey, sortDir]);

  const shProps = { sortKey, sortDir, onSort: handleSort };

  return (
    <div className="mx-auto max-w-7xl p-3 sm:p-4 lg:p-8">

      {/* Page header */}
      <div className="mb-6 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-[#0a1624] p-6 lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1 text-xs uppercase tracking-[0.2em] text-violet-300">
              Quantified Edge
            </div>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">Pre-Earnings Runners</h1>
            {!loading && (
              <p className="mt-2 text-sm text-slate-400">
                <span className="font-semibold text-white">{uniqueTickers}</span> tickers reporting in the next 22 days
              </p>
            )}
          </div>
          <div className="flex self-start rounded-2xl border border-white/10 bg-black/30 p-1 lg:self-auto">
            {['Both', 'Recovery', 'Momentum'].map((m) => (
              <button
                key={m}
                onClick={() => setModel(m)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                  model === m
                    ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!isSummary && (
        <button
          onClick={() => setParams({})}
          className="mb-5 flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          ← Back to Summary
        </button>
      )}

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 py-4 text-sm text-rose-300">
          Failed to load signals: {error}
        </div>
      )}

      {/* Summary: grade bucket cards */}
      {isSummary && (
        <>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Signals by Grade</h2>
            <button
              onClick={() => setParams({ grade: 'all' })}
              className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              View all →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-44 animate-pulse rounded-3xl bg-white/5" />
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
        </>
      )}

      {/* Signal list / cards */}
      {!isSummary && (
        <>
          {/* Toolbar */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">
                {loading ? '…' : `${displayed.length} signal${displayed.length !== 1 ? 's' : ''}${displayed.length < deduped.length ? ` of ${deduped.length}` : ''}`}
              </span>
              {optionsLoading && (
                <span className="text-[10px] text-slate-600 animate-pulse">loading market data…</span>
              )}
            </div>
            <div className="flex rounded-xl border border-white/10 bg-black/30 p-0.5 text-xs font-semibold">
              <button
                onClick={() => setView('card')}
                className={`rounded-lg px-3 py-1.5 transition-all ${view === 'card' ? 'bg-violet-500 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                ⊞ Card
              </button>
              <button
                onClick={() => setView('list')}
                className={`rounded-lg px-3 py-1.5 transition-all ${view === 'list' ? 'bg-violet-500 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                ☰ List
              </button>
            </div>
          </div>

          {/* Filter bar */}
          {!loading && (
            <FilterBar
              tickerQ={tickerQ}
              setTickerQ={setTickerQ}
              activeGrades={activeGrades}
              toggleGrade={toggleGrade}
              maxDays={maxDays}
              setMaxDays={setMaxDays}
              minExpMove={minExpMove}
              setMinExpMove={setMinExpMove}
              total={deduped.length}
              filtered={displayed.length}
            />
          )}

          {/* Card view */}
          {view === 'card' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-56 animate-pulse rounded-3xl bg-white/5" />
                  ))
                : displayed.length === 0
                  ? (
                      <div className="col-span-full rounded-3xl border border-white/10 bg-[#0b1420] px-8 py-14 text-center text-slate-500">
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
            <div className="rounded-3xl border border-white/10 bg-[#0b1420] overflow-hidden">
              {loading ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-10 animate-pulse rounded-xl bg-white/5" />
                  ))}
                </div>
              ) : displayed.length === 0 ? (
                <div className="px-8 py-14 text-center text-slate-500">
                  No signals match the current filters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <SortTh label="Ticker"    sk="ticker"            {...shProps} className="pl-4 pr-3 text-left" />
                        <SortTh label="Grade"     sk="grade"             {...shProps} className="px-3 text-center" />
                        <SortTh label="Score"     sk="score"             {...shProps} className="px-3 text-center" />
                        <SortTh label="Earnings"  sk="earnings_date"     {...shProps} className="px-3 text-center" />
                        <SortTh label="Entry"     sk="entry_date"        {...shProps} className="px-3 text-center" />
                        <SortTh label="Exp Move %" sk="expected_move_pct"{...shProps} className="px-3 text-center" />
                        <SortTh label="Exp Move $" sk="expected_move_usd"{...shProps} className="px-3 text-center" />
                        <SortTh label="IV"        sk="iv"                {...shProps} className="px-3 text-center" />
                        <SortTh label="Spot"      sk="spot_price"        {...shProps} className="px-3 text-center" />
                        <SortTh label="Closest Expiry" sk="dte"          {...shProps} className="px-3 pr-4 text-center" />
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
        </>
      )}
    </div>
  );
}
