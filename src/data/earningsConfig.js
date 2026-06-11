export const GRADE_CONFIG = {
  'A+': { gradient: 'from-cyan-500/20 to-cyan-500/5',     border: 'border-cyan-500/30',   badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',     dot: 'bg-cyan-400'    },
  'A':  { gradient: 'from-sky-500/20 to-sky-500/5',       border: 'border-sky-500/30',    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30',         dot: 'bg-sky-400'     },
  'B':  { gradient: 'from-violet-500/20 to-violet-500/5', border: 'border-violet-500/30', badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30', dot: 'bg-violet-400'  },
  'C':  { gradient: 'from-amber-500/20 to-amber-500/5',   border: 'border-amber-500/30',  badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',   dot: 'bg-amber-400'   },
  'D':  { gradient: 'from-rose-500/20 to-rose-500/5',     border: 'border-rose-500/30',   badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',       dot: 'bg-rose-400'    },
};

export const MODEL_CONFIG = {
  Recovery: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  Momentum: 'bg-purple-500/15 text-purple-300 border-purple-500/25',
};

export const METRICS = [
  { key: 'm1',  label: 'Hist Avg Run-Up',     max: 6,  rawKey: 'm1_avg_pct',     fmt: (v) => v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`           : '—' },
  { key: 'm3',  label: 'Run-Up Volatility',   max: 6,  rawKey: 'm3_stdev',       fmt: (v) => v != null ? `${v.toFixed(1)}% stdev`                         : '—' },
  { key: 'm5',  label: 'RS vs SPY (20d)',      max: 8,  rawKey: 'm5_rs_spy',      fmt: (v) => v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`           : '—' },
  { key: 'm6',  label: 'EPS Acceleration',    max: 4,  rawKey: 'm6_eps_accel',   fmt: (v) => v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(1)} ppts`       : '—' },
  { key: 'm7',  label: 'EPS Beat Magnitude',  max: 5,  rawKey: 'm7_beat_mag',    fmt: (v) => v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`           : '—' },
  { key: 'm8',  label: 'Beat Rate',           max: 2,  rawKey: 'm8_beat_rate',   fmt: (v) => v != null ? `${v.toFixed(0)}%`                               : '—' },
  { key: 'm13', label: 'Volume Accumulation', max: 3,  rawKey: 'm13_vol_ratio',  fmt: (v) => v != null ? `${v.toFixed(2)}x`                               : '—' },
  { key: 'm15', label: 'Sector 3-Way',        max: 10, rawKey: 'm15_stk_vs_sec', fmt: (v) => v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}% vs sec`   : '—' },
  { key: 'm16', label: 'RSI Position',        max: 6,  rawKey: 'm16_rsi',        fmt: (v) => v != null ? v.toFixed(0)                                     : '—' },
  { key: 'm17', label: 'ATR Expansion',       max: 4,  rawKey: 'm17_atr_ratio',  fmt: (v) => v != null ? `${v.toFixed(2)}x`                               : '—' },
  { key: 'm18', label: 'MA Alignment',        max: 4,  rawKey: 'm18_ma_align',   fmt: (v) => v ?? '—'                                                          },
  { key: 'm19', label: 'Anchored VWAP',       max: 6,  rawKey: 'm19_avwap_pct',  fmt: (v) => v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`           : '—' },
  { key: 'm20', label: 'Higher Lows Slope',   max: 8,  rawKey: 'm20_lows_slope', fmt: (v) => v != null ? `${v >= 0 ? '+' : ''}${(v * 100).toFixed(2)}%/d` : '—' },
  { key: 'pp1', label: 'Prior 10d Move',      max: 4,  rawKey: 'p1_10d_gain',    fmt: (v) => v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`           : '—' },
];
