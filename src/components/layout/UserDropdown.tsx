import React from 'react';
import { User, LogOut, Crown, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface UserDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onUpgrade: () => void;
  onManageSubscription: () => void; // Denna öppnar ProfileModal i din Header-kod
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
      {/* Overlay för att stänga när man klickar utanför */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* Dropdown Meny */}
      <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-xl shadow-lg z-50 animate-in fade-in zoom-in-95 duration-200">
        
        {/* User Info Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <User size={20} className="text-gray-900" />
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="font-semibold text-white truncate">
                {user.displayName || user.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{t('currentPlan') || 'Plan'}:</span>
            {subscription.plan === 'premium' ? (
              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded text-[10px] font-bold tracking-wider">
                PREMIUM
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded text-[10px] font-bold tracking-wider">
                FREE
              </span>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <div className="py-2">
          
          {/* 1. MITT KONTO (Länkade denna till onManageSubscription som öppnar modalen) */}
          <button 
            onClick={onManageSubscription} 
            className="w-full flex items-center px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <Settings size={18} className="mr-3 text-cyan-400" />
            {t('myAccount') || 'Mitt Konto'}
          </button>

          {/* 2. PREMIUM / UPGRADE */}
          {subscription.plan === 'premium' ? (
            <button
              onClick={onManageSubscription}
              className="w-full flex items-center px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
            >
              <Crown size={18} className="mr-3 text-yellow-400" />
              {t('manageSubscription') || 'Hantera Prenumeration'}
            </button>
          ) : (
            <button
              onClick={onUpgrade}
              className="w-full flex items-center px-4 py-3 text-sm text-yellow-400 hover:bg-gray-700 transition-colors font-medium"
            >
              <Crown size={18} className="mr-3" />
              {t('upgradeToPremium') || 'Uppgradera till Premium'}
            </button>
          )}

          <div className="border-t border-gray-700 mt-2 pt-1">
            <button
              onClick={onLogout}
              className="w-full flex items-center px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
            >
              <LogOut size={18} className="mr-3" />
              {t('logout') || 'Logga ut'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}