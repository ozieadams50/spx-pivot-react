export const GRADE_CONFIG = {
  'A+': { gradient: 'from-cyan-500/20 to-cyan-500/5',     border: 'border-cyan-500/30',   badge: 'bg-cyan-500/20 text-[var(--c-cyan)] border-cyan-500/30',     dot: 'bg-cyan-400'    },
  'A':  { gradient: 'from-sky-500/20 to-sky-500/5',       border: 'border-sky-500/30',    badge: 'bg-sky-500/20 text-[var(--c-sky)] border-sky-500/30',         dot: 'bg-sky-400'     },
  'B':  { gradient: 'from-violet-500/20 to-violet-500/5', border: 'border-violet-500/30', badge: 'bg-violet-500/20 text-[var(--c-violet)] border-violet-500/30', dot: 'bg-violet-400'  },
  'C':  { gradient: 'from-amber-500/20 to-amber-500/5',   border: 'border-amber-500/30',  badge: 'bg-amber-500/20 text-[var(--c-amber)] border-amber-500/30',   dot: 'bg-amber-400'   },
  'D':  { gradient: 'from-rose-500/20 to-rose-500/5',     border: 'border-rose-500/30',   badge: 'bg-rose-500/20 text-[var(--c-rose-strong)] border-rose-500/30',       dot: 'bg-rose-400'    },
};

export const STAR_MAP = {
  'A+': { stars: 5, label: '★★★★★' },
  'A':  { stars: 4, label: '★★★★' },
  'B':  { stars: 3, label: '★★★' },
  'C':  { stars: 2, label: '★★' },
  'D':  { stars: 1, label: '★' },
};

export const STAR_LABELS = ['5★', '4★', '3★', '2★', '1★'];
export const STAR_GRADES = ['A+', 'A', 'B', 'C', 'D'];

export function gradeToStars(grade) {
  return STAR_MAP[grade] ?? STAR_MAP['D'];
}

export const MODEL_CONFIG = {
  Recovery: 'bg-emerald-500/15 text-[var(--c-emerald-strong)] border-emerald-500/25',
  Momentum: 'bg-purple-500/15 text-purple-300 border-purple-500/25',
};

export const METRICS = [
  { key: 'm1',  label: 'Hist Avg Run-Up',     max: 6,  rawKey: 'm1_avg_pct',     fmt: (v) => v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`           : '—',
    tip: 'Average pre-earnings return across prior quarters. Higher avg = more points. Weak on its own — works best combined with technical metrics.' },
  { key: 'm3',  label: 'Run-Up Volatility',   max: 6,  rawKey: 'm3_stdev',       fmt: (v) => v != null ? `${v.toFixed(1)}% stdev`                         : '—',
    tip: 'How much prior runups varied quarter to quarter. More volatile = more upside potential. A stock that swings big has more room to run than one stuck in a tight range.' },
  { key: 'm5',  label: 'RS vs SPY (20d)',      max: 8,  rawKey: 'm5_rs_spy',      fmt: (v) => v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`           : '—',
    tip: 'How much the stock outperformed or underperformed SPY over 20 days. Scores high in either direction — strong laggards (catch-up plays) and strong leaders both get rewarded.' },
  { key: 'm6',  label: 'EPS Acceleration',    max: 4,  rawKey: 'm6_eps_accel',   fmt: (v) => v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(1)} ppts`       : '—',
    tip: 'Is earnings growth speeding up? Compares the latest Q/Q growth rate to the prior one. Positive = accelerating. Stronger signal in momentum setups.' },
  { key: 'm7',  label: 'EPS Beat Magnitude',  max: 5,  rawKey: 'm7_beat_mag',    fmt: (v) => v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`           : '—',
    tip: 'How much the company beats estimates on average. Consistent big beats attract pre-earnings positioning from institutions. 15%+ avg beat = full points.' },
  { key: 'm8',  label: 'Beat Rate',           max: 2,  rawKey: 'm8_beat_rate',   fmt: (v) => v != null ? `${v.toFixed(0)}%`                               : '—',
    tip: 'What % of prior quarters beat estimates. Low weight (max 2 pts) because most large caps beat — it\'s table stakes, not a differentiator.' },
  { key: 'm13', label: 'Volume Accumulation', max: 3,  rawKey: 'm13_vol_ratio',  fmt: (v) => v != null ? `${v.toFixed(2)}x`                               : '—',
    tip: 'Recent 10-day volume vs 90-day average. Rising volume into earnings = institutional accumulation. Above 2x = full points.' },
  { key: 'm15', label: 'Sector 3-Way',        max: 10, rawKey: 'm15_stk_vs_sec', fmt: (v) => v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}% vs sec`   : '—',
    tip: 'Compares stock vs its sector AND sector vs SPY. Rewards strong divergence in either direction — a stock moving independently from its sector signals conviction.' },
  { key: 'm16', label: 'RSI Position',        max: 6,  rawKey: 'm16_rsi',        fmt: (v) => v != null ? v.toFixed(0)                                     : '—',
    tip: 'Rewards two sweet spots: oversold (below 40, recovery setup) and strong momentum (65-80). The neutral zone (55-65) scores zero — no edge when price is directionless.' },
  { key: 'm17', label: 'ATR Expansion',       max: 4,  rawKey: 'm17_atr_ratio',  fmt: (v) => v != null ? `${v.toFixed(2)}x`                               : '—',
    tip: 'Short-term volatility vs long-term. Expanding range = the stock is already in motion. Winners avg 1.17x vs losers 1.0x. Above 1.10x = full points.' },
  { key: 'm18', label: 'MA Alignment',        max: 4,  rawKey: 'm18_ma_align',   fmt: (v) => v ?? '—',
    tip: 'Recovery scoring — price below moving averages = catch-up setup = more points. "none" (all below) = full 4 pts. "full" (all above) = 0 pts. Counterintuitive but backtest-proven.' },
  { key: 'm19', label: 'Anchored VWAP',       max: 6,  rawKey: 'm19_avwap_pct',  fmt: (v) => v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`           : '—',
    tip: 'Recovery scoring — price below AVWAP (anchored to last earnings) means the avg buyer since last report is underwater. That creates catch-up pressure into earnings.' },
  { key: 'm20', label: 'Higher Lows Slope',   max: 8,  rawKey: 'm20_lows_slope', fmt: (v) => v != null ? `${v >= 0 ? '+' : ''}${(v * 100).toFixed(2)}%/d` : '—',
    tip: 'Recovery scoring — descending daily lows = the stock is still drifting lower. That creates a catch-up opportunity before earnings. Strongest single recovery signal (8 pts max).' },
  { key: 'pp1', label: 'Prior 10d Move',      max: 4,  rawKey: 'p1_10d_gain',    fmt: (v) => v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`           : '—',
    tip: 'Pre-entry weakness bonus. Stocks that are down before the window = room to run. Already up 10%+ = too extended. Winners are typically down ~2% before entry.' },
];
