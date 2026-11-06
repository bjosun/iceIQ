import { Smartphone, Check } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { isNativeApp } from '../../utils/platform';
import { appStoreAvailable, appStoreUrl } from '../../utils/appStore';

// "Ice IQ finns som app": en kort sektion på startsidan med knapp (telefon) och
// QR-kod (dator). Visas inte i appen själv, och inte för svenska besökare förrän
// Sverige är öppet i App Store (se appStoreAvailable).
export default function AppSection() {
  const { t, language } = useLanguage();
  if (isNativeApp || !appStoreAvailable(language)) return null;

  const points = [t('appSection.p1'), t('appSection.p2'), t('appSection.p3')];

  return (
    <section className="py-20 bg-gray-900 relative z-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-gray-800/70 to-gray-900/70 p-8 md:p-12 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 text-cyan-400 text-sm font-semibold mb-3">
              <Smartphone size={18} />
              {t('appSection.badge')}
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">{t('appSection.title')}</h2>
            <p className="text-gray-300 mb-5">{t('appSection.body')}</p>
            <ul className="space-y-2 mb-7 inline-block text-left">
              {points.map((p) => (
                <li key={p} className="flex items-start gap-2 text-gray-200 text-sm">
                  <Check size={16} className="text-green-400 mt-0.5 shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
            <div>
              <a
                href={appStoreUrl('home_section')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold text-lg transition-all hover:bg-gray-200"
              >
                {t('footer.appStore')}
              </a>
              <p className="text-xs text-gray-500 mt-3">{t('appSection.platform')}</p>
            </div>
          </div>

          {/* QR-koden är till för den som sitter vid datorn; på telefon är knappen enklare. */}
          <div className="hidden md:flex flex-col items-center shrink-0">
            <img
              src="/app-qr.svg"
              alt={t('appSection.qrAlt')}
              width={176}
              height={176}
              className="rounded-2xl bg-white p-2"
              loading="lazy"
            />
            <p className="text-xs text-gray-400 mt-3 max-w-[11rem] text-center">{t('appSection.qrHint')}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
