import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { apiFetch } from '../../lib/api';

const DIRECTION_OPTS = [
  { label: 'Off', value: 'off' },
  { label: 'Both', value: 'both' },
  { label: 'Bull', value: 'bull' },
  { label: 'Bear', value: 'bear' },
];

const TIMEFRAME_COLS = [
  { key: 'sqz_5', label: '5' },
  { key: 'sqz_15', label: '15' },
  { key: 'sqz_30', label: '30' },
  { key: 'sqz_60', label: '60' },
  { key: 'sqz_1d', label: '1D' },
  { key: 'sqz_1w', label: '1W' },
  { key: 'sqz_1m', label: '1M' },
];

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

function SortTh({ label, sk, sortKey, sortDir, onSort, className = '' }) {
  const active = sortKey === sk;
  return (
    <th
      onClick={() => onSort(sk)}
      className={`cursor-pointer select-none py-3 text-[10px] uppercase tracking-widest whitespace-nowrap transition-colors ${
        active ? 'text-[var(--c-violet-strong)]' : 'text-[var(--c-text-dimmed)] hover:text-[var(--c-text-secondary)]'
      } ${className}`}
    >
      {label}
      <span className="ml-1 text-[9px]">{active ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}</span>
    </th>
  );
}

// ── Filter bar ────────────────────────────────────────────────────────────

function DirectionToggle({ label, value, onChange, tooltip }) {
  return (
    <div className="flex items-center gap-1.5" title={tooltip}>
      <span className="text-[10px] uppercase tracking-widest text-[var(--c-text-faint)] mr-1">{label}</span>
      {DIRECTION_OPTS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-all ${
            value === opt.value
              ? 'border-violet-500/40 bg-violet-500/20 text-[var(--c-violet)]'
              : 'border-[var(--c-border)] text-[var(--c-text-dimmed)] hover:text-[var(--c-text-primary)]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function FilterBar({
  tickerQ, setTickerQ,
  idealFilter, setIdealFilter,
  stackedFilter, setStackedFilter,
  rsiMin, setRsiMin, rsiMax, setRsiMax,
  range52wMin, setRange52wMin,
  total, filtered,
}) {
  return (
    <div className="mb-4 rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-card)] p-3 flex flex-wrap items-center gap-3">
      <div className="relative min-w-[140px]">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--c-text-dimmed)] text-xs pointer-events-none">⌕</span>
        <input
          type="text"
          value={tickerQ}
          onChange={(e) => setTickerQ(e.target.value.toUpperCase())}
          placeholder="Symbol or name…"
          className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-hover)] py-1.5 pl-7 pr-3 text-sm text-[var(--c-text-primary)] placeholder-[var(--c-text-faint)] focus:border-violet-500/50 focus:outline-none"
        />
      </div>

      <DirectionToggle
        label="Ideal Squeeze"
        value={idealFilter}
        onChange={setIdealFilter}
        tooltip="A squeeze (price compression) forming inside an already-established trend, in the direction shown. Bull = building inside an uptrend, Bear = building inside a downtrend."
      />

      <DirectionToggle
        label="Stacked EMA"
        value={stackedFilter}
        onChange={setStackedFilter}
        tooltip="Three short-term trend averages lined up in order (fastest on top for Bull, slowest on top for Bear) — a simple trend-alignment check."
      />

      <div className="flex items-center gap-1.5" title="Momentum reading, 0-100. Below 40 = oversold, above 65-80 = strong momentum.">
        <span className="text-[10px] uppercase tracking-widest text-[var(--c-text-faint)] mr-1">RSI</span>
        <input
          type="number" value={rsiMin} onChange={(e) => setRsiMin(e.target.value)} placeholder="Min"
          className="w-16 rounded-lg border border-[var(--c-border)] bg-[var(--c-hover)] px-2 py-0.5 text-xs text-[var(--c-text-primary)] placeholder-[var(--c-text-faint)] focus:border-violet-500/50 focus:outline-none"
        />
        <span className="text-[var(--c-text-faint)] text-xs">–</span>
        <input
          type="number" value={rsiMax} onChange={(e) => setRsiMax(e.target.value)} placeholder="Max"
          className="w-16 rounded-lg border border-[var(--c-border)] bg-[var(--c-hover)] px-2 py-0.5 text-xs text-[var(--c-text-primary)] placeholder-[var(--c-text-faint)] focus:border-violet-500/50 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-1.5" title="Where price sits within its 52-week high/low range. 100% = at the 52-week high.">
        <span className="text-[10px] uppercase tracking-widest text-[var(--c-text-faint)] mr-1">52W Range % ≥</span>
        <input
          type="number" value={range52wMin} onChange={(e) => setRange52wMin(e.target.value)} placeholder="0"
          className="w-16 rounded-lg border border-[var(--c-border)] bg-[var(--c-hover)] px-2 py-0.5 text-xs text-[var(--c-text-primary)] placeholder-[var(--c-text-faint)] focus:border-violet-500/50 focus:outline-none"
        />
      </div>

      {filtered < total && (
        <span className="ml-auto text-xs text-[var(--c-text-dimmed)]">
          <span className="font-semibold text-[var(--c-text-primary)]">{filtered}</span> of {total}
        </span>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────

export default function SqueezeScanner() {
  const [rows, setRows] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [tickerQ, setTickerQ] = useState('');
  const [idealFilter, setIdealFilter] = useState('off');
  const [stackedFilter, setStackedFilter] = useState('off');
  const [rsiMin, setRsiMin] = useState('');
  const [rsiMax, setRsiMax] = useState('');
  const [range52wMin, setRange52wMin] = useState('');

  const [sortKey, setSortKey] = useState('ticker');
  const [sortDir, setSortDir] = useState('asc');

  const fetchTickers = (showSkeleton) => {
    if (showSkeleton) setLoading(true);
    setError(null);
    return apiFetch('/squeeze-scanner/tickers')
      .then((data) => {
        setRows(data?.tickers ?? []);
        setUpdatedAt(data?.updatedAt ?? null);
      })
      .catch((e) => setError(e.message))
      .finally(() => { if (showSkeleton) setLoading(false); });
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

  const filtered = useMemo(() => {
    const q = tickerQ.trim().toUpperCase();
    return rows.filter((r) => {
      if (q && !r.ticker.includes(q) && !(r.name ?? '').toUpperCase().includes(q)) return false;
      if (!matchesDirection(r.ideal_squeeze, idealFilter)) return false;
      if (!matchesDirection(r.stacked_ema, stackedFilter)) return false;
      if (rsiMin !== '' && (r.rsi == null || r.rsi < Number(rsiMin))) return false;
      if (rsiMax !== '' && (r.rsi == null || r.rsi > Number(rsiMax))) return false;
      if (range52wMin !== '' && (r.range_52w_pct == null || r.range_52w_pct < Number(range52wMin))) return false;
      return true;
    });
  }, [rows, tickerQ, idealFilter, stackedFilter, rsiMin, rsiMax, range52wMin]);

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
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--c-text-primary)]">QE Squeeze Scanner</h1>
          <p className="mt-1 text-xs text-[var(--c-text-muted)]">
            {updatedAt ? `Last updated ${updatedAt}` : 'Loading…'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchTickers(false)}
            className="rounded-lg border border-[var(--c-border)] px-3 py-1.5 text-xs font-medium text-[var(--c-text-secondary)] transition hover:bg-[var(--c-hover)]"
          >
            Refresh
          </button>
          <button
            onClick={handleExport}
            disabled={sorted.length === 0}
            className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-[var(--c-cyan-strong)] transition hover:bg-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Export to Excel
          </button>
        </div>
      </div>

      <FilterBar
        tickerQ={tickerQ} setTickerQ={setTickerQ}
        idealFilter={idealFilter} setIdealFilter={setIdealFilter}
        stackedFilter={stackedFilter} setStackedFilter={setStackedFilter}
        rsiMin={rsiMin} setRsiMin={setRsiMin} rsiMax={rsiMax} setRsiMax={setRsiMax}
        range52wMin={range52wMin} setRange52wMin={setRange52wMin}
        total={rows.length} filtered={sorted.length}
      />

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
        <div className="overflow-x-auto rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-card)]">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--c-border-subtle)]">
                <SortTh label="Symbol" sk="ticker" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="pl-4 pr-3 text-left" />
                <SortTh label="Name" sk="name" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="px-3 text-left" />
                <SortTh label="Sector" sk="sector" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="px-3 text-left" />
                <SortTh label="Close" sk="close" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="px-3 text-right" />
                <SortTh label="Last" sk="last" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="px-3 text-right" />
                <SortTh label="Net Chg $" sk="net_chg" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="px-3 text-right" />
                <SortTh label="Net Chg %" sk="net_chg_pct" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="px-3 text-right" />
                <SortTh label="RSI" sk="rsi" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="px-3 text-right" />
                <SortTh label="52W Range %" sk="range_52w_pct" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="px-3 text-right" />
                <SortTh label="Ideal Squeeze" sk="ideal_squeeze" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="px-3 text-center" />
                <SortTh label="Stacked EMA" sk="stacked_ema" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="px-3 text-center" />
                {TIMEFRAME_COLS.map((c) => (
                  <SortTh key={c.key} label={c.label} sk={c.key} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="px-3 text-center" />
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.ticker} className="border-b border-[var(--c-border-subtle)] transition-colors hover:bg-[var(--c-hover)]">
                  <td className="py-2.5 pl-4 pr-3 font-bold text-[var(--c-text-primary)] whitespace-nowrap">{r.ticker}</td>
                  <td className="px-3 py-2.5 text-[var(--c-text-secondary)] whitespace-nowrap max-w-[220px] truncate">{r.name ?? '—'}</td>
                  <td className="px-3 py-2.5 text-[var(--c-text-muted)] whitespace-nowrap">{r.sector ?? '—'}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-[var(--c-text-secondary)]">{r.close != null ? `$${r.close.toFixed(2)}` : '—'}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-[var(--c-text-primary)]">{r.last != null ? `$${r.last.toFixed(2)}` : '—'}</td>
                  <td className="px-3 py-2.5 text-right"><SignedNum value={r.net_chg} fmt={(v) => `$${Math.abs(v).toFixed(2)}`} /></td>
                  <td className="px-3 py-2.5 text-right"><SignedNum value={r.net_chg_pct} fmt={(v) => `${Math.abs(v).toFixed(2)}%`} /></td>
                  <td className="px-3 py-2.5 text-right font-mono text-[var(--c-text-secondary)]">{r.rsi != null ? r.rsi.toFixed(1) : '—'}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-[var(--c-text-secondary)]">{r.range_52w_pct != null ? `${r.range_52w_pct.toFixed(1)}%` : '—'}</td>
                  <td className="px-3 py-2.5 text-center"><DirectionBadge value={r.ideal_squeeze} /></td>
                  <td className="px-3 py-2.5 text-center"><DirectionBadge value={r.stacked_ema} /></td>
                  {TIMEFRAME_COLS.map((c) => (
                    <td key={c.key} className="px-3 py-2.5 text-center"><SqzCount value={r[c.key]} /></td>
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
    </div>
  );
}
