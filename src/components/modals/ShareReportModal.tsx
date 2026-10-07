import { useEffect, useState } from 'react';
import ShareImageModal from './ShareImageModal';
import MatchSummaryReveal from './MatchSummaryReveal';
import { useLanguage } from '../../contexts/LanguageContext';
import { renderMatchReport, MatchReportData } from '../../utils/matchReport';
import { MatchHighlight } from '../../utils/matchHighlight';
import { ReportFormat } from '../../utils/shareCanvas';
import { BadgeId } from '../../utils/badges';

interface ShareReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: (Omit<MatchReportData, 'labels' | 'highlight' | 'format'> & {
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
      onClose={onClose}
      playerName={data.playerName}
      points={data.points}
      actions={data.actions}
      highlight={data.highlight ? t(data.highlight.key, data.highlight.params) : undefined}
      stats={data.stats}
      badges={data.badges}
    />
    <ShareImageModal
      isOpen={isOpen && stage === 'share'}
      onClose={onClose}
      title={t('share.title')}
      desc={t('share.desc')}
      fileNameBase={`iceiq-${data.playerName.replace(/\s+/g, '-').toLowerCase()}-${data.date}`}
      renderKey={`${data.playerName}|${data.date}|${data.points}|${data.highlight?.key ?? ''}|${data.stats?.games ?? 0}`}
      render={renderReport}
    />
    </>
  );
}
