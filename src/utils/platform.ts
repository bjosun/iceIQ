import { Capacitor } from '@capacitor/core';

// True i iOS-appen (Capacitor), false på webben. Apple kräver In-App Purchase
// för digitala köp i appen, så all Stripe-betalning och alla prisuppgifter
// döljs här tills IAP finns. Webben är opåverkad.
export const isNativeApp = Capacitor.isNativePlatform();
