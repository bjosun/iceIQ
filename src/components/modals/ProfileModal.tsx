import React, { useState } from 'react';
import { LogOut, CreditCard, Trash2, Shield, Mail, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Card from '../ui/Card';
import toast from 'react-hot-toast';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPremium: boolean; // Vi skickar med om de är premium eller ej
}

export default function ProfileModal({ isOpen, onClose, isPremium }: ProfileModalProps) {
  const { user, logout, deleteAccount } = useAuth(); // Antar att deleteAccount finns i AuthContext, annars lägger vi till det
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  // 1. Hantera Utloggning
  const handleLogout = async () => {
    try {
      await logout();
      onClose();
      toast.success(t('loggedOut') || "Utloggad!");
    } catch (error) {
      toast.error("Kunde inte logga ut.");
    }
  };

  // 2. Hantera Prenumeration (Avsluta/Hantera)
  const handleManageSubscription = () => {
    // Här ska du egentligen omdirigera till Stripe Customer Portal
    // Eller anropa en Cloud Function som säger upp prenumerationen
    if (isPremium) {
      // Exempel: window.location.href = "DIN_STRIPE_PORTAL_LÄNK";
      toast("Funktion för att hantera Stripe kommer här.", { icon: '💳' });
      // Om du vill bygga en enkel "Avsluta"-knapp i Firebase:
      // await cancelSubscription(); 
    } else {
      toast.error("Du har ingen aktiv prenumeration.");
    }
  };

  // 3. Hantera Borttagning av konto
  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE') return;
    
    setLoading(true);
    try {
      // Här måste vi anropa en funktion som raderar all data i Firestore FÖRST
      // Sen raderar vi användaren i Auth.
      await deleteAccount(); 
      toast.success("Ditt konto och all data har raderats.");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Kunde inte radera kontot. Logga in igen och försök igen."); // Firebase kräver färsk inloggning för detta
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('myAccount') || "Mitt Konto"} size="md">
      <div className="p-6 space-y-6">
        
        {/* Användarinfo */}
        <div className="flex items-center space-x-4 p-4 bg-gray-800 rounded-xl border border-gray-700">
          <div className="bg-gray-700 p-3 rounded-full">
            <User className="text-cyan-400" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-400">Inloggad som</p>
            <p className="text-white font-medium">{user?.email}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${isPremium ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-600 text-gray-300'}`}>
              {isPremium ? 'Premium Plan' : 'Free Plan'}
            </span>
          </div>
        </div>

        {/* Prenumerationshantering */}
        <Card>
          <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
            <CreditCard className="mr-2 text-cyan-400" size={20}/> Prenumeration
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            {isPremium 
              ? "Du är Premium-medlem. Du kan avsluta din prenumeration när som helst. Ditt konto kommer finnas kvar, men begränsas till 1 spelare." 
              : "Du använder gratisversionen."}
          </p>
          
          {isPremium && (
            <Button variant="secondary" onClick={handleManageSubscription} fullWidth>
              Hantera / Avsluta Prenumeration
            </Button>
          )}
        </Card>

        {/* Logga ut */}
        <Button variant="secondary" onClick={handleLogout} icon={LogOut} fullWidth>
          {t('logout') || "Logga ut"}
        </Button>

        {/* Danger Zone (Ta bort konto) */}
        <div className="pt-6 border-t border-gray-700">
          {!showDeleteConfirm ? (
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full text-red-500 hover:text-red-400 text-sm font-medium flex items-center justify-center py-2"
            >
              <Trash2 size={16} className="mr-2" />
              {t('deleteAccount') || "Radera konto och all data"}
            </button>
          ) : (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
              <h4 className="text-red-400 font-bold mb-2 flex items-center">
                <Shield size={18} className="mr-2"/> Varning!
              </h4>
              <p className="text-xs text-gray-300 mb-4">
                Detta raderar permanent all din historik, spelare och inställningar. Det går inte att ångra.
                Skriv <strong>DELETE</strong> för att bekräfta.
              </p>
              <input 
                type="text" 
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="Type DELETE"
                className="w-full bg-gray-900 border border-red-500/50 rounded-lg px-3 py-2 text-white mb-3 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="flex space-x-3">
                <Button 
                  variant="secondary" 
                  onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}
                  fullWidth
                >
                  Avbryt
                </Button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteInput !== 'DELETE' || loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                  {loading ? 'Raderar...' : 'Radera Allt'}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </Modal>
  );
}