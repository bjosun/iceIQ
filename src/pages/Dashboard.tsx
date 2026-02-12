import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePlayerData } from '../hooks/usePlayerData';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTemplates } from '../contexts/TemplateContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import toast from 'react-hot-toast';

// Komponenter
import PlayerForm from '../components/dashboard/PlayerForm';
import ActionGrid from '../components/dashboard/ActionGrid';
import SummarySection from '../components/dashboard/SummarySection';
import PlayerHistoryModal from '../components/modals/PlayerHistoryModal';
import TemplateEditorModal from '../components/modals/TemplateEditorModal';
import PlayerSelectModal from '../components/modals/PlayerSelectModal';
import MobileBottomNav from '../components/layout/MobileBottomNav';
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
  Trophy 
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
  const [searchParams] = useSearchParams();

  const isPremium = subscription?.plan === 'premium';

  const { currentTemplate, currentTemplateId } = useTemplates();
  const { getPlayers, getPlayerHistory, saveGame, updatePlayerBalance } = usePlayerData();

  // State för modaler
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [showPlayerSelect, setShowPlayerSelect] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  
  // State för data
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerName, setSelectedPlayerName] = useState<string>('');
  
  // --- FIX: Lagt till playerEmail state ---
  const [playerEmail, setPlayerEmail] = useState('');
  
  const [teamName, setTeamName] = useState<string>(localStorage.getItem('lastUsedTeam') || '');
  const [gameDate, setGameDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [bonusFactor, setBonusFactor] = useState<number>(10); 
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [actionCounts, setActionCounts] = useState<Record<string, number>>({});
  const [carriedOverBalance, setCarriedOverBalance] = useState<number>(0); 
  const [isMoneyMode, setIsMoneyMode] = useState<boolean>(true);

  const [stats, setStats] = useState({
    players: 0,
    matches: 0,
    avgPoints: 0,
    thisWeek: 0
  });

  // --- 1. Ladda Statistik & Spelare ---
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!user) return;
      try {
        const fetchedPlayers = await getPlayers();
        if (isMounted) {
          setPlayers(fetchedPlayers as Player[]);
          if (fetchedPlayers.length > 0 && !selectedPlayerName) {
            setSelectedPlayerName(fetchedPlayers[0].name);
          }
        }
        
        const gamesPromises = fetchedPlayers.map(player => getPlayerHistory(player.name, 1000));
        const gamesResults = await Promise.all(gamesPromises);
        const allGames = gamesResults.flat();
        
        const avgPoints = allGames.length > 0 ? (allGames.reduce((sum, g) => sum + (g.points || 0), 0) / allGames.length).toFixed(1) : 0;
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        if (isMounted) {
          setStats({
            players: fetchedPlayers.length,
            matches: allGames.length,
            avgPoints: Number(avgPoints),
            thisWeek: allGames.filter(g => new Date(g.date) >= oneWeekAgo).length
          });
        }
      } catch (error) { console.error(error); }
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

  const totals = (() => {
    let actionsPoints = 0;
    let bonusPoints = 0;
    if (currentTemplate) {
      Object.entries(actionCounts).forEach(([key, count]) => {
        try {
          const keyObj = JSON.parse(key);
          const action = currentTemplate.actions.find(a => a.name.en === keyObj.en);
          if (action) {
            if (action.isBonus) bonusPoints += count * action.points * bonusFactor;
            else actionsPoints += count * action.points;
          }
        } catch (e) { actionsPoints += count * 1; }
      });
    }
    return {
      actionsPoints,
      bonusPoints: Math.round(bonusPoints),
      total: Math.round(actionsPoints + bonusPoints + carriedOverBalance)
    };
  })();

  const handleSaveGame = async () => {
    if (!selectedPlayerName) {
      toast.error(t('selectPlayerFirst') || "Please select a player first");
      return;
    }
    try {
      await saveGame(
        selectedPlayerName,
        { date: gameDate, team: teamName || 'My Team', points: totals.total },
        currentTemplateId,
        actionCounts,
        bonusFactor
      );
      if (teamName) localStorage.setItem('lastUsedTeam', teamName);
      setActionCounts({});
      setRefreshTrigger(prev => prev + 1); 
      toast.success(t('gameSavedSuccessfully') || 'Saved!');
    } catch (error) { toast.error(t('saveError') || "Error."); }
  };

  const handleSettleBalance = async () => {
    if (!selectedPlayerName) return;
    if (window.confirm(language === 'en' ? `Settle balance for ${selectedPlayerName}?` : `Reglera saldo för ${selectedPlayerName}?`)) {
      try {
        await updatePlayerBalance(selectedPlayerName, 0); 
        setCarriedOverBalance(0);
        setRefreshTrigger(prev => prev + 1);
        toast.success("Saldot reglerat!");
      } catch (e) { toast.error("Kunde inte reglera."); }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          {showSignup ? <SignupForm onSwitchToLogin={() => setShowSignup(false)} /> : <LoginForm onSwitchToSignup={() => setShowSignup(true)} onForgotPassword={() => {}} />}
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            {language === 'sv' ? 'Välkommen tillbaka,' : 'Welcome back,'} {user.displayName || user.email?.split('@')[0]}
          </h1>
          <p className="text-gray-400 text-sm mt-1">{t('dashboardSubtitle') || 'Track your scouting progress'}</p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center p-4">
            <Users className="text-cyan-400 mx-auto mb-2" size={20} />
            <p className="text-2xl font-bold text-white">{stats.players}</p>
            <p className="text-xs text-gray-400">Players</p>
          </Card>
          <Card className="text-center p-4">
            <BarChart3 className="text-green-400 mx-auto mb-2" size={20} />
            <p className="text-2xl font-bold text-white">{stats.matches}</p>
            <p className="text-xs text-gray-400">Matches</p>
          </Card>
          <Card className="text-center p-4">
            <Target className="text-yellow-400 mx-auto mb-2" size={20} />
            <p className="text-2xl font-bold text-white">{stats.avgPoints}</p>
            <p className="text-xs text-gray-400">Avg Points</p>
          </Card>
          <Card className="text-center p-4">
            <TrendingUp className="text-red-400 mx-auto mb-2" size={20} />
            <p className="text-2xl font-bold text-white">{stats.thisWeek}</p>
            <p className="text-xs text-gray-400">This Week</p>
          </Card>
        </div>

        <div className="flex justify-end mb-6">
          <button 
            onClick={() => setIsMoneyMode(!isMoneyMode)}
            className={`flex items-center px-4 py-2 rounded-full border transition-all ${
              isMoneyMode ? 'border-yellow-500/50 text-yellow-500 bg-yellow-500/10' : 'border-cyan-500/50 text-cyan-500 bg-cyan-500/10'
            }`}
          >
            {isMoneyMode ? <Banknote size={18} className="mr-2"/> : <Trophy size={18} className="mr-2"/>}
            <span className="text-xs font-bold uppercase tracking-wider">
              {isMoneyMode ? 'Money Mode' : 'Points Mode'}
            </span>
          </button>
        </div>

        <div className="space-y-6">
          {/* --- FIX: Skickar nu med playerEmail och onPlayerEmailChange --- */}
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
          
          <ActionGrid actionCounts={actionCounts} onCountChange={setActionCounts} />
          
          <Card className="flex items-center justify-between p-4 border-cyan-500/20 bg-cyan-500/5">
            <div className="flex items-center">
              <Zap className="text-yellow-400 mr-3" size={24} />
              <div>
                <p className="text-sm font-bold text-white">Bonus Weighting</p>
                <p className="text-xs text-gray-400">Multiplier for bonus actions</p>
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
          />
        </div>
      </div>

      <PlayerHistoryModal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} players={players} />
      <TemplateEditorModal isOpen={showTemplateEditor} onClose={() => setShowTemplateEditor(false)} />
      <PlayerSelectModal isOpen={showPlayerSelect} onClose={() => setShowPlayerSelect(false)} onSelectPlayer={setSelectedPlayerName} onAddNewPlayer={() => { setSelectedPlayerName(''); setShowPlayerSelect(false); }} isPremium={isPremium} />
      
      <MobileBottomNav 
        onHistoryClick={() => setShowHistoryModal(true)}
        onPremiumClick={() => {/* Styrs nu via Layout */}}
        onRecordGame={handleSaveGame}
      />
    </div>
  );
}