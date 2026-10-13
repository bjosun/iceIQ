// Gem-grafiken som ren SVG-text. Samma ritning används på två ställen:
// React-komponenten (AwardGem.tsx) och den delbara matchbilden, som ritas på
// en canvas och därför behöver en bild, inte en komponent.
//
// Gemet är ringens färg och tillbehöret är utmärkelsen. "kid" = färgat gem med
// ögon, "pro" = svart onyx med guld — samma regler, annan grafik.
//
// Allt är hårdkodade hex med flit: gemen är en bild, inte UI, och ska se
// likadan ut i ljust och mörkt läge.

import type { AwardId, Ring } from './awards';

export type GemStyle = 'kid' | 'pro';

const RING_COLORS: Record<Ring, [string, string, string]> = {
  fire: ['#F09595', '#E24B4A', '#A32D2D'],
  water: ['#85B7EB', '#378ADD', '#185FA5'],
  earth: ['#FAC775', '#EF9F27', '#854F0B'],
  wind: ['#5DCAA5', '#1D9E75', '#0F6E56'],
  void: ['#FFFFFF', '#D3D1C7', '#888780'],
};

const INK = '#2C2C2A';
const GOLD = '#EF9F27';
const GOLD_L = '#FAC775';
const GOLD_D = '#854F0B';
const GREY = '#888780';

export const GEM_VIEWBOX = { x: -48, y: -70, w: 96, h: 120 };

const eyes = `<circle cx="-9" cy="-4" r="2.6" fill="${INK}"/><circle cx="9" cy="-4" r="2.6" fill="${INK}"/>`;
const closedEyes = `<path d="M-13 -4 q4 4 8 0 M5 -4 q4 4 8 0" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`;

// Utmärkelser vars tillbehör själva ritar ögonen (eller täcker dem).
const OWN_EYES = new Set<AwardId>(['shutout', 'calm']);

function star(cx: number, cy: number, R: number, r: number, n: number): string {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (Math.PI / n) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? R : r;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

const diamond = (x: number, y: number) =>
  `<polygon points="${x - 4},${y} ${x + 4},${y} ${x + 6},${y + 4} ${x},${y + 12} ${x - 6},${y + 4}" fill="#fff" stroke="${GREY}" stroke-width="1"/>`;

const puck = (y: number) =>
  `<ellipse cx="0" cy="${y + 3}" rx="15" ry="5" fill="${GOLD_D}"/><rect x="-15" y="${y - 3}" width="30" height="6" fill="${GOLD}"/><ellipse cx="0" cy="${y - 3}" rx="15" ry="5" fill="${GOLD_L}" stroke="${GOLD_D}" stroke-width="1"/>`;

const bar = (x: number, y: number) =>
  `<polygon points="${x + 3},${y - 8} ${x + 21},${y - 8} ${x + 24},${y} ${x},${y}" fill="${GOLD_L}" stroke="${GOLD_D}" stroke-width="1"/><rect x="${x}" y="${y}" width="24" height="8" fill="${GOLD}" stroke="${GOLD_D}" stroke-width="1"/>`;

function crown(pro: boolean): string {
  const tip = pro ? '#fff' : GOLD_L;
  const tipStroke = pro ? GREY : GOLD_D;
  return (
    `<path d="M-15 -28 L-19 -48 L-8 -39 L0 -53 L8 -39 L19 -48 L15 -28 Z" fill="${GOLD}" stroke="${GOLD_D}" stroke-width="1.5" stroke-linejoin="round"/>` +
    `<circle cx="-19" cy="-48" r="3" fill="${tip}" stroke="${tipStroke}"/><circle cx="0" cy="-53" r="3.4" fill="${tip}" stroke="${tipStroke}"/><circle cx="19" cy="-48" r="3" fill="${tip}" stroke="${tipStroke}"/>`
  );
}

// Tillbehör per utmärkelse. `pro` byter färgskala till guld/onyx; formerna är
// desamma, så att samma utmärkelse känns igen i båda stilarna.
function accessory(id: AwardId, pro: boolean): string {
  const main = (kid: string) => (pro ? GOLD : kid);
  const dark = (kid: string) => (pro ? GOLD_D : kid);
  switch (id) {
    case 'hattrick':
      return pro
        ? puck(-34) + puck(-44) + puck(-54)
        : `<ellipse cx="0" cy="-28" rx="22" ry="4" fill="${INK}"/><rect x="-13" y="-56" width="26" height="28" rx="2" fill="${INK}"/><rect x="-13" y="-38" width="26" height="6" fill="#A32D2D"/>` +
          `<circle cx="9" cy="-4" r="7.5" fill="none" stroke="${GOLD}" stroke-width="2"/><path d="M16 0 Q24 10 15 20" fill="none" stroke="${GOLD}" stroke-width="1.3"/>`;
    case 'goalKing':
      return crown(pro);
    case 'pointKing':
      return `<polygon points="${star(0, -42, 14, 6, 5)}" fill="${GOLD}" stroke="${GOLD_D}" stroke-width="1.5" stroke-linejoin="round"/>` +
        (pro ? '<circle cx="0" cy="-42" r="3" fill="#fff" stroke="#888780"/>' : '');
    case 'twoWay': {
      const c = main('#1D9E75');
      return `<path d="M-14 -40 L14 -40" stroke="${c}" stroke-width="4" stroke-linecap="round"/>` +
        `<polygon points="-18,-40 -9,-46 -9,-34" fill="${c}"/><polygon points="18,-40 9,-46 9,-34" fill="${c}"/>`;
    }
    case 'plusGame': {
      const c = main('#1D9E75');
      return `<rect x="-3.5" y="-54" width="7" height="26" rx="2" fill="${c}" stroke="${dark('#0F6E56')}" stroke-width="1"/>` +
        `<rect x="-13" y="-44.5" width="26" height="7" rx="2" fill="${c}" stroke="${dark('#0F6E56')}" stroke-width="1"/>`;
    }
    case 'cleanSheet':
      return `<path d="M0 -58 L4.5 -47 L15 -43 L4.5 -39 L0 -28 L-4.5 -39 L-15 -43 L-4.5 -47 Z" fill="${pro ? GOLD_L : '#fff'}" stroke="${pro ? GOLD_D : GREY}" stroke-width="1.2" stroke-linejoin="round"/>` +
        `<path d="M19 -56 L20.5 -52 L24.5 -50.5 L20.5 -49 L19 -45 L17.5 -49 L13.5 -50.5 L17.5 -52 Z" fill="${pro ? GOLD_L : '#fff'}" stroke="${pro ? GOLD_D : GREY}" stroke-width="1"/>`;
    case 'playmaker':
      return `<ellipse cx="0" cy="-36" rx="5" ry="8" fill="${pro ? GOLD : INK}"/><rect x="-5" y="-31" width="10" height="3" fill="#A32D2D"/>`;
    case 'sniper':
      return `<path d="M-30 -56 L8 -22" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>` +
        `<path d="M-30 -56 L8 -22" stroke="#D3D1C7" stroke-width="3.2" stroke-linecap="round"/>` +
        `<path d="M3 -30 L12 -18" stroke="${pro ? GOLD : '#444441'}" stroke-width="5" stroke-linecap="round"/>` +
        `<path d="M8 -22 L19 -9" stroke="${pro ? GOLD_D : INK}" stroke-width="5" stroke-linecap="round"/>`;
    case 'faceoffKing': {
      const c = main('#854F0B');
      return `<path d="M-17 -58 L17 -30 M17 -58 L-17 -30" stroke="${c}" stroke-width="3.6" stroke-linecap="round"/><ellipse cx="0" cy="-31" rx="9" ry="3.4" fill="${INK}"/>`;
    }
    case 'deker':
      return `<polygon points="-25,-28 0,-54 25,-28" fill="${main('#D9B77A')}" stroke="${dark('#8A6A33')}" stroke-width="1.5" stroke-linejoin="round"/>` +
        `<path d="M-14 -40 L14 -40" stroke="${dark('#8A6A33')}" stroke-width="1.2"/>`;
    case 'hunter':
      return `<rect x="-25" y="-26" width="50" height="9" fill="${pro ? GOLD : '#E24B4A'}"/><circle cx="0" cy="-21.5" r="3.2" fill="#fff"/>` +
        `<path d="M25 -22 L38 -29 M25 -21 L38 -14" stroke="${pro ? GOLD : '#E24B4A'}" stroke-width="2.6" stroke-linecap="round"/>`;
    case 'homework': {
      const c = main('#1D9E75');
      return `<path d="M13 -30 Q13 -53 -3 -53 Q-14 -53 -14 -44" fill="none" stroke="${c}" stroke-width="4.5" stroke-linecap="round"/>` +
        `<polygon points="-21,-45 -7,-45 -14,-33" fill="${c}"/>`;
    }
    case 'tackler':
      return `<polygon points="${star(0, -42, 15, 7, 8)}" fill="${pro ? GOLD_L : GOLD}" stroke="${GOLD_D}" stroke-width="1.5" stroke-linejoin="round"/>`;
    case 'boardWorker':
      return `<rect x="-26" y="-42" width="52" height="13" rx="2" fill="${pro ? GOLD : '#B07A3F'}" stroke="${pro ? GOLD_D : '#5C3A12'}" stroke-width="1.5"/>` +
        `<circle cx="-19" cy="-35.5" r="2" fill="${pro ? '#fff' : '#444441'}"/><circle cx="19" cy="-35.5" r="2" fill="${pro ? '#fff' : '#444441'}"/>`;
    case 'tightBack': {
      const c = main(GREY);
      return `<path d="M-6.5 -45 V-50 a6.5 6.5 0 0 1 13 0 V-45" fill="none" stroke="${c}" stroke-width="3.2"/>` +
        `<rect x="-11" y="-45" width="22" height="17" rx="3.5" fill="${c}" stroke="${dark('#5F5E5A')}" stroke-width="1.2"/><circle cx="0" cy="-37.5" r="2.2" fill="${INK}"/>`;
    }
    case 'wall':
      return pro
        ? bar(-22, -30) + bar(2, -30) + bar(-10, -46)
        : `<g fill="#B4B2A9" stroke="#5F5E5A" stroke-width="1"><rect x="-18" y="-36" width="12" height="8"/><rect x="-6" y="-36" width="12" height="8"/><rect x="6" y="-36" width="12" height="8"/><rect x="-12" y="-44" width="12" height="8"/><rect x="0" y="-44" width="12" height="8"/></g>`;
    case 'boardKing':
      return `<rect x="-26" y="-40" width="52" height="12" rx="1.5" fill="${pro ? GOLD_L : '#fff'}" stroke="${pro ? GOLD_D : GREY}" stroke-width="1.2"/>` +
        `<rect x="-26" y="-32" width="52" height="4" fill="${pro ? GOLD_D : '#FAC775'}"/>` +
        `<g transform="translate(0,-36) scale(.55)">${crown(pro)}</g>`;
    case 'doorman':
      return `<path d="M-20 -28 Q-20 -52 0 -52 Q20 -52 20 -28 Z" fill="${pro ? INK : '#185FA5'}" stroke="${pro ? GOLD : '#0C447C'}" stroke-width="1.5"/>` +
        `<rect x="-24" y="-31" width="48" height="5" rx="2" fill="${pro ? '#171716' : '#0C447C'}"/><circle cx="0" cy="-41" r="4.2" fill="${GOLD}" stroke="${GOLD_D}"/>`;
    case 'iceman':
      return pro
        ? `<polygon points="-22,-12 -2,-12 -4,-1 -10,2 -19,0" fill="#B5D4F4" stroke="#fff" stroke-width="1.5"/><polygon points="2,-12 22,-12 19,0 10,2 4,-1" fill="#B5D4F4" stroke="#fff" stroke-width="1.5"/><path d="M-2 -10 L2 -10" stroke="#fff" stroke-width="2"/>` +
          diamond(-12, 34) + diamond(0, 38) + diamond(12, 34)
        : `<rect x="-19" y="-10" width="16" height="10" rx="3" fill="${INK}"/><rect x="3" y="-10" width="16" height="10" rx="3" fill="${INK}"/><path d="M-3 -6 L3 -6" stroke="${INK}" stroke-width="2"/>`;
    case 'builder':
      return `<path d="M-20 -28 Q-20 -52 0 -52 Q20 -52 20 -28 Z" fill="${pro ? GOLD : '#FAC775'}" stroke="${GOLD_D}" stroke-width="1.5"/>` +
        `<rect x="-24" y="-31" width="48" height="5" rx="2" fill="${pro ? GOLD_D : '#EF9F27'}"/><rect x="-3" y="-52" width="6" height="22" fill="${pro ? GOLD_L : '#EF9F27'}" stroke="${GOLD_D}" stroke-width="1"/>`;
    case 'pointBack':
      return `<path d="M-9 -58 L0 -40 M9 -58 L0 -40" stroke="${pro ? '#171716' : '#E24B4A'}" stroke-width="5.5" stroke-linecap="round"/>` +
        `<circle cx="0" cy="-36" r="9" fill="${GOLD}" stroke="${GOLD_D}" stroke-width="1.5"/><polygon points="${star(0, -36, 5, 2.2, 5)}" fill="${GOLD_L}" stroke="${GOLD_D}" stroke-width=".8"/>`;
    case 'goalBack': {
      const post = main('#E24B4A');
      let mesh = '';
      for (let x = -12; x <= 12; x += 6) mesh += `<path d="M${x} -52 V-28" stroke="#D3D1C7" stroke-width=".9"/>`;
      for (let y = -46; y <= -34; y += 6) mesh += `<path d="M-18 ${y} H18" stroke="#D3D1C7" stroke-width=".9"/>`;
      return `<rect x="-18" y="-52" width="36" height="24" fill="rgba(255,255,255,.25)"/>${mesh}` +
        `<path d="M-18 -28 V-52 H18 V-28" fill="none" stroke="${post}" stroke-width="3.4" stroke-linejoin="round"/>`;
    }
    case 'engine': {
      const c = main(GREY);
      let teeth = '';
      for (let a = 0; a < 360; a += 45) teeth += `<rect x="-2.8" y="-55" width="5.6" height="6.5" fill="${c}" transform="rotate(${a} 0 -42)"/>`;
      return `${teeth}<circle cx="0" cy="-42" r="9.5" fill="${c}" stroke="${dark('#5F5E5A')}" stroke-width="1.2"/><circle cx="0" cy="-42" r="3.6" fill="#171716"/>`;
    }
    case 'blueliner':
      return `<polygon points="5,-60 -11,-40 -1,-40 -7,-26 13,-47 3,-47" fill="${pro ? GOLD : GOLD_L}" stroke="${GOLD_D}" stroke-width="1.4" stroke-linejoin="round"/>`;
    case 'forwardBack': {
      const c = main('#1D9E75');
      return `<path d="M-12 -33 L0 -45 L12 -33" fill="none" stroke="${c}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<path d="M-12 -44 L0 -56 L12 -44" fill="none" stroke="${c}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    case 'saveMachine': {
      const bar = pro ? GOLD : '#5F5E5A';
      return `<rect x="-17" y="-14" width="34" height="23" rx="7" fill="rgba(255,255,255,${pro ? 0.1 : 0.35})" stroke="${pro ? GOLD : '#F1EFE8'}" stroke-width="2.4"/>` +
        `<path d="M-8 -13 V8 M0 -13 V8 M8 -13 V8 M-16 -2 H16" stroke="${bar}" stroke-width="1.6"/>`;
    }
    case 'miracle': {
      const f = main('#F1EFE8');
      const s = dark('#5F5E5A');
      return `<rect x="-10" y="-42" width="20" height="16" rx="4" fill="${f}" stroke="${s}" stroke-width="1.2"/>` +
        `<rect x="-10" y="-53" width="5.2" height="14" rx="2.6" fill="${f}" stroke="${s}" stroke-width="1.2"/>` +
        `<rect x="-2.6" y="-56" width="5.2" height="17" rx="2.6" fill="${f}" stroke="${s}" stroke-width="1.2"/>` +
        `<rect x="4.8" y="-53" width="5.2" height="14" rx="2.6" fill="${f}" stroke="${s}" stroke-width="1.2"/>` +
        `<ellipse cx="-13" cy="-34" rx="3.6" ry="6.5" transform="rotate(-20 -13 -34)" fill="${f}" stroke="${s}" stroke-width="1.2"/>`;
    }
    case 'calm': {
      const c = pro ? GOLD : '#378ADD';
      return `<path d="M-19 -42 q6.3 -9 12.7 0 t12.7 0 t12.7 0" fill="none" stroke="${c}" stroke-width="3.4" stroke-linecap="round"/>` +
        `<path d="M-19 -51 q6.3 -9 12.7 0 t12.7 0 t12.7 0" fill="none" stroke="${pro ? GOLD_L : '#85B7EB'}" stroke-width="2.6" stroke-linecap="round"/>`;
    }
    case 'thirdD': {
      const c = main('#854F0B');
      return `<path d="M-20 -58 L-7 -34 L9 -30" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<ellipse cx="17" cy="-30" rx="8" ry="3.2" fill="${INK}"/>`;
    }
    case 'goalieAssist': {
      const c = pro ? GOLD : '#B4B2A9';
      return `<path d="M-22 -46 H-6 M-26 -39 H-9 M-20 -32 H-5" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/>` +
        `<ellipse cx="12" cy="-40" rx="10" ry="4" fill="${INK}"/><ellipse cx="12" cy="-42" rx="10" ry="4" fill="#444441" stroke="${INK}"/>`;
    }
    case 'shutout':
      return `<circle cx="0" cy="2" r="46" fill="none" stroke="#5F5E5A" stroke-width="3" stroke-dasharray="240 49" stroke-linecap="round" transform="rotate(-60 0 2)"/>`;
  }
}

/** Innehållet i gemets <svg>, i viewBox-koordinater (se GEM_VIEWBOX). */
export function gemSvgBody(id: AwardId, ring: Ring, style: GemStyle): string {
  const pro = style === 'pro';
  const [light, mid, dark] = RING_COLORS[ring];
  const faces = pro ? ['#5F5E5A', '#2C2C2A', '#171716'] : [light, mid, dark];
  const outline = pro ? mid : ring === 'void' ? '#5F5E5A' : dark;
  const facet = pro ? light : '#fff';

  let face = '';
  if (!pro) face = OWN_EYES.has(id) ? closedEyes : eyes;

  return (
    `<polygon points="-18,-28 18,-28 30,-10 -30,-10" fill="${faces[0]}"/>` +
    `<polygon points="-30,-10 0,-10 0,32" fill="${faces[1]}"/>` +
    `<polygon points="0,-10 30,-10 0,32" fill="${faces[2]}"/>` +
    `<path d="M-10 -10 L-18 -28 M10 -10 L18 -28 M0 -10 L0 -28" stroke="${facet}" stroke-opacity="${pro ? 0.7 : 0.5}" stroke-width="1" fill="none"/>` +
    `<polygon points="-18,-28 18,-28 30,-10 0,32 -30,-10" fill="none" stroke="${outline}" stroke-width="${pro ? 2 : 1.5}" stroke-linejoin="round"/>` +
    face +
    accessory(id, pro)
  );
}

/** Ett fristående SVG-dokument, t.ex. för att rita in gemet på en canvas. */
export function gemSvgDocument(id: AwardId, ring: Ring, style: GemStyle, size = 240): string {
  const { x, y, w, h } = GEM_VIEWBOX;
  const width = size;
  const height = Math.round((size * h) / w);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${x} ${y} ${w} ${h}">` +
    gemSvgBody(id, ring, style) +
    `</svg>`
  );
}
