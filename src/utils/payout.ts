// Vilken utbetalningsgenväg som finns i Money Mode beror på LAND, inte språk:
// en svensk som kör appen på engelska ska få Swish, och en amerikan ska
// aldrig se det. Idag finns bara Swish (Sverige). Alla andra ser bara den
// vanliga "Betald"-knappen (markera som betald), precis som förut.
//
// Nästa länder läggs till som egna poster i PAYOUT_METHODS (se
// docs/payout-methods.md för vad som är känt om respektive land).

export type Region = 'SE' | 'NO' | 'DK' | 'FI' | 'US' | 'CA' | 'GB' | 'OTHER';

const REGION_CODES = new Set<Region>(['SE', 'NO', 'DK', 'FI', 'US', 'CA', 'GB']);

// Språk som är så starkt knutna till ett land att det duger när telefonen
// bara anger språket ("sv") utan region.
const LANGUAGE_FALLBACK: Record<string, Region> = {
  sv: 'SE',
  nb: 'NO',
  nn: 'NO',
  no: 'NO',
  da: 'DK',
  fi: 'FI',
};

// "sv-SE" -> SE, "en-US" -> US, "en" -> OTHER, "sv" -> SE, "en-GB" -> GB.
export function regionFromLocale(locale: string | undefined | null): Region {
  if (!locale) return 'OTHER';
  const parts = locale.replace('_', '-').split('-');
  const language = parts[0].toLowerCase();
  const region = parts.find((p, i) => i > 0 && /^[A-Za-z]{2}$/.test(p))?.toUpperCase() as Region | undefined;
  if (region) return REGION_CODES.has(region) ? region : 'OTHER';
  return LANGUAGE_FALLBACK[language] ?? 'OTHER';
}

// Telefonens/webbläsarens region (iOS: Inställningar > Allmänt > Språk och
// region). Faller tillbaka på appens valda språk om inget annat finns.
export function detectRegion(appLanguage?: string): Region {
  const locales = typeof navigator !== 'undefined'
    ? [...(navigator.languages ?? []), navigator.language]
    : [];
  for (const locale of locales) {
    const region = regionFromLocale(locale);
    if (region !== 'OTHER') return region;
  }
  return regionFromLocale(appLanguage);
}

export type PayoutMethodId = 'swish';

interface PayoutMethod {
  id: PayoutMethodId;
  regions: Region[];
}

export const PAYOUT_METHODS: PayoutMethod[] = [
  { id: 'swish', regions: ['SE'] },
  // { id: 'vipps', regions: ['NO'] },     // se docs/payout-methods.md
  // { id: 'venmo', regions: ['US'] },
];

// Genvägen för ett land, eller null: då visas bara "Betald"-knappen.
export function payoutMethodFor(region: Region): PayoutMethodId | null {
  return PAYOUT_METHODS.find((m) => m.regions.includes(region))?.id ?? null;
}
