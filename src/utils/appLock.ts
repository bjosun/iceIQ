// Valfri appspärr med Face ID / Touch ID (eller enhetens kod som reserv).
// Gäller bara iPhone-appen och är avstängd från början: den som vill ha den
// slår på den i profilen. Sessionen ligger kvar på telefonen — spärren är ett
// lås ovanpå, inte en ny inloggning, och fungerar likadant oavsett om man
// loggat in med e-post, Google eller Apple.
import { Capacitor } from '@capacitor/core';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';

const PREF_KEY = 'iceiq-app-lock';
// Kort bakgrundstid (byta app, svara på ett samtal) ska inte låsa om.
export const RELOCK_AFTER_MS = 30_000;

export function appLockEnabled(): boolean {
  try {
    return Capacitor.isNativePlatform() && localStorage.getItem(PREF_KEY) === 'on';
  } catch {
    return false;
  }
}

export function setAppLockEnabled(on: boolean): void {
  try {
    localStorage.setItem(PREF_KEY, on ? 'on' : 'off');
  } catch {
    /* blockerad lagring: då går spärren inte att spara, och är därför av */
  }
}

// Finns Face ID/Touch ID (eller enhetskod) att låsa med?
export async function appLockAvailable(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const info = await BiometricAuth.checkBiometry();
    return info.isAvailable || info.deviceIsSecure;
  } catch {
    return false;
  }
}

// true om användaren bekräftade, false om hen avbröt eller misslyckades.
export async function unlockWithBiometry(reason: string): Promise<boolean> {
  try {
    await BiometricAuth.authenticate({
      reason,
      allowDeviceCredential: true,
      iosFallbackTitle: '',
    });
    return true;
  } catch {
    return false;
  }
}
