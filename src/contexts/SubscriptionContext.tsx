// TODO: implement SubscriptionContext
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { firestore } from '../services/firebase';
import { stripeService, checkPaymentStatus, cleanPaymentUrl } from '../services/stripe';

interface Subscription {
  plan: 'free' | 'premium';
  status: 'active' | 'inactive' | 'cancelled';
  interval?: 'monthly' | 'yearly';
  subscriptionEnd?: string;
}

interface SubscriptionContextType {
  subscription: Subscription;
  loading: boolean;
  upgradeToPremium: (interval: 'monthly' | 'yearly') => Promise<void>;
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

  // Check payment status on mount
  useEffect(() => {
    const paymentStatus = checkPaymentStatus();
    if (paymentStatus) {
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
  }, [user]);

  const checkUserSubscription = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userData = await firestore.getUserData(user.uid);
      
      if (userData) {
        const sub: Subscription = {
          plan: userData.subscriptionPlan || 'free',
          status: userData.subscriptionStatus || 'active',
          interval: userData.subscriptionInterval,
          subscriptionEnd: userData.subscriptionEnd
        };

        // Check if subscription has expired
        if (sub.subscriptionEnd && new Date() > new Date(sub.subscriptionEnd)) {
          await firestore.updateSubscription(user.uid, {
            plan: 'free',
            status: 'active',
            interval: null,
            subscriptionEnd: null
          });
          setSubscription({ plan: 'free', status: 'active' });
        } else {
          setSubscription(sub);
        }
      } else {
        // Initialize new user
        await firestore.updateUserData(user.uid, {
          subscriptionPlan: 'free',
          subscriptionStatus: 'active',
          createdAt: new Date().toISOString(),
          customTemplates: {}
        });
        setSubscription({ plan: 'free', status: 'active' });
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const upgradeToPremium = async (interval: 'monthly' | 'yearly') => {
    if (!user) {
      alert('Please log in to upgrade');
      return;
    }

    try {
      // Get current language (you'll need to add language context)
      const language = 'en'; // Replace with actual language
      
      const { id: sessionId } = await stripeService.createCheckoutSession(interval, language);
      await stripeService.redirectToCheckout(sessionId);
      
    } catch (error) {
      console.error('Error upgrading to premium:', error);
      alert('Unable to process payment. Please try again.');
    }
  };

  const manageSubscription = async () => {
    if (subscription.plan === 'free') {
      return; // Open subscription modal instead
    }

    try {
      await stripeService.manageBilling();
    } catch (error) {
      console.error('Error managing subscription:', error);
      alert('Unable to open billing portal. Please try again.');
    }
  };

  const value = {
    subscription,
    loading,
    upgradeToPremium,
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