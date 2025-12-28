import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { Github, Mail, Shield, FileText } from 'lucide-react';

export default function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 border-t border-gray-700 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold text-gray-900">🏒</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Ice IQ</h3>
                <p className="text-sm text-gray-400">{t('appSubtitle')}</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              Advanced hockey analytics and player development tools for coaches and scouts.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/dashboard" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/dashboard?history=true" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  Player History
                </Link>
              </li>
              <li>
                <Link to="/dashboard?upgrade=true" className="text-gray-400 hover:text-yellow-400 transition-colors">
                  Upgrade to Premium
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="flex items-center text-gray-400 hover:text-cyan-400 transition-colors">
                  <FileText size={16} className="mr-2" />
                  {t('termsLink')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="flex items-center text-gray-400 hover:text-cyan-400 transition-colors">
                  <Shield size={16} className="mr-2" />
                  {t('privacyLink')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact & Support</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:support@iceiq.app"
                  className="flex items-center text-gray-400 hover:text-cyan-400 transition-colors"
                >
                  <Mail size={16} className="mr-2" />
                  {t('supportContact')}
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/iceiq-app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-gray-400 hover:text-cyan-400 transition-colors"
                >
                  <Github size={16} className="mr-2" />
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-6 text-center">
          <p className="text-gray-500 text-sm">
            © {currentYear} Ice IQ by SquareVerse Group. All rights reserved.
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Made with ❤️ for the hockey community
          </p>
        </div>
      </div>
    </footer>
  );
}