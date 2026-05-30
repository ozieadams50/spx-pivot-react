import { useState } from 'react';
import { apiFetch } from '../lib/api';

// ── SVG Chart helpers ─────────────────────────────────────────────────────────

function EquityCurve({ data }) {
  if (!data || data.length < 2) return <div className="h-56 flex items-center justify-center text-slate-600 text-sm">No data</div>;

  const W = 800, H = 220, PAD = { t: 12, r: 12, b: 32, l: 68 };
  const cw = W - PAD.l - PAD.r, ch = H - PAD.t - PAD.b;

  const vals  = data.map(d => d.equity);
  const minV  = Math.min(...vals);
  const maxV  = Math.max(...vals);
  const rng   = maxV - minV || 1;

  const px = (i) => PAD.l + (i / (data.length - 1)) * cw;
  const py = (v) => PAD.t + ch - ((v - minV) / rng) * ch;

  const pts = data.map((d, i) => `${px(i)},${py(d.equity)}`).join(' ');

  // Fill path beneath the line
  const fillPts = `${px(0)},${PAD.t + ch} ` + pts + ` ${px(data.length - 1)},${PAD.t + ch}`;

  // Y-axis labels (5 ticks)
  const yTicks = Array.from({ length: 5 }, (_, i) => minV + (rng / 4) * i);

  // X-axis: show ~6 evenly spaced date labels
  const xStep  = Math.max(1, Math.floor(data.length / 6));
  const xTicks = data.filter((_, i) => i % xStep === 0 || i === data.length - 1);

  const fmtK = v => v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(0)}`;
  const fmtDate = s => s.slice(0, 7);

  const lineColor  = vals[vals.length - 1] >= vals[0] ? '#22d3ee' : '#f87171';
  const fillColor  = vals[vals.length - 1] >= vals[0] ? '#22d3ee18' : '#f8717118';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 220 }}>
      <defs>
        <linearGradient id="eq-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={PAD.l} x2={W - PAD.r} y1={py(v)} y2={py(v)} stroke="#ffffff0f" strokeWidth="1" />
          <text x={PAD.l - 6} y={py(v) + 4} textAnchor="end" fontSize="9" fill="#64748b">{fmtK(v)}</text>
        </g>
      ))}

      {/* Fill area */}
      <polygon points={fillPts} fill="url(#eq-fill)" />

      {/* Line */}
      <polyline points={pts} fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinejoin="round" />

      {/* X labels */}
      {xTicks.map((d, i) => {
        const idx = data.indexOf(d);
        return (
          <text key={i} x={px(idx)} y={H - 4} textAnchor="middle" fontSize="9" fill="#64748b">
            {fmtDate(d.date)}
          </text>
        );
      })}
    </svg>
  );
}

function MonthlyBars({ data }) {
  if (!data || data.length === 0) return null;
  const W = 800, H = 180, PAD = { t: 8, r: 8, b: 32, l: 56 };
  const cw = W - PAD.l - PAD.r, ch = H - PAD.t - PAD.b;
  const maxAbs = Math.max(...data.map(d => Math.abs(d.pnl)), 1);
  const barW   = Math.max(4, (cw / data.length) - 2);
  const midY   = PAD.t + ch / 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 180 }}>
      {/* Zero line */}
      <line x1={PAD.l} x2={W - PAD.r} y1={midY} y2={midY} stroke="#ffffff1a" strokeWidth="1" />

      {data.map((m, i) => {
        const x   = PAD.l + i * (cw / data.length) + (cw / data.length - barW) / 2;
        const h   = (Math.abs(m.pnl) / maxAbs) * (ch / 2);
        const y   = m.pnl >= 0 ? midY - h : midY;
        const clr = m.pnl >= 0 ? '#22c55e' : '#ef4444';
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} fill={clr} rx="2" opacity="0.8">
              <title>{m.month}: ${m.pnl >= 0 ? '+' : ''}{m.pnl}</title>
            </rect>
            {data.length <= 24 && (
              <text x={x + barW / 2} y={H - 4} textAnchor="middle" fontSize="8" fill="#475569">
                {m.month.slice(2)}
              </text>
            )}
          </g>
        );
      })}

      {/* Y labels */}
      {[maxAbs, 0, -maxAbs].map((v, i) => {
        const yp = PAD.t + (ch / 2) - (v / maxAbs) * (ch / 2);
        const fmtV = v === 0 ? '0' : `${v >= 0 ? '+' : ''}$${Math.abs(v).toFixed(0)}`;
        return (
          <text key={i} x={PAD.l - 4} y={yp + 4} textAnchor="end" fontSize="9" fill="#64748b">{fmtV}</text>
        );
      })}
    </svg>
  );
}

function DonutChart({ wins, losses }) {
  const total = wins + losses;
  if (total === 0) return null;
  const pct   = wins / total;
  const R = 60, r = 38, cx = 80, cy = 80;
  const angle = pct * 2 * Math.PI;
  const x1 = cx + R * Math.sin(0),     y1 = cy - R * Math.cos(0);
  const x2 = cx + R * Math.sin(angle), y2 = cy - R * Math.cos(angle);
  const large = angle > Math.PI ? 1 : 0;
  const winPath  = `M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`;
  const losePath = `M ${cx} ${cy} L ${x2} ${y2} A ${R} ${R} 0 ${1 - large} 1 ${x1} ${y1} Z`;

  return (
    <svg viewBox="0 0 160 160" className="w-full max-w-[160px] mx-auto">
      {losses > 0 && <path d={losePath} fill="#ef4444" opacity="0.7" />}
      {wins   > 0 && <path d={winPath}  fill="#22c55e" opacity="0.85" />}
      <circle cx={cx} cy={cy} r={r} fill="#0d1f2d" />
      <text x={cx} y={cy - 6}  textAnchor="middle" fontSize="16" fontWeight="bold" fill="white">
        {(pct * 100).toFixed(1)}%
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="#94a3b8">Win Rate</text>
    </svg>
  );
}

// ── Metric card ───────────────────────────────────────────────────────────────

function Metric({ label, value, sub, color = 'text-white' }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1f2d] p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

// ── Input helpers ─────────────────────────────────────────────────────────────

function Label({ children }) {
  return <label className="mb-1.5 block text-xs font-medium text-slate-400">{children}</label>;
}

function Seg({ options, value, onChange }) {
  return (
    <div className="flex gap-1">
      {options.map(o => (
        <button key={o.v} type="button" onClick={() => onChange(o.v)}
          className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition ${
            value === o.v
              ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300'
              : 'border-white/10 bg-white/5 text-slate-400 hover:border-cyan-500/30'
          }`}>{o.l || o.v}</button>
      ))}
    </div>
  );
}

function NumIn({ value, onChange, min, max, step = 0.05, prefix = '' }) {
  return (
    <div className="flex items-center gap-1.5">
      {prefix && <span className="text-xs text-slate-500">{prefix}</span>}
      <input type="number" value={value} min={min} max={max} step={step}
        onChange={e => onChange(parseFloat(e.target.value) || value)}
        className="w-full rounded-lg border border-white/10 bg-[#061018] px-2 py-1.5 text-sm text-white outline-none focus:border-cyan-500/50" />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const DEFAULTS = {
  start_date: '2020-01-01', end_date: '2024-12-31',
  mode: 'weekly', strike_level: 'S1', spread_width: 5,
  profit_target_pct: 0.50, stop_loss_pct: 2.00,
  vix_min: 0, vix_max: 80, contracts: 1,
  ema_filter: 'none', entry_days: ['Any'],
};

const EXIT_COLORS = {
  expiry:        { bg: 'bg-emerald-500/15', text: 'text-emerald-300', label: 'Expired Worthless' },
  profit_target: { bg: 'bg-cyan-500/15',    text: 'text-cyan-300',    label: 'Profit Target'     },
  stop_loss:     { bg: 'bg-amber-500/15',   text: 'text-amber-300',   label: 'Stop Loss'         },
  breach:        { bg: 'bg-rose-500/15',    text: 'text-rose-300',    label: 'Strike Breach'     },
};

export default function SPXBacktest() {
  const [form,    setForm]    = useState({ ...DEFAULTS });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  function set(key) { return val => setForm(f => ({ ...f, [key]: val })); }

  async function runBacktest() {
    setLoading(true); setError(''); setResults(null);
    try {
      const data = await apiFetch('/backtest/spx', {
        method: 'POST',
        body: JSON.stringify(form),
      });
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

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">SPX Put Credit Spread Backtester</h1>
        <p className="mt-1 text-sm text-slate-400">
          5-wide bull put spreads at pivot support levels. Credits estimated via Black-Scholes + VIX.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[280px_1fr]">

        {/* ── Left: Inputs ─────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/10 bg-[#0d1f2d] p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">Strategy Inputs</p>

          <div className="space-y-4">

            {/* Date range */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Start Date</Label>
                <input type="date" value={form.start_date} onChange={e => set('start_date')(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#061018] px-2 py-1.5 text-sm text-white outline-none focus:border-cyan-500/50" />
              </div>
              <div>
                <Label>End Date</Label>
                <input type="date" value={form.end_date} onChange={e => set('end_date')(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#061018] px-2 py-1.5 text-sm text-white outline-none focus:border-cyan-500/50" />
              </div>
            </div>

            {/* Mode */}
            <div>
              <Label>DTE / Mode</Label>
              <Seg options={[{v:'weekly',l:'Weekly'},{v:'monthly',l:'Monthly'},{v:'daily',l:'Daily 0DTE'}]}
                   value={form.mode} onChange={set('mode')} />
            </div>

            {/* Strike level */}
            <div>
              <Label>Short Strike Level</Label>
              <Seg options={[{v:'S2'},{v:'MidS'},{v:'S1'}]}
                   value={form.strike_level} onChange={set('strike_level')} />
              <p className="mt-1 text-[10px] text-slate-600">
                S1 = nearest support · MidS = midpoint · S2 = outer support
              </p>
            </div>

            {/* Spread width */}
            <div>
              <Label>Spread Width (pts)</Label>
              <Seg options={[{v:5},{v:10},{v:25},{v:50}]}
                   value={form.spread_width} onChange={set('spread_width')} />
            </div>

            {/* Profit target */}
            <div>
              <Label>Profit Target</Label>
              <Seg options={[{v:0.25,l:'25%'},{v:0.50,l:'50%'},{v:0.75,l:'75%'},{v:1.00,l:'Hold'}]}
                   value={form.profit_target_pct} onChange={set('profit_target_pct')} />
            </div>

            {/* Stop loss */}
            <div>
              <Label>Stop Loss</Label>
              <Seg options={[{v:1.0,l:'1×'},{v:2.0,l:'2×'},{v:3.0,l:'3×'}]}
                   value={form.stop_loss_pct} onChange={set('stop_loss_pct')} />
              <p className="mt-1 text-[10px] text-slate-600">Multiples of credit received</p>
            </div>

            {/* VIX filter */}
            <div>
              <Label>VIX Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <NumIn value={form.vix_min} onChange={set('vix_min')} min={0} max={79} step={1} prefix="Min" />
                <NumIn value={form.vix_max} onChange={set('vix_max')} min={1} max={150} step={1} prefix="Max" />
              </div>
            </div>

            {/* EMA filter */}
            <div>
              <Label>Trend Filter (EMA)</Label>
              <select value={form.ema_filter} onChange={e => set('ema_filter')(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#061018] px-2 py-1.5 text-sm text-white outline-none">
                <option value="none">None (all conditions)</option>
                <option value="above_20">SPX above 20 EMA</option>
                <option value="above_50">SPX above 50 EMA</option>
                <option value="below_20">SPX below 20 EMA</option>
              </select>
            </div>

            {/* Entry day */}
            <div>
              <Label>Entry Day</Label>
              <Seg options={[{v:'Any'},{v:'Monday',l:'Mon'},{v:'Tuesday',l:'Tue'},{v:'Wednesday',l:'Wed'}]}
                   value={form.entry_days[0]} onChange={v => set('entry_days')([v])} />
            </div>

            {/* Contracts */}
            <div>
              <Label>Contracts</Label>
              <NumIn value={form.contracts} onChange={set('contracts')} min={1} max={100} step={1} />
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{error}</div>
            )}

            <button onClick={runBacktest} disabled={loading}
              className="w-full rounded-xl bg-cyan-500 py-2.5 text-sm font-bold text-[#061018] transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? 'Running…' : '▶  Run Backtest'}
            </button>

            <p className="text-center text-[10px] text-slate-600">
              Credits are B-S estimates (±20%). Win/loss based on SPX vs strike at close.
            </p>
          </div>
        </div>

        {/* ── Right: Results ───────────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Loading */}
          {loading && (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-white/10 bg-[#0d1f2d]">
              <div className="text-center">
                <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
                <p className="text-sm text-slate-400">Fetching data and running simulation…</p>
                <p className="mt-1 text-xs text-slate-600">Usually 4-10 seconds</p>
              </div>
            </div>
          )}

          {!results && !loading && (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#0d1f2d]">
              <p className="text-sm text-slate-600">Configure inputs and click Run Backtest</p>
            </div>
          )}

          {results && s && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                <Metric label="Trades"        value={s.total_trades} sub={`${s.wins}W · ${s.losses}L`} />
                <Metric label="Win Rate"      value={`${s.win_rate}%`}
                  color={s.win_rate >= 70 ? 'text-emerald-400' : s.win_rate >= 55 ? 'text-amber-400' : 'text-rose-400'} />
                <Metric label="Profit Factor" value={s.profit_factor}
                  color={s.profit_factor >= 1.5 ? 'text-emerald-400' : 'text-slate-300'} />
                <Metric label="Net Profit"    value={fmtDollar(s.net_profit)}
                  color={s.net_profit >= 0 ? 'text-emerald-400' : 'text-rose-400'} sub={`Avg ${fmtDollar(s.avg_pnl)}/trade`} />
                <Metric label="Max Drawdown"  value={fmtDollar(s.max_drawdown)} color="text-rose-400" />
                <Metric label="Sharpe Ratio"  value={s.sharpe_ratio}
                  color={s.sharpe_ratio >= 1.5 ? 'text-emerald-400' : 'text-slate-300'} sub={`Avg credit $${s.avg_credit}`} />
              </div>

              {/* Equity curve + Donut */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_200px]">
                <div className="rounded-2xl border border-white/10 bg-[#0d1f2d] p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Equity Curve</p>
                  <EquityCurve data={results.equity_curve} />
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#0d1f2d] p-4">
                  <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-slate-500">Trade Outcomes</p>
                  <DonutChart wins={s.wins} losses={s.losses} />
                  <div className="mt-3 space-y-1 text-xs">
                    <div className="flex justify-between text-emerald-400"><span>Avg Win</span><span>{fmtDollar(s.avg_win_pnl)}</span></div>
                    <div className="flex justify-between text-rose-400"><span>Avg Loss</span><span>{fmtDollar(s.avg_loss_pnl)}</span></div>
                    <div className="flex justify-between text-amber-400"><span>Max Consec L</span><span>{s.consecutive_losses}</span></div>
                  </div>
                </div>
              </div>

              {/* Monthly bars + VIX table */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
                <div className="rounded-2xl border border-white/10 bg-[#0d1f2d] p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Monthly P&amp;L</p>
                  <MonthlyBars data={results.monthly_perf} />
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#0d1f2d] p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">VIX Regime Performance</p>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-500">
                        <th className="pb-1.5 text-left">VIX</th>
                        <th className="pb-1.5 text-right">Trades</th>
                        <th className="pb-1.5 text-right">Win %</th>
                        <th className="pb-1.5 text-right">P&amp;L</th>
                        <th className="pb-1.5 text-right">Avg Cr</th>
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
                            <td className={`py-1.5 text-right ${v.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {fmtDollar(v.pnl)}
                            </td>
                            <td className="py-1.5 text-right text-slate-400">${v.avg_credit}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Exit reason breakdown */}
                  <div className="mt-4 border-t border-white/10 pt-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Exit Reasons</p>
                    <div className="space-y-1">
                      {Object.entries(s.exit_reasons || {}).map(([reason, count]) => {
                        const cfg = EXIT_COLORS[reason] ?? { bg:'bg-white/5', text:'text-slate-400', label: reason };
                        const pct = ((count / s.total_trades) * 100).toFixed(0);
                        return (
                          <div key={reason} className="flex items-center gap-2">
                            <div className="w-28 flex-shrink-0">
                              <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                            </div>
                            <div className="flex-1 h-1.5 rounded-full bg-white/5">
                              <div className={`h-full rounded-full ${cfg.bg.replace('15','40')}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-8 text-right text-[10px] text-slate-500">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Trade log */}
              <div className="rounded-2xl border border-white/10 bg-[#0d1f2d]">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Trade Log</p>
                  <span className="text-xs text-slate-600">Showing last {results.trades.length} of {s.total_trades}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-slate-600">
                        <th className="px-3 py-2 text-left">Entry</th>
                        <th className="px-3 py-2 text-left">Exit</th>
                        <th className="px-3 py-2 text-right">SPX Entry</th>
                        <th className="px-3 py-2 text-right">VIX</th>
                        <th className="px-3 py-2 text-right">Short</th>
                        <th className="px-3 py-2 text-right">Long</th>
                        <th className="px-3 py-2 text-right">DTE</th>
                        <th className="px-3 py-2 text-right">Credit</th>
                        <th className="px-3 py-2 text-right">P&amp;L</th>
                        <th className="px-3 py-2 text-left">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...results.trades].reverse().map((t, i) => {
                        const cfg = EXIT_COLORS[t.exit_reason] ?? { bg:'bg-white/5', text:'text-slate-400', label: t.exit_reason };
                        return (
                          <tr key={i} className={`border-b border-white/[0.04] ${t.win ? '' : 'bg-rose-500/[0.03]'}`}>
                            <td className="px-3 py-1.5 font-mono text-slate-300">{t.entry_date}</td>
                            <td className="px-3 py-1.5 font-mono text-slate-500">{t.exit_date}</td>
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
                              <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
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
