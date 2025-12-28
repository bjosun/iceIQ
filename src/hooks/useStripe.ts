import { useState, useCallback } from 'react';
import { stripeService, getStripe } from '../services/stripe';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export function useStripe() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCheckoutSession = useCallback(async (interval: 'monthly' | 'yearly') => {
    if (!user) {
      setError('User must be logged in');
      return null;
    }

    setProcessing(true);
    setError(null);

    try {
      const result = await stripeService.createCheckoutSession(interval, language);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create checkout session');
      return null;
    } finally {
      setProcessing(false);
    }
  }, [user, language]);

  const redirectToCheckout = useCallback(async (sessionId: string) => {
    try {
      await stripeService.redirectToCheckout(sessionId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to redirect to checkout');
      return false;
    }
  }, []);

  const manageBilling = useCallback(async () => {
    if (!user) {
      setError('User must be logged in');
      return false;
    }

    setProcessing(true);
    setError(null);

    try {
      await stripeService.manageBilling();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open billing portal');
      return false;
    } finally {
      setProcessing(false);
    }
  }, [user]);

  const checkPaymentStatus = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    
    if (params.get('payment_success')) {
      return { 
        success: true, 
        message: 'Payment successful! Your subscription is now active.' 
      };
    }
    
    if (params.get('payment_cancelled')) {
      return { 
        success: false, 
        message: 'Payment was cancelled.' 
      };
    }
    
    return null;
  }, []);

  const cleanPaymentUrl = useCallback(() => {
    if (window.location.search.includes('payment_')) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const initializeStripe = useCallback(async () => {
    try {
      const stripe = await getStripe();
      return stripe;
    } catch (err) {
      setError('Failed to initialize Stripe');
      return null;
    }
  }, []);

  return {
    createCheckoutSession,
    redirectToCheckout,
    manageBilling,
    checkPaymentStatus,
    cleanPaymentUrl,
    initializeStripe,
    processing,
    error,
    clearError: () => setError(null)
  };
}