import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePlayerData } from '../hooks/usePlayerData';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTemplates } from '../contexts/TemplateContext';

import LoginForm from '../components/auth/LoginForm';
import SignupForm from '../components/auth/SignupForm';
import PlayerForm from '../components/dashboard/PlayerForm';
import ActionGrid from '../components/dashboard/ActionGrid';
import SummarySection from '../components/dashboard/SummarySection';
import PlayerHistoryModal from '../components/modals/PlayerHistoryModal';
import SubscriptionModal from '../components/modals/SubscriptionModal';
import TemplateEditorModal from '../components/modals/TemplateEditorModal';
import PlayerSelectModal from '../components/modals/PlayerSelectModal';
import MobileBottomNav from '../components/layout/MobileBottomNav';
import Card from '../components/ui/Card';
import { BarChart3, Users, Target, TrendingUp } from 'lucide-react';

// Definiera interface för Player
interface Player {
  id: string;
  name: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const { currentTemplate, currentTemplateId } = useTemplates();
  const { getPlayers, getPlayerHistory, saveGame } = usePlayerData();

  // State för modaler och vyer
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [showPlayerSelect, setShowPlayerSelect] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  
  // State för data
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerName, setSelectedPlayerName] = useState<string>('');
  const [teamName, setTeamName] = useState<string>('');
  const [gameDate, setGameDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [bonusFactor, setBonusFactor] = useState<number>(10); 
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [actionCounts, setActionCounts] = useState<Record<string, number>>({});
  
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
        // Hämta spelare
        const fetchedPlayers = await getPlayers();
        
        if (isMounted) {
            // Spara spelare i state (VIKTIGT för modalen)
            setPlayers(fetchedPlayers as Player[]);

            // Välj första spelaren automatiskt om ingen är vald
            if (fetchedPlayers.length > 0 && !selectedPlayerName) {
                setSelectedPlayerName(fetchedPlayers[0].name);
            }
        }

        if (!isMounted) return;

        // Hämta statistik (matcher)
        const gamesPromises = fetchedPlayers.map(player => 
          getPlayerHistory(player.name, 1000)
        );

        const gamesResults = await Promise.all(gamesPromises);
        const allGames = gamesResults.flat();

        const totalMatches = allGames.length;
        const totalPoints = allGames.reduce((sum, game) => sum + (game.points || 0), 0);
        
        const avgPoints = totalMatches > 0 
          ? (totalPoints / totalMatches).toFixed(1) 
          : 0;

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        oneWeekAgo.setHours(0, 0, 0, 0);

        const recentGamesCount = allGames.filter(game => {
          const gameDate = new Date(game.date);
          return gameDate >= oneWeekAgo;
        }).length;

        if (isMounted) {
          setStats({
            players: fetchedPlayers.length,
            matches: totalMatches,
            avgPoints: Number(avgPoints),
            thisWeek: recentGamesCount
          });
        }

      } catch (error) {
        console.error("Kunde inte hämta dashboard-data:", error);
      }
    };

    fetchData();

    return () => { isMounted = false; };
  }, [user, getPlayers, getPlayerHistory, refreshTrigger]); 


  // --- 2. URL Hantering (Upgrade länk) ---
  useEffect(() => {
    if (searchParams.get('upgrade') === 'true') {
      setShowSubscriptionModal(true);
      searchParams.delete('upgrade');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);


  // --- 3. Spara Match Logik ---
  const handleSaveGame = async () => {
    if (!selectedPlayerName) {
      alert("Please select a player first");
      return;
    }

    if (Object.keys(actionCounts).length === 0) {
        alert("Register some actions first");
        return;
    }

    try {
        let totalPoints = 0;
        
        // Räkna ut poäng baserat på mallen
        if (currentTemplate) {
            Object.entries(actionCounts).forEach(([key, count]) => {
                let points = 1; 
                try {
                    const keyObj = JSON.parse(key);
                    const action = currentTemplate.actions.find(a => a.name.en === keyObj.en);
                    if (action) points = action.points;
                } catch {}
                totalPoints += count * points;
            });
        }

        const gameData = {
            date: gameDate,      
            team: teamName || 'My Team',
            points: totalPoints,
            softSkillCounts: {}
        };

        await saveGame(
            selectedPlayerName,
            gameData,
            currentTemplateId,
            actionCounts,
            bonusFactor        
          );

        // Nollställ och ladda om
        setActionCounts({});
        setRefreshTrigger(prev => prev + 1); 
        alert("Game saved!");

    } catch (error) {
        console.error("Failed to save game:", error);
        alert("Failed to save game. See console.");
    }
  };

  const handleReset = () => {
    if (window.confirm(t('resetAllWarning'))) {
      setActionCounts({});
    }
  };

  // --- 4. Visa Login/Signup om ej inloggad (VIKTIG FIX) ---
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          {showSignup ? (
            <SignupForm onSwitchToLogin={() => setShowSignup(false)} />
          ) : (
            <LoginForm
              onSwitchToSignup={() => setShowSignup(true)}
              onForgotPassword={() => console.log("Forgot password clicked")}
            />
          )}
        </Card>
      </div>
    );
  }

  // --- 5. Main Dashboard Render ---
  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Section */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-cyan-400 mb-2">
            Welcome back, {user.displayName || user.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-400">Track player performance with real-time analytics</p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="text-center p-4">
                <div className="flex items-center justify-center mb-2">
                    <Users className="text-cyan-400 mr-2" size={20} />
                    <h3 className="text-sm font-medium text-gray-300">Players</h3>
                </div>
                <p className="text-2xl font-bold text-white">{stats.players}</p>
            </Card>
            <Card className="text-center p-4">
                <div className="flex items-center justify-center mb-2">
                    <BarChart3 className="text-green-400 mr-2" size={20} />
                    <h3 className="text-sm font-medium text-gray-300">Matches</h3>
                </div>
                <p className="text-2xl font-bold text-white">{stats.matches}</p>
            </Card>
            <Card className="text-center p-4">
                <div className="flex items-center justify-center mb-2">
                    <Target className="text-yellow-400 mr-2" size={20} />
                    <h3 className="text-sm font-medium text-gray-300">Avg Points</h3>
                </div>
                <p className="text-2xl font-bold text-white">{stats.avgPoints}</p>
            </Card>
            <Card className="text-center p-4">
                <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="text-red-400 mr-2" size={20} />
                    <h3 className="text-sm font-medium text-gray-300">This Week</h3>
                </div>
                <p className="text-2xl font-bold text-white">{stats.thisWeek}</p>
            </Card>
        </div>

        {/* Input Forms & Grid */}
        <div className="space-y-6">
          <PlayerForm
            onShowHistory={() => setShowHistoryModal(true)}
            onEditTemplate={() => setShowTemplateEditor(true)}
            
            // Skicka ner state för att kontrollera formuläret
            selectedPlayerName={selectedPlayerName}
            onPlayerNameChange={setSelectedPlayerName} 
            teamName={teamName}
            onTeamNameChange={setTeamName}
            gameDate={gameDate}
            onGameDateChange={setGameDate}
            onOpenPlayerSelect={() => setShowPlayerSelect(true)}
          />
          
          <ActionGrid 
            actionCounts={actionCounts}
            onCountChange={setActionCounts}
          />
          
          <SummarySection
            actionCounts={actionCounts}
            onSaveGame={handleSaveGame}
            onReset={handleReset}
          />
        </div>
      </div>

      {/* Modals */}
      
      {/* VIKTIGT: Skicka med players-listan till historik-modalen */}
      <PlayerHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        players={players} 
      />

      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />
      
      <TemplateEditorModal
        isOpen={showTemplateEditor}
        onClose={() => setShowTemplateEditor(false)}
      />
      
      <PlayerSelectModal
        isOpen={showPlayerSelect}
        onClose={() => setShowPlayerSelect(false)}
        onSelectPlayer={(playerName) => {
          setSelectedPlayerName(playerName);
        }}
        onAddNewPlayer={() => {
          // Här kan du lägga till logik för att öppna en "Create Player"-modal om du vill
          // eller bara sätta fokus på namnfältet
          console.log('Add new player clicked');
          setSelectedPlayerName('');
        }}
      />

      <MobileBottomNav 
        onHistoryClick={() => setShowHistoryModal(true)}
        onPremiumClick={() => setShowSubscriptionModal(true)}
        onRecordGame={handleSaveGame}
      />
    </div>
  );
}