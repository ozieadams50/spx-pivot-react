import { useState } from 'react';

const ACCENTS = {
  violet: {
    border: 'border-violet-500/25',
    bg: 'bg-violet-500/5',
    pill: 'bg-violet-500/10 border-violet-500/20 text-[var(--c-violet)]',
    num: 'bg-violet-500/15 border-violet-500/30 text-[var(--c-violet)]',
    numHover: 'hover:bg-violet-500/30 hover:border-violet-500/60',
    restore: 'border-violet-500/20 text-violet-500/70 hover:text-[var(--c-violet)] hover:border-violet-500/40',
    glow: 'rgba(139, 92, 246, 0.55)',
  },
  cyan: {
    border: 'border-cyan-500/25',
    bg: 'bg-cyan-500/5',
    pill: 'bg-cyan-500/10 border-cyan-500/20 text-[var(--c-cyan)]',
    num: 'bg-cyan-500/15 border-cyan-500/30 text-[var(--c-cyan)]',
    numHover: 'hover:bg-cyan-500/30 hover:border-cyan-500/60',
    restore: 'border-cyan-500/20 text-cyan-500/70 hover:text-[var(--c-cyan)] hover:border-cyan-500/40',
    glow: 'rgba(6, 182, 212, 0.55)',
  },
  amber: {
    border: 'border-amber-500/25',
    bg: 'bg-amber-500/5',
    pill: 'bg-amber-500/10 border-amber-500/20 text-[var(--c-amber)]',
    num: 'bg-amber-500/15 border-amber-500/30 text-[var(--c-amber)]',
    numHover: 'hover:bg-amber-500/30 hover:border-amber-500/60',
    restore: 'border-amber-500/20 text-amber-500/70 hover:text-[var(--c-amber)] hover:border-amber-500/40',
    glow: 'rgba(245, 158, 11, 0.55)',
  },
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

export default function PageGuide({ guideKey, title, description, steps, accent = 'violet' }) {
  const storageKey = `pg-v1-${guideKey}`;
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(storageKey) === '1');

  const C = ACCENTS[accent] ?? ACCENTS.violet;

  if (dismissed) {
    return (
      <div className="mb-5 flex justify-end">
        <button
          onClick={() => { localStorage.removeItem(storageKey); setDismissed(false); }}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${C.restore}`}
        >
          <span className="font-bold">?</span> How to use this page
        </button>
      </div>
    );
  }

  return (
    <div className={`mb-6 rounded-2xl border ${C.border} ${C.bg} px-5 py-4`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${C.pill}`}>
            How to use this page
          </span>
          <h3 className="mt-2 text-sm font-semibold text-[var(--c-text-primary)]">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-[var(--c-text-muted)] leading-relaxed">{description}</p>
          )}
          {steps?.length > 0 && (
            <ol className="mt-3 space-y-2.5">
              {steps.map((step, i) => {
                const text     = typeof step === 'string' ? step : step.text;
                const targetId = typeof step === 'string' ? null : step.targetId;
                return (
                  <li
                    key={i}
                    className="flex items-start gap-3"
                    onMouseEnter={() => targetId && applyGlow(targetId, C.glow)}
                    onMouseLeave={() => targetId && clearGlow(targetId)}
                  >
                    <button
                      onClick={() => targetId && scrollTo(targetId, C.glow)}
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
        <button
          onClick={() => { localStorage.setItem(storageKey, '1'); setDismissed(true); }}
          className="mt-0.5 shrink-0 text-xs text-[var(--c-text-dimmed)] hover:text-[var(--c-text-secondary)] transition-colors"
          title="Dismiss this guide"
        >
          Got it ✕
        </button>
      </div>
    </div>
  );
}
