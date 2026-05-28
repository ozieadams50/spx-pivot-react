import { useState } from 'react';
import { Link } from 'react-router-dom';

const PROFILE_MENU = [
  { label: 'Contact Info', path: '/profile/contact' },
  { label: 'Notification Channels', path: '/profile/notifications' },
  { label: 'SPX Trade Settings', path: '/profile/trade-settings' },
  { label: 'Manage Password', path: '/profile/password' },
];

export default function TopNavigation({ title, subtitle }) {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className="sticky top-0 z-30 border-b border-white/10 bg-[#08111c]/95 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-4 lg:px-8">
        <div>
          <h1 className="text-lg font-semibold text-white sm:text-xl">
            {title || 'SPX Options Trading Dashboard'}
          </h1>
          <p className="text-xs text-slate-500">
            {subtitle || 'Institutional Market Intelligence Platform'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>

          <div className="relative">
            <button
              onClick={() => setProfileOpen((o) => !o)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>

            {profileOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setProfileOpen(false)}
                />
                <div className="absolute right-0 z-50 mt-3 w-64 rounded-3xl border border-white/10 bg-[#0d1726] p-3 shadow-2xl">
                  <div className="mb-2 border-b border-white/10 px-4 pb-3 pt-1">
                    <p className="text-sm font-semibold text-white">My Account</p>
                    <p className="text-xs text-slate-500">ozie.adams@gmail.com</p>
                  </div>
                  {PROFILE_MENU.map((item) => (
                    <Link
                      key={item.label}
                      to={item.path}
                      onClick={() => setProfileOpen(false)}
                      className="mb-1 flex items-center rounded-2xl px-4 py-3 text-sm text-slate-300 hover:bg-cyan-500/10 hover:text-cyan-300 transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <div className="mt-2 border-t border-white/10 pt-2">
                    <button className="flex w-full items-center rounded-2xl px-4 py-3 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors">
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
