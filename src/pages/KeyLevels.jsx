import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/api';
import PageGuide from '../components/PageGuide';
import DatePicker from '../components/DatePicker';

const PERIOD_MODES = ['Monthly', 'Weekly', 'Daily'];
const MODE_MAP = { Monthly: 'monthly', Weekly: 'weekly', Daily: 'daily' };

const MIN_DATE = new Date(2012, 5, 1); // 2012-06-01, matches backend data floor

function toYMD(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function fmtDateLabel(isoDate) {
  if (!isoDate) return '—';
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function levelTone(tag, isBand) {
  if (isBand) return 'border-sky-500/30 bg-sky-500/[0.06]';
  if (tag.includes('resistance')) return 'border-rose-500/20 bg-rose-500/[0.04]';
  if (tag.includes('support') || tag.includes('target')) return 'border-emerald-500/20 bg-emerald-500/[0.04]';
  return 'border-[var(--c-border-subtle)] bg-black/20';
}

function levelValueClass(tag, isBand) {
  if (isBand) return 'text-[var(--c-sky)]';
  if (tag.includes('resistance')) return 'text-[var(--c-rose-strong)]';
  if (tag.includes('support') || tag.includes('target')) return 'text-[var(--c-emerald-strong)]';
  return 'text-[var(--c-text-primary)]';
}

export default function KeyLevels() {
  const [period,       setPeriod]       = useState('Weekly');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [data,         setData]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  const fetchLevels = useCallback((periodParam, dateStr, signal) => {
    setLoading(true);
    setError(null);
    apiFetch(`/key-levels/spx?period=${periodParam}&date=${dateStr}`, { signal })
      .then((raw) => { if (raw) setData(raw); })
      .catch((err) => { if (err?.name !== 'AbortError') setError(err.message); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchLevels(MODE_MAP[period], toYMD(selectedDate), controller.signal);
    return () => controller.abort();
  }, [period, selectedDate, fetchLevels]);

  const levels = data?.levels ?? [];
  let priceInserted = false;

  return (
    <div className="mx-auto max-w-4xl p-3 sm:p-4 lg:p-8">
      <div className="mb-6 rounded-3xl border border-[var(--c-border)] bg-gradient-to-br from-[var(--c-bg-gradient-from)] to-[var(--c-bg-gradient-to)] p-4 lg:p-8">
        <div className="mb-3 inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-cyan)]">
          SPX Key Levels
        </div>
        <h1 className="text-3xl font-bold text-[var(--c-text-primary)] sm:text-4xl">Key Levels</h1>
        <p className="mt-2 text-sm text-[var(--c-text-muted)]">
          Look back at any past trading day and see the support, resistance, and expected-move levels for that date.
        </p>
      </div>

      <PageGuide
        guideKey="key-levels"
        accent="cyan"
        title="See SPX's key price levels for any past trading day."
        description="Pick a date and a timeframe to see the price zones that mattered that day — support and resistance levels, plus the expected trading range."
        steps={[
          { text: 'Pick a date on the calendar. You can look back to any trading day.', targetId: 'pg-date-picker' },
          { text: 'Choose Monthly, Weekly, or Daily to widen or narrow the expected trading range shown.', targetId: 'pg-period-modes' },
          { text: 'The level list shows where SPX closed that day, alongside the support and resistance zones around it.', targetId: 'pg-level-list' },
        ]}
      />

      <div id="pg-date-picker" className="mb-4 flex flex-wrap items-center gap-3">
        <DatePicker value={selectedDate} onChange={setSelectedDate} minDate={MIN_DATE} maxDate={new Date()} />
      </div>

      <div id="pg-period-modes" className="mb-6 grid grid-cols-1 gap-3 rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-card)] p-3 sm:grid-cols-3">
        {PERIOD_MODES.map((mode) => (
          <button
            key={mode}
            onClick={() => setPeriod(mode)}
            className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
              period === mode
                ? 'bg-[var(--c-btn-bg)] text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'border border-[var(--c-border)] bg-[var(--c-hover)] text-[var(--c-text-secondary)] hover:bg-cyan-500/10 hover:text-cyan-200'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {error && !loading && (
        <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 py-4 text-[var(--c-rose-strong)]">
          Failed to load key levels: {error}
        </div>
      )}

      {!loading && data?.snappedToPriorTradingDay && (
        <div className="mb-6 rounded-2xl border border-sky-500/30 bg-sky-500/10 px-6 py-4 text-[var(--c-sky)]">
          Showing levels as of {fmtDateLabel(data.resolvedDate)} — the nearest prior trading day.
        </div>
      )}

      {!loading && data && !data.emAvailable && (
        <div className="mb-6 rounded-2xl border border-[var(--c-border)] bg-black/20 px-6 py-4 text-sm text-[var(--c-text-muted)]">
          The expected trading range isn't available for this date, but the levels below are still shown.
        </div>
      )}

      <div id="pg-level-list" className="overflow-hidden rounded-[32px] border border-[var(--c-border)] bg-[var(--c-bg-card)] shadow-2xl">
        <div className="border-b border-[var(--c-border)] px-6 py-5">
          {loading ? (
            <>
              <div className="mb-2 h-7 w-48 animate-pulse rounded-xl bg-[var(--c-hover-strong)]" />
              <div className="h-4 w-32 animate-pulse rounded-lg bg-[var(--c-hover-strong)]" />
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-[var(--c-text-primary)]">
                {data?.spx != null ? data.spx.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'}
              </h2>
              <p className="mt-1 text-sm text-[var(--c-text-muted)]">
                SPX close — {fmtDateLabel(data?.resolvedDate)}
              </p>
            </>
          )}
        </div>

        <div className="divide-y divide-[var(--c-border-subtle)]">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-6 py-4">
                <div className="h-5 w-full animate-pulse rounded bg-[var(--c-hover-strong)]" />
              </div>
            ))
          ) : levels.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-[var(--c-text-muted)]">
              No key levels available for this date.
            </div>
          ) : (
            levels.map((lvl, i) => {
              const rows = [];
              if (!priceInserted && data?.spx != null && lvl.value < data.spx) {
                priceInserted = true;
                rows.push(
                  <div key="current-price" className="flex items-center justify-between border-l-4 border-l-cyan-400 bg-cyan-500/[0.06] px-6 py-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Current Price</span>
                    <span className="font-mono text-sm font-bold text-cyan-300">
                      {data.spx.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                );
              }
              rows.push(
                <div key={i} className={`flex items-center justify-between border-l-4 px-6 py-3 ${levelTone(lvl.tag, lvl.isBand)}`}>
                  <div>
                    <p className="text-sm font-semibold text-[var(--c-text-primary)]">{lvl.label}</p>
                    <p className="text-xs text-[var(--c-text-dimmed)]">{lvl.tag}</p>
                  </div>
                  <span className={`font-mono text-sm font-bold ${levelValueClass(lvl.tag, lvl.isBand)}`}>
                    {lvl.isBand ? '~' : ''}{lvl.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              );
              return rows;
            })
          )}
        </div>
      </div>
    </div>
  );
}
