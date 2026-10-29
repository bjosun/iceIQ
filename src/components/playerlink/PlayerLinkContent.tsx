import { useEffect, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTemplates } from '../../contexts/TemplateContext';
import BreathingExercise from '../breathing/BreathingExercise';
import PlayerRoutine from '../routines/PlayerRoutine';
import SeasonOverview from '../dashboard/SeasonOverview';
import ListenToMatch from '../ListenToMatch';
import LinkTabs from './LinkTabs';
import ChangeList from './ChangeList';
import type { PlayerLinkData } from './types';
import { plainCoachText } from '../../utils/coachText';
import { buildListenClips } from '../../utils/listenClips';
import { detectLang, translateFor } from '../../utils/translate';
import { newBadges } from '../../utils/badges';
import {
  hasNewMatch, latestChanges, latestGameDate, pointsVsAverage, sortedGames, type Polarity,
} from '../../utils/matchChanges';
import { readLastSeenMatch, writeLastSeenMatch } from '../../lib/linkVisit';

type TabId = 'match' | 'practice' | 'development';

interface PlayerLinkContentProps {
  data: PlayerLinkData;
  token: string | undefined;
}

// Spelarens sida när länken är giltig. Tre flikar så att sidan inte blir en
// lång rullning och så att det nya efter en match hamnar först:
//   Senaste matchen  — poäng mot eget snitt, det som ändrats, lyssna, coachen
//   Öva              — veckans pass (coachens fokus), äldre rutiner, andning
//   Utveckling       — det som ändrats med drilldown, kurva, totalsummor, märken
// Allt är räknat ur data som redan skickas (se matchChanges.ts). Vilken match
// som senast visades sparas som ett datum på enheten, aldrig på servern.
export default function PlayerLinkContent({ data, token }: PlayerLinkContentProps) {
  const { t, language } = useLanguage();
  const { templates } = useTemplates();

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

  const locale = language === 'sv' ? 'sv-SE' : 'en-GB';
  const shortDate = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  };
  const num = (n: number) => n.toLocaleString(locale, { maximumFractionDigits: 1 });

  // Polaritet och svenska namn per engelskt aktionsnamn, ur mallarna. Okända
  // namn (t.ex. förälderns egna knappar) får neutral ton och engelskt namn.
  const { polarity, svByEn } = useMemo(() => {
    const pol: Record<string, Polarity> = {};
    const sv: Record<string, string> = {};
    for (const tpl of Object.values(templates)) {
      for (const a of tpl.actions ?? []) {
        if (a.type === 'positive' || a.type === 'negative') pol[a.name.en] = a.type;
        sv[a.name.en] = a.name.sv;
      }
    }
    return { polarity: pol, svByEn: sv };
  }, [templates]);
  const label = (action: string) => (language === 'sv' ? svByEn[action] ?? action : action);

  const games = useMemo(() => sortedGames(data.games), [data.games]);
  const changes = useMemo(() => latestChanges(games, polarity), [games, polarity]);
  const latest = games.length ? games[games.length - 1] : null;
  const latestDate = latestGameDate(games);

  // Beräknas en gång vid första renderingen: sparas om efter att sidan visats.
  const [isNew] = useState(() => hasNewMatch(latestDate, readLastSeenMatch()));
  const [tab, setTab] = useState<TabId>(() => (latest && isNew ? 'match' : 'practice'));
  const [visited, setVisited] = useState<Record<TabId, boolean>>(() => ({
    match: false, practice: false, development: false, [latest && isNew ? 'match' : 'practice']: true,
  }));

  useEffect(() => {
    writeLastSeenMatch(latestDate);
  }, [latestDate]);

  const openTab = (id: TabId) => {
    setTab(id);
    setVisited((v) => (v[id] ? v : { ...v, [id]: true }));
  };

  const vsAverage = latest ? pointsVsAverage(latest.points, data.summary?.avgPoints) : null;
  const vsText =
    vsAverage === null || !data.summary
      ? null
      : vsAverage > 0
        ? t('playerLink.vsAverageAbove', { n: num(vsAverage), avg: num(data.summary.avgPoints) })
        : vsAverage < 0
          ? t('playerLink.vsAverageBelow', { n: num(Math.abs(vsAverage)), avg: num(data.summary.avgPoints) })
          : t('playerLink.vsAverageOn', { avg: num(data.summary.avgPoints) });

  const badgeIds = latest ? newBadges(games.slice(0, -1).map((g) => g.points || 0), latest.points || 0) : [];
  const topChips = changes.slice(0, 3);

  const tabs: { id: TabId; label: string; dot?: boolean }[] = [
    { id: 'match', label: t('playerLink.tabMatch'), dot: isNew && !!latest && !visited.match },
    { id: 'practice', label: t('playerLink.tabPractice') },
    { id: 'development', label: t('playerLink.tabDevelopment') },
  ];

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-cyan-400 font-black italic text-xl mb-2">
            ICE <span className="text-white">IQ</span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            {t('playerLink.pageGreeting', { name: data.playerName })}
          </h1>
          {latestDate && (
            <p className="text-sm text-gray-400 mt-1">
              {t('playerLink.updatedAfter', { date: shortDate(latestDate) })}
            </p>
          )}
        </div>

        <LinkTabs tabs={tabs} active={tab} onChange={openTab} dotLabel={t('playerLink.tabNewDot')} />

        <div id="panel-match" role="tabpanel" aria-labelledby="tab-match" hidden={tab !== 'match'} className="space-y-4">
          {visited.match && (
            <>
              {latest ? (
                <div className="bg-gray-800 rounded-2xl p-5">
                  <p className="text-xs text-gray-400">
                    {t('playerLink.latestGameLabel', { number: games.length, date: shortDate(latest.date) })}
                  </p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {num(latest.points)}{' '}
                    <span className="text-base font-normal text-gray-400">{t('playerLink.pointsUnit')}</span>
                  </p>
                  {vsText && <p className="text-sm text-gray-400 mt-1">{vsText}</p>}
                  {(topChips.length > 0 || badgeIds.length > 0) && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {badgeIds.slice(0, 1).map((id) => (
                        <span key={id} className="px-2.5 py-1 rounded-full text-xs bg-yellow-500/10 text-yellow-300 border border-yellow-500/30">
                          {t('playerLink.newBadge', { name: t(`badges.${id}.name`) })}
                        </span>
                      ))}
                      {topChips.map((c) => (
                        <span
                          key={c.action}
                          className={`px-2.5 py-1 rounded-full text-xs border tabular-nums ${
                            c.tone === 'better'
                              ? 'bg-green-500/10 text-green-300 border-green-500/30'
                              : 'bg-white/5 text-gray-300 border-white/10'
                          }`}
                        >
                          {label(c.action)} {c.previous} → {c.current}
                        </span>
                      ))}
                    </div>
                  )}
                  {games.length === 1 && <p className="text-xs text-gray-500 mt-3">{t('playerLink.onlyGame')}</p>}
                </div>
              ) : null}

              {/* Först det som är enklast att ta in: kort ljud, inget skrivande. */}
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

              <div className="bg-gray-800 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Sparkles size={18} className="text-primary-400" />
                  {t('playerLink.coachNoteTitle')}
                </h2>
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {data.latestCoachNote ? plainCoachText(data.latestCoachNote) : t('playerLink.noCoachNote')}
                </p>
              </div>
            </>
          )}
        </div>

        <div id="panel-practice" role="tabpanel" aria-labelledby="tab-practice" hidden={tab !== 'practice'} className="space-y-4">
          {visited.practice && (
            <>
              {!isNew && latest && (
                <div className="bg-gray-800 rounded-2xl p-5">
                  <p className="text-white font-semibold">{t('playerLink.nothingNewTitle')}</p>
                  <p className="text-sm text-gray-400 mt-1">{t('playerLink.nothingNewBody')}</p>
                </div>
              )}
              {data.suggestedTrack && (
                <p className="text-sm text-cyan-300 px-1">{t('playerLink.practiceFocusIntro')}</p>
              )}
              {/* Rutinerna väljs ur kortbiblioteket i content/cards/ (bara godkända
                  kort byggs in). Spelarens sida sparar ingenting på servern: sett-listan
                  ligger i webbläsaren, se src/lib/cardProgress.ts. */}
              <PlayerRoutine key={token} suggestedTrack={data.suggestedTrack ?? null} />

              <div id="breathing-section" className="bg-gray-800 rounded-2xl p-6 scroll-mt-4">
                <h2 className="text-lg font-semibold text-white mb-4">{t('playerLink.breathingSectionTitle')}</h2>
                <BreathingExercise />
              </div>
            </>
          )}
        </div>

        <div id="panel-development" role="tabpanel" aria-labelledby="tab-development" hidden={tab !== 'development'} className="space-y-4">
          {visited.development && (
            <>
              {games.length >= 2 && (
                <div className="bg-gray-800 rounded-2xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-3">{t('playerLink.developmentChangedHeading')}</h2>
                  <ChangeList changes={changes} label={label} />
                </div>
              )}
              <SeasonOverview
                playerName={data.playerName}
                games={data.games}
                allGames={data.games}
                summary={data.summary}
                templateId={[...games].reverse().find((g) => typeof g.template === 'string')?.template}
                showShelves
                gemStyle="pro"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
