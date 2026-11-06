import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Crown, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import Button from '../ui/Button';
import {
  IapOfferings,
  IapPackage,
  MANAGE_SUBSCRIPTIONS_URL,
  iapGetOfferings,
  iapPurchase,
  iapRestore,
} from '../../services/purchases';

// Köpskärmen i iPhone-appen (Apple In-App Purchase). Priserna kommer från Apple
// (priceString), så skärmen visar alltid det som faktiskt debiteras i kundens
// land. Apple kräver: pris och längd, att prenumerationen förnyas automatiskt,
// länkar till villkor och integritetspolicy, och en knapp för Restore Purchases.
export default function IapPaywall({ onDone }: { onDone: () => void }) {
  const { t } = useLanguage();
  const { subscription, refreshAfterPurchase } = useSubscription();
  const [offerings, setOfferings] = useState<IapOfferings | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const ownedElsewhere = subscription.plan !== 'free' && subscription.source === 'stripe';
  const ownedHere = subscription.plan !== 'free' && subscription.source !== 'stripe';

  useEffect(() => {
    let cancelled = false;
    iapGetOfferings()
      .then((o) => { if (!cancelled) setOfferings(o); })
      .catch((error) => {
        console.warn('Kunde inte hämta köpalternativ:', error);
        if (!cancelled) setOfferings({ premium: [], credits: [] });
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const buy = async (pkg: IapPackage, kind: 'subscription' | 'credits') => {
    setBusy(pkg.identifier);
    try {
      const result = await iapPurchase(pkg);
      if (result === 'cancelled') return;
      if (kind === 'subscription') {
        toast.success(t('iap.activating'));
        const changed = await refreshAfterPurchase();
        if (changed) {
          toast.success(t('iap.thanks'));
          onDone();
        } else {
          toast(t('iap.stillActivating'));
        }
      } else {
        toast.success(t('iap.creditsAdded'));
        onDone();
      }
    } catch (error) {
      console.warn('Köpet misslyckades:', error);
      toast.error(t('iap.purchaseError'));
    } finally {
      setBusy(null);
    }
  };

  const restore = async () => {
    setBusy('restore');
    try {
      await iapRestore();
      const changed = await refreshAfterPurchase();
      toast.success(changed ? t('iap.restored') : t('iap.nothingToRestore'));
    } catch (error) {
      console.warn('Återställning misslyckades:', error);
      toast.error(t('iap.restoreError'));
    } finally {
      setBusy(null);
    }
  };

  const label = (pkg: IapPackage) =>
    pkg.packageType === 'ANNUAL' ? t('iap.yearly') : t('iap.monthly');
  const period = (pkg: IapPackage) =>
    pkg.packageType === 'ANNUAL' ? t('iap.perYear') : t('iap.perMonth');

  const features = [t('premiumFeature3'), t('premiumFeature1'), t('premiumFeature2'), t('premiumFeature4')];

  return (
    <div className="p-4 space-y-5">
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-yellow-500/15 flex items-center justify-center mx-auto mb-3">
          <Crown className="text-yellow-400" size={28} />
        </div>
        <h2 className="text-xl font-bold text-white">{t('iap.title')}</h2>
        <p className="text-sm text-gray-400 mt-1">{t('iap.subtitle')}</p>
      </div>

      {ownedElsewhere && (
        <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-4 text-sm text-gray-300">
          {t('iap.managedOnWeb')}
        </div>
      )}

      {ownedHere && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300 text-center">
          {t('iap.youHavePro')}
          <div className="mt-3">
            <Button variant="secondary" onClick={() => { window.location.href = MANAGE_SUBSCRIPTIONS_URL; }} fullWidth>
              {t('iap.manage')}
            </Button>
          </div>
        </div>
      )}

      {!ownedElsewhere && !ownedHere && (
        <>
          <ul className="space-y-2">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-gray-200">
                <Check size={16} className="text-green-400 mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {loading && <p className="text-center text-sm text-gray-400">{t('iap.loading')}</p>}

          {!loading && offerings && offerings.premium.length === 0 && (
            <p className="text-center text-sm text-gray-400">{t('iap.unavailable')}</p>
          )}

          <div className="space-y-3">
            {offerings?.premium.map((pkg) => (
              <button
                key={pkg.identifier}
                disabled={busy !== null}
                onClick={() => buy(pkg, 'subscription')}
                className="w-full flex items-center justify-between rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-3 text-left disabled:opacity-60 touch-manipulation"
              >
                <span>
                  <span className="block font-semibold text-white">{label(pkg)}</span>
                  <span className="block text-xs text-gray-400">{t('iap.autoRenews')}</span>
                </span>
                <span className="text-right">
                  <span className="block text-lg font-bold text-white">{busy === pkg.identifier ? '…' : pkg.product.priceString}</span>
                  <span className="block text-xs text-gray-400">{period(pkg)}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {offerings && offerings.credits.length > 0 && !ownedElsewhere && (
        <div className="border-t border-gray-700 pt-4">
          <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-yellow-400" /> {t('iap.creditsTitle')}
          </h3>
          {offerings.credits.map((pkg) => (
            <button
              key={pkg.identifier}
              disabled={busy !== null}
              onClick={() => buy(pkg, 'credits')}
              className="w-full flex items-center justify-between rounded-xl border border-gray-600 bg-gray-800/60 px-4 py-3 text-left disabled:opacity-60 touch-manipulation"
            >
              <span className="text-sm text-white">{t('iap.creditsPack')}</span>
              <span className="font-bold text-white">{busy === pkg.identifier ? '…' : pkg.product.priceString}</span>
            </button>
          ))}
        </div>
      )}

      <div className="text-center">
        <button
          onClick={restore}
          disabled={busy !== null}
          className="text-sm text-cyan-400 hover:text-cyan-300 disabled:opacity-60 touch-manipulation"
        >
          {busy === 'restore' ? '…' : t('iap.restore')}
        </button>
      </div>

      <p className="text-[11px] leading-snug text-gray-500">
        {t('iap.legal')}
      </p>
      <div className="flex justify-center gap-5 text-xs">
        <Link to="/terms" onClick={onDone} className="text-gray-400 underline">{t('termsLink')}</Link>
        <Link to="/privacy" onClick={onDone} className="text-gray-400 underline">{t('privacyLink')}</Link>
      </div>
    </div>
  );
}
