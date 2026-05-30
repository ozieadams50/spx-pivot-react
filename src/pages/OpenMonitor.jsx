import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/api';

const CRON_JOBS = [
  { name: 'FadeSetup',        label: 'Fade Daily Setup',      icon: '📋', schedule: '~9:50 AM'      },
  { name: 'FadeEOD',          label: 'Fade EOD Recorder',     icon: '📝', schedule: '4:15 PM'       },
  { name: 'FadeIntraday',     label: 'Fade Intraday Monitor', icon: '🔍', schedule: '9:30-4:00 PM'  },
  { name: 'GEX_DailyRun',     label: 'GEX Daily Run',         icon: '⚡', schedule: '4:35 PM'       },
  { name: 'MorningPivots',    label: 'Morning Pivots',        icon: '📐', schedule: '9:46 AM',       app: 'spx_pivots' },
  { name: 'NightlyUpdate',    label: 'Nightly OHLC',          icon: '🌙', schedule: '12:30 AM',      app: 'spx_pivots' },
  { name: 'SentimentDaily',   label: 'Sentiment Daily',       icon: '📊', schedule: '8:00 AM'       },
  { name: 'SentimentMonthly', label: 'Sentiment Monthly',     icon: '📈', schedule: '5:00 PM'       },
  { name: 'SentimentWeekly',  label: 'Sentiment Weekly',      icon: '📅', schedule: '8:00 AM Mon'   },
  { name: 'EveningSignal',    label: 'SPX Evening Signal',    icon: '🌆', schedule: '3:45 PM',       app: 'spx_pivots' },
  { name: 'PivotFallback',    label: 'SPX Pivot Fallback',    icon: '🛡', schedule: '9:45 AM',       app: 'spx_pivots' },
  { name: 'SignalRecorder',   label: 'SPX Signal Recorder',   icon: '🗂', schedule: '4:15 PM',       app: 'spx_pivots' },
  { name: 'SPX_WebSocket',    label: 'SPX WebSocket',         icon: '📡', schedule: '9:30-4:00 PM',  app: 'spx_pivots' },
];

const LIGHT = {
  green:  { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-300' },
  yellow: { border: 'border-amber-500/30',   bg: 'bg-amber-500/10',   text: 'text-amber-300'   },
  red:    { border: 'border-rose-500/30',    bg: 'bg-rose-500/10',    text: 'text-rose-300'     },
  grey:   { border: 'border-white/10',       bg: 'bg-white/5',        text: 'text-slate-500'    },
};

function dot(light) { return light === 'green' ? '🟢' : light === 'yellow' ? '🟡' : light === 'red' ? '🔴' : '⚫'; }

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
      <div className="flex items-start justify-between">
        <div className="text-xl">{dot(status.light)} {job.icon}</div>
        {job.app === 'spx_pivots' && <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-400">SPX</span>}
      </div>
      <p className="mt-2 text-sm font-bold text-white">{job.label}</p>
      <p className={`mt-0.5 text-xs font-medium ${s.text}`}>Scheduled: {job.schedule}</p>
      <p className={`mt-2 text-xs ${status.light === 'red' ? 'font-semibold text-rose-300' : s.text}`}>{status.status_text}</p>
    </div>
  );
}

function DbCard({ db }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1f2d] p-4">
      <p className="font-semibold text-white">{db.name}</p>
      <p className="mt-1.5 text-xs text-slate-400">Size: <span className="text-slate-200">{db.size_mb?.toFixed(1)} MB</span></p>
      <p className="text-xs text-slate-400">Last write: <span className="text-slate-200">{db.modified}</span></p>
      <p className={`mt-2 text-xs font-medium ${db.today ? 'text-emerald-300' : 'text-amber-300'}`}>
        {db.today ? '🟢 Updated today' : '🟡 Not updated today'}
      </p>
    </div>
  );
}

export default function OpenMonitor() {
  const [data,        setData]       = useState(null);
  const [demo,        setDemo]       = useState(false);
  const [loading,     setLoading]    = useState(true);
  const [refreshedAt, setRefreshedAt] = useState('');
  const [backupsOpen, setBackupsOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiFetch('/system/health');
      setData(d); setDemo(false);
    } catch {
      setDemo(true);
      setData({ disk: { used_gb: 0, free_gb: 0, pct: 0 }, memory: { used_mb: 0, free_mb: 0 }, jobs: {}, databases: [], backups: { count: 0, latest: null, files: [] } });
    }
    setRefreshedAt(new Date().toLocaleTimeString());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading || !data) {
    return <div className="flex h-64 items-center justify-center p-8"><p className="text-sm text-slate-500">Loading system status...</p></div>;
  }

  const bkOk = data.backups.count > 0 && data.backups.latest;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">System Monitor</h1>
            {demo && <span className="rounded-lg bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-300">Demo data</span>}
          </div>
          <p className="mt-1 text-sm text-slate-400">Last refreshed: {refreshedAt}</p>
        </div>
        <button onClick={load} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">
          Refresh
        </button>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-4">
        <MetricCard label="Disk Used"  value={`${(data.disk.used_gb ?? 0).toFixed(1)} GB`} sub={`${(data.disk.free_gb ?? 0).toFixed(1)} GB free`} />
        <MetricCard label="Disk %"     value={`${(data.disk.pct ?? 0).toFixed(0)}%`} />
        <MetricCard label="RAM Used"   value={`${(data.memory.used_mb ?? 0).toFixed(0)} MB`} sub={`${(data.memory.free_mb ?? 0).toFixed(0)} MB free`} />
      </div>

      <div className="mb-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Scheduled Jobs</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CRON_JOBS.map((job) => (
            <JobCard key={job.name} job={job} status={data.jobs[job.name] ?? { light: 'grey', status_text: 'No data' }} />
          ))}
        </div>
      </div>

      {data.databases.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Databases</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {data.databases.map((db) => <DbCard key={db.name} db={db} />)}
          </div>
        </div>
      )}

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
            <button onClick={() => setBackupsOpen((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:text-white">
              <span>Recent backup files</span>
              <span className={`text-xs transition-transform ${backupsOpen ? 'rotate-90' : ''}`}>›</span>
            </button>
            {backupsOpen && (
              <div className="border-t border-white/10 px-4 py-3">
                {data.backups.files.map((f) => <p key={f} className="py-0.5 font-mono text-xs text-slate-400">{f}</p>)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
