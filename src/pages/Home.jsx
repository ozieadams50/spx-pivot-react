import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canAccess } from '../data/accessMatrix';
import PageGuide from '../components/PageGuide';

export default function Home() {
  const { role, accessMatrix } = useAuth();
  const isAdmin = canAccess(accessMatrix, role, 'admin');
  const canSeeSystem = canAccess(accessMatrix, role, 'system-monitor');

  return (
    <div className="mx-auto max-w-7xl p-4 lg:p-8">

      {/* Hero */}
      <div id="pg-home-hero" className="mb-6 rounded-3xl border border-[var(--c-border)] bg-gradient-to-br from-[var(--c-bg-gradient-from)] to-[var(--c-bg-gradient-to)] p-8 lg:p-12">
        <div className="mb-4 inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-violet)]">
          Quantified Edge
        </div>
        <h1 className="text-4xl font-bold text-[var(--c-text-primary)]">Welcome.</h1>
        <p className="mt-3 max-w-2xl text-base text-[var(--c-text-muted)] leading-relaxed">
          This platform helps options traders find pre-earnings setups and execute SPX credit spreads — with the scoring, analysis, and historical data to back every decision.
        </p>
      </div>

      <PageGuide
        guideKey="home"
        accent="violet"
        title="New here? Here's how this platform is organized."
        description="You have three trading tools — one for finding stocks that run up before earnings, one for SPX credit spread strategies, and one for end-of-day directional trades. Here's where each one lives."
        steps={[
          { text: 'Pre-Earnings Runners is the core product. The system scans every stock daily, finds ones that historically go up before their earnings announcement, and ranks the best opportunities. If you\'re new, click it and go straight to Hot Picks — that\'s today\'s top-ranked list.', targetId: 'pg-pre-earnings-card' },
          { text: 'SPX Pivots gives you today\'s key S&P 500 price levels and a ready-to-use Bull Put Spread trade recommendation — updated daily with current market sentiment factored in. Start here for SPX options trades.', targetId: 'pg-spx-pivots-card' },
          { text: 'EOD-MOC Signal activates at 3:50 PM ET. Based on dealer gamma exposure and market-on-close imbalance flow, it tells you whether to trade and recommends a 0DTE debit spread with specific strikes. Check it in the final 10 minutes of the trading day.', targetId: 'pg-eod-moc-card' },
          { text: 'SPX Backtester lets you test any Bull Put Spread strategy against years of historical data before risking real money. Adjust the parameters, run the simulation, and check the win rate and profit factor before committing to a setup.', targetId: 'pg-spx-backtest-card' },
        ]}
      />

      {/* App cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

        {/* Pre-Earnings Runners */}
        <Link
          id="pg-pre-earnings-card"
          to="/earnings"
          className="group rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-card)] p-6 hover:border-violet-500/30 transition-all"
        >
          <div className="mb-4 inline-flex rounded-2xl border border-violet-500/20 bg-violet-500/10 p-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--c-violet-strong)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[var(--c-text-primary)] group-hover:text-[var(--c-violet)] transition-colors">Pre-Earnings Runners</h3>
          <p className="mt-2 text-sm text-[var(--c-text-dimmed)]">Stocks that historically run up before earnings — scored and ranked daily. Start here.</p>
        </Link>

        {/* SPX Pivots */}
        <Link
          id="pg-spx-pivots-card"
          to="/spx-pivots"
          className="group rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-card)] p-6 hover:border-cyan-500/30 transition-all"
        >
          <div className="mb-4 inline-flex rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--c-cyan-strong)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[var(--c-text-primary)] group-hover:text-[var(--c-cyan)] transition-colors">SPX Pivots</h3>
          <p className="mt-2 text-sm text-[var(--c-text-dimmed)]">Daily, weekly, and monthly pivot levels with Bull Put Spread recommendations.</p>
        </Link>

        {/* SPX Backtester */}
        <Link
          id="pg-spx-backtest-card"
          to="/spx-backtest"
          className="group rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-card)] p-6 hover:border-sky-500/30 transition-all"
        >
          <div className="mb-4 inline-flex rounded-2xl border border-sky-500/20 bg-sky-500/10 p-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--c-sky-strong)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[var(--c-text-primary)] group-hover:text-[var(--c-sky)] transition-colors">SPX Backtester</h3>
          <p className="mt-2 text-sm text-[var(--c-text-dimmed)]">Test any Bull Put Spread strategy against years of SPX historical data.</p>
        </Link>

        {/* EOD-MOC Signal */}
        <Link
          id="pg-eod-moc-card"
          to="/eod-moc"
          className="group rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-card)] p-6 hover:border-amber-500/30 transition-all"
        >
          <div className="mb-4 inline-flex rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--c-amber-strong)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[var(--c-text-primary)] group-hover:text-[var(--c-amber)] transition-colors">EOD-MOC Signal</h3>
          <p className="mt-2 text-sm text-[var(--c-text-dimmed)]">End-of-day 0DTE spread signal based on dealer positioning and market-on-close imbalance flow.</p>
        </Link>

        {/* System Monitor — admin/superuser only */}
        {canSeeSystem && (
          <Link
            to="/system"
            className="group rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-card)] p-6 hover:border-emerald-500/30 transition-all"
          >
            <div className="mb-4 inline-flex rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--c-emerald)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[var(--c-text-primary)] group-hover:text-[var(--c-emerald-strong)] transition-colors">System Monitor</h3>
            <p className="mt-2 text-sm text-[var(--c-text-dimmed)]">Server health, cron job status, and data pipeline monitoring.</p>
          </Link>
        )}

        {/* Admin — admin/superuser only */}
        {isAdmin && (
          <Link
            to="/admin/sentiment"
            className="group rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-card)] p-6 hover:border-orange-500/30 transition-all"
          >
            <div className="mb-4 inline-flex rounded-2xl border border-orange-500/20 bg-orange-500/10 p-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--c-orange-strong)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[var(--c-text-primary)] group-hover:text-[var(--c-orange)] transition-colors">Admin</h3>
            <p className="mt-2 text-sm text-[var(--c-text-dimmed)]">Market sentiment, user management, and application settings.</p>
          </Link>
        )}

      </div>
    </div>
  );
}
