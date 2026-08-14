/// <reference types="vite/client" />
import { loadStripe } from '@stripe/stripe-js';
// Vi importerar funktionerna direkt här för att få rätt typer
import { functions } from './firebase'; // Se till att sökvägen stämmer till din firebase config
import { httpsCallable } from 'firebase/functions';

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
let stripePromise: Promise<any> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

export const stripeService = {
  // UPPDATERAD: Tar nu emot 'plan' som första argument
  async createCheckoutSession(plan: 'premium' | 'elite' | 'credits', interval: 'monthly' | 'yearly', language: string) {
    try {
      // Anropa Cloud Function direkt här
      const createStripeCheckoutSession = httpsCallable(functions, 'createStripeCheckoutSession');
      
      const result = await createStripeCheckoutSession({ 
        plan,      // Skicka med 'premium' eller 'elite'
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
      const createStripePortalSession = httpsCallable(functions, 'createStripePortalSession');
      const result = await createStripePortalSession();
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
  
  // session_id hanteras av /success-sidan, som vet vad som köptes och är
  // översatt — en alert här skulle dubbla meddelandet och gissa fel produkt.

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
  const url = new URL(window.location.href);
  if (url.searchParams.has('session_id') || url.searchParams.has('payment_success') || url.searchParams.has('payment_cancelled')) {
    url.searchParams.delete('session_id');
    url.searchParams.delete('payment_success');
    url.searchParams.delete('payment_cancelled');
    window.history.replaceState({}, document.title, url.pathname);
  }
};