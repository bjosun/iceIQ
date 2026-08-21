// Gemensamma byggstenar för de delbara bilderna (matchrapport och
// coach-insikt). Ligger separat så de två renderarna delar utseende —
// wordmark, rink-motiv och sidfot ska se likadana ut oavsett vilken bild
// som hamnar i laggruppen.

export type ReportFormat = 'square' | 'story';

// Produktionsdomänen. Bilderna är i praktiken appens enda annonsyta, så de
// måste peka på iceiq.app — inte på hostingmålet iceiq-v2.web.app, som är
// ett sällan deployat testmål (se APP_URL i functions/index.js).
export const APP_DOMAIN = 'iceiq.app';

export const sans = (weight: string, size: number) =>
  `${weight} ${size}px -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;

// Krymper texten tills den ryms, och kapar först när den inte kan krympa
// mer. Texterna kommer från översättningar med inflätade namn och kan bli
// oväntat långa på vilket språk som helst.
// Lämnar ctx.font satt till den storlek som valdes — anroparen ritar direkt.
export function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  weight: string
): string {
  let size = startSize;
  ctx.font = sans(weight, size);
  while (ctx.measureText(text).width > maxWidth && size > startSize * 0.7) {
    size -= 2;
    ctx.font = sans(weight, size);
  }
  if (ctx.measureText(text).width <= maxWidth) return text;

  let clipped = text;
  while (clipped.length > 1 && ctx.measureText(clipped + '…').width > maxWidth) {
    clipped = clipped.slice(0, -1);
  }
  return clipped + '…';
}

// Bryter text på ordgränser till maxLines rader. Sista raden kapas med
// ellips om texten inte får plats — insikten kommer från en språkmodell och
// kan bli längre än instruktionen bad om.
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length === maxLines) break;
  }
  if (current && lines.length < maxLines) lines.push(current);

  // Fick allt inte plats: kapa sista raden så det syns att texten fortsätter
  const consumed = lines.join(' ');
  if (consumed.replace(/\s+/g, '') !== text.replace(/\s+/g, '') && lines.length > 0) {
    let last = lines[lines.length - 1];
    while (last.length > 1 && ctx.measureText(last + '…').width > maxWidth) {
      last = last.slice(0, -1);
    }
    lines[lines.length - 1] = last + '…';
  }
  return lines;
}

export function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Bakgrund + stiliserade rink-linjer (samma motiv som på sajten).
// centerY styr var motivet hamnar, så det följer bildens tyngdpunkt i
// stället för dukens mitt — i det höga formatet vore mitten annars tom.
export function paintBackdrop(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  centerY: number
) {
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0b1220');
  bg.addColorStop(1, '#111827');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(W / 2, centerY, 260, 0, Math.PI * 2); // mittcirkel
  ctx.stroke();
  ctx.strokeStyle = '#f87171';
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(W, centerY); // mittlinje
  ctx.stroke();
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 12;
  for (const y of [centerY - 340, centerY + 340]) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y); // blålinjer
    ctx.stroke();
  }
  ctx.restore();
}

// ICE IQ uppe till vänster, etiketten (t.ex. "MATCHRAPPORT") till höger.
export function drawWordmark(
  ctx: CanvasRenderingContext2D,
  W: number,
  pad: number,
  y: number,
  size: number,
  label: string
) {
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.font = sans('900 italic', size);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('ICE ', pad, y);
  const iceWidth = ctx.measureText('ICE ').width;
  ctx.fillStyle = '#22d3ee';
  ctx.fillText('IQ', pad + iceWidth, y);

  ctx.font = sans('700', size * 0.54);
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'right';
  ctx.fillText(label.toUpperCase(), W - pad, y + size * 0.29);
  ctx.textAlign = 'left';
}

export function drawFooter(
  ctx: CanvasRenderingContext2D,
  W: number,
  y: number,
  size: number
) {
  ctx.font = sans('600', size);
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'center';
  ctx.fillText(APP_DOMAIN, W / 2, y);
  ctx.textAlign = 'left';
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Could not render image'));
    }, 'image/png');
  });
}

export function createCanvas(W: number, H: number) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  return { canvas, ctx };
}
