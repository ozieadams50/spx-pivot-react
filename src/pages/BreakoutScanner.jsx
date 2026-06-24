import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || '';

function StatCard({ label, value, sub }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 8, padding: '14px 18px', minWidth: 130, textAlign: 'center' }}>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function WinBar({ wins, losses }) {
  const total = wins + losses;
  if (!total) return null;
  const pct = Math.round(wins / total * 100);
  return (
    <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', background: '#ef4444', width: '100%' }}>
      <div style={{ width: `${pct}%`, background: '#22c55e' }} />
    </div>
  );
}

export default function BreakoutScanner() {
  const { token } = useAuth();
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [alertTotal, setAlertTotal] = useState(0);
  const [tab, setTab] = useState('summary');
  const [dirFilter, setDirFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/breakout-scanner/summary`, { headers })
      .then(r => r.json())
      .then(d => { setSummary(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab !== 'alerts') return;
    const params = new URLSearchParams({ limit: '200', offset: '0' });
    if (dirFilter) params.set('direction', dirFilter);
    if (outcomeFilter) params.set('outcome', outcomeFilter);
    fetch(`${API}/breakout-scanner/alerts?${params}`, { headers })
      .then(r => r.json())
      .then(d => { setAlerts(d.alerts || []); setAlertTotal(d.total || 0); });
  }, [tab, dirFilter, outcomeFilter]);

  if (loading) return <div style={{ padding: 24 }}>Loading breakout scanner data...</div>;
  if (!summary) return <div style={{ padding: 24 }}>No breakout scanner data yet. Data collection is in progress.</div>;

  const s = summary;

  return (
    <div style={{ padding: '16px 24px', maxWidth: 1200 }}>
      <h2 style={{ marginBottom: 4 }}>Breakout Scanner</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
        Silent data collection — {s.firstDate || '—'} to {s.lastDate || '—'}
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['summary', 'alerts'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: tab === t ? 'var(--primary)' : 'var(--surface)',
              color: tab === t ? '#fff' : 'var(--text)',
              fontWeight: tab === t ? 600 : 400,
            }}>
            {t === 'summary' ? 'Summary' : `All Alerts (${s.total})`}
          </button>
        ))}
      </div>

      {tab === 'summary' && <SummaryView s={s} />}
      {tab === 'alerts' && (
        <AlertsView
          alerts={alerts} total={alertTotal}
          dirFilter={dirFilter} setDirFilter={setDirFilter}
          outcomeFilter={outcomeFilter} setOutcomeFilter={setOutcomeFilter}
        />
      )}
    </div>
  );
}

function SummaryView({ s }) {
  return (
    <>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <StatCard label="Total Alerts" value={s.total} />
        <StatCard label="Wins" value={s.wins} sub={`${s.winPct}%`} />
        <StatCard label="Losses" value={s.losses} />
        <StatCard label="Avg MFE" value={`${s.avgMfe}%`} sub="max favorable" />
        <StatCard label="Avg MAE" value={`${s.avgMae}%`} sub="max adverse" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <TableSection title="By Direction" rows={s.byDirection} columns={[
          { key: 'direction', label: 'Direction', fmt: v => (v || '').replace(' — Buy Calls', '').replace(' — Buy Puts', '') },
          { key: 'total', label: 'Total' },
          { key: 'wins', label: 'Wins' },
          { key: 'winPct', label: 'Win%', fmt: v => `${v}%` },
          { key: 'avgMfe', label: 'Avg MFE', fmt: v => `${v}%` },
        ]} />

        <TableSection title="By Level Type" rows={s.byLevel} columns={[
          { key: 'level', label: 'Level' },
          { key: 'total', label: 'Total' },
          { key: 'wins', label: 'Wins' },
          { key: 'winPct', label: 'Win%', fmt: v => `${v}%` },
          { key: 'avgMfe', label: 'Avg MFE', fmt: v => `${v}%` },
        ]} />

        <TableSection title="By Score" rows={s.byScore} columns={[
          { key: 'score', label: 'Score' },
          { key: 'total', label: 'Total' },
          { key: 'wins', label: 'Wins' },
          { key: 'winPct', label: 'Win%', fmt: v => `${v}%` },
        ]} />

        <TableSection title="By Sector" rows={s.bySector} columns={[
          { key: 'sector', label: 'Sector' },
          { key: 'total', label: 'Total' },
          { key: 'winPct', label: 'Win%', fmt: v => `${v}%` },
          { key: 'avgMfe', label: 'Avg MFE', fmt: v => `${v}%` },
        ]} />
      </div>

      <TableSection title="Daily Performance (last 30 days)" rows={s.dailyStats} columns={[
        { key: 'date', label: 'Date' },
        { key: 'total', label: 'Alerts' },
        { key: 'wins', label: 'Wins' },
        { key: 'winPct', label: 'Win%', fmt: v => `${v}%` },
      ]} />
    </>
  );
}

function TableSection({ title, rows, columns }) {
  if (!rows || !rows.length) return null;
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 8, padding: 16 }}>
      <h4 style={{ margin: '0 0 10px 0', fontSize: 14 }}>{title}</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {columns.map(c => (
              <th key={c.key} style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {columns.map(c => (
                <td key={c.key} style={{ padding: '4px 8px', borderBottom: '1px solid var(--border)' }}>
                  {c.fmt ? c.fmt(r[c.key]) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AlertsView({ alerts, total, dirFilter, setDirFilter, outcomeFilter, setOutcomeFilter }) {
  return (
    <>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center', fontSize: 13 }}>
        <label>Direction:</label>
        <select value={dirFilter} onChange={e => setDirFilter(e.target.value)}
          style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border)' }}>
          <option value="">All</option>
          <option value="LONG">Long</option>
          <option value="SHORT">Short</option>
        </select>
        <label style={{ marginLeft: 12 }}>Outcome:</label>
        <select value={outcomeFilter} onChange={e => setOutcomeFilter(e.target.value)}
          style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border)' }}>
          <option value="">All</option>
          <option value="win">Wins</option>
          <option value="loss">Losses</option>
        </select>
        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>{total} alerts</span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'var(--surface)' }}>
              {['Date', 'Time', 'Ticker', 'Level', 'Value', 'Touch', 'Pen%', 'Score', 'Direction',
                'RR', 'Close', 'Result', 'MFE%', 'MAE%', 'Sector'].map(h => (
                <th key={h} style={{ padding: '6px 6px', textAlign: 'left', borderBottom: '2px solid var(--border)', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {alerts.map((a, i) => {
              const won = a.won === 1;
              const pending = a.won === null || a.won === undefined;
              return (
                <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--surface-alt, rgba(0,0,0,0.02))' }}>
                  <td style={cell}>{a.date}</td>
                  <td style={cell}>{a.alertedAt}</td>
                  <td style={{ ...cell, fontWeight: 600 }}>{a.ticker}</td>
                  <td style={cell}>{a.levelType}</td>
                  <td style={cell}>{a.levelValue?.toFixed(2)}</td>
                  <td style={cell}>{a.priceAtTouch?.toFixed(2)}</td>
                  <td style={cell}>{a.penetrationPct?.toFixed(2)}%</td>
                  <td style={{ ...cell, fontWeight: 600 }}>{a.totalScore}</td>
                  <td style={cell}>{(a.direction || '').includes('LONG') ? 'LONG' : 'SHORT'}</td>
                  <td style={cell}>{a.rangeRatio?.toFixed(3)}</td>
                  <td style={cell}>{a.finalClose?.toFixed(2) || '—'}</td>
                  <td style={{ ...cell, fontWeight: 600, color: pending ? 'var(--text-muted)' : won ? '#22c55e' : '#ef4444' }}>
                    {pending ? 'PENDING' : won ? 'WIN' : 'LOSS'}
                  </td>
                  <td style={cell}>{a.maxFavorable != null ? `${a.maxFavorable.toFixed(2)}%` : '—'}</td>
                  <td style={cell}>{a.maxAdverse != null ? `${a.maxAdverse.toFixed(2)}%` : '—'}</td>
                  <td style={cell}>{a.sector || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

const cell = { padding: '5px 6px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' };
