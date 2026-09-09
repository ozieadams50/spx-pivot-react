import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

const SENTIMENTS = {
  'Bullish':            { icon: '🟢', color: 'text-[var(--c-emerald)]', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
  'Neutral to Bullish': { icon: '🟡', color: 'text-lime-400',    border: 'border-lime-500/30',    bg: 'bg-lime-500/10'    },
  'Neutral':            { icon: '⚪', color: 'text-[var(--c-text-secondary)]',   border: 'border-slate-500/30',   bg: 'bg-slate-500/10'   },
  'Bearish to Neutral': { icon: '🟠', color: 'text-[var(--c-orange-strong)]',  border: 'border-orange-500/30',  bg: 'bg-orange-500/10'  },
  'Bearish':            { icon: '🔴', color: 'text-[var(--c-rose)]',    border: 'border-rose-500/30',    bg: 'bg-rose-500/10'    },
};

// The AI draft template (sentiment_draft.py build_draft()) always uses these
// exact ALL-CAPS section labels, each on its own line — used to split one
// long commentary blob into labeled, individually readable sections instead
// of one run-on paragraph.
const SECTION_HEADERS = [
  'GEOPOLITICAL', 'INTERNATIONAL MARKETS', 'TECHNICAL', 'MARKET REGIME',
  'GOVERNMENT REPORTS', 'ECONOMY, MARKETS & FINANCE', 'MARKET PULSE',
  'CATALYSTS', 'MARKET NARRATIVE (reference)',
];

function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function parseSections(text) {
  if (!text) return [];
  const re = new RegExp(`\\n(${SECTION_HEADERS.map(escapeRegex).join('|')})\\n`, 'g');
  const parts = text.split(re);
  const sections = [];
  for (let i = 1; i < parts.length; i += 2) {
    const title = parts[i];
    let body = (parts[i + 1] || '').trim();
    // Trailing "SUGGESTED SENTIMENT: ..." — already shown as the badge, drop it here.
    body = body.replace(/\n*SUGGESTED SENTIMENT:.*$/s, '').trim();
    if (body) sections.push({ title, body });
  }
  return sections;
}

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

function HistoryEntry({ row }) {
  const [open, setOpen] = useState(false);
  const sections = parseSections(row.commentary);

  return (
    <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-panel)] overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-[var(--c-hover-faint)]"
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-sm font-semibold text-[var(--c-text-primary)]">{row.setDate}</span>
          <span className="rounded-lg border border-[var(--c-border)] bg-[var(--c-hover)] px-2 py-0.5 text-xs capitalize text-[var(--c-text-secondary)]">{row.pivotType}</span>
          <SentimentBadge sentiment={row.sentiment} />
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-[var(--c-text-dimmed)]">{row.setAt?.slice(0, 16).replace('T', ' ')}</span>
          <span className={`text-[var(--c-text-dimmed)] transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-[var(--c-border)] px-5 py-4">
          {sections.length === 0 ? (
            row.commentary
              ? <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--c-text-muted)]">{row.commentary}</p>
              : <p className="text-sm text-[var(--c-text-faint)]">No commentary recorded.</p>
          ) : (
            <div className="space-y-5">
              {sections.map((s, i) => (
                <div key={i}>
                  <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--c-cyan)]">{s.title}</h3>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--c-text-muted)]">{s.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
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
          <p className="mt-1 text-sm text-[var(--c-text-muted)]">Historical record of market sentiment settings and subscriber alerts. Click a row to read the full commentary.</p>
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
        <div className="space-y-2">{Array.from({length:5}).map((_,i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-[var(--c-hover)]"/>)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-panel)] px-6 py-12 text-center">
          <p className="text-sm text-[var(--c-text-dimmed)]">No sentiment records for this range.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((row, i) => <HistoryEntry key={i} row={row} />)}
        </div>
      )}
    </div>
  );
}
