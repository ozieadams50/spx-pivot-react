export const GRADE_CONFIG = {
  'A+': { gradient: 'from-cyan-500/20 to-cyan-500/5',     border: 'border-cyan-500/30',   badge: 'bg-cyan-500/20 text-[var(--c-cyan)] border-cyan-500/30',     dot: 'bg-cyan-400'    },
  'A':  { gradient: 'from-sky-500/20 to-sky-500/5',       border: 'border-sky-500/30',    badge: 'bg-sky-500/20 text-[var(--c-sky)] border-sky-500/30',         dot: 'bg-sky-400'     },
  'B':  { gradient: 'from-violet-500/20 to-violet-500/5', border: 'border-violet-500/30', badge: 'bg-violet-500/20 text-[var(--c-violet)] border-violet-500/30', dot: 'bg-violet-400'  },
  'C':  { gradient: 'from-amber-500/20 to-amber-500/5',   border: 'border-amber-500/30',  badge: 'bg-amber-500/20 text-[var(--c-amber)] border-amber-500/30',   dot: 'bg-amber-400'   },
  'D':  { gradient: 'from-rose-500/20 to-rose-500/5',     border: 'border-rose-500/30',   badge: 'bg-rose-500/20 text-[var(--c-rose-strong)] border-rose-500/30',       dot: 'bg-rose-400'    },
};

export const MODEL_CONFIG = {
  Recovery: 'bg-emerald-500/15 text-[var(--c-emerald-strong)] border-emerald-500/25',
  Momentum: 'bg-purple-500/15 text-purple-300 border-purple-500/25',
};

export const METRICS = [
  { key: 'm1',  label: 'Hist Avg Run-Up',     max: 6,  rawKey: 'm1_avg_pct',     fmt: (v) => v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`           : '—',
    tip: 'r=+0.003 · Weak standalone predictor — technical setup metrics (M19/M20/M16) outperform. Avg prior runup scaled linearly, 8%+ avg = full 6 pts.' },
  { key: 'm3',  label: 'Run-Up Volatility',   max: 6,  rawKey: 'm3_stdev',       fmt: (v) => v != null ? `${v.toFixed(1)}% stdev`                         : '—',
    tip: 'r=+0.166 · INVERTED: higher stdev = more potential upside. A stock swinging ±15% has more ceiling than ±2%. Stdev ≥8% = full 6 pts; ≤2% = 0.' },
  { key: 'm5',  label: 'RS vs SPY (20d)',      max: 8,  rawKey: 'm5_rs_spy',      fmt: (v) => v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`           : '—',
    tip: 'r=-0.049 · U-SHAPED: rewards conviction in either direction vs SPY. Strong laggards (recovery) and strong leaders both score high. |RS| ≥10% = full 8 pts.' },
  { key: 'm6',  label: 'EPS Acceleration',    max: 4,  rawKey: 'm6_eps_accel',   fmt: (v) => v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(1)} ppts`       : '—',
    tip: 'r=-0.006 · Q/Q EPS growth rate change. Positive = earnings growth is speeding up. Accelerating by >20 ppts = full 4 pts. Weak global signal, stronger in momentum.' },
  { key: 'm7',  label: 'EPS Beat Magnitude',  max: 5,  rawKey: 'm7_beat_mag',    fmt: (v) => v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`           : '—',
    tip: 'Avg EPS surprise % over prior quarters. Companies that consistently crush estimates by large margins attract pre-earnings positioning. 15%+ avg beat = full 5 pts.' },
  { key: 'm8',  label: 'Beat Rate',           max: 2,  rawKey: 'm8_beat_rate',   fmt: (v) => v != null ? `${v.toFixed(0)}%`                               : '—',
    tip: 'Weak signal (max 2 pts). % of prior quarters where EPS beat estimates. 100% beat rate = 2 pts. Low weight because beat rate is very common among large caps.' },
  { key: 'm13', label: 'Volume Accumulation', max: 3,  rawKey: 'm13_vol_ratio',  fmt: (v) => v != null ? `${v.toFixed(2)}x`                               : '—',
    tip: '10-day avg volume / 90-day avg volume. Ratio >2.0x = full 3 pts. Rising volume into earnings signals institutional accumulation and smart money positioning.' },
  { key: 'm15', label: 'Sector 3-Way',        max: 10, rawKey: 'm15_stk_vs_sec', fmt: (v) => v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}% vs sec`   : '—',
    tip: 'U-SHAPED: Stock vs Sector (5 pts) + Sector vs SPY (5 pts). Rewards conviction in either direction — strong divergence from sector matters more than direction. Max 10 pts.' },
  { key: 'm16', label: 'RSI Position',        max: 6,  rawKey: 'm16_rsi',        fmt: (v) => v != null ? v.toFixed(0)                                     : '—',
    tip: 'U-SHAPED: RSI ≤40 = 6 pts (oversold recovery); 40-55 tapers to 0; 55-65 = 0 (neutral dead zone); 65-80 = up to 6 pts (momentum); >80 decays (too extended).' },
  { key: 'm17', label: 'ATR Expansion',       max: 4,  rawKey: 'm17_atr_ratio',  fmt: (v) => v != null ? `${v.toFixed(2)}x`                               : '—',
    tip: 'r=+0.148 · ATR(10)/ATR(50) momentum expansion. INVERTED: expanding ATR = momentum building. Winners avg 1.17x vs losers 0.997x. Ratio >1.10 = full 4 pts; <0.85 = 0.' },
  { key: 'm18', label: 'MA Alignment',        max: 4,  rawKey: 'm18_ma_align',   fmt: (v) => v ?? '—',
    tip: 'r=+0.110 · RECOVERY scoring: below MAs = catch-up setup = more points. Price below 20 EMA (+1.5), below 50 MA (+1.0), 20 EMA below 50 MA (+1.5). "none" alignment = full 4 pts.' },
  { key: 'm19', label: 'Anchored VWAP',       max: 6,  rawKey: 'm19_avwap_pct',  fmt: (v) => v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`           : '—',
    tip: 'r=+0.087 · RECOVERY scoring: below AVWAP = catch-up opportunity. 3%+ below = full 6 pts; 3%+ above = 0. Anchored to last earnings date — measures vs institutional cost basis.' },
  { key: 'm20', label: 'Higher Lows Slope',   max: 8,  rawKey: 'm20_lows_slope', fmt: (v) => v != null ? `${v >= 0 ? '+' : ''}${(v * 100).toFixed(2)}%/d` : '—',
    tip: 'r=+0.105 · RECOVERY scoring: descending lows = catch-up opportunity. Linear regression slope of daily lows over 20 sessions. -0.2%/day = full 8 pts; +0.2%/day = 0.' },
  { key: 'pp1', label: 'Prior 10d Move',      max: 4,  rawKey: 'p1_10d_gain',    fmt: (v) => v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`           : '—',
    tip: 'r=-0.064 · Pre-entry weakness bonus. Winners median -2.07% before entry vs all signals +0.46%. Stocks already down = room to run (4 pts); up 10%+ = extended (0 pts).' },
];
