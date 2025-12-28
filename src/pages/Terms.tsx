import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

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
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-300 mb-4">
                By accessing and using Ice IQ ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
              <p className="text-gray-300 mb-4">
                Ice IQ provides hockey analytics and player development tools through a web application. Features include player tracking, statistics, and performance analysis.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">3. User Accounts</h2>
              <p className="text-gray-300 mb-4">
                You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">4. Subscription and Billing</h2>
              <p className="text-gray-300 mb-4">
                Premium features require a paid subscription. Subscriptions automatically renew unless cancelled. You may cancel your subscription at any time through your account settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">5. Data Privacy</h2>
              <p className="text-gray-300 mb-4">
                We respect your privacy. All personal data is handled in accordance with our Privacy Policy. We never share your player data with third parties without your consent.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">6. Limitation of Liability</h2>
              <p className="text-gray-300 mb-4">
                Ice IQ shall not be liable for any indirect, incidental, special, consequential or punitive damages resulting from your use of or inability to use the service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">7. Changes to Terms</h2>
              <p className="text-gray-300 mb-4">
                We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">8. Contact</h2>
              <p className="text-gray-300">
                For questions about these Terms of Service, please contact us at{' '}
                <a href="mailto:legal@iceiq.app" className="text-cyan-400 hover:text-cyan-300">
                  legal@iceiq.app
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}