import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Crown, User, Home, Plus, Sparkles } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { isNativeApp } from '../../utils/platform';
import { tapFeedback } from '../../utils/feedback';

// Global huvudnavigering på mobil (renderas i Layout för inloggade).
interface MobileBottomNavProps {
  onPremiumClick: () => void;
  onProfileClick?: () => void;
}

type Tab = 'home' | 'players' | 'coach' | 'account';

export default function MobileBottomNav({ onPremiumClick, onProfileClick }: MobileBottomNavProps) {
  const { t } = useLanguage();
  const location = useLocation();
  const [active, setActive] = useState<Tab>('home');

  // --- iPhone-appen: fem platser med "Ny match" som stor knapp i mitten ---
  if (isNativeApp) {
    const tabClass = (tab: Tab) =>
      `flex flex-col items-center justify-center flex-1 min-h-[48px] transition-colors ${
        active === tab ? 'text-cyan-400' : 'text-gray-400'
      }`;
    const press = (tab: Tab) => {
      tapFeedback('plus');
      setActive(tab);
    };

    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden z-50">
        <div className="flex items-end justify-between">
          <Link to="/dashboard" state={{ scrollTo: 'top' }} onClick={() => press('home')} className={tabClass('home')}>
            <Home size={22} />
            <span className="text-[11px] mt-1">{t('nav.home')}</span>
          </Link>

          <Link to="/dashboard" state={{ openPlayerSelect: true }} onClick={() => press('players')} className={tabClass('players')}>
            <Users size={22} />
            <span className="text-[11px] mt-1">{t('nav.players')}</span>
          </Link>

          {/* Primär handling, inom tummens räckvidd: börja logga en match. */}
          <Link
            to="/dashboard"
            state={{ scrollTo: 'match' }}
            onClick={() => tapFeedback('big')}
            aria-label={t('nav.newMatch')}
            className="flex flex-col items-center flex-1 -mt-6"
          >
            <span className="w-14 h-14 rounded-full bg-cyan-500 text-gray-900 flex items-center justify-center shadow-lg shadow-cyan-500/30 border-4 border-gray-900 active:scale-95 transition-transform">
              <Plus size={28} strokeWidth={3} />
            </span>
            <span className="text-[11px] mt-1 text-cyan-400 font-semibold">{t('nav.newMatch')}</span>
          </Link>

          <Link to="/dashboard" state={{ scrollTo: 'coach' }} onClick={() => press('coach')} className={tabClass('coach')}>
            <Sparkles size={22} />
            <span className="text-[11px] mt-1">{t('nav.coach')}</span>
          </Link>

          <button
            onClick={() => { press('account'); onProfileClick?.(); }}
            className={tabClass('account')}
          >
            <User size={22} />
            <span className="text-[11px] mt-1">{t('nav.account')}</span>
          </button>
        </div>
      </nav>
    );
  }

  // --- Webben: som förut ---
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
            de landar på samma sida. */}
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
