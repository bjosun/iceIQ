import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { euFunctions } from '../services/firebase';
import { useLanguage } from '../contexts/LanguageContext';
import BreathingExercise from '../components/breathing/BreathingExercise';
import SeasonOverview from '../components/dashboard/SeasonOverview';

interface PlayerLinkData {
  playerName: string;
  games: { date: string; points: number }[];
  summary: { games: number; avgPoints: number; bestGame: number; last5Avg: number } | null;
  latestCoachNote: string | null;
}

type LoadState = 'loading' | 'ready' | 'not-found' | 'revoked' | 'error';

// Spelarens egen sida: nås via en beständig länk föräldern skickar, ingen
// inloggning. Token:en (i URL:en) är hela behörigheten — se getPlayerLinkData
// i functions/index.js. Renderas utan <Layout> (se hideLayout i App.tsx).
export default function PlayerLinkPage() {
  const { token } = useParams<{ token: string }>();
  const { t } = useLanguage();
  const [state, setState] = useState<LoadState>('loading');
  const [data, setData] = useState<PlayerLinkData | null>(null);

  useEffect(() => {
    if (!token) {
      setState('not-found');
      return;
    }
    let cancelled = false;
    const getPlayerLinkData = httpsCallable(euFunctions, 'getPlayerLinkData');
    getPlayerLinkData({ token })
      .then((res) => {
        if (cancelled) return;
        setData(res.data as PlayerLinkData);
        setState('ready');
      })
      .catch((err: any) => {
        if (cancelled) return;
        if (err?.code === 'functions/permission-denied') setState('revoked');
        else setState('not-found');
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <Loader2 className="animate-spin text-cyan-400" size={40} />
      </div>
    );
  }

  if (state !== 'ready' || !data) {
    const title = state === 'revoked' ? t('playerLink.revokedTitle') : t('playerLink.notFoundTitle');
    const body = state === 'revoked' ? t('playerLink.revokedBody') : t('playerLink.notFoundBody');
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center">
          <AlertCircle className="text-red-400 mx-auto mb-4" size={40} />
          <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
          <p className="text-gray-400">{body}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-cyan-400 font-black italic text-xl mb-2">
            ICE <span className="text-white">IQ</span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            {t('playerLink.pageGreeting', { name: data.playerName })}
          </h1>
        </div>

        <div className="bg-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">{t('playerLink.breathingSectionTitle')}</h2>
          <BreathingExercise />
        </div>

        <SeasonOverview playerName={data.playerName} games={data.games} summary={data.summary} />

        <div className="bg-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-400" />
            {t('playerLink.coachNoteTitle')}
          </h2>
          <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
            {data.latestCoachNote || t('playerLink.noCoachNote')}
          </p>
        </div>
      </div>
    </div>
  );
}
