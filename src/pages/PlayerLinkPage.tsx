import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { euFunctions } from '../services/firestore';
import { useLanguage } from '../contexts/LanguageContext';
import BreathingExercise from '../components/breathing/BreathingExercise';
import PlayerRoutine from '../components/routines/PlayerRoutine';
import SeasonOverview from '../components/dashboard/SeasonOverview';
import { plainCoachText } from '../utils/coachText';
import ListenToMatch from '../components/ListenToMatch';
import { buildListenClips } from '../utils/listenClips';
import { detectLang, translateFor } from '../utils/translate';

interface PlayerLinkData {
  playerName: string;
  games: { date: string; points: number; template?: string; counts?: Record<string, number> }[];
  summary: { games: number; avgPoints: number; bestGame: number; last5Avg: number } | null;
  latestCoachNote: string | null;
  /** Coachens korta rader från det senaste svaret (se askCoach). Kan saknas. */
  coachHighlight?: string | null;
  coachThink?: string | null;
  coachSpoken?: string[];
  /** Språket coachen svarade på (förälderns konto). Styr text och röst i lyssnakortet. */
  listenLang?: 'sv' | 'en' | null;
  /** Matcher i rad med rutinen gjord — se computeRoutineStreak i functions/index.js. */
  routineStreak: number;
  /** Spår för rutinkorten som coachen pekat ut (t.ex. 'focus'), eller null. */
  suggestedTrack?: string | null;
}

type LoadState = 'loading' | 'ready' | 'not-found' | 'revoked' | 'error';

// Spelarens egen sida: nås via en beständig länk föräldern skickar, ingen
// inloggning. Token:en (i URL:en) är hela behörigheten — se getPlayerLinkData
// i functions/index.js. Renderas utan <Layout> (se hideLayout i App.tsx).
export default function PlayerLinkPage() {
  const { token } = useParams<{ token: string }>();
  const { t, language, setLanguage } = useLanguage();
  const [state, setState] = useState<LoadState>('loading');
  const [data, setData] = useState<PlayerLinkData | null>(null);
  // Streaken uppdateras lokalt när rutinen just gjorts, så belöningskortet
  // visar rätt siffra utan att sidan behöver laddas om.

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

  // Språk för lyssnakortet. Prioritet:
  //  1. Ett språk som besökaren själv valt på den här enheten (språkknappen i
  //     appen sparar det). Det är det som gäller när du testar EN/SV.
  //  2. Språket coachen svarade på / förälderns kontospråk (barnets telefon har
  //     inget eget val, och webbläsarens språk ska inte avgöra).
  //  3. Texten gissas, sist webbläsarens språk.
  // Coachens rader läses bara upp när de är skrivna på samma språk som kortet,
  // så att svensk text aldrig läses med engelsk röst eller tvärtom.
  const coachLines = [...(data.coachSpoken ?? []), data.coachHighlight ?? '', data.coachThink ?? ''].join(' ');
  const textLang = detectLang(coachLines) || data.listenLang || null;
  let savedLang: 'sv' | 'en' | null = null;
  try {
    const stored = localStorage.getItem('iceiq-language');
    if (stored === 'sv' || stored === 'en') savedLang = stored;
  } catch { /* lagring blockerad */ }
  const listenLang: 'sv' | 'en' =
    savedLang || data.listenLang || textLang || (language === 'sv' ? 'sv' : 'en');
  const coachMatches = !textLang || textLang === listenLang;
  const hasCoachLines = coachLines.trim().length > 0;

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

        {/* Först: det som är enklast att ta in. Kort ljud, inget skrivande.
            Text och röst följer språket coachen svarade på, så att svensk
            coachtext aldrig läses med engelsk röst (eller tvärtom). */}
        <ListenToMatch
          token={token}
          lang={listenLang}
          note={hasCoachLines && !coachMatches ? translateFor(listenLang)('listen.coachOtherLang') : undefined}
          clips={buildListenClips({
            playerName: data.playerName,
            games: data.games,
            coachHighlight: coachMatches ? data.coachHighlight : null,
            coachThink: coachMatches ? data.coachThink : null,
            coachSpoken: coachMatches ? data.coachSpoken : null,
            t: translateFor(listenLang),
            lang: listenLang,
          })}
        />

        {/* Rutinerna väljs ur kortbiblioteket i content/cards/ (bara godkända kort
            byggs in). content/routines/kvallen-fore-match.md är källdokumentet
            för kvällsrutinen. RoutineStack är byggd generisk med avsikt: nästa
            rutin blir ny kortdata, inte en ny komponent.

            Version 1: spelarens sida sparar ingenting på servern. Rutinen görs i
            huvudet och på skärmen, men inget skickas till servern och ingen streak
            räknas, så att länken är skrivskyddad och inget samlas in från barnet.
            Slås på igen när ett hållbart samtyckes- och verifieringsflöde finns
            (ROUTINE_LOGGING_ENABLED i functions/.env plus den här koden). */}
        <PlayerRoutine key={token} suggestedTrack={data.suggestedTrack ?? null} />

        <div id="breathing-section" className="bg-gray-800 rounded-2xl p-6 scroll-mt-4">
          <h2 className="text-lg font-semibold text-white mb-4">{t('playerLink.breathingSectionTitle')}</h2>
          <BreathingExercise />
        </div>

        <SeasonOverview
          playerName={data.playerName}
          games={data.games}
          allGames={data.games}
          summary={data.summary}
          templateId={[...data.games].reverse().find((g) => typeof g.template === 'string')?.template}
          showShelves
          gemStyle="pro"
        />

        <div className="bg-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Sparkles size={18} className="text-primary-400" />
            {t('playerLink.coachNoteTitle')}
          </h2>
          <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
            {data.latestCoachNote ? plainCoachText(data.latestCoachNote) : t('playerLink.noCoachNote')}
          </p>
        </div>
      </div>
    </div>
  );
}
