import { useState, useEffect, useCallback } from 'react';
import TradeModal from '../components/TradeModal';
import { apiFetch } from '../lib/api';

const TRADE_MODES = ['Monthly Trade', 'Weekly Trade', 'Daily Trade'];

const MODE_MAP = {
  'Monthly Trade': 'monthly',
  'Weekly Trade':  'weekly',
  'Daily Trade':   'daily',
};

const HIST_WIN_KEY = {
  Aggressive:   'close_s1_pct',
  Moderate:     'close_mids_pct',
  Conservative: 'close_s2_pct',
};

const BADGE_STYLES = {
  Aggressive:   'bg-rose-500/20 text-rose-300 border-rose-500/30',
  Moderate:     'bg-sky-500/20 text-sky-300 border-sky-500/30',
  Conservative: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

const SENTIMENT_STYLES = {
  'Bullish':              'text-emerald-400',
  'Bullish (default)':    'text-emerald-400/70',
  'Neutral to Bullish':   'text-emerald-300',
  'Neutral':              'text-slate-300',
  'Bearish to Neutral':   'text-orange-400',
  'Bearish':              'text-rose-400',
};

// ── Formatters ───────────────────────────────────────────────────────────────

function fmtNumber(n) {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtCurrency(n) {
  return `$${fmtNumber(n)}`;
}

function fmtDate(isoDate) {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

function isToday(isoDate) {
  return isoDate === new Date().toISOString().slice(0, 10);
}

function buildCaption(mode, periodStart) {
  const label = fmtDate(periodStart);
  if (mode === 'daily')  return isToday(periodStart) ? 'today' : `prev-trading-day:${label}`;
  if (mode === 'weekly') return `Week of ${label}`;
  return `Month as of ${label}`;
}

// ── Time helpers ──────────────────────────────────────────────────────────────

function isPreMarketET() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false,
  }).formatToParts(now);
  const weekday = parts.find((p) => p.type === 'weekday')?.value;
  const hour    = parseInt(parts.find((p) => p.type === 'hour')?.value   ?? '0', 10);
  const minute  = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
  const isWeekday   = !['Sat', 'Sun'].includes(weekday);
  const beforeOpen  = hour < 9 || (hour === 9 && minute < 31);
  return isWeekday && beforeOpen;
}

// ── Stale banners ─────────────────────────────────────────────────────────────

function PreMarketBanner({ mode }) {
  const label = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' }[mode];
  return (
    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-yellow-500/40 bg-yellow-500/10 px-5 py-4">
      <span className="mt-0.5 text-lg leading-none">🕐</span>
      <div>
        <p className="text-sm font-semibold text-yellow-300">
          {label} pivots are updated once the market opens (9:31 AM ET)
        </p>
        <p className="mt-1 text-xs text-yellow-400/70">
          These are pivots from the prior trading day. Fresh data will be available shortly after market open.
        </p>
      </div>
    </div>
  );
}

function StaleBanner({ mode }) {
  const label = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' }[mode];
  return (
    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-5 py-4">
      <span className="mt-0.5 text-lg leading-none">🚨</span>
      <div>
        <p className="text-sm font-semibold text-rose-300">
          {label} pivot data is stale — do not trade until corrected
        </p>
        <p className="mt-1 text-xs text-rose-400/70">
          The {label.toLowerCase()} pivot has not been updated for the current period.
          The Pivot Guardian is attempting to correct this automatically.
          This banner will clear once fresh data is available.
        </p>
      </div>
    </div>
  );
}

// ── API → component shape ─────────────────────────────────────────────────────

function transformPivotData(api, mode) {
  const { periodOpen, r1, r2, s1, s2, sentiment, expiry, periodStart, spreads, isStale,
          gexRatio, spxMoc, mag7Moc } = api;
  const expiryFmt = fmtDate(expiry);
  const modeLabel = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' }[mode];

  return {
    isStale:      !!isStale,
    gexRatio:     gexRatio ?? null,
    spxMoc:       spxMoc   ?? null,
    mag7Moc:      mag7Moc  ?? null,
    title:        `SPX ${modeLabel} Pivot`,
    caption:      buildCaption(mode, periodStart),
    primaryPivot: fmtNumber(periodOpen),
    sentiment,
    expiry:       expiryFmt,
    pivots: [
      { label: 'R2 Resistance', value: fmtCurrency(r2), tone: 'text-emerald-400', key: 'r2' },
      { label: 'R1 Resistance', value: fmtCurrency(r1), tone: 'text-green-400',   key: 'r1' },
      { label: 'S1 Support',    value: fmtCurrency(s1), tone: 'text-emerald-400', key: 's1' },
      { label: 'S2 Support',    value: fmtCurrency(s2), tone: 'text-green-400',   key: 's2' },
    ],
    spreads: [
      { risk: 'Aggressive',   level: 'S1',               pivot: fmtNumber(spreads.Aggressive.level),   short: spreads.Aggressive.short,   long: spreads.Aggressive.long },
      { risk: 'Moderate',     level: 'Mid-S',            pivot: fmtNumber(spreads.Moderate.level),     short: spreads.Moderate.short,     long: spreads.Moderate.long   },
      { risk: 'Conservative', level: 'S2',               pivot: fmtNumber(spreads.Conservative.level), short: spreads.Conservative.short, long: spreads.Conservative.long },
    ],
    execCards: {
      Aggressive: {
        risk:   'Higher Risk / Higher Reward',
        level:  `S1 Pivot @ ${fmtNumber(spreads.Aggressive.level)} — ${spreads.Aggressive.short} / ${spreads.Aggressive.long}`,
        buy:    `${expiryFmt} • ${spreads.Aggressive.long} Put`,
        sell:   `${expiryFmt} • ${spreads.Aggressive.short} Put`,
        credit: '—',
        badge:  'border-rose-500/30 bg-rose-500/20 text-rose-300',
      },
      Moderate: {
        risk:   'Balanced Risk / Reward',
        level:  `Mid-S Pivot @ ${fmtNumber(spreads.Moderate.level)} — ${spreads.Moderate.short} / ${spreads.Moderate.long}`,
        buy:    `${expiryFmt} • ${spreads.Moderate.long} Put`,
        sell:   `${expiryFmt} • ${spreads.Moderate.short} Put`,
        credit: '—',
        badge:  'border-sky-500/30 bg-sky-500/20 text-sky-300',
      },
      Conservative: {
        risk:   'Lower Risk / Lower Reward',
        level:  `S2 Pivot @ ${fmtNumber(spreads.Conservative.level)} — ${spreads.Conservative.short} / ${spreads.Conservative.long}`,
        buy:    `${expiryFmt} • ${spreads.Conservative.long} Put`,
        sell:   `${expiryFmt} • ${spreads.Conservative.short} Put`,
        credit: '—',
        badge:  'border-emerald-500/30 bg-emerald-500/20 text-emerald-300',
      },
    },
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SPXPivots() {
  const [tradeMode,        setTradeMode]        = useState('Weekly Trade');
  const [selectedStrategy, setSelectedStrategy] = useState('Moderate');
  const [showModal,        setShowModal]        = useState(false);
  const [pivotData,        setPivotData]        = useState(null);
  const [premiums,         setPremiums]         = useState(null);
  const [histStats,        setHistStats]        = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);

  const fetchPivots = useCallback((mode, signal) => {
    setLoading(true);
    setError(null);
    apiFetch(`/pivots/spx?mode=${mode}`, { signal })
      .then((raw) => { if (raw) setPivotData(transformPivotData(raw, mode)); })
      .catch((err) => { if (err?.name !== 'AbortError') setError(err.message); })
      .finally(() => setLoading(false));
  }, []);

  // Fetch on trade mode change
  useEffect(() => {
    const controller = new AbortController();
    fetchPivots(MODE_MAP[tradeMode], controller.signal);
    return () => controller.abort();
  }, [tradeMode, fetchPivots]);

  // Re-fetch when user returns to this tab (picks up sentiment changes made elsewhere)
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible') fetchPivots(MODE_MAP[tradeMode]);
    }
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [tradeMode, fetchPivots]);

  // Fetch historical premium estimates + quant summary (non-blocking — used in table & modal)
  useEffect(() => {
    const mode   = MODE_MAP[tradeMode];
    const today  = new Date().toISOString().slice(0, 10);
    const premParams = new URLSearchParams({
      ticker: 'I:SPX', period: mode, spread_width: '5',
      start_date: '2015-01-01', end_date: today,
    });
    const quantParams = new URLSearchParams({
      ticker: 'I:SPX', period: mode, summary_only: 'true',
      start_date: '2015-01-01', end_date: today,
      sma_filter: 'spx_above_20ma',
    });
    setPremiums(null);
    setHistStats(null);
    apiFetch(`/historical/premium-estimate?${premParams}`).then(setPremiums).catch(() => {});
    apiFetch(`/historical/quant?${quantParams}`).then(d => setHistStats(d?.summary ?? null)).catch(() => {});
  }, [tradeMode]);

  // Auto-refresh every 60s while data is stale so the banner clears automatically
  // once the Pivot Guardian corrects the issue
  useEffect(() => {
    if (!pivotData?.isStale) return;
    const id = setInterval(() => fetchPivots(MODE_MAP[tradeMode]), 60_000);
    return () => clearInterval(id);
  }, [pivotData?.isStale, tradeMode, fetchPivots]);

  const data           = pivotData;
  const activeExec     = data?.execCards?.[selectedStrategy];
  const sentimentClass = SENTIMENT_STYLES[data?.sentiment] ?? 'text-slate-300';

  return (
    <div className="mx-auto max-w-7xl p-3 sm:p-4 lg:p-8">
      {/* Dashboard header */}
      <div className="mb-6 flex flex-col gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-[#0a1624] p-4 lg:flex-row lg:items-center lg:justify-between lg:p-8">
        <div>
          <div className="mb-3 inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1 text-xs uppercase tracking-[0.2em] text-cyan-300">
            Institutional SPX Credit Spread Dashboard
          </div>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">SPX Option Trader</h1>
        </div>

        <div className="flex flex-wrap items-stretch gap-3">
          {/* GEX badge — daily context only */}
          {tradeMode === 'Daily Trade' && (loading || data?.gexRatio != null) && (
            <div className={`rounded-3xl border bg-black/30 px-6 py-5 text-center ${
              !loading && data?.gexRatio != null
                ? data.gexRatio >= 0.5
                  ? 'border-emerald-500/30'
                  : 'border-rose-500/30'
                : 'border-white/10'
            }`}>
              <p className="mb-1 text-xs uppercase tracking-[0.2em] text-slate-500">GEX</p>
              {loading ? (
                <div className="h-8 w-24 animate-pulse rounded-xl bg-white/10" />
              ) : (
                <>
                  <p className={`text-2xl font-bold ${data.gexRatio >= 0.5 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {data.gexRatio >= 0.5 ? 'Positive' : 'Negative'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{data.gexRatio.toFixed(2)}</p>
                </>
              )}
            </div>
          )}

          {/* Market Sentiment */}
          <div className="rounded-3xl border border-white/10 bg-black/30 px-8 py-5 text-right">
            <p className="mb-1 text-xs uppercase tracking-[0.2em] text-slate-500">Market Sentiment</p>
            {loading ? (
              <div className="h-10 w-40 animate-pulse rounded-xl bg-white/10" />
            ) : (
              <p className={`text-3xl font-bold sm:text-4xl ${sentimentClass}`}>{data?.sentiment ?? '—'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Trade mode tabs */}
      <div className="mb-6 grid grid-cols-1 gap-3 rounded-3xl border border-white/10 bg-[#0b1420] p-3 sm:grid-cols-3">
        {TRADE_MODES.map((mode) => (
          <button
            key={mode}
            onClick={() => setTradeMode(mode)}
            className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
              tradeMode === mode
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-cyan-500/10 hover:text-cyan-200'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 py-4 text-rose-300">
          Failed to load pivot data: {error}
        </div>
      )}

      {/* Pre-market info or stale warning — shown per active pivot type only */}
      {!loading && data?.isStale && (
        isPreMarketET()
          ? <PreMarketBanner mode={MODE_MAP[tradeMode]} />
          : <StaleBanner mode={MODE_MAP[tradeMode]} />
      )}

      {/* Main pivot card */}
      <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[#0b1420] shadow-2xl">
        {/* Pivot header */}
        <div className="border-b border-white/10 px-4 py-5 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              {loading ? (
                <>
                  <div className="mb-2 h-8 w-56 animate-pulse rounded-xl bg-white/10" />
                  <div className="h-4 w-40 animate-pulse rounded-lg bg-white/10" />
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-white">{data?.title}</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    {data?.caption === 'today'
                      ? `Today — ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                      : data?.caption?.startsWith('prev-trading-day:')
                        ? `Previous Trading Day — ${data.caption.slice('prev-trading-day:'.length)}`
                        : data?.caption}
                  </p>
                </>
              )}
            </div>

            {/* MOC imbalance chip — daily context only */}
            {tradeMode === 'Daily Trade' && !loading && data?.spxMoc != null && (
              <div className={`inline-flex items-center gap-2 self-start rounded-2xl border px-4 py-2 text-sm font-semibold lg:self-auto ${
                data.spxMoc > 0
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
              }`}>
                <span>{data.spxMoc > 0 ? '🟢' : '🔴'}</span>
                <span>
                  MOC {data.spxMoc > 0 ? 'BUY' : 'SELL'}{' '}
                  <span className="font-mono">
                    {data.spxMoc > 0 ? '+' : ''}{data.spxMoc.toLocaleString()}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Pivot levels grid */}
        <div className="grid grid-cols-1 border-b border-white/10 sm:grid-cols-2 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="border-b border-white/5 p-5 text-center xl:border-b-0 xl:border-r xl:border-white/5 last:border-r-0">
                  <div className="mx-auto mb-3 h-3 w-24 animate-pulse rounded bg-white/10" />
                  <div className="mx-auto h-8 w-32 animate-pulse rounded-xl bg-white/10" />
                </div>
              ))
            : data?.pivots.map((item) => (
                <div
                  key={item.key}
                  className="border-b border-white/5 p-5 text-center xl:border-b-0 xl:border-r xl:border-white/5 last:border-r-0"
                >
                  <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
                  <p className={`mt-3 text-2xl font-bold lg:text-3xl ${item.tone}`}>{item.value}</p>
                </div>
              ))}
        </div>

        {/* Credit spread subheader */}
        <div className="border-b border-white/10 bg-black/20 px-4 py-4 lg:px-8">
          <div className="flex flex-wrap items-center gap-5 text-sm text-slate-300">
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 font-semibold text-white">
              Bull Put Spreads
            </div>
            <div>
              Expiry:{' '}
              {loading ? (
                <span className="inline-block h-4 w-24 animate-pulse rounded bg-white/10 align-middle" />
              ) : (
                <span className="font-semibold text-emerald-400">{data?.expiry}</span>
              )}
            </div>
            <div>
              Width: <span className="font-semibold text-white">5 pts</span>
            </div>
          </div>
        </div>

        {/* Bull put spreads table */}
        <div className="p-4 lg:p-8">
          <div className="rounded-[32px] border border-emerald-500/10 bg-gradient-to-br from-[#07101a] to-[#0a1726] shadow-2xl">
            <div className="flex flex-col gap-5 border-b border-white/10 px-4 py-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <div>
                <h3 className="text-2xl font-bold text-white">
                  <span className="text-slate-400">Trade Recommendation:</span> Bull Put Spread
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  Structured SPX premium-selling opportunities.
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                disabled={loading || !data || (data.isStale && !isPreMarketET())}
                title={data?.isStale && !isPreMarketET() ? 'Pivot data is stale — trading disabled until corrected' : undefined}
                className="self-start rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed lg:self-auto"
              >
                ⓘ How to Trade
              </button>
            </div>

            <div className="overflow-x-auto p-4">
              <table className="min-w-full border-collapse overflow-hidden rounded-3xl border border-white/10">
                <thead className="bg-white/5 text-xs uppercase tracking-[0.2em] text-slate-400">
                  <tr>
                    <th className="px-4 py-4 text-center">Risk</th>
                    <th className="px-4 py-4 text-center">Level</th>
                    <th className="px-4 py-4 text-center">Pivot</th>
                    <th className="px-4 py-4 text-center">Short Put</th>
                    <th className="px-4 py-4 text-center">Long Put</th>
                    <th className="px-4 py-4 text-center">Hist Win %</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i} className="border-t border-white/5">
                          {Array.from({ length: 6 }).map((__, j) => (
                            <td key={j} className="px-4 py-4">
                              <div className="h-4 animate-pulse rounded bg-white/10" />
                            </td>
                          ))}
                        </tr>
                      ))
                    : data?.spreads.map((row) => (
                        <tr
                          key={row.risk}
                          onClick={() => setSelectedStrategy(row.risk)}
                          className={`border-t border-white/5 text-slate-300 cursor-pointer transition-colors hover:bg-white/5 ${
                            selectedStrategy === row.risk ? 'bg-white/[0.03]' : ''
                          }`}
                        >
                          <td className="px-4 py-4 text-center">
                            <div className={`inline-flex rounded-xl border px-3 py-1 text-sm font-semibold ${BADGE_STYLES[row.risk]}`}>
                              {row.risk}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center text-slate-300">{row.level}</td>
                          <td className="px-4 py-4 text-center font-mono">{row.pivot}</td>
                          <td className="px-4 py-4 text-center font-mono font-semibold text-white">{row.short}</td>
                          <td className="px-4 py-4 text-center font-mono text-slate-400">{row.long}</td>
                          <td className="px-4 py-4 text-center font-mono font-semibold text-emerald-400">
                            {histStats
                              ? `${(100 - histStats[HIST_WIN_KEY[row.risk]]).toFixed(1)}%`
                              : '—'}
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showModal && data && (
        <TradeModal
          selectedStrategy={selectedStrategy}
          setSelectedStrategy={setSelectedStrategy}
          execCards={data.execCards}
          activeStrategy={activeExec}
          premiums={premiums}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
