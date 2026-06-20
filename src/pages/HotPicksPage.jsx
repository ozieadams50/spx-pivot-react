import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { GRADE_CONFIG } from '../data/earningsConfig';
import PageGuide from '../components/PageGuide';

function GradeBadge({ grade }) {
  const cfg = GRADE_CONFIG[grade] ?? GRADE_CONFIG['D'];
  return (
    <span className={`inline-flex items-center rounded-xl border px-2 py-0.5 text-[10px] font-bold ${cfg.badge}`}>
      {grade}
    </span>
  );
}

function SectionMiniBar({ label, score }) {
  const pct   = Math.min(100, score ?? 0);
  const color = pct >= 70 ? 'bg-emerald-500' : pct >= 45 ? 'bg-amber-500' : 'bg-rose-500';
  const num   = pct >= 70 ? 'text-[var(--c-emerald)]' : pct >= 45 ? 'text-[var(--c-amber-strong)]' : 'text-[var(--c-rose)]';
  return (
    <div className="flex items-center gap-2">
      <span className="w-6 text-[9px] font-bold text-[var(--c-text-faint)] shrink-0">{label}</span>
      <div className="flex-1 h-1 rounded-full bg-[var(--c-hover-strong)]">
        <div className={`h-1 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`w-6 text-right text-[9px] font-mono font-bold shrink-0 ${num}`}>
        {score != null ? score.toFixed(0) : '—'}
      </span>
    </div>
  );
}

function Tooltip({ text, children }) {
  return (
    <div className="relative group/tip inline-block">
      {children}
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-50
                      opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150
                      w-56 rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-dropdown)] shadow-xl
                      px-3 py-2.5 text-[10px] text-[var(--c-text-secondary)] leading-relaxed whitespace-normal text-left">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0
                        border-l-[5px] border-r-[5px] border-t-[5px]
                        border-l-transparent border-r-transparent border-t-[#0d1822]" />
      </div>
    </div>
  );
}

function PillTag({ label, value, threshold, fmt, tooltip }) {
  const v   = value ?? null;
  const met = v != null && v >= threshold;
  const pill = (
    <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-mono font-semibold cursor-default ${
      met
        ? 'border-emerald-500/40 bg-emerald-500/15 text-[var(--c-emerald-strong)]'
        : 'border-[var(--c-border)] bg-[var(--c-hover)] text-[var(--c-text-dimmed)]'
    }`}>
      {label} {v != null ? fmt(v) : '—'}
    </span>
  );
  if (!tooltip) return pill;
  return <Tooltip text={tooltip}>{pill}</Tooltip>;
}

function FullPickCard({ pick, rank, navigate, tickers }) {
  const urgent  = (pick.days_to_earnings ?? 99) <= 5;
  const metCount = Object.values(pick.override_details ?? {}).filter(Boolean).length;

  return (
    <div
      onClick={() => navigate(`/earnings/${pick.ticker}`, { state: { tickers } })}
      className="group cursor-pointer rounded-2xl border border-amber-500/25 bg-gradient-to-br from-[#0d1822] to-[#071018] p-5 transition-all duration-200 hover:border-amber-400/50 hover:shadow-xl hover:shadow-amber-500/5"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[11px] font-black text-black">
            {rank}
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl font-black text-[var(--c-text-primary)] group-hover:text-[var(--c-amber)] transition-colors">
                {pick.ticker}
              </span>
              <GradeBadge grade={pick.grade} />
              {pick.momentum_override && (
                <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/40 bg-cyan-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--c-cyan-strong)]">
                  ⚡ Override
                </span>
              )}
            </div>
            {pick.company_name && (
              <p className="text-[11px] text-[var(--c-text-dimmed)] mt-0.5 truncate max-w-[200px]">{pick.company_name}</p>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-black text-[var(--c-amber-strong)]">{pick.dynamic_score.toFixed(0)}</p>
          <p className="text-[9px] text-[var(--c-text-faint)]">{pick.model_score.toFixed(0)} model</p>
        </div>
      </div>

      {/* Earnings & sector */}
      <div className="flex items-center gap-3 mb-3 text-[10px]">
        <span className="text-[var(--c-text-dimmed)]">
          Earnings{' '}
          <span className={`font-semibold ${urgent ? 'text-[var(--c-amber-strong)]' : 'text-[var(--c-text-secondary)]'}`}>
            {pick.days_to_earnings != null ? `in ${pick.days_to_earnings}d` : pick.earnings_date}
          </span>
        </span>
        {pick.sector && (
          <>
            <span className="text-slate-700">·</span>
            <span className="text-[var(--c-text-dimmed)] truncate">{pick.sector}</span>
          </>
        )}
      </div>

      {/* 5 section mini-bars */}
      <div className="space-y-1.5 mb-3 p-3 rounded-xl bg-[var(--c-hover-faint)] border border-[var(--c-border-subtle)]">
        <SectionMiniBar label="S1" score={pick.s1_historical} />
        <SectionMiniBar label="S2" score={pick.s2_momentum} />
        <SectionMiniBar label="S3" score={pick.s3_fundamental} />
        <SectionMiniBar label="S4" score={pick.s4_technical} />
        <SectionMiniBar label="S5" score={pick.s5_volume} />
      </div>

      {/* Assessment */}
      {pick.overall_assessment && (
        <p className="text-[11px] text-[var(--c-text-muted)] leading-relaxed mb-3 line-clamp-2">
          {pick.overall_assessment}
        </p>
      )}

      {/* Outside indicators + override count */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <PillTag label="ADX"  value={pick.adx}     threshold={25}  fmt={v => v.toFixed(1)}                              tooltip="Average Directional Index — measures trend strength regardless of direction. Above 25 = strong trend in place." />
        <PillTag label="RVOL" value={pick.rvol_5d}  threshold={1.5} fmt={v => `${v.toFixed(2)}x`}                      tooltip="Relative Volume — 5-day average vs. prior 20-day baseline. Above 1.5× signals above-average accumulation." />
        <PillTag label="ROC"  value={pick.roc_10d}  threshold={5}   fmt={v => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`}  tooltip="Rate of Change (10-day) — percentage price move over the last 10 trading days. Above +5% = strong momentum into earnings." />
        {metCount > 0 && (
          <span className="rounded-lg border border-[var(--c-border)] bg-[var(--c-hover)] px-2 py-0.5 text-[10px] text-[var(--c-text-dimmed)]">
            {metCount}/6 criteria
          </span>
        )}
      </div>
    </div>
  );
}

function OnDeckRow({ pick, rank, navigate, tickers }) {
  const urgent  = (pick.days_to_earnings ?? 99) <= 5;
  const metCount = Object.values(pick.override_details ?? {}).filter(Boolean).length;

  return (
    <div
      onClick={() => navigate(`/earnings/${pick.ticker}`, { state: { tickers } })}
      className="group cursor-pointer flex items-center gap-3 rounded-xl border border-white/8 bg-[var(--c-bg-card)] px-4 py-3 transition-all hover:border-white/20 hover:bg-[var(--c-hover-faint)]"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-black text-[var(--c-text-muted)]">
        {rank}
      </span>

      <div className="flex-1 min-w-0 grid grid-cols-[auto_1fr_auto] gap-3 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[var(--c-text-primary)] group-hover:text-[var(--c-text-secondary)]">{pick.ticker}</span>
          <GradeBadge grade={pick.grade} />
          {pick.momentum_override && <span className="text-[9px] text-[var(--c-cyan-strong)] font-bold">⚡</span>}
        </div>

        <div className="hidden sm:block min-w-0">
          <div className="flex gap-2">
            <SectionMiniBar label="S1" score={pick.s1_historical} />
            <SectionMiniBar label="S2" score={pick.s2_momentum} />
            <SectionMiniBar label="S3" score={pick.s3_fundamental} />
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-mono font-bold text-[var(--c-text-secondary)]">
            {pick.dynamic_score.toFixed(0)}
          </span>
          <span className={`text-[10px] ${urgent ? 'text-[var(--c-amber-strong)]' : 'text-[var(--c-text-dimmed)]'}`}>
            {pick.days_to_earnings != null ? `${pick.days_to_earnings}d` : pick.earnings_date}
          </span>
        </div>
      </div>
    </div>
  );
}

function TierRotationLog() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/earnings/tier-history?limit=60')
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, []);

  const tierColor = (tier) => {
    if (tier === 'hot')    return 'text-[var(--c-amber-strong)]';
    if (tier === 'ondeck') return 'text-[var(--c-violet-strong)]';
    return 'text-[var(--c-text-dimmed)]';
  };

  return (
    <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-card)] p-6">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">
        Tier Rotation Log
      </h2>
      {loading ? (
        <div className="animate-pulse space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 rounded-lg bg-[var(--c-hover)]" />
          ))}
        </div>
      ) : history.length === 0 ? (
        <p className="text-sm text-[var(--c-text-faint)] text-center py-6">No tier changes recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--c-border-subtle)]">
                <th className="pb-2 text-left font-semibold text-[var(--c-text-dimmed)]">Date</th>
                <th className="pb-2 text-left font-semibold text-[var(--c-text-dimmed)]">Ticker</th>
                <th className="pb-2 text-left font-semibold text-[var(--c-text-dimmed)]">Change</th>
                <th className="pb-2 text-left font-semibold text-[var(--c-text-dimmed)]">Trigger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {history.map((row) => (
                <tr key={row.id} className="hover:bg-white/[0.02]">
                  <td className="py-2 text-[var(--c-text-dimmed)]">{row.change_date}</td>
                  <td className="py-2 font-bold text-[var(--c-text-primary)]">{row.ticker}</td>
                  <td className="py-2">
                    <span className={tierColor(row.from_tier ?? '')}>{row.from_tier ?? 'new'}</span>
                    <span className="mx-1.5 text-slate-700">→</span>
                    <span className={tierColor(row.to_tier ?? '')}>{row.to_tier ?? '—'}</span>
                  </td>
                  <td className="py-2 text-[var(--c-text-dimmed)]">
                    {row.trigger_metric
                      ? `${row.trigger_metric} ${row.trigger_value != null ? row.trigger_value.toFixed(2) : ''}`
                      : '—'}
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

export default function HotPicksPage() {
  const navigate              = useNavigate();
  const { role }              = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const canSeeLog = role === 'admin' || role === 'superuser';

  useEffect(() => {
    setLoading(true);
    apiFetch('/earnings/hot-picks')
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const hotPicks = data?.hot_picks ?? [];
  const onDeck   = data?.on_deck   ?? [];

  return (
    <div className="mx-auto max-w-5xl p-3 sm:p-4 lg:p-8 space-y-8">

      {/* Page header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-[var(--c-text-primary)]">Hot Picks</h1>
          <p className="mt-1 text-sm text-[var(--c-text-dimmed)]">
            Dynamically ranked by real-time momentum conditions — updated daily after market close
          </p>
        </div>
        {data?.compute_date && (
          <p className="text-[11px] text-[var(--c-text-faint)] sm:text-right">
            Last scored <span className="font-semibold text-[var(--c-text-muted)]">{data.compute_date}</span>
          </p>
        )}
      </div>

      <PageGuide
        guideKey="hot-picks"
        accent="amber"
        title="Today's top-ranked stocks — re-scored every night."
        description="Hot Picks are scored fresh each day based on current market conditions, not just history. A stock with strong momentum today can outrank a historically strong name that's gone quiet."
        steps={[
          { text: 'Each card shows the stock\'s current score and grade. ⚡ means all key conditions are aligned at once — the strongest setup the system can show.', targetId: 'pg-hot-picks-grid' },
          { text: 'The mini bars on each card show strength across multiple dimensions. Green = strong, red = weak. More green bars means higher conviction.', targetId: 'pg-hot-picks-grid' },
          { text: 'On Deck are the next candidates waiting to enter Hot Picks. Watch these — they can quickly become the next opportunity.', targetId: 'pg-on-deck' },
        ]}
      />

      {/* Hot Picks grid */}
      <section id="pg-hot-picks-grid">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-bold text-[var(--c-text-primary)]">Hot Picks</h2>
          <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-[var(--c-amber-strong)]">
            {hotPicks.length}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-[var(--c-hover)]" />
            ))}
          </div>
        ) : hotPicks.length === 0 ? (
          <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-card)] py-12 text-center text-sm text-[var(--c-text-faint)]">
            No Hot Picks at this time. Dynamic scores are updated after market close.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(() => {
              const allTickers = [...hotPicks, ...onDeck].map(p => p.ticker);
              return hotPicks.map((pick, i) => (
                <FullPickCard key={pick.ticker} pick={pick} rank={i + 1} navigate={navigate} tickers={allTickers} />
              ));
            })()}
          </div>
        )}
      </section>

      {/* On Deck */}
      {(loading || onDeck.length > 0) && (
        <section id="pg-on-deck">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-bold text-[var(--c-text-primary)]">On Deck</h2>
            <span className="rounded-full bg-violet-500/20 px-2.5 py-0.5 text-xs font-bold text-[var(--c-violet-strong)]">
              {onDeck.length}
            </span>
            <span className="text-[11px] text-[var(--c-text-faint)]">Next candidates to enter Hot Picks</span>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-[var(--c-hover)]" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {(() => {
                const allTickers = [...hotPicks, ...onDeck].map(p => p.ticker);
                return onDeck.map((pick, i) => (
                  <OnDeckRow key={pick.ticker} pick={pick} rank={i + 1} navigate={navigate} tickers={allTickers} />
                ));
              })()}
            </div>
          )}
        </section>
      )}

      {/* Tier Rotation Log — admin/superuser only */}
      {canSeeLog && <TierRotationLog />}

    </div>
  );
}
