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

const UTM_STORAGE_KEY = 'iceiq-utm';
const UTM_PARAMS = ['source', 'medium', 'campaign', 'term', 'content'] as const;

// Läs in UTM-parametrar från URL:en och spara dem lokalt, så källan
// finns kvar när kontot väl skapas (kan vara flera klick/sidor senare).
// Första-touch: skriver bara om inget redan sparats, så en retargeting-
// annons inte tar äran från kampanjen som faktiskt drog in besökaren.
// localStorage, inte sessionStorage — attributionen ska överleva att
// fliken stängs, inte bara det pågående besöket (samma val som språket,
// se AuthContext.tsx).
export function captureUtmParams(search: string = window.location.search): void {
  if (localStorage.getItem(UTM_STORAGE_KEY)) return;

  const params = new URLSearchParams(search);
  const source = params.get('utm_source');
  if (!source) return;

  const utm: Record<string, string> = { source };
  UTM_PARAMS.slice(1).forEach((key) => {
    const value = params.get(`utm_${key}`);
    if (value) utm[key] = value;
  });

  localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
}

// Läses vid kontoskapande (AuthContext) och tas sedan bort — attributionen
// ska bara gälla det EN gången ett konto faktiskt skapas av den besökaren.
export function consumeUtmParams(): Record<string, string> | null {
  const raw = localStorage.getItem(UTM_STORAGE_KEY);
  if (!raw) return null;
  localStorage.removeItem(UTM_STORAGE_KEY);
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
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