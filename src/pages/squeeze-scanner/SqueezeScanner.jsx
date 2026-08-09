import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { apiFetch } from '../../lib/api';
import PageGuide from '../../components/PageGuide';
import StrategyThesisModal from '../../components/StrategyThesisModal';

const DIRECTION_OPTS = [
  { label: 'Off', value: 'off' },
  { label: 'Both', value: 'both' },
  { label: 'Bull', value: 'bull' },
  { label: 'Bear', value: 'bear' },
];

const TIMEFRAME_COLS = [
  { key: 'sqz_5', label: '5', tf: '5-minute' },
  { key: 'sqz_15', label: '15', tf: '15-minute' },
  { key: 'sqz_30', label: '30', tf: '30-minute' },
  { key: 'sqz_60', label: '60', tf: '60-minute (hourly)' },
  { key: 'sqz_1d', label: '1D', tf: 'Daily' },
  { key: 'sqz_1w', label: '1W', tf: 'Weekly' },
  { key: 'sqz_1m', label: '1M', tf: 'Monthly' },
].map((c) => ({ ...c, tooltip: `How many ${c.tf} bars in a row this ticker has been in an Ideal Squeeze (either direction) on this timeframe. Blank means it isn't right now — this is a narrower, more deliberate signal than plain compression: it requires the EMA stack to confirm too, not just tight price action.` }));

const IDEAL_SQUEEZE_TOOLTIP = 'A squeeze (price compression) forming inside an already-established trend, in the direction shown. Bull = building inside an uptrend, Bear = building inside a downtrend.';
const STACKED_EMA_TOOLTIP = 'Three short-term trend averages (9/13/21-day EMAs) lined up in order — fastest-on-top for Bull, slowest-on-top for Bear. A simple trend-alignment check on its own, separate from Ideal Squeeze.';
const RSI_TOOLTIP = 'Relative Strength Index (14-day) — a 0-100 momentum reading measured against the size of this ticker’s own up days versus down days over its last 14 daily closes, not against other tickers or the market. Below 40 = oversold, 65-80 = strong momentum.';
const RANGE_52W_TOOLTIP = 'Where the Close sits within this ticker’s own trailing 52-week high/low range. 100% = at the 52-week high, 0% = at the 52-week low.';
const CLOSE_TOOLTIP = 'The previous trading day’s official closing price. Stays fixed all day until that day’s own close is finalized after the market close.';
const LAST_TOOLTIP = 'The most recent price available as of the last scan (updates every 15 minutes). Runs roughly 15-30 minutes behind real time due to the market data plan’s delay.';
const NET_CHG_TOOLTIP = 'Change from the previous day’s Close to the current Last price.';

const EXPORT_COLUMNS = [
  { key: 'ticker', header: 'Symbol' },
  { key: 'name', header: 'Name' },
  { key: 'sector', header: 'Sector' },
  { key: 'close', header: 'Close' },
  { key: 'last', header: 'Last' },
  { key: 'net_chg', header: 'Net Chg $' },
  { key: 'net_chg_pct', header: 'Net Chg %' },
  { key: 'rsi', header: 'RSI' },
  { key: 'range_52w_pct', header: '52W Range %' },
  { key: 'ideal_squeeze', header: 'Ideal Squeeze' },
  { key: 'stacked_ema', header: 'Stacked EMA' },
  ...TIMEFRAME_COLS.map((c) => ({ key: c.key, header: c.label })),
];

const DEFAULT_FILTERS = {
  tickerQ: '',
  idealFilter: 'off',
  stackedFilter: 'off',
  rsiMin: '',
  rsiMax: '',
  range52wMin: '',
  timeframeFilter: new Set(),
};

function matchesDirection(value, filter) {
  if (filter === 'off') return true;
  if (filter === 'both') return value === 'bull' || value === 'bear';
  return value === filter;
}

function compareRows(a, b, key, dir) {
  if (['ticker', 'name', 'sector'].includes(key)) {
    const va = (a[key] ?? '').toLowerCase();
    const vb = (b[key] ?? '').toLowerCase();
    return dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
  }
  const va = a[key] ?? (dir === 'asc' ? Infinity : -Infinity);
  const vb = b[key] ?? (dir === 'asc' ? Infinity : -Infinity);
  return dir === 'asc' ? va - vb : vb - va;
}

// ── Badges / small display helpers ──────────────────────────────────────────

function DirectionBadge({ value }) {
  if (value === 'bull') {
    return (
      <span className="inline-flex items-center rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-[var(--c-emerald)]">
        Bull
      </span>
    );
  }
  if (value === 'bear') {
    return (
      <span className="inline-flex items-center rounded-xl border border-rose-500/40 bg-rose-500/15 px-2 py-0.5 text-xs font-bold text-[var(--c-rose)]">
        Bear
      </span>
    );
  }
  return <span className="text-[var(--c-text-faint)]">—</span>;
}

function SignedNum({ value, fmt }) {
  if (value == null) return <span className="text-[var(--c-text-faint)]">—</span>;
  const color = value > 0 ? 'text-[var(--c-emerald)]' : value < 0 ? 'text-[var(--c-rose)]' : 'text-[var(--c-text-secondary)]';
  return <span className={`font-mono ${color}`}>{value > 0 ? '+' : ''}{fmt(value)}</span>;
}

function SqzCount({ value }) {
  if (!value) return <span className="text-[var(--c-text-faint)]">—</span>;
  return <span className="font-mono font-semibold text-[var(--c-text-primary)]">{value}</span>;
}

// ── Sortable header cell (same pattern as PreEarningsRunners.jsx) ──────────

function SortTh({ label, sk, sortKey, sortDir, onSort, className = '', tooltip }) {
  const active = sortKey === sk;
  return (
    <th
      onClick={() => onSort(sk)}
      title={tooltip}
      className={`cursor-pointer select-none py-2 text-[10px] uppercase tracking-widest leading-tight transition-colors ${
        active ? 'text-[var(--c-violet-strong)]' : 'text-[var(--c-text-dimmed)] hover:text-[var(--c-text-secondary)]'
      } ${className}`}
    >
      {label}
      <span className="ml-1 text-[9px]">{active ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}</span>
    </th>
  );
}

// ── Filters dropdown panel ──────────────────────────────────────────────────

function DirectionToggle({ label, value, onChange, tooltip }) {
  return (
    <div title={tooltip}>
      <span className="text-[10px] uppercase tracking-widest text-[var(--c-text-faint)]">{label}</span>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {DIRECTION_OPTS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
              value === opt.value
                ? 'border-violet-500/40 bg-violet-500/20 text-[var(--c-violet)]'
                : 'border-[var(--c-border)] text-[var(--c-text-dimmed)] hover:text-[var(--c-text-primary)]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function FiltersPanel({
  tickerQ, setTickerQ,
  idealFilter, setIdealFilter,
  stackedFilter, setStackedFilter,
  rsiMin, setRsiMin, rsiMax, setRsiMax,
  range52wMin, setRange52wMin,
  timeframeFilter, toggleTimeframe,
  onClear, onClose,
  total, filtered,
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 z-50 mt-2 w-[360px] rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-dropdown)] p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-[var(--c-text-primary)]">Filters</p>
          <span className="text-xs text-[var(--c-text-dimmed)]">
            <span className="font-semibold text-[var(--c-text-primary)]">{filtered}</span> of {total}
          </span>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--c-text-dimmed)] text-xs pointer-events-none">⌕</span>
            <input
              type="text"
              value={tickerQ}
              onChange={(e) => setTickerQ(e.target.value.toUpperCase())}
              placeholder="Symbol or name…"
              className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-hover)] py-1.5 pl-7 pr-7 text-sm text-[var(--c-text-primary)] placeholder-[var(--c-text-faint)] focus:border-violet-500/50 focus:outline-none"
            />
            {tickerQ && (
              <button
                onClick={() => setTickerQ('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--c-text-dimmed)] hover:text-[var(--c-text-primary)]"
              >
                ✕
              </button>
            )}
          </div>

          <DirectionToggle
            label="Ideal Squeeze"
            value={idealFilter}
            onChange={setIdealFilter}
            tooltip={IDEAL_SQUEEZE_TOOLTIP}
          />

          <DirectionToggle
            label="Stacked EMA"
            value={stackedFilter}
            onChange={setStackedFilter}
            tooltip={STACKED_EMA_TOOLTIP}
          />

          <div title={RSI_TOOLTIP}>
            <span className="text-[10px] uppercase tracking-widest text-[var(--c-text-faint)]">RSI</span>
            <div className="mt-1.5 flex items-center gap-1.5">
              <input
                type="number" value={rsiMin} onChange={(e) => setRsiMin(e.target.value)} placeholder="Min"
                className="w-full rounded-lg border border-[var(--c-border)] bg-[var(--c-hover)] px-2 py-1 text-xs text-[var(--c-text-primary)] placeholder-[var(--c-text-faint)] focus:border-violet-500/50 focus:outline-none"
              />
              <span className="text-[var(--c-text-faint)] text-xs">–</span>
              <input
                type="number" value={rsiMax} onChange={(e) => setRsiMax(e.target.value)} placeholder="Max"
                className="w-full rounded-lg border border-[var(--c-border)] bg-[var(--c-hover)] px-2 py-1 text-xs text-[var(--c-text-primary)] placeholder-[var(--c-text-faint)] focus:border-violet-500/50 focus:outline-none"
              />
            </div>
          </div>

          <div title={RANGE_52W_TOOLTIP}>
            <span className="text-[10px] uppercase tracking-widest text-[var(--c-text-faint)]">52W Range % ≥</span>
            <input
              type="number" value={range52wMin} onChange={(e) => setRange52wMin(e.target.value)} placeholder="0"
              className="mt-1.5 w-full rounded-lg border border-[var(--c-border)] bg-[var(--c-hover)] px-2 py-1 text-xs text-[var(--c-text-primary)] placeholder-[var(--c-text-faint)] focus:border-violet-500/50 focus:outline-none"
            />
          </div>

          <div title="Only show tickers currently in an Ideal Squeeze on at least one of the checked timeframes.">
            <span className="text-[10px] uppercase tracking-widest text-[var(--c-text-faint)]">Ideal Squeeze On</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {TIMEFRAME_COLS.map((c) => (
                <button
                  key={c.key}
                  onClick={() => toggleTimeframe(c.key)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                    timeframeFilter.has(c.key)
                      ? 'border-violet-500/40 bg-violet-500/20 text-[var(--c-violet)]'
                      : 'border-[var(--c-border)] text-[var(--c-text-dimmed)] hover:text-[var(--c-text-primary)]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={onClear}
          className="mt-4 w-full rounded-lg border border-[var(--c-border)] py-1.5 text-xs font-medium text-[var(--c-text-secondary)] transition hover:bg-[var(--c-hover)]"
        >
          Clear all filters
        </button>
      </div>
    </>
  );
}

// ── Main page ────────────────────────────────────────────────────────────

export default function SqueezeScanner() {
  const [rows, setRows] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [tickerQ, setTickerQ] = useState(DEFAULT_FILTERS.tickerQ);
  const [idealFilter, setIdealFilter] = useState(DEFAULT_FILTERS.idealFilter);
  const [stackedFilter, setStackedFilter] = useState(DEFAULT_FILTERS.stackedFilter);
  const [rsiMin, setRsiMin] = useState(DEFAULT_FILTERS.rsiMin);
  const [rsiMax, setRsiMax] = useState(DEFAULT_FILTERS.rsiMax);
  const [range52wMin, setRange52wMin] = useState(DEFAULT_FILTERS.range52wMin);
  const [timeframeFilter, setTimeframeFilter] = useState(DEFAULT_FILTERS.timeframeFilter);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showStrategyInfo, setShowStrategyInfo] = useState(false);

  const [sortKey, setSortKey] = useState('ticker');
  const [sortDir, setSortDir] = useState('asc');

  const fetchTickers = (showSkeleton) => {
    if (showSkeleton) setLoading(true);
    else setRefreshing(true);
    setError(null);
    return apiFetch('/squeeze-scanner/tickers')
      .then((data) => {
        setRows(data?.tickers ?? []);
        setUpdatedAt(data?.updatedAt ?? null);
      })
      .catch((e) => setError(e.message))
      .finally(() => { if (showSkeleton) setLoading(false); else setRefreshing(false); });
  };

  // Backend refreshes every 15 min; poll a bit faster so a tab left open
  // doesn't sit on a stale (or empty, e.g. if first loaded before the
  // collector's first run of the day) snapshot indefinitely.
  useEffect(() => {
    fetchTickers(true);
    const id = setInterval(() => fetchTickers(false), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir(key === 'ticker' ? 'asc' : 'desc'); }
  };

  const toggleTimeframe = (key) => {
    setTimeframeFilter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const clearFilters = () => {
    setTickerQ(DEFAULT_FILTERS.tickerQ);
    setIdealFilter(DEFAULT_FILTERS.idealFilter);
    setStackedFilter(DEFAULT_FILTERS.stackedFilter);
    setRsiMin(DEFAULT_FILTERS.rsiMin);
    setRsiMax(DEFAULT_FILTERS.rsiMax);
    setRange52wMin(DEFAULT_FILTERS.range52wMin);
    setTimeframeFilter(new Set());
  };

  // Refresh means "back to the baseline view" -- clear every filter and the
  // sort order, not just re-fetch data, so it also doubles as a reset.
  const handleRefresh = () => {
    clearFilters();
    setSortKey('ticker');
    setSortDir('asc');
    setFiltersOpen(false);
    fetchTickers(false);
  };

  const activeFilterCount =
    (tickerQ ? 1 : 0) +
    (idealFilter !== 'off' ? 1 : 0) +
    (stackedFilter !== 'off' ? 1 : 0) +
    (rsiMin !== '' ? 1 : 0) +
    (rsiMax !== '' ? 1 : 0) +
    (range52wMin !== '' ? 1 : 0) +
    (timeframeFilter.size > 0 ? 1 : 0);

  const filtered = useMemo(() => {
    const q = tickerQ.trim().toUpperCase();
    return rows.filter((r) => {
      if (q && !r.ticker.includes(q) && !(r.name ?? '').toUpperCase().includes(q)) return false;
      if (!matchesDirection(r.ideal_squeeze, idealFilter)) return false;
      if (!matchesDirection(r.stacked_ema, stackedFilter)) return false;
      if (rsiMin !== '' && (r.rsi == null || r.rsi < Number(rsiMin))) return false;
      if (rsiMax !== '' && (r.rsi == null || r.rsi > Number(rsiMax))) return false;
      if (range52wMin !== '' && (r.range_52w_pct == null || r.range_52w_pct < Number(range52wMin))) return false;
      if (timeframeFilter.size > 0 && ![...timeframeFilter].some((key) => r[key])) return false;
      return true;
    });
  }, [rows, tickerQ, idealFilter, stackedFilter, rsiMin, rsiMax, range52wMin, timeframeFilter]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => compareRows(a, b, sortKey, sortDir)),
    [filtered, sortKey, sortDir],
  );

  const handleExport = () => {
    const headers = EXPORT_COLUMNS.map((c) => c.header);
    const data = sorted.map((r) => EXPORT_COLUMNS.map((c) => r[c.key] ?? ''));
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Squeeze Scanner');
    XLSX.writeFile(wb, `qe_squeeze_scanner_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-2 flex justify-start">
        <button
          onClick={() => setShowStrategyInfo(true)}
          className="flex items-center gap-1.5 rounded-full border border-violet-500/20 px-3 py-1 text-xs text-violet-500/70 transition-colors hover:border-violet-500/40 hover:text-[var(--c-violet)]"
        >
          <span className="font-bold">$</span> How to Trade this Strategy
        </button>
      </div>

      <PageGuide
        guideKey="squeeze-scanner"
        title="Scanning for compression setups across the QE universe"
        description="This page scans a fixed list of stocks, ETFs, and crypto proxies for tickers currently compressing (squeezing) and flags trend-aligned setups."
        accent="violet"
        steps={[
          { text: 'Click Filters to narrow the list by Ideal Squeeze direction, Stacked EMA direction, RSI range, 52-week range, or which timeframe(s) are currently in an Ideal Squeeze.', targetId: 'sqz-filters-btn' },
          { text: 'Ideal Squeeze flags price compression forming inside an already-established trend — Bull for uptrends, Bear for downtrends. Stacked EMA is a simpler trend-alignment check on its own.', targetId: 'sqz-table' },
          { text: 'The 5 / 15 / 30 / 60 / 1D / 1W / 1M columns show how many bars in a row each ticker has been in an Ideal Squeeze on that timeframe right now — blank means it isn’t. This is the same Ideal Squeeze condition as the column above, just checked on every timeframe instead of only Daily.', targetId: 'sqz-table' },
          { text: 'Data refreshes automatically every 5 minutes. Click Refresh any time for an immediate update — it also resets the view back to baseline, clearing every filter and the sort order.', targetId: 'sqz-refresh-btn' },
          { text: 'Export the current filtered list to Excel any time.', targetId: 'sqz-export-btn' },
        ]}
      />

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--c-text-primary)]">QE Squeeze Scanner</h1>
          <p className="mt-1 text-xs text-[var(--c-text-muted)]">
            {updatedAt ? `Last updated ${updatedAt}` : 'Loading…'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              id="sqz-filters-btn"
              onClick={() => setFiltersOpen((o) => !o)}
              className={`relative rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                filtersOpen
                  ? 'border-violet-500/40 bg-violet-500/20 text-[var(--c-violet)]'
                  : 'border-[var(--c-border)] text-[var(--c-text-secondary)] hover:bg-[var(--c-hover)]'
              }`}
            >
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {filtersOpen && (
              <FiltersPanel
                tickerQ={tickerQ} setTickerQ={setTickerQ}
                idealFilter={idealFilter} setIdealFilter={setIdealFilter}
                stackedFilter={stackedFilter} setStackedFilter={setStackedFilter}
                rsiMin={rsiMin} setRsiMin={setRsiMin} rsiMax={rsiMax} setRsiMax={setRsiMax}
                range52wMin={range52wMin} setRange52wMin={setRange52wMin}
                timeframeFilter={timeframeFilter} toggleTimeframe={toggleTimeframe}
                onClear={clearFilters} onClose={() => setFiltersOpen(false)}
                total={rows.length} filtered={sorted.length}
              />
            )}
          </div>
          <button
            id="sqz-refresh-btn"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh data and reset the view to baseline (clears filters and sort)"
            className="rounded-lg border border-[var(--c-border)] px-3 py-1.5 text-xs font-medium text-[var(--c-text-secondary)] transition hover:bg-[var(--c-hover)] disabled:opacity-60"
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            id="sqz-export-btn"
            onClick={handleExport}
            disabled={sorted.length === 0}
            className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-[var(--c-cyan-strong)] transition hover:bg-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Export to Excel
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-[var(--c-rose)]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-xl bg-[var(--c-hover)]" />
          ))}
        </div>
      ) : (
        <div id="sqz-table" className="max-h-[70vh] overflow-y-auto rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-card)]">
          <table className="w-full table-fixed text-xs">
            <thead className="sticky top-0 z-10 bg-[var(--c-bg-card)]">
              <tr className="border-b border-[var(--c-border-subtle)]">
                <SortTh label="Symbol" sk="ticker" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="w-[64px] pl-3 pr-2 text-left" />
                <SortTh label="Name" sk="name" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="w-[150px] px-2 text-left" />
                <SortTh label="Sector" sk="sector" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="w-[100px] px-2 text-left" />
                <SortTh label="Close" sk="close" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="w-[64px] px-2 text-center" tooltip={CLOSE_TOOLTIP} />
                <SortTh label="Last" sk="last" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="w-[64px] px-2 text-center" tooltip={LAST_TOOLTIP} />
                <SortTh label="Net Chg $" sk="net_chg" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="w-[68px] px-2 text-center" tooltip={NET_CHG_TOOLTIP} />
                <SortTh label="Net Chg %" sk="net_chg_pct" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="w-[68px] px-2 text-center" tooltip={NET_CHG_TOOLTIP} />
                <SortTh label="RSI" sk="rsi" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="w-[48px] px-2 text-center" tooltip={RSI_TOOLTIP} />
                <SortTh label="52W Range %" sk="range_52w_pct" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="w-[68px] px-2 text-center" tooltip={RANGE_52W_TOOLTIP} />
                <SortTh label="Ideal Squeeze" sk="ideal_squeeze" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="w-[80px] px-2 text-center" tooltip={IDEAL_SQUEEZE_TOOLTIP} />
                <SortTh label="Stacked EMA" sk="stacked_ema" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="w-[80px] px-2 text-center" tooltip={STACKED_EMA_TOOLTIP} />
                {TIMEFRAME_COLS.map((c) => (
                  <SortTh key={c.key} label={c.label} sk={c.key} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="w-[38px] px-1 text-center" tooltip={c.tooltip} />
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.ticker} className="border-b border-[var(--c-border-subtle)] transition-colors hover:bg-[var(--c-hover)]">
                  <td className="py-2.5 pl-3 pr-2 font-bold text-[var(--c-text-primary)] whitespace-nowrap">{r.ticker}</td>
                  <td className="px-2 py-2.5 text-[var(--c-text-secondary)] whitespace-nowrap truncate" title={r.name ?? ''}>{r.name ?? '—'}</td>
                  <td className="px-2 py-2.5 text-[var(--c-text-muted)] whitespace-nowrap truncate" title={r.sector ?? ''}>{r.sector ?? '—'}</td>
                  <td className="px-2 py-2.5 text-center font-mono text-[var(--c-text-secondary)]">{r.close != null ? `$${r.close.toFixed(2)}` : '—'}</td>
                  <td className="px-2 py-2.5 text-center font-mono text-[var(--c-text-primary)]">{r.last != null ? `$${r.last.toFixed(2)}` : '—'}</td>
                  <td className="px-2 py-2.5 text-center"><SignedNum value={r.net_chg} fmt={(v) => `$${Math.abs(v).toFixed(2)}`} /></td>
                  <td className="px-2 py-2.5 text-center"><SignedNum value={r.net_chg_pct} fmt={(v) => `${Math.abs(v).toFixed(2)}%`} /></td>
                  <td className="px-2 py-2.5 text-center font-mono text-[var(--c-text-secondary)]">{r.rsi != null ? r.rsi.toFixed(1) : '—'}</td>
                  <td className="px-2 py-2.5 text-center font-mono text-[var(--c-text-secondary)]">{r.range_52w_pct != null ? `${r.range_52w_pct.toFixed(1)}%` : '—'}</td>
                  <td className="px-2 py-2.5 text-center"><DirectionBadge value={r.ideal_squeeze} /></td>
                  <td className="px-2 py-2.5 text-center"><DirectionBadge value={r.stacked_ema} /></td>
                  {TIMEFRAME_COLS.map((c) => (
                    <td key={c.key} className="px-1 py-2.5 text-center"><SqzCount value={r[c.key]} /></td>
                  ))}
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={11 + TIMEFRAME_COLS.length} className="py-8 text-center text-[var(--c-text-muted)]">
                    No tickers match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showStrategyInfo && (
        <StrategyThesisModal
          accent="violet"
          title="How to Trade: Volatility Squeeze Breakouts"
          thesis="A “squeeze” is a period when a stock's price action goes unusually quiet — trading in a tight range with volatility compressed to multi-period lows. Quiet stretches like this often precede a bigger move. This scanner watches for that compression and flags the moment momentum starts breaking in a direction."
          ideas={[
            'Prioritize tickers flagged as an Ideal Squeeze — these combine the tightest compression with a fresh momentum trigger.',
            "Wait for the momentum trigger to fire before entering. A stock can stay compressed for a while — don't front-run the move.",
            'Trade in the direction the momentum signal points: bullish trigger for long exposure, bearish trigger for short/put exposure.',
            'Consider a defined-risk options structure (like a debit spread) instead of shares if you want to cap downside if the breakout fails.',
            'Set a stop near the edge of the range the stock was compressing in — a move back inside that range usually means the breakout failed.',
          ]}
          onClose={() => setShowStrategyInfo(false)}
        />
      )}
    </div>
  );
}
