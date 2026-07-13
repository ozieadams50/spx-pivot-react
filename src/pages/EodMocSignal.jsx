import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import PageGuide from '../components/PageGuide';

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

function fmtPrice(n) {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtMoc(n) {
  if (n == null) return '--';
  const abs  = Math.abs(n);
  const sign = n >= 0 ? '+' : '-';
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(0)}M`;
  return `${sign}$${abs.toLocaleString()}`;
}

function tradeTypeLabel(gexStatus) {
  if (gexStatus === 'positive') return 'Call';
  if (gexStatus === 'negative') return 'Put';
  if (gexStatus === 'neutral')  return 'Neutral';
  return '--';
}

function countdownTo(targetH, targetM) {
  const et = getETTime();
  const nowSec    = et.h * 3600 + et.m * 60 + et.s;
  const targetSec = targetH * 3600 + targetM * 60;
  const diff = targetSec - nowSec;
  if (diff <= 0) return null;
  const mins = Math.floor(diff / 60);
  const secs = diff % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Play Day requires:
//   1. GEX Ratio < 0.35
//   2. |SPX MOC| >= $1.5B
//   3. MAG7 MOC same sign as SPX MOC
// Very: |SPX MOC| > $2B AND |MAG7 MOC| > $1B
const PLAY_GEX_RATIO_MAX = 0.35;
const PLAY_SPX_MOC_MIN   = 1.5e9;

function evalSignal(gexRatio, spxMoc, mag7Moc) {
  if (gexRatio == null || gexRatio >= PLAY_GEX_RATIO_MAX)    return { play: false, reason: 'gex_not_play' };
  if (spxMoc == null || mag7Moc == null)                     return { play: false, reason: 'moc_missing' };
  if (Math.abs(spxMoc) < PLAY_SPX_MOC_MIN)                  return { play: false, reason: 'spx_too_small' };
  if (Math.sign(spxMoc) !== Math.sign(mag7Moc))             return { play: false, reason: 'direction_mismatch' };

  const bullish = spxMoc > 0;
  const veryBig = Math.abs(spxMoc) > 2e9 && Math.abs(mag7Moc) > 1e9;
  return {
    play: true,
    bullish,
    veryBig,
    label: veryBig
      ? (bullish ? 'VERY BULLISH' : 'VERY BEARISH')
      : (bullish ? 'BULLISH' : 'BEARISH'),
  };
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
                hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true,
              })} ET
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function WaitingState({ isAdmin, gexStatus }) {
  const [cd, setCd] = useState(() => countdownTo(15, 55));

  useEffect(() => {
    const id = setInterval(() => setCd(countdownTo(15, 55)), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-card)] p-8 text-center shadow-lg">
        <div className="mb-4 text-5xl">&#9719;</div>
        <h2 className="mb-3 text-xl font-bold text-[var(--c-text-primary)]">Waiting for Signal Window</h2>
        <p className="mx-auto max-w-lg text-sm leading-relaxed text-[var(--c-text-secondary)]">
          {isAdmin
            ? 'The EOD-MOC signal evaluates at 3:55 PM ET using live dealer positioning and market-on-close imbalance data.'
            : "The End of Day signal activates at 3:55 PM ET when Market Maker positioning and overall market balances are confirmed."}
        </p>
        {cd && (
          <div className="mt-6">
            <p className="mb-1 text-xs font-medium uppercase tracking-widest text-[var(--c-text-dimmed)]">
              Time until 3:55 PM ET
            </p>
            <p className="text-4xl font-bold font-mono text-[var(--c-cyan)]">{cd}</p>
          </div>
        )}
      </div>

      {isAdmin && gexStatus && (
        <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-panel)] p-6 shadow-lg">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">
            Current Trade Type
          </p>
          <span className={`inline-flex items-center rounded-xl border px-3 py-1 text-sm font-bold ${
            gexStatus === 'negative'
              ? 'border-rose-500/30 bg-rose-500/10 text-[var(--c-rose)]'
              : gexStatus === 'neutral'
                ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
                : 'border-emerald-500/30 bg-emerald-500/10 text-[var(--c-emerald)]'
          }`}>
            {tradeTypeLabel(gexStatus)}
          </span>
        </div>
      )}
    </div>
  );
}

function AdminDataRow({ gexStatus, spxMoc, mag7Moc }) {
  const gexColor = gexStatus === 'negative' ? 'text-[var(--c-rose)]'
    : gexStatus === 'neutral' ? 'text-yellow-400'
    : gexStatus === 'positive' ? 'text-[var(--c-emerald)]'
    : 'text-[var(--c-text-dimmed)]';

  const mocColor = (n) => n == null
    ? 'text-[var(--c-text-dimmed)]'
    : n >= 0 ? 'text-[var(--c-emerald)]' : 'text-[var(--c-rose)]';

  return (
    <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-panel)] p-6 shadow-lg">
      <div className="flex items-center gap-2 mb-5">
        <PulsingDot color="bg-amber-400" />
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">
          Live Signal Data
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--c-text-muted)] mb-2">
            Trade Type
          </p>
          <p className={`text-3xl font-black leading-none ${gexColor}`}>
            {tradeTypeLabel(gexStatus)}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--c-text-muted)] mb-2">
            SPX Net MOC
          </p>
          <p className={`text-3xl font-black font-mono leading-none ${mocColor(spxMoc)}`}>
            {fmtMoc(spxMoc)}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--c-text-muted)] mb-2">
            MAG7 Net MOC
          </p>
          <p className={`text-3xl font-black font-mono leading-none ${mocColor(mag7Moc)}`}>
            {fmtMoc(mag7Moc)}
          </p>
        </div>
      </div>
    </div>
  );
}

function SignalBanner({ signal, gexStatus, spxMoc, mag7Moc, isAdmin }) {
  if (!signal.play) {
    return (
      <div className="space-y-5">
        <div className="rounded-3xl bg-gradient-to-r from-zinc-700/60 to-zinc-600/60 p-10 text-center shadow-xl">
          <div className="mb-4 flex items-center justify-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
              EOD Signal · 3:55 PM ET
            </p>
            {spxMoc != null && (
              <span className="text-[10px] font-mono text-white/40">
                SPX MOC {fmtMoc(spxMoc)}
              </span>
            )}
          </div>
          <h2 className="text-6xl font-black tracking-tight text-white/80 md:text-7xl">
            NO PLAY DAY
          </h2>
        </div>
        {isAdmin && <AdminDataRow gexStatus={gexStatus} spxMoc={spxMoc} mag7Moc={mag7Moc} />}
      </div>
    );
  }

  const { bullish, label } = signal;
  const bannerGrad = bullish
    ? 'bg-gradient-to-r from-emerald-700/80 to-emerald-500/80'
    : 'bg-gradient-to-r from-rose-700/80 to-rose-500/80';

  return (
    <div className="space-y-5">
      <div className={`rounded-3xl ${bannerGrad} p-10 text-center shadow-xl`}>
        <p className="mb-3 text-2xl font-black uppercase tracking-widest text-white/70">
          Play Day
        </p>
        <h2 className="text-6xl font-black tracking-tight text-white md:text-7xl">
          {label}
        </h2>
      </div>
      {isAdmin && <AdminDataRow gexStatus={gexStatus} spxMoc={spxMoc} mag7Moc={mag7Moc} />}
    </div>
  );
}

const SIM_SCENARIOS = [
  { label: 'No Play — GEX Ratio Too High',    gexRatio: 0.77, spxMoc:  2.74e9, mag7Moc:  0.648e9 },
  { label: 'No Play — SPX Too Small',          gexRatio: 0.30, spxMoc:  0.5e9,  mag7Moc:  0.3e9  },
  { label: 'No Play — Below New $1.5B Floor',  gexRatio: 0.30, spxMoc:  1.2e9,  mag7Moc:  0.7e9  },
  { label: 'No Play — Direction Mismatch',     gexRatio: 0.30, spxMoc:  1.8e9,  mag7Moc: -0.9e9  },
  { label: 'Play Day — Bullish',               gexRatio: 0.30, spxMoc:  1.5e9,  mag7Moc:  0.8e9  },
  { label: 'Play Day — Bearish',               gexRatio: 0.30, spxMoc: -1.5e9,  mag7Moc: -0.8e9  },
  { label: 'Play Day — Very Bullish',          gexRatio: 0.30, spxMoc:  2.74e9, mag7Moc:  1.2e9  },
  { label: 'Play Day — Very Bearish',          gexRatio: 0.30, spxMoc: -2.74e9, mag7Moc: -1.2e9  },
];

function SimControls({ idx, onPrev, onNext, onExit }) {
  const scenario = SIM_SCENARIOS[idx];
  return (
    <div className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-0.5">
            Simulation Mode
          </p>
          <p className="text-sm font-semibold text-[var(--c-text-primary)]">
            {idx + 1} / {SIM_SCENARIOS.length} — {scenario.label}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onPrev}
            className="rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-card)] px-4 py-2 text-sm font-semibold text-[var(--c-text-primary)] hover:bg-[var(--c-bg-panel)] transition-colors"
          >
            ← Prev
          </button>
          <button
            onClick={onNext}
            className="rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-card)] px-4 py-2 text-sm font-semibold text-[var(--c-text-primary)] hover:bg-[var(--c-bg-panel)] transition-colors"
          >
            Next →
          </button>
          <button
            onClick={onExit}
            className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-[var(--c-rose)] hover:bg-rose-500/20 transition-colors"
          >
            Exit Sim
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EodMocSignal() {
  const { role } = useAuth();
  const isAdmin = role === 'admin' || role === 'superuser';

  const [cpData,  setCpData]  = useState(null);
  const [spxData, setSpxData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);
  const [simMode, setSimMode] = useState(false);
  const [simIdx,  setSimIdx]  = useState(0);

  const fetchCpLive = useCallback(async () => {
    try { setCpData(await apiFetch('/cp/live')); } catch {}
  }, []);

  const fetchSpx = useCallback(async () => {
    try { setSpxData(await apiFetch('/pivots/spx-live')); } catch {}
  }, []);

  useEffect(() => {
    Promise.all([fetchCpLive(), fetchSpx()]).finally(() => setLoading(false));
  }, [fetchCpLive, fetchSpx]);

  useEffect(() => {
    const spxId = setInterval(fetchSpx,    5000);
    const cpId  = setInterval(fetchCpLive, 5000);
    return () => { clearInterval(spxId); clearInterval(cpId); };
  }, [fetchSpx, fetchCpLive]);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const et      = getETTime();
  const past355 = simMode || et.totalMinutes >= 15 * 60 + 55;

  const sim        = SIM_SCENARIOS[simIdx];
  const gexRatio   = simMode ? sim.gexRatio : (cpData?.gex?.gamma_notional ?? null);
  const gexStatus  = gexRatio == null ? null : gexRatio > 0.5 ? 'positive' : gexRatio < 0.5 ? 'negative' : 'neutral';
  const spxMoc     = simMode ? sim.spxMoc  : (cpData?.moc?.spx_moc  ?? null);
  const mag7Moc    = simMode ? sim.mag7Moc : (cpData?.moc?.mag7_moc ?? null);
  const signal     = evalSignal(gexRatio, spxMoc, mag7Moc);

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
            ? 'End-of-day directional signal based on dealer gamma exposure and market-on-close imbalance flow.'
            : "End-of-day directional signal based on dealer's option position exposure and market balance flow."}
        </p>
      </div>

      <PageGuide
        guideKey="eod-moc"
        accent="amber"
        title="How the EOD-MOC Signal works"
        description="This page delivers a directional trade signal in the final minutes of each trading day."
        steps={[
          { text: 'At 3:55 PM ET, the system evaluates whether today qualifies as a Play Day based on dealer positioning and MOC imbalance.' },
          { text: 'A Play Day requires a Put trade type, SPX MOC over $1.5B, and MAG7 confirming the same direction.' },
          { text: 'The signal shows Bullish or Bearish — with Very Bullish or Very Bearish when both SPX and MAG7 flows are especially large.' },
        ]}
      />

      <LiveSPXBar spxData={spxData} />

      {isAdmin && !simMode && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => { setSimMode(true); setSimIdx(0); }}
            className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-amber-400 hover:bg-amber-500/20 transition-colors"
          >
            Run Simulation
          </button>
        </div>
      )}

      {isAdmin && simMode && (
        <SimControls
          idx={simIdx}
          onPrev={() => setSimIdx(i => (i - 1 + SIM_SCENARIOS.length) % SIM_SCENARIOS.length)}
          onNext={() => setSimIdx(i => (i + 1) % SIM_SCENARIOS.length)}
          onExit={() => setSimMode(false)}
        />
      )}

      {past355
        ? <SignalBanner signal={signal} gexStatus={gexStatus} spxMoc={spxMoc} mag7Moc={mag7Moc} isAdmin={isAdmin} />
        : <WaitingState isAdmin={isAdmin} gexStatus={gexStatus} />
      }
    </div>
  );
}
