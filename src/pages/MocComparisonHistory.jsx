import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

function fmt(v) {
  if (v == null) return '—';
  return `${v > 0 ? '+' : ''}${Number(v).toLocaleString()}`;
}

function clr(v) {
  if (v == null) return 'text-[var(--c-text-dimmed)]';
  return v > 0 ? 'text-[var(--c-emerald)]' : 'text-[var(--c-rose)]';
}

function dirMatch(a, b) {
  if (a == null || b == null) return null;
  return (a > 0 && b > 0) || (a < 0 && b < 0);
}

export default function MocComparisonHistory() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/moc-comparison/history')
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const withBoth355 = rows.filter(r => r.polygon_spx_355 != null && r.fj_spx_355 != null);
  const directionMatches = withBoth355.filter(r => dirMatch(r.polygon_spx_355, r.fj_spx_355));
  const directionRate = withBoth355.length > 0 ? (directionMatches.length / withBoth355.length * 100).toFixed(0) : '—';

  const variances = withBoth355.map(r => Math.abs(r.polygon_spx_355 - r.fj_spx_355));
  const avgVariance = variances.length > 0 ? Math.round(variances.reduce((a, b) => a + b, 0) / variances.length) : null;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--c-text-primary)]">MOC Comparison History</h1>
        <p className="mt-1 text-sm text-[var(--c-text-muted)]">
          Side-by-side comparison of Polygon NOI vs FinancialJuice MOC values at 3:50 and 3:55 PM ET.
        </p>
      </div>

      {withBoth355.length > 0 && (
        <div className="mb-5 flex gap-6 max-w-2xl">
          <div className="flex-1 rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-panel)] p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">Direction Agreement</p>
            <p className={`mt-1 text-3xl font-bold font-mono ${parseInt(directionRate) >= 80 ? 'text-[var(--c-emerald)]' : parseInt(directionRate) >= 60 ? 'text-[var(--c-amber-strong)]' : 'text-[var(--c-rose)]'}`}>
              {directionRate}%
            </p>
            <p className="mt-1 text-xs text-[var(--c-text-faint)]">{directionMatches.length} / {withBoth355.length} days agreed on buy vs sell</p>
          </div>
          <div className="flex-1 rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-panel)] p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">Avg SPX Variance</p>
            <p className="mt-1 text-3xl font-bold font-mono text-[var(--c-text-primary)]">
              {avgVariance != null ? avgVariance.toLocaleString() : '—'}
            </p>
            <p className="mt-1 text-xs text-[var(--c-text-faint)]">Average absolute difference at 3:55</p>
          </div>
          <div className="flex-1 rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-panel)] p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">Data Points</p>
            <p className="mt-1 text-3xl font-bold font-mono text-[var(--c-text-primary)]">{withBoth355.length}</p>
            <p className="mt-1 text-xs text-[var(--c-text-faint)]">Days with both sources at 3:55</p>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-card)] shadow-lg">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500/30 border-t-cyan-500" />
          </div>
        ) : rows.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-[var(--c-text-dimmed)]">
            No comparison data yet. Enter FinancialJuice values on the Set GEX &amp; MOC page during market hours.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--c-border)] text-[10px] font-semibold uppercase tracking-widest text-[var(--c-text-dimmed)]">
                  <th className="px-4 py-3 text-left" rowSpan={2}>Date</th>
                  <th className="px-4 py-2 text-center border-b border-[var(--c-border-subtle)]" colSpan={2}>3:50 PM SPX</th>
                  <th className="px-4 py-2 text-center border-b border-[var(--c-border-subtle)]" colSpan={2}>3:55 PM SPX</th>
                  <th className="px-4 py-2 text-center border-b border-[var(--c-border-subtle)]" colSpan={2}>3:55 PM Mag7</th>
                  <th className="px-4 py-3 text-center" rowSpan={2}>Direction</th>
                </tr>
                <tr className="border-b border-[var(--c-border)] text-[10px] font-semibold uppercase tracking-widest text-[var(--c-text-faint)]">
                  <th className="px-4 py-2 text-right">Polygon</th>
                  <th className="px-4 py-2 text-right">FJ</th>
                  <th className="px-4 py-2 text-right">Polygon</th>
                  <th className="px-4 py-2 text-right">FJ</th>
                  <th className="px-4 py-2 text-right">Polygon</th>
                  <th className="px-4 py-2 text-right">FJ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const match = dirMatch(r.polygon_spx_355, r.fj_spx_355);
                  return (
                    <tr key={r.date} className="border-b border-[var(--c-border-subtle)] last:border-0 hover:bg-[var(--c-hover)]">
                      <td className="px-4 py-2.5 font-medium text-[var(--c-text-primary)]">{r.date}</td>
                      <td className={`px-4 py-2.5 text-right font-mono ${clr(r.polygon_spx_350)}`}>{fmt(r.polygon_spx_350)}</td>
                      <td className={`px-4 py-2.5 text-right font-mono ${clr(r.fj_spx_350)}`}>{fmt(r.fj_spx_350)}</td>
                      <td className={`px-4 py-2.5 text-right font-mono ${clr(r.polygon_spx_355)}`}>{fmt(r.polygon_spx_355)}</td>
                      <td className={`px-4 py-2.5 text-right font-mono ${clr(r.fj_spx_355)}`}>{fmt(r.fj_spx_355)}</td>
                      <td className={`px-4 py-2.5 text-right font-mono ${clr(r.polygon_mag7_355)}`}>{fmt(r.polygon_mag7_355)}</td>
                      <td className={`px-4 py-2.5 text-right font-mono ${clr(r.fj_mag7_355)}`}>{fmt(r.fj_mag7_355)}</td>
                      <td className="px-4 py-2.5 text-center">
                        {match === true && <span className="rounded-lg bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-[var(--c-emerald)]">MATCH</span>}
                        {match === false && <span className="rounded-lg bg-rose-500/15 px-2 py-0.5 text-xs font-bold text-[var(--c-rose)]">DIFF</span>}
                        {match === null && <span className="text-[var(--c-text-faint)]">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
