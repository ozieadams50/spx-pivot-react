import { useState, useEffect } from 'react';

const SENTIMENTS = {
  'Bullish':            { icon: '🟢', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
  'Neutral to Bullish': { icon: '🟡', color: 'text-lime-400',    border: 'border-lime-500/30',    bg: 'bg-lime-500/10'    },
  'Neutral':            { icon: '⚪', color: 'text-slate-300',   border: 'border-slate-500/30',   bg: 'bg-slate-500/10'   },
  'Bearish to Neutral': { icon: '🟠', color: 'text-orange-400',  border: 'border-orange-500/30',  bg: 'bg-orange-500/10'  },
  'Bearish':            { icon: '🔴', color: 'text-rose-400',    border: 'border-rose-500/30',    bg: 'bg-rose-500/10'    },
};

function thirtyDaysAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatSetAt(iso) {
  if (!iso) return '—';
  return iso.slice(0, 16).replace('T', ' ');
}

function SentimentBadge({ sentiment }) {
  const def = SENTIMENTS[sentiment];
  if (!def) return <span className="text-slate-500">{sentiment}</span>;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${def.border} ${def.bg} ${def.color}`}
    >
      {def.icon} {sentiment}
    </span>
  );
}

export default function SentimentHistory() {
  const [all,       setAll]       = useState([]);
  const [pivot,     setPivot]     = useState('All');
  const [fromDate,  setFromDate]  = useState(thirtyDaysAgo());
  const [filtered,  setFiltered]  = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('sentiment_history') || '[]');
    setAll(stored);
  }, []);

  useEffect(() => {
    let rows = all.filter((r) => r.set_date >= fromDate);
    if (pivot !== 'All') rows = rows.filter((r) => r.pivot_type === pivot.toLowerCase());
    rows = [...rows].sort((a, b) => {
      if (b.set_date !== a.set_date) return b.set_date.localeCompare(a.set_date);
      return a.pivot_type.localeCompare(b.pivot_type);
    });
    setFiltered(rows);
  }, [all, pivot, fromDate]);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Sentiment History</h1>
          <p className="mt-1 text-sm text-slate-400">
            Historical record of market sentiment settings and subscriber alerts.
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
          {filtered.length} {filtered.length === 1 ? 'record' : 'records'}
        </span>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">Pivot</label>
          <div className="flex gap-2">
            {['All', 'Daily', 'Weekly', 'Monthly'].map((p) => (
              <button
                key={p}
                onClick={() => setPivot(p)}
                className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                  pivot === p
                    ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:border-cyan-500/30 hover:text-cyan-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">From</label>
          <input
            type="date"
            value={fromDate}
            max={todayISO()}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-xl border border-white/10 bg-[#0d1f2d] px-4 py-1.5 text-sm text-white outline-none transition focus:border-cyan-500/50"
          />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#0d1f2d] px-6 py-12 text-center">
          <p className="text-sm text-slate-500">No sentiment records for this range.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1f2d]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Pivot</th>
                <th className="px-5 py-3">Sentiment</th>
                <th className="px-5 py-3">Set At</th>
                <th className="px-5 py-3">Commentary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((row, i) => (
                <tr key={i} className="transition hover:bg-white/[0.03]">
                  <td className="px-5 py-3 font-mono text-slate-300">{row.set_date}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-xs capitalize text-slate-300">
                      {row.pivot_type}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <SentimentBadge sentiment={row.sentiment} />
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">
                    {formatSetAt(row.set_at)}
                  </td>
                  <td className="px-5 py-3 text-slate-400">
                    {row.commentary || <span className="text-slate-600">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
