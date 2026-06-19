import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const INTERVALS = [
  { v: '1',   l: '1 Min'   },
  { v: '3',   l: '3 Min'   },
  { v: '5',   l: '5 Min'   },
  { v: '15',  l: '15 Min'  },
  { v: '30',  l: '30 Min'  },
  { v: '60',  l: '1 Hour'  },
  { v: '120', l: '2 Hour'  },
  { v: '240', l: '4 Hour'  },
  { v: 'D',   l: 'Daily'   },
  { v: 'W',   l: 'Weekly'  },
  { v: 'M',   l: 'Monthly' },
];

const selectCls = 'rounded-lg border border-[var(--c-border)] bg-[var(--c-bg-page)] px-3 py-1.5 text-sm text-[var(--c-text-primary)] outline-none focus:border-cyan-500/50';

export default function ChartView() {
  const { theme: globalTheme } = useTheme();
  const [symbol,   setSymbol]   = useState('OANDA:SPX500USD');
  const [interval, setInterval] = useState('D');
  const [theme,    setTheme]    = useState(globalTheme);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef(null);
  const widgetRef    = useRef(null);

  // Build/rebuild widget whenever symbol, interval, or theme change
  useEffect(() => {
    if (!widgetRef.current) return;

    // Clear any previous widget
    widgetRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (!window.TradingView || !widgetRef.current) return;
      new window.TradingView.widget({
        container_id:      'tv_chart_container',
        width:             '100%',
        height:            '100%',
        symbol:            symbol,
        interval:          interval,
        timezone:          'America/New_York',
        theme:             theme,
        style:             '1',
        locale:            'en',
        toolbar_bg:        '#f1f3f6',
        enable_publishing: false,
        allow_symbol_change: true,
        hide_side_toolbar: false,
        withdateranges:    true,
        details:           true,
        hotlist:           false,
        calendar:          false,
        autosize:          true,
      });
    };

    widgetRef.current.appendChild(script);

    return () => {
      if (widgetRef.current) widgetRef.current.innerHTML = '';
    };
  }, [symbol, interval, theme]);

  // Track fullscreen changes (e.g. user presses Esc)
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  function toggleFullscreen() {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  return (
    <div className="flex h-full flex-col p-4 md:p-6">

      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--c-text-dimmed)]">Symbol</label>
          <input
            type="text"
            value={symbol}
            onChange={e => setSymbol(e.target.value.trim())}
            placeholder="OANDA:SPX500USD"
            className="w-52 rounded-lg border border-[var(--c-border)] bg-[var(--c-bg-page)] px-3 py-1.5 text-sm text-[var(--c-text-primary)] outline-none focus:border-cyan-500/50"
          />
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--c-text-dimmed)]">Interval</label>
          <select value={interval} onChange={e => setInterval(e.target.value)} className={selectCls}>
            {INTERVALS.map(i => <option key={i.v} value={i.v}>{i.l}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--c-text-dimmed)]">Theme</label>
          <select value={theme} onChange={e => setTheme(e.target.value)} className={selectCls}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>

        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit full screen' : 'Full screen'}
          className="mt-4 rounded-lg border border-[var(--c-border)] bg-[var(--c-hover)] px-3 py-1.5 text-[var(--c-text-secondary)] transition hover:bg-[var(--c-hover-strong)] hover:text-[var(--c-text-primary)]"
        >
          {isFullscreen ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06L5.44 6.5H3.75a.75.75 0 000 1.5h3.5A.75.75 0 008 7.25v-3.5a.75.75 0 00-1.5 0v1.69L3.28 2.22zM13.5 6.5h1.69l-3.22-3.22a.75.75 0 011.06-1.06l3.22 3.22V3.75a.75.75 0 011.5 0v3.5A.75.75 0 0117 8h-3.5a.75.75 0 010-1.5zM6.5 13.5V11.81l-3.22 3.22a.75.75 0 01-1.06-1.06l3.22-3.22H3.75a.75.75 0 010-1.5h3.5A.75.75 0 018 11v3.5a.75.75 0 01-1.5 0zM11 13.5a.75.75 0 001.5 0v-1.69l3.22 3.22a.75.75 0 001.06-1.06l-3.22-3.22h1.69a.75.75 0 000-1.5h-3.5A.75.75 0 0011 11v3.5z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M13.28 7.78l3.22-3.22v1.69a.75.75 0 001.5 0v-3.5A.75.75 0 0017.25 2h-3.5a.75.75 0 000 1.5h1.69l-3.22 3.22a.75.75 0 001.06 1.06zM2 17.25v-3.5a.75.75 0 011.5 0v1.69l3.22-3.22a.75.75 0 011.06 1.06L4.56 16.5h1.69a.75.75 0 010 1.5h-3.5A.75.75 0 012 17.25zM12.72 13.28l3.22 3.22h-1.69a.75.75 0 000 1.5h3.5A.75.75 0 0018 17.25v-3.5a.75.75 0 00-1.5 0v1.69l-3.22-3.22a.75.75 0 10-1.06 1.06zM3.5 4.56l3.22 3.22a.75.75 0 01-1.06 1.06L2.44 5.62v1.69a.75.75 0 01-1.5 0v-3.5A.75.75 0 012.75 3h3.5a.75.75 0 010 1.5H4.56z" />
            </svg>
          )}
        </button>
      </div>

      {/* ── Chart container ───────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-panel)]"
        style={{ minHeight: 500 }}
      >
        {/* Full screen button overlay (also shown inside full screen) */}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit full screen (Esc)' : 'Full screen'}
          className="absolute right-3 top-3 z-10 rounded-lg border border-white/20 bg-black/40 p-1.5 text-[var(--c-text-secondary)] backdrop-blur-sm transition hover:bg-[var(--c-bg-modal-overlay)] hover:text-[var(--c-text-primary)]"
        >
          {isFullscreen ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06L5.44 6.5H3.75a.75.75 0 000 1.5h3.5A.75.75 0 008 7.25v-3.5a.75.75 0 00-1.5 0v1.69L3.28 2.22zM13.5 6.5h1.69l-3.22-3.22a.75.75 0 011.06-1.06l3.22 3.22V3.75a.75.75 0 011.5 0v3.5A.75.75 0 0117 8h-3.5a.75.75 0 010-1.5zM6.5 13.5V11.81l-3.22 3.22a.75.75 0 01-1.06-1.06l3.22-3.22H3.75a.75.75 0 010-1.5h3.5A.75.75 0 018 11v3.5a.75.75 0 01-1.5 0zM11 13.5a.75.75 0 001.5 0v-1.69l3.22 3.22a.75.75 0 001.06-1.06l-3.22-3.22h1.69a.75.75 0 000-1.5h-3.5A.75.75 0 0011 11v3.5z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M13.28 7.78l3.22-3.22v1.69a.75.75 0 001.5 0v-3.5A.75.75 0 0017.25 2h-3.5a.75.75 0 000 1.5h1.69l-3.22 3.22a.75.75 0 001.06 1.06zM2 17.25v-3.5a.75.75 0 011.5 0v1.69l3.22-3.22a.75.75 0 011.06 1.06L4.56 16.5h1.69a.75.75 0 010 1.5h-3.5A.75.75 0 012 17.25zM12.72 13.28l3.22 3.22h-1.69a.75.75 0 000 1.5h3.5A.75.75 0 0018 17.25v-3.5a.75.75 0 00-1.5 0v1.69l-3.22-3.22a.75.75 0 10-1.06 1.06zM3.5 4.56l3.22 3.22a.75.75 0 01-1.06 1.06L2.44 5.62v1.69a.75.75 0 01-1.5 0v-3.5A.75.75 0 012.75 3h3.5a.75.75 0 010 1.5H4.56z" />
            </svg>
          )}
        </button>

        <div
          id="tv_chart_container"
          ref={widgetRef}
          className="h-full w-full"
        />
      </div>

      <p className="mt-2 text-center text-[10px] text-[var(--c-text-faint)]">
        <a href="https://www.tradingview.com/" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--c-text-muted)]">
          Track all markets on TradingView
        </a>
      </p>
    </div>
  );
}
