const KEY = 'user_profile';

const DEFAULTS = {
  firstName:    '',
  lastName:     '',
  suffix:       '',
  email:        '',
  phone:        '',
  notifEmail:   false,
  notifNtfy:    false,
  tradingStyle: 'Moderate',
  index:        'SPX',
  deltaTrigger: 0.35,
  pivotPeriods: ['Weekly'],
};

export function loadProfile() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY)) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveProfile(partial) {
  const current = loadProfile();
  localStorage.setItem(KEY, JSON.stringify({ ...current, ...partial }));
}
