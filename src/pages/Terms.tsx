import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { LEGAL_EMAIL, COMPANY_NAME, COMPANY_COUNTRY, COMPANY_URL, COMPANY_ORG_NR } from '../utils/contact';

export default function Terms() {
  const { t } = useLanguage();

  return (
    <div className="bg-gray-900 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-800 rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-white mb-6">
            {t('termsLink')}
          </h1>
          
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 mb-6">
              Last updated: 12 October 2026
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-300 mb-4">
                Ice IQ ("the Service") is provided by {COMPANY_NAME}, a company registered in {COMPANY_COUNTRY} under company reg. no. {COMPANY_ORG_NR} ("we", "us"). By accessing and using the Service, you accept and agree to be bound by the terms and provisions of this agreement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
              <p className="text-gray-300 mb-4">
                Ice IQ provides hockey analytics and player development tools through a web application and an iPhone app. Features include player tracking, statistics, performance analysis and an AI coach.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">3. User Accounts</h2>
              <p className="text-gray-300 mb-4">
                You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
              </p>
              <p className="text-gray-300 mb-4">
                The Service is for adults (parents, guardians and coaches). When you add a player who is a child, you confirm that you
                are the child&apos;s parent or legal guardian, or that you have the guardian&apos;s permission to do so.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">4. Subscription and Billing</h2>
              <p className="text-gray-300 mb-4">
                Premium features require a paid subscription. Subscriptions are currently bought on the web, and automatically renew unless cancelled. You may cancel your subscription at any time through your account settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">5. Data Privacy</h2>
              <p className="text-gray-300 mb-4">
                We respect your privacy. All personal data is handled in accordance with our Privacy Policy. We do not sell personal data. We use the service providers named in the Privacy Policy to run the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">6. AI Coach and Money Mode</h2>
              <p className="text-gray-300 mb-4">
                The AI coach generates advice automatically. It can be wrong, incomplete or unsuitable for a particular player,
                and it does not replace a coach, doctor or other professional. You use the advice at your own judgement.
              </p>
              <p className="text-gray-300 mb-4">
                Money Mode is a counter that helps you keep track of a reward you choose to give. Ice IQ does not handle, send or
                guarantee any payment between you and a player, and is not a party to any such arrangement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">7. Limitation of Liability</h2>
              <p className="text-gray-300 mb-4">
                Ice IQ shall not be liable for any indirect, incidental, special, consequential or punitive damages resulting from your use of or inability to use the service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">8. Changes to Terms</h2>
              <p className="text-gray-300 mb-4">
                We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">9. Contact</h2>
              <p className="text-gray-300">
                For questions about these Terms of Service, please contact {COMPANY_NAME} at{' '}
                <a href={`mailto:${LEGAL_EMAIL}`} className="text-cyan-400 hover:text-cyan-300">
                  {LEGAL_EMAIL}
                </a>{' '}
                or visit{' '}
                <a
                  href={COMPANY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  {COMPANY_URL.replace('https://', '')}
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