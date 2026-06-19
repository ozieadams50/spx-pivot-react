import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { GRADE_CONFIG } from '../data/earningsConfig';
import PageGuide from '../components/PageGuide';

// ── constants ─────────────────────────────────────────────────────────────────

const GRADES      = ['A+', 'A', 'B', 'C', 'D'];
const GRADE_ORDER = { 'A+': 0, A: 1, B: 2, C: 3, D: 4 };

// ── date helpers ──────────────────────────────────────────────────────────────

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function toYMD(date) {
  return date.toISOString().slice(0, 10);
}

const DAY_LABELS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const MONTH_SHORT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const YEAR_FMT    = new Intl.DateTimeFormat('en-US', { year: 'numeric' });

// ── TickerCard ────────────────────────────────────────────────────────────────

const OUTCOME_CARD = {
  WIN:  'border-emerald-500/40 bg-emerald-500/10',
  LOSS: 'border-rose-500/40 bg-rose-500/10',
};

function TickerCard({ signal, onClick }) {
  const [imgErr, setImgErr] = useState(false);
  const [tip,    setTip]    = useState(false);
  const isPast = signal.outcome !== 'PENDING';
  const cfg    = GRADE_CONFIG[signal.grade] ?? GRADE_CONFIG['D'];
  const cardCls = isPast
    ? (OUTCOME_CARD[signal.outcome] ?? 'border-[var(--c-border)] bg-[var(--c-hover)]')
    : `${cfg.border} bg-gradient-to-b from-[#0d1f2d] to-[#08111c]`;

  return (
    <div className="relative">
      {tip && (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-[var(--c-border)] bg-slate-900 px-3 py-1.5 text-xs shadow-xl">
          <p className="font-semibold text-[var(--c-text-primary)]">{signal.ticker}</p>
          {signal.company_name && <p className="text-[var(--c-text-secondary)] text-[10px]">{signal.company_name}</p>}
          {signal.sector && <p className="text-[var(--c-text-muted)]">{signal.sector}</p>}
          <p className="text-[var(--c-text-dimmed)]">{signal.earnings_quarter}</p>
          {isPast && (
            <p className={`font-bold ${signal.outcome === 'WIN' ? 'text-[var(--c-emerald)]' : 'text-[var(--c-rose)]'}`}>
              {signal.outcome}
            </p>
          )}
        </div>
      )}
      <button
        onClick={onClick}
        onMouseEnter={() => setTip(true)}
        onMouseLeave={() => setTip(false)}
        className={`group relative flex flex-col items-center gap-1 rounded-2xl border p-1.5 transition-all duration-150 hover:scale-105 hover:shadow-lg ${cardCls} ${isPast ? 'opacity-70 hover:opacity-100' : ''}`}
      >
        {isPast && (
          <span className={`absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-black ${
            signal.outcome === 'WIN' ? 'bg-emerald-500 text-[var(--c-text-primary)]' : 'bg-rose-500 text-[var(--c-text-primary)]'
          }`}>
            {signal.outcome === 'WIN' ? '✓' : '✗'}
          </span>
        )}
        {imgErr ? (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--c-hover)] border border-[var(--c-border)]">
            <span className="text-[10px] font-black text-[var(--c-text-secondary)]">{signal.ticker.slice(0, 4)}</span>
          </div>
        ) : (
          <img
            src={`https://assets.parqet.com/logos/symbol/${signal.ticker}?variant=round`}
            alt={signal.ticker}
            className={`h-12 w-12 rounded-xl object-contain bg-[var(--c-hover)] ${isPast ? 'grayscale-[30%]' : ''}`}
            onError={() => setImgErr(true)}
          />
        )}
        <span className={`w-14 truncate text-center text-[10px] font-semibold ${isPast ? 'text-[var(--c-text-muted)]' : 'text-[var(--c-text-secondary)]'}`}>
          {signal.ticker}
        </span>
      </button>
    </div>
  );
}

// ── DayColumn ─────────────────────────────────────────────────────────────────

function DayColumn({ date, dayIndex, signals, isToday, navigate }) {
  const hasSignals = signals.length > 0;

  return (
    <div className={`flex min-w-0 flex-1 flex-col rounded-2xl border transition-colors ${
      isToday
        ? 'border-violet-500/40 bg-violet-500/5'
        : hasSignals
          ? 'border-[var(--c-border)] bg-[var(--c-bg-card)]'
          : 'border-[var(--c-border-subtle)] bg-[var(--c-bg-alt2)] opacity-60'
    }`}>
      <div className={`rounded-t-2xl px-2 py-2.5 text-center ${isToday ? 'bg-violet-500/10' : ''}`}>
        <p className={`text-[10px] font-semibold uppercase tracking-widest ${isToday ? 'text-[var(--c-violet-strong)]' : 'text-[var(--c-text-dimmed)]'}`}>
          {DAY_LABELS[dayIndex]}
        </p>
        {isToday ? (
          <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-lg font-bold leading-none text-[var(--c-text-primary)] shadow-lg shadow-emerald-500/40">
            {date.getDate()}
          </span>
        ) : (
          <p className={`mt-0.5 text-xl font-bold leading-none ${hasSignals ? 'text-[var(--c-text-primary)]' : 'text-[var(--c-text-faint)]'}`}>
            {date.getDate()}
          </p>
        )}

        {/* grade dot indicators */}
        {hasSignals ? (
          <>
            <div className="mt-1.5 flex justify-center flex-wrap gap-0.5 px-1">
              {signals.map((s) => {
                const dot = (GRADE_CONFIG[s.grade] ?? GRADE_CONFIG['D']).dot;
                return (
                  <span
                    key={s.ticker}
                    className={`h-1.5 w-1.5 rounded-full ${dot}`}
                    title={`${s.ticker} (${s.grade})`}
                  />
                );
              })}
            </div>
            <p className="mt-1 text-[9px] font-semibold text-[var(--c-emerald)]">
              {signals.length} ticker{signals.length !== 1 ? 's' : ''}
            </p>
          </>
        ) : (
          <p className="mt-2 text-[9px] text-slate-700">—</p>
        )}
      </div>

      <div className="flex flex-wrap content-start gap-2 p-2" style={{ minHeight: '96px' }}>
        {!hasSignals ? (
          <p className="w-full pt-3 text-center text-[10px] text-slate-700">no signals</p>
        ) : (
          signals.map((s) => (
            <TickerCard
              key={s.ticker}
              signal={s}
              onClick={() =>
                s.outcome !== 'PENDING'
                  ? navigate(`/earnings/${s.ticker}?earningsDate=${s.earnings_date}`)
                  : navigate(`/earnings/${s.ticker}`)
              }
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── SortTh ────────────────────────────────────────────────────────────────────

function SortTh({ label, sk, sortKey, sortDir, onSort, className = '' }) {
  const active = sortKey === sk;
  return (
    <th
      onClick={() => onSort(sk)}
      className={`cursor-pointer select-none py-3 text-xs font-semibold uppercase tracking-wider text-[var(--c-text-muted)] hover:text-[var(--c-text-primary)] transition-colors ${className}`}
    >
      {label}
      <span className="ml-1 text-[9px]">{active ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}</span>
    </th>
  );
}

// ── CalendarListRow ───────────────────────────────────────────────────────────

function CalendarListRow({ signal, navigate }) {
  const cfg    = GRADE_CONFIG[signal.grade] ?? GRADE_CONFIG['D'];
  const isPast = signal.outcome !== 'PENDING';
  const urgent = !isPast && signal.days_to_earnings != null && signal.days_to_earnings <= 5;

  return (
    <tr
      onClick={() =>
        isPast
          ? navigate(`/earnings/${signal.ticker}?earningsDate=${signal.earnings_date}`)
          : navigate(`/earnings/${signal.ticker}`)
      }
      className={`cursor-pointer border-b border-[var(--c-border-subtle)] transition-colors hover:bg-[var(--c-hover)] ${isPast ? 'opacity-60 hover:opacity-100' : ''}`}
    >
      <td className="py-3 pl-4 pr-3">
        <div>
          <span className="font-bold text-[var(--c-text-primary)] text-sm">{signal.ticker}</span>
          {signal.company_name && (
            <p className="text-[10px] text-[var(--c-text-dimmed)] leading-tight">{signal.company_name}</p>
          )}
        </div>
      </td>
      <td className="px-3 py-3 text-center">
        <span className={`inline-flex items-center rounded-xl border px-2.5 py-0.5 text-xs font-bold ${cfg.badge}`}>
          {signal.grade}
        </span>
      </td>
      <td className="px-3 py-3 text-center text-sm text-[var(--c-text-secondary)]">
        {signal.score?.toFixed(2)}
      </td>
      <td className="px-3 py-3 text-center text-sm text-[var(--c-text-secondary)] whitespace-nowrap">
        {signal.earnings_date}
        {!isPast && signal.days_to_earnings != null && (
          <span className={`ml-1.5 text-[10px] font-semibold ${urgent ? 'text-[var(--c-amber-strong)]' : 'text-[var(--c-text-faint)]'}`}>
            {urgent ? `⚡ ${signal.days_to_earnings}d` : `(${signal.days_to_earnings}d)`}
          </span>
        )}
      </td>
      <td className="px-3 py-3 text-center text-sm text-[var(--c-text-secondary)] whitespace-nowrap">
        {signal.entry_date ?? <span className="text-[var(--c-text-faint)]">—</span>}
      </td>
      <td className="px-3 py-3 text-center text-sm text-[var(--c-text-muted)]">
        {signal.sector ?? '—'}
      </td>
      <td className="px-3 py-3 pr-4 text-center">
        {isPast ? (
          <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-bold ${
            signal.outcome === 'WIN'
              ? 'border-emerald-500/30 bg-emerald-500/15 text-[var(--c-emerald)]'
              : 'border-rose-500/30 bg-rose-500/15 text-[var(--c-rose)]'
          }`}>
            {signal.outcome}
          </span>
        ) : (
          <span className="text-xs text-[var(--c-text-faint)]">—</span>
        )}
      </td>
    </tr>
  );
}

// ── EarningsCalendar ──────────────────────────────────────────────────────────

export default function EarningsCalendar() {
  const navigate = useNavigate();
  const today    = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);

  const [weekStart,    setWeekStart]    = useState(() => startOfWeek(today));
  const [model,        setModel]        = useState('Both');
  const [signals,      setSignals]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [view,         setView]         = useState('calendar');
  const [activeGrades, setActiveGrades] = useState(new Set(GRADES));
  const [sortKey,      setSortKey]      = useState('earnings_date');
  const [sortDir,      setSortDir]      = useState('asc');

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiFetch(`/earnings/signals?model=${model}&upcoming_only=false`)
      .then((data) => {
        const map = new Map();
        for (const s of data) {
          const k = `${s.ticker}|${s.earnings_date}`;
          if (!map.has(k) || s.score > map.get(k).score) map.set(k, s);
        }
        setSignals([...map.values()]);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [model]);

  const toggleGrade = useCallback((g) => {
    setActiveGrades((prev) => {
      const next = new Set(prev);
      if (next.has(g)) { if (next.size > 1) next.delete(g); }
      else next.add(g);
      return next;
    });
  }, []);

  const filtered = useMemo(
    () => signals.filter((s) => activeGrades.has(s.grade)),
    [signals, activeGrades],
  );

  const weekDays = useMemo(
    () => Array.from({ length: 5 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const byDate = useMemo(() => {
    const m = {};
    for (const s of filtered) {
      (m[s.earnings_date] ??= []).push(s);
    }
    return m;
  }, [filtered]);

  const prevWeek = useCallback(() => setWeekStart((d) => addDays(d, -7)), []);
  const nextWeek = useCallback(() => setWeekStart((d) => addDays(d,  7)), []);

  const weekLabel = useMemo(() => {
    const end = addDays(weekStart, 4);
    return `${MONTH_SHORT.format(weekStart)} – ${MONTH_SHORT.format(end)}, ${YEAR_FMT.format(weekStart)}`;
  }, [weekStart]);

  const totalThisWeek = useMemo(
    () => weekDays.reduce((n, d) => n + (byDate[toYMD(d)]?.length ?? 0), 0),
    [weekDays, byDate],
  );

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sorted = useMemo(() => {
    if (view !== 'list') return filtered;
    const STRING_KEYS = ['ticker', 'earnings_date', 'entry_date', 'sector'];
    return [...filtered].sort((a, b) => {
      if (sortKey === 'grade') {
        const va = GRADE_ORDER[a.grade] ?? 99;
        const vb = GRADE_ORDER[b.grade] ?? 99;
        return sortDir === 'asc' ? va - vb : vb - va;
      }
      if (STRING_KEYS.includes(sortKey)) {
        const va = (a[sortKey] ?? '').toLowerCase();
        const vb = (b[sortKey] ?? '').toLowerCase();
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      const va = a[sortKey] ?? (sortDir === 'asc' ? Infinity : -Infinity);
      const vb = b[sortKey] ?? (sortDir === 'asc' ? Infinity : -Infinity);
      return sortDir === 'asc' ? va - vb : vb - va;
    });
  }, [filtered, view, sortKey, sortDir]);

  const shProps = { sortKey, sortDir, onSort: handleSort };

  return (
    <div className="mx-auto max-w-7xl p-3 sm:p-4 lg:p-8">

      {/* page header */}
      <div className="mb-6 rounded-3xl border border-[var(--c-border)] bg-gradient-to-br from-[var(--c-bg-gradient-from)] to-[var(--c-bg-gradient-to)] p-6">
        <div className="flex flex-col gap-4">

          {/* title + controls row */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-2 inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-violet)]">
                Quantified Edge
              </div>
              <h1 className="text-3xl font-bold text-[var(--c-text-primary)]">Earnings Calendar</h1>
              {!loading && (
                <p className="mt-1 text-sm text-[var(--c-text-muted)]">
                  {view === 'calendar' ? (
                    <>
                      <span className="font-semibold text-[var(--c-text-primary)]">{totalThisWeek}</span>
                      {' '}scored ticker{totalThisWeek !== 1 ? 's' : ''} reporting this week
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-[var(--c-text-primary)]">{filtered.length}</span>
                      {' '}upcoming ticker{filtered.length !== 1 ? 's' : ''}
                    </>
                  )}
                </p>
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              {/* model toggle */}
              <div className="flex rounded-2xl border border-[var(--c-border)] bg-black/30 p-1">
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

              {/* week nav — calendar view only */}
              {view === 'calendar' && (
                <div className="flex items-center gap-2">
                  <button onClick={prevWeek} className="rounded-xl border border-[var(--c-border)] bg-[var(--c-hover)] px-3 py-2 text-[var(--c-text-secondary)] transition-colors hover:bg-[var(--c-hover-strong)]">←</button>
                  <span className="min-w-[190px] rounded-xl border border-[var(--c-border)] bg-black/20 px-4 py-2 text-center text-sm font-semibold text-[var(--c-text-primary)]">{weekLabel}</span>
                  <button onClick={nextWeek} className="rounded-xl border border-[var(--c-border)] bg-[var(--c-hover)] px-3 py-2 text-[var(--c-text-secondary)] transition-colors hover:bg-[var(--c-hover-strong)]">→</button>
                  <button
                    onClick={() => setWeekStart(startOfWeek(today))}
                    className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-[var(--c-violet)] transition-colors hover:bg-violet-500/20"
                  >
                    Today
                  </button>
                </div>
              )}

              {/* view toggle — smaller, below date nav */}
              <div className="flex rounded-xl border border-[var(--c-border)] bg-black/30 p-0.5">
                {[{ id: 'calendar', label: 'Calendar' }, { id: 'list', label: 'List' }].map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setView(id)}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                      view === id
                        ? 'bg-violet-500 text-[var(--c-text-primary)] shadow shadow-violet-500/20'
                        : 'text-[var(--c-text-muted)] hover:text-[var(--c-text-primary)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* grade filter chips */}
          <div id="pg-cal-filters" className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[var(--c-text-dimmed)] uppercase tracking-wider mr-1">Grade</span>
            {GRADES.map((g) => {
              const cfg = GRADE_CONFIG[g] ?? GRADE_CONFIG['D'];
              const on  = activeGrades.has(g);
              return (
                <button
                  key={g}
                  onClick={() => toggleGrade(g)}
                  className={`rounded-xl border px-3 py-1 text-xs font-bold transition-all ${
                    on ? cfg.badge : 'border-[var(--c-border)] bg-transparent text-[var(--c-text-faint)]'
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>

        </div>
      </div>

      <PageGuide
        guideKey="earnings-calendar"
        accent="violet"
        title="How to use the Earnings Calendar"
        description="This calendar shows every stock our system has scored with an upcoming earnings announcement. Use it to plan your entries for the week ahead — and to review how past signals played out."
        steps={[
          { text: 'Filter by Grade and Model at the top. A+ and A are the strongest setups — start there. The Recovery model looks for stocks that historically bounce before earnings; Momentum looks for stocks already trending up. "Both" shows all signals together.', targetId: 'pg-cal-filters' },
          { text: 'The Calendar view shows this week\'s tickers arranged by day. Each company logo shows a colored dot for its grade. Past earnings show a green ✓ for a WIN or red ✗ for a LOSS — dimmed to show they\'ve already reported. Use the ← → arrows to browse other weeks, or click Today to jump back.', targetId: 'pg-cal-grid' },
          { text: 'Switch to List view to see every upcoming signal in a sortable table — sort by earnings date, grade, score, or sector. Click any row to open that stock\'s full analysis page.', targetId: 'pg-cal-list' },
        ]}
      />

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 py-4 text-sm text-[var(--c-rose-strong)]">
          {error}
        </div>
      )}

      {/* ── CALENDAR VIEW ──────────────────────────────────────────────────── */}
      {view === 'calendar' && (
        <div id="pg-cal-grid" className="flex gap-3">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-64 flex-1 animate-pulse rounded-2xl bg-[var(--c-hover)]" />
              ))
            : weekDays.map((d, i) => (
                <DayColumn
                  key={toYMD(d)}
                  date={d}
                  dayIndex={i}
                  signals={(byDate[toYMD(d)] ?? []).sort(
                    (a, b) => (GRADE_ORDER[a.grade] ?? 99) - (GRADE_ORDER[b.grade] ?? 99),
                  )}
                  isToday={toYMD(d) === toYMD(today)}
                  navigate={navigate}
                />
              ))}
        </div>
      )}

      {/* ── LIST VIEW ──────────────────────────────────────────────────────── */}
      {view === 'list' && (
        <div id="pg-cal-list" className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-card)] overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-[var(--c-text-dimmed)]">Loading…</div>
          ) : sorted.length === 0 ? (
            <div className="p-8 text-center text-[var(--c-text-faint)]">No upcoming signals match the selected grades.</div>
          ) : (
            <table className="w-full">
              <thead className="border-b border-[var(--c-border)] bg-black/20">
                <tr>
                  <SortTh label="Ticker"   sk="ticker"        {...shProps} className="pl-4 pr-3 text-left" />
                  <SortTh label="Grade"    sk="grade"         {...shProps} className="px-3 text-center" />
                  <SortTh label="Score"    sk="score"         {...shProps} className="px-3 text-center" />
                  <SortTh label="Earnings" sk="earnings_date" {...shProps} className="px-3 text-center" />
                  <SortTh label="Entry"    sk="entry_date"    {...shProps} className="px-3 text-center" />
                  <SortTh label="Sector"   sk="sector"        {...shProps} className="px-3 text-center" />
                  <SortTh label="Result"   sk="outcome"       {...shProps} className="px-3 pr-4 text-center" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((s) => (
                  <CalendarListRow
                    key={`${s.ticker}|${s.earnings_date}`}
                    signal={s}
                    navigate={navigate}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

    </div>
  );
}
