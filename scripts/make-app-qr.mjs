// Skapar public/app-qr.svg: QR-koden på startsidan som leder datoranvändare till
// appen på telefonen. Körs om efter att VITE_APP_STORE_PT satts (kampanjspårning):
//   node scripts/make-app-qr.mjs
import QRCode from 'qrcode';
import { readFileSync, writeFileSync } from 'node:fs';

function env(name) {
  try {
    const line = readFileSync(new URL('../.env', import.meta.url), 'utf8')
      .split('\n').find((l) => l.startsWith(name + '='));
    return line ? line.slice(name.length + 1).trim() : '';
  } catch { return ''; }
}

const base = env('VITE_APP_STORE_URL') || 'https://apps.apple.com/app/id6821041037';
const pt = env('VITE_APP_STORE_PT');
const url = `${base}?${pt ? `pt=${pt}&` : ''}ct=home_qr&mt=8`;
const svg = await QRCode.toString(url, { type: 'svg', margin: 1, color: { dark: '#0b1220', light: '#ffffff' } });
writeFileSync(new URL('../public/app-qr.svg', import.meta.url), svg);
console.log('QR skapad för', url);
