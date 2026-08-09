const ACCENTS = {
  violet: {
    pill: 'bg-violet-500/10 border-violet-500/20 text-[var(--c-violet)]',
    num:  'bg-violet-500/15 border-violet-500/30 text-[var(--c-violet)]',
  },
  cyan: {
    pill: 'bg-cyan-500/10 border-cyan-500/20 text-[var(--c-cyan)]',
    num:  'bg-cyan-500/15 border-cyan-500/30 text-[var(--c-cyan)]',
  },
  amber: {
    pill: 'bg-amber-500/10 border-amber-500/20 text-[var(--c-amber)]',
    num:  'bg-amber-500/15 border-amber-500/30 text-[var(--c-amber)]',
  },
  rose: {
    pill: 'bg-rose-500/10 border-rose-500/20 text-[var(--c-rose)]',
    num:  'bg-rose-500/15 border-rose-500/30 text-[var(--c-rose)]',
  },
};

export default function StrategyThesisModal({ onClose, accent = 'violet', title, thesis, ideas }) {
  const C = ACCENTS[accent] ?? ACCENTS.violet;

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
              How to Trade this Strategy
            </span>
            <h3 className="mt-2 text-xl font-bold text-[var(--c-text-primary)] sm:text-2xl">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-2xl border border-[var(--c-border)] px-3 py-2 text-sm text-[var(--c-text-secondary)] transition-colors hover:text-[var(--c-text-primary)]"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">The Idea</h4>
          <p className="mt-2 text-sm leading-relaxed text-[var(--c-text-secondary)]">{thesis}</p>

          <h4 className="mt-6 text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">Trading Ideas</h4>
          <ul className="mt-3 space-y-3">
            {ideas.map((idea, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${C.num}`}>
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed text-[var(--c-text-secondary)]">{idea}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
