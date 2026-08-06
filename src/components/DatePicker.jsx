import { useEffect, useRef, useState } from 'react';

const DAY_LABELS  = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_FMT   = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
const LABEL_FMT   = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d, n) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function sameDay(a, b) {
  return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function stripTime(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function buildMonthGrid(viewMonth) {
  const first     = startOfMonth(viewMonth);
  const firstDow  = first.getDay(); // 0 = Sunday
  const daysInMon = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let day = 1; day <= daysInMon; day++) {
    cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day));
  }
  return cells;
}

// Hand-rolled month-grid date picker (no external date library in this project).
export default function DatePicker({ value, onChange, minDate, maxDate }) {
  const [open, setOpen]           = useState(false);
  const [viewMonth, setViewMonth] = useState(startOfMonth(value ?? new Date()));
  const rootRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (open) setViewMonth(startOfMonth(value ?? new Date()));
  }, [open, value]);

  const min = minDate ? stripTime(minDate) : null;
  const max = maxDate ? stripTime(maxDate) : null;
  const prevDisabled = min && startOfMonth(viewMonth) <= startOfMonth(min);
  const nextDisabled = max && startOfMonth(viewMonth) >= startOfMonth(max);

  const cells = buildMonthGrid(viewMonth);

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-2xl border border-[var(--c-border)] bg-[var(--c-hover)] px-4 py-3 text-sm font-semibold text-[var(--c-text-primary)] transition-colors hover:bg-cyan-500/10 hover:text-cyan-200"
      >
        <span>{value ? LABEL_FMT.format(value) : 'Select date'}</span>
        <span className="text-[var(--c-text-dimmed)]">▾</span>
      </button>

      {open && (
        <div className="absolute left-0 z-40 mt-2 w-72 rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-dropdown)] p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              disabled={prevDisabled}
              onClick={() => setViewMonth((m) => addMonths(m, -1))}
              className="rounded-lg px-2 py-1 text-[var(--c-text-secondary)] hover:bg-[var(--c-hover-strong)] disabled:cursor-not-allowed disabled:opacity-30"
            >
              ‹
            </button>
            <p className="text-sm font-semibold text-[var(--c-text-primary)]">{MONTH_FMT.format(viewMonth)}</p>
            <button
              type="button"
              disabled={nextDisabled}
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              className="rounded-lg px-2 py-1 text-[var(--c-text-secondary)] hover:bg-[var(--c-hover-strong)] disabled:cursor-not-allowed disabled:opacity-30"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {DAY_LABELS.map((d) => (
              <div key={d} className="py-1 text-[10px] uppercase tracking-wide text-[var(--c-text-dimmed)]">{d}</div>
            ))}
            {cells.map((cell, i) => {
              if (!cell) return <div key={i} />;
              const disabled = (min && cell < min) || (max && cell > max);
              const selected = sameDay(cell, value);
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => { onChange(cell); setOpen(false); }}
                  className={`rounded-lg py-1.5 text-xs font-medium transition-colors ${
                    selected
                      ? 'bg-[var(--c-btn-bg)] text-slate-950'
                      : disabled
                        ? 'cursor-not-allowed text-[var(--c-text-faint)] opacity-30'
                        : 'text-[var(--c-text-secondary)] hover:bg-cyan-500/10 hover:text-cyan-200'
                  }`}
                >
                  {cell.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
