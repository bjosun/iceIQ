// App Store-länken. Visas först när VITE_APP_STORE_URL är satt (efter
// publicering), så att inga sidor påstår att appen finns innan den gör det.
// Sätts i .env tillsammans med VITE_APP_STORE_ID (för Smart App Banner, se
// vite.config.ts). Lägg gärna kampanjparametrar på länken (?pt=…&ct=…) för
// att se i App Store Connect vilka sidor som ger installationer.
export const APP_STORE_URL: string = (import.meta.env.VITE_APP_STORE_URL as string | undefined) || '';
