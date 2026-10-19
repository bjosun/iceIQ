import React, { useState, useEffect } from 'react';
import { LogOut, CreditCard, Trash2, Shield, User, Mail, Lock, Download } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { euFunctions } from '../../services/firestore';
import { saveTextFile } from '../../utils/saveFile';
import { withdrawAiConsent } from '../../utils/aiConsent';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { isNativeApp } from '../../utils/platform';
import { appLockAvailable, appLockEnabled, setAppLockEnabled, unlockWithBiometry } from '../../utils/appLock';
import { createStripePortalSession } from '../../services/firestore'; // Från din städade firebase.ts
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
  const { t, language } = useLanguage();

  // Hämta en kopia av sina uppgifter (rätten till tillgång/dataportabilitet).
  const [exporting, setExporting] = useState(false);
  const handleExportData = async () => {
    setExporting(true);
    try {
      const res = await httpsCallable(euFunctions, 'exportMyData')({});
      const day = new Date().toISOString().slice(0, 10);
      await saveTextFile(`iceiq-mina-uppgifter-${day}.json`, JSON.stringify(res.data, null, 2));
    } catch (err: any) {
      if (!/cancel/i.test(String(err?.message || err))) toast.error(t('dataRights.error'));
    } finally {
      setExporting(false);
    }
  };

  // Återkalla samtycket till AI-coachen (art. 7.3): lika enkelt som att ge det.
  const handleWithdrawAi = async () => {
    if (!user || !window.confirm(t('dataRights.withdrawConfirm'))) return;
    const erase = window.confirm(t('dataRights.withdrawErase'));
    try {
      await withdrawAiConsent(user.uid, erase);
      toast.success(t('dataRights.withdrawn'));
    } catch {
      toast.error(t('dataRights.error'));
    }
  };

  // Face ID-spärren: att slå på den kräver att man bekräftar en gång, så att
  // man inte kan låsa ute sig själv med en biometri som inte fungerar.
  const [lockAvailable, setLockAvailable] = useState(false);
  const [lockOn, setLockOn] = useState<boolean>(() => appLockEnabled());
  useEffect(() => {
    if (isNativeApp) appLockAvailable().then(setLockAvailable);
  }, []);
  const handleLockToggle = async () => {
    if (lockOn) {
      setAppLockEnabled(false);
      setLockOn(false);
      return;
    }
    if (await unlockWithBiometry(t('appLock.reason'))) {
      setAppLockEnabled(true);
      setLockOn(true);
    }
  };
  
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [digestEnabled, setDigestEnabled] = useState(true);

  // Läs in veckomejl-inställningen när modalen öppnas (på som standard)
  useEffect(() => {
    if (!isOpen || !user) return;
    getDoc(doc(db, 'artifacts', 'default-app-id', 'users', user.uid))
      .then((snap) => setDigestEnabled(snap.data()?.emailDigest !== false))
      .catch(() => setDigestEnabled(true));
  }, [isOpen, user]);

  const handleToggleDigest = async () => {
    if (!user) return;
    const next = !digestEnabled;
    setDigestEnabled(next); // optimistiskt
    try {
      await setDoc(
        doc(db, 'artifacts', 'default-app-id', 'users', user.uid),
        { emailDigest: next },
        { merge: true }
      );
    } catch (error) {
      setDigestEnabled(!next);
      toast.error(language === 'en' ? 'Could not save setting.' : 'Kunde inte spara inställningen.');
    }
  };
  const [deleteInput, setDeleteInput] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const usesPassword = !!user?.providerData.some((p) => p.providerId === 'password');

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
      // Raderar all data i Firestore (spelare, matcher, användarrot) och därefter
      // användaren i Auth (vilket även triggar Stripe-raderingen). Apple-konton
      // loggar in på nytt först — se deleteAccount i AuthContext.
      await deleteAccount(usesPassword ? deletePassword : undefined);
      
      toast.success(language === 'en' ? "Account deleted." : "Ditt konto har raderats.");
      onClose();
    } catch (error: any) {
      console.error("Delete error:", error);
      const code = String(error?.message || '');
      if (code === 'WRONG_PASSWORD' || code === 'PASSWORD_REQUIRED') {
        toast.error(language === 'en' ? "Wrong password. Nothing was deleted." : "Fel lösenord. Inget har raderats.");
      } else if (code === 'RECENT_LOGIN_REQUIRED') {
        toast.error(language === 'en'
          ? "Please log out and in again, then try right away. Nothing was deleted."
          : "Logga ut och in igen och försök direkt. Inget har raderats.");
      } else {
        toast.error(language === 'en'
          ? "Could not delete the account. Nothing was lost, please try again."
          : "Det gick inte att radera kontot. Försök igen.");
      }
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

        {/* Appspärr (bara iPhone-appen, och bara om enheten har Face ID/kod) */}
        {lockAvailable && (
          <Card className="bg-gray-800/50">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Lock className="mr-2 text-cyan-400" size={20} />
                  {t('appLock.title')}
                </h3>
                <p className="text-sm text-gray-400 mt-1">{t('appLock.desc')}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={lockOn}
                aria-label={t('appLock.title')}
                onClick={handleLockToggle}
                className={`relative shrink-0 w-12 h-7 rounded-full transition-colors touch-manipulation ${
                  lockOn ? 'bg-cyan-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    lockOn ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </Card>
        )}

        {/* Prenumerationshantering */}
        <Card className="bg-gray-800/50">
          <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
            <CreditCard className="mr-2 text-cyan-400" size={20}/> 
            {language === 'en' ? "Subscription" : "Prenumeration"}
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            {isPremium 
              ? (isNativeApp
                  ? (language === 'en' ? "You are a Premium member." : "Du är Premium-medlem.")
                  : language === 'en' 
                  ? "You are a Premium member. Manage your subscription or cancel anytime below." 
                  : "Du är Premium-medlem. Du kan hantera eller avsluta din prenumeration här.")
              : (language === 'en'
                  ? "You are using the free version."
                  : "Du använder gratisversionen.")}
          </p>
          
          {isPremium && !isNativeApp && (
            <Button variant="secondary" onClick={handleManageSubscription} loading={loading} fullWidth>
              {language === 'en' ? "Manage / Cancel Subscription" : "Hantera / Avsluta Prenumeration"}
            </Button>
          )}
        </Card>

        {/* Veckomejl */}
        <Card className="bg-gray-800/50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1 flex items-center">
                <Mail className="mr-2 text-cyan-400" size={20}/>
                {t('digest.title')}
              </h3>
              <p className="text-sm text-gray-400">{t('digest.desc')}</p>
            </div>
            <button
              onClick={handleToggleDigest}
              role="switch"
              aria-checked={digestEnabled}
              className={`shrink-0 w-12 h-6 rounded-full p-0.5 transition-colors ${digestEnabled ? 'bg-cyan-600' : 'bg-gray-600'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${digestEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </Card>

        {/* Dina uppgifter */}
        <Card className="bg-gray-800/50">
          <h3 className="text-lg font-semibold text-white mb-1 flex items-center">
            <Download className="mr-2 text-cyan-400" size={20} />
            {t('dataRights.title')}
          </h3>
          <p className="text-sm text-gray-400 mb-3">{t('dataRights.desc')}</p>
          <Button variant="secondary" onClick={handleExportData} loading={exporting} fullWidth>
            {t('dataRights.download')}
          </Button>
          <button
            onClick={handleWithdrawAi}
            className="mt-3 w-full text-sm text-gray-400 hover:text-white underline underline-offset-2"
          >
            {t('dataRights.withdraw')}
          </button>
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
              {usesPassword && (
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder={language === 'en' ? 'Your password' : 'Ditt lösenord'}
                  autoComplete="current-password"
                  className="w-full bg-gray-900 border border-red-500/30 rounded-lg px-3 py-2 text-white mb-3 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                />
              )}
              <div className="flex space-x-3">
                <Button 
                  variant="secondary" 
                  onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); setDeletePassword(''); }}
                  fullWidth
                >
                  {language === 'en' ? "Cancel" : "Avbryt"}
                </Button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteInput !== 'DELETE' || (usesPassword && !deletePassword) || loading}
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