import { useState, useEffect, useRef } from 'react';
import { Share2, Download, Square, Smartphone } from 'lucide-react';
import Modal from '../ui/Modal';
import { useLanguage } from '../../contexts/LanguageContext';
import { ReportFormat } from '../../utils/shareCanvas';

interface ShareImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  desc: string;
  /** Filnamn utan ändelse; formatet och .png läggs på här. */
  fileNameBase: string;
  /**
   * Ändras när innehållet ändras. Effekten lyssnar på den här i stället för
   * på render-funktionen, som annars får ny identitet vid varje omritning
   * och skulle rendera bilden i en oändlig loop.
   */
  renderKey: string;
  render: (format: ReportFormat) => Promise<Blob>;
}

// Delad delningsruta för appens bilder (matchrapport, coach-insikt):
// formatväxlare, förhandsgranskning och delning via Web Share API med
// nedladdning som fallback.
export default function ShareImageModal({
  isOpen, onClose, title, desc, fileNameBase, renderKey, render,
}: ShareImageModalProps) {
  const { t } = useLanguage();
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  // Kvadraten först: den fungerar överallt (laggruppen i WhatsApp, ett
  // vanligt inlägg), medan Story bara har ett hem.
  const [format, setFormat] = useState<ReportFormat>('square');

  const renderRef = useRef(render);
  renderRef.current = render;

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    let url = '';

    // Rensa direkt så förra formatets bild inte ligger kvar synlig medan
    // det nya renderas — annars ser bytet ut som att inget hände.
    setBlob(null);
    setPreviewUrl('');

    renderRef.current(format)
      .then((b) => {
        if (cancelled) return;
        url = URL.createObjectURL(b);
        setBlob(b);
        setPreviewUrl(url);
      })
      .catch((err) => console.error('Share image render failed:', err));

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [isOpen, renderKey, format]);

  // Återställ till standardformatet mellan tillfällen, så nästa delning
  // börjar likadant för alla.
  useEffect(() => {
    if (!isOpen) setFormat('square');
  }, [isOpen]);

  const fileName = `${fileNameBase}${format === 'story' ? '-story' : ''}.png`;

  const canShareFiles = () => {
    if (!blob || typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') return false;
    const file = new File([blob], fileName, { type: 'image/png' });
    return navigator.canShare({ files: [file] });
  };

  const handleShare = async () => {
    if (!blob) return;
    const file = new File([blob], fileName, { type: 'image/png' });
    try {
      await navigator.share({ files: [file], title });
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

  const formatOptions: { id: ReportFormat; label: string; icon: typeof Square }[] = [
    { id: 'square', label: t('share.formatSquare'), icon: Square },
    { id: 'story', label: t('share.formatStory'), icon: Smartphone },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="p-6">
        <p className="text-gray-400 text-sm mb-4">{desc}</p>

        <div className="flex gap-2 mb-4 p-1 bg-gray-800/60 rounded-xl">
          {formatOptions.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setFormat(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-colors ${
                format === id ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {/* Fast höjd: Story är dubbelt så hög som kvadraten, och utan taket
            hoppar hela modalen när man byter format. */}
        <div className="rounded-2xl overflow-hidden border border-gray-700 mb-6 bg-gray-950 h-[340px] flex items-center justify-center">
          {previewUrl ? (
            <img src={previewUrl} alt={title} className="max-h-full max-w-full w-auto h-auto" />
          ) : (
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
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
