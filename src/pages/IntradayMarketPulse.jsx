import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/api';
import DatePicker from '../components/DatePicker';

const POLL_MS = 60_000;

function toYMD(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function fmtDateLabel(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
}

export default function IntradayMarketPulse() {
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewing, setViewing] = useState(null); // et_time string, or null = most recent
  const [selectedDate, setSelectedDate] = useState(null); // Date, or null = live/today

  const loadLive = useCallback(async () => {
    try {
      const [latestRes, historyRes] = await Promise.all([
        apiFetch('/sentiment/market-pulse/latest'),
        apiFetch('/sentiment/market-pulse/today'),
      ]);
      setLatest(latestRes);
      setHistory(historyRes);
      setError('');
    } catch (err) {
      setError(err.message ?? 'Failed to load Market Pulse.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadForDate = useCallback(async (date) => {
    setLoading(true);
    try {
      const historyRes = await apiFetch(`/sentiment/market-pulse/history?session_date=${toYMD(date)}`);
      setHistory(historyRes);
      setLatest(null);
      setError('');
    } catch (err) {
      setError(err.message ?? 'Failed to load Market Pulse history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setViewing(null);
    if (selectedDate) {
      loadForDate(selectedDate);
      return;
    }
    loadLive();
    const id = setInterval(loadLive, POLL_MS);
    return () => clearInterval(id);
  }, [selectedDate, loadLive, loadForDate]);

  const shown = viewing
    ? history.find((h) => h.etTime === viewing)
    : selectedDate
      ? history[history.length - 1]
      : (latest?.available ? latest : null);

  const emptyMessage = selectedDate
    ? `No Market Pulse snapshots found for ${fmtDateLabel(selectedDate)}.`
    : 'No Market Pulse snapshots yet for this session — check back after 6 PM ET the evening before, or 9:15 AM ET on a trading day.';

  const isEmpty = selectedDate ? history.length === 0 : !latest?.available;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--c-text-primary)]">Intraday Market Pulse</h1>
          <p className="mt-1 text-sm text-[var(--c-text-muted)]">
            A cross-asset read — yields, oil, credit, safe-haven flows, and sector rotation — refreshed every 30 minutes during the trading day (9:15 AM–4:00 PM ET) and hourly overnight (6 PM–9 AM ET), with a progressive view and an overall bullish/bearish/neutral read on every snapshot.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {shown && (
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-[var(--c-cyan)]">
              {viewing ? `Viewing ${viewing} ET` : selectedDate ? `Most recent — ${shown.etTime} ET` : `Latest — ${shown.etTime} ET`}
            </span>
          )}
          <DatePicker value={selectedDate} onChange={setSelectedDate} maxDate={new Date()} />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate(null)}
              className="rounded-xl border border-cyan-500/50 bg-cyan-500/15 px-3 py-1.5 text-xs font-medium text-[var(--c-cyan)] transition hover:bg-cyan-500/25"
            >
              Back to Live
            </button>
          )}
        </div>
      </div>

      {selectedDate && (
        <div className="mb-4 rounded-xl border border-[var(--c-border)] bg-[var(--c-hover)] px-4 py-2 text-sm text-[var(--c-text-muted)]">
          Browsing {fmtDateLabel(selectedDate)} — this day's session is fixed and won't auto-refresh.
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--c-hover)]" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 py-8 text-center">
          <p className="text-sm text-[var(--c-rose)]">{error}</p>
        </div>
      ) : isEmpty ? (
        <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-panel)] px-6 py-12 text-center">
          <p className="text-sm text-[var(--c-text-dimmed)]">{emptyMessage}</p>
        </div>
      ) : (
        <>
          {latest?.stale && !viewing && !selectedDate && (
            <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
              Heads up: the most recent snapshot on file is from {latest.snapshotDate} {latest.etTime} ET, more than 90 minutes old. The cron may not have run yet — check back shortly.
            </div>
          )}

          {history.length > 0 && (
            <div className="mb-5 flex flex-wrap gap-2">
              <button
                onClick={() => setViewing(null)}
                className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                  !viewing
                    ? 'border-cyan-500/50 bg-cyan-500/15 text-[var(--c-cyan)]'
                    : 'border-[var(--c-border)] bg-[var(--c-hover)] text-[var(--c-text-muted)] hover:border-cyan-500/30 hover:text-[var(--c-cyan)]'
                }`}
              >
                {selectedDate ? 'Most Recent' : 'Latest'}
              </button>
              {history.map((h) => (
                <button
                  key={h.etTime}
                  onClick={() => setViewing(h.etTime)}
                  title={h.mode === 'overnight' ? 'Overnight snapshot' : 'Intraday snapshot'}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-mono transition ${
                    viewing === h.etTime
                      ? 'border-cyan-500/50 bg-cyan-500/15 text-[var(--c-cyan)]'
                      : 'border-[var(--c-border)] bg-[var(--c-hover)] text-[var(--c-text-muted)] hover:border-cyan-500/30 hover:text-[var(--c-cyan)]'
                  }`}
                >
                  {h.mode === 'overnight' ? '☾ ' : ''}{h.etTime}
                </button>
              ))}
            </div>
          )}

          {shown && (
            <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-panel)] p-6">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-[var(--c-text-secondary)]">
                {shown.commentary}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}
