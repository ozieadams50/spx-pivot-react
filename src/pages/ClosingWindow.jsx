import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';

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

// Same 3:50/3:55/4:00/4:30 PM ET window boundaries as EodMocSignal.jsx — keep in lockstep.
function windowPhase(et) {
  const t = et.totalMinutes;
  if (t < 15 * 60 + 50) return 'pre';
  if (t < 15 * 60 + 55) return 'scalp';
  if (t < 16 * 60)      return 'final';
  if (t < 16 * 60 + 30) return 'post';
  return 'ended';
}

function fmtMoc(n) {
  if (n == null) return '--';
  const abs  = Math.abs(n);
  const sign = n >= 0 ? '+' : '-';
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(0)}M`;
  return `${sign}$${abs.toLocaleString()}`;
}

// SPX MOC magnitude tiers ($): XL >= 3.5B, Large 1.51B-3.49B, Medium 1.0B-1.5B, Small < 1.0B
const SPX_TIERS  = { xl: 3.5e9,   lg: 1.51e9, md: 1.0e9  };
// MAG7 MOC magnitude tiers ($): XL >= 1000M, Large 600M-999M, Medium 350M-599M, Small < 350M
const MAG7_TIERS = { xl: 1000e6,  lg: 600e6,  md: 350e6  };

function mocTier(value, thresholds) {
  if (value == null) return null;
  const abs = Math.abs(value);
  let tier, dots;
  if (abs >= thresholds.xl)      { tier = 'EXTRA LARGE'; dots = 4; }
  else if (abs >= thresholds.lg) { tier = 'LARGE';       dots = 3; }
  else if (abs >= thresholds.md) { tier = 'MEDIUM';      dots = 2; }
  else                            { tier = 'SMALL';       dots = 1; }
  return { tier, dots, positive: value >= 0 };
}

// Market Positioning from GEX Ratio: Amplifying <= 0.35, Stabilizing >= 0.6,
// Neutral strictly in between.
function positioningFromGex(gexRatio) {
  if (gexRatio == null) return null;
  if (gexRatio <= 0.35) return 'AMPLIFYING';
  if (gexRatio >= 0.6)  return 'STABILIZING';
  return 'NEUTRAL';
}

// Closing Outlook: SPX and MAG7 MOC must agree in sign to call Bullish/Bearish.
function closingOutlook(spxMoc, mag7Moc) {
  if (spxMoc == null || mag7Moc == null) return null;
  if (spxMoc > 0 && mag7Moc > 0) return 'BULLISH';
  if (spxMoc < 0 && mag7Moc < 0) return 'BEARISH';
  return 'MIXED';
}

// Play Day rules:
//   Path A: GEX Ratio <= 0.35 AND |SPX MOC| >= $1.5B
//   Path B: GEX Ratio >  0.35 AND |SPX MOC| >  $3.5B
// plus MAG7 MOC must share SPX MOC's sign either way.
const PLAY_GEX_RATIO_MAX    = 0.35;
const PLAY_SPX_MOC_MIN      = 1.5e9;
const PLAY_GEX_HIGH_MOC_MIN = 3.5e9;

function evalPlayDay(gexRatio, spxMoc, mag7Moc) {
  if (gexRatio == null) return false;
  if (spxMoc == null || mag7Moc == null) return false;
  if (Math.sign(spxMoc) !== Math.sign(mag7Moc)) return false;
  return gexRatio <= PLAY_GEX_RATIO_MAX
    ? Math.abs(spxMoc) >= PLAY_SPX_MOC_MIN
    : Math.abs(spxMoc) >  PLAY_GEX_HIGH_MOC_MIN;
}

function PulsingDot({ color = 'bg-emerald-400' }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${color} opacity-50`} />
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${color}`} />
    </span>
  );
}

function PlayDayBanner({ play }) {
  return (
    <div className={`mb-6 flex items-center justify-center gap-3 rounded-2xl border px-6 py-5 text-2xl font-black uppercase tracking-widest md:text-3xl ${
      play
        ? 'border-emerald-500/30 bg-emerald-500/10 text-[var(--c-emerald)]'
        : 'border-rose-500/30 bg-rose-500/10 text-[var(--c-rose)]'
    }`}>
      <PulsingDot color={play ? 'bg-emerald-400' : 'bg-rose-400'} />
      {play ? 'Play Day' : 'No Play Day'}
    </div>
  );
}

function TierDots({ dots, positive }) {
  const filledCls = positive
    ? 'border-[var(--c-emerald)] bg-[var(--c-emerald)]'
    : 'border-[var(--c-rose)] bg-[var(--c-rose)]';
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2, 3].map(i => (
        <span
          key={i}
          className={`h-3.5 w-3.5 rounded-full border-2 ${i < dots ? filledCls : 'border-[var(--c-border)]'}`}
        />
      ))}
    </div>
  );
}

function FlowPressureRow({ label, sublabel, mocValue, thresholds }) {
  const t = mocTier(mocValue, thresholds);
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-bold text-[var(--c-text-primary)]">{label}</p>
        {sublabel && <p className="text-[11px] text-[var(--c-text-faint)]">{sublabel}</p>}
      </div>
      {t ? (
        <div className="flex flex-col items-end gap-1">
          <TierDots dots={t.dots} positive={t.positive} />
          <span className={`text-[11px] font-bold uppercase tracking-widest ${t.positive ? 'text-[var(--c-emerald)]' : 'text-[var(--c-rose)]'}`}>
            {t.tier}
          </span>
        </div>
      ) : (
        <span className="text-sm text-[var(--c-text-dimmed)]">--</span>
      )}
    </div>
  );
}

function FlowPressureCard({ spxMoc, mag7Moc }) {
  return (
    <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-card)] p-6 shadow-lg">
      <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--c-text-primary)]">Closing Flow Pressure</h3>
      <p className="mt-1 text-xs text-[var(--c-text-muted)]">Direction and relative strength of buying vs. selling interest into the close.</p>
      <div className="mt-3 divide-y divide-[var(--c-border-subtle)]">
        <FlowPressureRow label="S&P 500" mocValue={spxMoc} thresholds={SPX_TIERS} />
        <FlowPressureRow label="MAG 7" sublabel="AAPL, MSFT, NVDA, AMZN, GOOGL, META, TSLA" mocValue={mag7Moc} thresholds={MAG7_TIERS} />
      </div>
    </div>
  );
}

const POSITIONING_META = {
  AMPLIFYING: {
    label: 'Amplifying',
    desc: 'Market movement has the potential to accelerate.',
    text: 'text-[var(--c-rose)]',
    ring: 'border-rose-500/40',
    bg:   'bg-rose-500/10',
  },
  STABILIZING: {
    label: 'Stabilizing',
    desc: 'Any market movement has the potential to be offset.',
    text: 'text-[var(--c-sky)]',
    ring: 'border-sky-500/40',
    bg:   'bg-sky-500/10',
  },
  NEUTRAL: {
    label: 'Neutral',
    desc: 'Positioning is neutral — movement is neither reinforced nor absorbed.',
    text: 'text-[var(--c-text-dimmed)]',
    ring: 'border-[var(--c-border)]',
    bg:   'bg-[var(--c-bg-panel)]',
  },
};

function MarketPositioningCard({ gexRatio }) {
  const state = positioningFromGex(gexRatio);
  const meta = state ? POSITIONING_META[state] : null;
  return (
    <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-card)] p-6 shadow-lg">
      <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--c-text-primary)]">Market Positioning</h3>
      <p className="mt-1 text-xs text-[var(--c-text-muted)]">Describes how the market is positioned to respond to price movement.</p>
      {meta ? (
        <div className="mt-4 flex flex-col items-center text-center">
          <p className={`text-2xl font-black uppercase tracking-wide ${meta.text}`}>{meta.label}</p>
          <div className={`mt-3 flex h-16 w-16 items-center justify-center rounded-full border-2 ${meta.ring} ${meta.bg}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-7 w-7 ${meta.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17l6-6 4 4 8-8" />
            </svg>
          </div>
          <p className="mt-3 text-sm text-[var(--c-text-secondary)]">{meta.desc}</p>
        </div>
      ) : (
        <p className="mt-6 text-center text-sm text-[var(--c-text-dimmed)]">--</p>
      )}
    </div>
  );
}

const OUTLOOK_META = {
  BULLISH: {
    label: 'Bullish',
    grad: 'bg-gradient-to-r from-emerald-700/80 to-emerald-500/80',
    text: 'Indexes are showing aligned buying pressure into the close.',
    icon: 'M12 19V5m0 0l-6 6m6-6l6 6',
  },
  BEARISH: {
    label: 'Bearish',
    grad: 'bg-gradient-to-r from-rose-700/80 to-rose-500/80',
    text: 'Indexes are showing aligned selling pressure into the close.',
    icon: 'M12 5v14m0 0l6-6m-6 6l-6-6',
  },
  MIXED: {
    label: 'Mixed',
    grad: 'bg-gradient-to-r from-zinc-700/60 to-zinc-600/60',
    text: 'SPX and MAG7 order flow are pointing in different directions — the signal is less clear.',
    icon: 'M5 12h14',
  },
};

function ClosingOutlookBanner({ result }) {
  const meta = result ? OUTLOOK_META[result] : null;
  if (!meta) {
    return (
      <div className="rounded-3xl bg-gradient-to-r from-zinc-700/60 to-zinc-600/60 p-5 text-center shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/60">Closing Outlook</p>
        <h2 className="mt-1 text-2xl font-black text-white/80">--</h2>
      </div>
    );
  }
  return (
    <div className={`rounded-3xl ${meta.grad} p-5 text-center shadow-xl`}>
      <div className="mx-auto mb-1.5 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/40">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={meta.icon} />
        </svg>
      </div>
      <p className="text-xs font-semibold uppercase tracking-widest text-white/70">Closing Outlook</p>
      <h2 className="mt-1 text-3xl font-black tracking-tight text-white md:text-4xl">{meta.label}</h2>
      <p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed text-white/85">{meta.text}</p>
    </div>
  );
}

function AdminRawPanel({ spxMoc, mag7Moc, gexRatio }) {
  const mocColor = (n) => n == null
    ? 'text-[var(--c-text-dimmed)]'
    : n >= 0 ? 'text-[var(--c-emerald)]' : 'text-[var(--c-rose)]';

  return (
    <div className="mt-6 rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-panel)] p-6 shadow-lg">
      <div className="mb-5 flex items-center gap-2">
        <PulsingDot color="bg-amber-400" />
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">Live Signal Data (Admin)</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--c-text-muted)]">SPX Net Credit/Debit</p>
          <p className={`text-2xl font-black font-mono leading-none ${mocColor(spxMoc)}`}>{fmtMoc(spxMoc)}</p>
        </div>
        <div className="rounded-2xl border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--c-text-muted)]">MAG7 Net Credit/Debit</p>
          <p className={`text-2xl font-black font-mono leading-none ${mocColor(mag7Moc)}`}>{fmtMoc(mag7Moc)}</p>
        </div>
        <div className="rounded-2xl border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--c-text-muted)]">GEX Ratio</p>
          <p className="text-2xl font-black font-mono leading-none text-[var(--c-text-primary)]">{gexRatio != null ? gexRatio.toFixed(2) : '--'}</p>
        </div>
      </div>
    </div>
  );
}

const SIM_TIMEOUT_MS = 60_000;

const SIM_SCENARIOS = [
  { label: 'Bullish — Extra Large Flow, Amplifying',       gexRatio: 0.20, spxMoc:  4.2e9,  mag7Moc:  1.3e9  },
  { label: 'Bullish — Medium Flow, Neutral',                gexRatio: 0.48, spxMoc:  1.2e9,  mag7Moc:  0.45e9 },
  { label: 'Bullish — Small Flow, Stabilizing',             gexRatio: 0.70, spxMoc:  0.6e9,  mag7Moc:  0.2e9  },
  { label: 'Bearish — Extra Large Flow, Amplifying',        gexRatio: 0.18, spxMoc: -4.2e9,  mag7Moc: -1.3e9  },
  { label: 'Bearish — Medium Flow, Neutral',                gexRatio: 0.52, spxMoc: -1.2e9,  mag7Moc: -0.45e9 },
  { label: 'Bearish — Small Flow, Stabilizing',             gexRatio: 0.68, spxMoc: -0.6e9,  mag7Moc: -0.2e9  },
  { label: 'Mixed — SPX Bullish / MAG7 Bearish',            gexRatio: 0.30, spxMoc:  2.6e9,  mag7Moc: -0.4e9  },
  { label: 'Mixed — SPX Bearish / MAG7 Bullish',            gexRatio: 0.55, spxMoc: -1.0e9,  mag7Moc:  0.8e9  },
  { label: 'Boundary — GEX Ratio 0.35 (Amplifying/Neutral line)', gexRatio: 0.35, spxMoc:  1.6e9,  mag7Moc:  0.65e9 },
  { label: 'Boundary — GEX Ratio 0.60 (Neutral/Stabilizing line)', gexRatio: 0.60, spxMoc: -1.6e9,  mag7Moc: -0.65e9 },
  { label: 'Boundary — SPX MOC $1.51B (Medium/Large line)', gexRatio: 0.45, spxMoc:  1.51e9, mag7Moc:  0.5e9  },
  { label: 'Boundary — SPX MOC $3.5B (Large/Extra Large line)', gexRatio: 0.45, spxMoc:  3.5e9,  mag7Moc:  0.5e9  },
  { label: 'Boundary — MAG7 MOC $600M (Medium/Large line)', gexRatio: 0.45, spxMoc:  1.0e9,  mag7Moc:  0.6e9  },
  { label: 'Boundary — MAG7 MOC $1000M (Large/Extra Large line)', gexRatio: 0.45, spxMoc:  1.0e9,  mag7Moc:  1.0e9  },
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

function SimWatermark({ onExit }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center overflow-hidden">
      <div className="select-none whitespace-nowrap text-[8vw] font-black uppercase tracking-widest text-amber-500/10 -rotate-[20deg]">
        SIMULATED DATA · SIMULATED DATA
      </div>
      <button
        onClick={onExit}
        className="pointer-events-auto fixed bottom-6 right-6 z-50 animate-pulse rounded-2xl border border-amber-500/50 bg-amber-500 px-5 py-3 text-sm font-bold uppercase tracking-widest text-black shadow-2xl transition-colors hover:bg-amber-400"
      >
        Exit Simulation Mode
      </button>
    </div>
  );
}

function MarketClosedCard() {
  return (
    <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-card)] p-8 text-center shadow-lg">
      <div className="mb-4 text-5xl">&#128197;</div>
      <h2 className="mb-3 text-xl font-bold text-[var(--c-text-primary)]">Market Closed</h2>
      <p className="mx-auto max-w-lg text-sm leading-relaxed text-[var(--c-text-secondary)]">
        Markets are closed today. The Closing Window updates only on trading days — check back on the next market session.
      </p>
    </div>
  );
}

function SessionEndedCard() {
  return (
    <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-card)] p-8 text-center shadow-lg">
      <div className="mb-4 text-5xl">&#127937;</div>
      <h2 className="mb-3 text-xl font-bold text-[var(--c-text-primary)]">Closing Window Session Ended</h2>
      <p className="mx-auto max-w-lg text-sm leading-relaxed text-[var(--c-text-secondary)]">
        Today's Closing Window has ended. Check back tomorrow at 3:50 PM ET for the next session.
      </p>
    </div>
  );
}

function WaitingCard() {
  const [cd, setCd] = useState(() => countdownTo(15, 50));
  useEffect(() => {
    const id = setInterval(() => setCd(countdownTo(15, 50)), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-card)] p-8 text-center shadow-lg">
      <div className="mb-4 text-5xl">&#9719;</div>
      <h2 className="mb-3 text-xl font-bold text-[var(--c-text-primary)]">Waiting for the Closing Window</h2>
      <p className="mx-auto max-w-lg text-sm leading-relaxed text-[var(--c-text-secondary)]">
        Flow Pressure, Market Positioning, and the Closing Outlook update once the 3:50 PM ET window opens.
      </p>
      {cd && (
        <div className="mt-6">
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-[var(--c-text-dimmed)]">Time until 3:50 PM ET</p>
          <p className="text-4xl font-bold font-mono text-[var(--c-cyan)]">{cd}</p>
        </div>
      )}
    </div>
  );
}

const C = {
  pill: 'bg-cyan-500/10 border-cyan-500/20 text-[var(--c-cyan)]',
};

function DefinitionsModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-[32px] border border-[var(--c-border)] bg-[var(--c-bg-dropdown)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--c-border)] px-6 py-5">
          <div>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${C.pill}`}>
              How to Use this Page
            </span>
            <h3 className="mt-2 text-xl font-bold text-[var(--c-text-primary)] sm:text-2xl">How Closing Window Works</h3>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-2xl border border-[var(--c-border)] px-3 py-2 text-sm text-[var(--c-text-secondary)] transition-colors hover:text-[var(--c-text-primary)]"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 px-6 py-5">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">Play Day</h4>
            <ul className="mt-3 space-y-2 text-sm text-[var(--c-text-secondary)]">
              <li><span className="font-bold text-[var(--c-emerald)]">Play Day</span> — Several independent market conditions have lined up strongly enough to suggest a real directional edge into the close.</li>
              <li><span className="font-bold text-[var(--c-text-dimmed)]">No Play Day</span> — Those conditions haven't lined up; the safest move is typically to stay out.</li>
            </ul>
            <p className="mt-3 text-xs text-[var(--c-text-faint)]">This is a stricter, independent check from the Closing Outlook below — a day can show a Bullish or Bearish outlook without qualifying as a Play Day.</p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">Flow Pressure Levels</h4>
            <ul className="mt-3 space-y-2 text-sm text-[var(--c-text-secondary)]">
              <li className="flex items-center gap-3"><TierDots dots={4} positive /> Extra Large — Very strong pressure</li>
              <li className="flex items-center gap-3"><TierDots dots={3} positive /> Large — Strong pressure</li>
              <li className="flex items-center gap-3"><TierDots dots={2} positive /> Medium — Moderate pressure</li>
              <li className="flex items-center gap-3"><TierDots dots={1} positive /> Small — Light pressure</li>
            </ul>
            <p className="mt-3 text-xs text-[var(--c-text-faint)]">Green = buying pressure. Red = selling pressure.</p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">Market Positioning States</h4>
            <ul className="mt-3 space-y-2 text-sm text-[var(--c-text-secondary)]">
              <li><span className="font-bold text-[var(--c-rose)]">Amplifying</span> — Movement has the potential to accelerate.</li>
              <li><span className="font-bold text-[var(--c-text-dimmed)]">Neutral</span> — Positioning is neutral; movement is neither reinforced nor absorbed.</li>
              <li><span className="font-bold text-[var(--c-sky)]">Stabilizing</span> — Any market movement has the potential to be offset.</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">How to Read This Dashboard</h4>
            <ul className="mt-3 space-y-2 text-sm text-[var(--c-text-secondary)]">
              <li>Flow Pressure shows where buying or selling interest is concentrated into the close, for both the S&amp;P 500 and the MAG7 mega-caps.</li>
              <li>Market Positioning indicates how the market is likely to respond to that pressure.</li>
              <li>The Closing Outlook requires the S&amp;P 500 and MAG7 flow to agree in direction — when they agree, the signal is Bullish or Bearish; when they disagree, it's Mixed.</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">Closing Outlook Key</h4>
            <ul className="mt-3 space-y-2 text-sm text-[var(--c-text-secondary)]">
              <li><span className="font-bold text-[var(--c-emerald)]">Bullish</span> — Higher probability of an upward move.</li>
              <li><span className="font-bold text-[var(--c-rose)]">Bearish</span> — Higher probability of a downward move.</li>
              <li><span className="font-bold text-yellow-400">Mixed</span> — Conflicting signals / less clear bias.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClosingWindow() {
  const { role } = useAuth();
  const isAdmin = role === 'admin' || role === 'superuser';

  const [cpData, setCpData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);
  const [showDefinitions, setShowDefinitions] = useState(false);
  const [simMode, setSimMode] = useState(false);
  const [simIdx,  setSimIdx]  = useState(0);

  const fetchCpLive = useCallback(async () => {
    try { setCpData(await apiFetch('/cp/live')); } catch {}
  }, []);

  useEffect(() => {
    fetchCpLive().finally(() => setLoading(false));
  }, [fetchCpLive]);

  useEffect(() => {
    const id = setInterval(fetchCpLive, 5000);
    return () => clearInterval(id);
  }, [fetchCpLive]);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!simMode) return;
    const id = setTimeout(() => setSimMode(false), SIM_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [simMode, simIdx]);

  const et    = getETTime();
  const phase = simMode ? 'final' : windowPhase(et);

  const sim = SIM_SCENARIOS[simIdx];

  const gexRatioLive = simMode ? sim.gexRatio : (cpData?.gex?.gamma_notional ?? null);
  const spxMocLive   = simMode ? sim.spxMoc   : (cpData?.moc?.spx_moc  ?? null);
  const mag7MocLive  = simMode ? sim.mag7Moc  : (cpData?.moc?.mag7_moc ?? null);

  // Same peak-latch behavior as EodMocSignal.jsx so the two pages never
  // disagree for the same moment during Scalp/Final Session.
  const mocPeakFinal = !simMode && cpData?.moc_peak       ? cpData.moc_peak       : null;
  const mocPeakScalp = !simMode && cpData?.moc_peak_scalp ? cpData.moc_peak_scalp : null;
  const mocPeak    = phase === 'scalp' ? mocPeakScalp : mocPeakFinal;
  const peakLocked = (phase === 'scalp' || phase === 'final' || phase === 'post') && mocPeak != null;

  const gexRatio = peakLocked ? mocPeak.gex_ratio : gexRatioLive;
  const spxMoc   = peakLocked ? mocPeak.spx_moc   : spxMocLive;
  const mag7Moc  = peakLocked ? mocPeak.mag7_moc  : mag7MocLive;

  const outlook = closingOutlook(spxMoc, mag7Moc);
  const isPlayDay = evalPlayDay(gexRatio, spxMoc, mag7Moc);
  const marketClosed = !simMode && cpData?.is_trading_day === false;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500/30 border-t-cyan-500" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="mb-2 inline-flex items-center rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--c-violet)]">
            Quantified Edge
          </span>
          <h1 className="text-2xl font-bold text-[var(--c-text-primary)]">Closing Window</h1>
          <p className="mt-1 text-sm text-[var(--c-text-muted)]">
            A live read of order flow and market positioning in the final minutes before the close.
          </p>
        </div>
        <button
          onClick={() => setShowDefinitions(true)}
          className="flex items-center gap-1.5 rounded-full border border-cyan-500/20 px-3 py-1 text-xs text-cyan-500/70 transition-colors hover:border-cyan-500/40 hover:text-[var(--c-cyan)]"
        >
          <span className="font-bold">?</span> How to Use this Page
        </button>
      </div>

      <PlayDayBanner play={isPlayDay} />

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
        <>
          <SimControls
            idx={simIdx}
            onPrev={() => setSimIdx(i => (i - 1 + SIM_SCENARIOS.length) % SIM_SCENARIOS.length)}
            onNext={() => setSimIdx(i => (i + 1) % SIM_SCENARIOS.length)}
            onExit={() => setSimMode(false)}
          />
          <SimWatermark onExit={() => setSimMode(false)} />
        </>
      )}

      {marketClosed ? (
        <MarketClosedCard />
      ) : phase === 'pre' ? (
        <WaitingCard />
      ) : phase === 'ended' ? (
        <SessionEndedCard />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <FlowPressureCard spxMoc={spxMoc} mag7Moc={mag7Moc} />
            <MarketPositioningCard gexRatio={gexRatio} />
          </div>
          <ClosingOutlookBanner result={outlook} />
          {isAdmin && <AdminRawPanel spxMoc={spxMoc} mag7Moc={mag7Moc} gexRatio={gexRatio} />}
        </>
      )}

      {showDefinitions && <DefinitionsModal onClose={() => setShowDefinitions(false)} />}
    </div>
  );
}
