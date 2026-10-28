import React, { useState, useEffect, useMemo, useRef } from 'react';
import { usePlayerData } from '../hooks/usePlayerData';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTemplates } from '../contexts/TemplateContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useAiCredits } from '../hooks/useAiCredits';
import { getDemoPlayerName, getDemoHistory } from '../utils/demoData';
import { pickMatchHighlight, MatchHighlight } from '../utils/matchHighlight';
import { newBadges, BadgeId } from '../utils/badges';
import { topAward, isPosition, AwardId } from '../utils/awards';
import { trackFunnel } from '../utils/funnel';
import { onDataRefreshed, firestore as firestoreService } from '../services/firestore';
import { MatchReportStats } from '../utils/matchReport';
import { moneyModeUnit } from '../utils/pricing';
import { BONUS_FACTOR_DEFAULT } from '../utils/constants';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
// Komponenter
import SubscriptionModal from '../components/modals/SubscriptionModal';
import PlayerForm from '../components/dashboard/PlayerForm';
import ActionGrid from '../components/dashboard/ActionGrid';
import SummarySection from '../components/dashboard/SummarySection';
import SeasonOverview from '../components/dashboard/SeasonOverview';
import SeasonCompare from '../components/dashboard/SeasonCompare';
import { seasonsIn, inSeason, seasonLabel, avgOf, SeasonKey } from '../utils/season';
import AiCoach from '../components/ai/AiCoach'; 
import PlayerHistoryModal from '../components/modals/PlayerHistoryModal';
import TemplateEditorModal from '../components/modals/TemplateEditorModal';
import PlayerSelectModal from '../components/modals/PlayerSelectModal';
import ShareReportModal from '../components/modals/ShareReportModal';
import Card from '../components/ui/Card';
import LoginForm from '../components/auth/LoginForm';
import SignupForm from '../components/auth/SignupForm';

// Ikoner
import { 
  BarChart3, 
  Target, 
  TrendingUp, 
  Zap, 
  Banknote, 
  Trophy,
  Sparkles,
  Save
} from 'lucide-react';

// Pågående match sparas lokalt så att en omladdning, låst telefon eller
// tappad täckning vid rinken inte raderar det som redan registrerats.
const MATCH_DRAFT_KEY = 'iceiq-match-draft';

function loadMatchDraft(): {
  actionCounts?: Record<string, number>;
  selectedPlayerName?: string;
  gameDate?: string;
  bonusFactor?: number;
  isMoneyMode?: boolean;
} | null {
  try {
    const raw = localStorage.getItem(MATCH_DRAFT_KEY);
    const draft = raw ? JSON.parse(raw) : null;
    return draft && typeof draft === 'object' ? draft : null;
  } catch {
    return null;
  }
}

interface Player {
  id: string;
  name: string;
  currentBalance?: number;
}

// Aggregat över spelarens ALLA registrerade matcher — ger AI-coachen
// helheten så den kan resonera om utveckling över tid, inte bara de
// senaste matcherna.
function buildSeasonSummary(games: { date: string; points?: number }[]) {
  if (games.length === 0) return null;
  const pts = games.map(g => g.points || 0);
  const sum = pts.reduce((a, b) => a + b, 0);
  const last5 = pts.slice(-5);
  return {
    games: games.length,
    totalPoints: sum,
    avgPoints: Number((sum / games.length).toFixed(1)),
    bestGame: Math.max(...pts),
    worstGame: Math.min(...pts),
    last5Avg: Number((last5.reduce((a, b) => a + b, 0) / last5.length).toFixed(1)),
    firstGame: games[0].date,
    lastGame: games[games.length - 1].date,
  };
}

// Senast använda lag hör till kontot, inte till enheten: ett annat konto på
// samma telefon ska inte få det förra kontots lag.
const teamKey = (uid?: string) => `lastUsedTeam:${uid ?? 'anon'}`;

// Standardvärdet för multiplikatorn i Money Mode: x2 tills användaren väljer
// något annat. Det senast valda värdet sparas på enheten och blir nästa
// standard.
const BONUS_FACTORS = [0.5, 1, 2, 5, 10, 50, 100];
const BONUS_FACTOR_KEY = 'iceiq-default-bonus-factor';
function readDefaultBonusFactor(): number {
  try {
    const saved = Number(localStorage.getItem(BONUS_FACTOR_KEY));
    return BONUS_FACTORS.includes(saved) ? saved : BONUS_FACTOR_DEFAULT;
  } catch {
    return BONUS_FACTOR_DEFAULT;
  }
}
function saveDefaultBonusFactor(value: number) {
  try {
    localStorage.setItem(BONUS_FACTOR_KEY, String(value));
  } catch { /* privat läge: då gäller valet bara den här sessionen */ }
}

export default function Dashboard() {
  const { user } = useAuth();
  const { t, language } = useLanguage(); 
  const { subscription } = useSubscription(); 
  const { credits: aiCredits } = useAiCredits();
  const location = useLocation();
  // State för UI
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const isPremium = subscription?.plan === 'premium' || subscription?.plan === 'elite';

  // Hooks för data
  const { currentTemplate, currentTemplateId } = useTemplates();
  const { getPlayers, getPlayerHistory, saveGame, updatePlayerBalance, updatePlayerEmail } = usePlayerData();
  
  // State för modaler
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [showPlayerSelect, setShowPlayerSelect] = useState(false);
  const [showSignup, setShowSignup] = useState(location.state?.isSignup || false);
  const [draft] = useState(loadMatchDraft);
  
  // State för spelare och match
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerHistory, setPlayerHistory] = useState<any[]>([]); // Historik för AI
  const [seasonSummary, setSeasonSummary] = useState<ReturnType<typeof buildSeasonSummary>>(null);
  const [seasonGames, setSeasonGames] = useState<{ date: string; points: number; team?: string; template?: string; counts?: Record<string, number> }[]>([]);
  const [selectedPlayerName, setSelectedPlayerName] = useState<string>(draft?.selectedPlayerName || '');
  const [playerEmail, setPlayerEmail] = useState('');
  const [teamName, setTeamName] = useState<string>(localStorage.getItem(teamKey(user?.uid)) || '');
  const [gameDate, setGameDate] = useState<string>(draft?.gameDate || new Date().toISOString().split('T')[0]);
  
  // State för poäng och inställningar
  const [bonusFactor, setBonusFactor] = useState<number>(draft?.bonusFactor ?? readDefaultBonusFactor()); 
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [actionCounts, setActionCounts] = useState<Record<string, number>>(draft?.actionCounts || {});
  const [carriedOverBalance, setCarriedOverBalance] = useState<number>(0); 
  const [isMoneyMode, setIsMoneyMode] = useState<boolean>(draft?.isMoneyMode ?? true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [reportData, setReportData] = useState<{
    playerName: string; team: string; date: string; points: number;
    actions: { label: string; count: number; type?: 'positive' | 'negative' }[];
    highlight?: MatchHighlight | null;
    stats?: MatchReportStats;
    badges?: BadgeId[];
    award?: AwardId | null;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);


  // Vald säsong. null = spelarens senaste säsong med matcher.
  const [selectedSeason, setSelectedSeason] = useState<SeasonKey | null>(null);

  // Tre vyer: Spela in (det man gör vid rinken), Utveckling och Coach. Inmatningen
  // ligger alltid kvar monterad (skärmlås, räknare och fokusval ska överleva ett
  // byte av flik); de andra monteras första gången de öppnas och göms sedan med CSS.
  type DashView = 'match' | 'dev' | 'coach';
  const [view, setView] = useState<DashView>('match');
  const [visited, setVisited] = useState<{ dev: boolean; coach: boolean }>({ dev: false, coach: false });
  const goTo = (next: DashView) => {
    setView(next);
    if (next !== 'match') setVisited((prev) => ({ ...prev, [next]: true }));
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    if (location.state?.isSignup !== undefined) {
      setShowSignup(location.state.isSignup);
    }
    // Från Header/MobileBottomNav: "Players" har ingen egen route, den
    // navigerar hit och öppnar spelarväljaren direkt (se Header.tsx).
    if (location.state?.openPlayerSelect) {
      setShowPlayerSelect(true);
    }
    }, [location.state]); 

  // När en cachad läsning visat det den hade och serverns data sedan skilde sig
  // åt laddas sidan om från den färska cachen (se getDocsCacheFirst).
  useEffect(() => onDataRefreshed(() => setRefreshTrigger((prev) => prev + 1)), []);

  // Flikraden i appen (MobileBottomNav) väljer vy: Hem och Ny match = Spela in,
  // Coach = Coach. Ny match hoppar dessutom ner till knapparna.
  const scrollTarget: string | undefined = location.state?.scrollTo;
  useEffect(() => {
    const target = scrollTarget;
    if (!target) return;
    if (target === 'coach') {
      // Coachen hör till en spelare: utan vald spelare börjar man med att välja en.
      if (!selectedPlayerName) {
        setShowPlayerSelect(true);
        return;
      }
      goTo('coach');
      return;
    }
    goTo('match');
    if (target === 'match') {
      const id = window.setTimeout(() => {
        document.getElementById('section-match')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
      return () => window.clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key, scrollTarget]);

  // --- EFFEKT: Hantera Bonus Factor baserat på läge ---
  // Hoppar över första körningen så en återställd draft-faktor inte skrivs över
  const bonusModeInitialized = useRef(false);
  useEffect(() => {
    if (!bonusModeInitialized.current) {
      bonusModeInitialized.current = true;
      return;
    }
    if (!isMoneyMode) {
      setBonusFactor(1); // Tvinga 1x (1-till-1) i Poäng-läge
    } else {
      setBonusFactor(10); // Återställ till standard (t.ex. 10x) i Penga-läge
    }
  }, [isMoneyMode]);

  // --- EFFEKT: Persistera pågående match ---
  // Tom registrering = ingen draft (täcker även spara/nollställ, som rensar actionCounts)
  useEffect(() => {
    if (isDemoMode) return;
    if (Object.keys(actionCounts).length === 0) {
      localStorage.removeItem(MATCH_DRAFT_KEY);
      return;
    }
    localStorage.setItem(MATCH_DRAFT_KEY, JSON.stringify({
      actionCounts, selectedPlayerName, gameDate, bonusFactor, isMoneyMode,
    }));
  }, [actionCounts, selectedPlayerName, gameDate, bonusFactor, isMoneyMode, isDemoMode]);

  // Berätta att en pågående match återställdes (en gång per mount)
  useEffect(() => {
    if (draft?.actionCounts && Object.keys(draft.actionCounts).length > 0) {
      toast(t('dashboard.draftRestored'), { icon: '💾' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- 1. Ladda Statistik & Spelare & Historik ---
  // --- 1. Ladda Statistik & Spelare & Historik ---
 // --- 1. Ladda Statistik & Spelare & Historik ---
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (!user) return;
      
      try {
        const fetchedPlayers = await getPlayers();
        
        let currentPlayerName = selectedPlayerName;

        if (isMounted) {
          setPlayers(fetchedPlayers as Player[]);
          if (fetchedPlayers.length > 0 && !currentPlayerName) {
            currentPlayerName = fetchedPlayers[0].name;
            setSelectedPlayerName(currentPlayerName);
          }

          // Onboarding: inga spelare än -> visa tydligt märkt exempeldata
          // så att grafer, historik och AI-coachen har något att visa.
          if (fetchedPlayers.length === 0) {
            setIsDemoMode(true);
            setSelectedPlayerName(getDemoPlayerName(language));
            const demoHistory = getDemoHistory(language);
            setPlayerHistory(demoHistory);
            const demoGames = [...demoHistory].reverse().map(g => ({ date: g.date, points: g.points }));
            setSeasonSummary(buildSeasonSummary(demoGames));
            setSeasonGames(demoGames);
            return;
          }
          setIsDemoMode(false);
        }
        
        // Vi hämtar historik och lägger manuellt till "playerName" på varje match
        const gamesPromises = fetchedPlayers.map(async (player) => {
           const matches = await getPlayerHistory(player.name, 50);
           return matches.map(m => ({ ...m, playerName: player.name }));
        });

        const gamesResults = await Promise.all(gamesPromises);
        const allGames = gamesResults.flat();
        console.log("HELA MATCHEN FRÅN DB:", allGames[0]); 
        if (isMounted) {

          // --- FIXEN FÖR AI-HISTORIKEN (Nu bygger vi läsbar data för coachen) ---
          if (currentPlayerName) {
            const playerGames = allGames
              .filter(g => g.playerName === currentPlayerName)
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            setSeasonSummary(buildSeasonSummary(playerGames));
            setSeasonGames(playerGames.map(g => ({ date: g.date, points: g.points || 0, team: g.team, template: g.template, counts: g.counts })));

            const history = allGames
              .filter(g => g.playerName === currentPlayerName) 
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) 
              .slice(0, 3) // Begränsa till 3 matcher
              .map(g => {
                 // Plocka ut det sparade statsobjektet (oftast heter det g.actionCounts i databasen)
                 const rawStats = g.counts || {};  
                 
                 const readableActions: string[] = [];
                 
                 try {
                     Object.entries(rawStats).forEach(([key, count]) => {
                         // Om nyckeln råkar vara stringifierad JSON (som i appen)
                         if (key.includes('{') && key.includes('}')) {
                             const parsedKey = JSON.parse(key);
                             // Vi skickar in det engelska namnet för enklare hantering
                             readableActions.push(`${parsedKey.en}: ${count}`);
                         } else {
                             // Annars skickar vi nyckeln direkt
                             readableActions.push(`${key}: ${count}`);
                         }
                     });
                 } catch (e) {
                     console.error("Kunde inte tolka statistik för AI", e);
                 }

                 return {
                   date: g.date,
                   points: g.points,
                   // Vi skickar iväg den rena sträng-listan. Är den tom, får AI:n veta det.
                   actions: readableActions.length > 0 ? readableActions : ["Ingen detaljerad data sparad"]
                 };
              });

            console.log(`Bantad historik för AI (${currentPlayerName}):`, history); // Kolla konsolen!
            setPlayerHistory(history);
          }
        }
      } catch (error) { 
        console.error("Error fetching data:", error); 
      }
    };

    fetchData();
    
    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, refreshTrigger, getPlayers, getPlayerHistory, selectedPlayerName, language]);
  // --- 2. Saldo Synkning ---

  useEffect(() => {
    const syncPlayerBalance = async () => {
      if (!selectedPlayerName || !user) {
        setCarriedOverBalance(0);
        setPlayerEmail('');
        return;
      }
      try {
        const playerData = await getPlayers();
        const currentPlayer = playerData.find(p => p.name === selectedPlayerName);
        setCarriedOverBalance(currentPlayer?.currentBalance ?? 0);
        setPlayerEmail(currentPlayer?.email ?? '');
      } catch (error) { setCarriedOverBalance(0); }
    };
    syncPlayerBalance();
  }, [selectedPlayerName, user, refreshTrigger, getPlayers]);

  // --- 3. BERÄKNA TOTALER ---
  const totals = useMemo(() => {
    let rawPoints = 0; // Faktiska poäng (t.ex. 1 mål = 1 poäng)

    if (currentTemplate && currentTemplate.actions) {
      Object.entries(actionCounts).forEach(([key, count]) => {
        try {
          const keyObj = JSON.parse(key);
          const action = currentTemplate.actions.find(a => a.name.en === keyObj.en);
          
          if (action) {
            const pointsPerAction = action.points || 1;
            rawPoints += count * pointsPerAction;
          }
        } catch (e) {
          // Fallback om något går fel med nyckeln
          rawPoints += count * 1; 
        }
      });
    }

    // Nu räknar vi ut bonusen/värdet
    // Om vi är i Money Mode: Total = Poäng * Faktor (t.ex. 5 poäng * 10 kr = 50 kr)
    // Bonusen är mellanskillnaden (45 kr) så att: Bas (5) + Bonus (45) = Totalt (50)
    
    let total = 0;
    let bonusDisplay = 0;

    if (isMoneyMode) {
        total = rawPoints * bonusFactor; 
        bonusDisplay = total - rawPoints; // Visar hur mycket EXTRA faktorn gav
    } else {
        // I Poäng-läge är totalen bara poängen
        total = rawPoints;
        bonusDisplay = 0; 
    }

    // Lägg till gammalt saldo till totalen för "Total Balance"
    const grandTotal = total + carriedOverBalance;

    return {
      actionsPoints: rawPoints,     // Visas i "Base Pts"
      bonusPoints: bonusDisplay,    // Visas i "Bonus"
      matchTotal: total,            // Vad just denna matchen blev värd
      total: grandTotal             // Totalt saldo (Gammalt + Matchen)
    };
  }, [actionCounts, currentTemplate, bonusFactor, carriedOverBalance, isMoneyMode]); 
  
  // --- MÄTPUNKTER I FÖRSTA ANVÄNDNINGEN (utils/funnel.ts) ---
  useEffect(() => {
    if (user) void trackFunnel(user.uid, 'dashboardViewed');
  }, [user]);

  // Spåras vid själva tryckningen, inte på ändrade antal: ett utkast som
  // återställs från förra sessionen ska inte räknas som en ny tryckning.
  const handleActionCountChange = (counts: Record<string, number>) => {
    setActionCounts(counts);
    if (user) void trackFunnel(user.uid, isDemoMode ? 'demoActionTapped' : 'actionTapped');
  };

  const openPlayerSelect = () => {
    if (user) void trackFunnel(user.uid, 'addPlayerOpened');
    setShowPlayerSelect(true);
  };

  // --- SPARA MATCH ---
  // --- SPARA MATCH & UPPDATERA SALDO ---
  const handleSaveGame = async () => {
    if (isSaving) return;
    if (isDemoMode) {
      if (user) void trackFunnel(user.uid, 'demoSaveBlocked');
      toast(t('demo.saveBlocked'), { icon: '👋' });
      setShowPlayerSelect(true);
      return;
    }
    if (user) void trackFunnel(user.uid, 'saveTapped');
    if (!selectedPlayerName) {
      toast.error(t('selectPlayerFirst'));
      return;
    }
    if (Object.keys(actionCounts).length === 0) {
      toast.error(t('dashboard.noStatsYet'));
      return;
    }

    setIsSaving(true);

    try {
      // 1. Spara själva matchen i historiken
      await saveGame(
        selectedPlayerName,
        { 
            date: gameDate, 
            team: teamName || 'My Team', 
            points: totals.actionsPoints, // Vi sparar vad MATCHEN var värd (inte totala saldot)
            earned: totals.matchTotal
        },
        currentTemplateId,
        actionCounts,
        bonusFactor
      );

      // 2. VIKTIGT: Uppdatera spelarens saldo (Plånbok)
      // Vi tar det gamla saldot + vad denna matchen drog in
      // Saldot läses färskt från servern här: det visade värdet kan komma ur
      // cachen, och ett gammalt saldo som grund för en skrivning ger fel summa.
      let baseBalance = carriedOverBalance;
      try {
        const fresh = (await firestoreService.getPlayers(user!.uid)).find((p: any) => p.name === selectedPlayerName);
        if (fresh && typeof fresh.currentBalance === 'number') baseBalance = fresh.currentBalance;
      } catch { /* offline: använd det visade värdet */ }
      const newBalance = baseBalance + totals.matchTotal;
      
      await updatePlayerBalance(selectedPlayerName, newBalance);
      
      // Uppdatera statet direkt så det syns
      setCarriedOverBalance(newBalance);

      if (teamName) localStorage.setItem(teamKey(user?.uid), teamName);
      if (user) void trackFunnel(user.uid, 'gameSaved');

      // Bygg underlaget till den delbara matchrapporten INNAN formuläret rensas
      const reportActions = Object.entries(actionCounts)
        .map(([key, count]) => {
          try {
            const keyObj = JSON.parse(key);
            const action = currentTemplate?.actions.find(a => a.name.en === keyObj.en);
            return {
              label: keyObj[language] || keyObj.en,
              count,
              type: action?.type ?? ('positive' as const),
            };
          } catch {
            return { label: key, count, type: 'positive' as const };
          }
        })
        .sort((a, b) => b.count - a.count);

      // seasonGames laddas om först via refreshTrigger längre ner och
      // innehåller alltså fortfarande bara matcherna FÖRE den här — vilket
      // är precis vad höjdpunkten ska jämföra mot.
      const highlight = pickMatchHighlight({
        points: totals.actionsPoints,
        previousGames: seasonGames,
        actions: reportActions,
      });

      // Säsongen till och med den här matchen. Den sparade matchen räknas
      // med — bilden ska visa läget som det är när den delas, inte som det
      // var före matchen.
      const seasonPoints = [...seasonGames.map(g => g.points || 0), totals.actionsPoints];
      const seasonStats: MatchReportStats | undefined = seasonPoints.length >= 2
        ? {
            games: seasonPoints.length,
            avgPoints: Number((seasonPoints.reduce((a, b) => a + b, 0) / seasonPoints.length).toFixed(1)),
            bestGame: Math.max(...seasonPoints),
          }
        // Första matchen: "1 match, snitt = poängen, bästa = poängen" säger
        // ingenting. Kortet visar höjdpunkten i stället.
        : undefined;

      // Utmärkelsen matchen gav. Nycklarna i sparade matcher är de ENGELSKA
      // aktionsnamnen, så vi bygger samma form här (se usePlayerData.saveGame).
      const countsEn: Record<string, number> = {};
      Object.entries(actionCounts).forEach(([key, count]) => {
        try {
          const keyObj = JSON.parse(key);
          countsEn[keyObj.en || keyObj.sv] = count;
        } catch {
          countsEn[key] = count;
        }
      });
      const templateNames = {
        negative: new Set((currentTemplate?.actions ?? []).filter(a => a.type === 'negative').map(a => a.name.en)),
        positive: new Set((currentTemplate?.actions ?? []).filter(a => a.type !== 'negative').map(a => a.name.en)),
      };
      const award = isPosition(currentTemplateId) ? topAward(currentTemplateId, countsEn, templateNames) : null;

      setReportData({
        playerName: selectedPlayerName,
        team: teamName,
        date: gameDate,
        points: totals.actionsPoints,
        actions: reportActions.map(({ label, count, type }) => ({ label, count, type })),
        highlight,
        stats: seasonStats,
        badges: newBadges(seasonGames.map(g => g.points || 0), totals.actionsPoints),
        award,
      });

      // Rensa formuläret (men behåll saldot som nu är uppdaterat)
      setActionCounts({});
      setRefreshTrigger(prev => prev + 1); 
      
      toast.success(t('gameSavedSuccessfully'));

    } catch (error) { 
      console.error("Save error:", error);
      toast.error(t('saveError')); 
    } finally {
      setTimeout(() => setIsSaving(false), 500);
    }
  };
  // --- REGLERA SALDO ---
  const handleSettleBalance = async () => {
    if (!selectedPlayerName) return;
    if (window.confirm(t('dashboard.settleConfirm', { name: selectedPlayerName }))) {
      try {
        await updatePlayerBalance(selectedPlayerName, 0); 
        setCarriedOverBalance(0);
        setRefreshTrigger(prev => prev + 1);
        toast.success(t('dashboard.balanceSettled'));
      } catch { toast.error(t('dashboard.settleError')); }
    }
  };

  // --- AI DATA PREPARATION ---
  // Vi bygger om rådatan så att AI:n förstår exakt vad som var positivt och negativt
  const enrichedStats = Object.entries(actionCounts).map(([key, count]) => {
    try {
      const keyObj = JSON.parse(key);
      const actionDef = currentTemplate?.actions.find(a => a.name.en === keyObj.en);
      
      const baseValue = actionDef?.points || 0;
      // Om bonus är aktivt, räkna med det i impact-värdet
      const isBonusActive = isMoneyMode && actionDef?.isBonus;
      const totalImpact = count * (isBonusActive ? baseValue * bonusFactor : baseValue);
      
      return {
        action: keyObj[language] || keyObj.en, // Skicka handlingens namn på rätt språk
        count: count,
        points_impact: totalImpact // Positiv siffra = bra, Negativ siffra = dåligt!
      };
    } catch {
      return { action: "Okänd", count, points_impact: 0 };
    }
  });

  const currentSessionStats = {
    player: selectedPlayerName,
    team: teamName,
    date: gameDate,
    stats: enrichedStats, // <-- Nu skickar vi vår nya, smarta lista!
    totals: totals, 
    season: seasonSummary, // Aggregat över alla matcher (utveckling över tid)
    templateName: currentTemplate?.name
  };

  // --- LOGIN CHECK ---
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          {showSignup ? <SignupForm onSwitchToLogin={() => setShowSignup(false)} /> : <LoginForm onSwitchToSignup={() => setShowSignup(true)} />}
        </Card>
      </div>
    );
  }

  const hasUnsavedActions = Object.keys(actionCounts).length > 0;
  // Säsonger som finns för vald spelare. Korten, grafen och jämförelsen
  // följer spelaren och vald säsong; "Totalt" visar allt.
  const seasonKeys = seasonsIn(seasonGames);
  const effSeason: SeasonKey =
    selectedSeason === 'all' || (selectedSeason !== null && seasonKeys.includes(selectedSeason))
      ? selectedSeason
      : (seasonKeys[0] ?? 'all');
  const playerPeriodGames = inSeason(seasonGames, effSeason);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const periodStats = {
    matches: playerPeriodGames.length,
    avgPoints: avgOf(playerPeriodGames),
    best: playerPeriodGames.length > 0 ? Math.max(...playerPeriodGames.map(g => g.points || 0)) : 0,
    thisWeek: playerPeriodGames.filter(g => new Date(g.date) >= weekAgo).length,
  };
  const playerPeriodSummary = buildSeasonSummary(playerPeriodGames);
  const seasonTeams = Array.from(new Set(
    playerPeriodGames.map(g => (g.team || '').trim()).filter(Boolean),
  )).slice(0, 3);
  const headerSubtitle = [
    effSeason === 'all' ? t('seasonView.allSeasons') : `${t('dashboard.season')} ${seasonLabel(effSeason)}`,
    ...seasonTeams,
  ].join(' · ');

  // --- RENDER DASHBOARD ---
  return (
    <div className={`min-h-screen md:pb-8 ${hasUnsavedActions ? 'pb-44' : 'pb-20'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header: spelare + säsong + lag. Ingen hälsningsfras. Samma spelare
            kan byta klubb eller spela i flera lag (J18/J20), så lagen listas
            ur matcherna i stället för att vara ett fast fält. */}
        {selectedPlayerName && (
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white truncate">
              {selectedPlayerName}
            </h1>
            <p className="text-gray-400 text-sm mt-1 truncate">{headerSubtitle}</p>
          </div>
        )}

        {/* Flikar: Spela in / Utveckling / Coach */}
        <div className="flex gap-1 p-1 mb-6 rounded-xl bg-gray-800/70 border border-gray-700" role="tablist">
          {([
            ['match', t('dashboard.tabMatch')],
            ['dev', t('dashboard.tabDev')],
            ['coach', t('dashboard.tabCoach')],
          ] as [DashView, string][]).map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={view === key}
              onClick={() => (key === 'coach' && !selectedPlayerName ? openPlayerSelect() : goTo(key))}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors touch-manipulation ${
                view === key ? 'bg-cyan-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Onboarding-banner för exempeldata */}
        {isDemoMode && (
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-4">
            <div>
              <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-cyan-500 text-black px-2 py-0.5 rounded mb-1.5">
                {t('demo.badge')}
              </span>
              <p className="text-gray-200 text-sm">{t('demo.banner')}</p>
            </div>
            <button
              onClick={openPlayerSelect}
              className="shrink-0 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-cyan-600/20"
            >
              {t('demo.cta')}
            </button>
          </div>
        )}

        <div className={view === 'match' ? '' : 'hidden'}>
          <div className="flex justify-end items-center mb-6 gap-3">
          <button 
            onClick={() => setIsMoneyMode(!isMoneyMode)}
            className={`flex items-center px-4 py-2 rounded-full border transition-all ${
              isMoneyMode ? 'border-yellow-500/50 text-yellow-500 bg-yellow-500/10' : 'border-cyan-500/50 text-cyan-500 bg-cyan-500/10'
            }`}
          >
            {isMoneyMode ? <Banknote size={18} className="mr-2"/> : <Trophy size={18} className="mr-2"/>}
            <span className="text-xs font-bold uppercase tracking-wider">
              {isMoneyMode ? t('dashboard.moneyMode') : t('dashboard.pointsMode')}
            </span>
          </button>
          </div>

        <div className="space-y-6">
          {/* Player Configuration */}
          <PlayerForm
            selectedPlayerName={selectedPlayerName}
            onPlayerNameChange={setSelectedPlayerName} 
            teamName={teamName}
            onTeamNameChange={setTeamName}
            gameDate={gameDate}
            onGameDateChange={setGameDate}
            onOpenPlayerSelect={openPlayerSelect}
            onShowHistory={() => setShowHistoryModal(true)}
            onEditTemplate={() => setShowTemplateEditor(true)}
            playerEmail={playerEmail}
            onPlayerEmailChange={setPlayerEmail}
            onPlayerEmailBlur={(email) => selectedPlayerName && updatePlayerEmail(selectedPlayerName, email)}
          />
          
          {/* The Stats Grid (Buttons) */}
          <div id="section-match" className="scroll-mt-16">
            <ActionGrid actionCounts={actionCounts} onCountChange={handleActionCountChange} />
          </div>
          
          {/* Bonus Weighting - VISAS BARA I MONEY MODE */}
          {isMoneyMode && (
            <Card className="flex items-center justify-between p-4 border-cyan-500/20 bg-cyan-500/5 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center">
                <Zap className="text-yellow-400 mr-3" size={24} />
                <div>
                  <p className="text-sm font-bold text-white">{t('dashboard.bonusWeighting')}</p>
                  <p className="text-xs text-gray-400">{t('dashboard.bonusWeightingDesc')}</p>
                </div>
              </div>
              <select 
                value={bonusFactor}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setBonusFactor(value);
                  saveDefaultBonusFactor(value);
                }}
                className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-cyan-400 font-bold outline-none"
              >
                {BONUS_FACTORS.map(v => <option key={v} value={v}>{v}x</option>)}
              </select>
            </Card>
          )}

          
          {/* Summary & Controls */}
          <SummarySection
            actionCounts={actionCounts}
            onSaveGame={handleSaveGame}
            onReset={() => window.confirm(t('resetAllWarning')) && setActionCounts({})}
            isMoneyMode={isMoneyMode} 
            onSettleBalance={handleSettleBalance}
            playerName={selectedPlayerName}
            totalPoints={totals.actionsPoints}
            totalBonus={totals.bonusPoints}
            totalFinal={totals.total}
            carriedOverBalance={carriedOverBalance}
            onBalanceChange={setCarriedOverBalance}
            bonusFactor={bonusFactor}
            isSaving={isSaving} // Skickar med lås-status
          />
          </div>
        </div>

        {visited.dev && (
          <div className={view === 'dev' ? '' : 'hidden'}>
        {/* Säsongsval: syns när det finns matcher från fler än en säsong */}
        {seasonKeys.length >= 2 && !isDemoMode && (
          <div className="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-1 px-1">
            {([...seasonKeys, 'all'] as SeasonKey[]).map(k => (
              <button
                key={String(k)}
                onClick={() => setSelectedSeason(k)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                  effSeason === k
                    ? 'bg-cyan-500/15 border-cyan-500/60 text-cyan-300'
                    : 'border-gray-700 text-gray-400 hover:text-gray-200'
                }`}
              >
                {k === 'all' ? t('seasonView.allSeasons') : seasonLabel(k)}
              </button>
            ))}
          </div>
        )}

        {/* Toppkort: följer vald spelare och säsong */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center p-4">
            <BarChart3 className="text-green-400 mx-auto mb-2" size={20} />
            <p className="text-2xl font-bold text-white">{isDemoMode ? 0 : periodStats.matches}</p>
            <p className="text-xs text-gray-400">{t('matches')}</p>
          </Card>
          <Card className="text-center p-4">
            <Target className="text-yellow-400 mx-auto mb-2" size={20} />
            <p className="text-2xl font-bold text-white">{isDemoMode || periodStats.matches === 0 ? '–' : periodStats.avgPoints}</p>
            <p className="text-xs text-gray-400">{t('avgPoints')}</p>
          </Card>
          <Card className="text-center p-4">
            <Trophy className="text-cyan-400 mx-auto mb-2" size={20} />
            <p className="text-2xl font-bold text-white">{isDemoMode || periodStats.matches === 0 ? '–' : periodStats.best}</p>
            <p className="text-xs text-gray-400">{t('bestGame')}</p>
          </Card>
          <Card className="text-center p-4">
            <TrendingUp className="text-red-400 mx-auto mb-2" size={20} />
            <p className="text-2xl font-bold text-white">{isDemoMode ? 0 : periodStats.thisWeek}</p>
            <p className="text-xs text-gray-400">{t('dashboard.thisWeek')}</p>
          </Card>
        </div>

            <div className="space-y-6">
          {/* UTVECKLING ÖVER SÄSONGEN */}
          {selectedPlayerName && (
            <SeasonOverview
              playerName={selectedPlayerName}
              games={playerPeriodGames}
              allGames={seasonGames}
              summary={playerPeriodSummary}
              templateId={currentTemplateId}
            />
          )}

          {/* JÄMFÖR SÄSONGER */}
          {selectedPlayerName && !isDemoMode && (
            <SeasonCompare games={seasonGames} selected={effSeason} onSelect={setSelectedSeason} />
          )}

              {selectedPlayerName && (
                <button
                  onClick={() => setShowHistoryModal(true)}
                  className="w-full py-3 rounded-xl border border-gray-600 bg-gray-800/60 text-gray-200 text-sm font-semibold touch-manipulation hover:border-gray-500 transition-colors"
                >
                  {t('showPlayerHistory') || 'History'}
                </button>
              )}
            </div>
          </div>
        )}

        {visited.coach && (
          <div className={view === 'coach' ? '' : 'hidden'}>
            <div className="flex justify-between items-center mb-6 gap-3 flex-wrap">
          {/* Synlig innan chatten öppnas, så krediterna aldrig överraskar */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-primary-500/30 bg-primary-500/10">
            <Sparkles size={14} className="text-yellow-400" />
            <span className="text-xs font-bold text-primary-200 uppercase tracking-wider">
              {aiCredits} {t('ai.credits')}
            </span>
          </div>
            </div>
            <div className="space-y-6">
          {/* AI COACH INTEGRATION */}
          {selectedPlayerName && (
            <div id="section-coach" className="scroll-mt-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <AiCoach
                 playerStats={{
                    ...currentSessionStats,
                    history: playerHistory // Skickar med historiken för bättre analys
                 }}
                 playerEmail={playerEmail}
                 onUpgrade={() => setShowSubscriptionModal(true)}
                 isDemo={isDemoMode}
               />
            </div>
          )}
          {!selectedPlayerName && (
            <Card className="text-center py-10">
              <p className="text-gray-300 mb-4">{t('dashboard.coachNeedsPlayer')}</p>
              <button
                onClick={openPlayerSelect}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-6 py-3 rounded-xl"
              >
                {t('dashboard.pickPlayer')}
              </button>
            </Card>
          )}
            </div>
          </div>
        )}

      </div>

      {/* Sticky spara-rad på mobil: syns så fort något registrerats, så man
          aldrig behöver scrolla för att spara vid rinken. 72px lyfter den
          ovanför MobileBottomNav. */}
      {hasUnsavedActions && (
        <div className="md:hidden fixed inset-x-0 bottom-[72px] z-40 px-3 pb-2 animate-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-cyan-500/40 bg-gray-900/95 backdrop-blur-md p-3 shadow-2xl">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 leading-none mb-1">
                {t('totalPointsMatch')}
              </p>
              <p className="text-xl font-black text-white leading-none truncate">
                {totals.matchTotal}{isMoneyMode ? ` ${moneyModeUnit(language)}` : ' p'}
              </p>
            </div>
            <button
              onClick={handleSaveGame}
              disabled={isSaving}
              className="shrink-0 flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white font-bold px-5 py-3 rounded-xl transition-colors touch-manipulation"
            >
              <Save size={18} />
              {t('dashboard.saveShort')}
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <PlayerHistoryModal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} players={players} />
      <TemplateEditorModal isOpen={showTemplateEditor} onClose={() => setShowTemplateEditor(false)} />
      <PlayerSelectModal 
        isOpen={showPlayerSelect} 
        onClose={() => setShowPlayerSelect(false)} 
        onSelectPlayer={setSelectedPlayerName} 
        onAddNewPlayer={async (newName) => { 
          // 1. Skapa spelaren i databasen DIREKT med 0 i saldo
          try {
            await updatePlayerBalance(newName, 0); 
            // 2. Välj spelaren i rutan
            setSelectedPlayerName(newName); 
            // 3. Tvinga dashboarden att ladda om spelarlistan
            setRefreshTrigger(prev => prev + 1); 
            // 4. Stäng modalen
            setShowPlayerSelect(false);
            toast.success(t('dashboard.playerAdded', { name: newName }));
          } catch (error) {
            toast.error(t('dashboard.playerAddError'));
          }
        }} 
        isPremium={isPremium} 
      />
      <SubscriptionModal 
        isOpen={showSubscriptionModal} 
        onClose={() => setShowSubscriptionModal(false)} 
      />
      <ShareReportModal
        isOpen={reportData !== null}
        onClose={() => setReportData(null)}
        data={reportData}
      />
    </div>
  );
}
