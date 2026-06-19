import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

const SENTIMENTS = [
  { label: 'Bullish',            icon: '🟢', color: 'text-[var(--c-emerald)]', border: 'border-emerald-500/40', bg: 'bg-emerald-500/10', active: 'border-emerald-400 bg-emerald-500/20' },
  { label: 'Neutral to Bullish', icon: '🟡', color: 'text-lime-400',    border: 'border-lime-500/40',    bg: 'bg-lime-500/10',    active: 'border-lime-400 bg-lime-500/20'    },
  { label: 'Neutral',            icon: '⚪', color: 'text-[var(--c-text-secondary)]',   border: 'border-slate-500/40',   bg: 'bg-slate-500/10',   active: 'border-slate-400 bg-slate-500/20'  },
  { label: 'Bearish to Neutral', icon: '🟠', color: 'text-[var(--c-orange-strong)]',  border: 'border-orange-500/40',  bg: 'bg-orange-500/10',  active: 'border-orange-400 bg-orange-500/20'},
  { label: 'Bearish',            icon: '🔴', color: 'text-[var(--c-rose)]',    border: 'border-rose-500/40',    bg: 'bg-rose-500/10',    active: 'border-rose-400 bg-rose-500/20'    },
];

const TOPICS = { daily: 'SPX_Daily', weekly: 'SPX_Weekly', monthly: 'SPX_Monthly' };

function todayISO() { return new Date().toISOString().slice(0, 10); }

export default function SetMarketSentiment() {
  const [pivot,      setPivot]      = useState('Weekly');
  const [date,       setDate]       = useState(todayISO());
  const [sentiment,  setSentiment]  = useState('');
  const [commentary, setCommentary] = useState('');
  const [current,    setCurrent]    = useState(null);
  const [success,    setSuccess]    = useState('');
  const [error,      setError]      = useState('');
  const [saving,     setSaving]     = useState(false);

  // Load current sentiment for selected pivot
  useEffect(() => {
    setCurrent(null); setSuccess(''); setError('');
    apiFetch('/sentiment/spx')
      .then((data) => setCurrent(data[pivot.toLowerCase()] ?? null))
      .catch(() => {});
  }, [pivot, date]);

  async function handleSubmit() {
    setError(''); setSuccess('');
    if (!sentiment) { setError('Please select a market sentiment.'); return; }
    setSaving(true);
    try {
      await apiFetch('/sentiment/spx', {
        method: 'POST',
        body: JSON.stringify({ pivotType: pivot.toLowerCase(), sentiment, commentary }),
      });
      // Refresh current
      const data = await apiFetch('/sentiment/spx');
      setCurrent(data[pivot.toLowerCase()] ?? null);
      const topic = TOPICS[pivot.toLowerCase()] ?? `SPX_${pivot}`;
      setSuccess(`${pivot} sentiment set to "${sentiment}". Alert sent to ${topic} subscribers.`);
      setCommentary('');
    } catch (err) {
      setError(err.message ?? 'Failed to save sentiment.');
    } finally {
      setSaving(false);
    }
  }

  const currentDef = current ? SENTIMENTS.find((s) => s.label === current.sentiment) : null;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--c-text-primary)]">Set Market Sentiment</h1>
        <p className="mt-1 text-sm text-[var(--c-text-muted)]">
          Set once per pivot period. Filters the spread type shown to subscribers and fires an alert to that period's timeframe topic.
        </p>
      </div>

      <div className="max-w-2xl rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-panel)] p-6 shadow-lg">

        <div className="mb-5 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--c-text-secondary)]">Pivot Timeframe</label>
            <div className="flex gap-2">
              {['Daily', 'Weekly', 'Monthly'].map((p) => (
                <button key={p} onClick={() => setPivot(p)}
                  className={`flex-1 rounded-xl border py-2 text-xs font-medium transition ${
                    pivot === p ? 'border-cyan-500/50 bg-cyan-500/15 text-[var(--c-cyan)]' : 'border-[var(--c-border)] bg-[var(--c-hover)] text-[var(--c-text-muted)] hover:border-cyan-500/30 hover:text-[var(--c-cyan)]'
                  }`}>{p}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--c-text-secondary)]">Date</label>
            <input type="date" value={date} max={todayISO()} min="2023-01-01"
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-page)] px-4 py-2 text-sm text-[var(--c-text-primary)] outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30" />
          </div>
        </div>

        <div className="mb-5">
          <label className="mb-2 block text-xs font-medium text-[var(--c-text-secondary)]">Market Sentiment</label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {SENTIMENTS.map((s) => {
              const isActive = sentiment === s.label;
              return (
                <button key={s.label} onClick={() => setSentiment(s.label)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition ${
                    isActive ? `${s.active} ${s.color} font-semibold` : `${s.border} ${s.bg} text-[var(--c-text-muted)] hover:${s.color}`
                  }`}>
                  <span>{s.icon}</span><span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium text-[var(--c-text-secondary)]">
            Commentary <span className="font-normal text-[var(--c-text-dimmed)]">(optional — included in subscriber alert)</span>
          </label>
          <textarea value={commentary} onChange={(e) => setCommentary(e.target.value)} rows={3}
            placeholder="Add context for subscribers..."
            className="w-full resize-y rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-page)] px-4 py-2.5 text-sm text-[var(--c-text-primary)] placeholder-[var(--c-text-faint)] outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30" />
        </div>

        {current && currentDef && (
          <div className={`mb-4 flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm ${currentDef.border} ${currentDef.bg}`}>
            <span>{currentDef.icon}</span>
            <span className={`font-medium ${currentDef.color}`}>Currently stored: {current.sentiment}</span>
            <span className="ml-auto text-xs text-[var(--c-text-dimmed)]">{current.setAt?.slice(0, 16).replace('T', ' ')}</span>
          </div>
        )}

        {error   && <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-[var(--c-rose-strong)]">{error}</div>}
        {success && <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-[var(--c-emerald-strong)]">{success}</div>}

        <button onClick={handleSubmit} disabled={saving}
          className="w-full rounded-xl bg-[var(--c-btn-bg)] px-4 py-2.5 text-sm font-semibold text-[var(--c-btn-text)] transition hover:bg-[var(--c-btn-hover)] disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? 'Saving...' : 'Set Sentiment & Notify Subscribers'}
        </button>
      </div>
    </div>
  );
}
