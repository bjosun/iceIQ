// Firebase-felkoder till begripliga meddelanden. Utan detta visas råtexten
// ("Firebase: Error (auth/invalid-credential).") för användaren.
const KEYS: Record<string, string> = {
  'auth/invalid-credential': 'auth.errInvalidCredentials',
  'auth/wrong-password': 'auth.errInvalidCredentials',
  'auth/user-not-found': 'auth.errInvalidCredentials',
  'auth/invalid-email': 'auth.errInvalidEmail',
  'auth/email-already-in-use': 'auth.errEmailInUse',
  'auth/weak-password': 'auth.errWeakPassword',
  'auth/too-many-requests': 'auth.errTooMany',
  'auth/network-request-failed': 'auth.errNetwork',
  'auth/user-disabled': 'auth.errDisabled',
};

/** Översättningsnyckeln för en känd felkod, annars null (visa då felets egen text). */
export function authErrorKey(code: unknown): string | null {
  return typeof code === 'string' ? KEYS[code] ?? null : null;
}
