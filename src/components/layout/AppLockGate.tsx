import { useCallback, useEffect, useRef, useState } from 'react';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { appLockEnabled, RELOCK_AFTER_MS, unlockWithBiometry } from '../../utils/appLock';

// Lägger ett lås över appen när spärren är påslagen: vid start och när man
// kommer tillbaka efter en stund i bakgrunden. Syns aldrig på webben eller
// när spärren är av.
export default function AppLockGate() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [locked, setLocked] = useState<boolean>(() => appLockEnabled());
  const backgroundedAt = useRef<number | null>(null);
  const prompting = useRef(false);

  const tryUnlock = useCallback(async () => {
    if (prompting.current) return;
    prompting.current = true;
    const ok = await unlockWithBiometry(t('appLock.reason'));
    prompting.current = false;
    if (ok) setLocked(false);
  }, [t]);

  // Fråga direkt när låset visas.
  useEffect(() => {
    if (locked && user) tryUnlock();
  }, [locked, user, tryUnlock]);

  // Lås igen efter en stund i bakgrunden.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const handle = CapApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        backgroundedAt.current = Date.now();
      } else if (
        appLockEnabled() &&
        backgroundedAt.current !== null &&
        Date.now() - backgroundedAt.current >= RELOCK_AFTER_MS
      ) {
        setLocked(true);
      }
    });
    return () => {
      handle.then((h) => h.remove());
    };
  }, []);

  if (!locked || !user) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-gray-900 flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-cyan-500/15 text-cyan-300 flex items-center justify-center mb-5">
        <Lock size={28} />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">{t('appLock.lockedTitle')}</h2>
      <p className="text-sm text-gray-400 mb-6 max-w-xs">{t('appLock.lockedDesc')}</p>
      <button
        onClick={tryUnlock}
        className="w-full max-w-xs bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl transition-colors"
      >
        {t('appLock.unlock')}
      </button>
      <button
        onClick={() => { setLocked(false); logout().catch(() => {}); }}
        className="mt-3 text-sm text-gray-400 hover:text-gray-200"
      >
        {t('appLock.logout')}
      </button>
    </div>
  );
}
