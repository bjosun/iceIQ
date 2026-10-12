// Verktyg (bara i dev, ingår inte i produktionsbygget): renderar App Store-
// skärmdumparna med påhittad data. Öppna /store-screens.html?s=1..6&lang=sv|en
// och ta bilden med headless Chrome i 440 x 956 CSS-pixlar vid skala 3
// (= 1320 x 2868, iPhone 6,9"). Se docs/app-store-listing.md.
import { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { LanguageProvider, useLanguage } from './contexts/LanguageContext'
import { SubscriptionProvider } from './contexts/SubscriptionContext'
import { TemplateProvider, useTemplates } from './contexts/TemplateContext'
import ActionGrid from './components/dashboard/ActionGrid'
import SeasonOverview from './components/dashboard/SeasonOverview'
import MatchSummaryReveal from './components/modals/MatchSummaryReveal'
import ListenToMatch from './components/ListenToMatch'
import { InsightQuote } from './components/ai/AiCoach'
import { buildListenClips } from './utils/listenClips'
import { translateFor } from './utils/translate'
import { renderMatchReport } from './utils/matchReport'

const params = new URLSearchParams(location.search)
const slide = Number(params.get('s') || '1')
const lang = params.get('lang') === 'en' ? 'en' : 'sv'
try { localStorage.setItem('iceiq-language', lang) } catch { /* */ }

const CAPTIONS: Record<string, string[]> = {
  sv: [
    'Logga matchen på ett par minuter',
    'Se hur det gick, mot ditt eget snitt',
    'Coachen: det som gick bra och något att tänka på',
    'Följ utvecklingen över säsongen',
    'Lyssna på matchen i korta klipp',
    'Dela en matchbild med laget',
  ],
  en: [
    'Log a game in a couple of minutes',
    'See how it went, against your own average',
    'The coach: what went well and something to think about',
    'Follow the progress through the season',
    'Listen to the game in short clips',
    'Share a game image with the team',
  ],
}

const GAMES = [8, 11, 9, 14, 12, 16, 13, 18].map((points, i) => ({
  date: `2026-0${(i % 9) + 1}-1${i % 9}`,
  points,
}))
const SUMMARY = { games: 8, avgPoints: 12.6, bestGame: 18, last5Avg: 14.6 }

function Caption({ text }: { text: string }) {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] px-6 pt-10 pb-4"
      style={{ background: 'linear-gradient(180deg, #0b1220 0%, #0b1220 70%, rgba(11,18,32,0) 100%)' }}
    >
      <p className="text-[30px] leading-tight font-extrabold text-white tracking-tight">{text}</p>
    </div>
  )
}

function CountedGrid() {
  const { currentTemplate } = useTemplates()
  const [counts, setCounts] = useState<Record<string, number>>({})
  useEffect(() => {
    if (!currentTemplate) return
    const next: Record<string, number> = {}
    const positives = currentTemplate.actions.filter((a) => a.type === 'positive')
    positives.slice(0, 6).forEach((a, i) => { next[JSON.stringify(a.name)] = [2, 5, 3, 1, 4, 2][i] })
    const goal = currentTemplate.actions.find((a) => a.name.en === 'Goal')
    if (goal) next[JSON.stringify(goal.name)] = 2
    const negatives = currentTemplate.actions.filter((a) => a.type === 'negative')
    if (negatives[0]) next[JSON.stringify(negatives[0].name)] = 1
    setCounts(next)
  }, [currentTemplate])
  return <ActionGrid actionCounts={counts} onCountChange={setCounts} />
}

function ReportImage() {
  const { t } = useLanguage()
  const [url, setUrl] = useState('')
  useEffect(() => {
    renderMatchReport({
      playerName: 'Elias', team: 'Exempel IF', date: '2026-10-11', points: 18,
      actions: [
        { label: lang === 'sv' ? 'Mål' : 'Goal', count: 2 },
        { label: lang === 'sv' ? 'Passning' : 'Pass', count: 7 },
        { label: lang === 'sv' ? 'Tackling' : 'Tackle', count: 4 },
      ],
      highlight: lang === 'sv' ? 'Säsongsbästa, 18 poäng' : 'Season best, 18 points',
      stats: { games: 8, avgPoints: 12.6, bestGame: 18 },
      format: 'square',
      labels: {
        reportTitle: t('share.reportTitle'), pointsLabel: t('share.pointsLabel'),
        gamesLabel: t('share.statGames'), avgLabel: t('share.statAvg'), bestLabel: t('share.statBest'),
      },
    }).then((b) => setUrl(URL.createObjectURL(b)))
  }, [t])
  return url ? <img src={url} alt="" className="w-full rounded-2xl shadow-2xl" /> : null
}

function Screen() {
  const { t } = useLanguage()
  const caption = CAPTIONS[lang][slide - 1] || ''
  const tr = translateFor(lang)
  const clips = buildListenClips({
    playerName: 'Elias', games: GAMES.map((g) => ({ date: g.date, points: g.points })),
    coachSpoken: lang === 'sv'
      ? ['Hej Elias! Du gjorde arton poäng.', 'Det är fem över ditt eget snitt.', 'Tre vunna närkamper. Bra jobbat.', 'Nästa gång: håll huvudet uppe i egen zon.']
      : ['Hey Elias! You got eighteen points.', "That's five over your own average.", 'Three won battles. Nice work.', 'Next time: keep your head up in your own zone.'],
    t: tr, lang,
  })
  return (
    <div className="bg-[#0b1220] min-h-screen" style={{ width: 440, height: 956, overflow: 'hidden' }}>
      <Caption text={caption} />
      <div style={{ paddingTop: 150 }} className="px-4">
        {slide === 1 && <div style={{ transform: 'scale(0.92)', transformOrigin: 'top center', marginTop: -140 }}><CountedGrid /></div>}
        {slide === 2 && (
          <MatchSummaryReveal
            isOpen onContinue={() => {}} onClose={() => {}} playerName="Elias" points={18}
            actions={[
              { label: lang === 'sv' ? 'Passning' : 'Pass', count: 7, type: 'positive' },
              { label: lang === 'sv' ? 'Tackling' : 'Tackle', count: 4, type: 'positive' },
              { label: lang === 'sv' ? 'Mål' : 'Goal', count: 2, type: 'positive' },
              { label: lang === 'sv' ? 'Pucktapp' : 'Turnover', count: 2, type: 'negative' },
            ]}
            highlight={lang === 'sv' ? 'Säsongsbästa, 18 poäng' : 'Season best, 18 points'}
            stats={{ games: 8, avgPoints: 12.6, bestGame: 18 }}
            badges={['personalBest', 'threeAboveAverage']}
          />
        )}
        {slide === 3 && (
          <div className="space-y-3">
            <div className="max-w-[92%] rounded-2xl rounded-bl-none border border-white/10 bg-black/30 p-4 text-sm leading-relaxed text-gray-200">
              {lang === 'sv'
                ? 'Bra match, Elias! Du hittade målen när det behövdes och vann dina närkamper. Håll den nivån, och titta på hur du rör puckan under press.'
                : 'Nice game, Elias! You found the goals when it counted and won your battles. Keep that level, and look at how you handle the puck under pressure.'}
            </div>
            <InsightQuote
              title={t('ai.strengthTitle')} tone="strength" shareLabel={t('ai.shareInsight')} onShare={() => {}}
              text={lang === 'sv' ? 'Tre vunna närkamper, flest hittills i säsongen' : 'Three won battles, the most so far this season'}
            />
            <InsightQuote
              title={t('ai.thinkTitle')} tone="think" shareLabel={t('ai.shareThought')} onShare={() => {}}
              text={lang === 'sv' ? 'Två pucktapp i egen zon. Vad såg du precis innan?' : 'Two turnovers in your own zone. What did you see right before?'}
            />
          </div>
        )}
        {slide === 4 && <SeasonOverview playerName="Elias" games={GAMES} summary={SUMMARY} />}
        {slide === 5 && (
          // Uppspelningsläget återskapat statiskt (spelaren startar bara på tryck).
          <div className="mt-24 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-900/40 to-gray-800 p-5 text-center">
            <p className="mb-3 text-xs uppercase tracking-widest text-cyan-300">{tr('listen.title')}</p>
            <div className="flex min-h-[200px] items-center justify-center px-1">
              <p className="text-3xl font-bold leading-snug text-white">
                {lang === 'sv' ? 'Det är fem över ditt eget snitt.' : "That's five over your own average."}
              </p>
            </div>
            <div className="my-4 flex justify-center gap-1.5">
              <span className="h-1.5 w-4 rounded-full bg-cyan-700" />
              <span className="h-1.5 w-8 rounded-full bg-cyan-400" />
              <span className="h-1.5 w-4 rounded-full bg-gray-600" />
            </div>
            <div className="flex items-center justify-center gap-3">
              <span className="rounded-xl bg-gray-700 px-5 py-3 font-semibold text-white">{tr('listen.again')}</span>
              <span className="rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white">{tr('listen.next')} ›</span>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
              <span>{tr('listen.voice')}</span>
              <span className="rounded-full border border-cyan-400 px-3 py-1 text-cyan-200">{tr('listen.voiceMale')}</span>
              <span className="rounded-full border border-gray-600 px-3 py-1">{tr('listen.voiceFemale')}</span>
            </div>
          </div>
        )}
        {slide === 6 && <div className="mt-16"><ReportImage /></div>}
      </div>
    </div>
  )
}

// Chromes headless har en minsta fönsterbredd över 440 px. Sidan läggs därför i
// en iframe på exakt 440 x 956, så att "fixed" och viewport-breddar blir rätt.
if (params.get('frame') === '1') {
  const inner = location.pathname + '?s=' + slide + '&lang=' + lang
  document.body.style.margin = '0'
  document.body.style.background = '#0b1220'
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <iframe src={inner} width={440} height={956} style={{ border: 0, display: 'block' }} />
  )
} else {
ReactDOM.createRoot(document.getElementById('root')!).render(
  <AuthProvider><LanguageProvider><SubscriptionProvider><TemplateProvider><Screen /></TemplateProvider></SubscriptionProvider></LanguageProvider></AuthProvider>
)
}
