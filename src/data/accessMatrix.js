const KEY     = 'access_matrix';
const VERSION = 6;

// Flat list of every navigable item — used by both Sidebar and ManageAccess
export const MENU_ITEMS = [
  { key: 'home',                                            label: 'Home',                    level: 0 },
  { key: 'apps',                                            label: 'Apps',                    level: 0 },
  { key: 'apps/spx-pivots',                                 label: 'SPX Pivots',              level: 1 },
  { key: 'apps/spx-pivots/current-pivots',                  label: 'Current Pivots',          level: 2 },
  { key: 'apps/spx-pivots/historical-performance',          label: 'Historical Performance',  level: 2 },
  { key: 'apps/spx-pivots/chart-view',                      label: 'Chart View',              level: 2 },
  { key: 'apps/spx-pivots/sentiment-history',                label: 'Sentiment History',       level: 2 },
  { key: 'apps/spx-pivots/commentary-history',               label: 'Commentary History',       level: 2 },
  { key: 'apps/spx-backtest',                               label: 'SPX Backtester',          level: 1 },
  { key: 'apps/spx-backtest/run',                           label: 'Run Backtest',            level: 2 },
  { key: 'apps/pre-earnings',                      label: 'Pre-Earnings Runners',  level: 1 },
  { key: 'apps/pre-earnings/summary',              label: 'Summary',               level: 2 },
  { key: 'apps/pre-earnings/all-signals',          label: 'All Signals',           level: 2 },
  { key: 'apps/pre-earnings/calendar',             label: 'Calendar',              level: 2 },
  { key: 'apps/pre-earnings/historical-performance', label: 'Historical Performance', level: 2 },
  { key: 'admin',                                           label: 'Admin',                   level: 0 },
  { key: 'admin/market-sentiment',                          label: 'Market Sentiment',        level: 1 },
  { key: 'admin/market-sentiment/subscriber-commentary',    label: 'Subscriber Commentary',   level: 2 },
  { key: 'admin/market-sentiment/set-market-sentiment',     label: 'Set Market Sentiment',    level: 2 },
  { key: 'admin/market-sentiment/set-gex-moc',             label: 'Set GEX & MOC',           level: 2 },
  { key: 'admin/user-mgmt',                                 label: 'User Mgmt',               level: 1 },
  { key: 'admin/user-mgmt/manage-users',                    label: 'Manage Users',            level: 2 },
  { key: 'admin/user-mgmt/add-user',                        label: 'Add User',                level: 2 },
  { key: 'admin/access-group',                              label: 'Access Group',            level: 1 },
  { key: 'admin/access-group/manage-roles',                 label: 'Manage Roles',            level: 2 },
  { key: 'admin/access-group/add-role',                     label: 'Add Role',                level: 2 },
  { key: 'admin/access-group/manage-access',                label: 'Manage Access',           level: 2 },
  { key: 'admin/app-mgmt',                                  label: 'App Mgmt',                level: 1 },
  { key: 'admin/app-mgmt/manage-apps',                      label: 'Manage Apps',             level: 2 },
  { key: 'admin/app-mgmt/register-app',                     label: 'Register App',            level: 2 },
  { key: 'system-monitor',                                  label: 'System Monitor',          level: 0 },
  { key: 'system-monitor/open-monitor',                     label: 'Open Monitor',            level: 1 },
  { key: 'system-monitor/log-viewer',                       label: 'Log Viewer',              level: 1 },
];

export const DEFAULT_MATRIX = {
  'home':                                           { subscriber: true,  admin: true,  superuser: true  },
  'apps':                                           { subscriber: true,  admin: true,  superuser: true  },
  'apps/spx-pivots':                                { subscriber: true,  admin: true,  superuser: true  },
  'apps/spx-pivots/current-pivots':                 { subscriber: true,  admin: true,  superuser: true  },
  'apps/spx-pivots/historical-performance':         { subscriber: true,  admin: true,  superuser: true  },
  'apps/spx-pivots/chart-view':                     { subscriber: true,  admin: true,  superuser: true  },
  'apps/spx-pivots/sentiment-history':             { subscriber: true,  admin: true,  superuser: true  },
  'apps/spx-pivots/commentary-history':            { subscriber: true,  admin: true,  superuser: true  },
  'apps/spx-backtest':                              { subscriber: false, admin: true,  superuser: true  },
  'apps/spx-backtest/run':                          { subscriber: false, admin: true,  superuser: true  },
  'apps/pre-earnings':                              { subscriber: true,  admin: true,  superuser: true  },
  'apps/pre-earnings/summary':                      { subscriber: true,  admin: true,  superuser: true  },
  'apps/pre-earnings/all-signals':                  { subscriber: true,  admin: true,  superuser: true  },
  'apps/pre-earnings/calendar':                     { subscriber: true,  admin: true,  superuser: true  },
  'apps/pre-earnings/historical-performance':       { subscriber: true,  admin: true,  superuser: true  },
  'admin':                                          { subscriber: false, admin: true,  superuser: true  },
  'admin/market-sentiment':                         { subscriber: false, admin: true,  superuser: true  },
  'admin/market-sentiment/subscriber-commentary':   { subscriber: false, admin: true,  superuser: true  },
  'admin/market-sentiment/set-market-sentiment':    { subscriber: false, admin: true,  superuser: true  },
  'admin/market-sentiment/set-gex-moc':             { subscriber: false, admin: true,  superuser: true  },
  'admin/user-mgmt':                                { subscriber: false, admin: true,  superuser: true  },
  'admin/user-mgmt/manage-users':                   { subscriber: false, admin: true,  superuser: true  },
  'admin/user-mgmt/add-user':                       { subscriber: false, admin: true,  superuser: true  },
  'admin/access-group':                             { subscriber: false, admin: false, superuser: true  },
  'admin/access-group/manage-roles':                { subscriber: false, admin: false, superuser: true  },
  'admin/access-group/add-role':                    { subscriber: false, admin: false, superuser: true  },
  'admin/access-group/manage-access':               { subscriber: false, admin: false, superuser: true  },
  'admin/app-mgmt':                                 { subscriber: false, admin: false, superuser: true  },
  'admin/app-mgmt/manage-apps':                     { subscriber: false, admin: false, superuser: true  },
  'admin/app-mgmt/register-app':                    { subscriber: false, admin: false, superuser: true  },
  'system-monitor':                                 { subscriber: false, admin: false, superuser: true  },
  'system-monitor/open-monitor':                    { subscriber: false, admin: false, superuser: true  },
  'system-monitor/log-viewer':                      { subscriber: false, admin: false, superuser: true  },
};

export function loadMatrix() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY));
    if (stored?.__version === VERSION) {
      return { ...DEFAULT_MATRIX, ...stored };
    }
    return { ...DEFAULT_MATRIX };
  } catch {
    return { ...DEFAULT_MATRIX };
  }
}

export function saveMatrix(matrix) {
  localStorage.setItem(KEY, JSON.stringify({ ...matrix, __version: VERSION }));
}

export function canAccess(matrix, role, itemKey) {
  const row = matrix[itemKey];
  if (!row) return true; // unknown items default to open
  return row[role] !== false;
}
