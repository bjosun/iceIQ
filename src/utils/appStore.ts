// App Store-länken. Visas först när VITE_APP_STORE_URL är satt (efter
// publicering), så att inga sidor påstår att appen finns innan den gör det.
// Sätts i .env tillsammans med VITE_APP_STORE_ID (för Smart App Banner, se
// vite.config.ts).
export const APP_STORE_URL: string = (import.meta.env.VITE_APP_STORE_URL as string | undefined) || '';

// Sverige (och övriga EU) öppnas först när Apple har verifierat trader-uppgifterna
// (DSA). Tills dess får svenska besökare inte en knapp som leder till "inte
// tillgänglig". Sätt VITE_APP_STORE_SE_OPEN=true när Sverige står som Available.
const SWEDEN_OPEN = import.meta.env.VITE_APP_STORE_SE_OPEN === 'true';

// Appens leverantörs-token (pt) från App Store Connect, för kampanjspårning.
const PROVIDER_TOKEN = (import.meta.env.VITE_APP_STORE_PT as string | undefined) || '';

/** Ska App Store-knappen visas för det här språket? */
export function appStoreAvailable(language: string): boolean {
  return !!APP_STORE_URL && (language !== 'sv' || SWEDEN_OPEN);
}

/**
 * App Store-länken med kampanjparametrar, så att App Store Connect (App Analytics)
 * visar vilken plats som gav installationen. `campaign` är ett kort namn utan
 * mellanslag, till exempel "home_hero". `pt` läggs till när den är satt.
 */
export function appStoreUrl(campaign: string): string {
  if (!APP_STORE_URL) return '';
  const params = new URLSearchParams();
  if (PROVIDER_TOKEN) params.set('pt', PROVIDER_TOKEN);
  params.set('ct', campaign.slice(0, 40));
  params.set('mt', '8');
  return `${APP_STORE_URL}${APP_STORE_URL.includes('?') ? '&' : '?'}${params.toString()}`;
}
