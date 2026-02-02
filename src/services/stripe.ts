/// <reference types="vite/client" />
import { loadStripe } from '@stripe/stripe-js';

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Initialize Stripe
let stripePromise: Promise<any> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

// Payment functions
export const stripeService = {
  async createCheckoutSession(interval: 'monthly' | 'yearly', language: string) {
    try {
      const { createStripeCheckoutSession } = await import('./firebase');
      const result = await createStripeCheckoutSession({ 
        interval, 
        lang: language 
      });
      // Vi berättar för TS att vi förväntar oss ett ID tillbaka
      return result.data as { id: string };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  },

  async createPortalSession() {
    try {
      const { createStripePortalSession } = await import('./firebase');
      const result = await createStripePortalSession();
      // HÄR LÖSER VI FELET: Vi berättar att datan innehåller en URL
      return result.data as { url: string };
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw error;
    }
  },

  async redirectToCheckout(sessionId: string) {
    try {
      const stripe = await getStripe();
      const { error } = await stripe.redirectToCheckout({ sessionId });
      
      if (error) {
        console.error('Stripe checkout error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error redirecting to checkout:', error);
      throw error;
    }
  },

  async manageBilling() {
    try {
      const result = await this.createPortalSession();
      // Nu vet TypeScript att result har en .url property
      window.location.href = result.url;
    } catch (error) {
      console.error('Error managing billing:', error);
      throw error;
    }
  }
};

// Check payment status from URL
export const checkPaymentStatus = () => {
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
};

// Clean URL after payment
export const cleanPaymentUrl = () => {
  if (window.location.search.includes('payment_')) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
};