import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useLanguage } from '../../contexts/LanguageContext';
import UserDropdown from './UserDropdown'; 
import logo from '../../assets/images/iceiq-logo.png'; 
import { 
  Menu, 
  User, 
  Crown, 
  Settings, 
  Globe,
  ChevronDown,
  LogOut,
  X
} from 'lucide-react';

interface HeaderProps {
  onOpenProfile: () => void;
  onOpenSubscription: () => void;
}

export default function Header({ onOpenProfile, onOpenSubscription }: HeaderProps) {
  const { user, logout } = useAuth();
  const { subscription } = useSubscription();
  const { language, setLanguage, t } = useLanguage();
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const isPremium = subscription.plan === 'premium';

  const handleLogout = async () => {
    try {
      await logout();
      setShowMobileMenu(false);
      setShowUserMenu(false);
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'sv' : 'en');
  };

  return (
    <header className="bg-gray-900/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* --- LOGOTYP --- */}
          <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
            <div className="relative w-10 h-10 transition-transform transform group-hover:scale-110">
              <img 
                src={logo} 
                alt="Ice IQ Logo" 
                className="w-full h-full object-contain rounded-full shadow-lg shadow-cyan-500/20 border border-white/10" 
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter text-white leading-none italic">
                ICE <span className="text-cyan-400">IQ</span>
                {isPremium && <span className="text-yellow-500 ml-1 text-sm not-italic font-black uppercase">PRO</span>}
              </span>
              <span className="text-[0.6rem] uppercase tracking-widest text-gray-500 font-bold">
                Scouting V2
              </span>
            </div>
          </Link>

          {/* --- DESKTOP NAV & ACTIONS --- */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Länkar (Valfritt om du vill ha dem här också) */}
            {user && (
              <nav className="flex items-center space-x-4 mr-4 border-r border-gray-800 pr-6">
                <Link to="/dashboard" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                  {t('nav.dashboard') || 'Dashboard'}
                </Link>
                <Link to="/players" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                  {t('nav.players') || 'Players'}
                </Link>
              </nav>
            )}

            {/* Språkväljare Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-all text-xs font-bold"
              title={language === 'en' ? 'Byt till Svenska' : 'Switch to English'}
            >
              <Globe size={14} />
              <span>{language.toUpperCase()}</span>
            </button>

            {user ? (
              <div className="flex items-center space-x-4">
                {/* Premium Status */}
                {isPremium ? (
                  <div className="flex items-center bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full text-[10px] font-black border border-yellow-500/20">
                    <Crown size={12} className="mr-1.5" />
                    PREMIUM
                  </div>
                ) : (
                  <button
                    onClick={onOpenSubscription}
                    className="flex items-center bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-3 py-1.5 rounded-lg text-[10px] font-black hover:opacity-90 transition-opacity uppercase"
                  >
                    <Crown size={12} className="mr-1.5" />
                    {t('nav.upgrade') || 'Upgrade'}
                  </button>
                )}

                {/* Användarmeny Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-800 transition-colors border border-transparent hover:border-white/10"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center border border-white/20 shadow-inner">
                      <User size={16} className="text-gray-900" />
                    </div>
                    <ChevronDown size={14} className={`text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  <UserDropdown 
                    isOpen={showUserMenu}
                    onClose={() => setShowUserMenu(false)}
                    onLogout={handleLogout}
                    onUpgrade={onOpenSubscription}
                    onManageSubscription={() => {
                        setShowUserMenu(false);
                        onOpenProfile();
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/dashboard" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">
                  {t('nav.login') || 'Login'}
                </Link>
                <Link to="/dashboard">
                  <button className="bg-cyan-600 px-5 py-2 rounded-xl text-sm font-black text-white hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-600/20 italic uppercase tracking-tighter">
                    {t('register') || 'Join Now'}
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* --- MOBIL MENY-KNAPP --- */}
          <div className="md:hidden flex items-center gap-3">
             <button
              onClick={toggleLanguage}
              className="text-gray-500 text-xs font-bold uppercase"
            >
              {language}
            </button>
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-lg text-gray-400 hover:text-white"
            >
              {showMobileMenu ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </div>

      {/* --- MOBIL MENY INNEHÅLL --- */}
      {showMobileMenu && (
        <div className="md:hidden bg-gray-900 border-b border-white/10 py-6 px-4 space-y-4 animate-in slide-in-from-top-4 duration-300">
          {user ? (
            <div className="grid grid-cols-1 gap-2">
              <Link 
                to="/dashboard" 
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-xl"
              >
                {t('nav.dashboard') || 'Dashboard'}
              </Link>
              <Link 
                to="/players" 
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-xl"
              >
                {t('nav.players') || 'Players'}
              </Link>
              <button
                onClick={() => { setShowMobileMenu(false); onOpenProfile(); }}
                className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-xl"
              >
                <Settings size={18} className="mr-3 text-cyan-400" />
                {t('myAccount') || 'My Account'}
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl"
              >
                <LogOut size={18} className="mr-3" />
                {t('nav.logout') || 'Log Out'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              <Link to="/login" className="text-center py-3 text-gray-300 font-bold" onClick={() => setShowMobileMenu(false)}>
                {t('nav.login') || 'Login'}
              </Link>
              <Link to="/register" onClick={() => setShowMobileMenu(false)}>
                <button className="w-full bg-cyan-600 py-3 rounded-xl text-white font-black italic uppercase tracking-tighter">
                   {t('register') || 'Register'}
                </button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}