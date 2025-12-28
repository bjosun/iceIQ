import React from 'react';
import { User, LogOut, Crown, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface UserDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onUpgrade: () => void;
  onManageSubscription: () => void;
}

export default function UserDropdown({
  isOpen,
  onClose,
  onLogout,
  onUpgrade,
  onManageSubscription
}: UserDropdownProps) {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const { t } = useLanguage();

  if (!user || !isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* Dropdown */}
      <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-xl shadow-lg z-50">
        {/* User Info */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center">
              <User size={20} className="text-gray-900" />
            </div>
            <div className="ml-3">
              <p className="font-semibold text-white">
                {user.displayName || user.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-sm text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
          
          {/* Subscription Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">{t('currentPlan')}:</span>
            {subscription.plan === 'premium' ? (
              <span className="premium-badge">PREMIUM</span>
            ) : (
              <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                FREE
              </span>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <div className="py-2">
          <button className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700">
            <Settings size={18} className="mr-3" />
            {t('myAccount')}
          </button>

          {subscription.plan === 'premium' ? (
            <button
              onClick={onManageSubscription}
              className="w-full flex items-center px-4 py-3 text-yellow-400 hover:bg-gray-700"
            >
              <Crown size={18} className="mr-3" />
              {t('manageSubscription')}
            </button>
          ) : (
            <button
              onClick={onUpgrade}
              className="w-full flex items-center px-4 py-3 text-yellow-400 hover:bg-gray-700"
            >
              <Crown size={18} className="mr-3" />
              {t('upgradeToPremium')}
            </button>
          )}

          <div className="border-t border-gray-700 mt-2">
            <button
              onClick={onLogout}
              className="w-full flex items-center px-4 py-3 text-red-400 hover:bg-gray-700"
            >
              <LogOut size={18} className="mr-3" />
              {t('logout')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}