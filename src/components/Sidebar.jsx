import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const NAV = [
  { title: 'Home', path: '/' },
  {
    title: 'Apps',
    children: [
      {
        title: 'SPX Pivots',
        children: [
          { title: 'Current Pivots', path: '/spx-pivots' },
          { title: 'Historical Performance', path: '/spx-pivots/history' },
          { title: 'Chart View', path: '/spx-pivots/charts' },
        ],
      },
    ],
  },
  {
    title: 'Admin',
    children: [
      {
        title: 'Market Sentiment',
        children: [
          { title: 'Subscriber Commentary', path: '/admin/commentary' },
          { title: 'Set Market Sentiment', path: '/admin/sentiment' },
          { title: 'Sentiment History', path: '/admin/sentiment-history' },
          { title: 'Commentary History', path: '/admin/commentary-history' },
        ],
      },
      {
        title: 'User Mgmt',
        children: [
          { title: 'Manage Users', path: '/admin/users' },
          { title: 'Add User', path: '/admin/users/add' },
        ],
      },
      {
        title: 'App Mgmt',
        children: [
          { title: 'Manage App', path: '/admin/apps' },
          { title: 'Register App', path: '/admin/apps/register' },
          { title: 'Disable App', path: '/admin/apps/disable' },
        ],
      },
    ],
  },
  { title: 'System Monitor', path: '/system' },
];

function LeafItem({ title, path }) {
  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        `block rounded-lg px-3 py-2 text-sm transition-colors ${
          isActive
            ? 'bg-cyan-500/15 text-cyan-300'
            : 'text-slate-500 hover:bg-cyan-500/10 hover:text-cyan-300'
        }`
      }
    >
      {title}
    </NavLink>
  );
}

function GroupItem({ group }) {
  const location = useLocation();
  const hasActive = group.children?.some((c) =>
    c.path ? location.pathname === c.path : false
  );
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
              <LeafItem key={child.title} title={child.title} path={child.path} />
            ) : (
              <GroupItem key={child.title} group={child} />
            )
          )}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();

  return (
    <aside
      className={`hidden flex-col border-r border-white/10 bg-[#08111c] transition-all duration-300 lg:flex ${
        collapsed ? 'w-16' : 'w-[280px]'
      }`}
    >
      <div className="flex items-center justify-between border-b border-white/10 p-5">
        {!collapsed && (
          <h2 className="text-lg font-bold text-white">SPX Control Center</h2>
        )}
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
          {NAV.map((item) => {
            if (item.path) {
              return (
                <div key={item.title} className="mb-2">
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `block rounded-2xl px-4 py-3 font-semibold transition-colors ${
                        isActive
                          ? 'bg-cyan-500/15 text-cyan-300'
                          : 'text-white hover:bg-white/5'
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
                  {item.children.map((sub) => (
                    <GroupItem key={sub.title} group={sub} />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
      )}

      {collapsed && (
        <nav className="flex flex-1 flex-col items-center gap-2 py-4">
          <NavLink to="/" title="Home" className="rounded-xl p-3 text-slate-400 hover:bg-white/5 hover:text-white">
            ⌂
          </NavLink>
          <NavLink to="/spx-pivots" title="SPX Pivots" className="rounded-xl p-3 text-slate-400 hover:bg-white/5 hover:text-cyan-300">
            ◈
          </NavLink>
          <NavLink to="/admin/sentiment" title="Admin" className="rounded-xl p-3 text-slate-400 hover:bg-white/5 hover:text-white">
            ⚙
          </NavLink>
          <NavLink to="/system" title="System Monitor" className="rounded-xl p-3 text-slate-400 hover:bg-white/5 hover:text-white">
            ⬡
          </NavLink>
        </nav>
      )}
    </aside>
  );
}
