import { useState, useEffect, useCallback } from 'react';
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

// ── Option chain panel ────────────────────────────────────────────────────────

function ChainPanel({ chain, isAdmin }) {
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

  // Merge call/put rows by strike
  const byStrike = {};
  chain.forEach(row => {
    if (!byStrike[row.strike]) byStrike[row.strike] = {};
    byStrike[row.strike][row.option_type] = row;
  });
  const strikes = Object.keys(byStrike).map(Number).sort((a, b) => b - a);

  // ATM = strike whose call delta is closest to 0.5
  const atm = strikes.reduce((best, s) => {
    const d = byStrike[s]?.C?.delta ?? 0;
    return Math.abs(d - 0.5) < Math.abs((byStrike[best]?.C?.delta ?? 0) - 0.5) ? s : best;
  }, strikes[0]);

  // Subscriber sees 9 strikes (ATM ±4); admin sees all
  const visible = isAdmin ? strikes : strikes.filter(s => Math.abs(s - atm) <= 20);

  return (
    <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-card)] p-6 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <PulsingDot />
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">
          SPX Option Chain
          {byStrike[strikes[0]]?.C?.expiration && (
            <span className="ml-2 font-normal normal-case text-[var(--c-text-faint)]">
              exp {byStrike[strikes[0]].C.expiration}
            </span>
          )}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-[var(--c-text-dimmed)]">
              <th className="pb-2 text-right pr-3 text-[var(--c-emerald)]">Bid</th>
              <th className="pb-2 text-right pr-3 text-[var(--c-emerald)]">Ask</th>
              {isAdmin && <th className="pb-2 text-right pr-4 text-[var(--c-emerald)]">Delta</th>}
              <th className="pb-2 text-center px-4">Strike</th>
              {isAdmin && <th className="pb-2 text-left pl-4 text-[var(--c-rose)]">Delta</th>}
              <th className="pb-2 text-left pl-3 text-[var(--c-rose)]">Bid</th>
              <th className="pb-2 text-left pl-3 text-[var(--c-rose)]">Ask</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(strike => {
              const c = byStrike[strike]?.C;
              const p = byStrike[strike]?.P;
              const isAtm = strike === atm;
              const rowCls = isAtm
                ? 'bg-[var(--c-bg-panel)] font-semibold'
                : 'border-t border-[var(--c-border-subtle)]';

              return (
                <tr key={strike} className={rowCls}>
                  <td className="py-1.5 text-right pr-3 font-mono text-[var(--c-emerald)]">
                    {c?.bid != null ? fmtNum(c.bid) : '—'}
                  </td>
                  <td className="py-1.5 text-right pr-3 font-mono text-[var(--c-emerald)]">
                    {c?.ask != null ? fmtNum(c.ask) : '—'}
                  </td>
                  {isAdmin && (
                    <td className="py-1.5 text-right pr-4 font-mono text-[var(--c-text-secondary)]">
                      {c?.delta != null ? fmtNum(c.delta, 3) : '—'}
                    </td>
                  )}
                  <td className="py-1.5 text-center px-4 font-mono font-bold text-[var(--c-text-primary)]">
                    {strike.toLocaleString()}
                    {isAtm && (
                      <span className="ml-1.5 text-[10px] font-semibold rounded px-1 py-0.5 bg-[var(--c-cyan)]/20 text-[var(--c-cyan)]">
                        ATM
                      </span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="py-1.5 text-left pl-4 font-mono text-[var(--c-text-secondary)]">
                      {p?.delta != null ? fmtNum(p.delta, 3) : '—'}
                    </td>
                  )}
                  <td className="py-1.5 text-left pl-3 font-mono text-[var(--c-rose)]">
                    {p?.bid != null ? fmtNum(p.bid) : '—'}
                  </td>
                  <td className="py-1.5 text-left pl-3 font-mono text-[var(--c-rose)]">
                    {p?.ask != null ? fmtNum(p.ask) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!isAdmin && strikes.length > visible.length && (
        <p className="mt-3 text-xs text-[var(--c-text-faint)] text-center">
          Showing ATM ± 4 strikes
        </p>
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
      setData(null);
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
        </div>
      )}
    </div>
  );
}
