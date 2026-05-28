import { useState, useEffect, useCallback } from 'react';

const CRON_JOBS = [
  { name: 'NightlyUpdate',    label: 'Nightly OHLC',          icon: '🌙', schedule: '12:30 AM'     },
  { name: 'SentimentDaily',   label: 'Sentiment Daily',       icon: '📊', schedule: '8:00 AM'      },
  { name: 'SentimentWeekly',  label: 'Sentiment Weekly',      icon: '📅', schedule: '8:00 AM Mon'  },
  { name: 'FadeSetup',        label: 'Fade Daily Setup',      icon: '📋', schedule: '9:00 AM'      },
  { name: 'SPX_WebSocket',    label: 'SPX WebSocket',         icon: '📡', schedule: '9:30–4:00 PM' },
  { name: 'FadeIntraday',     label: 'Fade Intraday Monitor', icon: '🔍', schedule: '9:30–4:00 PM' },
  { name: 'PivotFallback',    label: 'SPX Pivot Fallback',    icon: '🛡️', schedule: '9:45 AM'     },
  { name: 'MorningPivots',    label: 'Morning Pivots',        icon: '📐', schedule: '9:46 AM'      },
  { name: 'EveningSignal',    label: 'SPX Evening Signal',    icon: '🌆', schedule: '3:45 PM'      },
  { name: 'FadeEOD',          label: 'Fade EOD Recorder',     icon: '📝', schedule: '4:15 PM'      },
  { name: 'SignalRecorder',   label: 'SPX Signal Recorder',   icon: '🗂️', schedule: '4:15 PM'     },
  { name: 'GEX_DailyRun',     label: 'GEX Daily Run',         icon: '⚡', schedule: '4:35 PM'      },
  { name: 'SentimentMonthly', label: 'Sentiment Monthly',     icon: '📈', schedule: '5:00 PM'      },
];

const MOCK = {
  disk:   { used_gb: 12.3, free_gb: 37.7, pct: 25 },
  memory: { used_mb: 1820, free_mb: 228 },
  jobs: {
    NightlyUpdate:    { light: 'green',  status_text: 'Success at 00:31',           last_lines: '[2026-05-28 00:30:01] Starting nightly OHLC fetch...\n[2026-05-28 00:31:14] Fetched 482 bars for SPX\n[2026-05-28 00:31:15] Done.' },
    SentimentDaily:   { light: 'green',  status_text: 'Success at 08:02',           last_lines: '[2026-05-28 08:00:01] Running daily sentiment check...\n[2026-05-28 08:02:03] Sentiment published. Done.' },
    SentimentWeekly:  { light: 'grey',   status_text: 'Not scheduled today',        last_lines: '' },
    FadeSetup:        { light: 'green',  status_text: 'Success at 09:01',           last_lines: '[2026-05-28 09:00:02] Building fade setup...\n[2026-05-28 09:01:10] Setup complete. 3 levels identified.' },
    SPX_WebSocket:    { light: 'green',  status_text: 'Completed normally',         last_lines: '[2026-05-28 09:30:00] WebSocket connected.\n[2026-05-28 16:00:02] Market closed. Disconnecting.\n[2026-05-28 16:00:03] Done.' },
    FadeIntraday:     { light: 'green',  status_text: 'Completed normally',         last_lines: '[2026-05-28 09:30:01] Intraday monitor started.\n[2026-05-28 16:00:01] Session ended normally.' },
    PivotFallback:    { light: 'green',  status_text: 'Success at 09:47',           last_lines: '[2026-05-28 09:45:00] Checking pivot fallback...\n[2026-05-28 09:47:12] Pivots confirmed. No fallback needed.' },
    MorningPivots:    { light: 'green',  status_text: 'Success at 09:48',           last_lines: '[2026-05-28 09:46:00] Morning pivot calculation starting...\n[2026-05-28 09:48:05] Published to 3 subscribers.' },
    EveningSignal:    { light: 'green',  status_text: 'Success at 15:46',           last_lines: '[2026-05-28 15:45:00] Generating evening signal...\n[2026-05-28 15:46:22] Signal sent.' },
    FadeEOD:          { light: 'green',  status_text: 'Success at 16:17',           last_lines: '[2026-05-28 16:15:01] Recording EOD fade data...\n[2026-05-28 16:17:44] Recorded 8 fade events.' },
    SignalRecorder:   { light: 'green',  status_text: 'Success at 16:16',           last_lines: '[2026-05-28 16:15:00] Recording signals...\n[2026-05-28 16:16:33] 12 signals recorded.' },
    GEX_DailyRun:     { light: 'yellow', status_text: 'No log found for today',     last_lines: '' },
    SentimentMonthly: { light: 'grey',   status_text: 'Not scheduled today',        last_lines: '' },
  },
  databases: [
    { name: 'ohlc_data.db',    size_mb: 48.2, modified: '2026-05-28 00:31', today: true  },
    { name: 'spx_pivots.db',   size_mb: 2.4,  modified: '2026-05-28 09:48', today: true  },
    { name: 'fade_monitor.db', size_mb: 5.1,  modified: '2026-05-28 16:17', today: true  },
  ],
  backups: {
    count: 7,
    latest: '2026-05-28',
    files: [
      'backup_2026-05-28.tar.gz',
      'backup_2026-05-27.tar.gz',
      'backup_2026-05-26.tar.gz',
      'backup_2026-05-25.tar.gz',
      'backup_2026-05-24.tar.gz',
    ],
  },
};

const LIGHT = {
  green:  { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-300', dot: '🟢', badge: 'bg-emerald-500/15 text-emerald-300' },
  yellow: { border: 'border-amber-500/30',   bg: 'bg-amber-500/10',   text: 'text-amber-300',   dot: '🟡', badge: 'bg-amber-500/15 text-amber-300'   },
  red:    { border: 'border-rose-500/30',    bg: 'bg-rose-500/10',    text: 'text-rose-300',     dot: '🔴', badge: 'bg-rose-500/15 text-rose-300'     },
  grey:   { border: 'border-white/10',       bg: 'bg-white/5',        text: 'text-slate-500',    dot: '⚫', badge: 'bg-white/5 text-slate-500'        },
};

function MetricCard({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1f2d] p-4">
      <p className="text-xs font-medium uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-1.5 text-2xl font-bold text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function JobCard({ job, status }) {
  const s = LIGHT[status.light] ?? LIGHT.grey;
  return (
    <div className={`rounded-2xl border p-4 ${s.border} ${s.bg}`}>
      <div className="text-xl">{status.light === 'red' ? '🔴' : status.light === 'yellow' ? '🟡' : status.light === 'green' ? '🟢' : '⚫'} {job.icon}</div>
      <p className="mt-2 text-sm font-bold text-white">{job.label}</p>
      <p className={`mt-0.5 text-xs font-medium ${s.text}`}>Scheduled: {job.schedule}</p>
      <p className={`mt-2 text-xs ${status.light === 'red' ? 'font-semibold text-rose-300' : s.text}`}>
        {status.status_text}
      </p>
    </div>
  );
}

function DbCard({ db }) {
  const ok = db.today;
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1f2d] p-4">
      <p className="font-semibold text-white">{db.name}</p>
      <p className="mt-1.5 text-xs text-slate-400">Size: <span className="text-slate-200">{db.size_mb.toFixed(1)} MB</span></p>
      <p className="text-xs text-slate-400">Last write: <span className="text-slate-200">{db.modified}</span></p>
      <p className={`mt-2 text-xs font-medium ${ok ? 'text-emerald-300' : 'text-amber-300'}`}>
        {ok ? '🟢 Updated today' : '🟡 Not updated today'}
      </p>
    </div>
  );
}

async function fetchHealth() {
  try {
    const res = await fetch('/api/system/health', { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error('non-200');
    return { data: await res.json(), demo: false };
  } catch {
    return { data: MOCK, demo: true };
  }
}

export default function OpenMonitor() {
  const [data,         setData]        = useState(null);
  const [demo,         setDemo]        = useState(false);
  const [loading,      setLoading]     = useState(true);
  const [refreshedAt,  setRefreshedAt] = useState('');
  const [backupsOpen,  setBackupsOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: d, demo: dm } = await fetchHealth();
    setData(d);
    setDemo(dm);
    setRefreshedAt(new Date().toLocaleTimeString());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading || !data) {
    return (
      <div className="flex h-64 items-center justify-center p-8">
        <p className="text-sm text-slate-500">Loading system status…</p>
      </div>
    );
  }

  const bkOk = data.backups.count > 0 && data.backups.latest;

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">System Monitor</h1>
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

      {/* System Metrics */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <MetricCard
          label="Disk Used"
          value={`${data.disk.used_gb.toFixed(1)} GB`}
          sub={`${data.disk.free_gb.toFixed(1)} GB free`}
        />
        <MetricCard
          label="Disk %"
          value={`${data.disk.pct.toFixed(0)}%`}
        />
        <MetricCard
          label="RAM Used"
          value={`${data.memory.used_mb.toFixed(0)} MB`}
          sub={`${data.memory.free_mb.toFixed(0)} MB free`}
        />
      </div>

      {/* Scheduled Jobs */}
      <div className="mb-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Scheduled Jobs</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CRON_JOBS.map((job) => (
            <JobCard key={job.name} job={job} status={data.jobs[job.name] ?? { light: 'grey', status_text: 'No data' }} />
          ))}
        </div>
      </div>

      {/* Databases */}
      <div className="mb-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Databases</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {data.databases.map((db) => (
            <DbCard key={db.name} db={db} />
          ))}
        </div>
      </div>

      {/* Backups */}
      <div className="mb-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Backups</h2>
        <div className="grid grid-cols-3 gap-4">
          <MetricCard label="Backup Files" value={data.backups.count} />
          <MetricCard label="Latest Backup" value={data.backups.latest ?? 'None'} />
          <div className="flex items-center rounded-2xl border border-white/10 bg-[#0d1f2d] p-4">
            <p className={`text-sm font-semibold ${bkOk ? 'text-emerald-300' : 'text-rose-300'}`}>
              {bkOk ? '🟢 Backups running' : '🔴 No backups found'}
            </p>
          </div>
        </div>

        {data.backups.files?.length > 0 && (
          <div className="mt-3 rounded-2xl border border-white/10 bg-[#0d1f2d]">
            <button
              onClick={() => setBackupsOpen((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              <span>Recent backup files</span>
              <span className={`text-xs transition-transform ${backupsOpen ? 'rotate-90' : ''}`}>›</span>
            </button>
            {backupsOpen && (
              <div className="border-t border-white/10 px-4 py-3">
                {data.backups.files.map((f) => (
                  <p key={f} className="py-0.5 font-mono text-xs text-slate-400">{f}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
