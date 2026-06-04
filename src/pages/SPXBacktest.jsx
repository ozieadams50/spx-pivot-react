import { useState } from 'react';
import { apiFetch } from '../lib/api';

// ── Period filter ─────────────────────────────────────────────────────────────

function filterByPeriod(data, period) {
  if (!data || period === 'All') return data;
  const days = { '1yr': 252, '3yr': 756, '5yr': 1260 };
  const n = days[period] ?? data.length;
  return data.slice(-n);
}

// ── Equity Curve SVG ──────────────────────────────────────────────────────────

function EquityCurve({ data }) {
  if (!data || data.length < 2) return (
    <div className="flex h-56 items-center justify-center text-sm text-slate-600">No data</div>
  );

  const W = 860, H = 240, PAD = { t: 12, r: 16, b: 36, l: 76 };
  const cw = W - PAD.l - PAD.r;
  const ch = H - PAD.t - PAD.b;

  const vals = data.map(d => d.equity);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const rng  = maxV - minV || 1;

  const px = i => PAD.l + (i / (data.length - 1)) * cw;
  const py = v => PAD.t + ch - ((v - minV) / rng) * ch;

  const pts     = data.map((d, i) => `${px(i)},${py(d.equity)}`).join(' ');
  const fillPts = `${px(0)},${PAD.t + ch} ${pts} ${px(data.length - 1)},${PAD.t + ch}`;

  const yTicks = Array.from({ length: 5 }, (_, i) => minV + (rng / 4) * i);
  const xStep  = Math.max(1, Math.floor(data.length / 7));
  const xTicks = data.filter((_, i) => i % xStep === 0 || i === data.length - 1);

  const fmtY   = v => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v.toFixed(0)}`;
  const fmtX   = s => s.slice(0, 7);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 240 }}>
      <defs>
        <linearGradient id="eq-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#06b6d4" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={PAD.l} x2={W - PAD.r} y1={py(v)} y2={py(v)} stroke="#ffffff0a" strokeWidth="1" />
          <text x={PAD.l - 8} y={py(v) + 4} textAnchor="end" fontSize="10" fill="#475569">{fmtY(v)}</text>
        </g>
      ))}

      <polygon points={fillPts} fill="url(#eq-grad)" />
      <polyline points={pts} fill="none" stroke="#06b6d4" strokeWidth="1.8" strokeLinejoin="round" />

      {xTicks.map((d, i) => {
        const idx = data.indexOf(d);
        return (
          <text key={i} x={px(idx)} y={H - 6} textAnchor="middle" fontSize="10" fill="#475569">
            {fmtX(d.date)}
          </text>
        );
      })}
    </svg>
  );
}

// ── Monthly Bars SVG ──────────────────────────────────────────────────────────

function MonthlyBars({ data }) {
  if (!data || data.length === 0) return null;
  const W = 760, H = 180, PAD = { t: 12, r: 8, b: 36, l: 52 };
  const cw = W - PAD.l - PAD.r, ch = H - PAD.t - PAD.b;
  const maxAbs = Math.max(...data.map(d => Math.abs(d.pnl)), 1);
  const barW   = Math.max(6, (cw / data.length) - 3);
  const midY   = PAD.t + ch / 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 180 }}>
      <line x1={PAD.l} x2={W - PAD.r} y1={midY} y2={midY} stroke="#ffffff12" strokeWidth="1" />

      {data.map((m, i) => {
        const x   = PAD.l + i * (cw / data.length) + (cw / data.length - barW) / 2;
        const h   = Math.max(2, (Math.abs(m.pnl) / maxAbs) * (ch / 2));
        const y   = m.pnl >= 0 ? midY - h : midY;
        const clr = m.pnl >= 0 ? '#22c55e' : '#ef4444';
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} fill={clr} rx="2" opacity="0.85">
              <title>{m.month}: {m.pnl >= 0 ? '+' : ''}${m.pnl}</title>
            </rect>
            {data.length <= 30 && (
              <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize="8" fill="#475569">
                {m.month.slice(2)}
              </text>
            )}
          </g>
        );
      })}

      {[maxAbs, 0, -maxAbs].map((v, i) => {
        const yp  = PAD.t + (ch / 2) - (v / maxAbs) * (ch / 2);
        const lbl = v === 0 ? '$0' : `${v >= 0 ? '+' : ''}$${Math.abs(v).toFixed(0)}`;
        return (
          <text key={i} x={PAD.l - 4} y={yp + 4} textAnchor="end" fontSize="9" fill="#475569">{lbl}</text>
        );
      })}
    </svg>
  );
}

// ── Trade Outcomes donut ──────────────────────────────────────────────────────

function TradeOutcomes({ s, fmtDollar }) {
  if (!s) return null;
  const total = s.wins + s.losses;
  const pct   = total > 0 ? s.wins / total : 0;
  const R = 70, r = 48, cx = 90, cy = 90;
  const angle  = pct * 2 * Math.PI;
  const x1 = cx + R * Math.sin(0),     y1 = cy - R * Math.cos(0);
  const x2 = cx + R * Math.sin(angle), y2 = cy - R * Math.cos(angle);
  const large  = angle > Math.PI ? 1 : 0;
  const winArc  = `M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`;
  const loseArc = `M ${cx} ${cy} L ${x2} ${y2} A ${R} ${R} 0 ${1 - large} 1 ${x1} ${y1} Z`;

  return (
    <div>
      <svg viewBox="0 0 180 180" className="w-full max-w-[180px] mx-auto">
        {s.losses > 0 && <path d={loseArc} fill="#ef4444" opacity="0.75" />}
        {s.wins   > 0 && <path d={winArc}  fill="#22c55e" opacity="0.85" />}
        <circle cx={cx} cy={cy} r={r} fill="#0d1f2d" />
        <text x={cx} y={cy - 8}  textAnchor="middle" fontSize="22" fontWeight="bold" fill="white">
          {total.toLocaleString()}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="11" fill="#94a3b8">Trades</text>
      </svg>

      <div className="mt-3 space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-slate-400">Winning Trades</span>
          </span>
          <span className="font-semibold text-emerald-400">
            {s.wins.toLocaleString()} <span className="text-slate-500">({s.win_rate}%)</span>
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-rose-500" />
            <span className="text-slate-400">Losing Trades</span>
          </span>
          <span className="font-semibold text-rose-400">
            {s.losses.toLocaleString()} <span className="text-slate-500">({(100 - s.win_rate).toFixed(1)}%)</span>
          </span>
        </div>

        <div className="mt-2 border-t border-white/10 pt-2 space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Avg Win</span>
            <span className="text-emerald-400">{fmtDollar(s.avg_win_pnl)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Avg Loss</span>
            <span className="text-rose-400">{fmtDollar(s.avg_loss_pnl)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Largest Win</span>
            <span className="text-emerald-400">{fmtDollar(s.largest_win)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Largest Loss</span>
            <span className="text-rose-400">{fmtDollar(s.largest_loss)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Metric card ───────────────────────────────────────────────────────────────

// ── Metric icons (inline SVG) ─────────────────────────────────────────────────

const ICONS = {
  trades: (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="10" width="3" height="8" rx="1" fill="currentColor" stroke="none" opacity="0.7" />
      <rect x="7" y="6"  width="3" height="12" rx="1" fill="currentColor" stroke="none" opacity="0.7" />
      <rect x="12" y="2" width="3" height="16" rx="1" fill="currentColor" stroke="none" opacity="0.7" />
      <rect x="17" y="8" width="3" height="10" rx="1" fill="currentColor" stroke="none" opacity="0.7" />
    </svg>
  ),
  winrate: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" opacity="0.7">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
  ),
  factor: (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.5" opacity="0.7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 10h16M10 2l-4 4m4-4l4 4M10 18l-4-4m4 4l4-4" />
    </svg>
  ),
  profit: (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.5" opacity="0.7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-3.182-.818m3.182.818L17.25 6" />
    </svg>
  ),
  drawdown: (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.5" opacity="0.7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.306-4.307a11.95 11.95 0 015.814 5.519l2.74 1.22m0 0l-3.182.818m3.182-.818L17.25 14" />
    </svg>
  ),
  annual: (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.5" opacity="0.7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-3.182-.818m3.182.818L17.25 6" />
    </svg>
  ),
};

function Metric({ label, value, sub, color = 'text-white', badge, icon, tooltip }) {
  return (
    <div className="group relative rounded-xl border border-white/10 bg-[#0d1f2d] p-3 cursor-default">
      {tooltip && (
        <div className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-50 w-52 -translate-x-1/2 rounded-xl border border-white/10 bg-[#0a1628] p-3 opacity-0 shadow-2xl transition-opacity duration-150 group-hover:opacity-100">
          {tooltip.map((line, i) => (
            <p key={i} className={i === 0 ? 'text-[11px] font-semibold text-white' : 'mt-1 text-[10px] text-slate-400'}>
              {line}
            </p>
          ))}
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[#0a1628]" />
        </div>
      )}
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
        {icon && <span className="text-slate-600">{ICONS[icon]}</span>}
      </div>
      <p className={`mt-1 text-xl font-bold leading-none ${color}`}>{value}</p>
      {badge && (
        <span className="mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold bg-violet-500/20 text-violet-300">
          {badge}
        </span>
      )}
      {sub && !badge && <p className="mt-0.5 text-[10px] text-slate-500">{sub}</p>}
    </div>
  );
}

// ── Segmented button ──────────────────────────────────────────────────────────

function Seg({ options, value, onChange }) {
  return (
    <div className="flex gap-1">
      {options.map(o => (
        <button key={o.v} type="button" onClick={() => onChange(o.v)}
          className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition ${
            value === o.v
              ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300'
              : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
          }`}>
          {o.l ?? o.v}
        </button>
      ))}
    </div>
  );
}

// ── Label ─────────────────────────────────────────────────────────────────────

function Lbl({ children }) {
  return <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">{children}</label>;
}

// ── Input ─────────────────────────────────────────────────────────────────────

const inputCls = 'w-full rounded-lg border border-white/10 bg-[#061018] px-2 py-1.5 text-sm text-white outline-none focus:border-cyan-500/50';

// ── EXIT COLORS ───────────────────────────────────────────────────────────────

const EXIT_COLORS = {
  expiry:        { bg: 'bg-emerald-500/15', text: 'text-emerald-300', label: 'Expiration'     },
  profit_target: { bg: 'bg-cyan-500/15',    text: 'text-cyan-300',    label: 'Profit Target'  },
  stop_loss:     { bg: 'bg-amber-500/15',   text: 'text-amber-300',   label: 'Stop Loss'      },
  breach:        { bg: 'bg-rose-500/15',    text: 'text-rose-300',    label: 'Strike Breach'  },
};

// ── Main page ─────────────────────────────────────────────────────────────────

const MIN_DATE   = '2015-01-01';
const MIN_DATE_LABEL = '01/01/2015';
const TODAY = new Date().toISOString().slice(0, 10);

const DEFAULTS = {
  start_date: '2015-01-01', end_date: TODAY,
  mode: 'weekly', strike_level: 'S1', spread_width: 5,
  profit_target_pct: 0.50, stop_loss_pct: 2.00,
  vix_min: 0, vix_max: 80, contracts: 1,
  min_credit: 0.50,
  sma_filter: 'none', entry_days: ['Any'],
};

export default function SPXBacktest() {
  const [form,    setForm]    = useState({ ...DEFAULTS });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [period,  setPeriod]  = useState('All');

  const set = key => val => setForm(f => ({ ...f, [key]: val }));

  async function runBacktest() {
    if (form.start_date < MIN_DATE) {
      setError(`${MIN_DATE_LABEL} is our earliest available data. Please choose a start date on or after that.`);
      return;
    }
    setLoading(true); setError(''); setResults(null);
    try {
      const data = await apiFetch('/backtest/spx', { method: 'POST', body: JSON.stringify(form) });
      setResults(data);
    } catch (e) {
      setError(e.message ?? 'Backtest failed.');
    } finally {
      setLoading(false);
    }
  }

  const s = results?.summary;

  const fmtDollar = v => {
    if (v === undefined || v === null) return '—';
    const abs = Math.abs(v);
    const str = abs >= 1000 ? `$${(abs / 1000).toFixed(1)}k` : `$${abs.toFixed(0)}`;
    return v < 0 ? `-${str}` : str;
  };

  const eqData = results ? filterByPeriod(results.equity_curve, period) : null;

  return (
    <div className="p-4 md:p-5">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">SPX Put Credit Spread</h1>
          <p className="text-sm text-slate-400">Backtester</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/10">
            Save Strategy
          </button>
          <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/10">
            Load Strategy
          </button>
          <button onClick={runBacktest} disabled={loading}
            className="rounded-lg bg-violet-600 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-violet-500 disabled:opacity-50">
            {loading ? 'Running…' : '▶  Run Backtest'}
          </button>
        </div>
      </div>

      {/* ── Main grid: 3 inputs + 9 results ──────────────────────────────── */}
      <div className="grid grid-cols-12 gap-4">

        {/* ── Left: Inputs ─────────────────────────────────────────────── */}
        <div className="col-span-3 rounded-2xl border border-white/10 bg-[#0d1f2d] p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Strategy Inputs</p>

          <div className="space-y-3">

            {/* Date range */}
            <div>
              <Lbl>Date Range</Lbl>
              <div className="grid grid-cols-2 gap-1.5">
                <input type="date" value={form.start_date} min={MIN_DATE}
                  onChange={e => set('start_date')(e.target.value)} className={inputCls} />
                <input type="date" value={form.end_date} min={MIN_DATE}
                  onChange={e => set('end_date')(e.target.value)} className={inputCls} />
              </div>
              {form.start_date < MIN_DATE && (
                <p className="mt-1 text-[10px] text-amber-400">
                  {MIN_DATE_LABEL} is our earliest available data.
                </p>
              )}
            </div>

            {/* Mode */}
            <div>
              <Lbl>DTE / Mode</Lbl>
              <Seg options={[{v:'weekly',l:'Weekly'},{v:'monthly',l:'Monthly'},{v:'daily',l:'Daily'}]}
                value={form.mode} onChange={set('mode')} />
            </div>

            {/* Strike level */}
            <div>
              <Lbl>Short Strike Level</Lbl>
              <Seg options={[{v:'S2'},{v:'MidS'},{v:'S1'}]}
                value={form.strike_level} onChange={set('strike_level')} />
            </div>

            {/* Spread width slider */}
            <div>
              <div className="flex items-center justify-between">
                <Lbl>Spread Width (Pts)</Lbl>
                <span className="mb-1 text-xs font-semibold text-cyan-400">${form.spread_width}</span>
              </div>
              <input type="range" min={5} max={50} step={5} value={form.spread_width}
                onChange={e => set('spread_width')(Number(e.target.value))}
                className="w-full accent-cyan-500" />
              <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
                <span>$5</span><span>$25</span><span>$50</span>
              </div>
            </div>

            {/* Min credit */}
            <div>
              <Lbl>Min Credit Per Spread</Lbl>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">$</span>
                <input type="number" value={form.min_credit} min={0} max={10} step={0.10}
                  onChange={e => set('min_credit')(parseFloat(e.target.value) || 0)}
                  className={inputCls} />
              </div>
            </div>

            {/* Contracts */}
            <div>
              <Lbl>Number of Contracts</Lbl>
              <input type="number" value={form.contracts} min={1} max={100} step={1}
                onChange={e => set('contracts')(parseInt(e.target.value) || 1)}
                className={inputCls} />
            </div>

            {/* VIX range */}
            <div>
              <div className="flex items-center justify-between">
                <Lbl>VIX Range</Lbl>
                <span className="mb-1 text-[10px] text-slate-500">Per Spread</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-500 w-6">Min</span>
                  <input type="number" value={form.vix_min} min={0} max={79} step={1}
                    onChange={e => set('vix_min')(Number(e.target.value))}
                    className={inputCls} />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-500 w-6">Max</span>
                  <input type="number" value={form.vix_max} min={1} max={150} step={1}
                    onChange={e => set('vix_max')(Number(e.target.value))}
                    className={inputCls} />
                </div>
              </div>
            </div>

            {/* Profit target */}
            <div>
              <Lbl>Profit Target</Lbl>
              <Seg options={[{v:0.25,l:'25%'},{v:0.50,l:'50%'},{v:0.75,l:'75%'},{v:1.00,l:'Hold'}]}
                value={form.profit_target_pct} onChange={set('profit_target_pct')} />
            </div>

            {/* Stop loss */}
            <div>
              <Lbl>Stop Loss</Lbl>
              <Seg options={[{v:0,l:'None'},{v:1.0,l:'1×'},{v:2.0,l:'2×'},{v:3.0,l:'3×'}]}
                value={form.stop_loss_pct} onChange={set('stop_loss_pct')} />
              <p className="mt-0.5 text-[9px] text-slate-600">
                {form.stop_loss_pct === 0 ? 'No stop loss — hold to expiry or profit target' : 'Multiples of credit received'}
              </p>
            </div>

            {/* SMA filter */}
            <div>
              <Lbl>SMA Filter</Lbl>
              <select value={form.sma_filter} onChange={e => set('sma_filter')(e.target.value)}
                className={inputCls}>
                <option value="none">None (all conditions)</option>
                <option value="above_20">SPX above 20-day SMA</option>
                <option value="above_50">SPX above 50-day SMA</option>
                <option value="below_20">SPX below 20-day SMA</option>
              </select>
            </div>

            {/* Entry day */}
            <div>
              <Lbl>Exit Rules</Lbl>
              <Seg options={[{v:'Any'},{v:'Monday',l:'Mon'},{v:'Wednesday',l:'Wed'},{v:'Friday',l:'Fri'}]}
                value={form.entry_days[0]} onChange={v => set('entry_days')([v])} />
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{error}</div>
            )}

            <button onClick={runBacktest} disabled={loading}
              className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-bold text-white transition hover:bg-violet-500 disabled:opacity-50">
              {loading ? 'Running…' : '▶  RUN BACKTEST'}
            </button>

            <p className="text-center text-[9px] text-slate-600">
              Credits estimated via Black-Scholes + VIX (±20%)
            </p>
          </div>
        </div>

        {/* ── Right: Results ────────────────────────────────────────────── */}
        <div className="col-span-9 space-y-4">

          {/* Loading state */}
          {loading && (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-white/10 bg-[#0d1f2d]">
              <div className="text-center">
                <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-400" />
                <p className="text-sm text-slate-400">Running simulation…</p>
                <p className="mt-1 text-xs text-slate-600">Usually 4–10 seconds</p>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!results && !loading && (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#0d1f2d]">
              <p className="text-sm text-slate-600">Configure inputs and click Run Backtest</p>
            </div>
          )}

          {results && s && (
            <>
              {/* ── Metric cards ───────────────────────────────────────── */}
              <div className="grid grid-cols-6 gap-3">
                <Metric label="Total Trades"
                  value={s.total_trades.toLocaleString()}
                  sub={`${s.wins}W · ${s.losses}L`}
                  icon="trades"
                  tooltip={[
                    `${s.total_trades.toLocaleString()} trades executed`,
                    `Winning: ${s.wins.toLocaleString()} (${s.win_rate}%)`,
                    `Losing:  ${s.losses.toLocaleString()} (${(100 - s.win_rate).toFixed(1)}%)`,
                    `Consec. losses: ${s.consecutive_losses}`,
                  ]} />
                <Metric label="Win Rate"
                  value={`${s.win_rate}%`}
                  color={s.win_rate >= 70 ? 'text-emerald-400' : s.win_rate >= 55 ? 'text-amber-400' : 'text-rose-400'}
                  icon="winrate"
                  tooltip={[
                    `${s.win_rate}% of trades profitable`,
                    `${s.wins} wins out of ${s.total_trades} total`,
                    `Avg win:  ${fmtDollar(s.avg_win_pnl)}`,
                    `Avg loss: ${fmtDollar(s.avg_loss_pnl)}`,
                  ]} />
                <Metric label="Profit Factor"
                  value={s.profit_factor}
                  color={s.profit_factor >= 1.5 ? 'text-emerald-400' : 'text-slate-300'}
                  icon="factor"
                  tooltip={[
                    `Profit factor: ${s.profit_factor}`,
                    'Gross profit ÷ gross loss',
                    s.profit_factor >= 2.0 ? 'Rating: Strong edge' :
                    s.profit_factor >= 1.5 ? 'Rating: Good edge' :
                    s.profit_factor >= 1.0 ? 'Rating: Marginal' : 'Rating: Negative edge',
                  ]} />
                <Metric label="Net Profit"
                  value={fmtDollar(s.net_profit)}
                  color={s.net_profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}
                  sub={`Avg ${fmtDollar(s.avg_pnl)} / trade`}
                  icon="profit"
                  tooltip={[
                    `Net P&L: ${fmtDollar(s.net_profit)}`,
                    `Avg per trade: ${fmtDollar(s.avg_pnl)}`,
                    `Avg credit: $${s.avg_credit}`,
                    `Largest win:  ${fmtDollar(s.largest_win)}`,
                    `Largest loss: ${fmtDollar(s.largest_loss)}`,
                  ]} />
                <Metric label="Max Drawdown"
                  value={fmtDollar(s.max_drawdown)}
                  color="text-rose-400"
                  icon="drawdown"
                  tooltip={[
                    `Max drawdown: ${fmtDollar(s.max_drawdown)}`,
                    'Largest peak-to-trough',
                    'equity decline in the period',
                  ]} />
                <Metric label="Annualized Return"
                  value={`${s.annualized_return}%`}
                  color={s.annualized_return >= 10 ? 'text-emerald-400' : s.annualized_return >= 0 ? 'text-amber-400' : 'text-rose-400'}
                  badge={s.annualized_return >= 20 ? 'Exceptional' : s.annualized_return >= 10 ? 'Strong' : null}
                  icon="annual"
                  tooltip={[
                    `Annualized Return: ${s.annualized_return}%`,
                    'Compound Annual Growth Rate (CAGR)',
                    'Based on $10,000 starting capital',
                    'Benchmark: S&P 500 long-term avg ≈ 10%',
                  ]} />
              </div>

              {/* ── Equity Curve + Trade Outcomes ──────────────────────── */}
              <div className="grid grid-cols-[1fr_240px] gap-4">

                {/* Equity curve */}
                <div className="rounded-2xl border border-white/10 bg-[#0d1f2d] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Equity Curve</p>
                    <div className="flex gap-1">
                      {['1yr','3yr','5yr','All'].map(p => (
                        <button key={p} onClick={() => setPeriod(p)}
                          className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold transition ${
                            period === p
                              ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300'
                              : 'border-white/10 text-slate-500 hover:text-slate-300'
                          }`}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <EquityCurve data={eqData} />
                </div>

                {/* Trade outcomes */}
                <div className="rounded-2xl border border-white/10 bg-[#0d1f2d] p-4">
                  <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Trade Outcomes
                  </p>
                  <TradeOutcomes s={s} fmtDollar={fmtDollar} />
                </div>
              </div>

              {/* ── Monthly P&L + VIX Range ────────────────────────────── */}
              <div className="grid grid-cols-2 gap-4">

                {/* Monthly Performance */}
                <div className="rounded-2xl border border-white/10 bg-[#0d1f2d] p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Monthly Performance</p>
                  <MonthlyBars data={results.monthly_perf} />
                </div>

                {/* VIX Range Performance */}
                <div className="rounded-2xl border border-white/10 bg-[#0d1f2d] p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">VIX Range Performance</p>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-slate-500">
                        <th className="pb-2 text-left">VIX Range</th>
                        <th className="pb-2 text-right">Trades</th>
                        <th className="pb-2 text-right">Win Rate</th>
                        <th className="pb-2 text-right">Net Profit</th>
                        <th className="pb-2 text-right">Profit Factor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {results.vix_breakdown.map(v => {
                        const clr = v.win_rate >= 80 ? 'text-emerald-400' : v.win_rate >= 65 ? 'text-cyan-400' : v.win_rate >= 50 ? 'text-amber-400' : 'text-rose-400';
                        return (
                          <tr key={v.vix_bucket}>
                            <td className="py-1.5 text-slate-300">{v.vix_bucket}</td>
                            <td className="py-1.5 text-right text-slate-400">{v.trades}</td>
                            <td className={`py-1.5 text-right font-semibold ${clr}`}>{v.win_rate}%</td>
                            <td className={`py-1.5 text-right font-semibold ${v.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {fmtDollar(v.pnl)}
                            </td>
                            <td className={`py-1.5 text-right ${v.profit_factor >= 1.5 ? 'text-emerald-400' : 'text-slate-300'}`}>
                              {v.profit_factor ?? '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Trade Log ──────────────────────────────────────────── */}
              <div className="rounded-2xl border border-white/10 bg-[#0d1f2d]">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Trade Log</p>
                  <button
                    onClick={() => {
                      const cols = ['Date','SPX','VIX','Short Strike','Long Strike','DTE','Credit','P&L','Exit Type'];
                      const rows = results.trades.map(t => [
                        t.entry_date, t.spx_entry?.toFixed(0), t.vix_entry?.toFixed(1),
                        t.short_strike, t.long_strike, t.dte,
                        t.credit?.toFixed(2), t.pnl?.toFixed(0),
                        EXIT_COLORS[t.exit_reason]?.label ?? t.exit_reason,
                      ].join(','));
                      const csv = [cols.join(','), ...rows].join('\n');
                      const a   = document.createElement('a');
                      a.href    = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
                      a.download = 'spx_backtest.csv';
                      a.click();
                    }}
                    className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-400 transition hover:bg-cyan-500/20">
                    ↓ Export CSV
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-slate-600">
                        <th className="px-3 py-2 text-left">Date</th>
                        <th className="px-3 py-2 text-right">SPX</th>
                        <th className="px-3 py-2 text-right">VIX</th>
                        <th className="px-3 py-2 text-right">Short Strike</th>
                        <th className="px-3 py-2 text-right">Long Strike</th>
                        <th className="px-3 py-2 text-right">DTE</th>
                        <th className="px-3 py-2 text-right">Credit</th>
                        <th className="px-3 py-2 text-right">P&amp;L</th>
                        <th className="px-3 py-2 text-left">Exit Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...results.trades].reverse().map((t, i) => {
                        const cfg = EXIT_COLORS[t.exit_reason] ?? { bg: 'bg-white/5', text: 'text-slate-400', label: t.exit_reason };
                        return (
                          <tr key={i} className={`border-b border-white/[0.04] transition-colors hover:bg-white/[0.02] ${!t.win ? 'bg-rose-500/[0.03]' : ''}`}>
                            <td className="px-3 py-1.5 font-mono text-slate-300">{t.entry_date}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-slate-300">{t.spx_entry?.toFixed(0)}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-slate-400">{t.vix_entry?.toFixed(1)}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-slate-300">{t.short_strike}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-slate-500">{t.long_strike}</td>
                            <td className="px-3 py-1.5 text-right text-slate-400">{t.dte}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-cyan-400">${t.credit?.toFixed(2)}</td>
                            <td className={`px-3 py-1.5 text-right font-mono font-semibold ${t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {t.pnl >= 0 ? '+' : ''}{t.pnl?.toFixed(0)}
                            </td>
                            <td className="px-3 py-1.5">
                              <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${cfg.bg} ${cfg.text}`}>
                                {cfg.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
