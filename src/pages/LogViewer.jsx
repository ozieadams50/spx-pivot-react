import { useState, useEffect, useCallback } from 'react';

const CRON_JOBS = [
  { name: 'FadeSetup',        label: 'Fade Daily Setup',      icon: '📋' },
  { name: 'FadeEOD',          label: 'Fade EOD Recorder',     icon: '📝' },
  { name: 'FadeIntraday',     label: 'Fade Intraday Monitor', icon: '🔍' },
  { name: 'GEX_DailyRun',     label: 'GEX Daily Run',         icon: '⚡' },
  { name: 'MorningPivots',    label: 'Morning Pivots',        icon: '📐', app: 'spx_pivots' },
  { name: 'NightlyUpdate',    label: 'Nightly OHLC',          icon: '🌙', app: 'spx_pivots' },
  { name: 'SentimentDaily',   label: 'Sentiment Daily',       icon: '📊' },
  { name: 'SentimentMonthly', label: 'Sentiment Monthly',     icon: '📈' },
  { name: 'SentimentWeekly',  label: 'Sentiment Weekly',      icon: '📅' },
  { name: 'EveningSignal',    label: 'SPX Evening Signal',    icon: '🌆', app: 'spx_pivots' },
  { name: 'PivotFallback',    label: 'SPX Pivot Fallback',    icon: '🛡️', app: 'spx_pivots' },
  { name: 'SignalRecorder',   label: 'SPX Signal Recorder',   icon: '🗂️', app: 'spx_pivots' },
  { name: 'SPX_WebSocket',    label: 'SPX WebSocket',         icon: '📡', app: 'spx_pivots' },
];

const MOCK_JOBS = {
  NightlyUpdate:    { light: 'green',  status_text: 'Success at 00:31',       last_lines: '[2026-05-28 00:30:01] Starting nightly OHLC fetch...\n[2026-05-28 00:30:44] Fetched 482 bars for SPX\n[2026-05-28 00:31:14] Wrote 482 rows to ohlc_data.db\n[2026-05-28 00:31:15] Done.' },
  SentimentDaily:   { light: 'green',  status_text: 'Success at 08:02',       last_lines: '[2026-05-28 08:00:01] Running daily sentiment check...\n[2026-05-28 08:01:42] Fetched sentiment for Daily pivot\n[2026-05-28 08:02:03] Sentiment published. Done.' },
  SentimentWeekly:  { light: 'grey',   status_text: 'Not scheduled today',    last_lines: '' },
  FadeSetup:        { light: 'green',  status_text: 'Success at 09:01',       last_lines: '[2026-05-28 09:00:02] Building fade setup for 2026-05-28...\n[2026-05-28 09:00:58] 3 fade levels identified\n[2026-05-28 09:01:10] Setup written to fade_monitor.db\n[2026-05-28 09:01:10] Done.' },
  SPX_WebSocket:    { light: 'green',  status_text: 'Completed normally',     last_lines: '[2026-05-28 09:30:00] WebSocket connected to Polygon.io\n[2026-05-28 09:30:01] Subscribed to SPX feed\n[2026-05-28 15:59:58] Received close tick: 5312.45\n[2026-05-28 16:00:02] Market closed. Unsubscribing.\n[2026-05-28 16:00:03] Disconnected. Done.' },
  FadeIntraday:     { light: 'green',  status_text: 'Completed normally',     last_lines: '[2026-05-28 09:30:01] Intraday monitor started.\n[2026-05-28 10:14:22] Fade alert triggered: Level 5285 breached\n[2026-05-28 10:14:23] ntfy alert sent → SPX_Intraday\n[2026-05-28 16:00:01] Session ended normally. 1 alert fired.' },
  PivotFallback:    { light: 'green',  status_text: 'Success at 09:47',       last_lines: '[2026-05-28 09:45:00] Checking pivot fallback...\n[2026-05-28 09:46:31] Morning pivots confirmed present\n[2026-05-28 09:47:12] No fallback needed. Done.' },
  MorningPivots:    { light: 'green',  status_text: 'Success at 09:48',       last_lines: '[2026-05-28 09:46:00] Morning pivot calculation starting...\n[2026-05-28 09:47:55] Weekly pivots: R2=5340 R1=5320 S1=5285 S2=5265\n[2026-05-28 09:48:04] Published to spx_pivots.db\n[2026-05-28 09:48:05] Sent to 3 subscribers. Done.' },
  EveningSignal:    { light: 'green',  status_text: 'Success at 15:46',       last_lines: '[2026-05-28 15:45:00] Generating evening signal...\n[2026-05-28 15:45:48] SPX close: 5312.45 — above S1, below R1\n[2026-05-28 15:46:20] Signal: Neutral to Bullish\n[2026-05-28 15:46:22] Signal sent to SPX_Weekly subscribers. Done.' },
  FadeEOD:          { light: 'green',  status_text: 'Success at 16:17',       last_lines: '[2026-05-28 16:15:01] Recording EOD fade data...\n[2026-05-28 16:16:58] 8 intraday events recorded\n[2026-05-28 16:17:44] Wrote to fade_monitor.db. Done.' },
  SignalRecorder:   { light: 'green',  status_text: 'Success at 16:16',       last_lines: '[2026-05-28 16:15:00] Recording daily signals...\n[2026-05-28 16:16:11] 12 signals recorded for 2026-05-28\n[2026-05-28 16:16:33] Done.' },
  GEX_DailyRun:     { light: 'yellow', status_text: 'No log found for today', last_lines: '' },
  SentimentMonthly: { light: 'grey',   status_text: 'Not scheduled today',    last_lines: '' },
};

const LIGHT_BADGE = {
  green:  'bg-emerald-500/15 text-emerald-300',
  yellow: 'bg-amber-500/15 text-amber-300',
  red:    'bg-rose-500/15 text-rose-300',
  grey:   'bg-white/5 text-slate-500',
};

async function fetchLogs() {
  try {
    const res = await fetch('/api/system/health', { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error('non-200');
    const d = await res.json();
    return { jobs: d.jobs, demo: false };
  } catch {
    return { jobs: MOCK_JOBS, demo: true };
  }
}

export default function LogViewer() {
  const [jobs,        setJobs]       = useState(null);
  const [demo,        setDemo]       = useState(false);
  const [loading,     setLoading]    = useState(true);
  const [selected,    setSelected]   = useState(CRON_JOBS[0].name);
  const [refreshedAt, setRefreshedAt] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { jobs: j, demo: dm } = await fetchLogs();
    setJobs(j);
    setDemo(dm);
    setRefreshedAt(new Date().toLocaleTimeString());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const jobDef    = CRON_JOBS.find((j) => j.name === selected);
  const jobStatus = jobs?.[selected] ?? { light: 'grey', status_text: 'No data', last_lines: '' };

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Log Viewer</h1>
            {demo && (
              <span className="rounded-lg bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-300">
                Demo data
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-400">Last refreshed: {refreshedAt}</p>
        </div>
        <button
          onClick={load}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          ↻ Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
        {/* Job list */}
        <div className="rounded-2xl border border-white/10 bg-[#0d1f2d] p-3">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Jobs</p>
          <div className="space-y-0.5">
            {CRON_JOBS.map((j) => {
              const s     = jobs?.[j.name] ?? { light: 'grey' };
              const dot   = s.light === 'green' ? '🟢' : s.light === 'yellow' ? '🟡' : s.light === 'red' ? '🔴' : '⚫';
              const active = selected === j.name;
              return (
                <button
                  key={j.name}
                  onClick={() => setSelected(j.name)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                    active
                      ? 'bg-cyan-500/15 text-cyan-300'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <span className="text-base leading-none">{dot}</span>
                  <span className="flex-1 truncate">{j.label}</span>
                  {j.app === 'spx_pivots' && (
                    <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-400">SPX</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Log output */}
        <div className="rounded-2xl border border-white/10 bg-[#0d1f2d] p-5">
          {loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : (
            <>
              <div className="mb-4 flex items-center gap-3">
                <p className="text-base font-semibold text-white">
                  {jobDef?.label}
                </p>
                <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${LIGHT_BADGE[jobStatus.light] ?? LIGHT_BADGE.grey}`}>
                  {jobStatus.status_text}
                </span>
              </div>
              <pre className="min-h-[320px] overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-4 font-mono text-xs leading-relaxed text-slate-300 whitespace-pre-wrap">
                {jobStatus.last_lines || 'No log output found for today.'}
              </pre>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-white/10 pt-4">
        {[
          { dot: '🟢', label: 'Ran successfully' },
          { dot: '🟡', label: 'Warning / no log' },
          { dot: '🔴', label: 'Failed' },
          { dot: '⚫', label: 'Not scheduled today' },
        ].map(({ dot, label }) => (
          <div key={dot} className="flex items-center gap-1.5">
            <span className="text-sm leading-none">{dot}</span>
            <span className="text-xs text-slate-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
