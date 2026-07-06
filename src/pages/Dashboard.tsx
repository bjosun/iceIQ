import React, { useState, useEffect, useMemo } from 'react';
import { usePlayerData } from '../hooks/usePlayerData';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTemplates } from '../contexts/TemplateContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useAiCredits } from '../hooks/useAiCredits';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
// Komponenter
import SubscriptionModal from '../components/modals/SubscriptionModal';
import PlayerForm from '../components/dashboard/PlayerForm';
import ActionGrid from '../components/dashboard/ActionGrid';
import SummarySection from '../components/dashboard/SummarySection';
import AiCoach from '../components/ai/AiCoach'; 
import PlayerHistoryModal from '../components/modals/PlayerHistoryModal';
import TemplateEditorModal from '../components/modals/TemplateEditorModal';
import PlayerSelectModal from '../components/modals/PlayerSelectModal';
import Card from '../components/ui/Card';
import LoginForm from '../components/auth/LoginForm';
import SignupForm from '../components/auth/SignupForm';

// Ikoner
import { 
  BarChart3, 
  Users, 
  Target, 
  TrendingUp, 
  Zap, 
  Banknote, 
  Trophy,
  Sparkles
} from 'lucide-react';

interface Player {
  id: string;
  name: string;
  currentBalance?: number;
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
  const { getPlayers, getPlayerHistory, saveGame, updatePlayerBalance } = usePlayerData();
  
  // State för modaler
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [showPlayerSelect, setShowPlayerSelect] = useState(false);
  const [showSignup, setShowSignup] = useState(location.state?.isSignup || false);
  
  // State för spelare och match
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerHistory, setPlayerHistory] = useState<any[]>([]); // Historik för AI
  const [selectedPlayerName, setSelectedPlayerName] = useState<string>('');
  const [playerEmail, setPlayerEmail] = useState('');
  const [teamName, setTeamName] = useState<string>(localStorage.getItem('lastUsedTeam') || '');
  const [gameDate, setGameDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // State för poäng och inställningar
  const [bonusFactor, setBonusFactor] = useState<number>(10); 
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [actionCounts, setActionCounts] = useState<Record<string, number>>({});
  const [carriedOverBalance, setCarriedOverBalance] = useState<number>(0); 
  const [isMoneyMode, setIsMoneyMode] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);


  // State för dashboard-statistik
  const [stats, setStats] = useState({
    players: 0,
    matches: 0,
    avgPoints: 0,
    thisWeek: 0
  });

  useEffect(() => {
    if (location.state?.isSignup !== undefined) {
      setShowSignup(location.state.isSignup);
    }
    }, [location.state]); 

  // --- EFFEKT: Hantera Bonus Factor baserat på läge ---
  useEffect(() => {
    if (!isMoneyMode) {
      setBonusFactor(1); // Tvinga 1x (1-till-1) i Poäng-läge
    } else {
      setBonusFactor(10); // Återställ till standard (t.ex. 10x) i Penga-läge
    }
  }, [isMoneyMode]);

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
        }
        
        // Vi hämtar historik och lägger manuellt till "playerName" på varje match
        const gamesPromises = fetchedPlayers.map(async (player) => {
           const matches = await getPlayerHistory(player.name, 50);
           return matches.map(m => ({ ...m, playerName: player.name }));
        });

        const gamesResults = await Promise.all(gamesPromises);
        const allGames = gamesResults.flat();
        console.log("HELA MATCHEN FRÅN DB:", allGames[0]); 
        // Räkna ut snitt (Dashboard Stats)
        const avgPoints = allGames.length > 0 
          ? (allGames.reduce((sum, g) => sum + (g.points || 0), 0) / allGames.length).toFixed(1) 
          : 0;
          
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        if (isMounted) {
          setStats({
            players: fetchedPlayers.length,
            matches: allGames.length,
            avgPoints: Number(avgPoints),
            thisWeek: allGames.filter(g => new Date(g.date) >= oneWeekAgo).length
          });

          // --- FIXEN FÖR AI-HISTORIKEN (Nu bygger vi läsbar data för coachen) ---
          if (currentPlayerName) {
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
  }, [user, refreshTrigger, getPlayers, getPlayerHistory, selectedPlayerName]);
  // --- 2. Saldo Synkning ---

  useEffect(() => {
    const syncPlayerBalance = async () => {
      if (!selectedPlayerName || !user) {
        setCarriedOverBalance(0);
        return;
      }
      try {
        const playerData = await getPlayers(); 
        const currentPlayer = playerData.find(p => p.name === selectedPlayerName);
        setCarriedOverBalance(currentPlayer?.currentBalance ?? 0);
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
  
  // --- SPARA MATCH ---
  // --- SPARA MATCH & UPPDATERA SALDO ---
  const handleSaveGame = async () => {
    if (isSaving) return;
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
      const newBalance = carriedOverBalance + totals.matchTotal;
      
      await updatePlayerBalance(selectedPlayerName, newBalance);
      
      // Uppdatera statet direkt så det syns
      setCarriedOverBalance(newBalance);

      if (teamName) localStorage.setItem('lastUsedTeam', teamName);

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
    templateName: currentTemplate?.name
  };

  // --- LOGIN CHECK ---
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          {showSignup ? <SignupForm onSwitchToLogin={() => setShowSignup(false)} /> : <LoginForm onSwitchToSignup={() => setShowSignup(true)} onForgotPassword={() => {}} />}
        </Card>
      </div>
    );
  }

  // --- RENDER DASHBOARD ---
  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            {t('dashboard.welcome')} {user.displayName || user.email?.split('@')[0]}
          </h1>
          <p className="text-gray-400 text-sm mt-1">{t('dashboardSubtitle')}</p>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center p-4">
            <Users className="text-cyan-400 mx-auto mb-2" size={20} />
            <p className="text-2xl font-bold text-white">{stats.players}</p>
            <p className="text-xs text-gray-400">{t('players')}</p>
          </Card>
          <Card className="text-center p-4">
            <BarChart3 className="text-green-400 mx-auto mb-2" size={20} />
            <p className="text-2xl font-bold text-white">{stats.matches}</p>
            <p className="text-xs text-gray-400">{t('matches')}</p>
          </Card>
          <Card className="text-center p-4">
            <Target className="text-yellow-400 mx-auto mb-2" size={20} />
            <p className="text-2xl font-bold text-white">{stats.avgPoints}</p>
            <p className="text-xs text-gray-400">{t('avgPoints')}</p>
          </Card>
          <Card className="text-center p-4">
            <TrendingUp className="text-red-400 mx-auto mb-2" size={20} />
            <p className="text-2xl font-bold text-white">{stats.thisWeek}</p>
            <p className="text-xs text-gray-400">{t('dashboard.thisWeek')}</p>
          </Card>
        </div>

        {/* AI-krediter + Mode Toggle (Money vs Points) */}
        <div className="flex justify-between items-center mb-6 gap-3 flex-wrap">
          {/* Synlig innan chatten öppnas, så krediterna aldrig överraskar */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/40 bg-indigo-500/10">
            <Sparkles size={14} className="text-yellow-400" />
            <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">
              {aiCredits} {t('ai.credits')}
            </span>
          </div>
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
            onOpenPlayerSelect={() => setShowPlayerSelect(true)}
            onShowHistory={() => setShowHistoryModal(true)}
            onEditTemplate={() => setShowTemplateEditor(true)}
            playerEmail={playerEmail}
            onPlayerEmailChange={setPlayerEmail}
          />
          
          {/* The Stats Grid (Buttons) */}
          <ActionGrid actionCounts={actionCounts} onCountChange={setActionCounts} />
          
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
                onChange={(e) => setBonusFactor(Number(e.target.value))}
                className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-cyan-400 font-bold outline-none"
              >
                {[0.5, 1, 2, 5, 10, 50, 100].map(v => <option key={v} value={v}>{v}x</option>)}
              </select>
            </Card>
          )}

          {/* AI COACH INTEGRATION */}
          {selectedPlayerName && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <AiCoach 
                 playerStats={{
                    ...currentSessionStats,
                    history: playerHistory // Skickar med historiken för bättre analys
                 }} 
                 onUpgrade={() => setShowSubscriptionModal(true)}
               />
            </div>
          )}
          
          {/* Summary & Controls */}
          <SummarySection
            actionCounts={actionCounts}
            onSaveGame={handleSaveGame}
            onReset={() => window.confirm(t('resetAllWarning')) && setActionCounts({})}
            isMoneyMode={isMoneyMode} 
            onSettleBalance={handleSettleBalance}
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
    </div>
  );
}