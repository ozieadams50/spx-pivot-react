import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import PageGuide from '../components/PageGuide';

function todayISO() { return new Date().toISOString().slice(0, 10); }

function getETTime() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false,
  }).formatToParts(new Date());
  const h = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10);
  const m = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0', 10);
  const s = parseInt(parts.find(p => p.type === 'second')?.value ?? '0', 10);
  return { h, m, s, totalMinutes: h * 60 + m };
}

function nearestStrike(price) {
  return Math.round(price / 5) * 5;
}

function fmtPrice(n) {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtMoc(n) {
  if (n == null) return '--';
  const prefix = n > 0 ? '+' : '';
  return `${prefix}${Number(n).toLocaleString()}`;
}

function fmtDateLong(iso) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

function countdownTo(targetH, targetM) {
  const et = getETTime();
  const nowSec = et.h * 3600 + et.m * 60 + et.s;
  const targetSec = targetH * 3600 + targetM * 60;
  const diff = targetSec - nowSec;
  if (diff <= 0) return null;
  const mins = Math.floor(diff / 60);
  const secs = diff % 60;
  return { mins, secs, display: `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}` };
}

function PulsingDot({ color = 'bg-emerald-400' }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${color} opacity-50`} />
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${color}`} />
    </span>
  );
}

function LiveSPXBar({ spxData }) {
  return (
    <div className="mb-6 rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-card)] p-5 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <PulsingDot />
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">
            S&P 500 Index
          </span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-3xl font-bold font-mono text-[var(--c-text-primary)]">
            {spxData?.price != null ? fmtPrice(spxData.price) : '--'}
          </span>
          {spxData?.timestamp && (
            <span className="text-xs text-[var(--c-text-faint)]">
              {new Date(spxData.timestamp).toLocaleTimeString('en-US', {
                timeZone: 'America/New_York',
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
              })} ET
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function WaitingState({ isAdmin, mocData }) {
  const [cd, setCd] = useState(countdownTo(15, 50));

  useEffect(() => {
    const id = setInterval(() => setCd(countdownTo(15, 50)), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-card)] p-8 text-center shadow-lg">
        <div className="mb-4 text-5xl">&#9719;</div>
        <h2 className="mb-3 text-xl font-bold text-[var(--c-text-primary)]">Waiting for Market Close Window</h2>
        <p className="mx-auto max-w-lg text-sm leading-relaxed text-[var(--c-text-secondary)]">
          {isAdmin
            ? 'The EOD-MOC signal activates at 3:50 PM ET when GEX positioning and market-on-close imbalance data become available.'
            : 'The End of Day signal will activate at 3:50 PM ET when Market Makers positioning and overall market balances become available.'}
        </p>
        {cd && (
          <div className="mt-6">
            <p className="mb-1 text-xs font-medium uppercase tracking-widest text-[var(--c-text-dimmed)]">
              Time until 3:50 PM ET
            </p>
            <p className="text-4xl font-bold font-mono text-[var(--c-cyan)]">{cd.display}</p>
          </div>
        )}
      </div>

      {isAdmin && mocData?.gex_ratio != null && (
        <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-panel)] p-6 shadow-lg">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">
            Today's SPX Dealer GEX
          </p>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center rounded-xl border px-3 py-1 text-sm font-bold ${
              mocData.gex_ratio < 0.5
                ? 'border-rose-500/30 bg-rose-500/10 text-[var(--c-rose)]'
                : 'border-emerald-500/30 bg-emerald-500/10 text-[var(--c-emerald)]'
            }`}>
              {mocData.gex_ratio < 0.5 ? 'Negative' : 'Positive'}
            </span>
            <span className="text-sm font-mono text-[var(--c-text-secondary)]">
              ({mocData.gex_ratio.toFixed(2)})
            </span>
          </div>
          {mocData.updated_at && (
            <p className="mt-2 text-xs text-[var(--c-text-faint)]">
              Entered: {new Date(mocData.updated_at).toLocaleString('en-US', { timeZone: 'America/New_York' })} ET
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function TradeDayBanner({ isAdmin, mocData }) {
  const [cd, setCd] = useState(countdownTo(15, 55));

  useEffect(() => {
    const id = setInterval(() => setCd(countdownTo(15, 55)), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-r from-cyan-600/80 to-cyan-400/80 p-8 text-center shadow-xl">
        <h2 className="text-4xl font-black tracking-tight text-white">TRADE DAY</h2>
        {isAdmin && (
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/80">
            SPX Dealer GEX is Negative — market makers are short gamma. Directional moves into the close are amplified.
          </p>
        )}
      </div>

      {isAdmin && (
        <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-panel)] p-6 shadow-lg">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">
            GEX Detail
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[var(--c-text-muted)]">Status</p>
              <p className="mt-1 text-lg font-bold text-[var(--c-rose)]">Negative</p>
            </div>
            <div>
              <p className="text-xs text-[var(--c-text-muted)]">Gamma Flip</p>
              <p className="mt-1 text-lg font-bold font-mono text-[var(--c-text-primary)]">7,525</p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-cyan-500/20 bg-[var(--c-bg-card)] p-6 text-center shadow-lg">
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-[var(--c-text-dimmed)]">
          Signal at 3:55 PM ET — stand by for spread recommendation
        </p>
        {cd ? (
          <p className="mt-3 text-5xl font-bold font-mono text-[var(--c-cyan)]">{cd.display}</p>
        ) : (
          <p className="mt-3 text-sm text-[var(--c-text-secondary)]">Signal window reached</p>
        )}
      </div>

      {isAdmin && (
        <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-panel)] p-6 shadow-lg">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">
            3:50 PM MOC Snapshot
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[var(--c-text-muted)]">SPX MOC Imbalance</p>
              <p className={`mt-1 text-lg font-bold font-mono ${
                mocData?.spx_moc != null
                  ? mocData.spx_moc > 0 ? 'text-[var(--c-emerald)]' : 'text-[var(--c-rose)]'
                  : 'text-[var(--c-text-dimmed)]'
              }`}>
                {mocData?.spx_moc != null ? fmtMoc(mocData.spx_moc) : 'Pending'}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--c-text-muted)]">Mag7 MOC</p>
              <p className={`mt-1 text-lg font-bold font-mono ${
                mocData?.mag7_moc != null
                  ? mocData.mag7_moc > 0 ? 'text-[var(--c-emerald)]' : 'text-[var(--c-rose)]'
                  : 'text-[var(--c-text-dimmed)]'
              }`}>
                {mocData?.mag7_moc != null ? fmtMoc(mocData.mag7_moc) : '--'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NoTradeBanner({ isAdmin, mocData }) {
  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-r from-zinc-700/60 to-zinc-600/60 p-8 text-center shadow-xl">
        <h2 className="text-4xl font-black tracking-tight text-white/90">NO TRADE DAY</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/60">
          {isAdmin
            ? 'SPX Dealer GEX is Positive — market makers are long gamma, dampening directional moves into the close.'
            : "Dealer positions didn't support placing a trade today."}
        </p>
      </div>

      {isAdmin && (
        <>
          <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-panel)] p-6 shadow-lg">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">
              GEX Detail
            </p>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-bold text-[var(--c-emerald)]">
                Positive
              </span>
              <span className="text-sm font-mono text-[var(--c-text-secondary)]">
                ({mocData?.gex_ratio?.toFixed(2) ?? '--'})
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-panel)] p-6 shadow-lg">
            <p className="text-sm leading-relaxed text-[var(--c-text-secondary)]">
              Positive GEX dampens directional moves into the close. No spread recommendation today. See you tomorrow.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function SpreadLeg({ type, strike, label }) {
  const isBuy = type === 'buy';
  return (
    <div className={`flex-1 rounded-2xl border p-5 ${
      isBuy
        ? 'border-cyan-500/30 bg-cyan-500/5'
        : 'border-violet-500/30 bg-violet-500/5'
    }`}>
      <p className={`mb-1 text-xs font-semibold uppercase tracking-widest ${
        isBuy ? 'text-[var(--c-cyan)]' : 'text-[var(--c-violet)]'
      }`}>
        {label}
      </p>
      <p className="text-2xl font-bold font-mono text-[var(--c-text-primary)]">
        {fmtPrice(strike)}
      </p>
    </div>
  );
}

function SignalView({ isAdmin, mocData, spxData }) {
  const direction = mocData.spx_moc > 0 ? 'CALL' : 'PUT';
  const isCall = direction === 'CALL';
  const price = spxData?.price ?? 0;
  const longStrike = nearestStrike(price);
  const shortStrike = isCall ? longStrike + 5 : longStrike - 5;

  return (
    <div className="space-y-5">
      <div className={`rounded-3xl p-8 text-center shadow-xl ${
        isCall
          ? 'bg-gradient-to-r from-emerald-600/80 to-emerald-400/80'
          : 'bg-gradient-to-r from-rose-600/80 to-rose-400/80'
      }`}>
        <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl">
          {direction} NET DEBIT SPREAD
        </h2>
      </div>

      <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-card)] p-6 shadow-lg">
        <div className="mb-4 flex items-center gap-3">
          <span className={`inline-flex items-center rounded-xl border px-3 py-1 text-xs font-bold ${
            isCall
              ? 'border-emerald-500/30 bg-emerald-500/10 text-[var(--c-emerald)]'
              : 'border-rose-500/30 bg-rose-500/10 text-[var(--c-rose)]'
          }`}>
            {direction}
          </span>
          <span className="text-sm font-semibold text-[var(--c-text-primary)]">
            SPX 0DTE {isCall ? 'Call' : 'Put'} Spread
          </span>
        </div>

        <div className="mb-4 rounded-2xl border border-[var(--c-border-subtle)] bg-[var(--c-bg-panel)] px-4 py-3">
          <p className="text-xs text-[var(--c-text-muted)]">Max Width</p>
          <p className="text-lg font-bold font-mono text-[var(--c-text-primary)]">5.00 points</p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-4">
          <SpreadLeg
            type="buy"
            strike={longStrike}
            label={`Buy ${isCall ? 'Call' : 'Put'} (Long)`}
          />
          <SpreadLeg
            type="sell"
            strike={shortStrike}
            label={`Sell ${isCall ? 'Call' : 'Put'} (Short)`}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--c-border-subtle)] bg-[var(--c-bg-panel)] px-4 py-3">
            <p className="text-xs text-[var(--c-text-muted)]">Expiration</p>
            <p className="mt-0.5 text-sm font-semibold text-[var(--c-text-primary)]">
              {fmtDateLong(todayISO())} (0DTE)
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--c-border-subtle)] bg-[var(--c-bg-panel)] px-4 py-3">
            <p className="text-xs text-[var(--c-text-muted)]">Max Risk</p>
            <p className="mt-0.5 text-sm font-semibold text-[var(--c-text-primary)]">Net Debit Paid</p>
          </div>
          <div className="rounded-2xl border border-[var(--c-border-subtle)] bg-[var(--c-bg-panel)] px-4 py-3">
            <p className="text-xs text-[var(--c-text-muted)]">Max Profit</p>
            <p className="mt-0.5 text-sm font-semibold text-[var(--c-emerald)]">$5.00 - Debit</p>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-panel)] p-6 shadow-lg">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">
            3:55 PM MOC Confirmation
          </p>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-[var(--c-text-muted)]">SPX MOC Imbalance</p>
              <p className={`mt-1 text-lg font-bold font-mono ${
                mocData.spx_moc > 0 ? 'text-[var(--c-emerald)]' : 'text-[var(--c-rose)]'
              }`}>
                {fmtMoc(mocData.spx_moc)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--c-text-muted)]">Mag7 MOC</p>
              <p className={`mt-1 text-lg font-bold font-mono ${
                mocData.mag7_moc != null
                  ? mocData.mag7_moc > 0 ? 'text-[var(--c-emerald)]' : 'text-[var(--c-rose)]'
                  : 'text-[var(--c-text-dimmed)]'
              }`}>
                {mocData.mag7_moc != null ? fmtMoc(mocData.mag7_moc) : '--'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[var(--c-text-muted)]">GEX Status</p>
              <p className="mt-1 text-sm font-bold text-[var(--c-rose)]">Negative</p>
            </div>
            <div>
              <p className="text-xs text-[var(--c-text-muted)]">SPX Price at Signal</p>
              <p className="mt-1 text-lg font-bold font-mono text-[var(--c-text-primary)]">
                {spxData?.price != null ? fmtPrice(spxData.price) : '--'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EodMocSignal() {
  const { role } = useAuth();
  const isAdmin = role === 'admin' || role === 'superuser';

  const [spxData, setSpxData] = useState(null);
  const [mocData, setMocData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);

  const fetchMoc = useCallback(async () => {
    try {
      const data = await apiFetch(`/pivots/moc?date=${todayISO()}`);
      setMocData(data);
    } catch {
      setMocData(null);
    }
  }, []);

  const fetchSpx = useCallback(async () => {
    try {
      const data = await apiFetch('/pivots/spx-live');
      setSpxData(data);
    } catch {}
  }, []);

  useEffect(() => {
    Promise.all([fetchMoc(), fetchSpx()]).finally(() => setLoading(false));
  }, [fetchMoc, fetchSpx]);

  useEffect(() => {
    const spxId = setInterval(fetchSpx, 5000);
    const mocId = setInterval(fetchMoc, 30000);
    return () => { clearInterval(spxId); clearInterval(mocId); };
  }, [fetchSpx, fetchMoc]);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const et = getETTime();
  const hasGex = mocData?.gex_ratio != null;
  const gexNeg = hasGex && mocData.gex_ratio < 0.50;
  const hasMoc = mocData?.spx_moc != null;
  const past350 = et.totalMinutes >= 15 * 60 + 50;
  const past355 = et.totalMinutes >= 15 * 60 + 55;

  let pageState = 'waiting';
  if (past350 && hasGex) {
    if (gexNeg) {
      if (past355 && hasMoc) {
        pageState = 'signal';
      } else {
        pageState = 'trade';
      }
    } else {
      pageState = 'notrade';
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500/30 border-t-cyan-500" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <span className="mb-2 inline-flex items-center rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--c-violet)]">
          Quantified Edge
        </span>
        <h1 className="text-2xl font-bold text-[var(--c-text-primary)]">
          {isAdmin ? 'EOD-MOC Signal' : 'End of Day MOC Signal'}
        </h1>
        <p className="mt-1 text-sm text-[var(--c-text-muted)]">
          {isAdmin
            ? "End-of-day directional signal based on dealer gamma exposure and market-on-close imbalance flow."
            : "End-of-day directional signal based on dealer's option position exposure and market balance flow."}
        </p>
      </div>

      <PageGuide
        guideKey="eod-moc"
        accent="amber"
        title="How the EOD-MOC Signal works"
        description="This page delivers a directional trade signal in the final 10 minutes of each trading day. Here's the flow."
        steps={[
          { text: 'At 3:50 PM ET, the system checks dealer gamma exposure (GEX). If GEX is negative, market makers are short gamma and directional moves into the close are amplified — it\'s a Trade Day. If GEX is positive, dealers will absorb moves and there\'s no edge — No Trade Day.' },
          { text: 'On Trade Days, a 5-minute countdown begins. At 3:55 PM, the Market-on-Close (MOC) imbalance direction is confirmed. A large buy imbalance signals a bullish close; a large sell imbalance signals a bearish close.' },
          { text: 'Based on the MOC direction, the system recommends a 5-wide 0DTE SPX net debit spread — Call spread if bullish, Put spread if bearish — with the long leg at the strike nearest the current SPX price.' },
        ]}
      />

      <LiveSPXBar spxData={spxData} />

      {pageState === 'waiting' && <WaitingState isAdmin={isAdmin} mocData={mocData} />}
      {pageState === 'trade' && <TradeDayBanner isAdmin={isAdmin} mocData={mocData} />}
      {pageState === 'notrade' && <NoTradeBanner isAdmin={isAdmin} mocData={mocData} />}
      {pageState === 'signal' && <SignalView isAdmin={isAdmin} mocData={mocData} spxData={spxData} />}
    </div>
  );
}
