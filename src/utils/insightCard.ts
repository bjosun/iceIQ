// Ritar en delbar coach-insikt som PNG via Canvas.
//
// Skiljer sig medvetet från matchrapporten: här är texten hjälten, inte
// siffran. Rapporten delas efter en match, insikten delas när coachen sagt
// något som föräldern vill visa upp — två olika tillfällen, två uttryck.
//
// Samma regel som för matchrapporten gäller: aldrig pengasaldo, aldrig
// e-post. Bilden är byggd för att hamna i en laggrupp.

import {
  ReportFormat, sans, fitText, wrapText,
  paintBackdrop, drawWordmark, drawFooter, createCanvas, canvasToBlob,
} from './shareCanvas';

export interface InsightCardData {
  playerName: string;
  /** Coachens en-radare. Kapas om den är längre än vad kortet rymmer. */
  insight: string;
  format?: ReportFormat;
  labels: {
    cardTitle: string; // "Coach-insikt"
    coachName: string; // "Ice IQ Coach"
  };
}

interface Layout {
  W: number;
  H: number;
  pad: number;
  wordmarkY: number;
  wordmarkSize: number;
  /** Ytan som citatblocket centreras inom. */
  textTop: number;
  textBottom: number;
  textSize: number;
  lineHeight: number;
  maxLines: number;
  attributionY: number;
  attributionSize: number;
  footerY: number;
  footerSize: number;
}

const SQUARE: Layout = {
  W: 1080, H: 1080, pad: 72,
  wordmarkY: 72, wordmarkSize: 56,
  textTop: 260, textBottom: 800,
  textSize: 56, lineHeight: 78, maxLines: 5,
  attributionY: 868, attributionSize: 36,
  footerY: 1008, footerSize: 28,
};

const STORY: Layout = {
  W: 1080, H: 1920, pad: 88,
  wordmarkY: 290, wordmarkSize: 60,
  textTop: 520, textBottom: 1360,
  textSize: 68, lineHeight: 96, maxLines: 6,
  attributionY: 1440, attributionSize: 42,
  footerY: 1580, footerSize: 32,
};

export async function renderInsightCard(data: InsightCardData): Promise<Blob> {
  const L = data.format === 'story' ? STORY : SQUARE;
  const { W, H, pad } = L;
  const { canvas, ctx } = createCanvas(W, H);

  paintBackdrop(ctx, W, H, (L.textTop + L.textBottom) / 2);
  drawWordmark(ctx, W, pad, L.wordmarkY, L.wordmarkSize, data.labels.cardTitle);

  // Citatblocket. Texten är vänsterställd med en cyan markör intill — det
  // läser som ett utdrag snarare än som en rubrik, och skiljer kortet från
  // matchrapportens centrerade siffra.
  const barX = pad;
  const textX = pad + 44;
  const textMaxW = W - textX - pad;

  ctx.font = sans('700', L.textSize);
  const lines = wrapText(ctx, data.insight, textMaxW, L.maxLines);

  const blockH = lines.length * L.lineHeight;
  const blockTop = (L.textTop + L.textBottom) / 2 - blockH / 2;

  ctx.save();
  ctx.fillStyle = '#22d3ee';
  ctx.fillRect(barX, blockTop + 8, 8, blockH - 16);
  ctx.restore();

  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = sans('700', L.textSize);
  lines.forEach((line, i) => {
    ctx.fillText(line, textX, blockTop + i * L.lineHeight);
  });

  // Tillskrivning: vem insikten handlar om, och vem som sagt den
  const attribution = `${data.playerName}  •  ${data.labels.coachName}`;
  ctx.fillStyle = '#94a3b8';
  const attributionText = fitText(ctx, attribution, W - pad * 2, L.attributionSize, '600');
  ctx.fillText(attributionText, textX, L.attributionY);

  drawFooter(ctx, W, L.footerY, L.footerSize);
  return canvasToBlob(canvas);
}
