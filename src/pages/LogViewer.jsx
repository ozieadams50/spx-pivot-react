import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/api';

const CRON_JOBS = [
  { name: "NightlyUpdate",    label: "Nightly OHLC",          icon: "🌙", schedule: "12:30 AM",      app: "spx_pivots" },
  { name: "SentimentDaily",   label: "Sentiment Daily",       icon: "📊", schedule: "8:00 AM"                       },
  { name: "SentimentWeekly",  label: "Sentiment Weekly",      icon: "📅", schedule: "8:00 AM Mon"                   },
  { name: "HealthWatchdog",   label: "Health Watchdog",       icon: "❤️", schedule: "Every 30 min"                 },
  { name: "SPX_WebSocket",    label: "SPX WebSocket",         icon: "📡", schedule: "9:30-4:00 PM",  app: "spx_pivots" },
  { name: "SPXEarlyPivots",   label: "SPX Early Pivots",      icon: "🎯", schedule: "9:31 AM",        app: "spx_pivots" },
  { name: "PivotGuardian",    label: "Pivot Guardian",        icon: "🛡️", schedule: "Every 10 min", app: "spx_pivots" },
  { name: "MorningPivots",    label: "Morning Pivots",        icon: "📐", schedule: "9:46 AM",        app: "spx_pivots" },
  { name: "FadeSetup",        label: "Fade Daily Setup",      icon: "📋", schedule: "9:50 AM"                       },
  { name: "FadeIntraday",     label: "Fade Intraday Monitor", icon: "🔍", schedule: "10:00-4:00 PM"                 },
  { name: "EveningSignal",    label: "SPX Evening Signal",    icon: "🌆", schedule: "3:45 PM",        app: "spx_pivots" },
  { name: "FadeEOD",          label: "Fade EOD Recorder",     icon: "📝", schedule: "4:15 PM"                       },
  { name: "SignalRecorder",   label: "SPX Signal Recorder",   icon: "🗂", schedule: "4:15 PM",        app: "spx_pivots" },
  { name: "GEX_DailyRun",     label: "GEX Daily Run",         icon: "⚡", schedule: "4:35 PM"                       },
  { name: "EarningsRecovery",    label: "Earnings Recovery",    icon: "📈", schedule: "4:40 PM",   app: "pre_earnings" },
  { name: "EarningsMomentum",   label: "Earnings Momentum",   icon: "🚀", schedule: "4:45 PM",   app: "pre_earnings" },
  { name: "SectorHoldings",     label: "Sector Holdings",     icon: "🗺️", schedule: "6:00 AM",   app: "pre_earnings" },
  { name: "SentimentMonthly", label: "Sentiment Monthly",     icon: "📈", schedule: "5:00 PM"                       },
  { name: "MOC_Stream",       label: "MOC Imbalance Stream",  icon: "💧", schedule: "9:30-4:00 PM"                  },
];

function scheduleToMinutes(schedule) {
  if (!schedule) return 9999;
  if (/every/i.test(schedule)) return 9 * 60;
  const s = schedule.replace('~', '').split(/[–\-]/)[0].trim();
  const m = s.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!m) return 9999;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const mer = (m[3] || (h < 12 ? 'AM' : 'PM')).toUpperCase();
  if (mer === 'PM' && h !== 12) h += 12;
  if (mer === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}

const LIGHT_BADGE = {
  green:  'bg-emerald-500/15 text-emerald-300',
  yellow: 'bg-amber-500/15 text-amber-300',
  red:    'bg-rose-500/15 text-rose-300',
  blue:   'bg-blue-500/15 text-blue-300',
  grey:   'bg-white/5 text-slate-500',
};

function dot(light) { return light === 'green' ? '🟢' : light === 'yellow' ? '🟡' : light === 'red' ? '🔴' : light === 'blue' ? '🔵' : '⚫'; }

export default function LogViewer() {
  const [jobs,         setJobs]        = useState(null);
  const [demo,         setDemo]        = useState(false);
  const [loading,      setLoading]     = useState(true);
  const [selected,     setSelected]    = useState(CRON_JOBS[0].name);
  const [refreshedAt,  setRefreshedAt] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortByTime,   setSortByTime]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiFetch('/system/health');
      setJobs(d.jobs); setDemo(false);
    } catch {
      setJobs({}); setDemo(true);
    }
    setRefreshedAt(new Date().toLocaleTimeString());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const jobDef    = CRON_JOBS.find((j) => j.name === selected);
  const jobStatus = jobs?.[selected] ?? { light: 'grey', status_text: 'No data', last_lines: '' };

  let visibleJobs = CRON_JOBS.filter(j =>
    filterStatus === 'all' || (jobs?.[j.name]?.light ?? 'grey') === filterStatus
  );
  if (sortByTime) visibleJobs = [...visibleJobs].sort((a, b) =>
    scheduleToMinutes(a.schedule) - scheduleToMinutes(b.schedule)
  );

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Log Viewer</h1>
            {demo && <span className="rounded-lg bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-300">Demo data</span>}
          </div>
          <p className="mt-1 text-sm text-slate-400">Last refreshed: {refreshedAt}</p>
        </div>
        <button onClick={load} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <div className="rounded-2xl border border-white/10 bg-[#0d1f2d] p-3">
          {/* Filter + sort controls */}
          <div className="mb-2 flex items-center gap-0.5 px-1">
            {['all','green','blue','yellow','red','grey'].map(v => (
              <button key={v} onClick={() => setFilterStatus(v)}
                className={`rounded px-1.5 py-0.5 text-xs font-medium transition-colors ${
                  filterStatus === v ? 'bg-cyan-500/25 text-cyan-300' : 'text-slate-500 hover:text-slate-300'
                }`}>
                {v === 'all' ? 'All' : dot(v)}
              </button>
            ))}
            <button onClick={() => setSortByTime(v => !v)} title="Sort by scheduled time"
              className={`ml-auto rounded px-1.5 py-0.5 text-xs transition-colors ${
                sortByTime ? 'text-cyan-300' : 'text-slate-500 hover:text-slate-300'
              }`}>
              ⏰
            </button>
          </div>
          <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Jobs {visibleJobs.length < CRON_JOBS.length && <span className="normal-case font-normal text-slate-600">({visibleJobs.length} of {CRON_JOBS.length})</span>}
          </p>
          <div className="space-y-0.5">
            {visibleJobs.map((j) => {
              const s      = jobs?.[j.name] ?? { light: 'grey' };
              const active = selected === j.name;
              return (
                <button key={j.name} onClick={() => setSelected(j.name)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                    active ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}>
                  <span className="text-base leading-none">{dot(s.light)}</span>
                  <span className="flex-1 truncate">{j.label}</span>
                  {j.schedule && <span className="text-[10px] text-slate-600">{j.schedule.replace('~','').split('-')[0].trim()}</span>}
                  {j.app === 'spx_pivots' && <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-400">SPX</span>}
                </button>
              );
            })}
            {visibleJobs.length === 0 && (
              <p className="px-3 py-4 text-xs text-slate-600">No jobs match this filter.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0d1f2d] p-5">
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : (
            <>
              <div className="mb-4 flex items-center gap-3">
                <p className="text-base font-semibold text-white">{jobDef?.label}</p>
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

      <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-white/10 pt-4">
        {[{dot:'🟢',label:'Ran successfully'},{dot:'🔵',label:'Scheduled to run today'},{dot:'🟡',label:'Warning / no log'},{dot:'🔴',label:'Failed'},{dot:'⚫',label:'Not scheduled today'}].map(({dot:d,label}) => (
          <div key={d} className="flex items-center gap-1.5">
            <span className="text-sm leading-none">{d}</span>
            <span className="text-xs text-slate-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
