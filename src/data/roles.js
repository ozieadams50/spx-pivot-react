const CUSTOM_KEY = 'custom_roles';

export const FIXED_ROLES = [
  {
    key:              'subscriber',
    name:             'Subscriber',
    shortDescription: 'Standard subscriber with access to their subscribed apps.',
    definition:       'A Subscriber has access to the platform applications they have an active subscription for. They can view and update their profile, notification settings, and SPX trade preferences. They cannot access any administrative functions, user management, or system monitoring.',
    fixed:            true,
  },
  {
    key:              'admin',
    name:             'Admin',
    shortDescription: 'Administrator with access to app management and user administration.',
    definition:       'An Admin can manage platform subscribers, configure applications, set market sentiment, and manage access groups. They have full access to the SPX Pivot app and the entire Admin section. Admins can create and manage Subscriber accounts but cannot assign Admin or Super User roles, and do not have access to System Monitor.',
    fixed:            true,
  },
  {
    key:              'superuser',
    name:             'Super User',
    shortDescription: 'Full platform access including system monitoring and role management.',
    definition:       'A Super User has unrestricted access to every feature on the platform including System Monitor, Log Viewer, and the Access Group management tools. They are the only role that can assign Admin or Super User roles to other users and can modify the access control matrix.',
    fixed:            true,
  },
];

export function loadCustomRoles() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_KEY)) || [];
  } catch { return []; }
}

export function saveCustomRoles(roles) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(roles));
}

export function loadAllRoles() {
  return [...FIXED_ROLES, ...loadCustomRoles()];
}
