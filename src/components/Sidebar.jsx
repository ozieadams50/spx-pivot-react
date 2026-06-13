import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canAccess } from '../data/accessMatrix';

const FULL_NAV = [
  { title: 'Home', path: '/', matrixKey: 'home' },
  {
    title: 'Apps', matrixKey: 'apps',
    children: [
      {
        title: 'SPX Pivots', matrixKey: 'apps/spx-pivots',
        children: [
          { title: 'Current Pivots',        path: '/spx-pivots',         matrixKey: 'apps/spx-pivots/current-pivots'         },
          { title: 'Historical Performance', path: '/spx-pivots/history', matrixKey: 'apps/spx-pivots/historical-performance' },
          { title: 'Chart View',             path: '/spx-pivots/charts',  matrixKey: 'apps/spx-pivots/chart-view'             },
          { title: 'Sentiment History',      path: '/spx-pivots/sentiment-history',  matrixKey: 'apps/spx-pivots/sentiment-history'  },
          { title: 'Commentary History',     path: '/spx-pivots/commentary-history', matrixKey: 'apps/spx-pivots/commentary-history' },
        ],
      },
      {
        title: 'Pre-Earnings Runners', matrixKey: 'apps/pre-earnings',
        children: [
          { title: 'Summary',     path: '/earnings',            matrixKey: 'apps/pre-earnings/summary'     },
          { title: 'All Signals',    path: '/earnings?grade=all',  matrixKey: 'apps/pre-earnings/all-signals'     },
          { title: 'Sector Tracker', path: '/earnings/sectors',   matrixKey: 'apps/pre-earnings/sector-tracker'  },
          { title: 'Calendar',       path: '/earnings/calendar',  matrixKey: 'apps/pre-earnings/calendar'        },
          { title: 'Historical Performance', path: '/earnings/historical', matrixKey: 'apps/pre-earnings/historical-performance' },
        ],
      },
      {
        title: 'SPX Backtester', matrixKey: 'apps/spx-backtest',
        children: [
          { title: 'Run Backtest', path: '/spx-backtest', matrixKey: 'apps/spx-backtest/run' },
        ],
      },
    ],
  },
  {
    title: 'Admin', matrixKey: 'admin',
    children: [
      {
        title: 'Market Sentiment', matrixKey: 'admin/market-sentiment',
        children: [
          { title: 'Subscriber Commentary', path: '/admin/commentary',         matrixKey: 'admin/market-sentiment/subscriber-commentary' },
          { title: 'Set Market Sentiment',  path: '/admin/sentiment',          matrixKey: 'admin/market-sentiment/set-market-sentiment'  },
          { title: 'Set GEX & MOC',         path: '/admin/gex-moc',            matrixKey: 'admin/market-sentiment/set-gex-moc'           },
        ],
      },
      {
        title: 'User Mgmt', matrixKey: 'admin/user-mgmt',
        children: [
          { title: 'Manage Users', path: '/admin/users',     matrixKey: 'admin/user-mgmt/manage-users' },
          { title: 'Add User',     path: '/admin/users/add', matrixKey: 'admin/user-mgmt/add-user'     },
        ],
      },
      {
        title: 'Access Group', matrixKey: 'admin/access-group',
        children: [
          { title: 'Manage Roles',   path: '/admin/roles',         matrixKey: 'admin/access-group/manage-roles'   },
          { title: 'Add Role',       path: '/admin/roles/add',     matrixKey: 'admin/access-group/add-role'       },
          { title: 'Manage Access',  path: '/admin/access',        matrixKey: 'admin/access-group/manage-access'  },
        ],
      },
      {
        title: 'App Mgmt', matrixKey: 'admin/app-mgmt',
        children: [
          { title: 'Manage Apps',  path: '/admin/apps',          matrixKey: 'admin/app-mgmt/manage-apps'   },
          { title: 'Register App', path: '/admin/apps/register', matrixKey: 'admin/app-mgmt/register-app' },
        ],
      },
    ],
  },
  {
    title: 'System Monitor', matrixKey: 'system-monitor',
    children: [
      { title: 'Open Monitor', path: '/system',      matrixKey: 'system-monitor/open-monitor' },
      { title: 'Log Viewer',   path: '/system/logs', matrixKey: 'system-monitor/log-viewer'   },
    ],
  },
];

function filterNav(items, role, matrix) {
  return items.reduce((acc, item) => {
    if (!canAccess(matrix, role, item.matrixKey)) return acc;
    if (item.children) {
      const children = filterNav(item.children, role, matrix);
      if (children.length === 0) return acc;
      return [...acc, { ...item, children }];
    }
    return [...acc, item];
  }, []);
}

function LeafItem({ title, path, onClose }) {
  const location = useLocation();
  const [linkPath, linkSearch] = path.includes('?') ? path.split('?') : [path, null];
  const active = linkSearch
    ? location.pathname === linkPath && location.search.includes(linkSearch)
    : location.pathname === linkPath && !location.search;

  return (
    <NavLink
      to={path}
      onClick={onClose}
      className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
        active
          ? 'bg-cyan-500/15 text-cyan-300'
          : 'text-slate-500 hover:bg-cyan-500/10 hover:text-cyan-300'
      }`}
    >
      {title}
    </NavLink>
  );
}

function GroupItem({ group, onClose }) {
  const location  = useLocation();
  const hasActive = group.children?.some((c) => c.path ? location.pathname === c.path : false);
  const [open, setOpen] = useState(hasActive || true);

  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
      >
        <span>{group.title}</span>
        <span className={`text-xs transition-transform ${open ? 'rotate-90' : ''}`}>›</span>
      </button>
      {open && (
        <div className="ml-3 mt-1 space-y-0.5 border-l border-white/5 pl-3">
          {group.children.map((child) =>
            child.path ? (
              <LeafItem key={child.title} title={child.title} path={child.path} onClose={onClose} />
            ) : (
              <GroupItem key={child.title} group={child} onClose={onClose} />
            )
          )}
        </div>
      )}
    </div>
  );
}

function MobileNav({ nav, onClose }) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-white/10 bg-[#08111c] lg:hidden">
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <h2 className="text-lg font-bold text-white">SPX Control Center</h2>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 p-2 text-slate-400 hover:bg-white/5 hover:text-white"
            aria-label="Close navigation menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 pb-8">
          {nav.map((item) => {
            if (item.path) {
              return (
                <div key={item.title} className="mb-2">
                  <NavLink
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `block rounded-2xl px-4 py-3 font-semibold transition-colors ${
                        isActive ? 'bg-cyan-500/15 text-cyan-300' : 'text-white hover:bg-white/5'
                      }`
                    }
                  >
                    {item.title}
                  </NavLink>
                </div>
              );
            }
            return (
              <div key={item.title} className="mb-4">
                <div className="mb-1 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-600">
                  {item.title}
                </div>
                <div className="ml-1">
                  {item.children.map((sub) =>
                    sub.path ? (
                      <LeafItem key={sub.title} title={sub.title} path={sub.path} onClose={onClose} />
                    ) : (
                      <GroupItem key={sub.title} group={sub} onClose={onClose} />
                    )
                  )}
                </div>
              </div>
            );
          })}
        </nav>
      </div>
    </>
  );
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const { role, accessMatrix }  = useAuth();
  const nav                     = filterNav(FULL_NAV, role, accessMatrix);

  return (
    <>
    {mobileOpen && <MobileNav nav={nav} onClose={onMobileClose} />}
    <aside
      className={`hidden flex-col border-r border-white/10 bg-[#08111c] transition-all duration-300 lg:flex ${
        collapsed ? 'w-16' : 'w-[280px]'
      }`}
    >
      <div className="flex items-center justify-between border-b border-white/10 p-5">
        {!collapsed && <h2 className="text-lg font-bold text-white">SPX Control Center</h2>}
        <button
          onClick={onToggle}
          className="ml-auto rounded-xl border border-white/10 p-2 text-slate-400 hover:bg-white/5 hover:text-white"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {!collapsed && (
        <nav className="flex-1 overflow-y-auto p-4 pb-8">
          {nav.map((item) => {
            if (item.path) {
              return (
                <div key={item.title} className="mb-2">
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `block rounded-2xl px-4 py-3 font-semibold transition-colors ${
                        isActive ? 'bg-cyan-500/15 text-cyan-300' : 'text-white hover:bg-white/5'
                      }`
                    }
                  >
                    {item.title}
                  </NavLink>
                </div>
              );
            }
            return (
              <div key={item.title} className="mb-4">
                <div className="mb-1 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-600">
                  {item.title}
                </div>
                <div className="ml-1">
                  {item.children.map((sub) =>
                    sub.path ? (
                      <LeafItem key={sub.title} title={sub.title} path={sub.path} />
                    ) : (
                      <GroupItem key={sub.title} group={sub} />
                    )
                  )}
                </div>
              </div>
            );
          })}
        </nav>
      )}

      {collapsed && (
        <nav className="flex flex-1 flex-col items-center gap-2 py-4">
          <NavLink to="/" title="Home" className="rounded-xl p-3 text-slate-400 hover:bg-white/5 hover:text-white">⌂</NavLink>
          <NavLink to="/spx-pivots" title="SPX Pivots" className="rounded-xl p-3 text-slate-400 hover:bg-white/5 hover:text-cyan-300">◈</NavLink>
          {canAccess(accessMatrix, role, 'admin') && (
            <NavLink to="/admin/sentiment" title="Admin" className="rounded-xl p-3 text-slate-400 hover:bg-white/5 hover:text-white">⚙</NavLink>
          )}
          {canAccess(accessMatrix, role, 'system-monitor') && (
            <NavLink to="/system" title="System Monitor" className="rounded-xl p-3 text-slate-400 hover:bg-white/5 hover:text-white">⬡</NavLink>
          )}
        </nav>
      )}
    </aside>
    </>
  );
}
