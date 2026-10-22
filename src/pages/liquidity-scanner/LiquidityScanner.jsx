import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { apiFetch } from '../../lib/api';
import PageGuide from '../../components/PageGuide';
import StrategyThesisModal from '../../components/StrategyThesisModal';

// Layout, filters, and sort behavior mirror SqueezeScanner.jsx -- keep the two
// pages visually in step. Data comes from the same 15-min scan pass
// (squeeze_scanner/scan.py -> liquidity_snapshot), admin/superuser only.

const DIRECTION_OPTS = [
  { label: 'Off', value: 'off' },
  { label: 'Both', value: 'both' },
  { label: '▲ Support', value: 'up' },
  { label: '▼ Supply', value: 'down' },
];

const TIMEFRAME_COLS = [
  { key: 'liq_5', id: '5', label: '5', tf: '5-minute', intraday: true, barMins: 5 },
  { key: 'liq_15', id: '15', label: '15', tf: '15-minute', intraday: true, barMins: 15 },
  { key: 'liq_30', id: '30', label: '30', tf: '30-minute', intraday: true, barMins: 30 },
  { key: 'liq_60', id: '60', label: '60', tf: '60-minute (hourly)', intraday: true, barMins: 60 },
  { key: 'liq_1d', id: '1d', label: '1D', tf: 'Daily', intraday: false, barMins: null },
].map((c) => ({ ...c, createdTooltip: `Created view: the newest liquidity zone being built on the ${c.tf} chart by a swing high (▼ red, supply) or swing low (▲ green, support). A swing only counts once the next 8 bars fail to go past it — the badge shows how many of those 8 bars it has held so far (e.g. 4/8), and ✓ means it is confirmed and the zone is still on the chart. Hover a cell for the swing price, how often swings at that stage become a zone, and the day’s key levels. Blank = nothing forming and no zone confirmed ${c.intraday ? 'today' : 'in the last 7 trading days'}.`, tooltip: `Last time price touched a liquidity zone on the ${c.tf} chart — ${c.intraday ? 'today’s session only' : 'within the last 7 trading days'}. ▲ green = touched a zone below price (support, where sell stops rest). ▼ red = touched a zone above price (supply / distribution, where buy stops rest). Only touches where price reached into the zone and the zone held count — the zone is still drawn on the chart. Bars that push through a zone are not counted. Hover a cell for the exact time and zone price. Blank = no touch ${c.intraday ? 'today' : 'in the last 7 trading days'}.` }));

// Share of forming swings that went on to confirm, by bars held (index 0 =
// 1 of 8 ... index 6 = 7 of 8). Measured 2026-10-22 over 80 tickers / 45
// days -- see SQUEEZE_SCANNER_ARCHITECTURE.md §11. Re-measure if the swing
// length (8) ever changes.
const CONFIRM_RATES = {
  '5': [44, 57, 66, 75, 82, 88, 95],
  '15': [46, 58, 67, 75, 81, 88, 94],
  '30': [52, 64, 73, 80, 86, 91, 96],
  '60': [44, 53, 60, 66, 72, 80, 95],
  '1d': [42, 54, 64, 72, 80, 88, 94],
};
const SWING_BARS = 8;

const VIEW_OPTS = [
  { label: 'Touches', value: 'touches', tooltip: 'Show the last time price touched a liquidity zone and the zone held.' },
  { label: 'Created', value: 'created', tooltip: 'Show liquidity zones being built right now by swing highs and lows — including ones still forming, with how close they are to being confirmed.' },
];
const PROGRESS_OPTS = [
  { label: 'Any', value: 0 },
  { label: '5/8 or later', value: 5 },
  { label: 'Confirmed only', value: SWING_BARS },
];
const PROGRESS_TOOLTIP = 'How far along a zone must be to show. A swing high or low becomes a zone once the next 8 bars fail to go past it. "5/8 or later" keeps swings that have held at least 5 of those bars (about 4 in 5 of those historically became zones) plus confirmed zones. "Confirmed only" hides anything still forming.';

// rel_vol = today's volume so far / the average volume over the same part of
// the session across the prior 20 days. 1.25 = 25% above normal.
const HIGH_VOLUME_RATIO = 1.25;
// 3x+ normal volume: the whole row is highlighted so it stands out in the list.
const EXTREME_VOLUME_RATIO = 3;
const INTRADAY_KEYS = new Set(TIMEFRAME_COLS.filter((c) => c.intraday).map((c) => c.key));
const ACTIVITY_OPTS = [
  { label: 'Touch', value: 'touch' },
  { label: 'Created', value: 'created' },
  { label: 'Both', value: 'both' },
];
const RECENT_OPTS = [
  { label: 'Off', value: 0 },
  { label: 'Last 30 min', value: 30 },
  { label: 'Last 1 hour', value: 60 },
];
const ACTIVITY_TOOLTIP = 'Which kind of activity the timeframe, direction and recent filters look at. Touch = price reached into a zone and it held. Created = a zone forming or confirmed from a swing high or low. Both = either one. Picking Touch or Created also switches the table to that view.';
const RECENT_TOOLTIP = 'Only show tickers with activity in this window on the 5 / 15 / 30 / 60 charts (or just the ones checked above). A touch counts by the time shown in its cell. A created zone counts when it was confirmed — or, if it is still forming, when the swing started. Market data runs about 15-30 minutes behind real time. Daily is not included.';
const HIGH_VOLUME_TOOLTIP = 'Today’s total trading volume so far compared with how much had normally traded by this same time of day (average of the last 20 sessions). It is not a single bar’s volume — a stock can show 5× here while each candle looks ordinary, if the extra volume is spread across the morning. TradingView’s built-in “Relative Volume at Time” indicator (length 20) measures the same thing. High = at least 25% more than normal. The number shows how many times normal volume, e.g. 1.6× = 60% above normal. At 3× or more the whole row is highlighted in amber. Blank for indexes, which have no volume.';

const DIRECTION_TOOLTIP = 'Only show tickers whose most recent touch was in this direction, on any of the timeframes checked below (or any timeframe if none are checked). ▲ Support = a zone below price. ▼ Supply = a zone above price.';
const ATR_TOOLTIP = 'Average True Range (14-day): how far this stock normally moves from high to low in a day, in dollars. Based on the 14 completed trading days before today, so it stays fixed all day. Matches TradingView’s ATR (14) on the daily chart as of yesterday’s bar.';
const ATR_PCT_TOOLTIP = 'How much of a normal day’s move has already happened today: today’s high minus today’s low (regular hours) divided by the ATR. 50% = half a normal day’s range so far; 100% or more (highlighted) = it has already moved a full average day or more, so further room may be limited. Blank before today’s first bar.';
// 100%+ of ATR used = a full average day's range already traded.
const ATR_FULL_PCT = 100;
const RSI_TOOLTIP = 'Relative Strength Index (14-day) — a 0-100 momentum reading measured against the size of this ticker’s own up days versus down days over its last 14 daily closes, not against other tickers or the market. Below 40 = oversold, 65-80 = strong momentum.';
const RANGE_52W_TOOLTIP = 'Where the Close sits within this ticker’s own trailing 52-week high/low range. 100% = at the 52-week high, 0% = at the 52-week low.';
const CLOSE_TOOLTIP = 'The previous trading day’s official closing price. Stays fixed all day until that day’s own close is finalized after the market close.';
const LAST_TOOLTIP = 'The most recent price available as of the last scan (updates every 15 minutes). Runs roughly 15-30 minutes behind real time due to the market data plan’s delay.';
const NET_CHG_TOOLTIP = 'Change from the previous day’s Close to the current Last price.';

const EARNINGS_HOUR = { bmo: 'before the open', amc: 'after the close', dmh: 'during market hours' };
function earningsTooltip(dateStr, hour) {
  const d = new Date(`${dateStr}T12:00:00`);
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const days = Math.round((d - today) / 86400000);
  const when = days <= 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`;
  const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const timing = EARNINGS_HOUR[hour] ? `, ${EARNINGS_HOUR[hour]}` : '';
  return `Earnings ${when} — ${label}${timing}. Expect bigger-than-usual moves around the report.`;
}

// ── Touch time helpers ──────────────────────────────────────────────────────
// Intraday *_at values are UTC ISO ("2026-10-21T14:30:00Z", bar start time);
// daily values are a plain date ("2026-10-21"), parsed at local noon so a
// timezone offset can't shift it onto the neighbouring day.
function touchTime(at) {
  if (!at) return null;
  return at.length === 10 ? new Date(`${at}T12:00:00`).getTime() : Date.parse(at);
}

function timeAgo(at, now) {
  if (!at) return '';
  if (at.length === 10) {
    const today = new Date(now); today.setHours(12, 0, 0, 0);
    const days = Math.round((today - touchTime(at)) / 86400000);
    return days <= 0 ? 'today' : `${days}d ago`;
  }
  const mins = Math.max(0, Math.round((now - touchTime(at)) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 24 * 60) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / (24 * 60))}d ago`;
}

function touchLabel(at) {
  if (!at) return '';
  if (at.length === 10) {
    return new Date(`${at}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
  return new Date(at).toLocaleString('en-US', {
    timeZone: 'America/New_York', weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  }) + ' ET';
}

// ── Created view helpers ────────────────────────────────────────────────────
// row.created[col.id] = { forming, confirmed } from the scan (either may be
// null). The cell shows the forming swing when there is one that meets the
// progress filter, otherwise the latest confirmed zone. With `since` (ms,
// intraday columns only) only an entry that is recent enough qualifies, so a
// cell can show a zone confirmed 10 min ago even while an older swing forms.
const createdRecentAt = (e) => e.confirmed_at ?? e.appeared_at;

function createdEntry(row, col, minProgress = 0, since = null) {
  const c = row.created?.[col.id];
  if (!c) return null;
  const cands = [c.forming && c.forming.progress >= minProgress ? c.forming : null, c.confirmed]
    .filter(Boolean)
    .filter((e) => since == null || !col.intraday || touchTime(createdRecentAt(e)) >= since);
  return cands[0] ?? null;
}

// One accessor for both views so filters and sorting treat them the same:
// dir = 'up' | 'down', at = time shown in the cell, recentAt = time the
// Recent Activity filter checks, level = zone price.
function cellInfo(row, col, view, minProgress, since = null) {
  if (view === 'created') {
    const e = createdEntry(row, col, minProgress, since);
    return e ? { dir: e.dir, at: e.at, recentAt: createdRecentAt(e), level: e.level, entry: e } : null;
  }
  const dir = row[col.key];
  const at = row[`${col.key}_at`];
  return dir && at ? { dir, at, recentAt: at, level: row[`${col.key}_level`] } : null;
}

const money = (v) => (v == null ? '—' : `$${v.toFixed(2)}`);

const KEY_LEVELS = [
  { label: 'Prior day', hi: 'prior_day_high', lo: 'prior_day_low' },
  { label: 'Premarket', hi: 'premarket_high', lo: 'premarket_low' },
  { label: 'Opening range (first 30 min)', hi: 'orb_high', lo: 'orb_low' },
  { label: 'Prior week', hi: 'prior_week_high', lo: 'prior_week_low' },
];

// Hover text block: the day's key levels + the one closest to this zone.
function keyLevelsText(levels, zonePrice) {
  if (!levels) return '';
  const lines = ['', 'Key levels (high / low):'];
  const all = [];
  for (const k of KEY_LEVELS) {
    lines.push(`   ${k.label}: ${money(levels[k.hi])} / ${money(levels[k.lo])}`);
    if (levels[k.hi] != null) all.push([`${k.label} high`, levels[k.hi]]);
    if (levels[k.lo] != null) all.push([`${k.label} low`, levels[k.lo]]);
  }
  lines.push(`   Round numbers: ${money(levels.round_above)} above / ${money(levels.round_below)} below`);
  if (levels.round_above != null) all.push(['Round number', levels.round_above]);
  if (levels.round_below != null) all.push(['Round number', levels.round_below]);
  if (zonePrice != null && all.length) {
    const [name, price] = all.reduce((best, cur) => (Math.abs(cur[1] - zonePrice) < Math.abs(best[1] - zonePrice) ? cur : best));
    lines.push(`   Closest to this zone: ${name} ${money(price)} (${money(Math.abs(price - zonePrice))} away)`);
  }
  return lines.join('\n');
}

function barsLeftText(col, left) {
  if (col.barMins == null) return `${left} more trading day${left === 1 ? '' : 's'}`;
  const mins = left * col.barMins;
  return mins < 60 ? `about ${mins} minutes` : `about ${+(mins / 60).toFixed(1)} hours`;
}

const EXPORT_COLUMNS = [
  { key: 'ticker', header: 'Symbol' },
  { key: 'name', header: 'Name' },
  { key: 'sector', header: 'Sector' },
  { key: 'earnings_date', header: 'Earnings Date (next 15d)' },
  { key: 'close', header: 'Close' },
  { key: 'last', header: 'Last' },
  { key: 'net_chg', header: 'Net Chg $' },
  { key: 'net_chg_pct', header: 'Net Chg %' },
  { key: 'atr', header: 'ATR (14d)' },
  { key: 'atr_pct', header: '% ATR Used' },
  { key: 'range_52w_pct', header: '52W Range %' },
  { key: 'rel_vol', header: 'Volume vs Normal (x)' },
];
const TOUCH_EXPORT = TIMEFRAME_COLS.flatMap((c) => [
  { key: c.key, header: `${c.label} Touch`, fmt: (v) => (v === 'up' ? 'Support' : v === 'down' ? 'Supply' : '') },
  { key: `${c.key}_at`, header: `${c.label} Last Touch`, fmt: (v) => touchLabel(v) },
  { key: `${c.key}_level`, header: `${c.label} Zone Price` },
]);
const createdExport = (minProgress) => TIMEFRAME_COLS.flatMap((c) => {
  const e = (r) => createdEntry(r, c, minProgress);
  return [
    { header: `${c.label} Zone`, get: (r) => (e(r)?.dir === 'up' ? 'Support' : e(r)?.dir === 'down' ? 'Supply' : '') },
    { header: `${c.label} Status`, get: (r) => (!e(r) ? '' : e(r).progress >= SWING_BARS ? 'Confirmed' : `Forming ${e(r).progress}/${SWING_BARS}`) },
    { header: `${c.label} Swing Time`, get: (r) => touchLabel(e(r)?.at) },
    { header: `${c.label} Zone Price`, get: (r) => e(r)?.level ?? '' },
  ];
});
const LEVELS_EXPORT = [
  ...KEY_LEVELS.flatMap((k) => [
    { header: `${k.label} High`, get: (r) => r.levels?.[k.hi] ?? '' },
    { header: `${k.label} Low`, get: (r) => r.levels?.[k.lo] ?? '' },
  ]),
  { header: 'Round Number Above', get: (r) => r.levels?.round_above ?? '' },
  { header: 'Round Number Below', get: (r) => r.levels?.round_below ?? '' },
];

const DEFAULT_FILTERS = {
  tickerQ: '',
  directionFilter: 'off',
  highVolumeOnly: false,
  recentMins: 0,
  rsiMin: '',
  rsiMax: '',
  range52wMin: '',
  timeframeFilter: new Set(),
  minProgress: 0,
};

// Timeframe columns sort by recency of the touch (desc = most recent first);
// a blank cell always sinks to the bottom regardless of direction.
const TOUCH_KEYS = new Set(TIMEFRAME_COLS.map((c) => c.key));

function compareRows(a, b, key, dir, view, minProgress, since) {
  if (['ticker', 'name', 'sector'].includes(key)) {
    const va = (a[key] ?? '').toLowerCase();
    const vb = (b[key] ?? '').toLowerCase();
    return dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
  }
  if (TOUCH_KEYS.has(key)) {
    const col = TIMEFRAME_COLS.find((c) => c.key === key);
    const va = touchTime(cellInfo(a, col, view, minProgress, since)?.at);
    const vb = touchTime(cellInfo(b, col, view, minProgress, since)?.at);
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    return dir === 'asc' ? va - vb : vb - va;
  }
  const va = a[key] ?? (dir === 'asc' ? Infinity : -Infinity);
  const vb = b[key] ?? (dir === 'asc' ? Infinity : -Infinity);
  return dir === 'asc' ? va - vb : vb - va;
}

// ── Badges / small display helpers ──────────────────────────────────────────

function SignedNum({ value, fmt }) {
  if (value == null) return <span className="text-[var(--c-text-faint)]">—</span>;
  const color = value > 0 ? 'text-[var(--c-emerald)]' : value < 0 ? 'text-[var(--c-rose)]' : 'text-[var(--c-text-secondary)]';
  return <span className={`font-mono ${color}`}>{value > 0 ? '+' : ''}{fmt(value)}</span>;
}

function HighVolume({ value }) {
  if (value == null) return <span className="text-[var(--c-text-faint)]">—</span>;
  if (value >= EXTREME_VOLUME_RATIO) {
    return (
      <span className="inline-flex items-center gap-1 rounded-xl border border-amber-400 bg-amber-500 px-2 py-0.5 text-xs font-bold text-black shadow shadow-amber-500/40">
        High <span className="font-mono text-[10px]">{value.toFixed(1)}×</span>
      </span>
    );
  }
  if (value >= HIGH_VOLUME_RATIO) {
    return (
      <span className="inline-flex items-center gap-1 rounded-xl border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-[var(--c-amber)]">
        High <span className="font-mono text-[10px]">{value.toFixed(1)}×</span>
      </span>
    );
  }
  return <span className="font-mono text-[var(--c-text-muted)]">{value.toFixed(1)}×</span>;
}

function TouchCell({ row, col, now }) {
  const dir = row[col.key];
  const at = row[`${col.key}_at`];
  if (!dir || !at) return <span className="text-[var(--c-text-faint)]">—</span>;
  const isUp = dir === 'up';
  const color = isUp ? 'text-[var(--c-emerald)]' : 'text-[var(--c-rose)]';
  const level = row[`${col.key}_level`];
  const touches = row[`${col.key}_touches`];
  const zone = level != null ? ` $${level.toFixed(2)}` : '';
  const title = `${isUp ? 'Support zone (below price)' : 'Supply zone (above price)'} touched ${touchLabel(at)} — price reached into the zone${zone} and held`
    + (touches > 1 ? `. Built from ${touches} swing points` : '')
    + keyLevelsText(row.levels, level);
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap" title={title}>
      <span className={`text-sm font-bold ${color}`}>{isUp ? '▲' : '▼'}</span>
      <span className="text-[10px] text-[var(--c-text-secondary)]">{timeAgo(at, now)}</span>
    </span>
  );
}

function CreatedCell({ row, col, now, minProgress, since }) {
  const e = createdEntry(row, col, minProgress, since);
  if (!e) return <span className="text-[var(--c-text-faint)]">—</span>;
  const isUp = e.dir === 'up';
  const color = isUp ? 'text-[var(--c-emerald)]' : 'text-[var(--c-rose)]';
  const confirmed = e.progress >= SWING_BARS;
  const side = isUp ? 'Support' : 'Supply';
  const swing = isUp ? 'Swing low' : 'Swing high';
  const lines = [];
  if (confirmed) {
    lines.push(`${isUp ? '▲' : '▼'} ${side} zone created — confirmed ${touchLabel(e.confirmed_at)}`);
    lines.push(`${swing} ${money(e.swing)} at ${touchLabel(e.at)}`);
    lines.push(e.merge_into != null
      ? `Joined the ${side.toLowerCase()} zone at ${money(e.merge_into)} — zone now at ${money(e.level)}`
      : `New zone — now at ${money(e.level)}`);
    lines.push('Still on the chart (price has not broken through it).');
  } else {
    const rate = CONFIRM_RATES[col.id]?.[e.progress - 1];
    const left = SWING_BARS - e.progress;
    lines.push(`${isUp ? '▲' : '▼'} ${side} zone forming — ${e.progress} of ${SWING_BARS} bars held`);
    if (rate != null) lines.push(`About ${rate}% of swings at this stage become a zone on the ${col.tf} chart`);
    lines.push(`${swing} ${money(e.swing)} at ${touchLabel(e.at)}`);
    lines.push(`Confirms in ${barsLeftText(col, left)} if price doesn’t go ${isUp ? 'below' : 'above'} it`);
    lines.push(e.merge_into != null
      ? `Would join the ${side.toLowerCase()} zone at ${money(e.merge_into)} — zone would move to ${money(e.level)}`
      : 'Would start a new zone');
  }
  const title = lines.join('\n') + keyLevelsText(row.levels, e.level);
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap" title={title}>
      <span className={`text-sm font-bold ${color}`}>{isUp ? '▲' : '▼'}</span>
      {confirmed ? (
        <span className="text-[10px] font-bold text-[var(--c-text-secondary)]">✓</span>
      ) : (
        <span className="rounded border border-[var(--c-border)] px-1 font-mono text-[9px] text-[var(--c-text-secondary)]">{e.progress}/{SWING_BARS}</span>
      )}
      <span className="text-[10px] text-[var(--c-text-secondary)]">{timeAgo(e.at, now)}</span>
    </span>
  );
}

// ── Sortable header cell (same pattern as SqueezeScanner.jsx) ──────────────

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

function FiltersPanel({
  directionFilter, setDirectionFilter,
  highVolumeOnly, setHighVolumeOnly,
  recentMins, setRecentMins,
  activity, onActivity,
  rsiMin, setRsiMin, rsiMax, setRsiMax,
  range52wMin, setRange52wMin,
  timeframeFilter, toggleTimeframe,
  view, minProgress, setMinProgress,
  onClear, onClose,
  total, filtered,
}) {
  const created = view === 'created';
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
          <div title={created
            ? 'Only show tickers with a zone forming or created on at least one of the checked timeframes.'
            : 'Only show tickers that touched a liquidity zone on at least one of the checked timeframes (today for 5/15/30/60, the last 7 trading days for 1D).'}>
            <span className="text-[10px] uppercase tracking-widest text-[var(--c-text-faint)]">{created ? 'Zone On' : 'Touched On'}</span>
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

          <div title={DIRECTION_TOOLTIP}>
            <span className="text-[10px] uppercase tracking-widest text-[var(--c-text-faint)]">Direction</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {DIRECTION_OPTS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDirectionFilter(opt.value)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                    directionFilter === opt.value
                      ? 'border-violet-500/40 bg-violet-500/20 text-[var(--c-violet)]'
                      : 'border-[var(--c-border)] text-[var(--c-text-dimmed)] hover:text-[var(--c-text-primary)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {(created || activity === 'both') && (
            <div title={PROGRESS_TOOLTIP}>
              <span className="text-[10px] uppercase tracking-widest text-[var(--c-text-faint)]">Zone Progress</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {PROGRESS_OPTS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setMinProgress(opt.value)}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                      minProgress === opt.value
                        ? 'border-violet-500/40 bg-violet-500/20 text-[var(--c-violet)]'
                        : 'border-[var(--c-border)] text-[var(--c-text-dimmed)] hover:text-[var(--c-text-primary)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div title={ACTIVITY_TOOLTIP}>
            <span className="text-[10px] uppercase tracking-widest text-[var(--c-text-faint)]">Activity</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {ACTIVITY_OPTS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onActivity(opt.value)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                    activity === opt.value
                      ? 'border-violet-500/40 bg-violet-500/20 text-[var(--c-violet)]'
                      : 'border-[var(--c-border)] text-[var(--c-text-dimmed)] hover:text-[var(--c-text-primary)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div title={RECENT_TOOLTIP}>
            <span className="text-[10px] uppercase tracking-widest text-[var(--c-text-faint)]">Recent Activity</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {RECENT_OPTS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRecentMins(opt.value)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                    recentMins === opt.value
                      ? 'border-violet-500/40 bg-violet-500/20 text-[var(--c-violet)]'
                      : 'border-[var(--c-border)] text-[var(--c-text-dimmed)] hover:text-[var(--c-text-primary)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div title={HIGH_VOLUME_TOOLTIP}>
            <span className="text-[10px] uppercase tracking-widest text-[var(--c-text-faint)]">High Volume</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {[{ label: 'Off', value: false }, { label: 'High Volume only', value: true }].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setHighVolumeOnly(opt.value)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                    highVolumeOnly === opt.value
                      ? 'border-violet-500/40 bg-violet-500/20 text-[var(--c-violet)]'
                      : 'border-[var(--c-border)] text-[var(--c-text-dimmed)] hover:text-[var(--c-text-primary)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

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

export default function LiquidityScanner() {
  const [rows, setRows] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  const [tickerQ, setTickerQ] = useState(DEFAULT_FILTERS.tickerQ);
  const [directionFilter, setDirectionFilter] = useState(DEFAULT_FILTERS.directionFilter);
  const [highVolumeOnly, setHighVolumeOnly] = useState(DEFAULT_FILTERS.highVolumeOnly);
  const [recentMins, setRecentMins] = useState(DEFAULT_FILTERS.recentMins);
  const [rsiMin, setRsiMin] = useState(DEFAULT_FILTERS.rsiMin);
  const [rsiMax, setRsiMax] = useState(DEFAULT_FILTERS.rsiMax);
  const [range52wMin, setRange52wMin] = useState(DEFAULT_FILTERS.range52wMin);
  const [timeframeFilter, setTimeframeFilter] = useState(DEFAULT_FILTERS.timeframeFilter);
  const [minProgress, setMinProgress] = useState(DEFAULT_FILTERS.minProgress);
  // Touches / Created is a mode, not a filter -- Refresh and Clear keep it.
  const [view, setView] = useState('touches');
  // Which activity the timeframe / direction / recent filters test. Kept in
  // step with the view switch; 'both' leaves the view as it is.
  const [activity, setActivity] = useState('touch');
  const changeView = (v) => { setView(v); setActivity(v === 'created' ? 'created' : 'touch'); };
  const changeActivity = (a) => {
    setActivity(a);
    if (a !== 'both') setView(a === 'created' ? 'created' : 'touches');
  };
  const since = recentMins > 0 ? now - recentMins * 60 * 1000 : null;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showStrategyInfo, setShowStrategyInfo] = useState(false);

  const [sortKey, setSortKey] = useState('ticker');
  const [sortDir, setSortDir] = useState('asc');

  const fetchTickers = (showSkeleton) => {
    if (showSkeleton) setLoading(true);
    else setRefreshing(true);
    setError(null);
    return apiFetch('/squeeze-scanner/liquidity')
      .then((data) => {
        setRows(data?.tickers ?? []);
        setUpdatedAt(data?.updatedAt ?? null);
      })
      .catch((e) => setError(e.message))
      .finally(() => { if (showSkeleton) setLoading(false); else setRefreshing(false); });
  };

  // Backend refreshes every 15 min; poll every 5. The 1-min tick keeps the
  // "35m ago" labels honest between polls.
  useEffect(() => {
    fetchTickers(true);
    const poll = setInterval(() => fetchTickers(false), 5 * 60 * 1000);
    const tick = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => { clearInterval(poll); clearInterval(tick); };
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
    setDirectionFilter(DEFAULT_FILTERS.directionFilter);
    setHighVolumeOnly(DEFAULT_FILTERS.highVolumeOnly);
    setRecentMins(DEFAULT_FILTERS.recentMins);
    setActivity(view === 'created' ? 'created' : 'touch');
    setRsiMin(DEFAULT_FILTERS.rsiMin);
    setRsiMax(DEFAULT_FILTERS.rsiMax);
    setRange52wMin(DEFAULT_FILTERS.range52wMin);
    setTimeframeFilter(new Set());
    setMinProgress(DEFAULT_FILTERS.minProgress);
  };

  // Refresh means "back to the baseline view" -- same as the Squeeze Scanner.
  const handleRefresh = () => {
    clearFilters();
    setSortKey('ticker');
    setSortDir('asc');
    setFiltersOpen(false);
    setNow(Date.now());
    fetchTickers(false);
  };

  const activeFilterCount =
    (directionFilter !== 'off' ? 1 : 0) +
    (highVolumeOnly ? 1 : 0) +
    (recentMins > 0 ? 1 : 0) +
    (activity === 'both' ? 1 : 0) +
    (rsiMin !== '' ? 1 : 0) +
    (rsiMax !== '' ? 1 : 0) +
    (range52wMin !== '' ? 1 : 0) +
    (timeframeFilter.size > 0 ? 1 : 0) +
    (activity !== 'touch' && minProgress > 0 ? 1 : 0);

  const filtered = useMemo(() => {
    const q = tickerQ.trim().toUpperCase();
    let tfKeys = timeframeFilter.size > 0 ? [...timeframeFilter] : TIMEFRAME_COLS.map((c) => c.key);
    // Recent window = the time shown in the cell (touch) or the confirm /
    // start-forming time (created). Daily carries only a date, so the recent
    // filter looks at 5/15/30/60 only.
    if (since != null) tfKeys = tfKeys.filter((key) => INTRADAY_KEYS.has(key));
    const want = directionFilter === 'off' ? null : directionFilter === 'both' ? ['up', 'down'] : [directionFilter];
    const views = activity === 'both' ? ['touches', 'created'] : [activity === 'created' ? 'created' : 'touches'];
    // Timeframe / direction / recency must all hold on the SAME column and
    // the same activity, so e.g. "▲ in the last 30 min" doesn't match an old
    // ▲ plus a fresh ▼.
    const keyMatches = (r, key) => {
      const col = TIMEFRAME_COLS.find((c) => c.key === key);
      return views.some((v) => {
        const info = cellInfo(r, col, v, minProgress, since);
        return info
          && (!want || want.includes(info.dir))
          && (since == null || touchTime(info.recentAt) >= since);
      });
    };
    const needsTouch = timeframeFilter.size > 0 || want || since != null;
    return rows.filter((r) => {
      if (q && !r.ticker.includes(q) && !(r.name ?? '').toUpperCase().includes(q)) return false;
      if (needsTouch && !tfKeys.some((key) => keyMatches(r, key))) return false;
      if (highVolumeOnly && !(r.rel_vol >= HIGH_VOLUME_RATIO)) return false;
      if (rsiMin !== '' && (r.rsi == null || r.rsi < Number(rsiMin))) return false;
      if (rsiMax !== '' && (r.rsi == null || r.rsi > Number(rsiMax))) return false;
      if (range52wMin !== '' && (r.range_52w_pct == null || r.range_52w_pct < Number(range52wMin))) return false;
      return true;
    });
  }, [rows, tickerQ, directionFilter, highVolumeOnly, since, activity, rsiMin, rsiMax, range52wMin, timeframeFilter, minProgress]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => compareRows(a, b, sortKey, sortDir, view, minProgress, since)),
    [filtered, sortKey, sortDir, view, minProgress, since],
  );

  const handleExport = () => {
    const cols = [...EXPORT_COLUMNS, ...(view === 'created' ? createdExport(minProgress) : TOUCH_EXPORT), ...LEVELS_EXPORT];
    const headers = cols.map((c) => c.header);
    const data = sorted.map((r) => cols.map((c) => (c.get ? c.get(r) : c.fmt ? c.fmt(r[c.key]) : r[c.key] ?? '')));
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Liquidity Scanner');
    XLSX.writeFile(wb, `qe_liquidity_scanner_${view}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="p-4 sm:p-6">
      <PageGuide
        guideKey="liquidity-scanner"
        title="Finding tickers testing their liquidity zones"
        description="This page scans the same universe as the QE Squeeze Scanner for tickers whose price has recently touched a liquidity zone — a price level where stop orders tend to pile up — on the 5-minute through Daily charts."
        extra={
          <button
            onClick={() => setShowStrategyInfo(true)}
            className="flex items-center gap-1.5 rounded-full border border-cyan-500/20 px-3 py-1 text-xs text-cyan-500/70 transition-colors hover:border-cyan-500/40 hover:text-[var(--c-cyan)]"
          >
            <span className="font-bold">$</span> How to Trade this Strategy
          </button>
        }
        steps={[
          { text: 'Use the Touches / Created switch to choose what the timeframe columns show. Touches = the last time price reached into a zone and the zone held. Created = zones being built right now by swing highs and lows, including ones still forming.', targetId: 'liq-view' },
          { text: 'Type a symbol or company name in the search box to jump straight to a ticker. Click ✕ to clear it.', targetId: 'liq-search' },
          { text: 'Click Filters to show only tickers that touched a zone on the timeframes you pick, in the direction you pick, touched or created in the last 30 minutes or hour, with High Volume, or within an RSI or 52-week range.', targetId: 'liq-filters-btn' },
          { text: 'ATR is how far the stock normally moves in a day (14-day average, in dollars). % ATR shows how much of that move has already happened today — 100% or more is highlighted, meaning a full normal day’s range is already done.', targetId: 'liq-table' },
          { text: 'High Volume compares today’s trading volume so far with a normal day at the same time of day. It lights up when volume is at least 25% above normal — a touch on heavy volume carries more weight. Tickers trading 3× normal volume or more get the whole row highlighted in amber so they stand out.', targetId: 'liq-table' },
          { text: 'The 5 / 15 / 30 / 60 / 1D columns show the last time price touched a liquidity zone on that chart and the zone held. A green ▲ means a support zone below price; a red ▼ means a supply zone above price. Only touches where the zone held are shown, so the zone is still on the chart. Bars that push through a zone are not counted. The time next to it says how long ago. The 5 / 15 / 30 / 60 columns only show touches from today; 1D looks back 7 trading days. Blank means no touch in that window.', targetId: 'liq-table' },
          { text: 'Hover any triangle to see the exact time and the zone’s price, plus the day’s key levels — prior day, premarket, opening range, prior week and nearby round numbers — and which one sits closest to the zone.', targetId: 'liq-table' },
          { text: 'In Created view, a swing high (▼) or swing low (▲) becomes a zone once the next 8 bars fail to go past it. A badge like 4/8 means it has held 4 of those 8 bars so far — hover to see how often swings at that stage become a zone. ✓ means confirmed and still on the chart. Use the Zone Progress filter to hide early ones.', targetId: 'liq-table' },
          { text: 'Click a timeframe header to sort by the most recent touch on that chart. Click again to flip the order. Tickers with no touch always stay at the bottom.', targetId: 'liq-table' },
          { text: 'A purple dot beside a ticker means it reports earnings within the next 15 days. Hover over the dot for the date.', targetId: 'liq-table' },
          { text: 'Data refreshes automatically every 5 minutes. Click Refresh any time for an immediate update — it also clears every filter and the sort order.', targetId: 'liq-refresh-btn' },
          { text: 'Export the current filtered list to Excel any time.', targetId: 'liq-export-btn' },
        ]}
      />

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--c-text-primary)]">QE Liquidity Scanner</h1>
          <p className="mt-1 text-xs text-[var(--c-text-muted)]">
            {updatedAt ? `Last updated ${updatedAt}` : loading ? 'Loading…' : 'No scan data yet'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div id="liq-view" className="flex rounded-lg border border-[var(--c-border)] p-0.5">
            {VIEW_OPTS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => changeView(opt.value)}
                title={opt.tooltip}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                  view === opt.value
                    ? 'bg-violet-500/20 text-[var(--c-violet)]'
                    : 'text-[var(--c-text-dimmed)] hover:text-[var(--c-text-primary)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div id="liq-search" className="relative">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--c-text-dimmed)]">⌕</span>
            <input
              type="text"
              value={tickerQ}
              onChange={(e) => setTickerQ(e.target.value.toUpperCase())}
              placeholder="Search symbol or name…"
              aria-label="Search symbol or name"
              className="w-44 rounded-lg border border-[var(--c-border)] bg-[var(--c-hover)] py-1.5 pl-7 pr-7 text-xs text-[var(--c-text-primary)] placeholder-[var(--c-text-faint)] focus:border-violet-500/50 focus:outline-none sm:w-56"
            />
            {tickerQ && (
              <button
                onClick={() => setTickerQ('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[var(--c-text-dimmed)] hover:text-[var(--c-text-primary)]"
              >
                ✕
              </button>
            )}
          </div>
          <div className="relative">
            <button
              id="liq-filters-btn"
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
                directionFilter={directionFilter} setDirectionFilter={setDirectionFilter}
                highVolumeOnly={highVolumeOnly} setHighVolumeOnly={setHighVolumeOnly}
                recentMins={recentMins} setRecentMins={setRecentMins}
                activity={activity} onActivity={changeActivity}
                rsiMin={rsiMin} setRsiMin={setRsiMin} rsiMax={rsiMax} setRsiMax={setRsiMax}
                range52wMin={range52wMin} setRange52wMin={setRange52wMin}
                timeframeFilter={timeframeFilter} toggleTimeframe={toggleTimeframe}
                view={view} minProgress={minProgress} setMinProgress={setMinProgress}
                onClear={clearFilters} onClose={() => setFiltersOpen(false)}
                total={rows.length} filtered={sorted.length}
              />
            )}
          </div>
          <button
            id="liq-refresh-btn"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh data and reset the view to baseline (clears filters and sort)"
            className="rounded-lg border border-[var(--c-border)] px-3 py-1.5 text-xs font-medium text-[var(--c-text-secondary)] transition hover:bg-[var(--c-hover)] disabled:opacity-60"
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            id="liq-export-btn"
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
        <div id="liq-table" className="max-h-[70vh] overflow-y-auto rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-card)]">
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
                <SortTh label="ATR" sk="atr" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="w-[60px] px-2 text-center" tooltip={ATR_TOOLTIP} />
                <SortTh label="% ATR" sk="atr_pct" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="w-[64px] px-2 text-center" tooltip={ATR_PCT_TOOLTIP} />
                <SortTh label="52W Range %" sk="range_52w_pct" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="w-[68px] px-2 text-center" tooltip={RANGE_52W_TOOLTIP} />
                <SortTh label="High Volume" sk="rel_vol" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="w-[84px] px-2 text-center" tooltip={HIGH_VOLUME_TOOLTIP} />
                {TIMEFRAME_COLS.map((c) => (
                  <SortTh key={c.key} label={c.label} sk={c.key} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="w-[84px] px-1 text-center" tooltip={view === 'created' ? c.createdTooltip : c.tooltip} />
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => {
                // Inset shadow (not border-l) so highlighted rows don't shift the column by a few px.
                const extreme = r.rel_vol >= EXTREME_VOLUME_RATIO;
                return (
                <tr
                  key={r.ticker}
                  title={extreme ? `Volume ${r.rel_vol.toFixed(1)}× normal for this time of day` : undefined}
                  className={`border-b border-[var(--c-border-subtle)] transition-colors ${
                    extreme ? 'bg-amber-500/10 hover:bg-amber-500/20' : 'hover:bg-[var(--c-hover)]'
                  }`}
                >
                  <td className={`py-2.5 pl-3 pr-2 font-bold whitespace-nowrap ${
                    extreme ? 'text-[var(--c-amber)] shadow-[inset_3px_0_0_0_#f59e0b]' : 'text-[var(--c-text-primary)]'
                  }`}>
                    {r.ticker}
                    {r.earnings_date && (
                      <span
                        title={earningsTooltip(r.earnings_date, r.earnings_hour)}
                        aria-label={earningsTooltip(r.earnings_date, r.earnings_hour)}
                        className="ml-1.5 inline-block h-2 w-2 cursor-help rounded-full bg-violet-400 align-middle shadow shadow-violet-500/50"
                      />
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-[var(--c-text-secondary)] whitespace-nowrap truncate" title={r.name ?? ''}>{r.name ?? '—'}</td>
                  <td className="px-2 py-2.5 text-[var(--c-text-muted)] whitespace-nowrap truncate" title={r.sector ?? ''}>{r.sector ?? '—'}</td>
                  <td className="px-2 py-2.5 text-center font-mono text-[var(--c-text-secondary)]">{r.close != null ? `$${r.close.toFixed(2)}` : '—'}</td>
                  <td className="px-2 py-2.5 text-center font-mono text-[var(--c-text-primary)]">{r.last != null ? `$${r.last.toFixed(2)}` : '—'}</td>
                  <td className="px-2 py-2.5 text-center"><SignedNum value={r.net_chg} fmt={(v) => `$${Math.abs(v).toFixed(2)}`} /></td>
                  <td className="px-2 py-2.5 text-center"><SignedNum value={r.net_chg_pct} fmt={(v) => `${Math.abs(v).toFixed(2)}%`} /></td>
                  <td className="px-2 py-2.5 text-center font-mono text-[var(--c-text-secondary)]">{r.atr != null ? `$${r.atr.toFixed(2)}` : '—'}</td>
                  <td className={`px-2 py-2.5 text-center font-mono ${
                    r.atr_pct >= ATR_FULL_PCT ? 'font-bold text-[var(--c-amber)]' : 'text-[var(--c-text-secondary)]'
                  }`}>{r.atr_pct != null ? `${Math.round(r.atr_pct)}%` : '—'}</td>
                  <td className="px-2 py-2.5 text-center font-mono text-[var(--c-text-secondary)]">{r.range_52w_pct != null ? `${r.range_52w_pct.toFixed(1)}%` : '—'}</td>
                  <td className="px-2 py-2.5 text-center"><HighVolume value={r.rel_vol} /></td>
                  {TIMEFRAME_COLS.map((c) => (
                    <td key={c.key} className="px-1 py-2.5 text-center">
                      {view === 'created'
                        ? <CreatedCell row={r} col={c} now={now} minProgress={minProgress} since={since} />
                        : <TouchCell row={r} col={c} now={now} />}
                    </td>
                  ))}
                </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={11 + TIMEFRAME_COLS.length} className="py-8 text-center text-[var(--c-text-muted)]">
                    {rows.length === 0 ? 'No scan data yet — the first scan of the day populates this page.' : 'No tickers match the current filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showStrategyInfo && (
        <StrategyThesisModal
          title="How to Trade: Liquidity Zone Touches"
          thesis="Traders park stop orders just beyond obvious swing highs and lows. Those clusters of resting orders — liquidity zones — act like magnets: price is often drawn to them, and the reaction when it gets there tells you a lot. This scanner flags when price has just reached one."
          ideas={[
            'A green ▲ means price dipped into a support zone below. Look for the bar to close back above the zone — that shows buyers defended it — before considering a long.',
            'A red ▼ means price pushed into a supply zone above. A close back below the zone suggests sellers are distributing there — a possible spot to trim longs or look for shorts.',
            'A close straight through a zone means the orders were absorbed and the move may continue — don’t fight it. Those bars are not flagged here.',
            'Touches lining up across several timeframes (for example 15, 60, and 1D all showing ▲) carry more weight than a lone 5-minute touch.',
            'Use the zone itself to define risk: a stop just beyond the zone keeps the loss small if the level fails.',
            'Created view shows zones as they form, before they are confirmed. A swing that has held more of its 8 bars is more likely to become a real zone — weigh an early 2/8 far less than a 6/8 or a ✓.',
            'A zone sitting right on a key level (prior day high, premarket low, opening range, a round number) stacks two kinds of resting orders in one spot — those tend to matter more.',
          ]}
          onClose={() => setShowStrategyInfo(false)}
        />
      )}
    </div>
  );
}
