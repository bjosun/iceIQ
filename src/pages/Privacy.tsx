import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Shield, Lock, Eye, Database } from 'lucide-react';
import { PRIVACY_EMAIL, COMPANY_NAME, COMPANY_COUNTRY, COMPANY_URL, COMPANY_ORG_NR } from '../utils/contact';

export default function Privacy() {
  const { t } = useLanguage();

  const privacyPrinciples = [
    {
      icon: <Shield className="text-green-400" size={24} />,
      title: "Data Protection",
      description: "Our cloud providers encrypt data in transit and at rest."
    },
    {
      icon: <Lock className="text-green-400" size={24} />,
      title: "Access Control",
      description: "Your account is protected by your sign-in. If you create a player link, anyone who has that link can open that player's page, so treat it like a password."
    },
    {
      icon: <Eye className="text-green-400" size={24} />,
      title: "Transparency",
      description: "We're clear about what data we collect and how we use it. No hidden tracking."
    },
    {
      icon: <Database className="text-green-400" size={24} />,
      title: "Data Ownership",
      description: "You can download a copy of your data and delete your account and all player data yourself in the app."
    }
  ];

  return (
    <div className="bg-gray-900 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-800 rounded-2xl p-8">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="text-green-400" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">
              {t('privacyLink')}
            </h1>
            <p className="text-gray-300">
              Last updated: 14 October 2026
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {privacyPrinciples.map((principle, index) => (
              <div key={index} className="bg-gray-750 rounded-xl p-6">
                <div className="mb-4">{principle.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {principle.title}
                </h3>
                <p className="text-gray-300">{principle.description}</p>
              </div>
            ))}
          </div>

          <div className="prose prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Information We Collect</h2>
              <p className="text-gray-300 mb-4">
                Ice IQ is meant for adults: parents, guardians and coaches. We collect the following:
              </p>
              <ul className="text-gray-300 list-disc pl-6 mb-4 space-y-2">
                <li>Account information: email address and name, and the sign-in method you use (email, Google or Apple).</li>
                <li>Player data that you enter about a player, who is often a child: name, team, game statistics, points and, if you use Money Mode, the reward balance.</li>
                <li>The player&apos;s email address, only if you choose to add one so the player can be sent an analysis. It is not needed to use the Service.</li>
                <li>Content you create, such as saved coach conversations, and short notes the AI coach keeps about the player over time so it can give more personal advice (see AI Coach below).</li>
                <li>The dates when a player has done a mental routine on the player&apos;s own page.</li>
                <li>The link (a long random address) that lets a player open their own page without logging in.</li>
                <li>Payment information when you subscribe on the web. It is handled by Stripe and we never see your card number.</li>
                <li>Basic information about how you found us (for example the campaign in a link you opened), to understand which channels work.</li>
              </ul>
              <p className="text-gray-300 mb-4">
                In the iPhone app, some settings and a copy of your data are stored on your phone so the app opens quickly.
                If you turn on the app lock, Face ID or Touch ID is handled entirely by iOS. We never receive or store biometric data.
                A player&apos;s mobile number for the Swish shortcut is stored only on your device and is never sent to us.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">How We Use Your Information</h2>
              <p className="text-gray-300 mb-4">
                Your information is used to:
              </p>
              <ul className="text-gray-300 list-disc pl-6 mb-4 space-y-2">
                <li>Provide and maintain the Service</li>
                <li>Create the AI coach&apos;s advice and the listen clips</li>
                <li>Process your subscription payments</li>
                <li>Send service messages and a weekly summary by email</li>
                <li>Improve and develop new features</li>
                <li>Ensure security and prevent fraud</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Data Security</h2>
              <p className="text-gray-300 mb-4">
                We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Data Retention</h2>
              <p className="text-gray-300 mb-4">
                We keep your account and player data until you delete your account. Deleting your account in the app removes your
                players, games, saved coach conversations and the account itself. Payment records may be kept as long as
                accounting law requires. We do not currently delete inactive accounts automatically.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Your Rights</h2>
              <p className="text-gray-300 mb-4">
                You have the right to:
              </p>
              <ul className="text-gray-300 list-disc pl-6 mb-4 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Download a copy of your data (in the app: My account, Your information)</li>
                <li>Switch off a player link (in the app, in the dialog that shows the link)</li>
                <li>Object to certain data processing</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">AI Coach</h2>
              <p className="text-gray-300 mb-4">
                When you ask the AI coach for an analysis, we send the player&apos;s name, the game statistics and points you
                have logged, a short history, and your question to Google Cloud (Vertex AI), processed in the EU, in order to
                produce the answer. Nothing is sent until you ask, and only after you have agreed to it in the app. We do not send
                your email address or payment details. You can withdraw your consent at any time in the app (My account, Your information). The coach then stops using the player&apos;s information, and you can have the saved coach conversations and notes deleted. You can still log games without the coach.
              </p>
              <p className="text-gray-300 mb-4">
                To make the advice more personal over time, the coach saves a short list of dated notes about the player (what
                the player is working on, strengths, recurring patterns), at most eight at a time. You can read, clear or switch off
                these notes at any time in the app (the notes button in the coach). They are part of the player&apos;s data and are
                removed when you delete the player or your account. The coach&apos;s advice is
                generated automatically; it is guidance, not a decision about the player.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Third-Party Services</h2>
              <p className="text-gray-300 mb-4">
                We use these providers to run the service:
              </p>
              <ul className="text-gray-300 list-disc pl-6 mb-4 space-y-2">
                <li>Google (Firebase and Google Cloud, including Vertex AI and Text-to-Speech): hosting, sign-in, database, the AI coach and the listen clips</li>
                <li>Google and Apple: if you choose to sign in with them</li>
                <li>Stripe: payments for web subscriptions</li>
                <li>Resend: delivery of service messages and the weekly summary by email</li>
              </ul>
              <p className="text-gray-300 mb-4">
                Our database is stored in the EU (a European multi-region), and the AI coach and the listen clips are processed in
                the EU. Some of our servers (for example the part that handles payments and some emails) run in the United States,
                and Stripe and Resend are US-based companies.
              </p>
              <p className="text-gray-300 mb-4">
                When a player opens the listen page, the short texts that are read out (for example the first name and the points
                of a game) are turned into speech by Google Cloud Text-to-Speech, processed in the EU. We do not keep a copy of the
                audio. We also keep anonymous daily counters of how the
                listen page is used (for example how many play it and which voice is chosen). They contain no names, links or
                device identifiers.
              </p>
              <p className="text-gray-300 mb-4">
                We do not sell personal data and we do not use it to track you across other companies&apos; apps or websites.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Deleting Your Data</h2>
              <p className="text-gray-300 mb-4">
                You can delete your account and all player data yourself in the app: open your account, choose delete, and
                confirm. This removes your players, games and account. You can also email us (see below) and we will do it for you.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Children&apos;s Privacy</h2>
              <p className="text-gray-300 mb-4">
                Children do not create accounts and the service is not directed to children under 13. Parents and guardians
                may record information about their own child as a player, for example name and game statistics. We treat that
                information with extra care, use it only to provide the service you ask for, and do not use it for advertising.
                If you believe a child has created an account, contact us and we will remove it.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
              <p className="text-gray-300">
                The data controller for Ice IQ is {COMPANY_NAME}, company reg. no. {COMPANY_ORG_NR}, registered in {COMPANY_COUNTRY} (
                <a
                  href={COMPANY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  {COMPANY_URL.replace('https://', '')}
                </a>
                ). If you have any questions about this Privacy Policy, or want to exercise any of the rights above, contact us at{' '}
                <a href={`mailto:${PRIVACY_EMAIL}`} className="text-cyan-400 hover:text-cyan-300">
                  {PRIVACY_EMAIL}
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}