import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}

function CommentaryCard({ entry }) {
  const [expanded, setExpanded] = useState(false);
  const isLong    = entry.body.length > 200;
  const displayed = expanded || !isLong ? entry.body : entry.body.slice(0, 200) + '…';

  return (
    <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-panel)] p-5">
      <div className="mb-2 flex items-start justify-between gap-4">
        <p className="font-semibold text-[var(--c-text-primary)]">{entry.subject}</p>
        <span className="shrink-0 text-xs text-[var(--c-text-dimmed)]">{formatDate(entry.sentAt)}</span>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--c-text-secondary)]">{displayed}</p>
      {isLong && (
        <button onClick={() => setExpanded((e) => !e)} className="mt-2 text-xs text-[var(--c-cyan-strong)] hover:text-[var(--c-cyan)]">
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
      <div className="mt-3 flex gap-2">
        {['SPX_Daily', 'SPX_Weekly', 'SPX_Monthly'].map((t) => (
          <span key={t} className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-xs text-[var(--c-cyan-strong)]">{t}</span>
        ))}
      </div>
    </div>
  );
}

export default function CommentaryHistory() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/commentary')
      .then(setEntries)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--c-text-primary)]">Commentary History</h1>
          <p className="mt-1 text-sm text-[var(--c-text-muted)]">Archive of commentary sent to all subscribers — most recent first.</p>
        </div>
        <span className="rounded-full border border-[var(--c-border)] bg-[var(--c-hover)] px-3 py-1 text-xs text-[var(--c-text-muted)]">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {loading ? (
        <div className="space-y-3 max-w-2xl">{Array.from({length:3}).map((_,i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-[var(--c-hover)]"/>)}</div>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-panel)] px-6 py-12 text-center">
          <p className="text-sm text-[var(--c-text-dimmed)]">No commentaries sent yet.</p>
        </div>
      ) : (
        <div className="max-w-2xl space-y-4">
          {entries.map((e) => <CommentaryCard key={e.id} entry={e} />)}
        </div>
      )}
    </div>
  );
}
