import ShareImageModal from './ShareImageModal';
import { useLanguage } from '../../contexts/LanguageContext';
import { renderMatchReport, MatchReportData } from '../../utils/matchReport';
import { MatchHighlight } from '../../utils/matchHighlight';
import { ReportFormat } from '../../utils/shareCanvas';

interface ShareReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: (Omit<MatchReportData, 'labels' | 'highlight' | 'format'> & {
    highlight?: MatchHighlight | null;
  }) | null;
}

// Visas efter sparad match: förhandsgranskning av matchrapporten som bild.
// Själva delnings-UI:t ligger i ShareImageModal och delas med coach-insikten.
export default function ShareReportModal({ isOpen, onClose, data }: ShareReportModalProps) {
  const { t } = useLanguage();

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
    <ShareImageModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('share.title')}
      desc={t('share.desc')}
      fileNameBase={`iceiq-${data.playerName.replace(/\s+/g, '-').toLowerCase()}-${data.date}`}
      renderKey={`${data.playerName}|${data.date}|${data.points}|${data.highlight?.key ?? ''}|${data.stats?.games ?? 0}`}
      render={renderReport}
    />
  );
}
