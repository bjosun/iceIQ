import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { applyAdConsent } from '../utils/helpers';

/**
 * Annonsdatasamtycke — samma kontrakt som company_template/components/CookieConsent:
 * elementet id="sv-cookie-consent" renderas ALLTID (hidden tills besökaren saknar
 * svar) så att ads_tools readiness-check kan verifiera markören mot den byggda
 * sajten. "Ja" → cookie_consent=all → gclid får fångas. "Nej" → strict.
 * Återöppnas via custom-eventet 'sv:reopen-consent' (t.ex. footerns
 * integritetsinställningar).
 */
export default function CookieConsent() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem('cookie_consent')) setVisible(true);
    } catch {
      setVisible(true);
    }
    const reopen = () => setVisible(true);
    window.addEventListener('sv:reopen-consent', reopen);
    return () => window.removeEventListener('sv:reopen-consent', reopen);
  }, []);

  const answer = (mode: 'strict' | 'all') => {
    try { localStorage.setItem('cookie_consent', mode) } catch { /* ingen lagring */ }
    applyAdConsent(mode === 'all');
    setVisible(false);
  };

  return (
    <div
      id="sv-cookie-consent"
      hidden={!visible}
      className="fixed bottom-0 left-0 right-0 z-[60] bg-gray-900 border-t border-cyan-500/30 px-4 sm:px-6 py-4 shadow-lg"
    >
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-sm text-gray-300">
          {t('cookieConsentText')}{' '}
          <Link to="/privacy" className="underline text-cyan-400 hover:text-cyan-300">
            {t('privacyLink')}
          </Link>
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => answer('strict')}
            className="px-4 py-2 border border-gray-600 hover:border-gray-400 text-gray-300 text-sm rounded-lg transition-colors"
          >
            {t('cookieConsentNo')}
          </button>
          <button
            onClick={() => answer('all')}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-medium text-sm rounded-lg transition-colors"
          >
            {t('cookieConsentYes')}
          </button>
        </div>
      </div>
    </div>
  );
}
