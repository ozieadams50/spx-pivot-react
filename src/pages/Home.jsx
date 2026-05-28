import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="mx-auto max-w-7xl p-4 lg:p-8">
      <div className="mb-8 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-[#0a1624] p-8 lg:p-12">
        <div className="mb-4 inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1 text-xs uppercase tracking-[0.2em] text-cyan-300">
          Welcome
        </div>
        <h1 className="text-4xl font-bold text-white">SPX Control Center</h1>
        <p className="mt-3 text-slate-400">
          Institutional-grade SPX options trading analytics and automated alerts.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/spx-pivots"
          className="group rounded-3xl border border-white/10 bg-[#0b1420] p-6 hover:border-cyan-500/30 hover:bg-[#0b1420] transition-all"
        >
          <div className="mb-4 inline-flex rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition-colors">SPX Pivots</h3>
          <p className="mt-2 text-sm text-slate-500">Daily, weekly, and monthly pivot levels with Bull Put Spread recommendations.</p>
        </Link>

        <Link
          to="/system"
          className="group rounded-3xl border border-white/10 bg-[#0b1420] p-6 hover:border-emerald-500/30 transition-all"
        >
          <div className="mb-4 inline-flex rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white group-hover:text-emerald-300 transition-colors">System Monitor</h3>
          <p className="mt-2 text-sm text-slate-500">Server health, cron job status, and data pipeline monitoring.</p>
        </Link>

        <Link
          to="/admin/sentiment"
          className="group rounded-3xl border border-white/10 bg-[#0b1420] p-6 hover:border-orange-500/30 transition-all"
        >
          <div className="mb-4 inline-flex rounded-2xl border border-orange-500/20 bg-orange-500/10 p-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white group-hover:text-orange-300 transition-colors">Admin</h3>
          <p className="mt-2 text-sm text-slate-500">Market sentiment, user management, and application settings.</p>
        </Link>
      </div>
    </div>
  );
}
