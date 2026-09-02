import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useLanguage } from '../../contexts/LanguageContext';

// Stripe sätter subscriptionStatus till "past_due" via webhooken när en
// förnyelse misslyckas (nästan alltid ett kort som gått ut). Utan den här
// bannern får kunden ingen signal alls inne i appen — Stripes egna
// dunning-mejl är enda kontakten, och de hamnar lätt i skräpposten.
//
// Medvetet INTE avfärdbar: att stänga den betyder att man glömmer bort
// det tills prenumerationen faktiskt sägs upp av Stripe.
export default function PaymentAlertBanner() {
  const { subscription, manageSubscription } = useSubscription();
  const { t } = useLanguage();
  const [opening, setOpening] = useState(false);

  if (subscription.status !== 'past_due') return null;

  // manageSubscription() gör ett anrop till createStripePortalSession innan
  // redirecten, så det dröjer en stund — utan loading-läge hinner man klicka
  // flera gånger och tro att knappen är trasig.
  const handleClick = async () => {
    setOpening(true);
    try {
      await manageSubscription();
    } finally {
      setOpening(false);
    }
  };

  return (
    <div className="bg-orange-500/10 border-b border-orange-500/25">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-start gap-3 flex-grow min-w-0">
          <AlertCircle className="text-orange-400 shrink-0 mt-0.5" size={20} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-orange-200">
              {t('billing.pastDueTitle')}
            </p>
            <p className="text-sm text-orange-200/70">
              {t('billing.pastDueBody')}
            </p>
          </div>
        </div>
        <button
          onClick={handleClick}
          disabled={opening}
          className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold bg-orange-500 hover:bg-orange-400 text-black transition-colors disabled:opacity-60 disabled:cursor-wait"
        >
          {opening ? t('billing.pastDueOpening') : t('billing.pastDueAction')}
        </button>
      </div>
    </div>
  );
}
