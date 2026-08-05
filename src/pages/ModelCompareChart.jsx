import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

const V1_COLOR = 'bg-slate-500';
const V2_COLOR = 'bg-violet-500';

function CompareBarRow({ label, sublabel, v1Pct, v2Pct }) {
  return (
    <div className="py-2.5">
      <div className="mb-1 flex items-baseline justify-between gap-4">
        <span className="text-xs font-semibold text-[var(--c-text-primary)]">{label}</span>
        {sublabel && <span className="text-[10px] text-[var(--c-text-dimmed)]">{sublabel}</span>}
      </div>

      <div className="mb-1 flex items-center gap-2">
        <span className="w-7 shrink-0 text-[10px] font-mono text-[var(--c-text-dimmed)]">v1</span>
        <div className="h-2 flex-1 rounded-full bg-[var(--c-hover-strong)]">
          <div className={`h-2 rounded-full transition-all duration-500 ${V1_COLOR}`}
               style={{ width: `${Math.min(100, Math.max(0, v1Pct ?? 0))}%` }} />
        </div>
        <span className="w-12 shrink-0 text-right text-xs font-mono text-[var(--c-text-secondary)]">
          {v1Pct != null ? `${v1Pct.toFixed(1)}%` : '—'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="w-7 shrink-0 text-[10px] font-mono text-[var(--c-text-dimmed)]">v2</span>
        <div className="h-2 flex-1 rounded-full bg-[var(--c-hover-strong)]">
          <div className={`h-2 rounded-full transition-all duration-500 ${V2_COLOR}`}
               style={{ width: `${Math.min(100, Math.max(0, v2Pct ?? 0))}%` }} />
        </div>
        <span className="w-12 shrink-0 text-right text-xs font-mono text-[var(--c-text-secondary)]">
          {v2Pct != null ? `${v2Pct.toFixed(1)}%` : '—'}
        </span>
      </div>
    </div>
  );
}

function SkeletonBlock() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-xl bg-[var(--c-hover)]" />
      ))}
    </div>
  );
}

export default function ModelCompareChart() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiFetch('/earnings/model-compare')
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--c-text-primary)]">Model Refit Compare</h1>
        <p className="mt-1 text-sm text-[var(--c-text-muted)]">
          v1 (live baseline, unchanged) vs. the latest quarterly v2 refit — win rate against the
          corrected label (3%+ pre-earnings high, at least 2 weeks after entry), measured on each
          model's held-out test signals only. See MODEL_REFIT_PROJECT.md for the full writeup.
        </p>
      </div>

      {error && (
        <div className="mb-6 max-w-3xl rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-[var(--c-rose-strong)]">
          Failed to load comparison: {error}
        </div>
      )}

      {loading ? (
        <div className="max-w-3xl rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-panel)] p-6 shadow-lg">
          <SkeletonBlock />
        </div>
      ) : data && (
        <div className="max-w-3xl space-y-6">

          <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-panel)] p-5 shadow-lg">
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--c-text-dimmed)]">Version</p>
                <p className="font-mono text-[var(--c-text-primary)]">{data.version}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--c-text-dimmed)]">Trained</p>
                <p className="text-[var(--c-text-primary)]">{data.trained_at?.slice(0, 16).replace('T', ' ') ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--c-text-dimmed)]">Train window</p>
                <p className="text-[var(--c-text-primary)]">{data.training_window ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--c-text-dimmed)]">Train / Test N</p>
                <p className="font-mono text-[var(--c-text-primary)]">{data.train_n} / {data.test_n}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-[var(--c-text-muted)]">
              In-sample (train split) reference win% — v1: {data.v1_baseline.train_win_pct ?? '—'}% &nbsp;|&nbsp;
              v2: {data.v2.train_win_pct ?? '—'}%. Out-of-sample (test split) is what actually matters —
              charts below.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-panel)] p-6 shadow-lg">
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">
              Win Rate by Grade (out-of-sample)
            </h2>
            <p className="mb-3 text-[11px] text-[var(--c-text-faint)]">
              A higher grade should win more often than a lower one. v1's grade mix collapsed into
              D most of the time; v2's percentile-based thresholds keep the mix roughly even —
              watch whether win% actually climbs from D up to A+.
            </p>
            <div className="divide-y divide-[var(--c-border)]">
              {['A+', 'A', 'B', 'C', 'D'].map((g) => {
                const v1 = data.v1_baseline.grades.find((x) => x.grade === g);
                const v2 = data.v2.grades.find((x) => x.grade === g);
                if (!v1 && !v2) return null;
                return (
                  <CompareBarRow
                    key={g}
                    label={`Grade ${g}`}
                    sublabel={`v1 n=${v1?.n ?? 0} (${v1?.pct_of_total ?? 0}%)  ·  v2 n=${v2?.n ?? 0} (${v2?.pct_of_total ?? 0}%)`}
                    v1Pct={v1?.win_pct}
                    v2Pct={v2?.win_pct}
                  />
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-panel)] p-6 shadow-lg">
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">
              Win Rate by Score Decile (out-of-sample)
            </h2>
            <p className="mb-3 text-[11px] text-[var(--c-text-faint)]">
              Decile 10 = highest-scored tenth of test signals. A working model should show win%
              rising from decile 1 to decile 10.
            </p>
            <div className="divide-y divide-[var(--c-border)]">
              {data.v2.deciles.map((d) => {
                const v1 = data.v1_baseline.deciles.find((x) => x.decile === d.decile);
                return (
                  <CompareBarRow
                    key={d.decile}
                    label={`Decile ${d.decile}`}
                    sublabel={`n=${d.n}`}
                    v1Pct={v1?.win_pct}
                    v2Pct={d.win_pct}
                  />
                );
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
