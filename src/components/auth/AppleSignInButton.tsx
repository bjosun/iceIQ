import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Button from '../ui/Button';

interface AppleSignInButtonProps {
  onError: (message: string) => void;
}

// Visas bara i iOS-appen. Apple kräver "Sign in with Apple" när appen
// erbjuder Google-inloggning (guideline 4.8).
export default function AppleSignInButton({ onError }: AppleSignInButtonProps) {
  const { loginWithApple } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  if (Capacitor.getPlatform() !== 'ios') return null;

  const handleClick = async () => {
    onError('');
    setLoading(true);
    try {
      await loginWithApple();
    } catch (err: any) {
      // Användaren som avbryter Apple-dialogen är inget fel att visa.
      const cancelled = /cancel/i.test(`${err?.code ?? ''} ${err?.message ?? ''}`);
      if (!cancelled) onError(err?.message || 'Apple sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3">
      <Button variant="secondary" onClick={handleClick} loading={loading} fullWidth type="button">
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M16.37 12.63c-.02-2.2 1.8-3.26 1.88-3.31-1.02-1.5-2.62-1.7-3.19-1.73-1.36-.14-2.65.8-3.34.8-.69 0-1.75-.78-2.88-.76-1.48.02-2.85.86-3.61 2.19-1.54 2.67-.39 6.63 1.1 8.8.73 1.06 1.6 2.25 2.74 2.21 1.1-.04 1.51-.71 2.84-.71 1.33 0 1.7.71 2.86.69 1.18-.02 1.93-1.08 2.65-2.14.84-1.23 1.18-2.42 1.2-2.48-.03-.01-2.3-.88-2.25-3.56zM14.2 6.1c.6-.73 1.01-1.75.9-2.76-.87.04-1.92.58-2.54 1.31-.56.65-1.05 1.69-.92 2.68.97.08 1.96-.5 2.56-1.23z"/>
        </svg>
        {t('continueWithApple')}
      </Button>
    </div>
  );
}
