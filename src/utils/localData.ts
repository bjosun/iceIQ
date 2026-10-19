// Det som ligger sparat på enheten och hör till en användare (inte till enheten).
// Rensas när kontot raderas och när någon annan loggar in på samma enhet, så att
// till exempel senast använda lag, ett Swish-nummer eller ett utkast aldrig
// följer med till nästa konto.

const USER_KEYS = [
  'lastUsedTeam',
  'iceiq-match-draft',
  'iceiq-active-coach-chat',
  'iceiq-swish-numbers',
  'iceiq-default-bonus-factor',
];
const USER_PREFIXES = ['lastUsedTeam:', 'iceiq-focus-', 'iceiq-ai-consent'];
const LAST_UID_KEY = 'iceiq-last-uid';

export function clearUserLocalData(): void {
  try {
    for (const key of USER_KEYS) localStorage.removeItem(key);
    for (const key of Object.keys(localStorage)) {
      if (USER_PREFIXES.some((p) => key.startsWith(p))) localStorage.removeItem(key);
    }
  } catch { /* privat läge eller blockerad lagring: inget att rensa */ }
}

export function forgetLastUser(): void {
  try {
    localStorage.removeItem(LAST_UID_KEY);
  } catch { /* se ovan */ }
}

/** Anropas vid inloggning: byter konto på enheten rensas det förra kontots data. */
export function switchLocalUser(uid: string): void {
  try {
    const last = localStorage.getItem(LAST_UID_KEY);
    if (last && last !== uid) clearUserLocalData();
    localStorage.setItem(LAST_UID_KEY, uid);
  } catch { /* se ovan */ }
}
