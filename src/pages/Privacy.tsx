import { useLanguage } from '../contexts/LanguageContext';
import { useSEO } from '../hooks/useSEO';
import { Shield, Lock, Eye, Database } from 'lucide-react';
import { PRIVACY_EMAIL, COMPANY_NAME, COMPANY_COUNTRY, COMPANY_URL, COMPANY_ORG_NR } from '../utils/contact';

// Integritetspolicyn på svenska och engelska. De två språken ligger sida vid
// sida i samma fil så att en ändring i den ena syns bredvid den andra.
// Avsnitten har samma ordning och rubriker i båda, så en jurist kan jämföra
// dem rad för rad. Rättslig grund och tredjelandsmekanism är utkast till
// jurist (se docs/gdpr-art6-mapping.md).

type Block = { p: string } | { ul: string[] };
interface Section {
  title: string;
  blocks: Block[];
}

interface PrivacyContent {
  lastUpdated: string;
  principles: { title: string; description: string }[];
  sections: Section[];
  contact: {
    title: string;
    controller: (company: string, orgNr: string, country: string) => string;
    questions: string;
    complaint: string;
  };
}

const EN: PrivacyContent = {
  lastUpdated: 'Last updated: 16 October 2026',
  principles: [
    { title: 'Data Protection', description: 'Our cloud providers encrypt data in transit and at rest.' },
    {
      title: 'Access Control',
      description:
        "Your account is protected by your sign-in. If you create a player link, anyone who has that link can open that player's page, so treat it like a password.",
    },
    {
      title: 'Transparency',
      description: "We're clear about what data we collect and how we use it. No hidden tracking.",
    },
    {
      title: 'Data Ownership',
      description:
        'You can download a copy of your data and delete your account and all player data yourself in the app.',
    },
  ],
  sections: [
    {
      title: 'Information We Collect',
      blocks: [
        { p: 'Ice IQ is meant for adults: parents, guardians and coaches. We collect the following:' },
        {
          ul: [
            'Account information: email address and name, and the sign-in method you use (email, Google or Apple).',
            'Player data that you enter about a player, who is often a child: name, team, game statistics, points and, if you use Money Mode, the reward balance.',
            "The player's email address, only if you choose to add one so the player can be sent an analysis. It is not needed to use the Service.",
            'Content you create, such as saved coach conversations, and short notes the AI coach keeps about the player over time so it can give more personal advice (see AI Coach below).',
            "Earlier versions saved the dates when a player had done a mental routine. In the current version the player's page does not save anything; older dates remain until you delete the player.",
            'The link (a long random address) that lets a player open their own page without logging in.',
            'Subscription status (plan and renewal date). Payment information when you subscribe on the web is handled by Stripe and we never see your card number.',
            'Basic information about how you found us (for example the campaign in a link you opened), to understand which channels work.',
            'A record of when you agreed to the AI coach, so that we can show that consent was given.',
          ],
        },
        {
          p: 'In the iPhone app, some settings and a copy of your data are stored on your phone so the app opens quickly. If you turn on the app lock, Face ID or Touch ID is handled entirely by iOS. We never receive or store biometric data. A player\'s mobile number for the Swish shortcut is stored only on your device and is never sent to us.',
        },
      ],
    },
    {
      title: 'How We Use Your Information',
      blocks: [
        { p: 'Your information is used to:' },
        {
          ul: [
            'Provide and maintain the Service',
            "Create the AI coach's advice and the listen clips",
            'Process your subscription payments',
            'Send service messages, a weekly summary and occasional reminders by email',
            'Improve and develop new features',
            'Ensure security and prevent fraud',
          ],
        },
      ],
    },
    {
      title: 'Legal Basis (GDPR)',
      blocks: [
        { p: 'Under the GDPR we need a legal basis for each use of personal data. Ours are:' },
        {
          ul: [
            'Contract (Article 6.1 b): your account, sign-in, subscription and service messages. We need this to provide the Service you signed up for.',
            "Consent (Article 6.1 a): the player's data that you enter, the player link, the AI coach and its notes, and the listen clips. As a parent or guardian you confirm that you are the player's guardian or have the guardian's permission when you add a player. You can withdraw your consent for the AI coach at any time in the app, and by deleting a player you remove that player's data.",
            'Legal obligation (Article 6.1 c): keeping accounting records for payments, as accounting law requires.',
            'Legitimate interest (Article 6.1 f): security and fraud prevention, a weekly summary and reminders to help you get started, and understanding which channels bring users. You can switch off the weekly summary in the app, or email us to stop other messages.',
          ],
        },
      ],
    },
    {
      title: 'Data Security',
      blocks: [
        {
          p: 'We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.',
        },
      ],
    },
    {
      title: 'Data Retention',
      blocks: [
        {
          p: 'We keep your account and player data until you delete your account. Deleting your account in the app removes your players, games, saved coach conversations and the account itself. Payment records may be kept as long as accounting law requires (in Sweden normally seven years). The consent record is kept for as long as the consent applies. We do not currently delete inactive accounts automatically. Audio for the listen clips is not stored.',
        },
      ],
    },
    {
      title: 'Your Rights',
      blocks: [
        { p: 'You have the right to:' },
        {
          ul: [
            'Access your personal data',
            'Correct inaccurate data',
            'Request deletion of your data',
            'Restrict how your data is used',
            'Receive a copy of your data in a common format (data portability). In the app: My account, Your information.',
            'Object to processing that is based on legitimate interest',
            'Withdraw your consent at any time, without affecting what was done before. In the app: My account, Your information.',
            'Switch off a player link (in the app, in the dialog that shows the link)',
            "Lodge a complaint with the supervisory authority. In Sweden this is the Swedish Authority for Privacy Protection (IMY), imy.se.",
          ],
        },
      ],
    },
    {
      title: 'AI Coach',
      blocks: [
        {
          p: "When you ask the AI coach for an analysis, we send the player's name, the game statistics and points you have logged, a short history, and your question to Google Cloud (Vertex AI), processed in the EU, in order to produce the answer. Nothing is sent until you ask, and only after you have agreed to it in the app. We do not send your email address or payment details. You can withdraw your consent at any time in the app (My account, Your information). The coach then stops using the player's information, and you can have the saved coach conversations and notes deleted. You can still log games without the coach.",
        },
        {
          p: "To make the advice more personal over time, the coach saves a short list of dated notes about the player (what the player is working on, strengths, recurring patterns), at most eight at a time. You can read, clear or switch off these notes at any time in the app (the notes button in the coach). They are part of the player's data and are removed when you delete the player or your account. The coach's advice is generated automatically; it is guidance, not a decision about the player.",
        },
      ],
    },
    {
      title: 'Third-Party Services',
      blocks: [
        { p: 'We use these providers to run the service:' },
        {
          ul: [
            'Google (Firebase and Google Cloud, including Vertex AI and Text-to-Speech): hosting, sign-in, database, the AI coach and the listen clips',
            'Google and Apple: if you choose to sign in with them',
            'Stripe: payments for web subscriptions',
            'Resend: delivery of service messages and the weekly summary by email',
          ],
        },
        {
          p: 'Our database is stored in the EU (a European multi-region), and the AI coach and the listen clips are processed in the EU. Some of our servers (for example the part that handles payments and some emails) run in the United States, and Stripe and Resend are US-based companies. These providers act on our behalf and may only use the data to deliver their service to us.',
        },
        {
          p: "When a player opens the listen page, the short texts that are read out (for example the points of a game and the coach's advice, without the player's name) are turned into speech by Google Cloud Text-to-Speech, processed in the EU. We do not keep a copy of the audio. We also keep anonymous daily counters of how the listen page is used (for example how many play it and which voice is chosen). They contain no names, links or device identifiers.",
        },
        {
          p: "We do not sell personal data and we do not use it to track you across other companies' apps or websites.",
        },
      ],
    },
    {
      title: 'Transfers Outside the EU/EEA',
      blocks: [
        {
          p: 'When personal data is transferred outside the EU/EEA, for example to our US-based providers, we rely on the safeguards the GDPR requires, such as the EU–US Data Privacy Framework or the European Commission\'s standard contractual clauses. Contact us if you want more information.',
        },
      ],
    },
    {
      title: 'Automated Decisions',
      blocks: [
        {
          p: "We do not make decisions about you or the player that have legal or similarly significant effects based solely on automated processing. The AI coach's advice is guidance that you decide how to use.",
        },
      ],
    },
    {
      title: 'Deleting Your Data',
      blocks: [
        {
          p: 'You can delete your account and all player data yourself in the app: open your account, choose delete, and confirm. This removes your players, games and account. You can also email us (see below) and we will do it for you.',
        },
      ],
    },
    {
      title: "Children's Privacy",
      blocks: [
        {
          p: 'Accounts are for adults only, and children do not create accounts. A parent or guardian can choose to share a private, read-only page with their child (the player link). That page does not ask the child for anything and does not save anything from the child; it only shows the player's own results and can read them aloud. Parents and guardians may record information about their own child as a player, for example name and game statistics. We treat that information with extra care, use it only to provide the service you ask for, and do not use it for advertising. If you believe a child has created an account, contact us and we will remove it.',
        },
      ],
    },
  ],
  contact: {
    title: 'Contact Us',
    controller: (company, orgNr, country) =>
      `The data controller for Ice IQ is ${company}, company reg. no. ${orgNr}, registered in ${country}`,
    questions:
      'If you have any questions about this Privacy Policy, or want to exercise any of the rights above, contact us at',
    complaint:
      'You can also lodge a complaint with the Swedish Authority for Privacy Protection (IMY), imy.se.',
  },
};

const SV: PrivacyContent = {
  lastUpdated: 'Senast uppdaterad: 16 oktober 2026',
  principles: [
    { title: 'Dataskydd', description: 'Våra molnleverantörer krypterar data under överföring och vid lagring.' },
    {
      title: 'Åtkomstkontroll',
      description:
        'Ditt konto skyddas av din inloggning. Skapar du en spelarlänk kan alla som har länken öppna spelarens sida, så behandla den som ett lösenord.',
    },
    {
      title: 'Öppenhet',
      description: 'Vi är tydliga med vilka uppgifter vi samlar in och hur vi använder dem. Ingen dold spårning.',
    },
    {
      title: 'Du äger dina uppgifter',
      description:
        'Du kan ladda ner en kopia av dina uppgifter och själv radera ditt konto och all spelardata i appen.',
    },
  ],
  sections: [
    {
      title: 'Uppgifter vi samlar in',
      blocks: [
        { p: 'Ice IQ är till för vuxna: föräldrar, vårdnadshavare och tränare. Vi samlar in följande:' },
        {
          ul: [
            'Kontouppgifter: e-postadress och namn, samt vilken inloggningsmetod du använder (e-post, Google eller Apple).',
            'Spelardata som du lägger in om en spelare, som ofta är ett barn: namn, lag, matchstatistik, poäng och, om du använder Money Mode, belöningssaldot.',
            'Spelarens e-postadress, bara om du väljer att lägga till en så att spelaren kan få en analys. Den behövs inte för att använda tjänsten.',
            'Innehåll du skapar, till exempel sparade coachsamtal, och korta anteckningar som AI-coachen för om spelaren över tid för att kunna ge mer personliga råd (se AI-coachen nedan).',
            'Tidigare versioner sparade datum då en spelare gjort en mental rutin. I den nuvarande versionen sparar spelarens sida ingenting; äldre datum finns kvar tills du raderar spelaren.',
            'Länken (en lång slumpmässig adress) som låter en spelare öppna sin egen sida utan att logga in.',
            'Prenumerationsstatus (plan och förnyelsedatum). Betalningsuppgifter när du prenumererar på webben hanteras av Stripe, och vi ser aldrig ditt kortnummer.',
            'Grundläggande uppgifter om hur du hittade oss (till exempel kampanjen i en länk du öppnade), för att förstå vilka kanaler som fungerar.',
            'En logg över när du godkände AI-coachen, så att vi kan visa att samtycke har getts.',
          ],
        },
        {
          p: 'I iPhone-appen sparas vissa inställningar och en kopia av dina uppgifter på telefonen så att appen öppnas snabbt. Slår du på applåset sköts Face ID eller Touch ID helt av iOS. Vi tar aldrig emot eller sparar biometriska uppgifter. En spelares mobilnummer för Swish-genvägen sparas bara på din enhet och skickas aldrig till oss.',
        },
      ],
    },
    {
      title: 'Hur vi använder dina uppgifter',
      blocks: [
        { p: 'Dina uppgifter används för att:' },
        {
          ul: [
            'Tillhandahålla och underhålla tjänsten',
            'Skapa AI-coachens råd och lyssnaklippen',
            'Hantera betalningar för din prenumeration',
            'Skicka servicemeddelanden, en veckosammanfattning och enstaka påminnelser via e-post',
            'Förbättra tjänsten och utveckla nya funktioner',
            'Upprätthålla säkerheten och förhindra missbruk',
          ],
        },
      ],
    },
    {
      title: 'Rättslig grund (GDPR)',
      blocks: [
        { p: 'Enligt GDPR behöver vi en rättslig grund för varje användning av personuppgifter. Våra är:' },
        {
          ul: [
            'Avtal (artikel 6.1 b): ditt konto, inloggning, prenumeration och servicemeddelanden. Det behövs för att vi ska kunna tillhandahålla tjänsten du registrerat dig för.',
            'Samtycke (artikel 6.1 a): spelarens uppgifter som du lägger in, spelarlänken, AI-coachen och dess anteckningar samt lyssnaklippen. Som förälder eller vårdnadshavare bekräftar du när du lägger till en spelare att du är spelarens vårdnadshavare eller har vårdnadshavarens tillåtelse. Du kan när som helst återkalla ditt samtycke till AI-coachen i appen, och genom att radera en spelare tar du bort spelarens uppgifter.',
            'Rättslig förpliktelse (artikel 6.1 c): att spara räkenskapsinformation om betalningar, som bokföringslagen kräver.',
            'Berättigat intresse (artikel 6.1 f): säkerhet och förebyggande av missbruk, en veckosammanfattning och påminnelser som hjälper dig komma igång, samt att förstå vilka kanaler som ger användare. Du kan stänga av veckosammanfattningen i appen, eller mejla oss för att få andra meddelanden att upphöra.',
          ],
        },
      ],
    },
    {
      title: 'Datasäkerhet',
      blocks: [
        {
          p: 'Vi vidtar lämpliga tekniska och organisatoriska åtgärder för att skydda dina personuppgifter mot obehörig åtkomst, ändring, spridning eller förstörelse.',
        },
      ],
    },
    {
      title: 'Lagringstider',
      blocks: [
        {
          p: 'Vi sparar ditt konto och din spelardata tills du raderar ditt konto. När du raderar kontot i appen tas dina spelare, matcher, sparade coachsamtal och själva kontot bort. Betalningsunderlag kan sparas så länge bokföringslagen kräver (i Sverige normalt sju år). Samtyckesloggen sparas så länge samtycket gäller. Vi raderar för närvarande inte inaktiva konton automatiskt. Ljudet i lyssnaklippen sparas inte.',
        },
      ],
    },
    {
      title: 'Dina rättigheter',
      blocks: [
        { p: 'Du har rätt att:' },
        {
          ul: [
            'Få tillgång till dina personuppgifter',
            'Få felaktiga uppgifter rättade',
            'Begära att dina uppgifter raderas',
            'Begära att användningen av dina uppgifter begränsas',
            'Få en kopia av dina uppgifter i ett vanligt format (dataportabilitet). I appen: Mitt konto, Dina uppgifter.',
            'Invända mot behandling som grundar sig på berättigat intresse',
            'När som helst återkalla ditt samtycke, utan att det påverkar det som gjorts tidigare. I appen: Mitt konto, Dina uppgifter.',
            'Stänga en spelarlänk (i appen, i dialogrutan som visar länken)',
            'Lämna klagomål till tillsynsmyndigheten. I Sverige är det Integritetsskyddsmyndigheten (IMY), imy.se.',
          ],
        },
      ],
    },
    {
      title: 'AI-coachen',
      blocks: [
        {
          p: 'När du ber AI-coachen om en analys skickar vi spelarens namn, den matchstatistik och de poäng du har loggat, en kort historik och din fråga till Google Cloud (Vertex AI), som behandlar dem inom EU, för att ta fram svaret. Ingenting skickas förrän du frågar, och bara efter att du har godkänt det i appen. Vi skickar inte din e-postadress eller dina betalningsuppgifter. Du kan när som helst återkalla ditt samtycke i appen (Mitt konto, Dina uppgifter). Då slutar coachen använda spelarens uppgifter, och du kan låta radera de sparade coachsamtalen och anteckningarna. Du kan fortfarande logga matcher utan coachen.',
        },
        {
          p: 'För att råden ska bli mer personliga över tid sparar coachen en kort lista med daterade anteckningar om spelaren (vad spelaren arbetar med, styrkor, återkommande mönster), högst åtta åt gången. Du kan när som helst läsa, rensa eller stänga av anteckningarna i appen (anteckningsknappen i coachen). De är en del av spelarens uppgifter och tas bort när du raderar spelaren eller ditt konto. Coachens råd skapas automatiskt; de är vägledning, inte ett beslut om spelaren.',
        },
      ],
    },
    {
      title: 'Tredjepartstjänster',
      blocks: [
        { p: 'Vi använder dessa leverantörer för att driva tjänsten:' },
        {
          ul: [
            'Google (Firebase och Google Cloud, inklusive Vertex AI och Text-to-Speech): hosting, inloggning, databas, AI-coachen och lyssnaklippen',
            'Google och Apple: om du väljer att logga in med dem',
            'Stripe: betalningar för webbprenumerationer',
            'Resend: leverans av servicemeddelanden och veckosammanfattningen via e-post',
          ],
        },
        {
          p: 'Vår databas lagras i EU (en europeisk multiregion), och AI-coachen och lyssnaklippen behandlas i EU. Vissa av våra servrar (till exempel den del som hanterar betalningar och en del e-post) körs i USA, och Stripe och Resend är amerikanska företag. Leverantörerna agerar för vår räkning och får bara använda uppgifterna för att leverera sin tjänst till oss.',
        },
        {
          p: 'När en spelare öppnar lyssningssidan görs de korta texterna som läses upp (till exempel matchens poäng och coachens råd, utan spelarens namn) om till tal av Google Cloud Text-to-Speech, som behandlar dem inom EU. Vi sparar ingen kopia av ljudet. Vi för också anonyma dagliga räknare över hur lyssningssidan används (till exempel hur många som spelar upp den och vilken röst som väljs). De innehåller inga namn, länkar eller enhets-ID:n.',
        },
        {
          p: 'Vi säljer inte personuppgifter och använder dem inte för att spåra dig mellan andra företags appar eller webbplatser.',
        },
      ],
    },
    {
      title: 'Överföring utanför EU/EES',
      blocks: [
        {
          p: 'När personuppgifter förs över utanför EU/EES, till exempel till våra amerikanska leverantörer, förlitar vi oss på de skyddsåtgärder som GDPR kräver, såsom EU–USA-ramverket för dataskydd (Data Privacy Framework) eller EU-kommissionens standardavtalsklausuler. Kontakta oss om du vill veta mer.',
        },
      ],
    },
    {
      title: 'Automatiserade beslut',
      blocks: [
        {
          p: 'Vi fattar inga beslut om dig eller spelaren som har rättsliga eller liknande betydande följder och som enbart bygger på automatiserad behandling. AI-coachens råd är vägledning som du själv bestämmer hur du använder.',
        },
      ],
    },
    {
      title: 'Radera dina uppgifter',
      blocks: [
        {
          p: 'Du kan själv radera ditt konto och all spelardata i appen: öppna ditt konto, välj radera och bekräfta. Då tas dina spelare, matcher och ditt konto bort. Du kan också mejla oss (se nedan) så gör vi det åt dig.',
        },
      ],
    },
    {
      title: 'Barns integritet',
      blocks: [
        {
          p: 'Konton är bara för vuxna, och barn skapar inte konton. En förälder eller vårdnadshavare kan välja att dela en privat, skrivskyddad sida med sitt barn (spelarlänken). Sidan ber inte barnet om något och sparar ingenting från barnet; den visar bara spelarens egna resultat och kan läsa upp dem. Föräldrar och vårdnadshavare kan lägga in uppgifter om sitt eget barn som spelare, till exempel namn och matchstatistik. Vi hanterar de uppgifterna med extra omsorg, använder dem bara för att tillhandahålla den tjänst du ber om och använder dem inte för reklam. Tror du att ett barn har skapat ett konto, kontakta oss så tar vi bort det.',
        },
      ],
    },
  ],
  contact: {
    title: 'Kontakta oss',
    controller: (company, orgNr, country) =>
      `Personuppgiftsansvarig för Ice IQ är ${company}, organisationsnummer ${orgNr}, registrerat i ${country === 'Sweden' ? 'Sverige' : country}`,
    questions:
      'Har du frågor om den här integritetspolicyn, eller vill utöva någon av rättigheterna ovan, kontakta oss på',
    complaint:
      'Du kan också lämna klagomål till Integritetsskyddsmyndigheten (IMY), imy.se.',
  },
};

const ICONS = [
  <Shield key="s" className="text-green-400" size={24} />,
  <Lock key="l" className="text-green-400" size={24} />,
  <Eye key="e" className="text-green-400" size={24} />,
  <Database key="d" className="text-green-400" size={24} />,
];

export default function Privacy() {
  const { t, language } = useLanguage();
  const c = language === 'sv' ? SV : EN;

  useSEO({
    title: language === 'sv' ? 'Integritetspolicy – Ice IQ' : 'Privacy Policy – Ice IQ',
    description:
      language === 'sv'
        ? 'Så hanterar Ice IQ dina och spelarens uppgifter, och vilka rättigheter du har enligt GDPR.'
        : 'How Ice IQ handles your and the player\'s data, and the rights you have under the GDPR.',
    path: '/privacy',
  });

  return (
    <div className="bg-gray-900 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-800 rounded-2xl p-8">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="text-green-400" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">{t('privacyLink')}</h1>
            <p className="text-gray-300">{c.lastUpdated}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {c.principles.map((principle, index) => (
              <div key={index} className="bg-gray-750 rounded-xl p-6">
                <div className="mb-4">{ICONS[index]}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{principle.title}</h3>
                <p className="text-gray-300">{principle.description}</p>
              </div>
            ))}
          </div>

          <div className="prose prose-invert max-w-none">
            {c.sections.map((section) => (
              <section key={section.title} className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">{section.title}</h2>
                {section.blocks.map((block, i) =>
                  'p' in block ? (
                    <p key={i} className="text-gray-300 mb-4">
                      {block.p}
                    </p>
                  ) : (
                    <ul key={i} className="text-gray-300 list-disc pl-6 mb-4 space-y-2">
                      {block.ul.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ),
                )}
              </section>
            ))}

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">{c.contact.title}</h2>
              <p className="text-gray-300 mb-4">
                {c.contact.controller(COMPANY_NAME, COMPANY_ORG_NR, COMPANY_COUNTRY)} (
                <a
                  href={COMPANY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  {COMPANY_URL.replace('https://', '')}
                </a>
                ). {c.contact.questions}{' '}
                <a href={`mailto:${PRIVACY_EMAIL}`} className="text-cyan-400 hover:text-cyan-300">
                  {PRIVACY_EMAIL}
                </a>
                .
              </p>
              <p className="text-gray-300">{c.contact.complaint}</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
