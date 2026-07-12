import React, { useState, useEffect } from 'react';
import { Share2, Download } from 'lucide-react';
import Modal from '../ui/Modal';
import { useLanguage } from '../../contexts/LanguageContext';
import { renderMatchReport, MatchReportData } from '../../utils/matchReport';

interface ShareReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Omit<MatchReportData, 'labels'> | null;
}

// Visas efter sparad match: förhandsgranskning av matchrapporten som
// bild, med delning via Web Share API och nedladdning som fallback.
export default function ShareReportModal({ isOpen, onClose, data }: ShareReportModalProps) {
  const { t } = useLanguage();
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !data) return;

    let cancelled = false;
    let url = '';

    renderMatchReport({
      ...data,
      labels: {
        reportTitle: t('share.reportTitle'),
        pointsLabel: t('share.pointsLabel'),
      },
    }).then((b) => {
      if (cancelled) return;
      url = URL.createObjectURL(b);
      setBlob(b);
      setPreviewUrl(url);
    }).catch((err) => console.error('Report render failed:', err));

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
      setBlob(null);
      setPreviewUrl('');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, data]);

  if (!data) return null;

  const fileName = `iceiq-${data.playerName.replace(/\s+/g, '-').toLowerCase()}-${data.date}.png`;

  const canShareFiles = () => {
    if (!blob || typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') return false;
    const file = new File([blob], fileName, { type: 'image/png' });
    return navigator.canShare({ files: [file] });
  };

  const handleShare = async () => {
    if (!blob) return;
    const file = new File([blob], fileName, { type: 'image/png' });
    try {
      await navigator.share({ files: [file], title: t('share.reportTitle') });
    } catch (err: any) {
      // Avbruten delning är inte ett fel
      if (err?.name !== 'AbortError') console.error('Share failed:', err);
    }
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = fileName;
    a.click();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('share.title')} size="md">
      <div className="p-6">
        <p className="text-gray-400 text-sm mb-4">{t('share.desc')}</p>

        <div className="rounded-2xl overflow-hidden border border-gray-700 mb-6 bg-gray-950 min-h-[200px] flex items-center justify-center">
          {previewUrl ? (
            <img src={previewUrl} alt={t('share.reportTitle')} className="w-full h-auto" />
          ) : (
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500 my-16"></div>
          )}
        </div>

        <div className="flex gap-3">
          {canShareFiles() && (
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl transition-colors"
            >
              <Share2 size={18} /> {t('share.shareBtn')}
            </button>
          )}
          <button
            onClick={handleDownload}
            disabled={!previewUrl}
            className={`flex-1 flex items-center justify-center gap-2 font-bold py-3 rounded-xl transition-colors ${
              canShareFiles()
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white'
            } disabled:opacity-50`}
          >
            <Download size={18} /> {t('share.downloadBtn')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
