import { AwardId, Ring } from '../../utils/awards';

export type GemStyle = 'kid' | 'pro';

const STYLE_KEY = 'iceiq-gem-style';

export function readGemStyle(): GemStyle {
  try {
    return localStorage.getItem(STYLE_KEY) === 'pro' ? 'pro' : 'kid';
  } catch {
    return 'kid';
  }
}

export function saveGemStyle(style: GemStyle) {
  try {
    localStorage.setItem(STYLE_KEY, style);
  } catch { /* privat läge: valet gäller bara den här sessionen */ }
}

// Ringens färg (ljus, mellan, mörk). Hårdkodade hex med flit: gemen är en
// bild, inte UI — den ska se likadan ut i ljust och mörkt läge.
const RING_COLORS: Record<Ring, [string, string, string]> = {
  fire: ['#F09595', '#E24B4A', '#A32D2D'],
  water: ['#85B7EB', '#378ADD', '#185FA5'],
  earth: ['#FAC775', '#EF9F27', '#854F0B'],
  wind: ['#5DCAA5', '#1D9E75', '#0F6E56'],
  void: ['#FFFFFF', '#D3D1C7', '#888780'],
};

const INK = '#2C2C2A';
const GOLD = '#EF9F27';
const GOLD_LIGHT = '#FAC775';
const GOLD_DARK = '#854F0B';

function Eyes() {
  return (
    <>
      <circle cx="-9" cy="-4" r="2.6" fill={INK} />
      <circle cx="9" cy="-4" r="2.6" fill={INK} />
    </>
  );
}

function Diamond({ x, y }: { x: number; y: number }) {
  return (
    <polygon
      points={`${x - 4},${y} ${x + 4},${y} ${x + 6},${y + 4} ${x},${y + 12} ${x - 6},${y + 4}`}
      fill="#fff"
      stroke="#888780"
      strokeWidth="1"
    />
  );
}

function Puck({ y }: { y: number }) {
  return (
    <>
      <ellipse cx="0" cy={y + 3} rx="15" ry="5" fill={GOLD_DARK} />
      <rect x="-15" y={y - 3} width="30" height="6" fill={GOLD} />
      <ellipse cx="0" cy={y - 3} rx="15" ry="5" fill={GOLD_LIGHT} stroke={GOLD_DARK} strokeWidth="1" />
    </>
  );
}

function Bar({ x, y }: { x: number; y: number }) {
  return (
    <>
      <polygon points={`${x + 3},${y - 8} ${x + 21},${y - 8} ${x + 24},${y} ${x},${y}`} fill={GOLD_LIGHT} stroke={GOLD_DARK} strokeWidth="1" />
      <rect x={x} y={y} width="24" height="8" fill={GOLD} stroke={GOLD_DARK} strokeWidth="1" />
    </>
  );
}

function Crown({ diamonds }: { diamonds: boolean }) {
  const tip = diamonds ? '#fff' : GOLD_LIGHT;
  const tipStroke = diamonds ? '#888780' : GOLD_DARK;
  return (
    <>
      <path
        d="M-15 -28 L-19 -48 L-8 -39 L0 -53 L8 -39 L19 -48 L15 -28 Z"
        fill={GOLD}
        stroke={GOLD_DARK}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="-19" cy="-48" r="3" fill={tip} stroke={tipStroke} />
      <circle cx="0" cy="-53" r="3.4" fill={tip} stroke={tipStroke} />
      <circle cx="19" cy="-48" r="3" fill={tip} stroke={tipStroke} />
    </>
  );
}

// Tillbehören som ritats hittills. Övriga utmärkelser får samma gem utan
// tillbehör — se docs/awards-plan.md för vad som återstår att rita.
function Accessory({ id, style }: { id: AwardId; style: GemStyle }) {
  const kid = style === 'kid';
  switch (id) {
    case 'hattrick':
      return kid ? (
        <>
          <ellipse cx="0" cy="-28" rx="22" ry="4" fill={INK} />
          <rect x="-13" y="-56" width="26" height="28" rx="2" fill={INK} />
          <rect x="-13" y="-38" width="26" height="6" fill="#A32D2D" />
          <Eyes />
          <circle cx="9" cy="-4" r="7.5" fill="none" stroke={GOLD} strokeWidth="2" />
          <path d="M16 0 Q24 10 15 20" fill="none" stroke={GOLD} strokeWidth="1.3" />
        </>
      ) : (
        <>
          <Puck y={-34} />
          <Puck y={-44} />
          <Puck y={-54} />
        </>
      );
    case 'goalKing':
      return (
        <>
          <Crown diamonds={!kid} />
          {kid && <Eyes />}
        </>
      );
    case 'playmaker':
      return kid ? (
        <>
          <ellipse cx="0" cy="-36" rx="5" ry="8" fill={INK} />
          <rect x="-5" y="-31" width="10" height="3" fill="#A32D2D" />
          <Eyes />
        </>
      ) : null;
    case 'wall':
      return kid ? (
        <>
          <g fill="#B4B2A9" stroke="#5F5E5A" strokeWidth="1">
            <rect x="-18" y="-36" width="12" height="8" />
            <rect x="-6" y="-36" width="12" height="8" />
            <rect x="6" y="-36" width="12" height="8" />
            <rect x="-12" y="-44" width="12" height="8" />
            <rect x="0" y="-44" width="12" height="8" />
          </g>
          <Eyes />
        </>
      ) : (
        <>
          <Bar x={-22} y={-30} />
          <Bar x={2} y={-30} />
          <Bar x={-10} y={-46} />
        </>
      );
    case 'hunter':
      return (
        <>
          {kid && <Eyes />}
          <rect x="-25" y="-26" width="50" height="9" fill="#E24B4A" />
          <circle cx="0" cy="-21.5" r="3.2" fill="#fff" />
          <path d="M25 -22 L38 -29 M25 -21 L38 -14" stroke="#E24B4A" strokeWidth="2.6" strokeLinecap="round" />
        </>
      );
    case 'iceman':
      return kid ? (
        <>
          <rect x="-19" y="-10" width="16" height="10" rx="3" fill={INK} />
          <rect x="3" y="-10" width="16" height="10" rx="3" fill={INK} />
          <path d="M-3 -6 L3 -6" stroke={INK} strokeWidth="2" />
        </>
      ) : (
        <>
          <polygon points="-22,-12 -2,-12 -4,-1 -10,2 -19,0" fill="#B5D4F4" stroke="#fff" strokeWidth="1.5" />
          <polygon points="2,-12 22,-12 19,0 10,2 4,-1" fill="#B5D4F4" stroke="#fff" strokeWidth="1.5" />
          <path d="M-2 -10 L2 -10" stroke="#fff" strokeWidth="2" />
          <Diamond x={-12} y={34} />
          <Diamond x={0} y={38} />
          <Diamond x={12} y={34} />
        </>
      );
    case 'shutout':
      return (
        <>
          <circle
            cx="0"
            cy="2"
            r="46"
            fill="none"
            stroke="#5F5E5A"
            strokeWidth="3"
            strokeDasharray="240 49"
            strokeLinecap="round"
            transform="rotate(-60 0 2)"
          />
          {kid && (
            <path d="M-13 -4 q4 4 8 0 M5 -4 q4 4 8 0" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
          )}
        </>
      );
    default:
      return kid ? <Eyes /> : null;
  }
}

interface AwardGemProps {
  id: AwardId;
  ring: Ring;
  style: GemStyle;
  locked?: boolean;
  size?: number;
}

// Gemet är ringens färg; tillbehöret är utmärkelsen. "kid" = färgat gem med
// ögon, "pro" = svart onyx med guld — samma regler, annan grafik.
export default function AwardGem({ id, ring, style, locked = false, size = 72 }: AwardGemProps) {
  const [light, mid, dark] = RING_COLORS[ring];
  const pro = style === 'pro';
  const faces = pro ? ['#5F5E5A', '#2C2C2A', '#171716'] : [light, mid, dark];
  const outline = pro ? mid : ring === 'void' ? '#5F5E5A' : dark;
  const facet = pro ? light : '#fff';

  return (
    <svg
      width={size}
      height={size * 1.2}
      viewBox="-48 -70 96 120"
      aria-hidden="true"
      style={locked ? { filter: 'grayscale(1)', opacity: 0.35 } : undefined}
    >
      <polygon points="-18,-28 18,-28 30,-10 -30,-10" fill={faces[0]} />
      <polygon points="-30,-10 0,-10 0,32" fill={faces[1]} />
      <polygon points="0,-10 30,-10 0,32" fill={faces[2]} />
      <path
        d="M-10 -10 L-18 -28 M10 -10 L18 -28 M0 -10 L0 -28"
        stroke={facet}
        strokeOpacity={pro ? 0.7 : 0.5}
        strokeWidth="1"
        fill="none"
      />
      <polygon
        points="-18,-28 18,-28 30,-10 0,32 -30,-10"
        fill="none"
        stroke={outline}
        strokeWidth={pro ? 2 : 1.5}
        strokeLinejoin="round"
      />
      <Accessory id={id} style={style} />
    </svg>
  );
}
