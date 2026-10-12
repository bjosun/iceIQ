import { useState } from 'react';
import { Copy, Check, Share2, Ban } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { euFunctions } from '../../services/firestore';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import { useLanguage } from '../../contexts/LanguageContext';

interface PlayerLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  playerName: string;
}

// Visar länken en förälder just genererat till en spelare (se
// handleGenerateLink i PlayerForm.tsx) — kopiera eller dela direkt via
// telefonens delningsmeny.
export default function PlayerLinkModal({ isOpen, onClose, url, playerName }: PlayerLinkModalProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t('playerLink.copied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('playerLink.mintError'));
    }
  };

  // Stänger länken: den som har den kommer då inte längre in. En ny länk
  // skapas nästa gång du trycker på "Skapa länk".
  const revoke = async () => {
    if (!window.confirm(t('playerLink.revokeConfirm', { name: playerName }))) return;
    setRevoking(true);
    try {
      await httpsCallable(euFunctions, 'revokePlayerLink')({ playerName });
      toast.success(t('playerLink.revoked'));
      onClose();
    } catch {
      toast.error(t('playerLink.revokeError'));
    } finally {
      setRevoking(false);
    }
  };

  const share = async () => {
    if (typeof navigator.share !== 'function') return;
    try {
      await navigator.share({ url, title: t('playerLink.modalTitle', { name: playerName }) });
    } catch (err: any) {
      // Avbruten delning är inte ett fel
      if (err?.name !== 'AbortError') console.error('Share failed:', err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('playerLink.modalTitle', { name: playerName })}
      description={t('playerLink.modalDesc', { name: playerName })}
    >
      <div className="p-6 space-y-4">
        <div className="bg-gray-900 rounded-xl px-4 py-3 text-cyan-300 text-sm break-all">{url}</div>
        <div className="flex gap-3">
          <button
            onClick={copy}
            className="flex-1 flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-xl transition-colors"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {t('playerLink.copy')}
          </button>
          {typeof navigator.share === 'function' && (
            <button
              onClick={share}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2.5 rounded-xl transition-colors"
            >
              <Share2 size={16} />
              {t('playerLink.share')}
            </button>
          )}
        </div>
        <button
          onClick={revoke}
          disabled={revoking}
          className="w-full flex items-center justify-center gap-2 text-sm text-red-400 hover:text-red-300 py-2 disabled:opacity-50"
        >
          <Ban size={15} /> {t('playerLink.revoke')}
        </button>
      </div>
    </Modal>
  );
}
