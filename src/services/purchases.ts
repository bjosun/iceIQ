// Köp i iPhone-appen via RevenueCat (Apple In-App Purchase). Bara i den
// inbyggda appen och bara när flaggan VITE_IAP_ENABLED är 'true' och den
// publika SDK-nyckeln finns: annars är allt avstängt och inga köpskärmar visas.
//
// Pluginet laddas dynamiskt så att det aldrig hamnar i webbens bundle.
// Köpen skrivs till Firestore av webhooken (functions/revenuecat.js); appen
// läser bara om kontots prenumeration efteråt. Se docs/iap-plan.md.

import { isNativeApp } from '../utils/platform';

const API_KEY = (import.meta.env.VITE_REVENUECAT_IOS_KEY as string | undefined) || '';

export const iapEnabled: boolean =
  isNativeApp && import.meta.env.VITE_IAP_ENABLED === 'true' && API_KEY.startsWith('appl_');

type PurchasesModule = typeof import('@revenuecat/purchases-capacitor');
export type IapPackage = import('@revenuecat/purchases-capacitor').PurchasesPackage;

let modulePromise: Promise<PurchasesModule> | null = null;
let configured = false;
let currentUid: string | null = null;

async function load(): Promise<PurchasesModule> {
  if (!modulePromise) modulePromise = import('@revenuecat/purchases-capacitor');
  return modulePromise;
}

async function ensureConfigured(): Promise<PurchasesModule['Purchases']> {
  const { Purchases } = await load();
  if (!configured) {
    await Purchases.configure({ apiKey: API_KEY });
    configured = true;
  }
  return Purchases;
}

/** Kopplar köp till Firebase-kontot. Utan det hamnar köpen på ett anonymt ID som webhooken ignorerar. */
export async function iapLogIn(uid: string): Promise<void> {
  if (!iapEnabled) return;
  try {
    const Purchases = await ensureConfigured();
    if (currentUid === uid) return;
    await Purchases.logIn({ appUserID: uid });
    currentUid = uid;
  } catch (error) {
    console.warn('RevenueCat logIn misslyckades:', error);
  }
}

export async function iapLogOut(): Promise<void> {
  if (!iapEnabled || !configured) return;
  try {
    const { Purchases } = await load();
    await Purchases.logOut();
  } catch (error) {
    // Kastar om användaren redan är anonym: ofarligt.
    console.warn('RevenueCat logOut:', error);
  } finally {
    currentUid = null;
  }
}

export interface IapOfferings {
  /** Premium: månad och år (offering "default"). */
  premium: IapPackage[];
  /** Kreditpaketet (offering "credits"). */
  credits: IapPackage[];
}

export async function iapGetOfferings(): Promise<IapOfferings> {
  const Purchases = await ensureConfigured();
  const offerings = await Purchases.getOfferings();
  return {
    premium: offerings.all?.default?.availablePackages ?? offerings.current?.availablePackages ?? [],
    credits: offerings.all?.credits?.availablePackages ?? [],
  };
}

export type IapResult = 'purchased' | 'cancelled';

export async function iapPurchase(aPackage: IapPackage): Promise<IapResult> {
  const Purchases = await ensureConfigured();
  try {
    await Purchases.purchasePackage({ aPackage });
    return 'purchased';
  } catch (error: any) {
    if (error?.userCancelled) return 'cancelled';
    throw error;
  }
}

export async function iapRestore(): Promise<void> {
  const Purchases = await ensureConfigured();
  await Purchases.restorePurchases();
}

/** Apples egen sida för att hantera eller säga upp en prenumeration. */
export const MANAGE_SUBSCRIPTIONS_URL = 'itms-apps://apps.apple.com/account/subscriptions';
