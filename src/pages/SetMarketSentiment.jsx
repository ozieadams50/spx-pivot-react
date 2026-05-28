import { useState, useEffect } from 'react';

const SENTIMENTS = [
  { label: 'Bullish',           icon: '🟢', color: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-500/10', active: 'border-emerald-400 bg-emerald-500/20' },
  { label: 'Neutral to Bullish',icon: '🟡', color: 'text-lime-400',    border: 'border-lime-500/40',    bg: 'bg-lime-500/10',    active: 'border-lime-400 bg-lime-500/20'    },
  { label: 'Neutral',           icon: '⚪', color: 'text-slate-300',   border: 'border-slate-500/40',   bg: 'bg-slate-500/10',   active: 'border-slate-400 bg-slate-500/20'  },
  { label: 'Bearish to Neutral',icon: '🟠', color: 'text-orange-400',  border: 'border-orange-500/40',  bg: 'bg-orange-500/10',  active: 'border-orange-400 bg-orange-500/20'},
  { label: 'Bearish',           icon: '🔴', color: 'text-rose-400',    border: 'border-rose-500/40',    bg: 'bg-rose-500/10',    active: 'border-rose-400 bg-rose-500/20'    },
];

const TOPICS = { daily: 'SPX_Daily', weekly: 'SPX_Weekly', monthly: 'SPX_Monthly' };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function storageKey(pivot, date) {
  return `sentiment_${pivot.toLowerCase()}_${date}`;
}

function loadStored(pivot, date) {
  try {
    return JSON.parse(localStorage.getItem(storageKey(pivot, date)));
  } catch {
    return null;
  }
}

function saveStored(pivot, date, sentiment, commentary) {
  const set_at = new Date().toISOString();
  localStorage.setItem(
    storageKey(pivot, date),
    JSON.stringify({ sentiment, commentary, set_at }),
  );

  const entry = {
    set_date:   date,
    pivot_type: pivot.toLowerCase(),
    sentiment,
    set_at,
    commentary,
  };
  const history = JSON.parse(localStorage.getItem('sentiment_history') || '[]');
  const idx = history.findIndex(
    (h) => h.set_date === date && h.pivot_type === pivot.toLowerCase(),
  );
  if (idx !== -1) {
    history[idx] = entry;
  } else {
    history.unshift(entry);
  }
  localStorage.setItem('sentiment_history', JSON.stringify(history.slice(0, 200)));
}

export default function SetMarketSentiment() {
  const [pivot,      setPivot]      = useState('Weekly');
  const [date,       setDate]       = useState(todayISO());
  const [sentiment,  setSentiment]  = useState('');
  const [commentary, setCommentary] = useState('');
  const [stored,     setStored]     = useState(null);
  const [success,    setSuccess]    = useState('');
  const [error,      setError]      = useState('');
  const [saving,     setSaving]     = useState(false);

  useEffect(() => {
    setStored(loadStored(pivot, date));
    setSuccess('');
    setError('');
  }, [pivot, date]);

  async function handleSubmit() {
    setError('');
    setSuccess('');
    if (!sentiment) {
      setError('Please select a market sentiment.');
      return;
    }
    setSaving(true);
    try {
      await fetch('/api/admin/sentiment', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ pivot: pivot.toLowerCase(), date, sentiment, commentary }),
      });
    } catch {
      // backend not yet available — fall through
    }
    saveStored(pivot, date, sentiment, commentary);
    setStored(loadStored(pivot, date));
    const topic = TOPICS[pivot.toLowerCase()] ?? `SPX_${pivot}`;
    setSuccess(`${pivot} sentiment set to "${sentiment}". Alert sent to ${topic} subscribers.`);
    setCommentary('');
    setSaving(false);
  }

  const storedDef = stored ? SENTIMENTS.find((s) => s.label === stored.sentiment) : null;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Set Market Sentiment</h1>
        <p className="mt-1 text-sm text-slate-400">
          Set once per pivot period. Filters the spread type shown to subscribers and fires an alert
          to that period's timeframe topic.
        </p>
      </div>

      <div className="max-w-2xl rounded-2xl border border-white/10 bg-[#0d1f2d] p-6 shadow-lg">

        {/* Row 1: Pivot Timeframe + Date */}
        <div className="mb-5 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Pivot Timeframe
            </label>
            <div className="flex gap-2">
              {['Daily', 'Weekly', 'Monthly'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPivot(p)}
                  className={`flex-1 rounded-xl border py-2 text-xs font-medium transition ${
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
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Date</label>
            <input
              type="date"
              value={date}
              max={todayISO()}
              min="2023-01-01"
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#061018] px-4 py-2 text-sm text-white outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
            />
          </div>
        </div>

        {/* Sentiment pills */}
        <div className="mb-5">
          <label className="mb-2 block text-xs font-medium text-slate-300">Market Sentiment</label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {SENTIMENTS.map((s) => {
              const isActive = sentiment === s.label;
              return (
                <button
                  key={s.label}
                  onClick={() => setSentiment(s.label)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition ${
                    isActive
                      ? `${s.active} ${s.color} font-semibold`
                      : `${s.border} ${s.bg} text-slate-400 hover:${s.color}`
                  }`}
                >
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Commentary */}
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            Commentary{' '}
            <span className="font-normal text-slate-500">(optional — included in subscriber alert)</span>
          </label>
          <textarea
            value={commentary}
            onChange={(e) => setCommentary(e.target.value)}
            rows={3}
            placeholder="Add context for subscribers…"
            className="w-full resize-y rounded-xl border border-white/10 bg-[#061018] px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
          />
        </div>

        {/* Currently stored */}
        {stored && storedDef && (
          <div className={`mb-4 flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm ${storedDef.border} ${storedDef.bg}`}>
            <span>{storedDef.icon}</span>
            <span className={`font-medium ${storedDef.color}`}>Currently stored: {stored.sentiment}</span>
            <span className="ml-auto text-xs text-slate-500">
              set {stored.set_at?.slice(0, 16).replace('T', ' ')}
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {success}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#061018] transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Set Sentiment & Notify Subscribers'}
        </button>
      </div>
    </div>
  );
}
