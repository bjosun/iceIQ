import { Link } from 'react-router-dom';
import { ArrowRight, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSEO } from '../../hooks/useSEO';
import previewEn from '../../assets/images/game-tracking-template-preview-en.png';
import previewSv from '../../assets/images/game-tracking-template-preview-sv.png';

// Ungated lead-magnet landing page. No email/signup wall on the download —
// the PDF itself carries the app pitch (see marketing/lead-magnets/) and
// gating a free hockey template behind a signup form would cut against the
// whole point of it (low-friction goodwill for FB-group distribution, incl.
// Swedish groups — see [[growth-hacking-ideas-iceiq]] in project memory).
// Bilingual via the site's existing language toggle (unlike the English-only
// SEO keyword pages in this folder), since this is distributed to both
// English and Swedish communities, not aimed at one language's search intent.
export default function GameTrackingTemplate() {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const isSwedish = language === 'sv';
  const pdfHref = isSwedish
    ? '/downloads/ice-iq-game-tracking-template-sv.pdf'
    : '/downloads/ice-iq-game-tracking-template-en.pdf';
  const previewSrc = isSwedish ? previewSv : previewEn;

  useSEO({
    title: isSwedish
      ? 'Gratis matchspårningsmall för hockey (PDF) | Ice IQ'
      : 'Free Hockey Game Tracking Template (PDF) | Ice IQ',
    description: isSwedish
      ? 'Ladda ner en gratis, utskrivbar matchspårningsmall för hockey — skottkarta, tekningar och bytesschema på en sida. Inget konto behövs.'
      : 'Download a free, printable hockey game tracking template — shot chart, faceoffs, and shift chart on one page. No account needed.',
    path: '/game-tracking-template',
  });

  const startState = user ? undefined : { isSignup: true };

  return (
    <div>
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/15 border border-primary-400/30 backdrop-blur-md mb-8">
            <span className="text-primary-300 text-sm font-semibold">{t('leadMagnet.badge')}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
            {t('leadMagnet.h1')}
          </h1>

          <p className="text-lg sm:text-xl text-gray-300 mb-10 leading-relaxed max-w-3xl mx-auto">
            {t('leadMagnet.intro')}
          </p>

          <a
            href={pdfHref}
            download
            className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-primary-600 to-cyan-600 hover:from-primary-500 hover:to-cyan-500 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-primary-500/25"
          >
            <Download className="mr-2" size={20} />
            {t('leadMagnet.downloadBtn')}
          </a>
          <p className="text-gray-500 text-sm mt-3">{t('leadMagnet.fileNote')}</p>
        </div>
      </section>

      <section className="pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-white/10 bg-white p-2 shadow-2xl">
            <img
              src={previewSrc}
              alt={t('leadMagnet.previewAlt')}
              className="w-full h-auto rounded-lg"
            />
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-800/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">{t('leadMagnet.ctaHeading')}</h2>
          <p className="text-gray-300 mb-8 text-lg max-w-lg mx-auto">{t('leadMagnet.ctaDesc')}</p>
          <Link
            to="/dashboard"
            state={startState}
            className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-primary-600 to-cyan-600 hover:from-primary-500 hover:to-cyan-500 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-primary-500/25"
          >
            {t('leadMagnet.ctaBtn')}
            <ArrowRight className="ml-2" size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
}
