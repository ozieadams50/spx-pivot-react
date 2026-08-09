import { useState } from 'react';

// "How to Use this Page" always renders in this fixed cyan scheme
// (matching SPX Pivots) regardless of the page's own accent, so it reads
// identically everywhere — see feedback_pageguide_fixed_cyan for why.
const C = {
  pill: 'bg-cyan-500/10 border-cyan-500/20 text-[var(--c-cyan)]',
  num: 'bg-cyan-500/15 border-cyan-500/30 text-[var(--c-cyan)]',
  numHover: 'hover:bg-cyan-500/30 hover:border-cyan-500/60',
  restore: 'border-cyan-500/20 text-cyan-500/70 hover:text-[var(--c-cyan)] hover:border-cyan-500/40',
  glow: 'rgba(6, 182, 212, 0.55)',
};

function applyGlow(id, color) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.transition = 'box-shadow 0.2s ease';
  el.style.boxShadow = `0 0 0 2px ${color}, 0 0 32px ${color.replace('0.55)', '0.18)')}`;
}

function clearGlow(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.boxShadow = '';
}

function scrollTo(id, color) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  applyGlow(id, color);
  setTimeout(() => clearGlow(id), 1800);
}

export default function PageGuide({ guideKey, title, description, steps, extra }) {
  const storageKey = `pg-v1-${guideKey}`;
  const [open, setOpen] = useState(() => localStorage.getItem(storageKey) !== '1');

  const close = () => {
    localStorage.setItem(storageKey, '1');
    setOpen(false);
  };

  const jumpTo = (targetId) => {
    if (!targetId) return;
    close();
    setTimeout(() => scrollTo(targetId, C.glow), 300);
  };

  return (
    <>
      <div className={`mb-5 flex items-center gap-2 ${extra ? 'justify-between' : 'justify-end'}`}>
        {extra}
        <button
          onClick={() => setOpen(true)}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${C.restore}`}
        >
          <span className="font-bold">?</span> How to Use this Page
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-[32px] border border-[var(--c-border)] bg-[var(--c-bg-dropdown)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[var(--c-border)] px-6 py-5">
              <div>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${C.pill}`}>
                  How to Use this Page
                </span>
                <h3 className="mt-2 text-xl font-bold text-[var(--c-text-primary)] sm:text-2xl">{title}</h3>
              </div>
              <button
                onClick={close}
                className="shrink-0 rounded-2xl border border-[var(--c-border)] px-3 py-2 text-sm text-[var(--c-text-secondary)] transition-colors hover:text-[var(--c-text-primary)]"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-5">
              {description && (
                <p className="text-sm leading-relaxed text-[var(--c-text-secondary)]">{description}</p>
              )}
              {steps?.length > 0 && (
                <ol className={`space-y-3 ${description ? 'mt-5' : ''}`}>
                  {steps.map((step, i) => {
                    const text     = typeof step === 'string' ? step : step.text;
                    const targetId = typeof step === 'string' ? null : step.targetId;
                    return (
                      <li key={i} className="flex items-start gap-3">
                        <button
                          onClick={() => jumpTo(targetId)}
                          title={targetId ? 'Click to jump to this section' : undefined}
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition-all ${C.num} ${targetId ? `cursor-pointer ${C.numHover} active:scale-95` : 'cursor-default'}`}
                        >
                          {i + 1}
                        </button>
                        <span className="text-sm text-[var(--c-text-secondary)] leading-relaxed">{text}</span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
