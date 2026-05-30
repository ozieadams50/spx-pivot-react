import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/api';

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
  { name: 'PivotFallback',    label: 'SPX Pivot Fallback',    icon: '🛡', app: 'spx_pivots' },
  { name: 'SignalRecorder',   label: 'SPX Signal Recorder',   icon: '🗂', app: 'spx_pivots' },
  { name: 'SPX_WebSocket',    label: 'SPX WebSocket',         icon: '📡', app: 'spx_pivots' },
];

const LIGHT_BADGE = {
  green:  'bg-emerald-500/15 text-emerald-300',
  yellow: 'bg-amber-500/15 text-amber-300',
  red:    'bg-rose-500/15 text-rose-300',
  grey:   'bg-white/5 text-slate-500',
};

function dot(light) { return light === 'green' ? '🟢' : light === 'yellow' ? '🟡' : light === 'red' ? '🔴' : '⚫'; }

export default function LogViewer() {
  const [jobs,        setJobs]        = useState(null);
  const [demo,        setDemo]        = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState(CRON_JOBS[0].name);
  const [refreshedAt, setRefreshedAt] = useState('');

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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
        <div className="rounded-2xl border border-white/10 bg-[#0d1f2d] p-3">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Jobs</p>
          <div className="space-y-0.5">
            {CRON_JOBS.map((j) => {
              const s      = jobs?.[j.name] ?? { light: 'grey' };
              const active = selected === j.name;
              return (
                <button key={j.name} onClick={() => setSelected(j.name)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                    active ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}>
                  <span className="text-base leading-none">{dot(s.light)}</span>
                  <span className="flex-1 truncate">{j.label}</span>
                  {j.app === 'spx_pivots' && <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-400">SPX</span>}
                </button>
              );
            })}
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
        {[{dot:'🟢',label:'Ran successfully'},{dot:'🟡',label:'Warning / no log'},{dot:'🔴',label:'Failed'},{dot:'⚫',label:'Not scheduled today'}].map(({dot:d,label}) => (
          <div key={d} className="flex items-center gap-1.5">
            <span className="text-sm leading-none">{d}</span>
            <span className="text-xs text-slate-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
