import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('sv-SE');
}

export function formatCurrency(amount: number, currency: 'SEK' | 'USD' = 'SEK'): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

const UTM_PARAMS = ['source', 'medium', 'campaign', 'term', 'content'] as const;

// UTM-parametrar från URL:en hålls i minnet (inte i enhetens lagring) tills ett
// konto skapas. Då behövs inget samtycke för att läsa eller skriva något på
// enheten (ePrivacy/LEK 9 kap. 28 §): att läsa adressen man själv öppnat är
// inte lagring. Priset är att källan bara överlever så länge sidan inte laddas
// om; sidnavigering i appen (en SPA) räknas däremot. Första-touch: skriver bara
// om inget redan finns.
let memoryUtm: Record<string, string> | null = null;

export function captureUtmParams(search: string = window.location.search): void {
  if (memoryUtm) return;

  const params = new URLSearchParams(search);
  const source = params.get('utm_source');
  if (!source) return;

  const utm: Record<string, string> = { source };
  UTM_PARAMS.slice(1).forEach((key) => {
    const value = params.get(`utm_${key}`);
    if (value) utm[key] = value;
  });

  memoryUtm = utm;
}

// Läses vid kontoskapande (AuthContext) och töms sedan — attributionen ska bara
// gälla det EN gången ett konto faktiskt skapas av den besökaren.
export function consumeUtmParams(): Record<string, string> | null {
  const value = memoryUtm;
  memoryUtm = null;
  return value;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  // ÄNDRING HÄR: Vi använder ReturnType<typeof setTimeout> istället för NodeJS.Timeout
  let timeout: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function generateId(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function calculateTotalPoints(
  counts: Record<string, number>,
  actions: Array<{ name: { en: string; sv: string }; points: number }>
): number {
  let total = 0;
  
  for (const [key, count] of Object.entries(counts)) {
    try {
      const actionName = JSON.parse(key);
      const action = actions.find(a => 
        a.name.en === actionName.en || a.name.sv === actionName.sv
      );
      if (action) {
        total += count * action.points;
      }
    } catch {
      // If key is not JSON, try to find by string
      const action = actions.find(a => 
        a.name.en === key || a.name.sv === key
      );
      if (action) {
        total += count * action.points;
      }
    }
  }
  
  return total;
}