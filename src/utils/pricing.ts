// Priser på ETT ställe i klienten. Innan den här filen fanns låg samma
// belopp hårdkodade i Home.tsx, SubscriptionModal.tsx och translations.ts,
// och de hade redan hunnit glida isär: Elite år stod som 890 på startsidan
// och 899 i uppgraderingsmodalen.
//
// Beloppen speglar PRICES i functions/index.js och anges i minsta enhet
// (öre/cent), precis som Stripes unit_amount — så att de går att jämföra
// rakt av. Backend kontrollerar sitt eget belopp mot Stripe innan kassan
// öppnas, så om den här filen och backend glider isär blir det ett fel i
// kassan i stället för ett pris kunden ser men inte debiteras.

export type Currency = 'sek' | 'usd';
export type PaidPlan = 'premium' | 'elite';
export type Interval = 'monthly' | 'yearly';

type PlanPrices = Record<PaidPlan, Record<Interval, number>>;

const SEK_PRICES: PlanPrices = {
  premium: { monthly: 2900, yearly: 29900 },
  elite: { monthly: 8900, yearly: 89000 },
};

// USD-beloppen i Stripe. Måste vara exakt samma tal som USD_TABLE i
// functions/index.js — backend jämför mot Stripes unit_amount innan kassan
// öppnas, så en avvikelse här blir ett tydligt fel i kassan i stället för ett
// pris kunden ser men inte debiteras.
//
// Halva tabellen duger inte: en engelsk pristabell med "Premium 29 SEK/month"
// bredvid "Elite $9.90/month" vore sämre än att visa allt i kronor. Därför är
// det Premium-postens existens, inte en separat flagga, som utgör på/av.
//
// Valutan väljs på SPRÅK, inte land (se currencyForLanguage nedan). Det är
// därför USD och inte CAD: en kanadensare, amerikan och britt har alla
// språket 'en', och det finns inget i klienten som skiljer dem åt.
const USD_TABLE: Partial<PlanPrices> = {
  premium: { monthly: 299, yearly: 2900 },
  elite: { monthly: 990, yearly: 9900 },
};

const USD_PRICES: PlanPrices | null =
  USD_TABLE.premium && USD_TABLE.elite
    ? { premium: USD_TABLE.premium, elite: USD_TABLE.elite }
    : null;

// Svenskspråkiga kunder betalar i SEK, alla andra i USD. Samma regel som
// currencyForLang() i functions/index.js — ändras den ena måste den andra
// ändras med.
export function currencyForLanguage(language: string): Currency {
  if (language === 'sv') return 'sek';
  return USD_PRICES ? 'usd' : 'sek';
}

export function priceFor(plan: PaidPlan, interval: Interval, currency: Currency): number {
  const table = currency === 'usd' && USD_PRICES ? USD_PRICES : SEK_PRICES;
  return table[plan][interval];
}

// Beloppet utan valuta: "29", "299", "4.99". Ören/cent visas bara när de
// faktiskt finns, så svenska priser inte plötsligt står som "29,00".
export function formatAmount(amount: number, currency: Currency): string {
  const major = amount / 100;
  const hasFraction = amount % 100 !== 0;
  if (currency === 'usd') {
    return `$${hasFraction ? major.toFixed(2) : String(major)}`;
  }
  return String(major);
}

// Suffixet efter beloppet: "kr/mån", "SEK/year", "/month".
// USD-beloppet bär redan sitt $, så där ska ingen valutakod upprepas.
export function currencyLabel(currency: Currency, language: string): string {
  if (currency === 'usd') return '';
  return language === 'sv' ? 'kr' : 'SEK';
}

// Färdig prisrad, t.ex. "29 kr" eller "$4.99".
export function formatPrice(amount: number, currency: Currency, language: string): string {
  const label = currencyLabel(currency, language);
  const value = formatAmount(amount, currency);
  return label ? `${value} ${label}` : value;
}

// Vad Money Mode ska räknas i. Ingen koppling till Stripe — det är förälderns
// egna pengar, inte något vi debiterar — men det ska följa samma språkregel
// så att inte appen visar "kr" för någon som läser resten på engelska.
export function moneyModeUnit(language: string): string {
  return language === 'sv' ? 'kr' : 'USD';
}

// Måste matcha CREDITS_PER_PACK i functions/index.js — antalet krediter i
// engångspaketet, oavsett valuta.
export const CREDITS_PER_PACK = 15;

// Engångspris för kreditpaketet. Samma belopp som SEK_TABLE.credits /
// USD_TABLE.credits i functions/index.js. Till skillnad från Premium/Elite
// finns priset alltid i båda valutorna, så det behöver inget på/av-villkor.
const CREDIT_PACK_AMOUNT: Record<Currency, number> = {
  sek: 4900,
  usd: 499,
};

// Färdig prisrad för kreditpaketet i knapptexter, t.ex. "49 kr" eller
// "$4.99" — så att köpknappen aldrig ber om ett belopp kunden inte såg innan
// hen klickade sig in i Stripes kassa.
export function creditPackPrice(language: string): string {
  const currency = currencyForLanguage(language);
  return formatPrice(CREDIT_PACK_AMOUNT[currency], currency, language);
}
