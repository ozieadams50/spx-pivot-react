import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getET() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false,
  }).formatToParts(new Date());
  const h = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10);
  const m = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0', 10);
  const s = parseInt(parts.find(p => p.type === 'second')?.value ?? '0', 10);
  return { h, m, s, total: h * 60 + m };
}

function inMocWindow() {
  const { total } = getET();
  return total >= 15 * 60 + 50 && total <= 16 * 60 + 5;
}

function fmtMoc(n) {
  if (n == null) return '—';
  const abs = Math.abs(n);
  const sign = n >= 0 ? '+' : '-';
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(0)}M`;
  return `${sign}$${Math.abs(n).toLocaleString()}`;
}

function fmtGex(n) {
  if (n == null) return '—';
  const abs = Math.abs(n);
  const sign = n >= 0 ? '+' : '-';
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  return `${sign}${Math.abs(n).toLocaleString()}`;
}

function fmtNum(n, dp = 2) {
  if (n == null) return '—';
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

function ago(isoStr) {
  if (!isoStr) return null;
  const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

// ── Small atoms ───────────────────────────────────────────────────────────────

function PulsingDot({ color = 'bg-emerald-400' }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${color} opacity-50`} />
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${color}`} />
    </span>
  );
}

function StatCard({ label, value, sub, valueClass = 'text-[var(--c-text-primary)]' }) {
  return (
    <div className="rounded-2xl border border-[var(--c-border-subtle)] bg-[var(--c-bg-panel)] px-4 py-3">
      <p className="text-xs text-[var(--c-text-muted)]">{label}</p>
      <p className={`mt-1 text-lg font-bold font-mono ${valueClass}`}>{value ?? '—'}</p>
      {sub && <p className="text-[10px] text-[var(--c-text-faint)] mt-0.5">{sub}</p>}
    </div>
  );
}

// ── GEX panel ─────────────────────────────────────────────────────────────────

function GexPanel({ gex, isAdmin }) {
  if (!gex) {
    return (
      <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-card)] p-6 shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)] mb-3">
          {isAdmin ? 'GEX Snapshot' : 'Market Maker Positioning'}
        </p>
        <p className="text-sm text-[var(--c-text-muted)]">Waiting for data…</p>
      </div>
    );
  }

  const isNeg = gex.status === 'negative';
  const statusColor = isNeg ? 'text-[var(--c-rose)]' : 'text-[var(--c-emerald)]';
  const badgeCls = isNeg
    ? 'border-rose-500/30 bg-rose-500/10 text-[var(--c-rose)]'
    : 'border-emerald-500/30 bg-emerald-500/10 text-[var(--c-emerald)]';

  return (
    <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-card)] p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">
          {isAdmin ? 'GEX Snapshot' : 'Market Maker Positioning'}
        </p>
        <span className={`inline-flex items-center rounded-xl border px-3 py-1 text-xs font-bold ${badgeCls}`}>
          {isNeg ? 'Negative' : 'Positive'}
        </span>
      </div>

      {isAdmin ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label="Net GEX"      value={fmtGex(gex.net_gex)}        valueClass={isNeg ? 'text-[var(--c-rose)]' : 'text-[var(--c-emerald)]'} />
          <StatCard label="Call GEX"     value={fmtGex(gex.call_gex)}       valueClass="text-[var(--c-emerald)]" />
          <StatCard label="Put GEX"      value={fmtGex(gex.put_gex)}        valueClass="text-[var(--c-rose)]" />
          <StatCard label="GEX Flip"     value={fmtNum(gex.gex_flip, 0)}    sub="level" />
          <StatCard label="Put Wall"     value={fmtNum(gex.put_wall, 0)}    sub="support" />
          <StatCard label="Call Wall"    value={fmtNum(gex.call_wall, 0)}   sub="resistance" />
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-[var(--c-text-secondary)] leading-relaxed">
            {isNeg
              ? 'Market makers are currently short gamma. Directional moves tend to be amplified — price can trend more easily in the final hour.'
              : 'Market makers are currently long gamma. Directional moves tend to be dampened — price action may be choppy or range-bound into the close.'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Key Support"    value={gex.put_wall  ? fmtNum(gex.put_wall,  0) : '—'} />
            <StatCard label="Key Resistance" value={gex.call_wall ? fmtNum(gex.call_wall, 0) : '—'} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── MOC panel ─────────────────────────────────────────────────────────────────

function MocPanel({ moc, isAdmin }) {
  const active = inMocWindow();

  if (!active && !moc) {
    const { h, m } = getET();
    const nowMin = h * 60 + m;
    const target = 15 * 60 + 50;
    const diff = target - nowMin;
    return (
      <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-card)] p-6 shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)] mb-3">
          {isAdmin ? 'MOC Imbalance' : 'Market Close Flow'}
        </p>
        <p className="text-sm text-[var(--c-text-muted)]">
          Active 3:50 – 4:05 PM ET
          {diff > 0 ? ` · ${Math.floor(diff / 60)}h ${diff % 60}m away` : ''}
        </p>
      </div>
    );
  }

  if (!moc) {
    return (
      <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-card)] p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <PulsingDot color="bg-amber-400" />
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">
            MOC Window Open
          </p>
        </div>
        <p className="text-sm text-[var(--c-text-muted)]">Waiting for first reading…</p>
      </div>
    );
  }

  const isBuy = moc.direction === 'BUY';
  const dirColor = isBuy ? 'text-[var(--c-emerald)]' : 'text-[var(--c-rose)]';
  const dirBadge = isBuy
    ? 'border-emerald-500/30 bg-emerald-500/10 text-[var(--c-emerald)]'
    : 'border-rose-500/30 bg-rose-500/10 text-[var(--c-rose)]';

  return (
    <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-card)] p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PulsingDot color="bg-amber-400" />
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">
            {isAdmin ? 'MOC Imbalance' : 'Market Close Flow'}
          </p>
        </div>
        <span className={`inline-flex items-center rounded-xl border px-3 py-1 text-xs font-bold ${dirBadge}`}>
          {isBuy ? 'Buy Side' : 'Sell Side'}
        </span>
      </div>

      {isAdmin ? (
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Net MOC"   value={fmtMoc(moc.net_moc)}  valueClass={dirColor} />
          <StatCard label="Buy MOC"   value={fmtMoc(moc.buy_moc)}  valueClass="text-[var(--c-emerald)]" />
          <StatCard label="Sell MOC"  value={fmtMoc(moc.sell_moc)} valueClass="text-[var(--c-rose)]" />
        </div>
      ) : (
        <p className="text-sm text-[var(--c-text-secondary)] leading-relaxed">
          {isBuy
            ? 'Buy-side imbalance at the close. More shares need to be purchased at the 4 PM bell than sold.'
            : 'Sell-side imbalance at the close. More shares need to be sold at the 4 PM bell than purchased.'}
        </p>
      )}
    </div>
  );
}

// ── Header bg token (must be fully opaque for sticky to work) ────────────────
// ── Option chain panel ────────────────────────────────────────────────────────

// Column widths shared between the fixed header table and the scrollable body table
const CHAIN_COLS_ADMIN = ['9%','11%','11%','18%','11%','11%','9%']; // 7 cols
const CHAIN_COLS_SUB   = ['14%','14%','24%','14%','14%'];           // 5 cols

function ColGroup({ widths }) {
  return (
    <colgroup>
      {widths.map((w, i) => <col key={i} style={{ width: w }} />)}
    </colgroup>
  );
}

function ChainPanel({ chain, isAdmin }) {
  const scrollRef  = useRef(null);
  const atmRef     = useRef(null);
  const prevAtmRef = useRef(null);

  // Build strike map (hooks must run before early return)
  const byStrike = {};
  if (chain) {
    chain.forEach(row => {
      if (!byStrike[row.strike]) byStrike[row.strike] = {};
      byStrike[row.strike][row.option_type] = row;
    });
  }
  const strikes = Object.keys(byStrike).map(Number).sort((a, b) => b - a);

  // ATM = strike whose call delta is closest to 0.50
  const atm = strikes.length > 0
    ? strikes.reduce((best, s) => {
        const d = byStrike[s]?.C?.delta ?? 0;
        return Math.abs(d - 0.5) < Math.abs((byStrike[best]?.C?.delta ?? 0) - 0.5) ? s : best;
      }, strikes[0])
    : null;

  // Window: ATM ±30 by index (admin) or ±20 pts (subscriber)
  const atmIdx = atm != null ? strikes.indexOf(atm) : -1;
  const visible = isAdmin
    ? (atmIdx >= 0 ? strikes.slice(Math.max(0, atmIdx - 30), atmIdx + 31) : strikes)
    : strikes.filter(s => Math.abs(s - (atm ?? 0)) <= 20);

  // Center ATM in the scroll body using viewport-relative math
  useEffect(() => {
    if (atm == null || !atmRef.current || !scrollRef.current) return;
    if (atm === prevAtmRef.current) return;
    prevAtmRef.current = atm;
    const container = scrollRef.current;
    const cRect = container.getBoundingClientRect();
    const rRect = atmRef.current.getBoundingClientRect();
    container.scrollTop += rRect.top - cRect.top - container.clientHeight / 2 + rRect.height / 2;
  }, [atm]);

  if (!chain || chain.length === 0) {
    return (
      <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-card)] p-6 shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)] mb-3">
          SPX Option Chain
        </p>
        <p className="text-sm text-[var(--c-text-muted)]">Waiting for data…</p>
      </div>
    );
  }

  const expiration = byStrike[strikes[0]]?.C?.expiration ?? byStrike[strikes[0]]?.P?.expiration;
  const cols = isAdmin ? CHAIN_COLS_ADMIN : CHAIN_COLS_SUB;

  // SPX last price proxy: use ATM strike (within ~2.5 pts of actual)
  const spxProxy = atm != null ? atm.toLocaleString() : '—';

  return (
    <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-card)] p-6 shadow-lg">
      {/* Panel header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <PulsingDot />
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">
            SPX Option Chain
            {expiration && (
              <span className="ml-2 font-normal normal-case text-[var(--c-text-faint)]">
                exp {expiration}
              </span>
            )}
          </p>
        </div>
        {/* SPX last price (ATM proxy) */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-[var(--c-text-dimmed)]">SPX</span>
          <span className="font-mono font-bold text-base text-[var(--c-text-primary)]">{spxProxy}</span>
        </div>
      </div>

      {/* Fixed header table — never scrolls */}
      <div className="rounded-t-xl overflow-hidden border border-b-0 border-[var(--c-border-subtle)]">
        <table className="w-full text-sm table-fixed">
          <ColGroup widths={cols} />
          <thead>
            {/* Call / Put banners */}
            <tr>
              <th
                colSpan={isAdmin ? 3 : 2}
                className="py-1.5 text-center text-[10px] font-bold uppercase tracking-widest
                           bg-emerald-950 text-[var(--c-emerald)]"
              >
                {isAdmin ? 'Calls — Delta · Bid · Ask' : 'Calls — Bid · Ask'}
              </th>
              <th className="py-1.5 bg-[var(--c-bg-panel)]" />
              <th
                colSpan={isAdmin ? 3 : 2}
                className="py-1.5 text-center text-[10px] font-bold uppercase tracking-widest
                           bg-rose-950 text-[var(--c-rose)]"
              >
                {isAdmin ? 'Puts — Bid · Ask · Delta' : 'Puts — Bid · Ask'}
              </th>
            </tr>
            {/* Column labels */}
            <tr className="text-[10px] uppercase tracking-wider bg-[var(--c-bg-panel)] border-b border-[var(--c-border-subtle)]">
              {isAdmin && <th className="py-1.5 text-right pr-3 text-[var(--c-emerald)]">Delta</th>}
              <th className="py-1.5 text-right pr-3 text-[var(--c-emerald)]">Bid</th>
              <th className="py-1.5 text-right pr-4 text-[var(--c-emerald)]">Ask</th>
              <th className="py-1.5 text-center px-2 text-[var(--c-text-dimmed)]">Strike</th>
              <th className="py-1.5 text-left pl-4 text-[var(--c-rose)]">Bid</th>
              <th className="py-1.5 text-left pl-3 text-[var(--c-rose)]">Ask</th>
              {isAdmin && <th className="py-1.5 text-left pl-3 text-[var(--c-rose)]">Delta</th>}
            </tr>
          </thead>
        </table>
      </div>

      {/* Scrollable body — columns match header via shared ColGroup */}
      <div
        ref={scrollRef}
        className="overflow-y-auto rounded-b-xl border border-[var(--c-border-subtle)]"
        style={{ height: '440px' }}
      >
        <table className="w-full text-sm table-fixed border-collapse">
          <ColGroup widths={cols} />
          <tbody>
            {visible.map(strike => {
              const c     = byStrike[strike]?.C;
              const p     = byStrike[strike]?.P;
              const isAtm = strike === atm;
              const rowCls = isAtm
                ? 'bg-[var(--c-bg-panel)] font-semibold'
                : 'border-t border-[var(--c-border-subtle)] hover:bg-[var(--c-bg-panel)]/40';

              return (
                <tr key={strike} ref={isAtm ? atmRef : null} className={rowCls}>
                  {isAdmin && (
                    <td className="py-1 text-right pr-3 font-mono text-[var(--c-text-muted)]">
                      {c?.delta != null ? fmtNum(c.delta, 3) : '—'}
                    </td>
                  )}
                  <td className="py-1 text-right pr-3 font-mono text-[var(--c-emerald)]">
                    {c?.bid != null ? fmtNum(c.bid) : '—'}
                  </td>
                  <td className="py-1 text-right pr-4 font-mono text-[var(--c-emerald)]">
                    {c?.ask != null ? fmtNum(c.ask) : '—'}
                  </td>
                  <td className="py-1 text-center px-2 font-mono font-bold text-[var(--c-text-primary)]">
                    {strike.toLocaleString()}
                    {isAtm && (
                      <span className="ml-1 text-[10px] font-semibold rounded px-1 py-0.5 bg-[var(--c-cyan)]/20 text-[var(--c-cyan)]">
                        ATM
                      </span>
                    )}
                  </td>
                  <td className="py-1 text-left pl-4 font-mono text-[var(--c-rose)]">
                    {p?.bid != null ? fmtNum(p.bid) : '—'}
                  </td>
                  <td className="py-1 text-left pl-3 font-mono text-[var(--c-rose)]">
                    {p?.ask != null ? fmtNum(p.ask) : '—'}
                  </td>
                  {isAdmin && (
                    <td className="py-1 text-left pl-3 font-mono text-[var(--c-text-muted)]">
                      {p?.delta != null ? fmtNum(p.delta, 3) : '—'}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Chain search panel ────────────────────────────────────────────────────────

function todayLocal() {
  return new Date().toISOString().slice(0, 10);
}

// Market hours: 9:30 AM – 4:00 PM
const HOURS_AM = [9, 10, 11, 12];
const HOURS_PM = [12, 1, 2, 3, 4];
const MINUTES  = Array.from({ length: 60 }, (_, i) => i);

function to24(h12, ampm) {
  if (ampm === 'AM') return h12 === 12 ? 0 : h12;
  return h12 === 12 ? 12 : h12 + 12;
}

function to12(h24) {
  if (h24 === 0)  return { h: 12, ampm: 'AM' };
  if (h24 < 12)  return { h: h24, ampm: 'AM' };
  if (h24 === 12) return { h: 12,  ampm: 'PM' };
  return { h: h24 - 12, ampm: 'PM' };
}

function clampToMarket(h24, min) {
  const t = h24 * 60 + min;
  if (t < 9 * 60 + 30)  return { h24: 9,  min: 30 };
  if (t > 16 * 60)       return { h24: 16, min: 0  };
  return { h24, min };
}

function AmpmToggle({ value, onChange }) {
  return (
    <div className="flex rounded-lg border border-[var(--c-border)] overflow-hidden text-xs font-bold">
      {['AM', 'PM'].map(ap => (
        <button
          key={ap}
          type="button"
          onClick={() => onChange(ap)}
          className={`px-2.5 py-1.5 transition-colors ${
            value === ap
              ? 'bg-[var(--c-cyan)] text-black'
              : 'text-[var(--c-text-muted)] hover:text-[var(--c-text-primary)]'
          }`}
        >
          {ap}
        </button>
      ))}
    </div>
  );
}

function TimePickerGroup({ label, date, onDate, hour, onHour, ampm, onAmpm, minute, onMinute }) {
  const SEL = 'rounded-lg border border-[var(--c-border)] bg-[var(--c-bg-panel)] px-2 py-1.5 text-sm font-mono text-[var(--c-text-primary)] focus:outline-none focus:border-[var(--c-cyan)] cursor-pointer';
  const validHours = ampm === 'AM' ? HOURS_AM : HOURS_PM;

  const handleAmpm = (ap) => {
    onAmpm(ap);
    const nextHours = ap === 'AM' ? HOURS_AM : HOURS_PM;
    if (!nextHours.includes(hour)) onHour(nextHours[0]);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-semibold text-[var(--c-text-dimmed)] w-8">{label}</span>
      <input
        type="date"
        value={date}
        onChange={e => onDate(e.target.value)}
        className={SEL}
      />
      <select value={hour} onChange={e => onHour(Number(e.target.value))} className={SEL}>
        {validHours.map(h => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <AmpmToggle value={ampm} onChange={handleAmpm} />
      <span className="text-[var(--c-text-dimmed)] font-mono">:</span>
      <select value={minute} onChange={e => onMinute(Number(e.target.value))} className={SEL}>
        {MINUTES.map(m => (
          <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
        ))}
      </select>
    </div>
  );
}

function ChainSearch() {
  const now     = new Date();
  const nowC    = clampToMarket(now.getHours(), now.getMinutes());
  const nowTo12 = to12(nowC.h24);
  const pad     = n => String(n).padStart(2, '0');

  const [strike1,  setStrike1]  = useState('');
  const [strike2,  setStrike2]  = useState('');
  const [s1Err,    setS1Err]    = useState('');
  const [s2Err,    setS2Err]    = useState('');
  const [type,     setType]     = useState('both');

  const [fromDate, setFromDate] = useState(todayLocal());
  const [fromH,    setFromH]    = useState(9);
  const [fromAmpm, setFromAmpm] = useState('AM');
  const [fromM,    setFromM]    = useState(30);

  const [toDate,   setToDate]   = useState(todayLocal());
  const [toH,      setToH]      = useState(nowTo12.h);
  const [toAmpm,   setToAmpm]   = useState(nowTo12.ampm);
  const [toM,      setToM]      = useState(nowC.min);

  const [results,  setResults]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const validateStrike = (val, setErr) => {
    if (!val.trim()) { setErr(''); return true; }
    const n = Number(val);
    if (isNaN(n) || n % 5 !== 0) {
      setErr('Must be divisible by 5');
      return false;
    }
    setErr('');
    return true;
  };

  const handleSearch = async () => {
    const v1 = validateStrike(strike1, setS1Err);
    const v2 = validateStrike(strike2, setS2Err);
    if (!strike1.trim()) { setS1Err('Enter at least one strike'); return; }
    if (!v1 || !v2) return;
    setError('');
    setLoading(true);
    try {
      const strikes = [strike1.trim(), strike2.trim()].filter(Boolean).join(',');
      const types   = type === 'both' ? 'C,P' : type === 'call' ? 'C' : 'P';
      const from = `${fromDate}T${pad(to24(fromH, fromAmpm))}:${pad(fromM)}:00`;
      const to   = `${toDate}T${pad(to24(toH, toAmpm))}:${pad(toM)}:59`;
      const qs = new URLSearchParams({ from_dt: from, to_dt: to, strikes, types });
      const rows = await apiFetch(`/cp/chain/search?${qs}`);
      setResults(rows);
    } catch (e) {
      setError(e.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const pivoted = results ? (() => {
    const map = {};
    results.forEach(r => {
      map[r.snapshot_at] ??= {};
      map[r.snapshot_at][r.strike] ??= {};
      map[r.snapshot_at][r.strike][r.option_type] = { bid: r.bid, ask: r.ask, delta: r.delta };
    });
    return map;
  })() : null;

  const allStrikes = [
    ...(strike1.trim() && !s1Err ? [parseFloat(strike1)] : []),
    ...(strike2.trim() && !s2Err ? [parseFloat(strike2)] : []),
  ];

  const strikeCls = err =>
    `w-36 rounded-lg border px-3 py-1.5 text-sm font-mono bg-[var(--c-bg-panel)] text-[var(--c-text-primary)] focus:outline-none transition-colors ${
      err ? 'border-[var(--c-rose)]' : 'border-[var(--c-border)] focus:border-[var(--c-cyan)]'
    }`;

  return (
    <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-card)] p-6 shadow-lg">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)] mb-5">
        Option Price History Search
      </p>

      <div className="space-y-5">
        {/* Row 1: Strikes + Type */}
        <div className="flex flex-wrap items-start gap-5">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider text-[var(--c-text-dimmed)]">Strike 1</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="e.g. 7500"
              value={strike1}
              onChange={e => { setStrike1(e.target.value); validateStrike(e.target.value, setS1Err); }}
              className={strikeCls(s1Err)}
            />
            {s1Err && <span className="text-[10px] text-[var(--c-rose)]">{s1Err}</span>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider text-[var(--c-text-dimmed)]">Strike 2 <span className="normal-case font-normal">(optional)</span></label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="e.g. 7505"
              value={strike2}
              onChange={e => { setStrike2(e.target.value); validateStrike(e.target.value, setS2Err); }}
              className={strikeCls(s2Err)}
            />
            {s2Err && <span className="text-[10px] text-[var(--c-rose)]">{s2Err}</span>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider text-[var(--c-text-dimmed)]">Type</label>
            <div className="flex rounded-lg border border-[var(--c-border)] overflow-hidden">
              {[['call','Call'],['put','Put'],['both','Both']].map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setType(val)}
                  className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                    type === val
                      ? val === 'call' ? 'bg-emerald-600 text-white'
                      : val === 'put'  ? 'bg-rose-600 text-white'
                      :                  'bg-[var(--c-cyan)] text-black'
                      : 'text-[var(--c-text-muted)] hover:text-[var(--c-text-primary)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Time range */}
        <div className="flex flex-col gap-3">
          <TimePickerGroup
            label="From"
            date={fromDate} onDate={setFromDate}
            hour={fromH}   onHour={setFromH}
            ampm={fromAmpm} onAmpm={setFromAmpm}
            minute={fromM} onMinute={setFromM}
          />
          <TimePickerGroup
            label="To"
            date={toDate} onDate={setToDate}
            hour={toH}    onHour={setToH}
            ampm={toAmpm} onAmpm={setToAmpm}
            minute={toM}  onMinute={setToM}
          />
        </div>

        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-6 py-2 rounded-lg bg-[var(--c-cyan)] text-black text-sm font-bold
                     hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-[var(--c-rose)]">{error}</p>}

      {/* Results */}
      {pivoted && (
        <div className="mt-5">
          {Object.keys(pivoted).length === 0 ? (
            <p className="text-sm text-[var(--c-text-muted)]">No data found for that range.</p>
          ) : (
            <div className="overflow-auto rounded-xl border border-[var(--c-border-subtle)]" style={{ maxHeight: '400px' }}>
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[var(--c-bg-panel)] z-10">
                  <tr className="text-[10px] uppercase tracking-wider text-[var(--c-text-dimmed)]">
                    <th className="py-2 pl-3 text-left">Time (Local)</th>
                    {allStrikes.map(s => (
                      type !== 'put' && (
                        <th key={`c-hdr-${s}`} colSpan={2}
                            className="py-2 text-center text-[var(--c-emerald)]">
                          {s.toLocaleString()} Call
                        </th>
                      )
                    ))}
                    {allStrikes.map(s => (
                      type !== 'call' && (
                        <th key={`p-hdr-${s}`} colSpan={2}
                            className="py-2 text-center text-[var(--c-rose)]">
                          {s.toLocaleString()} Put
                        </th>
                      )
                    ))}
                  </tr>
                  <tr className="text-[10px] uppercase tracking-wider text-[var(--c-text-dimmed)] border-b border-[var(--c-border-subtle)]">
                    <th className="py-1 pl-3 text-left" />
                    {allStrikes.map(s => (
                      type !== 'put' && (
                        <>
                          <th key={`cb-${s}`} className="py-1 text-right pr-2 text-[var(--c-emerald)]">Bid</th>
                          <th key={`ca-${s}`} className="py-1 text-right pr-4 text-[var(--c-emerald)]">Ask</th>
                        </>
                      )
                    ))}
                    {allStrikes.map(s => (
                      type !== 'call' && (
                        <>
                          <th key={`pb-${s}`} className="py-1 text-right pr-2 text-[var(--c-rose)]">Bid</th>
                          <th key={`pa-${s}`} className="py-1 text-right pr-4 text-[var(--c-rose)]">Ask</th>
                        </>
                      )
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(pivoted).map(([ts, strikeMap]) => {
                    const localTime = new Date(ts).toLocaleTimeString('en-US', {
                      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
                    });
                    const localDate = new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    return (
                      <tr key={ts} className="border-t border-[var(--c-border-subtle)] hover:bg-[var(--c-bg-panel)]/40">
                        <td className="py-1.5 pl-3 font-mono text-[var(--c-text-muted)]">
                          {localDate} {localTime}
                        </td>
                        {allStrikes.map(s => {
                          const c = strikeMap[s]?.C;
                          return type !== 'put' ? (
                            <>
                              <td key={`cb-${s}`} className="py-1.5 text-right pr-2 font-mono text-[var(--c-emerald)]">
                                {c?.bid != null ? fmtNum(c.bid) : '—'}
                              </td>
                              <td key={`ca-${s}`} className="py-1.5 text-right pr-4 font-mono text-[var(--c-emerald)]">
                                {c?.ask != null ? fmtNum(c.ask) : '—'}
                              </td>
                            </>
                          ) : null;
                        })}
                        {allStrikes.map(s => {
                          const p = strikeMap[s]?.P;
                          return type !== 'call' ? (
                            <>
                              <td key={`pb-${s}`} className="py-1.5 text-right pr-2 font-mono text-[var(--c-rose)]">
                                {p?.bid != null ? fmtNum(p.bid) : '—'}
                              </td>
                              <td key={`pa-${s}`} className="py-1.5 text-right pr-4 font-mono text-[var(--c-rose)]">
                                {p?.ask != null ? fmtNum(p.ask) : '—'}
                              </td>
                            </>
                          ) : null;
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Not-connected state ───────────────────────────────────────────────────────

function NotConnected() {
  return (
    <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-card)] p-10 text-center shadow-lg">
      <div className="mb-4 text-4xl opacity-30">&#9679;</div>
      <h2 className="text-lg font-bold text-[var(--c-text-primary)] mb-2">Recorder Not Connected</h2>
      <p className="text-sm text-[var(--c-text-muted)] max-w-sm mx-auto">
        The Closing Print data recorder is not running or has not pushed a snapshot yet.
        Start the recorder on the collection machine to begin live data.
      </p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ClosingPrint() {
  const { role } = useAuth();
  const isAdmin = role === 'admin' || role === 'superuser';

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState(null);
  const [, tick] = useState(0);

  const fetchLive = useCallback(async () => {
    try {
      const res = await apiFetch('/cp/live');
      setData(res);
    } catch {
      // keep showing last known data on transient errors — don't blank the screen
    } finally {
      setLoading(false);
      setLastFetch(new Date().toISOString());
    }
  }, []);

  useEffect(() => {
    fetchLive();
  }, [fetchLive]);

  // Poll every 3 seconds
  useEffect(() => {
    const id = setInterval(fetchLive, 3000);
    return () => clearInterval(id);
  }, [fetchLive]);

  // Drive countdown and age display
  useEffect(() => {
    const id = setInterval(() => tick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const connected = data?.connected === true;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500/30 border-t-cyan-500" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <span className="mb-2 inline-flex items-center rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--c-violet)]">
          Quantified Edge
        </span>
        <div className="flex items-center gap-3 mt-1">
          <h1 className="text-2xl font-bold text-[var(--c-text-primary)]">Closing Print</h1>
          {connected
            ? <div className="flex items-center gap-1.5"><PulsingDot /><span className="text-xs text-emerald-400">Live</span></div>
            : <span className="text-xs text-[var(--c-text-faint)] border border-[var(--c-border)] rounded px-2 py-0.5">Offline</span>
          }
        </div>
        <p className="mt-1 text-sm text-[var(--c-text-muted)]">
          {isAdmin
            ? 'Live GEX metrics, MOC imbalance flow, and SPX option chain — updated every few seconds.'
            : 'Live market positioning and option flow as the trading day approaches the close.'}
        </p>
        {lastFetch && (
          <p className="mt-1 text-xs text-[var(--c-text-faint)]">
            Last updated {ago(lastFetch)}
            {data?.updated_at && ` · data from ${ago(data.updated_at)}`}
          </p>
        )}
      </div>

      {!connected ? (
        <NotConnected />
      ) : (
        <div className="space-y-5">
          {/* GEX + MOC side by side on wide screens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <GexPanel gex={data.gex} isAdmin={isAdmin} />
            <MocPanel moc={data.moc} isAdmin={isAdmin} />
          </div>

          {/* Option chain — full width */}
          <ChainPanel chain={data.chain} isAdmin={isAdmin} />

          {/* Historical chain search — full width */}
          <ChainSearch />
        </div>
      )}
    </div>
  );
}
