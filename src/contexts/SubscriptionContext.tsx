import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { firestore } from '../services/firebase';
import { stripeService, checkPaymentStatus, cleanPaymentUrl } from '../services/stripe';

// Definiera planen separat så vi kan använda den i andra filer
export type SubscriptionPlan = 'free' | 'premium' | 'elite';

export interface Subscription {
  plan: SubscriptionPlan;
  status: 'active' | 'inactive' | 'cancelled' | 'past_due';
  interval?: 'monthly' | 'yearly';
  subscriptionEnd?: string;
}

interface SubscriptionContextType {
  subscription: Subscription;
  loading: boolean;
  isPremium: boolean; // Helper: True om man har Premium ELLER Elite
  isElite: boolean;   // Helper: True endast om man har Elite
  // Uppdaterad funktion: Tar nu emot vilken plan man vill köpa
  upgradeSubscription: (plan: 'premium' | 'elite', interval: 'monthly' | 'yearly') => Promise<void>;
  manageSubscription: () => Promise<void>;
  checkUserSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription>({ 
    plan: 'free', 
    status: 'active' 
  });
  const [loading, setLoading] = useState(true);

  // Check payment status on mount (t.ex. efter redirect från Stripe)
  useEffect(() => {
    const paymentStatus = checkPaymentStatus();
    if (paymentStatus) {
      // Du kanske vill byta ut alert mot en snygg toast här
      alert(paymentStatus.message);
      cleanPaymentUrl();
    }
  }, []);

  // Load subscription when user changes
  useEffect(() => {
    if (user) {
      checkUserSubscription();
    } else {
      setSubscription({ plan: 'free', status: 'active' });
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const checkUserSubscription = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userData = await firestore.getUserData(user.uid);
      
      if (userData) {
        // Hämta plan, fallback till 'free' om fältet saknas
        const plan = (userData.subscriptionPlan as SubscriptionPlan) || 'free';
        
        setSubscription({
          plan: plan,
          status: userData.subscriptionStatus || 'active',
          interval: userData.subscriptionInterval,
          subscriptionEnd: userData.subscriptionEnd
        });
      } else {
        setSubscription({ plan: 'free', status: 'active' });
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const upgradeSubscription = async (plan: 'premium' | 'elite', interval: 'monthly' | 'yearly') => {
    if (!user) {
      alert('Please log in to upgrade'); // Byt gärna till toast.error
      return;
    }

    try {
      // Hämta aktuellt språk om du har det sparat någonstans
      const language = 'en'; 
      
      // OBS: Du måste uppdatera din stripeService.createCheckoutSession 
      // för att ta emot 'plan'-argumentet och välja rätt Price ID (Premium vs Elite)
      const { id: sessionId } = await stripeService.createCheckoutSession(plan, interval, language);
      
      await stripeService.redirectToCheckout(sessionId);
      
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      alert('Unable to process payment. Please try again.');
    }
  };

  const manageSubscription = async () => {
    if (subscription.plan === 'free') {
      return; 
    }

    try {
      await stripeService.manageBilling();
    } catch (error) {
      console.error('Error managing subscription:', error);
      alert('Unable to open billing portal. Please try again.');
    }
  };

  // Logik för helpers
  const isElite = subscription.plan === 'elite';
  // En Elite-användare har också tillgång till Premium-features
  const isPremium = subscription.plan === 'premium' || subscription.plan === 'elite';

  const value = {
    subscription,
    loading,
    isPremium,
    isElite,
    upgradeSubscription, // Bytte namn från upgradeToPremium för att vara tydligare
    manageSubscription,
    checkUserSubscription
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}