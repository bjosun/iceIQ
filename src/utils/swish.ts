// Swish-genväg för Money Mode (Sverige). Appen öppnar Swish förifyllt; själva
// betalningen bekräftas av föräldern i Swish, och appen får inget svar tillbaka.
//
// Spelarens mobilnummer är ett barns personuppgift. Det sparas därför ENBART
// i localStorage på förälderns egen enhet — aldrig i Firestore, aldrig i
// spelarvyn eller delningslänkar, aldrig i statistik.

const STORAGE_KEY = 'iceiq-swish-numbers';

// Svenskt mobilnummer -> 07XXXXXXXX (10 siffror). Tar emot 070-123 45 67,
// +46 70 123 45 67 och 0046701234567. Allt som inte är ett mobilnummer ger null.
export function normalizeSwishNumber(raw: string): string | null {
  let digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+46')) digits = '0' + digits.slice(3);
  else if (digits.startsWith('0046')) digits = '0' + digits.slice(4);
  else if (digits.startsWith('46') && digits.length === 11) digits = '0' + digits.slice(2);
  return /^07\d{8}$/.test(digits) ? digits : null;
}

// Meddelandefältet i Swish rymmer högst 50 tecken.
export function swishMessage(playerName: string): string {
  return `Ice IQ ${playerName}`.slice(0, 50);
}

export function buildSwishUrl(number: string, amount: number, message: string): string {
  const data = {
    version: 1,
    payee: { value: number, editable: false },
    amount: { value: Math.round(amount), editable: true },
    message: { value: message, editable: true },
  };
  return `swish://payment?data=${encodeURIComponent(JSON.stringify(data))}`;
}

function readAll(): Record<string, string> {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function getSwishNumber(playerName: string): string | null {
  return readAll()[playerName] ?? null;
}

export function setSwishNumber(playerName: string, number: string | null): void {
  try {
    const all = readAll();
    if (number) all[playerName] = number;
    else delete all[playerName];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // localStorage kan vara blockerat (privat läge): då får numret fyllas i varje gång.
  }
}

// Swish finns bara på mobil. På desktop vore knappen en död länk.
export function swishAvailable(language: string): boolean {
  return language === 'sv' && /iPhone|iPad|Android/i.test(navigator.userAgent);
}
