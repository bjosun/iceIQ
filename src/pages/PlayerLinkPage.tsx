import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { Loader2, AlertCircle } from 'lucide-react';
import { euFunctions } from '../services/firestore';
import { useLanguage } from '../contexts/LanguageContext';
import PlayerLinkContent from '../components/playerlink/PlayerLinkContent';
import type { PlayerLinkData } from '../components/playerlink/types';

type LoadState = 'loading' | 'ready' | 'not-found' | 'revoked' | 'error';

// Spelarens egen sida: nås via en beständig länk föräldern skickar, ingen
// inloggning. Token:en (i URL:en) är hela behörigheten — se getPlayerLinkData
// i functions/index.js. Renderas utan <Layout> (se hideLayout i App.tsx).
export default function PlayerLinkPage() {
  const { token } = useParams<{ token: string }>();
  const { t, setLanguage } = useLanguage();
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
        const payload = res.data as PlayerLinkData;
        // Sidan följer förälderns språk (det coachen svarade på, annars kontots språk),
        // inte mottagarens webbläsare. Annars blandas svenska och engelska på samma sida.
        if (payload.listenLang === 'sv' || payload.listenLang === 'en') setLanguage(payload.listenLang);
        setData(payload);
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

  return <PlayerLinkContent data={data} token={token} />;
}
