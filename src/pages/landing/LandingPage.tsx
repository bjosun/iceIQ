import { Link } from 'react-router-dom';
import { ArrowRight, LucideIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSEO } from '../../hooks/useSEO';
import guides from '../../data/guides.json';
import landingSections from '../../data/landingSections.json';

interface LandingSection {
  heading: string;
  paragraphs: string[];
  link?: { text: string; path: string };
}

export interface LandingFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface LandingFAQ {
  question: string;
  answer: string;
}

export interface LandingPageProps {
  /** <title> and canonical target. Keep the target keyword near the front. */
  seoTitle: string;
  seoDescription: string;
  /** Route path this page lives at, e.g. "/hockey-tracking-app". */
  path: string;
  badge: string;
  h1: React.ReactNode;
  intro: string;
  features: LandingFeature[];
  faqs: LandingFAQ[];
  ctaHeading: string;
  ctaDesc: string;
}

// Shared shell for English keyword-targeted landing pages. Each route file
// is just copy + a features/FAQ list passed in here — see useSEO for why
// every page needs its own title/description/canonical, and the sitemap
// comment for why only real, loggable-in-without-auth pages belong here.
export default function LandingPage({
  seoTitle,
  seoDescription,
  path,
  badge,
  h1,
  intro,
  features,
  faqs,
  ctaHeading,
  ctaDesc,
}: LandingPageProps) {
  const { user } = useAuth();
  useSEO({ title: seoTitle, description: seoDescription, path });

  const startState = user ? undefined : { isSignup: true };
  // Long-form copy and related-guide links come from src/data/, shared with
  // scripts/generate-landing-pages.mjs so the static HTML crawlers read and
  // the React page can't drift apart.
  const sections: LandingSection[] =
    (landingSections as Record<string, LandingSection[]>)[path.replace(/^\//, '')] ?? [];
  const relatedGuides = guides.filter((guide) => guide.path !== path);

  return (
    <div>
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/15 border border-primary-400/30 backdrop-blur-md mb-8">
            <span className="text-primary-300 text-sm font-semibold">{badge}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
            {h1}
          </h1>

          <p className="text-lg sm:text-xl text-gray-300 mb-10 leading-relaxed max-w-3xl mx-auto">
            {intro}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/dashboard"
              state={startState}
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-primary-600 to-cyan-600 hover:from-primary-500 hover:to-cyan-500 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-primary-500/25"
            >
              {user ? 'Go to Dashboard' : 'Try It Free'}
              <ArrowRight className="ml-2" size={20} />
            </Link>
            <Link
              to="/#pricing"
              className="inline-flex items-center justify-center px-8 py-4 bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold text-lg transition-all border border-white/10"
            >
              View Plans
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-800/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50"
                >
                  <div className="mb-4 p-3 bg-gray-900 w-fit rounded-xl">
                    <Icon className="text-primary-400" size={24} />
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-2">{feature.title}</h2>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {sections.length > 0 && (
        <section className="py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            {sections.map((section) => (
              <div key={section.heading}>
                <h2 className="text-2xl font-bold text-white mb-4">{section.heading}</h2>
                <div className="space-y-4">
                  {section.paragraphs.map((paragraph, index) => (
                    <p key={index} className="text-gray-300 leading-relaxed">{paragraph}</p>
                  ))}
                </div>
                {section.link && (
                  <Link
                    to={section.link.path}
                    className="inline-flex items-center mt-4 text-primary-400 hover:text-primary-300 font-semibold"
                  >
                    {section.link.text}
                    <ArrowRight className="ml-1" size={16} />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="py-20 bg-gray-800/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-10 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-8">
            {faqs.map((faq, index) => (
              <div key={index}>
                <h3 className="text-lg font-semibold text-white mb-2">{faq.question}</h3>
                <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <nav aria-label="More guides" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white mb-6">More guides</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {relatedGuides.map((guide) => (
              <li key={guide.path}>
                <Link
                  to={guide.path}
                  className="flex items-center justify-between h-full px-4 py-3 rounded-xl border border-gray-700/50 bg-gray-800/40 text-gray-200 hover:text-white hover:border-primary-400/50 transition-colors"
                >
                  <span>{guide.en}</span>
                  <ArrowRight className="ml-2 shrink-0 text-primary-400" size={16} />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </section>

      <section className="py-20 bg-gray-800/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">{ctaHeading}</h2>
          <p className="text-gray-300 mb-8 text-lg max-w-lg mx-auto">{ctaDesc}</p>
          <Link
            to="/dashboard"
            state={startState}
            className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-primary-600 to-cyan-600 hover:from-primary-500 hover:to-cyan-500 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-primary-500/25"
          >
            {user ? 'Go to Dashboard' : 'Try It Free'}
            <ArrowRight className="ml-2" size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
}
