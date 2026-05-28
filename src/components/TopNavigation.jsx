import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  loadNotifications, markRead, clearOne, clearAll, unreadCount,
} from '../data/notifications';

const PROFILE_MENU = [
  { label: 'Contact Info',          path: '/profile/contact'       },
  { label: 'Notification Channels', path: '/profile/notifications' },
  { label: 'SPX Trade Settings',    path: '/profile/trade-settings'},
  { label: 'Manage Password',       path: '/profile/password'      },
];

function fmt(ts) {
  const d = new Date(ts);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
}

function TypeBadge({ type }) {
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
      type === 'email'
        ? 'bg-cyan-500/20 text-cyan-400'
        : 'bg-violet-500/20 text-violet-400'
    }`}>
      {type === 'email' ? 'Email' : 'ntfy'}
    </span>
  );
}

export default function TopNavigation({ title, subtitle }) {
  const [profileOpen, setProfileOpen]   = useState(false);
  const [bellOpen,    setBellOpen]      = useState(false);
  const [notifs,      setNotifs]        = useState([]);
  const [expanded,    setExpanded]      = useState(null);

  useEffect(() => { setNotifs(loadNotifications()); }, []);

  function openBell() {
    setNotifs(loadNotifications());
    setBellOpen(true);
    setProfileOpen(false);
  }

  function openProfile() {
    setProfileOpen(true);
    setBellOpen(false);
  }

  function handleMarkRead(id) {
    setNotifs(markRead(id));
    setExpanded(id);
  }

  function handleClearOne(id, e) {
    e.stopPropagation();
    setNotifs(clearOne(id));
    if (expanded === id) setExpanded(null);
  }

  function handleClearAll() {
    setNotifs(clearAll());
    setExpanded(null);
  }

  const count = unreadCount(notifs);

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
          {/* Bell */}
          <div className="relative">
            <button
              onClick={openBell}
              className="relative rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </button>

            {bellOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setBellOpen(false)} />
                <div className="absolute right-0 z-50 mt-3 w-96 rounded-3xl border border-white/10 bg-[#0d1726] shadow-2xl">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                    <div>
                      <p className="text-sm font-semibold text-white">Notifications</p>
                      {count > 0 && (
                        <p className="text-xs text-slate-500">{count} unread</p>
                      )}
                    </div>
                    {notifs.length > 0 && (
                      <button
                        onClick={handleClearAll}
                        className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-slate-400 transition hover:bg-white/5 hover:text-rose-400"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div className="max-h-[480px] overflow-y-auto">
                    {notifs.length === 0 ? (
                      <p className="px-5 py-8 text-center text-sm text-slate-500">No notifications</p>
                    ) : (
                      notifs.map((n) => {
                        const isExpanded = expanded === n.id;
                        return (
                          <div
                            key={n.id}
                            onClick={() => handleMarkRead(n.id)}
                            className={`group relative cursor-pointer border-b border-white/5 px-5 py-4 transition-colors last:border-0 hover:bg-white/5 ${
                              !n.read ? 'bg-white/[0.03]' : ''
                            }`}
                          >
                            {/* Unread dot */}
                            {!n.read && (
                              <span className="absolute left-2 top-5 h-1.5 w-1.5 rounded-full bg-cyan-400" />
                            )}

                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <TypeBadge type={n.type} />
                                <p className={`text-sm font-medium ${n.read ? 'text-slate-300' : 'text-white'}`}>
                                  {n.title}
                                </p>
                              </div>
                              <button
                                onClick={(e) => handleClearOne(n.id, e)}
                                className="shrink-0 rounded p-0.5 text-slate-600 opacity-0 transition hover:text-slate-300 group-hover:opacity-100"
                              >
                                ✕
                              </button>
                            </div>

                            <p className={`mt-1.5 text-xs leading-relaxed text-slate-400 ${isExpanded ? '' : 'line-clamp-2'}`}>
                              {n.message}
                            </p>

                            <p className="mt-2 text-[10px] text-slate-600">{fmt(n.timestamp)}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={openProfile}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 transition-colors hover:bg-cyan-500/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
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
                      className="mb-1 flex items-center rounded-2xl px-4 py-3 text-sm text-slate-300 transition-colors hover:bg-cyan-500/10 hover:text-cyan-300"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <div className="mt-2 border-t border-white/10 pt-2">
                    <button className="flex w-full items-center rounded-2xl px-4 py-3 text-sm text-rose-400 transition-colors hover:bg-rose-500/10">
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
