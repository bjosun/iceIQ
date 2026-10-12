import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';
import { getPlayersCollectionRef } from '../../services/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface CoachMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
}

interface Note { date: string; note: string }

// Föräldern ser och styr coachens anteckningar om spelaren: läsa dem, rensa
// dem, eller stänga av att nya sparas. Gör minnet till ett medvetet val i
// stället för något som sker i bakgrunden.
export default function CoachMemoryModal({ isOpen, onClose, playerName }: CoachMemoryModalProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [notes, setNotes] = useState<Note[]>([]);
  const [memoryOff, setMemoryOff] = useState(false);
  const [loading, setLoading] = useState(false);

  const ref = user && playerName ? doc(getPlayersCollectionRef(user.uid), playerName) : null;

  useEffect(() => {
    if (!isOpen || !ref) return;
    let cancelled = false;
    setLoading(true);
    getDoc(ref)
      .then((snap) => {
        if (cancelled) return;
        const d = snap.data() || {};
        setNotes(Array.isArray(d.coachTimeline) ? d.coachTimeline : []);
        setMemoryOff(d.coachMemoryOff === true);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, playerName, user?.uid]);

  const toggle = async () => {
    if (!ref) return;
    const next = !memoryOff;
    setMemoryOff(next);
    try {
      await updateDoc(ref, { coachMemoryOff: next });
    } catch {
      setMemoryOff(!next);
      toast.error(t('coachMemory.error'));
    }
  };

  const clearAll = async () => {
    if (!ref || !window.confirm(t('coachMemory.clearConfirm', { name: playerName }))) return;
    try {
      await updateDoc(ref, { coachTimeline: [] });
      setNotes([]);
      toast.success(t('coachMemory.cleared'));
    } catch {
      toast.error(t('coachMemory.error'));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('coachMemory.title', { name: playerName })} size="md">
      <div className="p-6">
        <p className="text-sm text-gray-400 mb-4">{t('coachMemory.desc')}</p>

        <div className="flex items-center justify-between gap-3 mb-5 p-3 rounded-xl bg-gray-900/60 border border-gray-700">
          <span className="text-sm text-white">{t('coachMemory.keep')}</span>
          <button
            type="button"
            role="switch"
            aria-checked={!memoryOff}
            onClick={toggle}
            className={`relative shrink-0 w-12 h-7 rounded-full transition-colors ${!memoryOff ? 'bg-cyan-500' : 'bg-gray-600'}`}
          >
            <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${!memoryOff ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">…</p>
        ) : notes.length === 0 ? (
          <p className="text-sm text-gray-400">{t('coachMemory.empty')}</p>
        ) : (
          <>
            <ul className="space-y-2 mb-4">
              {notes.map((n, i) => (
                <li key={i} className="text-sm text-gray-200 bg-gray-900/60 rounded-lg px-3 py-2">
                  <span className="block text-[11px] text-gray-500 mb-0.5">{n.date}</span>
                  {n.note}
                </li>
              ))}
            </ul>
            <button
              onClick={clearAll}
              className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300"
            >
              <Trash2 size={15} /> {t('coachMemory.clear')}
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
