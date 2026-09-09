import { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '../lib/api';
import PageGuide from '../components/PageGuide';

const IMPACT_CFG = {
  high:   { label: 'Critical', dot: 'bg-rose-500',   badge: 'border-rose-500/30 bg-rose-500/10 text-[var(--c-rose)]' },
  medium: { label: 'Moderate', dot: 'bg-amber-500',  badge: 'border-amber-500/30 bg-amber-500/10 text-[var(--c-amber)]' },
};

function fmtTime(t) {
  if (!t) return 'All day';
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period} ET`;
}

function fmtDayHeader(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function fmtWeekRange(startIso, endIso) {
  const [sy, sm, sd] = startIso.split('-').map(Number);
  const [ey, em, ed] = endIso.split('-').map(Number);
  const s = new Date(sy, sm - 1, sd);
  const e = new Date(ey, em - 1, ed);
  const sameMonth = sm === em;
  const sFmt = s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const eFmt = e.toLocaleDateString('en-US', sameMonth ? { day: 'numeric' } : { month: 'short', day: 'numeric' });
  return `${sFmt} - ${eFmt}`;
}

function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
}

function EventRow({ ev }) {
  const cfg = IMPACT_CFG[ev.impact] ?? IMPACT_CFG.medium;
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-[var(--c-border-subtle)] px-4 py-3 last:border-b-0">
      <span className={`inline-flex w-20 flex-none items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cfg.badge}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
        {cfg.label}
      </span>
      <span className="w-20 flex-none font-mono text-xs text-[var(--c-text-dimmed)]">{fmtTime(ev.time_et)}</span>
      <span className="min-w-[160px] flex-1 text-sm font-medium text-[var(--c-text-primary)]">{ev.event}</span>
      <div className="flex flex-none gap-4 text-xs">
        <span className="text-[var(--c-text-muted)]">Est <b className="font-mono text-[var(--c-text-secondary)]">{ev.estimate ?? '—'}</b></span>
        <span className="text-[var(--c-text-muted)]">Prior <b className="font-mono text-[var(--c-text-secondary)]">{ev.prev ?? '—'}</b></span>
        <span className="text-[var(--c-text-muted)]">Actual <b className="font-mono text-[var(--c-text-secondary)]">{ev.actual ?? '—'}</b></span>
      </div>
    </div>
  );
}

export default function GovernmentCalendar() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch('/calendars/government')
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const weeks = useMemo(() => {
    if (!data) return [];
    return [0, 1, 2].map((w) => {
      const weekStart = addDays(data.rangeStart, w * 7);
      const weekEnd = addDays(weekStart, 6);
      const byDay = new Map();
      for (const ev of data.events) {
        if (ev.date < weekStart || ev.date > weekEnd) continue;
        if (!byDay.has(ev.date)) byDay.set(ev.date, []);
        byDay.get(ev.date).push(ev);
      }
      const days = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));
      const label = w === 0 ? 'This Week' : w === 1 ? 'Next Week' : 'Week After';
      return { label, weekStart, weekEnd, days };
    });
  }, [data]);

  return (
    <div className="mx-auto max-w-4xl p-3 sm:p-4 lg:p-8">
      <div className="mb-6 rounded-3xl border border-[var(--c-border)] bg-gradient-to-br from-[var(--c-bg-gradient-from)] to-[var(--c-bg-gradient-to)] p-4 lg:p-8">
        <div className="mb-3 inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-cyan)]">
          Government Calendar
        </div>
        <h1 className="text-3xl font-bold text-[var(--c-text-primary)] sm:text-4xl">Government Calendar</h1>
        <p className="mt-2 text-sm text-[var(--c-text-muted)]">
          A rolling 3-week look at U.S. economic reports rated Moderate or Critical impact — the releases most likely to move markets.
        </p>
      </div>

      <PageGuide
        guideKey="government-calendar"
        title="Track upcoming market-moving economic reports."
        description="A rolling 3-week calendar of U.S. government economic releases — only the ones rated Moderate or Critical impact make the list."
        steps={[
          { text: 'Each event shows its scheduled time (Eastern), plus the estimate, prior reading, and actual result once released.', targetId: 'pg-event-list' },
          { text: 'Critical (red) events are the ones with the biggest historical market impact — CPI, jobs reports, Fed decisions. Moderate (orange) still matters, just usually less.', targetId: 'pg-event-list' },
          { text: 'The calendar always shows this week plus the next two — it rolls forward automatically, nothing to reset.', targetId: 'pg-event-list' },
        ]}
      />

      {error && !loading && (
        <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 py-4 text-[var(--c-rose-strong)]">
          Failed to load the calendar: {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-[var(--c-hover)]" />
          ))}
        </div>
      ) : (
        <div id="pg-event-list" className="space-y-6">
          {weeks.map((week) => (
            <div key={week.label} className="overflow-hidden rounded-[28px] border border-[var(--c-border)] bg-[var(--c-bg-card)] shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--c-border)] px-6 py-4">
                <h2 className="text-lg font-bold text-[var(--c-text-primary)]">{week.label}</h2>
                <span className="font-mono text-xs text-[var(--c-text-dimmed)]">{fmtWeekRange(week.weekStart, week.weekEnd)}</span>
              </div>
              {week.days.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-[var(--c-text-faint)]">No Moderate or Critical events scheduled this week.</p>
              ) : (
                week.days.map(([dateIso, events]) => {
                  const isToday = dateIso === data.today;
                  return (
                    <div key={dateIso} className={isToday ? 'bg-violet-500/[0.04]' : ''}>
                      <div className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide ${
                        isToday
                          ? 'border-y border-violet-500/30 bg-violet-500/15 text-[var(--c-violet-strong)]'
                          : 'bg-[var(--c-bg-alt2)] text-[var(--c-text-dimmed)]'
                      }`}>
                        {fmtDayHeader(dateIso)}
                        {isToday && (
                          <span className="rounded-full bg-violet-500 px-2 py-0.5 text-[9px] font-bold tracking-wider text-white">
                            TODAY
                          </span>
                        )}
                      </div>
                      {events.map((ev, i) => <EventRow key={i} ev={ev} />)}
                    </div>
                  );
                })
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
