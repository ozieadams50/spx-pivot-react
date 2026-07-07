import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../lib/api';

const ET_FMT = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', {
    timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

const PCT = (v) => v == null ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;
const USD = (v) => v == null ? '—' : `$${v.toFixed(2)}`;
const FMT = (v, d = 2) => v == null ? '—' : v.toFixed(d);

function StageCard({ num, label, met, children }) {
  return (
    <div style={{
      background: met ? '#0d2e1a' : '#1a1a2e',
      border: `1px solid ${met ? '#22c55e' : '#334155'}`,
      borderRadius: 10, padding: '14px 18px', flex: 1, minWidth: 200,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{
          background: met ? '#22c55e' : '#475569',
          color: '#fff', borderRadius: 99, fontSize: 11, fontWeight: 700,
          padding: '2px 8px',
        }}>Stage {num}</span>
        <span style={{ color: met ? '#86efac' : '#94a3b8', fontWeight: 600, fontSize: 13 }}>{label}</span>
        <span style={{ marginLeft: 'auto', fontSize: 18 }}>{met ? '✅' : '⬜'}</span>
      </div>
      <div style={{ color: '#cbd5e1', fontSize: 13 }}>{children}</div>
    </div>
  );
}

function LiveConditions() {
  const [cond, setCond] = useState(null);
  const [err, setErr]   = useState(null);

  const load = useCallback(() => {
    apiFetch('/cp/vix/conditions')
      .then(setCond)
      .catch((e) => setErr(e.message));
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  if (err) return <div style={{ color: '#f87171', fontSize: 13 }}>{err}</div>;
  if (!cond) return <div style={{ color: '#64748b', fontSize: 13 }}>Loading conditions…</div>;

  const { stage_1: s1, stage_2: s2, stage_3: s3, all_met } = cond;

  return (
    <div>
      {all_met && (
        <div style={{
          background: '#14532d', border: '1px solid #22c55e', borderRadius: 10,
          padding: '14px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 22 }}>🚨</span>
          <div>
            <div style={{ color: '#4ade80', fontWeight: 700, fontSize: 15 }}>SCENARIO 1 ACTIVE — BUY SPX CALLS</div>
            <div style={{ color: '#86efac', fontSize: 13 }}>All 3 stages confirmed. Check ntfy / email for entry details.</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <StageCard num={1} label="GEX Anticipation" met={s1.met}>
          <div>GEX Ratio: <strong style={{ color: s1.met ? '#4ade80' : '#f87171' }}>{FMT(s1.gex, 3)}</strong></div>
          <div style={{ color: '#64748b', fontSize: 12 }}>Need &lt; 0.50 (negative gamma)</div>
        </StageCard>

        <StageCard num={2} label="Straddle Surge" met={s2.met}>
          <div>Change: <strong style={{ color: s2.met ? '#4ade80' : '#94a3b8' }}>{PCT(s2.straddle_pct)}</strong></div>
          {s2.straddle_now && <div style={{ fontSize: 12, color: '#94a3b8' }}>{USD(s2.straddle_prior)} → {USD(s2.straddle_now)}</div>}
          <div style={{ color: '#64748b', fontSize: 12 }}>Need &gt;+15% in 5 min</div>
        </StageCard>

        <StageCard num={3} label="VIX Rejection" met={s3.met}>
          {s3.vix != null ? (
            <>
              <div>VIX: <strong>{FMT(s3.vix)}</strong></div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                Upper: {FMT(s3.upper)} | Mean: {FMT(s3.mean)} | Lower: {FMT(s3.lower)}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                Prior touched upper: {s3.prev_touched_upper ? '✓' : '✗'} &nbsp;|&nbsp;
                Now below: {s3.curr_below_upper ? '✓' : '✗'}
              </div>
            </>
          ) : (
            <div style={{ color: '#64748b', fontSize: 12 }}>
              {s3.bars_available} of 22 bars needed
            </div>
          )}
        </StageCard>
      </div>

      <div style={{ color: '#475569', fontSize: 11, marginTop: 8, textAlign: 'right' }}>
        Updated {ET_FMT(cond.as_of)} ET · refreshes every 30s
      </div>
    </div>
  );
}

function TodayAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    apiFetch('/cp/vix/alerts/today')
      .then((d) => { setAlerts(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  if (loading) return <div style={{ color: '#64748b', fontSize: 13 }}>Loading…</div>;

  if (alerts.length === 0) {
    return (
      <div style={{ color: '#475569', fontSize: 14, padding: '20px 0', textAlign: 'center' }}>
        No Scenario 1 alerts today.
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ color: '#64748b', textAlign: 'left', borderBottom: '1px solid #1e293b' }}>
            {['#', 'Time (ET)', 'VIX', 'GEX', 'Strike', 'Entry Ask', 'Exit Price', 'P&L', 'Outcome'].map(h => (
              <th key={h} style={{ padding: '6px 10px', fontWeight: 600 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {alerts.map((a, i) => {
            const win  = a.outcome === 'WIN';
            const loss = a.outcome === 'LOSS';
            return (
              <tr key={a.id} style={{ borderBottom: '1px solid #0f172a', color: '#cbd5e1' }}>
                <td style={{ padding: '8px 10px', color: '#94a3b8' }}>#{i + 1}</td>
                <td style={{ padding: '8px 10px' }}>{ET_FMT(a.fired_at)}</td>
                <td style={{ padding: '8px 10px' }}>{FMT(a.vix_price)}</td>
                <td style={{ padding: '8px 10px', color: a.gex_value <= -0.35 ? '#4ade80' : '#f87171' }}>
                  {FMT(a.gex_value, 3)}
                </td>
                <td style={{ padding: '8px 10px', fontWeight: 600 }}>{a.atm_strike ? a.atm_strike.toFixed(0) : '—'}</td>
                <td style={{ padding: '8px 10px' }}>{USD(a.entry_call_ask)}</td>
                <td style={{ padding: '8px 10px' }}>{USD(a.exit_call_price)}</td>
                <td style={{ padding: '8px 10px', color: win ? '#4ade80' : loss ? '#f87171' : '#94a3b8', fontWeight: 600 }}>
                  {PCT(a.outcome_pct)}
                </td>
                <td style={{ padding: '8px 10px' }}>
                  {a.outcome
                    ? <span style={{ background: win ? '#14532d' : '#450a0a', color: win ? '#4ade80' : '#f87171', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{a.outcome}</span>
                    : <span style={{ color: '#475569', fontSize: 11 }}>Pending 3:45 PM</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function HistoryTable() {
  const [rows, setRows]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/cp/vix/alerts/history?days=30')
      .then((d) => { setRows(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: '#64748b', fontSize: 13 }}>Loading…</div>;

  if (rows.length === 0) {
    return <div style={{ color: '#475569', fontSize: 14, padding: '20px 0', textAlign: 'center' }}>No alerts in the last 30 days.</div>;
  }

  // Summary stats
  const resolved = rows.filter((r) => r.outcome);
  const wins     = resolved.filter((r) => r.outcome === 'WIN').length;
  const losses   = resolved.filter((r) => r.outcome === 'LOSS').length;
  const winRate  = resolved.length ? ((wins / resolved.length) * 100).toFixed(0) : null;
  const avgPnl   = resolved.length
    ? (resolved.reduce((s, r) => s + (r.outcome_pct || 0), 0) / resolved.length).toFixed(1)
    : null;

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
        {[
          { label: 'Total Alerts', val: rows.length, color: '#94a3b8' },
          { label: 'Wins',  val: wins,   color: '#4ade80' },
          { label: 'Losses', val: losses, color: '#f87171' },
          { label: 'Win Rate', val: winRate != null ? `${winRate}%` : '—', color: '#facc15' },
          { label: 'Avg P&L', val: avgPnl != null ? `${avgPnl > 0 ? '+' : ''}${avgPnl}%` : '—', color: Number(avgPnl) >= 0 ? '#4ade80' : '#f87171' },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '10px 16px', minWidth: 100 }}>
            <div style={{ color: '#64748b', fontSize: 11, marginBottom: 2 }}>{label}</div>
            <div style={{ color, fontSize: 20, fontWeight: 700 }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ color: '#64748b', textAlign: 'left', borderBottom: '1px solid #1e293b' }}>
              {['Date', 'Time (ET)', 'VIX', 'GEX', 'Strike', 'Entry Ask', 'Exit Price', 'P&L', 'Outcome'].map(h => (
                <th key={h} style={{ padding: '6px 10px', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => {
              const win  = a.outcome === 'WIN';
              const loss = a.outcome === 'LOSS';
              return (
                <tr key={a.alert_date + a.fired_at} style={{ borderBottom: '1px solid #0f172a', color: '#cbd5e1' }}>
                  <td style={{ padding: '7px 10px', color: '#94a3b8' }}>{a.alert_date}</td>
                  <td style={{ padding: '7px 10px' }}>{ET_FMT(a.fired_at)}</td>
                  <td style={{ padding: '7px 10px' }}>{FMT(a.vix_price)}</td>
                  <td style={{ padding: '7px 10px', color: a.gex_value <= -0.35 ? '#4ade80' : '#f87171' }}>{FMT(a.gex_value, 3)}</td>
                  <td style={{ padding: '7px 10px', fontWeight: 600 }}>{a.atm_strike ? a.atm_strike.toFixed(0) : '—'}</td>
                  <td style={{ padding: '7px 10px' }}>{USD(a.entry_call_ask)}</td>
                  <td style={{ padding: '7px 10px' }}>{USD(a.exit_call_price)}</td>
                  <td style={{ padding: '7px 10px', color: win ? '#4ade80' : loss ? '#f87171' : '#94a3b8', fontWeight: 600 }}>{PCT(a.outcome_pct)}</td>
                  <td style={{ padding: '7px 10px' }}>
                    {a.outcome
                      ? <span style={{ background: win ? '#14532d' : '#450a0a', color: win ? '#4ade80' : '#f87171', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{a.outcome}</span>
                      : <span style={{ color: '#475569', fontSize: 11 }}>Pending</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function VixSignals() {
  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ color: '#e2e8f0', fontSize: 22, fontWeight: 700, margin: 0 }}>VIX BB Signal Monitor</h1>
        <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
          Bullish indicator only — Scenario 1 signals to buy ATM SPX 0DTE Calls when VIX rejects the upper Bollinger Band.
        </p>
      </div>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ color: '#94a3b8', fontSize: 14, fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          Live Conditions
        </h2>
        <LiveConditions />
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ color: '#94a3b8', fontSize: 14, fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          Today's Alerts
        </h2>
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '16px 20px' }}>
          <TodayAlerts />
        </div>
      </section>

      <section>
        <h2 style={{ color: '#94a3b8', fontSize: 14, fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          30-Day Performance
        </h2>
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '16px 20px' }}>
          <HistoryTable />
        </div>
      </section>
    </div>
  );
}
