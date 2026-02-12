import React, { useState } from 'react';
import { LogOut, CreditCard, Trash2, Shield, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePlayerData } from '../../hooks/usePlayerData'; // För att rensa data
import { createStripePortalSession } from '../../services/firebase'; // Från din städade firebase.ts
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Card from '../ui/Card';
import toast from 'react-hot-toast';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPremium: boolean;
}

export default function ProfileModal({ isOpen, onClose, isPremium }: ProfileModalProps) {
  const { user, logout, deleteAccount } = useAuth();
  const { deleteUserData: clearFirestoreData } = usePlayerData(); // Rename för tydlighet
  const { t, language } = useLanguage();
  
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  // 1. Hantera Utloggning
  const handleLogout = async () => {
    try {
      await logout();
      onClose();
      toast.success(language === 'en' ? "Logged out!" : "Utloggad!");
    } catch (error) {
      toast.error("Error logging out.");
    }
  };

  // 2. Hantera Prenumeration via Stripe Portal
  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const result = await createStripePortalSession();
      // Typ-säkra resultatet från Cloud Function
      const data = result.data as { url: string };
      
      if (data && data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Portal error:", error);
      toast.error(language === 'en' ? "Could not open billing portal." : "Kunde inte öppna prenumerationshanteraren.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Hantera Borttagning av konto (Total städning)
  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE') return;
    
    setLoading(true);
    try {
      // STEG 1: Radera all data i Firestore (Spelare, matcher, användarrot)
      await clearFirestoreData(); 
      
      // STEG 2: Radera användaren i Auth (Detta triggar även din Stripe-radering via Cloud Function)
      await deleteAccount(); 
      
      toast.success(language === 'en' ? "Account deleted." : "Ditt konto har raderats.");
      onClose();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(language === 'en' 
        ? "Please log in again and try immediately to confirm account deletion." 
        : "Du måste logga ut och in igen för att bekräfta raderingen av kontot.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('myAccount') || "Mitt Konto"} size="md">
      <div className="p-6 space-y-6">
        
        {/* Användarinfo */}
        <div className="flex items-center space-x-4 p-4 bg-gray-800 rounded-xl border border-gray-700">
          <div className="bg-gray-700 p-3 rounded-full shrink-0">
            <User className="text-cyan-400" size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-gray-400">Inloggad som</p>
            <p className="text-white font-medium truncate">{user?.email}</p>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 inline-block ${isPremium ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-700 text-gray-400'}`}>
              {isPremium ? 'Premium Plan' : 'Free Plan'}
            </span>
          </div>
        </div>

        {/* Prenumerationshantering */}
        <Card className="bg-gray-800/50">
          <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
            <CreditCard className="mr-2 text-cyan-400" size={20}/> 
            {language === 'en' ? "Subscription" : "Prenumeration"}
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            {isPremium 
              ? (language === 'en' 
                  ? "You are a Premium member. Manage your subscription or cancel anytime below." 
                  : "Du är Premium-medlem. Du kan hantera eller avsluta din prenumeration här.")
              : (language === 'en'
                  ? "You are using the free version."
                  : "Du använder gratisversionen.")}
          </p>
          
          {isPremium && (
            <Button variant="secondary" onClick={handleManageSubscription} loading={loading} fullWidth>
              {language === 'en' ? "Manage / Cancel Subscription" : "Hantera / Avsluta Prenumeration"}
            </Button>
          )}
        </Card>

        {/* Logga ut */}
        <Button variant="secondary" onClick={handleLogout} icon={LogOut} fullWidth>
          {t('logout') || "Logga ut"}
        </Button>

        {/* Danger Zone */}
        <div className="pt-6 border-t border-gray-700/50">
          {!showDeleteConfirm ? (
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full text-red-500 hover:text-red-400 text-sm font-medium flex items-center justify-center py-2 transition-colors"
            >
              <Trash2 size={16} className="mr-2" />
              {t('deleteAccount') || "Radera konto och all data"}
            </button>
          ) : (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
              <h4 className="text-red-400 font-bold mb-2 flex items-center">
                <Shield size={18} className="mr-2"/> Varning!
              </h4>
              <p className="text-xs text-gray-300 mb-4">
                {language === 'en' 
                  ? "This will permanently delete all history, players, and settings. Type DELETE to confirm."
                  : "Detta raderar permanent all historik, spelare och inställningar. Skriv DELETE för att bekräfta."}
              </p>
              <input 
                type="text" 
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="DELETE"
                className="w-full bg-gray-900 border border-red-500/30 rounded-lg px-3 py-2 text-white mb-3 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              />
              <div className="flex space-x-3">
                <Button 
                  variant="secondary" 
                  onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}
                  fullWidth
                >
                  {language === 'en' ? "Cancel" : "Avbryt"}
                </Button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteInput !== 'DELETE' || loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center text-sm"
                >
                  {loading ? '...' : (language === 'en' ? "Delete All" : "Radera Allt")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}