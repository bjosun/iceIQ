// Ritar en delbar matchrapport som PNG via Canvas.
// Visar medvetet bara poäng och aktioner — aldrig pengasaldo — eftersom
// bilden är tänkt att delas i laggrupper.

export interface MatchReportData {
  playerName: string;
  team: string;
  date: string;
  points: number;
  actions: { label: string; count: number }[];
  labels: {
    reportTitle: string; // "Matchrapport"
    pointsLabel: string; // "Poäng"
  };
}

const W = 1080;
const H = 1080;

export async function renderMatchReport(data: MatchReportData): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  // Bakgrund
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0b1220');
  bg.addColorStop(1, '#111827');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Stiliserade rink-linjer (samma motiv som på sajten)
  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 260, 0, Math.PI * 2); // mittcirkel
  ctx.stroke();
  ctx.strokeStyle = '#f87171';
  ctx.beginPath();
  ctx.moveTo(0, H / 2);
  ctx.lineTo(W, H / 2); // mittlinje
  ctx.stroke();
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 12;
  for (const y of [H * 0.18, H * 0.82]) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y); // blålinjer
    ctx.stroke();
  }
  ctx.restore();

  const sans = (weight: string, size: number) =>
    `${weight} ${size}px -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;

  // Wordmark + rapportetikett
  ctx.textBaseline = 'top';
  ctx.font = sans('900 italic', 56);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('ICE ', 72, 72);
  const iceWidth = ctx.measureText('ICE ').width;
  ctx.fillStyle = '#22d3ee';
  ctx.fillText('IQ', 72 + iceWidth, 72);

  ctx.font = sans('700', 30);
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'right';
  ctx.fillText(data.labels.reportTitle.toUpperCase(), W - 72, 88);
  ctx.textAlign = 'left';

  // Spelare + lag/datum
  ctx.font = sans('800', 72);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(data.playerName, 72, 200);

  ctx.font = sans('500', 36);
  ctx.fillStyle = '#9ca3af';
  const meta = data.team ? `${data.team}  •  ${data.date}` : data.date;
  ctx.fillText(meta, 72, 296);

  // Stor poängsiffra i mitten
  ctx.textAlign = 'center';
  ctx.font = sans('900', 240);
  const pointsText = `${data.points > 0 ? '+' : ''}${data.points}`;
  const grad = ctx.createLinearGradient(0, 420, 0, 660);
  grad.addColorStop(0, '#22d3ee');
  grad.addColorStop(1, '#6366f1');
  ctx.fillStyle = grad;
  ctx.fillText(pointsText, W / 2, 420);

  ctx.font = sans('700', 34);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(data.labels.pointsLabel.toUpperCase(), W / 2, 680);
  ctx.textAlign = 'left';

  // Toppaktioner
  const actions = data.actions.slice(0, 4);
  const rowH = 64;
  const startY = 780;
  ctx.font = sans('600', 36);
  actions.forEach((a, i) => {
    const y = startY + i * rowH;
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.arc(92, y + 20, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e5e7eb';
    ctx.fillText(a.label, 128, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`× ${a.count}`, W - 92, y);
    ctx.textAlign = 'left';
  });

  // Sidfot
  ctx.font = sans('600', 28);
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'center';
  ctx.fillText('iceiq-v2.web.app', W / 2, H - 72);
  ctx.textAlign = 'left';

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Could not render report image'));
    }, 'image/png');
  });
}
