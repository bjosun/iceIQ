import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Crown } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

// Global huvudnavigering på mobil (renderas i Layout för inloggade).
// Konto/inställningar bor kvar i hamburgermenyn i Header.
interface MobileBottomNavProps {
  onPremiumClick: () => void;
}

export default function MobileBottomNav({ onPremiumClick }: MobileBottomNavProps) {
  const { t } = useLanguage();
  const location = useLocation();

  const linkClass = (path: string) =>
    `flex flex-col items-center transition-colors ${
      location.pathname === path ? 'text-cyan-400' : 'text-gray-400 hover:text-cyan-400'
    }`;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-3 md:hidden z-50">
      <div className="flex justify-around items-center">

        <Link to="/dashboard" className={linkClass('/dashboard')}>
          <LayoutDashboard size={24} />
          <span className="text-xs mt-1">{t('nav.dashboard')}</span>
        </Link>

        {/* Ingen egen /players-route finns — spelarhanteringen bor i
            Dashboards PlayerSelectModal. Länken tar dit och öppnar den
            direkt. Lyser upp tillsammans med Dashboard-fliken eftersom
            de landar på samma sida — det finns inget eget /players-läge
            att särskilja på i location.pathname längre. */}
        <Link to="/dashboard" state={{ openPlayerSelect: true }} className={linkClass('/dashboard')}>
          <Users size={24} />
          <span className="text-xs mt-1">{t('nav.players')}</span>
        </Link>

        <button
          onClick={onPremiumClick}
          className="flex flex-col items-center text-gray-400 hover:text-yellow-400 transition-colors"
        >
          <Crown size={24} />
          <span className="text-xs mt-1">{t('nav.upgrade')}</span>
        </button>

      </div>
    </div>
  );
}
