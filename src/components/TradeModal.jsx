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
              <TradeLegCard title="Buy to Open (Long Leg)" contract={activeStrategy.buy} tone="emerald" />
              <TradeLegCard title="Sell to Open (Short Leg)" contract={activeStrategy.sell} tone="cyan" />
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Target Net Credit</p>
              <p className="mt-2 text-3xl font-bold text-emerald-400">{activeStrategy.credit}</p>
              <p className="mt-2 text-xs text-slate-500">
                Collect premium upfront. Max profit if SPX stays above short strike at expiry.
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-400">
              <p className="font-semibold text-slate-300">Strategy Summary</p>
              <ul className="mt-3 space-y-2">
                <li>• <span className="text-white">Sell</span> the higher-strike put (short leg) to collect premium</li>
                <li>• <span className="text-white">Buy</span> the lower-strike put (long leg) to define max risk</li>
                <li>• Spread width = 5 points → Max risk = $500 per contract</li>
                <li>• Profit if SPX closes above short put at expiry</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
