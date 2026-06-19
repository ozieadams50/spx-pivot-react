import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

function todayISO() { return new Date().toISOString().slice(0, 10); }

export default function SetGexMoc() {
  const [date,     setDate]     = useState(todayISO());
  const [gexRatio, setGexRatio] = useState('');
  const [spxMoc,   setSpxMoc]   = useState('');
  const [mag7Moc,  setMag7Moc]  = useState('');
  const [current,  setCurrent]  = useState(null);
  const [success,  setSuccess]  = useState('');
  const [error,    setError]    = useState('');
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    setCurrent(null); setSuccess(''); setError('');
    apiFetch(`/pivots/moc?date=${date}`)
      .then((data) => {
        setCurrent(data);
        if (data.gex_ratio != null) setGexRatio(String(data.gex_ratio));
        if (data.spx_moc   != null) setSpxMoc(String(data.spx_moc));
        if (data.mag7_moc  != null) setMag7Moc(String(data.mag7_moc));
        else setMag7Moc('');
      })
      .catch(() => {
        setGexRatio(''); setSpxMoc(''); setMag7Moc('');
      });
  }, [date]);

  async function handleSubmit() {
    setError(''); setSuccess('');
    const gex = parseFloat(gexRatio);
    const spx = parseInt(spxMoc, 10);
    if (isNaN(gex) || gex < 0 || gex > 1) { setError('GEX Ratio must be between 0.00 and 1.00.'); return; }
    if (isNaN(spx))                         { setError('SPX MOC must be a valid integer.'); return; }
    const mag7 = mag7Moc.trim() === '' ? null : parseInt(mag7Moc, 10);
    if (mag7Moc.trim() !== '' && isNaN(mag7)) { setError('Mag7 MOC must be a valid integer or left blank.'); return; }

    setSaving(true);
    try {
      await apiFetch('/pivots/moc', {
        method: 'POST',
        body: JSON.stringify({ date, gex_ratio: gex, spx_moc: spx, mag7_moc: mag7 }),
      });
      const data = await apiFetch(`/pivots/moc?date=${date}`);
      setCurrent(data);
      const gexDir = gex >= 0.5 ? 'Positive' : 'Negative';
      const mocDir = spx > 0 ? 'BUY' : 'SELL';
      setSuccess(`Saved: GEX ${gexDir} (${gex.toFixed(2)}) · SPX MOC ${mocDir} ${spx > 0 ? '+' : ''}${spx.toLocaleString()}`);
    } catch (err) {
      setError(err.message ?? 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  const gexVal = parseFloat(gexRatio);
  const gexDir = !isNaN(gexVal) ? (gexVal >= 0.5 ? 'Positive' : 'Negative') : null;
  const spxVal = parseInt(spxMoc, 10);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--c-text-primary)]">Set GEX &amp; MOC</h1>
        <p className="mt-1 text-sm text-[var(--c-text-muted)]">
          Enter today's Gamma Exposure ratio and Market on Close imbalance. These drive the EOD-MOC Signal page.
        </p>
      </div>

      <div className="mb-5 max-w-2xl rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--c-cyan-strong)]">Daily Workflow</p>
        <div className="space-y-2 text-sm text-[var(--c-text-secondary)]">
          <div className="flex gap-3">
            <span className="shrink-0 font-semibold text-[var(--c-text-primary)]">Before 3:50 PM</span>
            <span>Enter the <span className="font-medium text-[var(--c-text-primary)]">GEX Ratio</span> from GEXStream.com. Values below 0.50 = Negative (Trade Day), 0.50 or above = Positive (No Trade).</span>
          </div>
          <div className="flex gap-3">
            <span className="shrink-0 font-semibold text-[var(--c-text-primary)]">At/after 3:55 PM</span>
            <span>Enter the <span className="font-medium text-[var(--c-text-primary)]">SPX MOC</span> and <span className="font-medium text-[var(--c-text-primary)]">Mag7 MOC</span> from FinancialJuice.com. Positive = Buy side, Negative = Sell side.</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-panel)] p-6 shadow-lg">

        <div className="mb-5">
          <label className="mb-1.5 block text-xs font-medium text-[var(--c-text-secondary)]">Date</label>
          <input type="date" value={date} max={todayISO()} min="2025-01-01"
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-page)] px-4 py-2 text-sm text-[var(--c-text-primary)] outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30" />
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--c-text-secondary)]">
              GEX Ratio <span className="text-[var(--c-text-dimmed)]">(0.00 – 1.00)</span>
            </label>
            <input type="number" value={gexRatio} min="0" max="1" step="0.01"
              onChange={(e) => setGexRatio(e.target.value)}
              placeholder="e.g. 0.02"
              className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-page)] px-4 py-2 text-sm text-[var(--c-text-primary)] placeholder-[var(--c-text-faint)] outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30" />
            {gexDir && (
              <p className={`mt-1 text-xs font-medium ${gexDir === 'Positive' ? 'text-[var(--c-emerald)]' : 'text-[var(--c-rose)]'}`}>
                → {gexDir}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--c-text-secondary)]">SPX MOC</label>
            <input type="number" value={spxMoc} step="1"
              onChange={(e) => setSpxMoc(e.target.value)}
              placeholder="e.g. -472"
              className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-page)] px-4 py-2 text-sm text-[var(--c-text-primary)] placeholder-[var(--c-text-faint)] outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30" />
            {!isNaN(spxVal) && spxMoc.trim() !== '' && (
              <p className={`mt-1 text-xs font-medium ${spxVal > 0 ? 'text-[var(--c-emerald)]' : 'text-[var(--c-rose)]'}`}>
                → {spxVal > 0 ? 'BUY' : 'SELL'} {spxVal > 0 ? '+' : ''}{spxVal.toLocaleString()}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--c-text-secondary)]">
              Mag7 MOC <span className="text-[var(--c-text-dimmed)]">(optional)</span>
            </label>
            <input type="number" value={mag7Moc} step="1"
              onChange={(e) => setMag7Moc(e.target.value)}
              placeholder="optional"
              className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-page)] px-4 py-2 text-sm text-[var(--c-text-primary)] placeholder-[var(--c-text-faint)] outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30" />
          </div>
        </div>

        {current && current.gex_ratio != null && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-[var(--c-border)] bg-[var(--c-hover)] px-4 py-2.5 text-sm">
            <span className="text-[var(--c-text-muted)]">Currently stored:</span>
            <span className={`font-medium ${current.gex_ratio >= 0.5 ? 'text-[var(--c-emerald)]' : 'text-[var(--c-rose)]'}`}>
              GEX {current.gex_ratio >= 0.5 ? 'Positive' : 'Negative'} ({current.gex_ratio.toFixed(2)})
            </span>
            <span className="text-[var(--c-text-dimmed)]">·</span>
            <span className={`font-medium ${current.spx_moc > 0 ? 'text-[var(--c-emerald)]' : 'text-[var(--c-rose)]'}`}>
              MOC {current.spx_moc > 0 ? 'BUY' : 'SELL'} {current.spx_moc > 0 ? '+' : ''}{current.spx_moc?.toLocaleString()}
            </span>
          </div>
        )}

        {error   && <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-[var(--c-rose-strong)]">{error}</div>}
        {success && <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-[var(--c-emerald-strong)]">{success}</div>}

        <button onClick={handleSubmit} disabled={saving}
          className="w-full rounded-xl bg-[var(--c-btn-bg)] px-4 py-2.5 text-sm font-semibold text-[var(--c-btn-text)] transition hover:bg-[var(--c-btn-hover)] disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? 'Saving...' : 'Save GEX & MOC'}
        </button>
      </div>
    </div>
  );
}
