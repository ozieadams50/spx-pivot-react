import vspImage from '../assets/VSP.png';

const TONE_MAP = {
  emerald: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300',
  cyan: 'border-cyan-500/20 bg-cyan-500/5 text-cyan-300',
};

function TradeLegCard({ title, contract, tone }) {
  return (
    <div className={`rounded-2xl border p-5 ${TONE_MAP[tone]}`}>
      <p className="mb-2 text-xs uppercase tracking-[0.2em] opacity-80">{title}</p>
      <p className="text-lg font-semibold text-white">{contract}</p>
    </div>
  );
}

function parseLeg(legStr) {
  const [expiryPart, detailPart] = legStr.split('•').map((s) => s.trim());
  const [strike] = (detailPart ?? '').split(' ');
  return { expiry: expiryPart, strike: strike ?? '—' };
}

const GREEK_COLS = ['Bid', 'Ask', 'Delta', 'Theta', 'Gamma'];

function TastyTradeTicket({ buy, sell, strategyImage }) {
  const bto = parseLeg(buy);
  const sto = parseLeg(sell);

  const rows = [
    { ...bto, action: 'B', label: 'Buy to Open',  border: 'border-l-emerald-500', bg: 'bg-emerald-500/[0.06]', badge: 'bg-emerald-500 text-white' },
    { ...sto, action: 'S', label: 'Sell to Open', border: 'border-l-rose-500',    bg: 'bg-rose-500/[0.06]',    badge: 'bg-rose-600 text-white'    },
  ];

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black/50">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">TastyTrade Order Entry</p>
        {strategyImage && (
          <img src={strategyImage} alt="Strategy type" className="h-7 object-contain" />
        )}
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-widest text-slate-600">
            <th className="px-4 py-2 text-left">Strike</th>
            {GREEK_COLS.map((c) => (
              <th key={c} className="px-3 py-2 text-right">{c}</th>
            ))}
            <th className="px-4 py-2 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.action} className={`border-l-4 ${row.border} ${row.bg}`}>
              <td className="px-4 py-3">
                <span className="text-sm font-bold text-white">{row.strike}</span>
                <span className="ml-2 text-[10px] text-slate-500">Put · {row.expiry}</span>
              </td>
              {GREEK_COLS.map((c) => (
                <td key={c} className="px-3 py-3 text-right font-mono text-slate-600">—</td>
              ))}
              <td className="px-4 py-3 text-right">
                <span className={`inline-block rounded px-2.5 py-1 text-xs font-bold tracking-wide ${row.badge}`}>
                  {row.action} 1
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TradeModal({ selectedStrategy, setSelectedStrategy, execCards, activeStrategy, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[95vh] w-full max-w-5xl overflow-auto rounded-[32px] border border-white/10 bg-[#09111d] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <h3 className="text-2xl font-bold text-white sm:text-3xl">How to Trade — Bull Put Spread</h3>
            <p className="mt-2 text-sm text-slate-400">Select a strategy profile to see execution details.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 px-4 py-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">
          <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
            {Object.keys(execCards).map((strategy) => (
              <button
                key={strategy}
                onClick={() => setSelectedStrategy(strategy)}
                className={`mb-4 w-full rounded-2xl border p-5 text-left transition-all hover:opacity-90 ${
                  execCards[strategy].badge
                } ${selectedStrategy === strategy ? 'ring-1 ring-white/20' : 'opacity-70'}`}
              >
                <div className="text-lg font-bold">{strategy}</div>
                <div className="mt-2 text-sm opacity-80">{execCards[strategy].risk}</div>
              </button>
            ))}
          </div>

          <div className="p-6 lg:p-8">
            <div className={`mb-3 inline-flex rounded-xl border px-3 py-1 text-sm font-bold ${activeStrategy.badge}`}>
              {selectedStrategy}
            </div>

            <h4 className="text-xl font-bold text-white sm:text-2xl">{activeStrategy.level}</h4>
            <p className="mt-1 text-sm text-slate-400">{activeStrategy.risk}</p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <TradeLegCard title="Buy to Open (Long Leg)"   contract={activeStrategy.buy}  tone="emerald" />
              <TradeLegCard title="Sell to Open (Short Leg)" contract={activeStrategy.sell} tone="cyan" />
            </div>

            <TastyTradeTicket buy={activeStrategy.buy} sell={activeStrategy.sell} strategyImage={vspImage} />

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Target Net Credit</p>
              <p className="mt-2 text-3xl font-bold text-emerald-400">{activeStrategy.credit}</p>
              <p className="mt-2 text-xs text-slate-500">
                Collect premium upfront. Max profit if SPX stays above short strike at expiry.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
