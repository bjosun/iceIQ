import { useEffect, useState } from 'react';
import ShareImageModal from './ShareImageModal';
import MatchSummaryReveal from './MatchSummaryReveal';
import { useLanguage } from '../../contexts/LanguageContext';
import { renderMatchReport, MatchReportData } from '../../utils/matchReport';
import { MatchHighlight } from '../../utils/matchHighlight';
import { ReportFormat } from '../../utils/shareCanvas';
import { BadgeId } from '../../utils/badges';
import { maybeAskForReview } from '../../utils/reviewPrompt';

interface ShareReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: (Omit<MatchReportData, 'labels' | 'highlight' | 'format' | 'actions'> & {
    actions: { label: string; count: number; type?: 'positive' | 'negative' }[];
    highlight?: MatchHighlight | null;
    badges?: BadgeId[];
  }) | null;
}

// Visas efter sparad match: förhandsgranskning av matchrapporten som bild.
// Själva delnings-UI:t ligger i ShareImageModal och delas med coach-insikten.
export default function ShareReportModal({ isOpen, onClose, data }: ShareReportModalProps) {
  const { t } = useLanguage();
  // Först en kort uppspelning av resultatet, sedan själva delningsrutan.
  const [stage, setStage] = useState<'reveal' | 'share'>('reveal');
  useEffect(() => {
    if (!isOpen) setStage('reveal');
  }, [isOpen]);

  if (!data) return null;

  // Betygsrutan visas först när flödet är klart (delningsrutan stängs) och det
  // var ett bra tillfälle: över det egna snittet eller ett nytt märke.
  const handleClose = () => {
    if (stage === 'share') {
      const s = data.stats;
      let positive = (data.badges?.length ?? 0) > 0;
      if (s && s.games > 1) {
        const prevAvg = (s.avgPoints * s.games - data.points) / (s.games - 1);
        if (data.points > prevAvg) positive = true;
      }
      window.setTimeout(() => { maybeAskForReview(s?.games ?? 0, positive); }, 900);
    }
    onClose();
  };

  const renderReport = (format: ReportFormat) =>
    renderMatchReport({
      ...data,
      format,
      highlight: data.highlight ? t(data.highlight.key, data.highlight.params) : undefined,
      labels: {
        reportTitle: t('share.reportTitle'),
        pointsLabel: t('share.pointsLabel'),
        gamesLabel: t('share.statGames'),
        avgLabel: t('share.statAvg'),
        bestLabel: t('share.statBest'),
      },
    });

  return (
    <>
    <MatchSummaryReveal
      isOpen={isOpen && stage === 'reveal'}
      onContinue={() => setStage('share')}
      onClose={handleClose}
      playerName={data.playerName}
      points={data.points}
      actions={data.actions}
      highlight={data.highlight ? t(data.highlight.key, data.highlight.params) : undefined}
      stats={data.stats}
      badges={data.badges}
    />
    <ShareImageModal
      isOpen={isOpen && stage === 'share'}
      onClose={handleClose}
      title={t('share.title')}
      desc={t('share.desc')}
      fileNameBase={`iceiq-${data.playerName.replace(/\s+/g, '-').toLowerCase()}-${data.date}`}
      renderKey={`${data.playerName}|${data.date}|${data.points}|${data.highlight?.key ?? ''}|${data.stats?.games ?? 0}`}
      render={renderReport}
    />
    </>
  );
}
