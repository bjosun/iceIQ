import { useEffect, useState } from 'react';
import { Smartphone, Pencil } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  buildSwishUrl,
  getSwishNumber,
  normalizeSwishNumber,
  setSwishNumber,
  swishAvailable,
  swishMessage,
} from '../../utils/swish';

interface SwishButtonProps {
  playerName: string;
  amount: number;
}

// Visas bara på svenska och bara på mobil. Numret sparas lokalt, se utils/swish.ts.
export default function SwishButton({ playerName, amount }: SwishButtonProps) {
  const { t, language } = useLanguage();
  const [number, setNumber] = useState<string | null>(() => getSwishNumber(playerName));
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  // Numret hör till spelaren. Komponenten monteras ofta innan spelarnamnet är
  // valt (och blir kvar när man byter spelare), så state måste följa namnet,
  // annars visas fel eller inget sparat nummer.
  useEffect(() => {
    setNumber(getSwishNumber(playerName));
    setEditing(false);
    setInput('');
    setError('');
  }, [playerName]);

  if (!swishAvailable(language) || !playerName || amount <= 0) return null;

  const openSwish = (n: string) => {
    window.location.href = buildSwishUrl(n, amount, swishMessage(playerName));
  };

  const handleSave = () => {
    const normalized = normalizeSwishNumber(input);
    if (!normalized) {
      setError(t('swish.invalid'));
      return;
    }
    setSwishNumber(playerName, normalized);
    setNumber(normalized);
    setEditing(false);
    setInput('');
    setError('');
    openSwish(normalized);
  };

  if (!number || editing) {
    return (
      <div className="mt-2 w-full text-left">
        <label className="block text-[11px] text-gray-300 mb-1">
          {t('swish.numberLabel', { name: playerName })}
        </label>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="off"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="070 123 45 67"
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-white"
        />
        <p className="text-[10px] text-gray-500 mt-1">{t('swish.numberHint')}</p>
        {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
        <button
          onClick={handleSave}
          className="mt-2 w-full text-xs font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 px-2 py-1.5 rounded-lg"
        >
          {t('swish.saveAndOpen')}
        </button>
        {number && (
          <button
            onClick={() => {
              setSwishNumber(playerName, null);
              setNumber(null);
              setEditing(false);
            }}
            className="mt-1 w-full text-[11px] text-gray-400 hover:text-gray-200"
          >
            {t('swish.remove')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-1">
      <button
        onClick={() => openSwish(number)}
        className="flex items-center gap-1 text-[10px] uppercase tracking-wider bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 px-2 py-1 rounded-full transition-all"
      >
        <Smartphone size={10} /> {t('swish.pay')}
      </button>
      <button
        onClick={() => { setInput(number); setEditing(true); }}
        className="p-1 text-gray-500 hover:text-gray-300"
        title={t('swish.change')}
      >
        <Pencil size={10} />
      </button>
    </div>
  );
}
