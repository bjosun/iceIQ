import { Link } from 'react-router-dom';
import { LifeBuoy, Mail } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSEO } from '../hooks/useSEO';
import { SUPPORT_EMAIL, COMPANY_NAME, COMPANY_COUNTRY, COMPANY_ORG_NR } from '../utils/contact';

interface Faq {
  q: string;
  a: string;
}

// Supportsidan Apple kräver (App Store Connect → Support URL). Texten beskriver
// bara det som finns i appen och på webben, utan löften om svarstider.
const CONTENT = {
  en: {
    title: 'Support',
    intro: 'Questions, bugs or ideas? Email us and we will reply by email.',
    contactTitle: 'Contact us',
    contactBody: 'Include the email you sign in with and what you were doing when it happened. Never send your password.',
    faqTitle: 'Common questions',
    faqs: [
      {
        q: 'How do I delete my account and all data?',
        a: 'Open My Account and choose "Delete account and all data". You confirm by typing DELETE. Your player data is removed with the account.',
      },
      {
        q: 'How do I download a copy of my information?',
        a: 'Open My Account and tap "Download my information". You get a file with your players and games.',
      },
      {
        q: 'How do I switch off a player link?',
        a: 'Open the player link for the player and tap "Switch this link off". Anyone who has the link can no longer open it. You can create a new link later.',
      },
      {
        q: 'How do I withdraw my consent to the AI coach?',
        a: 'Open My Account and tap "Withdraw my consent to the AI coach". Nothing more is sent to the coach after that, and you can choose to erase what the coach has remembered.',
      },
      {
        q: 'Where do I buy or manage a subscription?',
        a: 'Subscriptions are bought and managed on our website, iceiq.app, after signing in. A subscription bought there works in the iPhone app too, with the same account.',
      },
      {
        q: 'I cannot sign in. What do I do?',
        a: 'Use the same method you signed up with (email and password, Google or Apple). If you forgot your password, use the reset link on the sign-in page. If it still fails, email us.',
      },
    ] as Faq[],
    moreTitle: 'More',
    privacy: 'Privacy policy',
    terms: 'Terms of service',
    company: 'Ice IQ is provided by',
  },
  sv: {
    title: 'Support',
    intro: 'Frågor, buggar eller idéer? Mejla oss så svarar vi via e-post.',
    contactTitle: 'Kontakta oss',
    contactBody: 'Skriv vilken e-postadress du loggar in med och vad du gjorde när det hände. Skicka aldrig ditt lösenord.',
    faqTitle: 'Vanliga frågor',
    faqs: [
      {
        q: 'Hur raderar jag mitt konto och all data?',
        a: 'Öppna Mitt konto och välj "Radera konto och all data". Du bekräftar genom att skriva DELETE. Spelarnas data tas bort tillsammans med kontot.',
      },
      {
        q: 'Hur laddar jag ner en kopia av mina uppgifter?',
        a: 'Öppna Mitt konto och tryck på "Ladda ner mina uppgifter". Du får en fil med dina spelare och matcher.',
      },
      {
        q: 'Hur stänger jag en spelarlänk?',
        a: 'Öppna spelarens länk och tryck på "Stäng länken". Den som har länken kommer inte längre in. Du kan skapa en ny länk senare.',
      },
      {
        q: 'Hur återkallar jag mitt samtycke till AI-coachen?',
        a: 'Öppna Mitt konto och tryck på "Återkalla mitt samtycke till AI-coachen". Därefter skickas inget mer till coachen, och du kan välja att radera det coachen har kommit ihåg.',
      },
      {
        q: 'Var köper eller hanterar jag en prenumeration?',
        a: 'Prenumerationer köps och hanteras på vår webbplats iceiq.app efter inloggning. En prenumeration som köpts där gäller även i iPhone-appen med samma konto.',
      },
      {
        q: 'Jag kan inte logga in. Vad gör jag?',
        a: 'Använd samma metod som du registrerade dig med (e-post och lösenord, Google eller Apple). Har du glömt lösenordet använder du återställningslänken på inloggningssidan. Fungerar det ändå inte, mejla oss.',
      },
    ] as Faq[],
    moreTitle: 'Mer',
    privacy: 'Integritetspolicy',
    terms: 'Användarvillkor',
    company: 'Ice IQ tillhandahålls av',
  },
};

export default function Support() {
  const { language } = useLanguage();
  const c = language === 'sv' ? CONTENT.sv : CONTENT.en;

  useSEO({
    title: language === 'sv' ? 'Support – Ice IQ' : 'Support – Ice IQ',
    description: c.intro,
    path: '/support',
  });

  return (
    <div className="bg-gray-900 min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-800 rounded-2xl p-6 sm:p-8">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
              <LifeBuoy className="text-cyan-400" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">{c.title}</h1>
            <p className="text-gray-300">{c.intro}</p>
          </div>

          <section className="bg-gray-900/60 rounded-xl p-5 mb-10">
            <h2 className="text-xl font-semibold text-white mb-2">{c.contactTitle}</h2>
            <p className="text-gray-400 text-sm mb-4">{c.contactBody}</p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-2.5 rounded-xl transition-colors"
            >
              <Mail size={18} />
              {SUPPORT_EMAIL}
            </a>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-4">{c.faqTitle}</h2>
            <div className="space-y-3">
              {c.faqs.map(f => (
                <details key={f.q} className="bg-gray-900/60 rounded-xl p-4 group">
                  <summary className="cursor-pointer font-semibold text-white list-none flex justify-between gap-3">
                    <span>{f.q}</span>
                    <span className="text-gray-500 group-open:rotate-45 transition-transform">+</span>
                  </summary>
                  <p className="text-gray-300 text-sm mt-3">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">{c.moreTitle}</h2>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <Link to="/privacy" className="text-cyan-400 hover:text-cyan-300">{c.privacy}</Link>
              <Link to="/terms" className="text-cyan-400 hover:text-cyan-300">{c.terms}</Link>
            </div>
            <p className="text-gray-500 text-xs mt-5">
              {c.company} {COMPANY_NAME}, {COMPANY_COUNTRY} · {COMPANY_ORG_NR}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
