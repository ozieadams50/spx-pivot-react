import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

const SENTIMENTS = {
  'Bullish':            { icon: '🟢', color: 'text-[var(--c-emerald)]', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
  'Neutral to Bullish': { icon: '🟡', color: 'text-lime-400',    border: 'border-lime-500/30',    bg: 'bg-lime-500/10'    },
  'Neutral':            { icon: '⚪', color: 'text-[var(--c-text-secondary)]',   border: 'border-slate-500/30',   bg: 'bg-slate-500/10'   },
  'Bearish to Neutral': { icon: '🟠', color: 'text-[var(--c-orange-strong)]',  border: 'border-orange-500/30',  bg: 'bg-orange-500/10'  },
  'Bearish':            { icon: '🔴', color: 'text-[var(--c-rose)]',    border: 'border-rose-500/30',    bg: 'bg-rose-500/10'    },
};

function thirtyDaysAgo() {
  const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10);
}
function todayISO() { return new Date().toISOString().slice(0, 10); }

function SentimentBadge({ sentiment }) {
  const def = SENTIMENTS[sentiment];
  if (!def) return <span className="text-[var(--c-text-dimmed)]">{sentiment}</span>;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${def.border} ${def.bg} ${def.color}`}>
      {def.icon} {sentiment}
    </span>
  );
}

export default function SentimentHistory() {
  const [all,      setAll]      = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [pivot,    setPivot]    = useState('All');
  const [fromDate, setFromDate] = useState(thirtyDaysAgo());

  useEffect(() => {
    apiFetch('/sentiment/spx/history')
      .then(setAll)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  let filtered = all.filter((r) => r.setDate >= fromDate);
  if (pivot !== 'All') filtered = filtered.filter((r) => r.pivotType === pivot.toLowerCase());
  filtered = [...filtered].sort((a, b) => {
    if (b.setDate !== a.setDate) return b.setDate.localeCompare(a.setDate);
    return a.pivotType.localeCompare(b.pivotType);
  });

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--c-text-primary)]">Sentiment History</h1>
          <p className="mt-1 text-sm text-[var(--c-text-muted)]">Historical record of market sentiment settings and subscriber alerts.</p>
        </div>
        <span className="rounded-full border border-[var(--c-border)] bg-[var(--c-hover)] px-3 py-1 text-xs text-[var(--c-text-muted)]">
          {filtered.length} {filtered.length === 1 ? 'record' : 'records'}
        </span>
      </div>

      <div className="mb-5 flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--c-text-secondary)]">Pivot</label>
          <div className="flex gap-2">
            {['All', 'Daily', 'Weekly', 'Monthly'].map((p) => (
              <button key={p} onClick={() => setPivot(p)}
                className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                  pivot === p ? 'border-cyan-500/50 bg-cyan-500/15 text-[var(--c-cyan)]' : 'border-[var(--c-border)] bg-[var(--c-hover)] text-[var(--c-text-muted)] hover:border-cyan-500/30 hover:text-[var(--c-cyan)]'
                }`}>{p}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--c-text-secondary)]">From</label>
          <input type="date" value={fromDate} max={todayISO()} onChange={(e) => setFromDate(e.target.value)}
            className="rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-panel)] px-4 py-1.5 text-sm text-[var(--c-text-primary)] outline-none transition focus:border-cyan-500/50" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({length:5}).map((_,i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-[var(--c-hover)]"/>)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-panel)] px-6 py-12 text-center">
          <p className="text-sm text-[var(--c-text-dimmed)]">No sentiment records for this range.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-panel)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--c-border)] text-left text-xs font-semibold uppercase tracking-wider text-[var(--c-text-dimmed)]">
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Pivot</th>
                <th className="px-5 py-3">Sentiment</th>
                <th className="px-5 py-3">Set At</th>
                <th className="px-5 py-3">Commentary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((row, i) => (
                <tr key={i} className="transition hover:bg-[var(--c-hover-faint)]">
                  <td className="px-5 py-3 font-mono text-[var(--c-text-secondary)]">{row.setDate}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-lg border border-[var(--c-border)] bg-[var(--c-hover)] px-2 py-0.5 text-xs capitalize text-[var(--c-text-secondary)]">{row.pivotType}</span>
                  </td>
                  <td className="px-5 py-3"><SentimentBadge sentiment={row.sentiment} /></td>
                  <td className="px-5 py-3 font-mono text-xs text-[var(--c-text-dimmed)]">{row.setAt?.slice(0, 16).replace('T', ' ')}</td>
                  <td className="px-5 py-3 text-[var(--c-text-muted)]">{row.commentary || <span className="text-[var(--c-text-faint)]">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
