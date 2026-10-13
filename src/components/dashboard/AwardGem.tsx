import { AwardId, Ring } from '../../utils/awards';
import { GEM_VIEWBOX, GemStyle, gemSvgBody } from '../../utils/awardGem';

export type { GemStyle };

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

interface AwardGemProps {
  id: AwardId;
  ring: Ring;
  style: GemStyle;
  locked?: boolean;
  size?: number;
}

// Själva ritningen bor i utils/awardGem.ts så att den delbara matchbilden kan
// återanvända den. Innehållet är statisk SVG vi genererar själva, aldrig
// användardata.
export default function AwardGem({ id, ring, style, locked = false, size = 72 }: AwardGemProps) {
  const { x, y, w, h } = GEM_VIEWBOX;
  return (
    <svg
      width={size}
      height={(size * h) / w}
      viewBox={`${x} ${y} ${w} ${h}`}
      aria-hidden="true"
      style={locked ? { filter: 'grayscale(1)', opacity: 0.35 } : undefined}
      dangerouslySetInnerHTML={{ __html: gemSvgBody(id, ring, style) }}
    />
  );
}
