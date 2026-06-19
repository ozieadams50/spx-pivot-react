import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import PageGuide from '../components/PageGuide';

// ── Color helpers ─────────────────────────────────────────────────────────────

function perfBg(pct) {
  if (pct == null) return '#1a2535';
  const c = Math.max(-20, Math.min(20, pct));
  if (c >= 0) {
    const s = Math.round((c / 20) * 75);
    const l = Math.round(12 + (c / 20) * 18);
    return `hsl(142,${s}%,${l}%)`;
  }
  const abs = Math.abs(c);
  const s   = Math.round((abs / 20) * 75);
  const l   = Math.round(12 + (abs / 20) * 18);
  return `hsl(0,${s}%,${l}%)`;
}

function signedFmt(v) {
  if (v == null) return '—';
  return `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;
}

// ── Bar chart ─────────────────────────────────────────────────────────────────

function SectorBar({ d, rank, maxAbs, onSelect }) {
  const pct    = d.perf_1m ?? 0;
  const barPct = maxAbs > 0 ? (Math.abs(pct) / maxAbs) * 100 : 0;
  const isTop3 = rank <= 3;
  const pos    = pct >= 0;

  return (
    <button
      onClick={() => onSelect(d.etf_ticker)}
      className="group w-full flex items-center gap-3 rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-card)] p-3 text-left transition-all hover:border-violet-500/30 hover:bg-violet-500/5"
    >
      <span className={`w-6 shrink-0 text-center text-xs font-bold ${isTop3 ? 'text-[var(--c-violet)]' : 'text-[var(--c-text-faint)]'}`}>
        {rank}
      </span>

      <div className="w-52 shrink-0">
        <p className={`text-sm font-semibold ${isTop3 ? 'text-[var(--c-text-primary)]' : 'text-[var(--c-text-secondary)]'}`}>{d.sector}</p>
        <span className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold border ${
          isTop3
            ? 'border-violet-500/40 bg-violet-500/15 text-[var(--c-violet)]'
            : 'border-[var(--c-border)] text-[var(--c-text-faint)]'
        }`}>
          {d.etf_ticker}
        </span>
      </div>

      <div className="relative flex-1 h-7 overflow-hidden rounded-lg bg-[var(--c-hover)]">
        <div
          className={`absolute top-0 h-full rounded-lg transition-all ${
            pos
              ? `left-0 ${isTop3 ? 'bg-emerald-500/50' : 'bg-emerald-500/25'}`
              : `right-0 ${isTop3 ? 'bg-rose-500/50' : 'bg-rose-500/25'}`
          }`}
          style={{ width: `${barPct}%` }}
        />
      </div>

      <span className={`w-16 shrink-0 text-right font-mono text-sm font-bold ${pos ? 'text-[var(--c-emerald)]' : 'text-[var(--c-rose)]'}`}>
        {signedFmt(d.perf_1m)}
      </span>
      {d.weight != null && (
        <span className="w-12 shrink-0 text-right font-mono text-xs text-[var(--c-text-dimmed)]">
          {d.weight.toFixed(1)}%
        </span>
      )}
      <span className="shrink-0 text-[var(--c-text-faint)] transition-colors group-hover:text-[var(--c-violet-strong)]">›</span>
    </button>
  );
}

// ── Heat map tile ─────────────────────────────────────────────────────────────

function HeatTile({ h, period, onClick }) {
  const pct = period === '30d' ? h.perf_1m : h.perf_5d;
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      title={`${h.ticker}${h.name ? ` — ${h.name}` : ''}\n30d: ${signedFmt(h.perf_1m)}  5d: ${signedFmt(h.perf_5d)}${h.weight != null ? `\nWeight: ${h.weight.toFixed(2)}%` : ''}${onClick ? '\nClick to view Pre-Earnings detail' : ''}`}
      className={`relative w-full text-left rounded-xl p-2.5 transition-all hover:scale-110 hover:z-10 ${
        onClick ? 'cursor-pointer hover:brightness-125 hover:ring-2 hover:ring-white/30' : 'cursor-default'
      } ${
        h.in_signals ? 'ring-2 ring-violet-400 ring-offset-1 ring-offset-[#08111c]' : ''
      }`}
      style={{ backgroundColor: perfBg(pct) }}
    >
      {h.in_signals && (
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-violet-400 shadow-lg shadow-violet-500/50" />
      )}
      <p className="text-xs font-bold leading-tight text-[var(--c-text-primary)]">{h.ticker}</p>
      <p className="mt-0.5 font-mono text-[11px] font-semibold text-[var(--c-text-primary)]/85">
        {pct != null ? signedFmt(pct) : '—'}
      </p>
      {h.weight != null && (
        <p className="mt-0.5 text-[9px] text-[var(--c-text-primary)]/45">{h.weight.toFixed(1)}%</p>
      )}
    </Tag>
  );
}

// ── Color legend ──────────────────────────────────────────────────────────────

function Legend() {
  const stops = [-15, -10, -5, -2, 0, 2, 5, 10, 15];
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-0.5">
        {stops.map((v) => (
          <div
            key={v}
            className="h-3.5 w-7 rounded-sm"
            style={{ backgroundColor: perfBg(v) }}
            title={`${v >= 0 ? '+' : ''}${v}%`}
          />
        ))}
      </div>
      <span className="text-[10px] text-[var(--c-text-faint)]">← underperform · outperform →</span>
      <div className="flex items-center gap-1.5 ml-2">
        <span className="h-2.5 w-2.5 rounded-full bg-violet-400" />
        <span className="text-[10px] text-[var(--c-text-dimmed)]">in our Pre-Earnings signals</span>
      </div>
    </div>
  );
}

// ── Heat map view ─────────────────────────────────────────────────────────────

function HeatMap({ etf, onBack }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [period,  setPeriod]  = useState('30d');
  const [sortKey, setSortKey] = useState('weight');
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiFetch(`/sectors/${etf}/holdings`)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [etf]);

  const signalCount = useMemo(
    () => data?.holdings?.filter((h) => h.in_signals).length ?? 0,
    [data],
  );

  const sorted = useMemo(() => {
    if (!data?.holdings) return [];
    return [...data.holdings].sort((a, b) => {
      if (sortKey === 'weight') {
        return (b.weight ?? -1) - (a.weight ?? -1);
      }
      const av = period === '30d' ? a.perf_1m : a.perf_5d;
      const bv = period === '30d' ? b.perf_1m : b.perf_5d;
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return bv - av;
    });
  }, [data, sortKey, period]);

  return (
    <div>
      {/* Sub-header */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-[var(--c-text-muted)] transition-colors hover:text-[var(--c-text-primary)]"
        >
          ← All Sectors
        </button>
        <span className="text-slate-700">|</span>
        {data && (
          <>
            <h2 className="text-xl font-bold text-[var(--c-text-primary)]">{data.sector}</h2>
            <span className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-xs font-bold text-[var(--c-violet)]">
              {etf}
            </span>
            {signalCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-400/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--c-violet)]">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                {signalCount} in our signals
              </span>
            )}
          </>
        )}

        {/* Sort + Period toggles */}
        <div className="ml-auto flex items-center gap-2">
          <div className="flex rounded-xl border border-[var(--c-border)] bg-black/30 p-0.5 text-xs font-semibold">
            {[['weight', 'Weight'], ['return', 'Return']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setSortKey(val)}
                className={`rounded-lg px-3 py-1.5 transition-all ${
                  sortKey === val ? 'bg-violet-500 text-[var(--c-text-primary)] shadow-lg shadow-violet-500/20' : 'text-[var(--c-text-muted)] hover:text-[var(--c-text-primary)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex rounded-xl border border-[var(--c-border)] bg-black/30 p-0.5 text-xs font-semibold">
            {[['30d', '30 Day'], ['5d', '5 Day']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setPeriod(val)}
                className={`rounded-lg px-4 py-1.5 transition-all ${
                  period === val ? 'bg-violet-500 text-[var(--c-text-primary)] shadow-lg shadow-violet-500/20' : 'text-[var(--c-text-muted)] hover:text-[var(--c-text-primary)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-10 gap-2">
          {Array.from({ length: 50 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--c-hover)]" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 py-4 text-sm text-[var(--c-rose-strong)]">
          Failed to load holdings: {error}
        </div>
      )}

      {!loading && data && data.holdings.length === 0 && (
        <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-card)] px-8 py-14 text-center text-[var(--c-text-dimmed)]">
          No holdings data available for {etf}. Holdings are sourced from SSGA and may be temporarily unavailable.
        </div>
      )}

      {!loading && data && data.holdings.length > 0 && (
        <>
          <Legend />
          <div className="grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-10 xl:grid-cols-12 gap-2">
            {sorted.map((h) => (
              <HeatTile
                key={h.ticker}
                h={h}
                period={period}
                onClick={h.in_signals ? () => navigate(`/earnings/${h.ticker}`) : undefined}
              />
            ))}
          </div>
          <p className="mt-4 text-[10px] text-slate-700">
            Holdings sourced from SSGA · Returns via Polygon · {data.holdings.length} holdings shown
          </p>
        </>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SectorTracker() {
  const [perf,        setPerf]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [selectedEtf, setSelectedEtf] = useState(null);
  const [sortKey,     setSortKey]     = useState('return');

  useEffect(() => {
    apiFetch('/sectors/performance')
      .then(setPerf)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const sorted = useMemo(() => {
    if (sortKey === 'weight') {
      return [...perf].sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0));
    }
    return [...perf].sort((a, b) => {
      if (a.perf_1m == null && b.perf_1m == null) return 0;
      if (a.perf_1m == null) return 1;
      if (b.perf_1m == null) return -1;
      return b.perf_1m - a.perf_1m;
    });
  }, [perf, sortKey]);

  const maxAbs = useMemo(
    () => Math.max(1, ...perf.map((d) => Math.abs(d.perf_1m ?? 0))),
    [perf],
  );

  return (
    <div className="mx-auto max-w-5xl p-3 sm:p-4 lg:p-8">
      {/* Page header */}
      <div className="mb-6 rounded-3xl border border-[var(--c-border)] bg-gradient-to-br from-[var(--c-bg-gradient-from)] to-[var(--c-bg-gradient-to)] p-6 lg:p-8">
        <div className="mb-3 inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-violet)]">
          Quantified Edge
        </div>
        <h1 className="text-3xl font-bold text-[var(--c-text-primary)] sm:text-4xl">Sector Tracker</h1>
        <p className="mt-2 text-sm text-[var(--c-text-muted)]">
          {selectedEtf
            ? 'SPDR ETF holdings heat map · 30-day and 5-day returns'
            : '30-day return by SPDR sector ETF · click a sector to explore holdings'}
        </p>
      </div>

      {error && !selectedEtf && (
        <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 py-4 text-sm text-[var(--c-rose-strong)]">
          {error}
        </div>
      )}

      {selectedEtf ? (
        <HeatMap etf={selectedEtf} onBack={() => setSelectedEtf(null)} />
      ) : (
        <>
          <PageGuide
            guideKey="sector-tracker"
            accent="violet"
            title="See which sectors are leading the market."
            description="Sector momentum matters. A stock in a strong sector has a better chance of following through on its setup."
            steps={[
              { text: 'Bars show each S&P 500 sector\'s recent performance — green = gaining, red = losing. The top sectors are highlighted, showing where momentum is strongest.', targetId: 'pg-sector-bars' },
              { text: 'Use the Return / Weight toggle to switch between ranking by performance vs. index weight.', targetId: 'pg-sector-sort' },
              'Click any sector row to drill into the individual holdings. Stocks with a violet dot are in our active signals.',
            ]}
          />

          <div id="pg-sector-sort" className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">
              {sortKey === 'weight' ? 'Sectors by S&P 500 Weight' : 'Sectors by 30-Day Return'}
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--c-text-faint)]">Top 3 highlighted · click to view holdings →</span>
              <div className="flex rounded-xl border border-[var(--c-border)] bg-black/30 p-0.5 text-xs font-semibold">
                {[['return', 'Return'], ['weight', 'Weight']].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setSortKey(val)}
                    className={`rounded-lg px-3 py-1.5 transition-all ${
                      sortKey === val ? 'bg-violet-500 text-[var(--c-text-primary)] shadow-lg shadow-violet-500/20' : 'text-[var(--c-text-muted)] hover:text-[var(--c-text-primary)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div id="pg-sector-bars">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 11 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-2xl bg-[var(--c-hover)]" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {sorted.map((d, i) => (
                <SectorBar
                  key={d.etf_ticker}
                  d={d}
                  rank={i + 1}
                  maxAbs={maxAbs}
                  onSelect={setSelectedEtf}
                />
              ))}
            </div>
          )}
          </div>
        </>
      )}
    </div>
  );
}
