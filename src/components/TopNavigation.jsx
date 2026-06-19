import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  loadNotifications, markRead, clearOne, clearAll, unreadCount,
} from '../data/notifications';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

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
        ? 'bg-cyan-500/20 text-[var(--c-cyan-strong)]'
        : 'bg-violet-500/20 text-[var(--c-violet-strong)]'
    }`}>
      {type === 'email' ? 'Email' : 'ntfy'}
    </span>
  );
}

const ROLE_LABELS = { subscriber: 'Subscriber', admin: 'Admin', superuser: 'Super User' };
const ROLE_BADGE  = {
  subscriber: 'bg-amber-500/15 text-[var(--c-amber)]',
  admin:      'bg-cyan-500/15 text-[var(--c-cyan)]',
  superuser:  'bg-violet-500/15 text-[var(--c-violet)]',
};

export default function TopNavigation({ title, subtitle, onMobileMenuOpen }) {
  const { role, setRole, logout, user: profile } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
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
    <div className="sticky top-0 z-30 border-b border-[var(--c-border)] bg-[var(--c-bg-nav-blur)] backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-4 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onMobileMenuOpen}
            className="lg:hidden rounded-xl border border-[var(--c-border)] bg-[var(--c-hover)] p-2.5 text-[var(--c-text-muted)] hover:bg-[var(--c-hover-strong)] hover:text-[var(--c-text-primary)]"
            aria-label="Open navigation menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-semibold text-[var(--c-text-primary)] sm:text-xl">
              {title || 'SPX Options Trading Dashboard'}
            </h1>
            <p className="text-xs text-[var(--c-text-dimmed)]">
              {subtitle || 'Institutional Market Intelligence Platform'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-hover)] p-3 text-[var(--c-text-muted)] transition-colors hover:bg-[var(--c-hover-strong)] hover:text-[var(--c-text-primary)]"
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Bell */}
          <div className="relative">
            <button
              onClick={openBell}
              className="relative rounded-2xl border border-[var(--c-border)] bg-[var(--c-hover)] p-3 text-[var(--c-text-muted)] transition-colors hover:bg-[var(--c-hover-strong)] hover:text-[var(--c-text-primary)]"
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
                <div className="absolute right-0 z-50 mt-3 w-96 rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-dropdown)] shadow-2xl">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-[var(--c-border)] px-5 py-4">
                    <div>
                      <p className="text-sm font-semibold text-[var(--c-text-primary)]">Notifications</p>
                      {count > 0 && (
                        <p className="text-xs text-[var(--c-text-dimmed)]">{count} unread</p>
                      )}
                    </div>
                    {notifs.length > 0 && (
                      <button
                        onClick={handleClearAll}
                        className="rounded-xl border border-[var(--c-border)] px-3 py-1.5 text-xs text-[var(--c-text-muted)] transition hover:bg-[var(--c-hover)] hover:text-[var(--c-rose)]"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div className="max-h-[480px] overflow-y-auto">
                    {notifs.length === 0 ? (
                      <p className="px-5 py-8 text-center text-sm text-[var(--c-text-dimmed)]">No notifications</p>
                    ) : (
                      notifs.map((n) => {
                        const isExpanded = expanded === n.id;
                        return (
                          <div
                            key={n.id}
                            onClick={() => handleMarkRead(n.id)}
                            className={`group relative cursor-pointer border-b border-[var(--c-border-subtle)] px-5 py-4 transition-colors last:border-0 hover:bg-[var(--c-hover)] ${
                              !n.read ? 'bg-[var(--c-hover-faint)]' : ''
                            }`}
                          >
                            {/* Unread dot */}
                            {!n.read && (
                              <span className="absolute left-2 top-5 h-1.5 w-1.5 rounded-full bg-cyan-400" />
                            )}

                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <TypeBadge type={n.type} />
                                <p className={`text-sm font-medium ${n.read ? 'text-[var(--c-text-secondary)]' : 'text-[var(--c-text-primary)]'}`}>
                                  {n.title}
                                </p>
                              </div>
                              <button
                                onClick={(e) => handleClearOne(n.id, e)}
                                className="shrink-0 rounded p-0.5 text-[var(--c-text-faint)] opacity-0 transition hover:text-[var(--c-text-secondary)] group-hover:opacity-100"
                              >
                                ✕
                              </button>
                            </div>

                            <p className={`mt-1.5 text-xs leading-relaxed text-[var(--c-text-muted)] ${isExpanded ? '' : 'line-clamp-2'}`}>
                              {n.message}
                            </p>

                            <p className="mt-2 text-[10px] text-[var(--c-text-faint)]">{fmt(n.timestamp)}</p>
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
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-[var(--c-cyan)] transition-colors hover:bg-cyan-500/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 z-50 mt-3 w-64 rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-dropdown)] p-3 shadow-2xl">
                  <div className="mb-3 border-b border-[var(--c-border)] px-4 pb-3 pt-1">
                    <p className="text-sm font-semibold text-[var(--c-text-primary)]">
                      {[profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'My Account'}
                    </p>
                    <p className="text-xs text-[var(--c-text-dimmed)]">{profile?.email || ''}</p>
                    <span className={`mt-1.5 inline-block rounded-lg px-2 py-0.5 text-xs font-semibold ${ROLE_BADGE[role]}`}>
                      {ROLE_LABELS[role]}
                    </span>
                    {/* Role switcher — for demo/testing */}
                    <div className="mt-2 flex gap-1">
                      {Object.entries(ROLE_LABELS).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => setRole(key)}
                          className={`flex-1 rounded-lg py-1 text-[10px] font-semibold transition ${
                            role === key
                              ? ROLE_BADGE[key]
                              : 'bg-[var(--c-hover)] text-[var(--c-text-dimmed)] hover:bg-[var(--c-hover-strong)]'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {PROFILE_MENU.map((item) => (
                    <Link
                      key={item.label}
                      to={item.path}
                      onClick={() => setProfileOpen(false)}
                      className="mb-1 flex items-center rounded-2xl px-4 py-3 text-sm text-[var(--c-text-secondary)] transition-colors hover:bg-cyan-500/10 hover:text-[var(--c-cyan)]"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <div className="mt-2 border-t border-[var(--c-border)] pt-2">
                    <button
                      onClick={() => { setProfileOpen(false); logout(); navigate('/login', { replace: true }); }}
                      className="flex w-full items-center rounded-2xl px-4 py-3 text-sm text-[var(--c-rose)] transition-colors hover:bg-rose-500/10"
                    >
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
