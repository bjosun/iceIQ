import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  Menu, 
  User, 
  LogOut, 
  Crown, 
  Settings, 
  Globe,
  ChevronDown
} from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();
  const { subscription } = useSubscription();
  const { language, setLanguage, t } = useLanguage();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'sv' : 'en');
  };

  return (
    <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg flex items-center justify-center">
              <span className="text-xl font-bold text-gray-900">🏒</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Ice IQ</h1>
              <p className="text-xs text-gray-400">{t('appSubtitle')}</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
              title={`Switch to ${language === 'en' ? 'Swedish' : 'English'}`}
            >
              <Globe size={20} className="text-gray-300" />
            </button>

            {user ? (
              <>
                {/* Premium Badge */}
                {subscription.plan === 'premium' ? (
                  <div className="flex items-center bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-3 py-1 rounded-full text-sm font-bold">
                    <Crown size={16} className="mr-1" />
                    PREMIUM
                  </div>
                ) : (
                  <Link
                    to="/dashboard?upgrade=true"
                    className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                  >
                    {t('upgradeToPremium')}
                  </Link>
                )}

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center">
                      <User size={16} className="text-gray-900" />
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-sm font-medium text-white">
                        {user.displayName || user.email?.split('@')[0] || 'User'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {subscription.plan === 'premium' ? 'Premium' : 'Free'} Plan
                      </p>
                    </div>
                    <ChevronDown size={16} className="text-gray-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowUserMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
                        <div className="p-4 border-b border-gray-700">
                          <p className="font-semibold text-white">{t('myAccount')}</p>
                          <p className="text-sm text-gray-400 truncate">{user.email}</p>
                        </div>
                        
                        <Link
                          to="/dashboard"
                          className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Settings size={18} className="mr-3" />
                          Dashboard
                        </Link>

                        {subscription.plan === 'premium' ? (
                          <button
                            onClick={() => {
                              // Handle manage subscription
                              setShowUserMenu(false);
                            }}
                            className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700"
                          >
                            <Crown size={18} className="mr-3" />
                            {t('manageSubscription')}
                          </button>
                        ) : (
                          <Link
                            to="/dashboard?upgrade=true"
                            className="flex items-center px-4 py-3 text-yellow-400 hover:bg-gray-700"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Crown size={18} className="mr-3" />
                            {t('upgradeToPremium')}
                          </Link>
                        )}

                        <div className="border-t border-gray-700">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center px-4 py-3 text-red-400 hover:bg-gray-700"
                          >
                            <LogOut size={18} className="mr-3" />
                            {t('logout')}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/dashboard"
                  className="px-4 py-2 text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  {t('login')}
                </Link>
                <Link
                  to="/dashboard?signup=true"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium"
                >
                  {t('register')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Menu size={24} className="text-gray-300" />
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-700 py-4">
            {!user ? (
              <div className="space-y-2">
                <Link
                  to="/dashboard"
                  className="block px-4 py-3 text-cyan-400 hover:bg-gray-700 rounded-lg"
                  onClick={() => setShowMobileMenu(false)}
                >
                  {t('login')}
                </Link>
                <Link
                  to="/dashboard?signup=true"
                  className="block px-4 py-3 bg-cyan-600 text-white rounded-lg font-medium text-center"
                  onClick={() => setShowMobileMenu(false)}
                >
                  {t('register')}
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="px-4 py-3">
                  <p className="font-medium text-white">
                    {user.displayName || user.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-sm text-gray-400">{user.email}</p>
                </div>
                
                <Link
                  to="/dashboard"
                  className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 rounded-lg"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <Settings size={18} className="mr-3" />
                  Dashboard
                </Link>

                {subscription.plan === 'premium' ? (
                  <button
                    onClick={() => {
                      // Handle manage subscription
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 rounded-lg"
                  >
                    <Crown size={18} className="mr-3" />
                    {t('manageSubscription')}
                  </button>
                ) : (
                  <Link
                    to="/dashboard?upgrade=true"
                    className="flex items-center px-4 py-3 text-yellow-400 hover:bg-gray-700 rounded-lg"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Crown size={18} className="mr-3" />
                    {t('upgradeToPremium')}
                  </Link>
                )}

                <div className="border-t border-gray-700 pt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-3 text-red-400 hover:bg-gray-700 rounded-lg"
                  >
                    <LogOut size={18} className="mr-3" />
                    {t('logout')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}