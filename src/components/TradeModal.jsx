import vspImage from '../assets/VSP.png';

const TONE_MAP = {
  emerald: 'border-emerald-500/20 bg-emerald-500/5 text-[var(--c-emerald-strong)]',
  cyan: 'border-cyan-500/20 bg-cyan-500/5 text-[var(--c-cyan)]',
};

function TradeLegCard({ title, contract, tone }) {
  return (
    <div className={`rounded-2xl border p-5 ${TONE_MAP[tone]}`}>
      <p className="mb-2 text-xs uppercase tracking-[0.2em] opacity-80">{title}</p>
      <p className="text-lg font-semibold text-[var(--c-text-primary)]">{contract}</p>
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
    { ...bto, action: 'B', label: 'Buy to Open',  border: 'border-l-emerald-500', bg: 'bg-emerald-500/[0.06]', badge: 'bg-emerald-500 text-[var(--c-text-primary)]' },
    { ...sto, action: 'S', label: 'Sell to Open', border: 'border-l-rose-500',    bg: 'bg-rose-500/[0.06]',    badge: 'bg-rose-600 text-[var(--c-text-primary)]'    },
  ];

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--c-border)] bg-black/50">
      <div className="flex items-center justify-between border-b border-[var(--c-border)] px-4 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">TastyTrade Order Entry</p>
        {strategyImage && (
          <img src={strategyImage} alt="Strategy type" className="h-7 object-contain" />
        )}
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-widest text-[var(--c-text-faint)]">
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
                <span className="text-sm font-bold text-[var(--c-text-primary)]">{row.strike}</span>
                <span className="ml-2 text-[10px] text-[var(--c-text-dimmed)]">Put · {row.expiry}</span>
              </td>
              {GREEK_COLS.map((c) => (
                <td key={c} className="px-3 py-3 text-right font-mono text-[var(--c-text-faint)]">—</td>
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

const PREMIUM_KEY = {
  Aggressive:   'bull_put_s1',
  Moderate:     'bull_put_mids',
  Conservative: 'bull_put_s2',
};

export default function TradeModal({ selectedStrategy, setSelectedStrategy, execCards, activeStrategy, premiums, deltaMap, onClose }) {
  const premKey       = PREMIUM_KEY[selectedStrategy];
  const buckets       = premiums?.by_vix_bucket ?? [];
  const currentBucket = premiums?.current_vix_bucket;
  const currentVix    = premiums?.current_vix;
  const recData       = (currentBucket && buckets.find(b => b.vix_range === currentBucket)?.spreads?.[premKey])
                        ?? premiums?.overall?.spreads?.[premKey];
  const targetDelta   = deltaMap?.[selectedStrategy];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[95vh] w-full max-w-5xl overflow-auto rounded-[32px] border border-[var(--c-border)] bg-[var(--c-bg-dropdown)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--c-border)] px-6 py-5">
          <div>
            <h3 className="text-2xl font-bold text-[var(--c-text-primary)] sm:text-3xl">How to Trade — Bull Put Spread</h3>
            <p className="mt-2 text-sm text-[var(--c-text-muted)]">Select a strategy profile to see execution details.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl border border-[var(--c-border)] px-4 py-2 text-[var(--c-text-muted)] hover:bg-[var(--c-hover)] hover:text-[var(--c-text-primary)] transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">
          <div className="border-b border-[var(--c-border)] p-5 lg:border-b-0 lg:border-r">
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

            <h4 className="text-xl font-bold text-[var(--c-text-primary)] sm:text-2xl">{activeStrategy.level}</h4>
            <p className="mt-1 text-sm text-[var(--c-text-muted)]">{activeStrategy.risk}</p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <TradeLegCard title="Buy to Open (Long Leg)"   contract={activeStrategy.buy}  tone="emerald" />
              <TradeLegCard title="Sell to Open (Short Leg)" contract={activeStrategy.sell} tone="cyan" />
            </div>

            <TastyTradeTicket buy={activeStrategy.buy} sell={activeStrategy.sell} strategyImage={vspImage} />

            <div className="mt-6 rounded-2xl border border-[var(--c-border)] bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-text-dimmed)]">Target Net Credit</p>
              <p className="mt-2 text-3xl font-bold text-[var(--c-emerald)]">{activeStrategy.credit}</p>

              {recData && (
                <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--c-emerald)]">
                    Recommended Premium Range
                    {currentVix && <span className="ml-2 font-normal text-[var(--c-emerald)]/60">· VIX {currentVix} ({currentBucket})</span>}
                  </p>
                  <div className="mt-2 flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold tracking-tight text-[var(--c-text-primary)]">
                        ${recData.p25}–${recData.p75}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[var(--c-emerald)]/70">p25–p75 range · 5-wide spread</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-[var(--c-text-dimmed)]">Mean</p>
                      <p className="text-2xl font-bold text-[var(--c-emerald)]">${recData.mean.toFixed(2)}</p>
                    </div>
                  </div>
                  {targetDelta && (
                    <p className="mt-3 border-t border-emerald-500/20 pt-3 text-[10px] text-[var(--c-emerald)]/70">
                      Target Delta: <span className="font-semibold text-[var(--c-emerald)]">{targetDelta}</span> at IV 12–18% — the delta level expected to yield this premium range
                    </p>
                  )}
                </div>
              )}

              <p className="mt-3 text-xs text-[var(--c-text-dimmed)]">
                Collect premium upfront. Max profit if SPX stays above short strike at expiry.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
