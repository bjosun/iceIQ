import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import Modal from '../ui/Modal';
import { useLanguage } from '../../contexts/LanguageContext';

interface AiConsentModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

// Visas första gången man använder AI-coachen. Säger rakt ut vad som skickas,
// vart, och att det gäller uppgifter om en spelare (ofta ett barn).
export default function AiConsentModal({ isOpen, onAccept, onDecline }: AiConsentModalProps) {
  const { t } = useLanguage();

  return (
    <Modal isOpen={isOpen} onClose={onDecline} title={t('aiConsent.title')} size="md">
      <div className="p-6">
        <div className="w-12 h-12 rounded-full bg-cyan-500/15 text-cyan-300 flex items-center justify-center mb-4">
          <ShieldCheck size={24} />
        </div>
        <p className="text-sm text-gray-300 mb-4">{t('aiConsent.intro')}</p>

        <ul className="text-sm text-gray-300 space-y-2 mb-4 list-disc pl-5">
          <li>{t('aiConsent.shared')}</li>
          <li>{t('aiConsent.where')}</li>
          <li>{t('aiConsent.notShared')}</li>
          <li>{t('aiConsent.guardian')}</li>
        </ul>

        <p className="text-xs text-gray-400 mb-5">
          {t('aiConsent.more')}{' '}
          <Link to="/privacy" className="text-cyan-400 underline" onClick={onDecline}>
            {t('privacyLink')}
          </Link>
        </p>

        <button
          onClick={onAccept}
          className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl transition-colors"
        >
          {t('aiConsent.accept')}
        </button>
        <button
          onClick={onDecline}
          className="w-full mt-2 py-2 text-sm text-gray-400 hover:text-gray-200"
        >
          {t('aiConsent.decline')}
        </button>
      </div>
    </Modal>
  );
}
