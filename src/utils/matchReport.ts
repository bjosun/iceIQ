// Ritar en delbar matchrapport som PNG via Canvas.
// Visar medvetet bara poäng, säsongssiffror och aktioner — aldrig
// pengasaldo — eftersom bilden är tänkt att delas i laggrupper.

import {
  ReportFormat, sans, fitText, roundedRect,
  paintBackdrop, drawWordmark, drawFooter, createCanvas, canvasToBlob,
} from './shareCanvas';

export type { ReportFormat };

export interface MatchReportStats {
  games: number;
  avgPoints: number;
  bestGame: number;
}

export interface MatchReportData {
  playerName: string;
  team: string;
  date: string;
  points: number;
  actions: { label: string; count: number }[];
  /** Färdigöversatt en-radare, t.ex. "Säsongsbästa". Utelämnas om ingen är sann. */
  highlight?: string;
  /** Säsongen till och med den här matchen. Utelämnas för spelarens första match. */
  stats?: MatchReportStats;
  format?: ReportFormat;
  labels: {
    reportTitle: string; // "Matchrapport"
    pointsLabel: string; // "Poäng"
    gamesLabel: string;  // "Matcher"
    avgLabel: string;    // "Snitt"
    bestLabel: string;   // "Bästa"
  };
}

// Storlekar och mellanrum per format. Y-koordinaterna räknas ut i flödet
// nedan i stället för att skrivas in för hand: höjdpunktsbandet och
// statistikraden är valfria, och fyra handhållna koordinatuppsättningar
// var precis så en aktionsrad hamnade ovanpå sidfoten tidigare.
interface Metrics {
  W: number;
  H: number;
  pad: number;
  wordmarkY: number;
  wordmarkSize: number;
  nameGap: number;
  nameSize: number;
  metaGap: number;
  metaSize: number;
  bandH: number;
  bandTextSize: number;
  gap: number;
  pointsSize: number;
  pointsLabelSize: number;
  statsValueSize: number;
  statsLabelSize: number;
  statsH: number;
  actionSize: number;
  rowH: number;
  maxActions: number;
  footerY: number;
  footerSize: number;
  /** Minsta luft mellan aktionsraderna och sidfoten. */
  footerGap: number;
}

const SQUARE: Metrics = {
  W: 1080, H: 1080, pad: 72,
  wordmarkY: 72, wordmarkSize: 56,
  nameGap: 62, nameSize: 68,
  metaGap: 22, metaSize: 34,
  bandH: 82, bandTextSize: 32,
  gap: 26,
  pointsSize: 150, pointsLabelSize: 30,
  statsValueSize: 44, statsLabelSize: 22, statsH: 88,
  actionSize: 32, rowH: 56, maxActions: 3,
  footerY: 1012, footerSize: 26, footerGap: 34,
};

// Instagram Stories: 1080x1920 med ~250 px i topp och botten täckta av
// appens eget gränssnitt. Allt innehåll håller sig innanför det.
const STORY: Metrics = {
  W: 1080, H: 1920, pad: 88,
  wordmarkY: 290, wordmarkSize: 60,
  nameGap: 74, nameSize: 82,
  metaGap: 26, metaSize: 40,
  bandH: 108, bandTextSize: 38,
  gap: 36,
  pointsSize: 230, pointsLabelSize: 36,
  statsValueSize: 58, statsLabelSize: 26, statsH: 112,
  actionSize: 38, rowH: 70, maxActions: 4,
  footerY: 1586, footerSize: 30, footerGap: 44,
};

export async function renderMatchReport(data: MatchReportData): Promise<Blob> {
  const M = data.format === 'story' ? STORY : SQUARE;
  const { W, H, pad } = M;
  const { canvas, ctx } = createCanvas(W, H);

  // --- Layout ---
  // Namn och lag hänger under wordmarken i toppen, aktionsraderna sitter
  // fast ovanför sidfoten, och det som ligger emellan (band, poäng,
  // statistik) centreras i luften som blir över. Då blir kompositionen
  // balanserad oavsett vilka valfria delar som är med, och en rad kan
  // aldrig hamna ovanpå sidfoten.
  const nameY = M.wordmarkY + M.wordmarkSize + M.nameGap;
  const metaY = nameY + M.nameSize + M.metaGap;
  const topEnd = metaY + M.metaSize;

  const middleParts: number[] = [];
  if (data.highlight) middleParts.push(M.bandH);
  middleParts.push(M.pointsSize);
  middleParts.push(M.pointsLabelSize);
  if (data.stats) middleParts.push(M.statsH);
  const middleH = middleParts.reduce((a, b) => a + b, 0) + (middleParts.length - 1) * M.gap;

  // Aktionsraderna ger vika för mittblocket, inte tvärtom: poäng,
  // höjdpunkt och säsongssiffror är det bilden handlar om, och en rad till
  // är inte värd att klämma ihop dem. Marginalen på varje sida av
  // mittblocket räknas bort innan raderna får plats, så de aldrig kan
  // hamna tätt inpå statistiken (eller sidfoten).
  const actionsBottom = M.footerY - M.footerGap;
  const roomForActions = Math.floor((actionsBottom - topEnd - middleH - M.gap * 2) / M.rowH);
  const actionCount = Math.max(0, Math.min(M.maxActions, data.actions.length, roomForActions));
  const actionsY = actionsBottom - actionCount * M.rowH;

  const middleTop = topEnd + (actionsY - topEnd - middleH) / 2;

  // --- Ritning ---
  paintBackdrop(ctx, W, H, middleTop + middleH / 2);
  drawWordmark(ctx, W, pad, M.wordmarkY, M.wordmarkSize, data.labels.reportTitle);

  // Spelare + lag/datum
  ctx.fillStyle = '#ffffff';
  ctx.fillText(fitText(ctx, data.playerName, W - pad * 2, M.nameSize, '800'), pad, nameY);

  ctx.font = sans('500', M.metaSize);
  ctx.fillStyle = '#9ca3af';
  ctx.fillText(data.team ? `${data.team}  •  ${data.date}` : data.date, pad, metaY);

  let y = middleTop;

  // Höjdpunkt — matchens enda påstående, och anledningen att bilden delas
  if (data.highlight) {
    const bandW = W - pad * 2;
    ctx.save();
    ctx.fillStyle = 'rgba(34, 211, 238, 0.12)';
    roundedRect(ctx, pad, y, bandW, M.bandH, M.bandH / 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    const text = fitText(ctx, data.highlight, bandW - 96, M.bandTextSize, '700');
    ctx.fillStyle = '#67e8f9';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, W / 2, y + M.bandH / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    y += M.bandH + M.gap;
  }

  // Stor poängsiffra
  ctx.textAlign = 'center';
  ctx.font = sans('900', M.pointsSize);
  const grad = ctx.createLinearGradient(0, y, 0, y + M.pointsSize);
  grad.addColorStop(0, '#22d3ee');
  grad.addColorStop(1, '#6366f1');
  ctx.fillStyle = grad;
  ctx.fillText(`${data.points > 0 ? '+' : ''}${data.points}`, W / 2, y);
  y += M.pointsSize + M.gap;

  ctx.font = sans('700', M.pointsLabelSize);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(data.labels.pointsLabel.toUpperCase(), W / 2, y);
  y += M.pointsLabelSize + M.gap;
  ctx.textAlign = 'left';

  // Säsongen till och med den här matchen — det som gör bilden till
  // statistik och inte bara en siffra.
  if (data.stats) {
    const cells: { value: string; label: string }[] = [
      { value: String(data.stats.games), label: data.labels.gamesLabel },
      { value: data.stats.avgPoints.toFixed(1), label: data.labels.avgLabel },
      { value: String(data.stats.bestGame), label: data.labels.bestLabel },
    ];
    const innerW = W - pad * 2;
    const cellW = innerW / cells.length;

    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(W - pad, y);
    ctx.moveTo(pad, y + M.statsH);
    ctx.lineTo(W - pad, y + M.statsH);
    ctx.stroke();
    ctx.restore();

    ctx.textAlign = 'center';
    cells.forEach((cell, i) => {
      const cx = pad + cellW * i + cellW / 2;
      ctx.font = sans('800', M.statsValueSize);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(cell.value, cx, y + M.statsH * 0.16);
      ctx.font = sans('600', M.statsLabelSize);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(cell.label.toUpperCase(), cx, y + M.statsH * 0.66);
    });
    ctx.textAlign = 'left';
    y += M.statsH + M.gap;
  }

  // Toppaktioner
  ctx.font = sans('600', M.actionSize);
  data.actions.slice(0, actionCount).forEach((a, i) => {
    const rowY = actionsY + i * M.rowH;
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.arc(pad + 18, rowY + M.actionSize * 0.55, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    const countText = `× ${a.count}`;
    ctx.fillText(countText, W - pad - 18, rowY);
    const countWidth = ctx.measureText(countText).width;
    ctx.textAlign = 'left';

    // Etiketten kapas mot räknaren så långa aktionsnamn aldrig skriver
    // över den (t.ex. "Kontrollerad defensiv rensning").
    ctx.fillStyle = '#e5e7eb';
    const labelMax = W - pad * 2 - 52 - countWidth - 32;
    ctx.fillText(fitText(ctx, a.label, labelMax, M.actionSize, '600'), pad + 52, rowY);
    ctx.font = sans('600', M.actionSize);
  });

  drawFooter(ctx, W, M.footerY, M.footerSize);
  return canvasToBlob(canvas);
}
