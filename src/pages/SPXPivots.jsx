import { useState } from 'react';
import TradeModal from '../components/TradeModal';

const TRADE_MODES = ['Monthly Trade', 'Weekly Trade', 'Daily Trade'];

const PIVOT_DATA = {
  'Monthly Trade': {
    title: 'SPX Monthly Pivot',
    period: 'Monthly',
    month: '2026-05-01',
    primaryPivot: '7,234.54',
    sentiment: 'Bullish',
    expiry: 'May 29, 2026',
    pivots: [
      { label: 'R2 Resistance', value: '$7,639.87', tone: 'text-rose-400', key: 'r2' },
      { label: 'R1 Resistance', value: '$7,481.28', tone: 'text-orange-400', key: 'r1' },
      { label: 'Period Open', value: '$7,234.54', tone: 'text-cyan-400', key: 'open' },
      { label: 'S1 Support', value: '$7,044.86', tone: 'text-emerald-400', key: 's1' },
      { label: 'S2 Support', value: '$6,818.65', tone: 'text-green-400', key: 's2' },
    ],
    spreads: [
      { risk: 'Aggressive', level: 'S1 (Support 1)', pivot: '7,044.86', short: '7045', long: '7040', credit: '+$1.45', maxRisk: '$3.55', breakeven: '7,038.55' },
      { risk: 'Moderate', level: 'Mid-S', pivot: '6,931.75', short: '6930', long: '6925', credit: '+$1.40', maxRisk: '$3.60', breakeven: '6,923.60' },
      { risk: 'Conservative', level: 'S2 (Support 2)', pivot: '6,818.65', short: '6820', long: '6815', credit: '+$1.35', maxRisk: '$3.65', breakeven: '6,813.65' },
    ],
    execCards: {
      Aggressive: { risk: 'Higher Risk / Higher Reward', level: 'S1 Pivot @ 7044.86 — 7045 / 7040', buy: 'May 29, 2026 • 7040 Put', sell: 'May 29, 2026 • 7045 Put', credit: '$1.45+', badge: 'border-rose-500/30 bg-rose-500/20 text-rose-300' },
      Moderate: { risk: 'Balanced Risk / Reward', level: 'Mid-S Pivot @ 6931.75 — 6930 / 6925', buy: 'May 29, 2026 • 6925 Put', sell: 'May 29, 2026 • 6930 Put', credit: '$1.40+', badge: 'border-sky-500/30 bg-sky-500/20 text-sky-300' },
      Conservative: { risk: 'Lower Risk / Lower Reward', level: 'S2 Pivot @ 6818.65 — 6820 / 6815', buy: 'May 29, 2026 • 6815 Put', sell: 'May 29, 2026 • 6820 Put', credit: '$1.35+', badge: 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300' },
    },
  },
  'Weekly Trade': {
    title: 'SPX Weekly Pivot',
    period: 'Weekly',
    month: '2026-05-26',
    primaryPivot: '5,802.13',
    sentiment: 'Neutral to Bullish',
    expiry: 'May 29, 2026',
    pivots: [
      { label: 'R2 Resistance', value: '$5,919.40', tone: 'text-rose-400', key: 'r2' },
      { label: 'R1 Resistance', value: '$5,860.77', tone: 'text-orange-400', key: 'r1' },
      { label: 'Period Open', value: '$5,802.13', tone: 'text-cyan-400', key: 'open' },
      { label: 'S1 Support', value: '$5,743.49', tone: 'text-emerald-400', key: 's1' },
      { label: 'S2 Support', value: '$5,684.86', tone: 'text-green-400', key: 's2' },
    ],
    spreads: [
      { risk: 'Aggressive', level: 'S1 (Support 1)', pivot: '5,743.49', short: '5740', long: '5735', credit: '+$1.20', maxRisk: '$3.80', breakeven: '5,733.80' },
      { risk: 'Moderate', level: 'Mid-S', pivot: '5,713.93', short: '5710', long: '5705', credit: '+$1.15', maxRisk: '$3.85', breakeven: '5,703.85' },
      { risk: 'Conservative', level: 'S2 (Support 2)', pivot: '5,684.86', short: '5685', long: '5680', credit: '+$1.10', maxRisk: '$3.90', breakeven: '5,678.90' },
    ],
    execCards: {
      Aggressive: { risk: 'Higher Risk / Higher Reward', level: 'S1 Pivot @ 5743.49 — 5740 / 5735', buy: 'May 29, 2026 • 5735 Put', sell: 'May 29, 2026 • 5740 Put', credit: '$1.20+', badge: 'border-rose-500/30 bg-rose-500/20 text-rose-300' },
      Moderate: { risk: 'Balanced Risk / Reward', level: 'Mid-S Pivot @ 5713.93 — 5710 / 5705', buy: 'May 29, 2026 • 5705 Put', sell: 'May 29, 2026 • 5710 Put', credit: '$1.15+', badge: 'border-sky-500/30 bg-sky-500/20 text-sky-300' },
      Conservative: { risk: 'Lower Risk / Lower Reward', level: 'S2 Pivot @ 5684.86 — 5685 / 5680', buy: 'May 29, 2026 • 5680 Put', sell: 'May 29, 2026 • 5685 Put', credit: '$1.10+', badge: 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300' },
    },
  },
  'Daily Trade': {
    title: 'SPX Daily Pivot',
    period: 'Daily',
    month: '2026-05-27',
    primaryPivot: '5,774.22',
    sentiment: 'Bullish (default)',
    expiry: 'May 27, 2026',
    pivots: [
      { label: 'R2 Resistance', value: '$5,831.45', tone: 'text-rose-400', key: 'r2' },
      { label: 'R1 Resistance', value: '$5,802.84', tone: 'text-orange-400', key: 'r1' },
      { label: 'Period Open', value: '$5,774.22', tone: 'text-cyan-400', key: 'open' },
      { label: 'S1 Support', value: '$5,745.61', tone: 'text-emerald-400', key: 's1' },
      { label: 'S2 Support', value: '$5,716.99', tone: 'text-green-400', key: 's2' },
    ],
    spreads: [
      { risk: 'Aggressive', level: 'S1 (Support 1)', pivot: '5,745.61', short: '5745', long: '5740', credit: '+$0.90', maxRisk: '$4.10', breakeven: '5,739.10' },
      { risk: 'Moderate', level: 'Mid-S', pivot: '5,731.30', short: '5730', long: '5725', credit: '+$0.85', maxRisk: '$4.15', breakeven: '5,724.15' },
      { risk: 'Conservative', level: 'S2 (Support 2)', pivot: '5,716.99', short: '5715', long: '5710', credit: '+$0.80', maxRisk: '$4.20', breakeven: '5,709.20' },
    ],
    execCards: {
      Aggressive: { risk: 'Higher Risk / Higher Reward', level: 'S1 Pivot @ 5745.61 — 5745 / 5740', buy: 'May 27, 2026 • 5740 Put', sell: 'May 27, 2026 • 5745 Put', credit: '$0.90+', badge: 'border-rose-500/30 bg-rose-500/20 text-rose-300' },
      Moderate: { risk: 'Balanced Risk / Reward', level: 'Mid-S Pivot @ 5731.30 — 5730 / 5725', buy: 'May 27, 2026 • 5725 Put', sell: 'May 27, 2026 • 5730 Put', credit: '$0.85+', badge: 'border-sky-500/30 bg-sky-500/20 text-sky-300' },
      Conservative: { risk: 'Lower Risk / Lower Reward', level: 'S2 Pivot @ 5716.99 — 5715 / 5710', buy: 'May 27, 2026 • 5710 Put', sell: 'May 27, 2026 • 5715 Put', credit: '$0.80+', badge: 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300' },
    },
  },
};

const BADGE_STYLES = {
  Aggressive: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  Moderate: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  Conservative: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

const SENTIMENT_STYLES = {
  'Bullish': 'text-emerald-400',
  'Bullish (default)': 'text-emerald-400/70',
  'Neutral to Bullish': 'text-emerald-300',
  'Neutral': 'text-slate-300',
  'Bearish to Neutral': 'text-orange-400',
  'Bearish': 'text-rose-400',
};

export default function SPXPivots() {
  const [tradeMode, setTradeMode] = useState('Monthly Trade');
  const [selectedStrategy, setSelectedStrategy] = useState('Moderate');
  const [showModal, setShowModal] = useState(false);
  const [asOfDate, setAsOfDate] = useState('2026-05-27');

  const data = PIVOT_DATA[tradeMode];
  const activeExec = data.execCards[selectedStrategy];
  const sentimentClass = SENTIMENT_STYLES[data.sentiment] || 'text-slate-300';

  return (
    <div className="mx-auto max-w-7xl p-3 sm:p-4 lg:p-8">
      {/* Dashboard header */}
      <div className="mb-6 flex flex-col gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-[#0a1624] p-4 lg:flex-row lg:items-center lg:justify-between lg:p-8">
        <div>
          <div className="mb-3 inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1 text-xs uppercase tracking-[0.2em] text-cyan-300">
            Institutional SPX Credit Spread Dashboard
          </div>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">SPX Option Trader</h1>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-500">As Of Date</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white focus:border-cyan-500/50 focus:outline-none"
            />
            <div className="flex gap-3">
              <button className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
                Preview
              </button>
              <button className="rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition-colors">
                Update
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Trade mode tabs */}
      <div className="mb-6 grid grid-cols-1 gap-3 rounded-3xl border border-white/10 bg-[#0b1420] p-3 sm:grid-cols-3">
        {TRADE_MODES.map((mode) => (
          <button
            key={mode}
            onClick={() => setTradeMode(mode)}
            className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
              tradeMode === mode
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-cyan-500/10 hover:text-cyan-200'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Main pivot card */}
      <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[#0b1420] shadow-2xl">
        {/* Pivot header */}
        <div className="border-b border-white/10 px-4 py-5 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">{data.title}</h2>
              <p className="mt-2 text-sm text-slate-400">
                {data.period} Levels — period of {data.month}
              </p>
              <p className={`mt-1 text-sm font-medium ${sentimentClass}`}>
                Market Sentiment: {data.sentiment}
              </p>
            </div>

            <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/10 px-6 py-4 text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Primary Pivot</p>
              <p className="mt-1 text-4xl font-bold text-white">{data.primaryPivot}</p>
            </div>
          </div>
        </div>

        {/* Pivot levels grid */}
        <div className="grid grid-cols-1 border-b border-white/10 sm:grid-cols-2 xl:grid-cols-5">
          {data.pivots.map((item) => (
            <div
              key={item.key}
              className="border-b border-white/5 p-5 xl:border-b-0 xl:border-r xl:border-white/5 last:border-r-0"
            >
              <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
              <p className={`mt-3 text-2xl font-bold lg:text-3xl ${item.tone}`}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* Credit spread subheader */}
        <div className="border-b border-white/10 bg-black/20 px-4 py-4 lg:px-8">
          <div className="flex flex-wrap items-center gap-5 text-sm text-slate-300">
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 font-semibold text-white">
              Bull Put Spreads
            </div>
            <div>
              Expiry: <span className="font-semibold text-emerald-400">{data.expiry}</span>
            </div>
            <div>
              Width: <span className="font-semibold text-white">5 pts</span>
            </div>
          </div>
        </div>

        {/* Bull put spreads table */}
        <div className="p-4 lg:p-8">
          <div className="rounded-[32px] border border-emerald-500/10 bg-gradient-to-br from-[#07101a] to-[#0a1726] shadow-2xl">
            <div className="flex flex-col gap-5 border-b border-white/10 px-4 py-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <div>
                <h3 className="text-2xl font-bold text-white">Bull Put Spreads</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Structured SPX premium-selling opportunities.
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="self-start rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-colors lg:self-auto"
              >
                ⓘ How to Trade
              </button>
            </div>

            <div className="overflow-x-auto p-4">
              <table className="min-w-full border-collapse overflow-hidden rounded-3xl border border-white/10">
                <thead className="bg-white/5 text-xs uppercase tracking-[0.2em] text-slate-400">
                  <tr>
                    <th className="px-4 py-4 text-left">Risk</th>
                    <th className="px-4 py-4 text-left">Level</th>
                    <th className="px-4 py-4 text-right">Pivot</th>
                    <th className="px-4 py-4 text-right">Short Put</th>
                    <th className="px-4 py-4 text-right">Long Put</th>
                    <th className="px-4 py-4 text-right">Net Credit</th>
                    <th className="px-4 py-4 text-right">Max Risk</th>
                    <th className="px-4 py-4 text-right">Breakeven</th>
                  </tr>
                </thead>
                <tbody>
                  {data.spreads.map((row) => (
                    <tr
                      key={row.risk}
                      onClick={() => setSelectedStrategy(row.risk)}
                      className={`border-t border-white/5 text-slate-300 cursor-pointer transition-colors hover:bg-white/5 ${
                        selectedStrategy === row.risk ? 'bg-white/[0.03]' : ''
                      }`}
                    >
                      <td className="px-4 py-4">
                        <div
                          className={`inline-flex rounded-xl border px-3 py-1 text-sm font-semibold ${BADGE_STYLES[row.risk]}`}
                        >
                          {row.risk}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-300">{row.level}</td>
                      <td className="px-4 py-4 text-right font-mono">{row.pivot}</td>
                      <td className="px-4 py-4 text-right font-mono font-semibold text-white">{row.short}</td>
                      <td className="px-4 py-4 text-right font-mono text-slate-400">{row.long}</td>
                      <td className="px-4 py-4 text-right font-mono text-emerald-400 font-semibold">{row.credit}</td>
                      <td className="px-4 py-4 text-right font-mono text-rose-400">{row.maxRisk}</td>
                      <td className="px-4 py-4 text-right font-mono text-slate-400">{row.breakeven}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <TradeModal
          selectedStrategy={selectedStrategy}
          setSelectedStrategy={setSelectedStrategy}
          execCards={data.execCards}
          activeStrategy={activeExec}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
