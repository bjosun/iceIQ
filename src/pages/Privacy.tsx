import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Shield, Lock, Eye, Database } from 'lucide-react';

export default function Privacy() {
  const { t } = useLanguage();

  const privacyPrinciples = [
    {
      icon: <Shield className="text-green-400" size={24} />,
      title: "Data Protection",
      description: "Your data is encrypted both in transit and at rest using industry-standard encryption."
    },
    {
      icon: <Lock className="text-green-400" size={24} />,
      title: "Access Control",
      description: "Only you and authorized team members you invite can access your player data."
    },
    {
      icon: <Eye className="text-green-400" size={24} />,
      title: "Transparency",
      description: "We're clear about what data we collect and how we use it. No hidden tracking."
    },
    {
      icon: <Database className="text-green-400" size={24} />,
      title: "Data Ownership",
      description: "You own your data. You can export or delete it at any time."
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
              Last updated: {new Date().toLocaleDateString()}
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
                We collect the following types of information:
              </p>
              <ul className="text-gray-300 list-disc pl-6 mb-4 space-y-2">
                <li>Account information (email, name)</li>
                <li>Player data (names, performance metrics)</li>
                <li>Game statistics and analysis data</li>
                <li>Payment information (processed securely by Stripe)</li>
                <li>Usage data to improve our service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">How We Use Your Information</h2>
              <p className="text-gray-300 mb-4">
                Your information is used to:
              </p>
              <ul className="text-gray-300 list-disc pl-6 mb-4 space-y-2">
                <li>Provide and maintain the Service</li>
                <li>Process your subscription payments</li>
                <li>Send important service notifications</li>
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
                We retain your personal data only for as long as necessary to provide you with our services and for legitimate and essential business purposes.
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
                <li>Export your data in a standard format</li>
                <li>Object to certain data processing</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Third-Party Services</h2>
              <p className="text-gray-300 mb-4">
                We use third-party services for:
              </p>
              <ul className="text-gray-300 list-disc pl-6 mb-4 space-y-2">
                <li>Payment processing (Stripe)</li>
                <li>Cloud infrastructure (Firebase)</li>
                <li>Analytics (Google Analytics, anonymized)</li>
                <li>Customer support</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Children's Privacy</h2>
              <p className="text-gray-300 mb-4">
                Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
              <p className="text-gray-300">
                If you have any questions about this Privacy Policy, please contact our Data Protection Officer at{' '}
                <a href="mailto:privacy@iceiq.app" className="text-cyan-400 hover:text-cyan-300">
                  privacy@iceiq.app
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}